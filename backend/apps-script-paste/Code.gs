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
  'precio', 'duracion_dias', 'activo',
  // Nuevos campos opcionales (pueden quedar vacios en filas existentes):
  'precio_promocional', // numero o vacio; si esta, mostrar como precio tachado del original
  'etiqueta',           // 'Nuevo' | 'Premium' | 'Oferta' | 'Destacado' o vacio
  'orden'               // entero; menor = aparece primero. Vacio = va al final
];

const HEADERS_USUARIOS = [
  'id_usuario', 'nombre', 'correo', 'whatsapp', 'password_hash',
  'password_salt', 'fecha_registro', 'estado'
];

const HEADERS_COMPRAS = [
  'id_compra', 'id_usuario', 'id_plataforma', 'monto', 'metodo_pago',
  'fecha_solicitud', 'voucher_url', 'estado_pago', 'fecha_aprobacion',
  'fecha_inicio', 'fecha_fin', 'estado_acceso',
  // Metadata adicional como JSON string (segmentos de anatomia,
  // modulos de CTO, codigo de cupon, etc.). Vacio si no aplica.
  'detalle_extra'
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

  // Seed plataformas: idempotente, agrega solo las filas faltantes por id_plataforma.
  const plat = ss.getSheetByName(SHEET_NAMES.PLATAFORMAS);
  const cuantasNuevas = seedPlataformas(plat);
  const seeded = cuantasNuevas > 0;

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

/**
 * Idempotente: agrega solo las filas cuyo id_plataforma no exista ya.
 * Devuelve la cantidad de filas nuevas agregadas.
 *
 * Columnas: id_plataforma, nombre, slug, descripcion, url_real,
 *           precio, duracion_dias, activo,
 *           precio_promocional, etiqueta, orden
 */
function seedPlataformas(sheet) {
  const URL_DEMO = 'https://canazachyub.github.io/simulaencib/';
  const data = [
    // Las 6 originales
    ['P-001', 'ENAM', 'enam',
      'Examen Nacional de Medicina. Banco de preguntas con justificaciones y simulacros cronometrados.',
      URL_DEMO, 49, 30, true, '', 'Destacado', 1],
    ['P-002', 'ENCIB', 'encib',
      'Examen Nacional de Ciencias Basicas. Mas de 1500 preguntas explicadas, organizadas por curso.',
      URL_DEMO, 49, 30, true, '', '', 2],
    ['P-003', 'ENCAPS', 'encaps',
      'Evaluacion Nacional de Capacidades Clinicas. Casos clinicos con retroalimentacion detallada.',
      URL_DEMO, 49, 30, true, '', '', 3],
    ['P-004', 'Residentado Medico', 'rm',
      'Preparacion integral para el examen de residentado. Cobertura por especialidades.',
      URL_DEMO, 79, 30, true, '', 'Premium', 4],
    ['P-005', 'EsSalud', 'essalud',
      'Plataforma para concursos EsSalud y SERUMS. Material actualizado y simulacros.',
      URL_DEMO, 59, 30, true, '', '', 5],
    ['P-006', 'Biblioteca Medica', 'biblioteca',
      'Acceso a libros, guias clinicas y material complementario para tu carrera medica.',
      URL_DEMO, 39, 30, true, '', '', 6],

    // Nuevas: Anatomia (compra por segmento) y Coleccion CTO
    ['P-007', 'Anatomia de Testut', 'anatomia',
      'Resumenes teoricos basados en Testut. Material por segmentos anatomicos. Bancos UNAP y 5 simulacros por segmento. Formato fisico disponible.',
      URL_DEMO, 30, 30, true, '', 'Nuevo', 7],
    ['P-008', 'Coleccion CTO', 'cto',
      'Programa completo CTO, referente en Espana y Latinoamerica. Manuales, videos, casos y plataforma online.',
      URL_DEMO, 299, 365, true, 50, 'Premium', 8]
  ];

  // Leer IDs existentes para evitar duplicados.
  const existingIds = {};
  const lastRow = sheet.getLastRow();
  if (lastRow >= 2) {
    const vals = sheet.getRange(2, 1, lastRow - 1, 1).getValues();
    for (let i = 0; i < vals.length; i++) {
      existingIds[String(vals[i][0])] = true;
    }
  }

  const aAgregar = data.filter(function (row) {
    return !existingIds[String(row[0])];
  });

  if (aAgregar.length === 0) return 0;

  const startRow = sheet.getLastRow() + 1;
  sheet.getRange(startRow, 1, aAgregar.length, aAgregar[0].length).setValues(aAgregar);
  return aAgregar.length;
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

/**
 * Devuelve el numero de fila (1-indexed, considerando header) donde la columna
 * `columnIndex` (1-indexed) tiene el valor `value`. -1 si no se encuentra.
 */
function findRowIndex(sheetName, columnIndex, value) {
  const sheet = getSheet(sheetName);
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return -1;
  const values = sheet.getRange(2, columnIndex, lastRow - 1, 1).getValues();
  const target = String(value);
  for (let i = 0; i < values.length; i++) {
    if (String(values[i][0]) === target) return i + 2; // header en fila 1
  }
  return -1;
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
// ║                       AUTH & HELPERS                          ║
// ║  Sesiones, lookups, fechas                                    ║
// ╚═══════════════════════════════════════════════════════════════╝

const SESSION_TTL_SECONDS = 21600; // 6h (max de CacheService)

/** Crea una sesion para el usuario y devuelve el token. */
function createSession(usuario) {
  const token = randomToken(32);
  const payload = JSON.stringify({
    id_usuario: usuario.id_usuario,
    correo: usuario.correo,
    nombre: usuario.nombre,
    createdAt: new Date().toISOString()
  });
  CacheService.getScriptCache().put('session_' + token, payload, SESSION_TTL_SECONDS);
  return token;
}

/** Devuelve los datos de la sesion si el token es valido, null en caso contrario. */
function validateSession(token) {
  if (!token) return null;
  const raw = CacheService.getScriptCache().get('session_' + token);
  if (!raw) return null;
  try { return JSON.parse(raw); } catch (e) { return null; }
}

/** Lookup por id_plataforma en la hoja Plataformas. */
function findPlataformaById(id) {
  const all = readAll(SHEET_NAMES.PLATAFORMAS);
  for (let i = 0; i < all.length; i++) {
    if (String(all[i].id_plataforma) === String(id)) return all[i];
  }
  return null;
}

/** Lookup por slug en la hoja Plataformas. */
function findPlataformaBySlug(slug) {
  const all = readAll(SHEET_NAMES.PLATAFORMAS);
  for (let i = 0; i < all.length; i++) {
    if (String(all[i].slug) === String(slug)) return all[i];
  }
  return null;
}

/** Lookup por correo en la hoja Usuarios (case-insensitive). */
function findUsuarioByCorreo(correo) {
  const all = readAll(SHEET_NAMES.USUARIOS);
  const c = String(correo).toLowerCase();
  for (let i = 0; i < all.length; i++) {
    if (String(all[i].correo).toLowerCase() === c) return all[i];
  }
  return null;
}

/**
 * Convierte cualquier valor de fecha que venga de una celda de Sheets
 * (puede ser Date object, string ISO, o string Date.toString verbose)
 * a un string YYYY-MM-DD. Devuelve '' si no es parseable.
 */
function toIsoDate(value) {
  if (value === null || value === undefined || value === '') return '';
  if (value instanceof Date) {
    if (isNaN(value.getTime())) return '';
    const y = value.getFullYear();
    const m = String(value.getMonth() + 1);
    const d = String(value.getDate());
    return y + '-' + (m.length === 1 ? '0' + m : m) + '-' + (d.length === 1 ? '0' + d : d);
  }
  const s = String(value);
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0, 10);
  const parsed = new Date(s);
  if (isNaN(parsed.getTime())) return '';
  const y = parsed.getFullYear();
  const m = String(parsed.getMonth() + 1);
  const d = String(parsed.getDate());
  return y + '-' + (m.length === 1 ? '0' + m : m) + '-' + (d.length === 1 ? '0' + d : d);
}

/** Dias restantes hasta una fecha (puede ser negativo si ya paso). Acepta Date o string. */
function daysUntil(value) {
  const iso = toIsoDate(value);
  if (!iso) return null;
  const target = new Date(iso + 'T00:00:00');
  if (isNaN(target.getTime())) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const ms = target.getTime() - today.getTime();
  return Math.round(ms / (1000 * 60 * 60 * 24));
}

/** Verifica si un usuario tiene acceso activo a una plataforma dada. */
function hasActiveAccess(idUsuario, idPlataforma) {
  const compras = readAll(SHEET_NAMES.COMPRAS);
  const today = todayIso();
  for (let i = 0; i < compras.length; i++) {
    const c = compras[i];
    if (String(c.id_usuario) !== String(idUsuario)) continue;
    if (String(c.id_plataforma) !== String(idPlataforma)) continue;
    if (String(c.estado_pago) !== 'aprobado') continue;
    if (String(c.estado_acceso) !== 'activo') continue;
    const finIso = toIsoDate(c.fecha_fin);
    if (finIso && finIso < today) continue;
    return true;
  }
  return false;
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
        const promo = p.precio_promocional === undefined || p.precio_promocional === ''
          ? null
          : Number(p.precio_promocional);
        const orden = p.orden === undefined || p.orden === ''
          ? 9999
          : Number(p.orden);
        return {
          id_plataforma: String(p.id_plataforma),
          nombre: String(p.nombre),
          slug: String(p.slug),
          descripcion: String(p.descripcion),
          precio: Number(p.precio),
          duracion_dias: Number(p.duracion_dias),
          activo: true,
          precio_promocional: (promo !== null && !isNaN(promo)) ? promo : null,
          etiqueta: p.etiqueta ? String(p.etiqueta) : '',
          orden: isNaN(orden) ? 9999 : orden
        };
      });

    // Ordenar: primero por `orden` ascendente, luego por id_plataforma.
    safe.sort(function (a, b) {
      if (a.orden !== b.orden) return a.orden - b.orden;
      return a.id_plataforma < b.id_plataforma ? -1 : 1;
    });

    return ok(safe);
  } catch (err) {
    const detalle = err instanceof Error ? err.message : String(err);
    log({ accion: 'listarPlataformasPublicas', nivel: 'error', detalle: detalle });
    return fail('No se pudo leer plataformas', 'Intentalo en unos segundos.');
  }
}

// Stubs Fase 4 (admin)
function adminLogin(req)           { return ok(undefined, 'pendiente Fase 4'); }
function listarSolicitudes(req)    { return ok([],        'pendiente Fase 4'); }
function aprobarPago(req)          { return ok(undefined, 'pendiente Fase 4'); }
function rechazarPago(req)         { return ok(undefined, 'pendiente Fase 4'); }

// ─── Fase 2: registrar compra + subir voucher ────────────────

const METODOS_PAGO_VALIDOS = ['yape', 'transferencia', 'binance', 'whatsapp'];

/**
 * Registra una solicitud de compra. Crea el usuario si no existe.
 * Body esperado:
 *  { action, nombre, correo, whatsapp, id_plataforma, metodo_pago, monto, detalle_extra? }
 * Devuelve { id_compra, id_usuario }.
 */
function registrarCompra(req) {
  try {
    const nombre = String(req.nombre || '').trim();
    const correo = String(req.correo || '').trim().toLowerCase();
    const whatsapp = String(req.whatsapp || '').trim();
    const idPlataforma = String(req.id_plataforma || '').trim();
    const metodoPago = String(req.metodo_pago || '').trim().toLowerCase();
    const monto = Number(req.monto || 0);

    if (!isNonEmptyString(nombre) || nombre.length < 3) return fail('Nombre invalido');
    if (!isEmail(correo)) return fail('Correo invalido');
    if (!isWhatsapp(whatsapp)) return fail('WhatsApp invalido');
    if (!isNonEmptyString(idPlataforma)) return fail('Falta plataforma');
    if (METODOS_PAGO_VALIDOS.indexOf(metodoPago) === -1) return fail('Metodo de pago invalido');
    if (!isFinite(monto) || monto <= 0) return fail('Monto invalido');

    const plat = findPlataformaById(idPlataforma);
    if (!plat) return fail('Plataforma no encontrada');
    const activo = plat.activo === true || String(plat.activo).toLowerCase() === 'true';
    if (!activo) return fail('Plataforma no disponible');

    // Serializar detalle_extra (puede venir como objeto o string).
    let detalleExtra = '';
    if (req.detalle_extra !== undefined && req.detalle_extra !== null && req.detalle_extra !== '') {
      detalleExtra = (typeof req.detalle_extra === 'string')
        ? req.detalle_extra
        : JSON.stringify(req.detalle_extra);
    }

    // Find or create user
    const sheetUsuarios = getSheet(SHEET_NAMES.USUARIOS);
    const userExistente = findUsuarioByCorreo(correo);
    let userId;
    if (userExistente) {
      userId = String(userExistente.id_usuario);
    } else {
      userId = nextId('U', nextSequenceFromColumn(SHEET_NAMES.USUARIOS, 1));
      // Password se genera y envia en aprobarPago. Por ahora password_hash vacio.
      sheetUsuarios.appendRow([
        userId, nombre, correo, whatsapp,
        '', '',        // password_hash, password_salt
        nowIso(),      // fecha_registro
        'activo'
      ]);
    }

    // Crear compra (estado pendiente)
    const sheetCompras = getSheet(SHEET_NAMES.COMPRAS);
    const idCompra = nextId('C', nextSequenceFromColumn(SHEET_NAMES.COMPRAS, 1));
    sheetCompras.appendRow([
      idCompra, userId, idPlataforma, monto, metodoPago,
      nowIso(),       // fecha_solicitud
      '',             // voucher_url
      'pendiente',    // estado_pago
      '',             // fecha_aprobacion
      '',             // fecha_inicio
      '',             // fecha_fin
      'pendiente',    // estado_acceso
      detalleExtra    // detalle_extra
    ]);

    // Notificar admin por email
    try {
      const ssUrl = getSpreadsheet().getUrl();
      const detalleHtml = detalleExtra
        ? `<p><strong>Detalles:</strong> <code>${detalleExtra}</code></p>`
        : '';
      notificarAdmin(
        '[SINAPSIS EDU] Nueva compra ' + idCompra + ' - ' + plat.nombre,
        '<h2 style="color:#10312D">Nueva solicitud de compra</h2>' +
        '<p><strong>ID compra:</strong> ' + idCompra + '</p>' +
        '<p><strong>Alumno:</strong> ' + nombre + ' (' + correo + ', WhatsApp ' + whatsapp + ')</p>' +
        '<p><strong>Plataforma:</strong> ' + plat.nombre + ' (' + idPlataforma + ')</p>' +
        '<p><strong>Monto:</strong> S/ ' + monto.toFixed(2) + '</p>' +
        '<p><strong>Metodo:</strong> ' + metodoPago + '</p>' +
        detalleHtml +
        '<p>El alumno subira el voucher en los proximos minutos.</p>' +
        '<p><a href="' + ssUrl + '">Abrir Spreadsheet</a></p>'
      );
    } catch (e) {
      // El email es best-effort. No bloquear la compra si falla.
      log({ accion: 'notificarAdmin', nivel: 'warning', detalle: 'falla email: ' + e });
    }

    log({
      accion: 'registrarCompra',
      idUsuario: userId,
      nivel: 'info',
      detalle: idCompra + ' ' + plat.nombre + ' S/' + monto + ' ' + metodoPago
    });

    return ok({
      id_compra: idCompra,
      id_usuario: userId,
      message: 'Solicitud registrada. Ahora sube tu voucher.'
    });
  } catch (err) {
    const detalle = err instanceof Error ? err.message : String(err);
    log({ accion: 'registrarCompra', nivel: 'error', detalle: detalle });
    return fail('Error interno', 'No se pudo registrar tu compra. Intenta de nuevo.');
  }
}

/**
 * Sube voucher a Drive y actualiza la fila de Compras con la URL.
 * Body esperado:
 *  { action, id_compra, archivo_base64, tipo (mime), nombre (filename) }
 */
function subirVoucher(req) {
  try {
    const idCompra = String(req.id_compra || '').trim();
    const archivoBase64 = String(req.archivo_base64 || '');
    const mime = String(req.tipo || req.mime || '').trim();
    const filename = String(req.nombre || req.filename || 'voucher.png').trim();

    if (!isNonEmptyString(idCompra)) return fail('Falta id_compra');
    if (!isNonEmptyString(archivoBase64)) return fail('Falta archivo');

    const v = validateVoucher(mime, archivoBase64);
    if (!v.ok) return fail(v.error);

    const rowIndex = findRowIndex(SHEET_NAMES.COMPRAS, 1, idCompra);
    if (rowIndex < 0) return fail('Compra no encontrada');

    // Subir a Drive
    const safeName = idCompra + '_' + Date.now() + '_' + filename.replace(/[^a-zA-Z0-9._-]/g, '_');
    const subida = subirVoucherDrive(archivoBase64, mime, safeName);

    // Actualizar columna voucher_url (columna 7 en HEADERS_COMPRAS)
    const sheetCompras = getSheet(SHEET_NAMES.COMPRAS);
    sheetCompras.getRange(rowIndex, 7).setValue(subida.fileUrl);

    // Leer la compra completa para el email
    let monto = '';
    let plataforma = '';
    let alumnoCorreo = '';
    try {
      const all = readAll(SHEET_NAMES.COMPRAS);
      const compra = null;
      for (let i = 0; i < all.length; i++) {
        if (String(all[i].id_compra) === idCompra) {
          monto = String(all[i].monto);
          const plat = findPlataformaById(String(all[i].id_plataforma));
          plataforma = plat ? String(plat.nombre) : String(all[i].id_plataforma);
          const usuarios = readAll(SHEET_NAMES.USUARIOS);
          for (let j = 0; j < usuarios.length; j++) {
            if (String(usuarios[j].id_usuario) === String(all[i].id_usuario)) {
              alumnoCorreo = String(usuarios[j].correo);
              break;
            }
          }
          break;
        }
      }
    } catch (_) { /* email best-effort */ }

    try {
      notificarAdmin(
        '[SINAPSIS EDU] Voucher subido: ' + idCompra,
        '<h2 style="color:#10312D">Voucher recibido</h2>' +
        '<p><strong>Compra:</strong> ' + idCompra + '</p>' +
        '<p><strong>Plataforma:</strong> ' + plataforma + '</p>' +
        '<p><strong>Monto:</strong> S/ ' + monto + '</p>' +
        '<p><strong>Alumno:</strong> ' + alumnoCorreo + '</p>' +
        '<p><a href="' + subida.fileUrl + '">Ver voucher en Drive</a></p>' +
        '<p>Revisa y aprueba desde el panel admin.</p>'
      );
    } catch (e) {
      log({ accion: 'notificarAdmin', nivel: 'warning', detalle: 'falla email voucher: ' + e });
    }

    log({ accion: 'subirVoucher', nivel: 'info', detalle: idCompra + ' ' + safeName });

    return ok({ message: 'Voucher recibido. Te avisaremos por correo cuando aprobemos.' });
  } catch (err) {
    const detalle = err instanceof Error ? err.message : String(err);
    log({ accion: 'subirVoucher', nivel: 'error', detalle: detalle });
    return fail('Error interno', 'No se pudo subir el voucher. Intenta de nuevo o envialo por WhatsApp.');
  }
}

// ─── Fase 5: login alumno + accesos + url plataforma ─────────

function loginAlumno(req) {
  try {
    const correo = String(req.correo || '').trim();
    const password = String(req.password || '');
    if (!isEmail(correo)) return fail('Correo invalido');
    if (!isNonEmptyString(password)) return fail('Falta la contrasena');

    const user = findUsuarioByCorreo(correo);
    if (!user) {
      log({ accion: 'loginAlumno', nivel: 'warning', detalle: 'correo no existe: ' + correo });
      return fail('Credenciales invalidas');
    }
    if (String(user.estado) !== 'activo') {
      log({ accion: 'loginAlumno', idUsuario: String(user.id_usuario), nivel: 'warning', detalle: 'cuenta no activa' });
      return fail('Cuenta bloqueada. Contacta soporte.');
    }
    const salt = String(user.password_salt || '');
    const hash = String(user.password_hash || '');
    if (!salt || !hash) {
      log({ accion: 'loginAlumno', idUsuario: String(user.id_usuario), nivel: 'error', detalle: 'usuario sin credenciales' });
      return fail('Cuenta sin contrasena configurada. Contacta soporte.');
    }
    if (hashPassword(password, salt) !== hash) {
      log({ accion: 'loginAlumno', idUsuario: String(user.id_usuario), nivel: 'warning', detalle: 'password incorrecta' });
      return fail('Credenciales invalidas');
    }

    const token = createSession({
      id_usuario: String(user.id_usuario),
      correo: String(user.correo),
      nombre: String(user.nombre)
    });

    log({ accion: 'loginAlumno', idUsuario: String(user.id_usuario), nivel: 'info', detalle: 'login OK' });
    return ok({
      token: token,
      usuario: { nombre: String(user.nombre), correo: String(user.correo) }
    });
  } catch (err) {
    const detalle = err instanceof Error ? err.message : String(err);
    log({ accion: 'loginAlumno', nivel: 'error', detalle: detalle });
    return fail('Error interno', 'No se pudo procesar el login');
  }
}

function misAccesos(req) {
  const session = validateSession(req.token);
  if (!session) return fail('Sesion invalida o expirada');

  try {
    const today = todayIso();
    const compras = readAll(SHEET_NAMES.COMPRAS);
    const accesos = compras
      .filter(function (c) {
        if (String(c.id_usuario) !== String(session.id_usuario)) return false;
        if (String(c.estado_pago) !== 'aprobado') return false;
        if (String(c.estado_acceso) !== 'activo') return false;
        const finIso = toIsoDate(c.fecha_fin);
        return !finIso || finIso >= today;
      })
      .map(function (c) {
        const plat = findPlataformaById(String(c.id_plataforma));
        return {
          id_acceso: String(c.id_compra),
          id_plataforma: String(c.id_plataforma),
          plataforma: plat ? String(plat.nombre) : '',
          slug: plat ? String(plat.slug) : '',
          fecha_inicio: toIsoDate(c.fecha_inicio),
          fecha_fin: toIsoDate(c.fecha_fin),
          dias_restantes: daysUntil(c.fecha_fin)
        };
      });

    return ok(accesos);
  } catch (err) {
    const detalle = err instanceof Error ? err.message : String(err);
    log({ accion: 'misAccesos', idUsuario: String(session.id_usuario), nivel: 'error', detalle: detalle });
    return fail('No se pudieron obtener los accesos');
  }
}

function obtenerUrlPlataforma(req) {
  const session = validateSession(req.token);
  if (!session) return fail('Sesion invalida o expirada');

  const slug = String(req.slug || '').trim();
  if (!slug) return fail('Falta el slug');

  const plat = findPlataformaBySlug(slug);
  if (!plat) return fail('Plataforma no encontrada');

  if (!hasActiveAccess(String(session.id_usuario), String(plat.id_plataforma))) {
    log({
      accion: 'obtenerUrlPlataforma',
      idUsuario: String(session.id_usuario),
      nivel: 'warning',
      detalle: 'intento de acceso sin permiso: ' + slug
    });
    return fail('No tienes acceso activo a esta plataforma');
  }

  log({ accion: 'obtenerUrlPlataforma', idUsuario: String(session.id_usuario), nivel: 'info', detalle: slug });
  return ok({ url: String(plat.url_real) });
}

// ─── Crear usuario de prueba (correr desde editor) ───────────

/**
 * Crea un usuario de prueba con tus credenciales + 2 compras activas.
 * Idempotente: si ya existe el usuario, no lo duplica; si ya tiene las
 * compras, tampoco las agrega.
 *
 * Credenciales por defecto: canazach12@gmail.com / Test1234
 */
function createTestUser() {
  const correo = 'canazach12@gmail.com';
  const password = 'Test1234';
  const nombre = 'Yubert Canaza (Test)';

  const sheetUsuarios = getSheet(SHEET_NAMES.USUARIOS);
  const sheetCompras = getSheet(SHEET_NAMES.COMPRAS);

  // 1. Usuario
  const existing = findUsuarioByCorreo(correo);
  let userId;
  let userCreated = false;
  if (existing) {
    userId = String(existing.id_usuario);
  } else {
    userId = nextId('U', nextSequenceFromColumn(SHEET_NAMES.USUARIOS, 1));
    const salt = generateSalt();
    const hash = hashPassword(password, salt);
    sheetUsuarios.appendRow([
      userId,
      nombre,
      correo,
      '51984300510',
      hash,
      salt,
      nowIso(),
      'activo'
    ]);
    userCreated = true;
  }

  // 2. Compras de prueba (idempotentes por id_usuario + id_plataforma + activo)
  const compras = readAll(SHEET_NAMES.COMPRAS);
  function yaTieneActiva(idPlat) {
    for (let i = 0; i < compras.length; i++) {
      if (String(compras[i].id_usuario) === userId
        && String(compras[i].id_plataforma) === idPlat
        && String(compras[i].estado_acceso) === 'activo') return true;
    }
    return false;
  }

  const created = [];

  // ENCIB: comprada hoy, vence en 30 dias
  if (!yaTieneActiva('P-002')) {
    const id = nextId('C', nextSequenceFromColumn(SHEET_NAMES.COMPRAS, 1));
    sheetCompras.appendRow([
      id, userId, 'P-002', 49, 'yape',
      addDaysIso(0), '',
      'aprobado', addDaysIso(0), addDaysIso(0), addDaysIso(30),
      'activo'
    ]);
    created.push(id + ' = ENCIB (vence en 30 dias)');
    compras.push({ id_compra: id, id_usuario: userId, id_plataforma: 'P-002', estado_acceso: 'activo' });
  }

  // ENAM: comprada hace 25 dias, vence en 5 dias (probar warning de "vence pronto")
  if (!yaTieneActiva('P-001')) {
    const id = nextId('C', nextSequenceFromColumn(SHEET_NAMES.COMPRAS, 1));
    sheetCompras.appendRow([
      id, userId, 'P-001', 49, 'yape',
      addDaysIso(-25), '',
      'aprobado', addDaysIso(-25), addDaysIso(-25), addDaysIso(5),
      'activo'
    ]);
    created.push(id + ' = ENAM (vence en 5 dias)');
  }

  log({
    accion: 'createTestUser',
    idUsuario: userId,
    nivel: 'info',
    detalle: 'correo=' + correo + ' user_nuevo=' + userCreated + ' compras_nuevas=[' + created.join(';') + ']'
  });

  return {
    ok: true,
    usuario: {
      id_usuario: userId,
      correo: correo,
      password: password,
      nombre: nombre,
      creado_ahora: userCreated
    },
    accesos_creados: created,
    note: 'Idempotente. Para resetear, borra las filas manualmente en las hojas Usuarios y Compras.'
  };
}

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
