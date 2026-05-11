/**
 * ╔════════════════════════════════════════════════════════════════╗
 * ║  PORTAL CENTRAL — Backend Apps Script                          ║
 * ║  Pega este archivo COMPLETO dentro de Code.gs en el editor.    ║
 * ║                                                                ║
 * ║  Orden interno: utils → services → api → main.                 ║
 * ║  Apps Script V8 (ES2019) — todo en scope global.               ║
 * ╚════════════════════════════════════════════════════════════════╝
 */

// ╔═══════════════════════════════════════════════════════════════╗
// ║  CONFIGURACION PRE-CARGADA                                    ║
// ║  Lo que pones aqui se aplica la PRIMERA vez que corre setup().║
// ║  Despues vive en Script Properties; cambiarlo aqui no afecta. ║
// ╚═══════════════════════════════════════════════════════════════╝

/** Spreadsheet existente que vamos a usar como base de datos.
 *  Si lo dejas vacio '', setup() crea uno nuevo desde cero. */
const PRECONFIGURED_SHEET_ID = '1LQf-scklnpMCejgRQH2O6hHcdCBszjHh4ex5AeyEpvo';

/** Carpeta Drive donde guardar vouchers. Si vacio '', setup() crea una.
 *  URL: https://drive.google.com/drive/folders/18KTajQWvgFJpvbzdchQJPf6elclJ4j-4 */
const PRECONFIGURED_DRIVE_FOLDER = '18KTajQWvgFJpvbzdchQJPf6elclJ4j-4';

/** WhatsApp para pago manual (sin +, codigo de pais incluido). */
const PRECONFIGURED_WHATSAPP = '51984300510';


// ╔═══════════════════════════════════════════════════════════════╗
// ║                          UTILS                                ║
// ╚═══════════════════════════════════════════════════════════════╝

function ok(data, message) {
  const res = { ok: true };
  if (data !== undefined) res.data = data;
  if (message) res.message = message;
  return res;
}

function fail(error, message) {
  const res = { ok: false, error: error };
  if (message) res.message = message;
  return res;
}

const RE_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const RE_WHATSAPP = /^\+?\d{8,15}$/;
const VOUCHER_TYPES_OK = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
const VOUCHER_MAX_BYTES = 5 * 1024 * 1024;

function isEmail(value) {
  return typeof value === 'string' && RE_EMAIL.test(value);
}

function isWhatsapp(value) {
  return typeof value === 'string' && RE_WHATSAPP.test(value.replace(/\s|-/g, ''));
}

function isNonEmptyString(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

function validateVoucher(mime, base64) {
  if (VOUCHER_TYPES_OK.indexOf(mime) === -1) {
    return { ok: false, error: 'Tipo de archivo no permitido. Solo jpg, png o pdf.' };
  }
  const bytes = Math.floor((base64.length * 3) / 4);
  if (bytes > VOUCHER_MAX_BYTES) {
    return { ok: false, error: 'El archivo supera 5MB.' };
  }
  return { ok: true };
}

function nextId(prefix, lastNumber) {
  const n = (lastNumber + 1).toString();
  const padded = n.length >= 3 ? n : ('000' + n).slice(-3);
  return prefix + '-' + padded;
}

function randomToken(length) {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let out = '';
  for (let i = 0; i < length; i++) {
    out += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return out;
}

function hashPassword(password, salt) {
  const bytes = Utilities.computeDigest(
    Utilities.DigestAlgorithm.SHA_256,
    password + salt,
    Utilities.Charset.UTF_8
  );
  let hex = '';
  for (let i = 0; i < bytes.length; i++) {
    const b = bytes[i] < 0 ? bytes[i] + 256 : bytes[i];
    const v = b.toString(16);
    hex += v.length === 1 ? '0' + v : v;
  }
  return hex;
}

function generateSalt() {
  return randomToken(16);
}

function nowIso() {
  return new Date().toISOString();
}

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function addDaysIso(daysFromToday) {
  const d = new Date();
  d.setDate(d.getDate() + daysFromToday);
  return d.toISOString().slice(0, 10);
}


// ╔═══════════════════════════════════════════════════════════════╗
// ║                        SERVICES                               ║
// ║  Sheets, Drive, Gmail, Properties, Logs, setup()              ║
// ╚═══════════════════════════════════════════════════════════════╝

const SHEET_NAMES = {
  PLATAFORMAS: 'Plataformas',
  USUARIOS: 'Usuarios',
  COMPRAS: 'Compras',
  LOGS: 'Logs',
};

const HEADERS_PLATAFORMAS = [
  'id_plataforma', 'nombre', 'slug', 'descripcion', 'url_real',
  'precio', 'duracion_dias', 'activo'
];

const HEADERS_USUARIOS = [
  'id_usuario', 'nombre', 'correo', 'whatsapp', 'password_hash',
  'password_salt', 'fecha_registro', 'estado'
];

const HEADERS_COMPRAS = [
  'id_compra', 'id_usuario', 'id_plataforma', 'monto', 'metodo_pago',
  'fecha_solicitud', 'voucher_url', 'estado_pago', 'fecha_aprobacion',
  'fecha_inicio', 'fecha_fin', 'estado_acceso'
];

const HEADERS_LOGS = ['timestamp', 'accion', 'id_usuario', 'nivel', 'detalle'];

const REQUIRED_PROPS = [
  'SHEET_ID', 'DRIVE_FOLDER_VOUCHERS', 'ADMIN_EMAIL',
  'NOTIFICACION_EMAIL', 'SESSION_SECRET', 'WHATSAPP_NUMBER'
];

// ─── Properties ──────────────────────────────────────────────

function getProperty(key) {
  const v = PropertiesService.getScriptProperties().getProperty(key);
  return v === null ? undefined : v;
}

function setProperty(key, value) {
  PropertiesService.getScriptProperties().setProperty(key, value);
}

function getRequired(key) {
  const v = getProperty(key);
  if (!v) throw new Error('Falta la Property requerida: ' + key + '. Corre setup() primero.');
  return v;
}

function checkRequiredProperties() {
  const missing = [];
  for (let i = 0; i < REQUIRED_PROPS.length; i++) {
    if (!getProperty(REQUIRED_PROPS[i])) missing.push(REQUIRED_PROPS[i]);
  }
  return missing;
}

// ─── Sheets ──────────────────────────────────────────────────

/**
 * Devuelve el Spreadsheet a usar. Orden de preferencia:
 *   1. Container-bound: el script vive dentro de un Sheet
 *      (Extensiones > Apps Script desde el Sheet) → getActiveSpreadsheet().
 *      Esta es la forma normal de trabajar en este proyecto.
 *   2. SHEET_ID en Script Properties (re-runs de setup o standalone).
 *   3. PRECONFIGURED_SHEET_ID hardcoded arriba en este archivo.
 *   4. Si nada existe, lanza error pidiendo correr setup().
 */
function getSpreadsheet() {
  // 1) Container-bound (modo normal): no requiere permisos de Drive externos
  try {
    const active = SpreadsheetApp.getActiveSpreadsheet();
    if (active) return active;
  } catch (e) { /* no es bound, seguir */ }

  // 2) ID en Properties
  const propId = getProperty('SHEET_ID');
  if (propId) {
    try { return SpreadsheetApp.openById(propId); }
    catch (e) { /* ID invalido, seguir */ }
  }

  // 3) ID preconfigurado
  if (PRECONFIGURED_SHEET_ID) {
    try { return SpreadsheetApp.openById(PRECONFIGURED_SHEET_ID); }
    catch (e) { /* ID invalido, seguir */ }
  }

  throw new Error('No hay Spreadsheet asociado. Corre setup() desde el editor.');
}

function getSheet(name) {
  const ss = getSpreadsheet();
  const sheet = ss.getSheetByName(name);
  if (!sheet) throw new Error('Hoja no encontrada: ' + name + '. Corre setup() primero.');
  return sheet;
}

function ensureSheet(ss, name, headers) {
  let sheet = ss.getSheetByName(name);
  let created = false;
  if (!sheet) {
    sheet = ss.insertSheet(name);
    created = true;
  }
  const range = sheet.getRange(1, 1, 1, headers.length);
  range.setValues([headers.slice()]);
  range.setFontWeight('bold');
  range.setBackground('#10312D');
  range.setFontColor('#C2E476');
  sheet.setFrozenRows(1);
  return { sheet: sheet, created: created };
}

function inicializarSheets() {
  const ss = getSpreadsheet();

  const r1 = ensureSheet(ss, SHEET_NAMES.PLATAFORMAS, HEADERS_PLATAFORMAS);
  const r2 = ensureSheet(ss, SHEET_NAMES.USUARIOS, HEADERS_USUARIOS);
  const r3 = ensureSheet(ss, SHEET_NAMES.COMPRAS, HEADERS_COMPRAS);
  const r4 = ensureSheet(ss, SHEET_NAMES.LOGS, HEADERS_LOGS);

  // Borra la hoja por defecto si quedo vacia
  const candidatos = ['Sheet1', 'Hoja 1', 'Hoja1'];
  for (let i = 0; i < candidatos.length; i++) {
    const def = ss.getSheetByName(candidatos[i]);
    if (def && ss.getSheets().length > 1) {
      const lastRow = def.getLastRow();
      const lastCol = def.getLastColumn();
      if (lastRow === 0 || (lastRow <= 1 && lastCol <= 1)) {
        try { ss.deleteSheet(def); } catch (e) { /* ignorar */ }
      }
    }
  }

  // Seed plataformas si la hoja esta vacia (solo headers)
  let seeded = false;
  const plat = ss.getSheetByName(SHEET_NAMES.PLATAFORMAS);
  if (plat.getLastRow() <= 1) {
    seedPlataformas(plat);
    seeded = true;
  }

  return {
    spreadsheetId: ss.getId(),
    spreadsheetUrl: ss.getUrl(),
    sheets: [
      { name: SHEET_NAMES.PLATAFORMAS, created: r1.created },
      { name: SHEET_NAMES.USUARIOS, created: r2.created },
      { name: SHEET_NAMES.COMPRAS, created: r3.created },
      { name: SHEET_NAMES.LOGS, created: r4.created }
    ],
    seeded: seeded
  };
}

function seedPlataformas(sheet) {
  // Para el MVP de prueba, todas las plataformas apuntan al mismo URL (ver CLAUDE.md §1).
  const URL_DEMO = 'https://canazachyub.github.io/simulaencib/';
  const data = [
    ['P-001', 'ENAM', 'enam',
      'Examen Nacional de Medicina. Banco de preguntas con justificaciones y simulacros cronometrados.',
      URL_DEMO, 49, 30, true],
    ['P-002', 'ENCIB', 'encib',
      'Examen Nacional de Ciencias Basicas. Mas de 1500 preguntas explicadas, organizadas por curso.',
      URL_DEMO, 49, 30, true],
    ['P-003', 'ENCAPS', 'encaps',
      'Evaluacion Nacional de Capacidades Clinicas. Casos clinicos con retroalimentacion detallada.',
      URL_DEMO, 49, 30, true],
    ['P-004', 'Residentado Medico', 'rm',
      'Preparacion integral para el examen de residentado. Cobertura por especialidades.',
      URL_DEMO, 79, 30, true],
    ['P-005', 'EsSalud', 'essalud',
      'Plataforma para concursos EsSalud y SERUMS. Material actualizado y simulacros.',
      URL_DEMO, 59, 30, true],
    ['P-006', 'Biblioteca Medica', 'biblioteca',
      'Acceso a libros, guias clinicas y material complementario para tu carrera medica.',
      URL_DEMO, 39, 30, true]
  ];
  sheet.getRange(2, 1, data.length, data[0].length).setValues(data);
}

function readAll(sheetName) {
  const sheet = getSheet(sheetName);
  const lastRow = sheet.getLastRow();
  const lastCol = sheet.getLastColumn();
  if (lastRow < 2) return [];
  const values = sheet.getRange(1, 1, lastRow, lastCol).getValues();
  const headers = values[0];
  const rows = [];
  for (let i = 1; i < values.length; i++) {
    const row = values[i];
    const obj = {};
    for (let j = 0; j < headers.length; j++) {
      obj[String(headers[j])] = row[j];
    }
    rows.push(obj);
  }
  return rows;
}

function nextSequenceFromColumn(sheetName, columnIndex) {
  const sheet = getSheet(sheetName);
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return 0;
  const values = sheet.getRange(2, columnIndex, lastRow - 1, 1).getValues();
  let max = 0;
  for (let i = 0; i < values.length; i++) {
    const id = String(values[i][0] || '');
    const m = id.match(/-(\d+)$/);
    if (m) {
      const n = parseInt(m[1], 10);
      if (!isNaN(n) && n > max) max = n;
    }
  }
  return max;
}

// ─── Drive ───────────────────────────────────────────────────

function getCarpetaVouchers() {
  return DriveApp.getFolderById(getRequired('DRIVE_FOLDER_VOUCHERS'));
}

function subirVoucherDrive(base64, mime, filename) {
  const blob = Utilities.newBlob(Utilities.base64Decode(base64), mime, filename);
  const folder = getCarpetaVouchers();
  const file = folder.createFile(blob);
  try {
    file.setSharing(DriveApp.Access.PRIVATE, DriveApp.Permission.NONE);
  } catch (e) { /* algunos workspaces lo restringen por politica */ }
  return { fileId: file.getId(), fileUrl: file.getUrl() };
}

// ─── Gmail ───────────────────────────────────────────────────

function notificarAdmin(asunto, cuerpoHtml) {
  const to = getProperty('NOTIFICACION_EMAIL') || getProperty('ADMIN_EMAIL');
  if (!to) {
    Logger.log('notificarAdmin: sin destinatario configurado. Asunto: ' + asunto);
    return;
  }
  MailApp.sendEmail({ to: to, subject: asunto, htmlBody: cuerpoHtml });
}

function enviarCorreo(to, asunto, cuerpoHtml) {
  MailApp.sendEmail({ to: to, subject: asunto, htmlBody: cuerpoHtml });
}

// ─── Logs ────────────────────────────────────────────────────

function log(ctx) {
  try {
    const ss = getSpreadsheet();
    const sheet = ss.getSheetByName(SHEET_NAMES.LOGS);
    if (!sheet) {
      Logger.log('[log] hoja Logs no existe | ' + JSON.stringify(ctx));
      return;
    }
    sheet.appendRow([
      new Date().toISOString(),
      ctx.accion,
      ctx.idUsuario || '',
      ctx.nivel || 'info',
      ctx.detalle || ''
    ]);
  } catch (err) {
    Logger.log('[log fallido] ' + err + ' | ' + JSON.stringify(ctx));
  }
}

// ─── setup() — instalador idempotente ────────────────────────

/**
 * Instala todo lo necesario en una sola corrida desde el editor:
 *   1. Crea (o reutiliza) el Spreadsheet PortalCentral_DB.
 *   2. Crea (o reutiliza) la carpeta de Drive para vouchers.
 *   3. Inicializa las 4 hojas con headers y siembra Plataformas.
 *   4. Genera SESSION_SECRET aleatorio si falta.
 *   5. Configura ADMIN_EMAIL/NOTIFICACION_EMAIL con el correo activo.
 *   6. Defaults: WHATSAPP_NUMBER=51984300510, RATE_LIMIT_PER_HOUR=10.
 *
 * Es idempotente: correr setup() varias veces no duplica nada.
 */
function setup() {
  const props = PropertiesService.getScriptProperties();
  const added = [];
  const existing = [];

  // 1. Spreadsheet — orden de preferencia:
  //    a) Container-bound: usa el Sheet padre (modo normal).
  //    b) SHEET_ID ya en Properties (re-runs de setup).
  //    c) PRECONFIGURED_SHEET_ID hardcoded arriba.
  //    d) Crea uno nuevo (ultimo recurso).
  let spreadsheet;
  let sheetId;
  let sheetCreated = false;
  let sheetSource = 'desconocido';

  // (a) Container-bound
  try {
    const bound = SpreadsheetApp.getActiveSpreadsheet();
    if (bound) {
      spreadsheet = bound;
      sheetId = bound.getId();
      sheetSource = 'container-bound';
    }
  } catch (e) { /* no es bound */ }

  // (b) Property existente
  if (!spreadsheet) {
    const propId = props.getProperty('SHEET_ID');
    if (propId) {
      try {
        spreadsheet = SpreadsheetApp.openById(propId);
        sheetId = propId;
        sheetSource = 'property';
      } catch (e) { /* ID en property invalido, seguir */ }
    }
  }

  // (c) ID preconfigurado en codigo
  if (!spreadsheet && PRECONFIGURED_SHEET_ID) {
    try {
      spreadsheet = SpreadsheetApp.openById(PRECONFIGURED_SHEET_ID);
      sheetId = PRECONFIGURED_SHEET_ID;
      sheetSource = 'preconfigured';
    } catch (e) { /* PRECONFIGURED_SHEET_ID invalido, seguir */ }
  }

  // (d) Crear uno nuevo
  if (!spreadsheet) {
    spreadsheet = SpreadsheetApp.create('PortalCentral_DB');
    sheetId = spreadsheet.getId();
    sheetCreated = true;
    sheetSource = 'created';
  }

  // Persistir el ID en Properties para que log() y otras llamadas lo conozcan
  if (props.getProperty('SHEET_ID') !== sheetId) {
    props.setProperty('SHEET_ID', sheetId);
    added.push('SHEET_ID (' + sheetSource + ')');
  } else {
    existing.push('SHEET_ID');
  }

  // 2. Drive folder
  let folderId = props.getProperty('DRIVE_FOLDER_VOUCHERS');
  let folderCreated = false;
  let folder;
  if (!folderId && PRECONFIGURED_DRIVE_FOLDER) {
    folderId = PRECONFIGURED_DRIVE_FOLDER;
    folder = DriveApp.getFolderById(folderId);
    props.setProperty('DRIVE_FOLDER_VOUCHERS', folderId);
    added.push('DRIVE_FOLDER_VOUCHERS (preconfigured)');
  } else if (!folderId) {
    folder = DriveApp.createFolder('PortalCentral_Vouchers');
    folderId = folder.getId();
    props.setProperty('DRIVE_FOLDER_VOUCHERS', folderId);
    added.push('DRIVE_FOLDER_VOUCHERS');
    folderCreated = true;
  } else {
    folder = DriveApp.getFolderById(folderId);
    existing.push('DRIVE_FOLDER_VOUCHERS');
  }

  // 3. Emails (default = correo del usuario activo)
  let userEmail = '';
  try {
    userEmail = Session.getActiveUser().getEmail() || '';
  } catch (e) { /* sin permiso */ }

  if (!props.getProperty('ADMIN_EMAIL') && userEmail) {
    props.setProperty('ADMIN_EMAIL', userEmail);
    added.push('ADMIN_EMAIL');
  } else if (props.getProperty('ADMIN_EMAIL')) {
    existing.push('ADMIN_EMAIL');
  }

  if (!props.getProperty('NOTIFICACION_EMAIL') && userEmail) {
    props.setProperty('NOTIFICACION_EMAIL', userEmail);
    added.push('NOTIFICACION_EMAIL');
  } else if (props.getProperty('NOTIFICACION_EMAIL')) {
    existing.push('NOTIFICACION_EMAIL');
  }

  // 4. Session secret
  if (!props.getProperty('SESSION_SECRET')) {
    props.setProperty('SESSION_SECRET', randomToken(64));
    added.push('SESSION_SECRET');
  } else {
    existing.push('SESSION_SECRET');
  }

  // 5. Defaults
  if (!props.getProperty('WHATSAPP_NUMBER')) {
    props.setProperty('WHATSAPP_NUMBER', PRECONFIGURED_WHATSAPP || '51984300510');
    added.push('WHATSAPP_NUMBER');
  } else {
    existing.push('WHATSAPP_NUMBER');
  }
  if (!props.getProperty('RATE_LIMIT_PER_HOUR')) {
    props.setProperty('RATE_LIMIT_PER_HOUR', '10');
    added.push('RATE_LIMIT_PER_HOUR');
  } else {
    existing.push('RATE_LIMIT_PER_HOUR');
  }

  // 6. Sheets + seed
  const init = inicializarSheets();

  // 7. Audit log
  log({
    accion: 'setup',
    nivel: 'info',
    detalle: 'sheetCreated=' + sheetCreated +
             ' folderCreated=' + folderCreated +
             ' seeded=' + init.seeded +
             ' added=[' + added.join(',') + ']'
  });

  return {
    ok: true,
    spreadsheet: { id: sheetId, url: spreadsheet.getUrl(), created: sheetCreated },
    driveFolder: { id: folderId, url: folder.getUrl(), created: folderCreated },
    sheets: init.sheets,
    seeded: init.seeded,
    properties: { added: added, existing: existing },
    next: 'Despliega el Web App: Implementar > Nueva implementacion > Tipo: Aplicacion web.'
  };
}

// ─── Integraciones futuras (Fase 7+) ─────────────────────────

function extraerDatosVoucherOCR(base64, mime) {
  if (!getProperty('OPENAI_API_KEY') && !getProperty('GEMINI_API_KEY')) return null;
  return null;
}

function verificarPagoBinanceAuto(idCompra) {
  if (!getProperty('BINANCE_API_KEY') || !getProperty('BINANCE_API_SECRET')) return null;
  return null;
}


// ╔═══════════════════════════════════════════════════════════════╗
// ║                            API                                ║
// ║  Handlers publicos y de admin + dispatcher                    ║
// ╚═══════════════════════════════════════════════════════════════╝

function ping() {
  const missing = checkRequiredProperties();
  const isOk = missing.length === 0;
  let sheetUrl;
  if (isOk) {
    try { sheetUrl = getSpreadsheet().getUrl(); } catch (e) { /* ignorar */ }
  }
  return ok(
    {
      status: isOk ? 'online' : 'setup-pending',
      timestamp: new Date().toISOString(),
      properties: { ok: isOk, missing: missing },
      sheetUrl: sheetUrl
    },
    isOk ? 'Portal Central backend OK' : 'Backend respondiendo. Falta correr setup().'
  );
}

function listarPlataformasPublicas(req) {
  try {
    const all = readAll(SHEET_NAMES.PLATAFORMAS);
    // Nunca devolvemos url_real al cliente publico (regla §2.2 de CLAUDE.md).
    const safe = all
      .filter(function (p) {
        return p.activo === true || String(p.activo).toLowerCase() === 'true';
      })
      .map(function (p) {
        return {
          id_plataforma: String(p.id_plataforma),
          nombre: String(p.nombre),
          slug: String(p.slug),
          descripcion: String(p.descripcion),
          precio: Number(p.precio),
          duracion_dias: Number(p.duracion_dias),
          activo: true
        };
      });
    return ok(safe);
  } catch (err) {
    const detalle = err instanceof Error ? err.message : String(err);
    log({ accion: 'listarPlataformasPublicas', nivel: 'error', detalle: detalle });
    return fail('No se pudo leer plataformas', 'Intentalo en unos segundos.');
  }
}

// Stubs Fase 2/4/5
function registrarCompra(req)      { return ok(undefined, 'pendiente Fase 2'); }
function subirVoucher(req)         { return ok(undefined, 'pendiente Fase 2'); }
function loginAlumno(req)          { return ok(undefined, 'pendiente Fase 5'); }
function misAccesos(req)           { return ok([],        'pendiente Fase 5'); }
function obtenerUrlPlataforma(req) { return ok(undefined, 'pendiente Fase 5'); }
function adminLogin(req)           { return ok(undefined, 'pendiente Fase 4'); }
function listarSolicitudes(req)    { return ok([],        'pendiente Fase 4'); }
function aprobarPago(req)          { return ok(undefined, 'pendiente Fase 4'); }
function rechazarPago(req)         { return ok(undefined, 'pendiente Fase 4'); }

function dispatchPublic(req) {
  const action = String(req.action);
  switch (action) {
    case 'ping':                     return ping();
    case 'listarPlataformasPublicas':return listarPlataformasPublicas(req);
    case 'registrarCompra':          return registrarCompra(req);
    case 'subirVoucher':             return subirVoucher(req);
    case 'loginAlumno':              return loginAlumno(req);
    case 'misAccesos':               return misAccesos(req);
    case 'obtenerUrlPlataforma':     return obtenerUrlPlataforma(req);
    default:                         return fail('Accion desconocida: ' + action);
  }
}

function dispatchAdmin(req) {
  const action = String(req.action);
  switch (action) {
    case 'adminLogin':         return adminLogin(req);
    case 'listarSolicitudes':  return listarSolicitudes(req);
    case 'aprobarPago':        return aprobarPago(req);
    case 'rechazarPago':       return rechazarPago(req);
    default:                   return fail('Accion admin desconocida: ' + action);
  }
}


// ╔═══════════════════════════════════════════════════════════════╗
// ║                           MAIN                                ║
// ║  doGet / doPost / healthcheck                                 ║
// ╚═══════════════════════════════════════════════════════════════╝

function doGet(e) {
  const params = (e && e.parameter) ? e.parameter : {};

  if (params.ping === '1') {
    return jsonResponse(ping());
  }

  if (params.page === 'admin') {
    return HtmlService.createTemplateFromFile('views/admin')
      .evaluate()
      .setTitle('Portal Central — Admin')
      .addMetaTag('viewport', 'width=device-width, initial-scale=1');
  }

  return jsonResponse({
    ok: true,
    message: 'Portal Central backend. Usa POST con {"action":"ping"} para JSON, ' +
             '?ping=1 via GET, o ?page=admin para el panel.'
  });
}

function doPost(e) {
  let req;
  try {
    const raw = (e && e.postData && e.postData.contents) ? e.postData.contents : '{}';
    req = JSON.parse(raw);
  } catch (err) {
    return jsonResponse(fail('JSON invalido en el body'));
  }

  if (!req || !req.action) {
    return jsonResponse(fail('Falta el campo "action"'));
  }

  try {
    const fullAction = String(req.action);
    const isAdmin = fullAction.indexOf('admin.') === 0;
    const action = isAdmin ? fullAction.substring('admin.'.length) : fullAction;
    const innerReq = Object.assign({}, req, { action: action });
    const response = isAdmin ? dispatchAdmin(innerReq) : dispatchPublic(innerReq);
    return jsonResponse(response);
  } catch (err) {
    const detalle = err instanceof Error ? err.message : String(err);
    log({ accion: String(req.action), nivel: 'error', detalle: detalle });
    return jsonResponse(fail('Error interno', 'Ocurrio un problema. Intenta de nuevo.'));
  }
}

function jsonResponse(payload) {
  return ContentService.createTextOutput(JSON.stringify(payload)).setMimeType(
    ContentService.MimeType.JSON
  );
}

function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

/**
 * Verifica el estado del backend sin tocar nada.
 * Util para correr desde el editor tras un deploy.
 */
function healthcheck() {
  const missing = checkRequiredProperties();
  const result = { ok: missing.length === 0, missingProperties: missing };

  const sheetId = getProperty('SHEET_ID');
  if (sheetId) {
    try {
      const ss = SpreadsheetApp.openById(sheetId);
      result.spreadsheet = { id: sheetId, url: ss.getUrl() };
    } catch (e) { /* IDs corruptos */ }
  }

  const folderId = getProperty('DRIVE_FOLDER_VOUCHERS');
  if (folderId) {
    try {
      const folder = DriveApp.getFolderById(folderId);
      result.driveFolder = { id: folderId, url: folder.getUrl() };
    } catch (e) { /* IDs corruptos */ }
  }

  return result;
}
