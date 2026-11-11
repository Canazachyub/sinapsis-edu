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

function ok_(data, message) {
  const res = { ok: true };
  if (data !== undefined) res.data = data;
  if (message) res.message = message;
  return res;
}

function fail_(error, message) {
  const res = { ok: false, error: error };
  if (message) res.message = message;
  return res;
}

const RE_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const RE_WHATSAPP = /^\+?\d{8,15}$/;
const VOUCHER_TYPES_OK = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
const VOUCHER_MAX_BYTES = 5 * 1024 * 1024;

function isEmail_(value) {
  return typeof value === 'string' && RE_EMAIL.test(value);
}

function isWhatsapp_(value) {
  return typeof value === 'string' && RE_WHATSAPP.test(value.replace(/\s|-/g, ''));
}

function isNonEmptyString_(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

function validateVoucher_(mime, base64) {
  if (VOUCHER_TYPES_OK.indexOf(mime) === -1) {
    return { ok: false, error: 'Tipo de archivo no permitido. Solo jpg, png o pdf.' };
  }
  const bytes = Math.floor((base64.length * 3) / 4);
  if (bytes > VOUCHER_MAX_BYTES) {
    return { ok: false, error: 'El archivo supera 5MB.' };
  }
  return { ok: true };
}

function nextId_(prefix, lastNumber) {
  const n = (lastNumber + 1).toString();
  const padded = n.length >= 3 ? n : ('000' + n).slice(-3);
  return prefix + '-' + padded;
}

function randomToken_(length) {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  // CSPRNG: Utilities.getUuid() usa java.security.SecureRandom por debajo.
  // Concatenamos UUIDs sin guiones hasta tener 2 hex chars (1 byte) por
  // caracter de salida, y mapeamos cada byte al charset alfanumerico.
  let hex = '';
  while (hex.length < length * 2) {
    hex += Utilities.getUuid().replace(/-/g, '');
  }
  let out = '';
  for (let i = 0; i < length; i++) {
    const byte = parseInt(hex.substr(i * 2, 2), 16);
    out += chars.charAt(byte % chars.length);
  }
  return out;
}

/** Escapa & < > " ' para interpolar valores de origen usuario en htmlBody. */
function escapeHtml_(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Rate limit real por bucket usando CacheService (TTL 1 hora).
 * Limite = Property RATE_LIMIT_PER_HOUR (default 10).
 * Devuelve true si el bucket YA excedio el limite (bloquear request).
 * Fail-open: si CacheService falla, no bloquea.
 */
function checkRateLimit_(bucketKey) {
  try {
    const cache = CacheService.getScriptCache();
    const limit = Number(getProperty_('RATE_LIMIT_PER_HOUR')) || 10;
    const current = Number(cache.get(bucketKey)) || 0;
    if (current >= limit) return true;
    cache.put(bucketKey, String(current + 1), 3600);
    return false;
  } catch (e) {
    return false;
  }
}

function hashPassword_(password, salt) {
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

function generateSalt_() {
  return randomToken_(16);
}

function nowIso_() {
  return new Date().toISOString();
}

function todayIso_() {
  return new Date().toISOString().slice(0, 10);
}

function addDaysIso_(daysFromToday) {
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
  CREDENCIALES: 'Credenciales',
};

const HEADERS_PLATAFORMAS = [
  'id_plataforma', 'nombre', 'slug', 'descripcion', 'url_real',
  'precio', 'duracion_dias', 'activo',
  // Campos opcionales (pueden quedar vacios en filas existentes):
  'precio_promocional', // numero o vacio; si esta, mostrar como precio tachado del original
  'etiqueta',           // 'Nuevo' | 'Premium' | 'Oferta' | 'Destacado' o vacio
  'orden',              // entero; menor = aparece primero. Vacio = va al final
  'url_sheet_plataforma' // URL del Google Sheet propio de la plataforma donde el admin copia las credenciales
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

const HEADERS_CREDENCIALES = [
  'id_compra', 'id_usuario', 'correo', 'plataforma', 'contrasena_enviada', 'fecha_asignacion'
];

const REQUIRED_PROPS = [
  'SHEET_ID', 'DRIVE_FOLDER_VOUCHERS', 'ADMIN_EMAIL',
  'NOTIFICACION_EMAIL', 'SESSION_SECRET', 'WHATSAPP_NUMBER'
];

// ─── Properties ──────────────────────────────────────────────

function getProperty_(key) {
  const v = PropertiesService.getScriptProperties().getProperty(key);
  return v === null ? undefined : v;
}

function setProperty_(key, value) {
  PropertiesService.getScriptProperties().setProperty(key, value);
}

function getRequired_(key) {
  const v = getProperty_(key);
  if (!v) throw new Error('Falta la Property requerida: ' + key + '. Corre setup() primero.');
  return v;
}

function checkRequiredProperties_() {
  const missing = [];
  for (let i = 0; i < REQUIRED_PROPS.length; i++) {
    if (!getProperty_(REQUIRED_PROPS[i])) missing.push(REQUIRED_PROPS[i]);
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
function getSpreadsheet_() {
  // 1) Container-bound (modo normal): no requiere permisos de Drive externos
  try {
    const active = SpreadsheetApp.getActiveSpreadsheet();
    if (active) return active;
  } catch (e) { /* no es bound, seguir */ }

  // 2) ID en Properties
  const propId = getProperty_('SHEET_ID');
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

function getSheet_(name) {
  const ss = getSpreadsheet_();
  const sheet = ss.getSheetByName(name);
  if (!sheet) throw new Error('Hoja no encontrada: ' + name + '. Corre setup() primero.');
  return sheet;
}

function ensureSheet_(ss, name, headers) {
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

function inicializarSheets_() {
  const ss = getSpreadsheet_();

  const r1 = ensureSheet_(ss, SHEET_NAMES.PLATAFORMAS, HEADERS_PLATAFORMAS);
  const r2 = ensureSheet_(ss, SHEET_NAMES.USUARIOS, HEADERS_USUARIOS);
  const r3 = ensureSheet_(ss, SHEET_NAMES.COMPRAS, HEADERS_COMPRAS);
  const r4 = ensureSheet_(ss, SHEET_NAMES.LOGS, HEADERS_LOGS);
  const r5 = ensureSheet_(ss, SHEET_NAMES.CREDENCIALES, HEADERS_CREDENCIALES);

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
  const cuantasNuevas = seedPlataformas_(plat);
  const seeded = cuantasNuevas > 0;

  return {
    spreadsheetId: ss.getId(),
    spreadsheetUrl: ss.getUrl(),
    sheets: [
      { name: SHEET_NAMES.PLATAFORMAS, created: r1.created },
      { name: SHEET_NAMES.USUARIOS, created: r2.created },
      { name: SHEET_NAMES.COMPRAS, created: r3.created },
      { name: SHEET_NAMES.LOGS, created: r4.created },
      { name: SHEET_NAMES.CREDENCIALES, created: r5.created }
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
function seedPlataformas_(sheet) {
  const URL_DEMO = 'https://canazachyub.github.io/simulaencib/';
  const data = [
    // Las 6 originales
    // Cols: id_plataforma, nombre, slug, descripcion, url_real,
    //       precio, duracion_dias, activo, precio_promocional, etiqueta, orden, url_sheet_plataforma
    ['P-001', 'ENAM', 'enam',
      'Examen Nacional de Medicina. Banco de preguntas con justificaciones y simulacros cronometrados.',
      URL_DEMO, 49, 30, true, '', 'Destacado', 1, ''],
    ['P-002', 'ENCIB', 'encib',
      'Examen Nacional de Ciencias Basicas. Mas de 1500 preguntas explicadas, organizadas por curso.',
      URL_DEMO, 49, 30, true, '', '', 2, ''],
    ['P-003', 'ENCAPS', 'encaps',
      'Evaluacion Nacional de Capacidades Clinicas. Casos clinicos con retroalimentacion detallada.',
      URL_DEMO, 49, 30, true, '', '', 3, ''],
    ['P-004', 'Residentado Medico', 'rm',
      'Preparacion integral para el examen de residentado. Cobertura por especialidades.',
      URL_DEMO, 79, 30, true, '', 'Premium', 4, ''],
    ['P-005', 'EsSalud', 'essalud',
      'Plataforma para concursos EsSalud y SERUMS. Material actualizado y simulacros.',
      URL_DEMO, 59, 30, true, '', '', 5, ''],
    ['P-006', 'Biblioteca Medica', 'biblioteca',
      'Acceso a libros, guias clinicas y material complementario para tu carrera medica.',
      URL_DEMO, 39, 30, true, '', '', 6, ''],

    // Nuevas: Anatomia (compra por segmento) y Coleccion CTO
    ['P-007', 'Anatomia de Testut', 'anatomia',
      'Resumenes teoricos basados en Testut. Material por segmentos anatomicos. Bancos UNAP y 5 simulacros por segmento. Formato fisico disponible.',
      URL_DEMO, 30, 30, true, '', 'Nuevo', 7, ''],
    ['P-008', 'Coleccion CTO', 'cto',
      'Programa completo CTO, referente en Espana y Latinoamerica. Manuales, videos, casos y plataforma online.',
      URL_DEMO, 299, 365, true, 50, 'Premium', 8, '']
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

function readAll_(sheetName) {
  const sheet = getSheet_(sheetName);
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

function nextSequenceFromColumn_(sheetName, columnIndex) {
  const sheet = getSheet_(sheetName);
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
function findRowIndex_(sheetName, columnIndex, value) {
  const sheet = getSheet_(sheetName);
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

function getCarpetaVouchers_() {
  return DriveApp.getFolderById(getRequired_('DRIVE_FOLDER_VOUCHERS'));
}

function subirVoucherDrive_(base64, mime, filename) {
  const blob = Utilities.newBlob(Utilities.base64Decode(base64), mime, filename);
  const folder = getCarpetaVouchers_();
  const file = folder.createFile(blob);
  try {
    file.setSharing(DriveApp.Access.PRIVATE, DriveApp.Permission.NONE);
  } catch (e) { /* algunos workspaces lo restringen por politica */ }
  return { fileId: file.getId(), fileUrl: file.getUrl() };
}

// ─── Gmail ───────────────────────────────────────────────────

function notificarAdmin_(asunto, cuerpoHtml) {
  const to = getProperty_('NOTIFICACION_EMAIL') || getProperty_('ADMIN_EMAIL');
  if (!to) {
    Logger.log('notificarAdmin: sin destinatario configurado. Asunto: ' + asunto);
    return;
  }
  MailApp.sendEmail({ to: to, subject: asunto, htmlBody: cuerpoHtml });
}

function enviarCorreo_(to, asunto, cuerpoHtml) {
  MailApp.sendEmail({ to: to, subject: asunto, htmlBody: cuerpoHtml });
}

// ─── Logs ────────────────────────────────────────────────────

function log_(ctx) {
  try {
    const ss = getSpreadsheet_();
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

// ─── Guard: herramientas que solo deben correrse desde el editor ─────

/**
 * Lanza error si la llamada NO viene del dueño del script desde el editor.
 * Desde el editor, el usuario activo es el dueño (= usuario efectivo).
 * Un visitante del Web App que intente llamar la función con
 * google.script.run llega con usuario activo vacío o distinto, y se bloquea.
 */
function requireEditor_() {
  let activo = '';
  let efectivo = '';
  try { activo = Session.getActiveUser().getEmail() || ''; } catch (e) { /* sin identidad */ }
  try { efectivo = Session.getEffectiveUser().getEmail() || ''; } catch (e) { /* sin identidad */ }
  if (!activo || !efectivo || activo.toLowerCase() !== efectivo.toLowerCase()) {
    throw new Error('Esta función solo puede ejecutarse desde el editor de Apps Script.');
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
  requireEditor_();
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

  // Persistir el ID en Properties para que log_() y otras llamadas lo conozcan
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
    props.setProperty('SESSION_SECRET', randomToken_(64));
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
  const init = inicializarSheets_();

  // 7. Audit log
  log_({
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

function extraerDatosVoucherOCR_(base64, mime) {
  if (!getProperty_('OPENAI_API_KEY') && !getProperty_('GEMINI_API_KEY')) return null;
  return null;
}

function verificarPagoBinanceAuto_(idCompra) {
  if (!getProperty_('BINANCE_API_KEY') || !getProperty_('BINANCE_API_SECRET')) return null;
  return null;
}


// ╔═══════════════════════════════════════════════════════════════╗
// ║                       AUTH & HELPERS                          ║
// ║  Sesiones, lookups, fechas                                    ║
// ╚═══════════════════════════════════════════════════════════════╝

const SESSION_TTL_SECONDS = 21600; // 6h (max de CacheService)

/** Crea una sesion para el usuario y devuelve el token. */
function createSession_(usuario) {
  const token = randomToken_(32);
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
function validateSession_(token) {
  if (!token) return null;
  const raw = CacheService.getScriptCache().get('session_' + token);
  if (!raw) return null;
  try { return JSON.parse(raw); } catch (e) { return null; }
}

/** Lookup por id_plataforma en la hoja Plataformas. */
function findPlataformaById_(id) {
  const all = readAll_(SHEET_NAMES.PLATAFORMAS);
  for (let i = 0; i < all.length; i++) {
    if (String(all[i].id_plataforma) === String(id)) return all[i];
  }
  return null;
}

/** Lookup por slug en la hoja Plataformas. */
function findPlataformaBySlug_(slug) {
  const all = readAll_(SHEET_NAMES.PLATAFORMAS);
  for (let i = 0; i < all.length; i++) {
    if (String(all[i].slug) === String(slug)) return all[i];
  }
  return null;
}

/** Lookup por correo en la hoja Usuarios (case-insensitive). */
function findUsuarioByCorreo_(correo) {
  const all = readAll_(SHEET_NAMES.USUARIOS);
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
function toIsoDate_(value) {
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
function daysUntil_(value) {
  const iso = toIsoDate_(value);
  if (!iso) return null;
  const target = new Date(iso + 'T00:00:00');
  if (isNaN(target.getTime())) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const ms = target.getTime() - today.getTime();
  return Math.round(ms / (1000 * 60 * 60 * 24));
}

/** Verifica si un usuario tiene acceso activo a una plataforma dada. */
function hasActiveAccess_(idUsuario, idPlataforma) {
  const compras = readAll_(SHEET_NAMES.COMPRAS);
  const today = todayIso_();
  for (let i = 0; i < compras.length; i++) {
    const c = compras[i];
    if (String(c.id_usuario) !== String(idUsuario)) continue;
    if (String(c.id_plataforma) !== String(idPlataforma)) continue;
    if (String(c.estado_pago) !== 'aprobado') continue;
    if (String(c.estado_acceso) !== 'activo') continue;
    const finIso = toIsoDate_(c.fecha_fin);
    if (finIso && finIso < today) continue;
    return true;
  }
  return false;
}


// ╔═══════════════════════════════════════════════════════════════╗
// ║                            API                                ║
// ║  Handlers publicos y de admin + dispatcher                    ║
// ╚═══════════════════════════════════════════════════════════════╝

function ping_() {
  const missing = checkRequiredProperties_();
  const isOk = missing.length === 0;
  // Seguridad: endpoint público. No exponer la URL de la hoja ni los nombres de propiedades faltantes.
  return ok_(
    {
      status: isOk ? 'online' : 'setup-pending',
      timestamp: new Date().toISOString()
    },
    isOk ? 'Portal Central backend OK' : 'Backend respondiendo. Falta correr setup().'
  );
}

function listarPlataformasPublicas_(req) {
  try {
    const all = readAll_(SHEET_NAMES.PLATAFORMAS);
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

    return ok_(safe);
  } catch (err) {
    const detalle = err instanceof Error ? err.message : String(err);
    log_({ accion: 'listarPlataformasPublicas', nivel: 'error', detalle: detalle });
    return fail_('No se pudo leer plataformas', 'Intentalo en unos segundos.');
  }
}

// ─── Admin: sesión ───────────────────────────────────────────

const ADMIN_SESSION_TTL = 21600; // 6h (tope de CacheService)

function validateAdminSession_(token) {
  if (!token) return false;
  return CacheService.getScriptCache().get('admin_sess_' + token) === '1';
}

function requireAdmin_(req) {
  if (!validateAdminSession_(req.adminToken)) {
    throw new Error('Sesión admin inválida o expirada. Inicia sesión de nuevo.');
  }
}

// ─── Admin: handlers ─────────────────────────────────────────

function adminLogin_(req) {
  try {
    if (checkRateLimit_('rl_admin_login')) {
      log_({ accion: 'adminLogin', nivel: 'warning', detalle: 'rate limit de login admin excedido' });
      return fail_('Demasiados intentos. Espera unos minutos.');
    }
    const password = String(req.password || '').trim();
    if (!isNonEmptyString_(password)) return fail_('Falta la contraseña');

    const storedHash = getProperty_('ADMIN_PASSWORD_HASH');
    const storedSalt = getProperty_('ADMIN_PASSWORD_SALT');
    const legacyPass = getProperty_('ADMIN_PASSWORD');

    let valid = false;
    if (storedHash && storedSalt) {
      valid = hashPassword_(password, storedSalt) === storedHash;
    } else if (legacyPass) {
      valid = password === legacyPass;
      if (valid) {
        // Migracion en caliente: texto plano legado → hash+salt, sin reconfigurar nada.
        const salt = generateSalt_();
        setProperty_('ADMIN_PASSWORD_HASH', hashPassword_(password, salt));
        setProperty_('ADMIN_PASSWORD_SALT', salt);
        PropertiesService.getScriptProperties().deleteProperty('ADMIN_PASSWORD');
        log_({ accion: 'adminLogin', nivel: 'info', detalle: 'ADMIN_PASSWORD migrado a hash+salt' });
      }
    } else {
      return fail_('ADMIN_PASSWORD no configurado. Agrégalo en Configuración del Proyecto → Propiedades del script.');
    }
    if (!valid) {
      log_({ accion: 'adminLogin', nivel: 'warning', detalle: 'contraseña admin incorrecta' });
      return fail_('Credenciales incorrectas');
    }

    const token = randomToken_(32);
    CacheService.getScriptCache().put('admin_sess_' + token, '1', ADMIN_SESSION_TTL);
    log_({ accion: 'adminLogin', nivel: 'info', detalle: 'login admin OK' });
    return ok_({ token: token });
  } catch (err) {
    return fail_('Error interno: ' + (err instanceof Error ? err.message : String(err)));
  }
}

/**
 * EDITOR-ONLY: rota la contraseña admin desde el editor de Apps Script.
 * Uso: setAdminPassword('MiNuevaClave'). Genera salt+hash, los guarda en
 * Properties y borra cualquier ADMIN_PASSWORD en texto plano.
 * No se expone en ningún dispatcher.
 */
function setAdminPassword(plain) {
  requireEditor_();
  const password = String(plain || '').trim();
  if (!password) return { ok: false, error: 'Contraseña vacía' };
  const salt = generateSalt_();
  setProperty_('ADMIN_PASSWORD_HASH', hashPassword_(password, salt));
  setProperty_('ADMIN_PASSWORD_SALT', salt);
  PropertiesService.getScriptProperties().deleteProperty('ADMIN_PASSWORD');
  log_({ accion: 'setAdminPassword', nivel: 'info', detalle: 'contraseña admin rotada desde el editor' });
  return { ok: true };
}

function listarSolicitudes_(req) {
  try {
    requireAdmin_(req);
    const estado = String(req.estado || 'pendiente');
    const compras = readAll_(SHEET_NAMES.COMPRAS);
    const usuarios = readAll_(SHEET_NAMES.USUARIOS);
    const plataformas = readAll_(SHEET_NAMES.PLATAFORMAS);

    const userMap = {};
    for (let i = 0; i < usuarios.length; i++) {
      userMap[String(usuarios[i].id_usuario)] = usuarios[i];
    }
    const platMap = {};
    for (let i = 0; i < plataformas.length; i++) {
      platMap[String(plataformas[i].id_plataforma)] = plataformas[i];
    }

    let filtered = compras;
    if (estado !== 'todos') {
      filtered = compras.filter(function (c) {
        return String(c.estado_pago) === estado;
      });
    }

    const result = filtered.map(function (c) {
      const u = userMap[String(c.id_usuario)] || {};
      const p = platMap[String(c.id_plataforma)] || {};
      return {
        id_compra: String(c.id_compra),
        id_usuario: String(c.id_usuario),
        nombre: String(u.nombre || ''),
        correo: String(u.correo || ''),
        whatsapp: String(u.whatsapp || ''),
        plataforma: String(p.nombre || c.id_plataforma),
        slug: String(p.slug || ''),
        monto: Number(c.monto) || 0,
        metodo_pago: String(c.metodo_pago || ''),
        fecha_solicitud: String(c.fecha_solicitud ? toIsoDate_(c.fecha_solicitud) || String(c.fecha_solicitud) : ''),
        voucher_url: String(c.voucher_url || ''),
        estado_pago: String(c.estado_pago || ''),
        estado_acceso: String(c.estado_acceso || ''),
        fecha_fin: toIsoDate_(c.fecha_fin) || '',
        detalle_extra: String(c.detalle_extra || ''),
        tiene_password: !!(u.password_hash && String(u.password_hash).trim().length > 0),
        url_sheet_plataforma: p.url_sheet_plataforma ? String(p.url_sheet_plataforma) : '',
        // Para el panel: comparar monto vs precio y mostrar la vigencia antes de aprobar.
        precio_esperado: (function () {
          const promo = (p.precio_promocional === undefined || p.precio_promocional === '') ? NaN : Number(p.precio_promocional);
          return (!isNaN(promo) && promo > 0) ? promo : (Number(p.precio) || 0);
        })(),
        duracion_dias: Number(p.duracion_dias) || 30
      };
    });

    result.sort(function (a, b) {
      return a.fecha_solicitud < b.fecha_solicitud ? 1 : -1;
    });

    return ok_(result);
  } catch (err) {
    const detalle = err instanceof Error ? err.message : String(err);
    log_({ accion: 'listarSolicitudes', nivel: 'error', detalle: detalle });
    return fail_('Error al listar solicitudes: ' + detalle);
  }
}

function aprobarPago_(req) {
  try {
    requireAdmin_(req);
    const idCompra = String(req.id_compra || '').trim();
    if (!isNonEmptyString_(idCompra)) return fail_('Falta id_compra');

    const compraRow = findRowIndex_(SHEET_NAMES.COMPRAS, 1, idCompra);
    if (compraRow < 0) return fail_('Compra no encontrada: ' + idCompra);

    const compras = readAll_(SHEET_NAMES.COMPRAS);
    let compra = null;
    for (let i = 0; i < compras.length; i++) {
      if (String(compras[i].id_compra) === idCompra) { compra = compras[i]; break; }
    }
    if (!compra) return fail_('Compra no encontrada');
    if (String(compra.estado_pago) === 'aprobado') return fail_('Esta compra ya fue aprobada');

    const usuarios = readAll_(SHEET_NAMES.USUARIOS);
    let usuario = null;
    for (let i = 0; i < usuarios.length; i++) {
      if (String(usuarios[i].id_usuario) === String(compra.id_usuario)) { usuario = usuarios[i]; break; }
    }
    if (!usuario) return fail_('Usuario no encontrado');

    const sheetUsuarios = getSheet_(SHEET_NAMES.USUARIOS);
    const sheetCompras = getSheet_(SHEET_NAMES.COMPRAS);

    // Generar password solo si el usuario aún no tiene uno
    let plainPassword = null;
    if (!usuario.password_hash || String(usuario.password_hash).trim() === '') {
      plainPassword = randomToken_(10);
      const salt = generateSalt_();
      const hash = hashPassword_(plainPassword, salt);
      const userRow = findRowIndex_(SHEET_NAMES.USUARIOS, 1, String(compra.id_usuario));
      if (userRow > 0) {
        sheetUsuarios.getRange(userRow, 5).setValue(hash);
        sheetUsuarios.getRange(userRow, 6).setValue(salt);
      }
    }

    const plat = findPlataformaById_(String(compra.id_plataforma));
    const duracion = plat ? (Number(plat.duracion_dias) || 30) : 30;
    const hoy = todayIso_();
    const fechaFin = addDaysIso_(duracion);

    // Cols: estado_pago=8, fecha_aprobacion=9, fecha_inicio=10, fecha_fin=11, estado_acceso=12
    sheetCompras.getRange(compraRow, 8).setValue('aprobado');
    sheetCompras.getRange(compraRow, 9).setValue(hoy);
    sheetCompras.getRange(compraRow, 10).setValue(hoy);
    sheetCompras.getRange(compraRow, 11).setValue(fechaFin);
    sheetCompras.getRange(compraRow, 12).setValue('activo');

    // Email al alumno
    try {
      const portalUrl = 'https://sinapsisedu.com/#/login';
      const platNombre = plat ? String(plat.nombre) : String(compra.id_plataforma);
      const correo = String(usuario.correo);
      const nombre = String(usuario.nombre);

      let emailBody =
        '<div style="font-family:Inter,system-ui,sans-serif;max-width:520px;margin:auto;background:#F3F1E8;padding:32px;border-radius:16px">' +
        '<h2 style="color:#10312D;margin:0 0 16px">¡Tu acceso fue aprobado! ✅</h2>' +
        '<p>Hola <strong>' + escapeHtml_(nombre) + '</strong>,</p>' +
        '<p>Tu pago para <strong>' + escapeHtml_(platNombre) + '</strong> fue verificado. Ya puedes acceder.</p>' +
        '<hr style="border:none;border-top:1px solid rgba(16,49,45,.1);margin:20px 0">' +
        '<p><strong>📧 Correo:</strong> <code style="background:#fff;padding:2px 6px;border-radius:4px">' + escapeHtml_(correo) + '</code></p>';
      if (plainPassword) {
        emailBody += '<p><strong>🔑 Contraseña:</strong> <code style="background:#fff;padding:2px 6px;border-radius:4px">' + plainPassword + '</code></p>' +
          '<p style="font-size:13px;color:#3D5752"><em>Guarda esta contraseña. No se la volveremos a enviar.</em></p>';
      } else {
        emailBody += '<p><strong>🔑 Contraseña:</strong> la que ya tenías registrada.</p>';
      }
      emailBody +=
        '<p><strong>📅 Vigencia:</strong> hasta el <strong>' + fechaFin + '</strong> (' + duracion + ' días)</p>' +
        '<div style="margin:28px 0">' +
        '<a href="' + portalUrl + '" style="background:#10312D;color:#C2E476;padding:14px 28px;border-radius:10px;text-decoration:none;font-weight:700;font-size:15px">Entrar al Portal →</a>' +
        '</div>' +
        '<p style="font-size:12px;color:#3D5752">¿Problemas? WhatsApp: <a href="https://wa.me/51984300510">+51 984 300 510</a></p>' +
        '</div>';

      enviarCorreo_(correo, '✅ Acceso aprobado — ' + platNombre + ' | SINAPSIS EDU', emailBody);
    } catch (emailErr) {
      log_({ accion: 'aprobarPago', nivel: 'warning', detalle: 'falla email alumno: ' + emailErr });
    }

    // Registrar en hoja Credenciales (plainPassword o nota si ya tenía contraseña)
    try {
      const sheetCred = getSheet_(SHEET_NAMES.CREDENCIALES);
      const platNombreLog = plat ? String(plat.nombre) : String(compra.id_plataforma);
      sheetCred.appendRow([
        idCompra,
        String(compra.id_usuario),
        String(usuario.correo),
        platNombreLog,
        // Seguridad: NO guardamos la contraseña en texto plano. Solo dejamos
        // constancia de que se envió por correo. Si el alumno la pierde, usa
        // "¿Olvidaste tu contraseña?" (recuperarPassword) para regenerarla.
        plainPassword ? '(enviada por correo)' : '(contraseña existente, no se regeneró)',
        hoy
      ]);
    } catch (credErr) {
      log_({ accion: 'aprobarPago', nivel: 'warning', detalle: 'falla al escribir Credenciales: ' + credErr });
    }

    log_({
      accion: 'aprobarPago', nivel: 'info',
      detalle: idCompra + ' aprobado password_generado=' + !!plainPassword
    });

    return ok_({
      id_compra: idCompra,
      correo: String(usuario.correo),
      fecha_fin: fechaFin,
      password_generado: !!plainPassword
    }, 'Pago aprobado. ' + (plainPassword ? 'Credenciales enviadas al alumno.' : 'Confirmación enviada al alumno.'));
  } catch (err) {
    const detalle = err instanceof Error ? err.message : String(err);
    log_({ accion: 'aprobarPago', nivel: 'error', detalle: detalle });
    return fail_('Error al aprobar: ' + detalle);
  }
}

function rechazarPago_(req) {
  try {
    requireAdmin_(req);
    const idCompra = String(req.id_compra || '').trim();
    const motivo = String(req.motivo || 'No especificado').trim();
    if (!isNonEmptyString_(idCompra)) return fail_('Falta id_compra');

    const compraRow = findRowIndex_(SHEET_NAMES.COMPRAS, 1, idCompra);
    if (compraRow < 0) return fail_('Compra no encontrada');

    const compras = readAll_(SHEET_NAMES.COMPRAS);
    let compra = null;
    for (let i = 0; i < compras.length; i++) {
      if (String(compras[i].id_compra) === idCompra) { compra = compras[i]; break; }
    }
    if (!compra) return fail_('Compra no encontrada');
    if (String(compra.estado_pago) === 'rechazado') return fail_('Ya fue rechazada anteriormente');

    const sheetCompras = getSheet_(SHEET_NAMES.COMPRAS);
    sheetCompras.getRange(compraRow, 8).setValue('rechazado');
    sheetCompras.getRange(compraRow, 12).setValue('revocado');

    try {
      const usuarios = readAll_(SHEET_NAMES.USUARIOS);
      for (let i = 0; i < usuarios.length; i++) {
        if (String(usuarios[i].id_usuario) === String(compra.id_usuario)) {
          const correo = String(usuarios[i].correo);
          const nombre = String(usuarios[i].nombre);
          const plat = findPlataformaById_(String(compra.id_plataforma));
          const platNombre = plat ? String(plat.nombre) : String(compra.id_plataforma);
          enviarCorreo_(
            correo,
            '❌ Pago no verificado — ' + platNombre + ' | SINAPSIS EDU',
            '<div style="font-family:Inter,system-ui,sans-serif;max-width:520px;margin:auto;background:#F3F1E8;padding:32px;border-radius:16px">' +
            '<h2 style="color:#10312D;margin:0 0 16px">Tu pago no pudo verificarse ❌</h2>' +
            '<p>Hola <strong>' + escapeHtml_(nombre) + '</strong>,</p>' +
            '<p>Lamentablemente no pudimos verificar tu pago para <strong>' + escapeHtml_(platNombre) + '</strong>.</p>' +
            '<p><strong>Motivo:</strong> ' + escapeHtml_(motivo) + '</p>' +
            '<p>Por favor comunícate con nosotros para solucionarlo:</p>' +
            '<p><a href="https://wa.me/51984300510?text=Hola%2C%20mi%20pago%20' + idCompra + '%20fue%20rechazado%2C%20quisiera%20aclarar." style="background:#10312D;color:#C2E476;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:700">Escribir por WhatsApp →</a></p>' +
            '</div>'
          );
          break;
        }
      }
    } catch (emailErr) {
      log_({ accion: 'rechazarPago', nivel: 'warning', detalle: 'falla email: ' + emailErr });
    }

    log_({ accion: 'rechazarPago', nivel: 'info', detalle: idCompra + ' motivo: ' + motivo });
    return ok_({ id_compra: idCompra }, 'Pago rechazado. Alumno notificado por correo.');
  } catch (err) {
    const detalle = err instanceof Error ? err.message : String(err);
    log_({ accion: 'rechazarPago', nivel: 'error', detalle: detalle });
    return fail_('Error al rechazar: ' + detalle);
  }
}

// ─── Fase 2: registrar compra + subir voucher ────────────────

const METODOS_PAGO_VALIDOS = ['yape', 'transferencia', 'binance', 'whatsapp'];

/**
 * Registra una solicitud de compra. Crea el usuario si no existe.
 * Body esperado:
 *  { action, nombre, correo, whatsapp, id_plataforma, metodo_pago, monto, detalle_extra? }
 * Devuelve { id_compra, id_usuario }.
 */
function registrarCompra_(req) {
  try {
    const nombre = String(req.nombre || '').trim();
    const correo = String(req.correo || '').trim().toLowerCase();
    const whatsapp = String(req.whatsapp || '').trim();
    const idPlataforma = String(req.id_plataforma || '').trim();
    const metodoPago = String(req.metodo_pago || '').trim().toLowerCase();
    const monto = Number(req.monto || 0);

    if (checkRateLimit_('rl_compra_' + correo)) {
      log_({ accion: 'registrarCompra', nivel: 'warning', detalle: 'rate limit excedido: ' + correo });
      return fail_('Demasiados intentos. Espera unos minutos.');
    }

    if (!isNonEmptyString_(nombre) || nombre.length < 3) return fail_('Nombre invalido');
    if (!isEmail_(correo)) return fail_('Correo invalido');
    if (!isWhatsapp_(whatsapp)) return fail_('WhatsApp invalido');
    if (!isNonEmptyString_(idPlataforma)) return fail_('Falta plataforma');
    if (METODOS_PAGO_VALIDOS.indexOf(metodoPago) === -1) return fail_('Metodo de pago invalido');
    if (!isFinite(monto) || monto <= 0) return fail_('Monto invalido');

    const plat = findPlataformaById_(idPlataforma);
    if (!plat) return fail_('Plataforma no encontrada');
    const activo = plat.activo === true || String(plat.activo).toLowerCase() === 'true';
    if (!activo) return fail_('Plataforma no disponible');

    // Serializar detalle_extra (puede venir como objeto o string).
    let detalleExtra = '';
    if (req.detalle_extra !== undefined && req.detalle_extra !== null && req.detalle_extra !== '') {
      detalleExtra = (typeof req.detalle_extra === 'string')
        ? req.detalle_extra
        : JSON.stringify(req.detalle_extra);
    }

    // Find or create user
    const sheetUsuarios = getSheet_(SHEET_NAMES.USUARIOS);
    const userExistente = findUsuarioByCorreo_(correo);
    let userId;
    if (userExistente) {
      // La cuenta se identifica por el correo. El nombre/WhatsApp se conservan
      // del registro inicial (no se sobrescriben en compras posteriores), para
      // gestionar todos los accesos del alumno bajo su identidad original.
      userId = String(userExistente.id_usuario);
    } else {
      userId = nextId_('U', nextSequenceFromColumn_(SHEET_NAMES.USUARIOS, 1));
      // Password se genera y envia en aprobarPago. Por ahora password_hash vacio.
      sheetUsuarios.appendRow([
        userId, nombre, correo, whatsapp,
        '', '',        // password_hash, password_salt
        nowIso_(),      // fecha_registro
        'activo'
      ]);
    }

    // Crear compra (estado pendiente)
    const sheetCompras = getSheet_(SHEET_NAMES.COMPRAS);
    const idCompra = nextId_('C', nextSequenceFromColumn_(SHEET_NAMES.COMPRAS, 1));
    sheetCompras.appendRow([
      idCompra, userId, idPlataforma, monto, metodoPago,
      nowIso_(),       // fecha_solicitud
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
      const ssUrl = getSpreadsheet_().getUrl();
      const detalleHtml = detalleExtra
        ? `<p><strong>Detalles:</strong> <code>${escapeHtml_(detalleExtra)}</code></p>`
        : '';
      // Alerta de monto: solo si NO hay detalle_extra (precio fijo) y el monto
      // reportado no coincide con el precio esperado (promocional si existe).
      let alertaMonto = '';
      if (!detalleExtra) {
        const promoNum = (plat.precio_promocional === undefined || plat.precio_promocional === '')
          ? NaN : Number(plat.precio_promocional);
        const precioBase = Number(plat.precio);
        const precioEsperado = (!isNaN(promoNum) && promoNum > 0) ? promoNum : precioBase;
        const coincide = (monto === precioEsperado) || (isFinite(precioBase) && monto === precioBase);
        if (isFinite(precioEsperado) && !coincide) {
          alertaMonto = '<p style="color:#b45309"><strong>⚠️ Monto reportado S/' + monto.toFixed(2) +
            ' no coincide con el precio base S/' + precioEsperado.toFixed(2) +
            ' — verificar voucher.</strong></p>';
        }
      }
      notificarAdmin_(
        '[SINAPSIS EDU] Nueva compra ' + idCompra + ' - ' + plat.nombre,
        '<h2 style="color:#10312D">Nueva solicitud de compra</h2>' +
        '<p><strong>ID compra:</strong> ' + idCompra + '</p>' +
        '<p><strong>Alumno:</strong> ' + escapeHtml_(nombre) + ' (' + escapeHtml_(correo) + ', WhatsApp ' + escapeHtml_(whatsapp) + ')</p>' +
        '<p><strong>Plataforma:</strong> ' + plat.nombre + ' (' + idPlataforma + ')</p>' +
        '<p><strong>Monto:</strong> S/ ' + monto.toFixed(2) + '</p>' +
        alertaMonto +
        '<p><strong>Metodo:</strong> ' + metodoPago + '</p>' +
        detalleHtml +
        '<p>El alumno subira el voucher en los proximos minutos.</p>' +
        '<p><a href="' + ssUrl + '">Abrir Spreadsheet</a></p>'
      );
    } catch (e) {
      // El email es best-effort. No bloquear la compra si falla.
      log_({ accion: 'notificarAdmin', nivel: 'warning', detalle: 'falla email: ' + e });
    }

    log_({
      accion: 'registrarCompra',
      idUsuario: userId,
      nivel: 'info',
      detalle: idCompra + ' ' + plat.nombre + ' S/' + monto + ' ' + metodoPago
    });

    return ok_({
      id_compra: idCompra,
      id_usuario: userId,
      message: 'Solicitud registrada. Ahora sube tu voucher.'
    });
  } catch (err) {
    const detalle = err instanceof Error ? err.message : String(err);
    log_({ accion: 'registrarCompra', nivel: 'error', detalle: detalle });
    return fail_('Error interno', 'No se pudo registrar tu compra. Intenta de nuevo.');
  }
}

/**
 * Sube voucher a Drive y actualiza la fila de Compras con la URL.
 * Body esperado:
 *  { action, id_compra, archivo_base64, tipo (mime), nombre (filename) }
 */
function subirVoucher_(req) {
  try {
    const idCompra = String(req.id_compra || '').trim();
    const archivoBase64 = String(req.archivo_base64 || '');
    const mime = String(req.tipo || req.mime || '').trim();
    const filename = String(req.nombre || req.filename || 'voucher.png').trim();

    if (!isNonEmptyString_(idCompra)) return fail_('Falta id_compra');

    if (checkRateLimit_('rl_voucher_' + idCompra)) {
      log_({ accion: 'subirVoucher', nivel: 'warning', detalle: 'rate limit excedido: ' + idCompra });
      return fail_('Demasiados intentos. Espera unos minutos.');
    }

    if (!isNonEmptyString_(archivoBase64)) return fail_('Falta archivo');

    const v = validateVoucher_(mime, archivoBase64);
    if (!v.ok) return fail_(v.error);

    const rowIndex = findRowIndex_(SHEET_NAMES.COMPRAS, 1, idCompra);
    if (rowIndex < 0) return fail_('Compra no encontrada');

    // Guard: solo compras pendientes y sin voucher previo admiten subida.
    // (El reintento legitimo pasa: si la primera subida fallo, voucher_url
    // quedo vacio y estado_pago sigue 'pendiente'.)
    const sheetCompras = getSheet_(SHEET_NAMES.COMPRAS);
    const filaCompra = sheetCompras.getRange(rowIndex, 1, 1, HEADERS_COMPRAS.length).getValues()[0];
    const estadoPagoActual = String(filaCompra[7] || '').trim();   // col 8: estado_pago
    const voucherActual = String(filaCompra[6] || '').trim();      // col 7: voucher_url
    if (estadoPagoActual !== 'pendiente') {
      log_({ accion: 'subirVoucher', nivel: 'warning', detalle: idCompra + ' rechazado: estado_pago=' + estadoPagoActual });
      return fail_('Esta solicitud ya no admite voucher.');
    }
    if (voucherActual) {
      log_({ accion: 'subirVoucher', nivel: 'warning', detalle: idCompra + ' rechazado: ya tiene voucher' });
      return fail_('Esta compra ya tiene un voucher.');
    }

    // Subir a Drive
    const safeName = idCompra + '_' + Date.now() + '_' + filename.replace(/[^a-zA-Z0-9._-]/g, '_');
    const subida = subirVoucherDrive_(archivoBase64, mime, safeName);

    // Actualizar columna voucher_url (columna 7 en HEADERS_COMPRAS)
    sheetCompras.getRange(rowIndex, 7).setValue(subida.fileUrl);

    // Leer la compra completa para el email
    let monto = '';
    let plataforma = '';
    let alumnoCorreo = '';
    try {
      const all = readAll_(SHEET_NAMES.COMPRAS);
      const compra = null;
      for (let i = 0; i < all.length; i++) {
        if (String(all[i].id_compra) === idCompra) {
          monto = String(all[i].monto);
          const plat = findPlataformaById_(String(all[i].id_plataforma));
          plataforma = plat ? String(plat.nombre) : String(all[i].id_plataforma);
          const usuarios = readAll_(SHEET_NAMES.USUARIOS);
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
      notificarAdmin_(
        '[SINAPSIS EDU] Voucher subido: ' + idCompra,
        '<h2 style="color:#10312D">Voucher recibido</h2>' +
        '<p><strong>Compra:</strong> ' + idCompra + '</p>' +
        '<p><strong>Plataforma:</strong> ' + escapeHtml_(plataforma) + '</p>' +
        '<p><strong>Monto:</strong> S/ ' + escapeHtml_(monto) + '</p>' +
        '<p><strong>Alumno:</strong> ' + escapeHtml_(alumnoCorreo) + '</p>' +
        '<p><a href="' + subida.fileUrl + '">Ver voucher en Drive</a></p>' +
        '<p>Revisa y aprueba desde el panel admin.</p>'
      );
    } catch (e) {
      log_({ accion: 'notificarAdmin', nivel: 'warning', detalle: 'falla email voucher: ' + e });
    }

    log_({ accion: 'subirVoucher', nivel: 'info', detalle: idCompra + ' ' + safeName });

    return ok_({ message: 'Voucher recibido. Te avisaremos por correo cuando aprobemos.' });
  } catch (err) {
    const detalle = err instanceof Error ? err.message : String(err);
    log_({ accion: 'subirVoucher', nivel: 'error', detalle: detalle });
    return fail_('Error interno', 'No se pudo subir el voucher. Intenta de nuevo o envialo por WhatsApp.');
  }
}

// ─── Fase 5: login alumno + accesos + url plataforma ─────────

function loginAlumno_(req) {
  try {
    const correo = String(req.correo || '').trim();
    const password = String(req.password || '');

    if (checkRateLimit_('rl_login_' + correo.toLowerCase())) {
      log_({ accion: 'loginAlumno', nivel: 'warning', detalle: 'rate limit excedido: ' + correo });
      return fail_('Demasiados intentos. Espera unos minutos.');
    }

    if (!isEmail_(correo)) return fail_('Correo invalido');
    if (!isNonEmptyString_(password)) return fail_('Falta la contrasena');

    const user = findUsuarioByCorreo_(correo);
    if (!user) {
      log_({ accion: 'loginAlumno', nivel: 'warning', detalle: 'correo no existe: ' + correo });
      return fail_('Credenciales invalidas');
    }
    if (String(user.estado) !== 'activo') {
      log_({ accion: 'loginAlumno', idUsuario: String(user.id_usuario), nivel: 'warning', detalle: 'cuenta no activa' });
      return fail_('Cuenta bloqueada. Contacta soporte.');
    }
    const salt = String(user.password_salt || '');
    const hash = String(user.password_hash || '');
    if (!salt || !hash) {
      log_({ accion: 'loginAlumno', idUsuario: String(user.id_usuario), nivel: 'error', detalle: 'usuario sin credenciales' });
      return fail_('Cuenta sin contrasena configurada. Contacta soporte.');
    }
    if (hashPassword_(password, salt) !== hash) {
      log_({ accion: 'loginAlumno', idUsuario: String(user.id_usuario), nivel: 'warning', detalle: 'password incorrecta' });
      return fail_('Credenciales invalidas');
    }

    const token = createSession_({
      id_usuario: String(user.id_usuario),
      correo: String(user.correo),
      nombre: String(user.nombre)
    });

    log_({ accion: 'loginAlumno', idUsuario: String(user.id_usuario), nivel: 'info', detalle: 'login OK' });
    return ok_({
      token: token,
      usuario: { nombre: String(user.nombre), correo: String(user.correo) }
    });
  } catch (err) {
    const detalle = err instanceof Error ? err.message : String(err);
    log_({ accion: 'loginAlumno', nivel: 'error', detalle: detalle });
    return fail_('Error interno', 'No se pudo procesar el login');
  }
}

function misAccesos_(req) {
  const session = validateSession_(req.token);
  if (!session) return fail_('Sesion invalida o expirada');

  try {
    const today = todayIso_();
    const compras = readAll_(SHEET_NAMES.COMPRAS);
    const accesos = compras
      .filter(function (c) {
        if (String(c.id_usuario) !== String(session.id_usuario)) return false;
        if (String(c.estado_pago) !== 'aprobado') return false;
        if (String(c.estado_acceso) !== 'activo') return false;
        const finIso = toIsoDate_(c.fecha_fin);
        return !finIso || finIso >= today;
      })
      .map(function (c) {
        const plat = findPlataformaById_(String(c.id_plataforma));
        return {
          id_acceso: String(c.id_compra),
          id_plataforma: String(c.id_plataforma),
          plataforma: plat ? String(plat.nombre) : '',
          slug: plat ? String(plat.slug) : '',
          fecha_inicio: toIsoDate_(c.fecha_inicio),
          fecha_fin: toIsoDate_(c.fecha_fin),
          dias_restantes: daysUntil_(c.fecha_fin)
        };
      });

    return ok_(accesos);
  } catch (err) {
    const detalle = err instanceof Error ? err.message : String(err);
    log_({ accion: 'misAccesos', idUsuario: String(session.id_usuario), nivel: 'error', detalle: detalle });
    return fail_('No se pudieron obtener los accesos');
  }
}

function obtenerUrlPlataforma_(req) {
  const session = validateSession_(req.token);
  if (!session) return fail_('Sesion invalida o expirada');

  const slug = String(req.slug || '').trim();
  if (!slug) return fail_('Falta el slug');

  const plat = findPlataformaBySlug_(slug);
  if (!plat) return fail_('Plataforma no encontrada');

  // Buscar la compra activa del usuario para esta plataforma (para devolver el vencimiento).
  const compras = readAll_(SHEET_NAMES.COMPRAS);
  const today = todayIso_();
  let acceso = null;
  for (let i = 0; i < compras.length; i++) {
    const c = compras[i];
    if (String(c.id_usuario) !== String(session.id_usuario)) continue;
    if (String(c.id_plataforma) !== String(plat.id_plataforma)) continue;
    if (String(c.estado_pago) !== 'aprobado') continue;
    if (String(c.estado_acceso) !== 'activo') continue;
    const finIso = toIsoDate_(c.fecha_fin);
    if (finIso && finIso < today) continue;
    acceso = c;
    break;
  }

  if (!acceso) {
    log_({
      accion: 'obtenerUrlPlataforma',
      idUsuario: String(session.id_usuario),
      nivel: 'warning',
      detalle: 'intento de acceso sin permiso: ' + slug
    });
    return fail_('No tienes acceso activo a esta plataforma');
  }

  log_({ accion: 'obtenerUrlPlataforma', idUsuario: String(session.id_usuario), nivel: 'info', detalle: slug });
  return ok_({
    url: String(plat.url_real),
    nombre: String(plat.nombre),
    fecha_fin: toIsoDate_(acceso.fecha_fin),
    dias_restantes: daysUntil_(acceso.fecha_fin)
  });
}

// ─── recuperarPassword: reset self-service por correo ────────

/**
 * Genera una nueva contraseña para el usuario, la hashea, actualiza Usuarios
 * y la envía por correo. La respuesta es SIEMPRE genérica: no revela si el
 * correo existe (evita enumeración de cuentas).
 */
function recuperarPassword_(req) {
  const correo = String(req.correo || '').trim().toLowerCase();
  const generico = ok_({}, 'Si el correo está registrado, te enviamos una nueva contraseña.');
  try {
    // Rate limit: si se excede, devolvemos el MISMO objeto generico (no revelar).
    if (checkRateLimit_('rl_recu_' + correo)) {
      log_({ accion: 'recuperarPassword', nivel: 'warning', detalle: 'rate limit excedido: ' + correo });
      return generico;
    }

    if (!isEmail_(correo)) return generico;

    const user = findUsuarioByCorreo_(correo);
    if (!user) {
      log_({ accion: 'recuperarPassword', nivel: 'warning', detalle: 'correo no registrado: ' + correo });
      return generico;
    }
    if (String(user.estado) !== 'activo') {
      log_({ accion: 'recuperarPassword', idUsuario: String(user.id_usuario), nivel: 'warning', detalle: 'cuenta no activa' });
      return generico;
    }

    const nuevaPass = randomToken_(10);
    const salt = generateSalt_();
    const hash = hashPassword_(nuevaPass, salt);
    const userRow = findRowIndex_(SHEET_NAMES.USUARIOS, 1, String(user.id_usuario));
    if (userRow > 0) {
      const sheetUsuarios = getSheet_(SHEET_NAMES.USUARIOS);
      sheetUsuarios.getRange(userRow, 5).setValue(hash);
      sheetUsuarios.getRange(userRow, 6).setValue(salt);
    }

    try {
      const portalUrl = 'https://sinapsisedu.com/#/login';
      const emailBody =
        '<div style="font-family:Inter,system-ui,sans-serif;max-width:520px;margin:auto;background:#F3F1E8;padding:32px;border-radius:16px">' +
        '<h2 style="color:#10312D;margin:0 0 16px">Recuperación de contraseña 🔑</h2>' +
        '<p>Hola <strong>' + escapeHtml_(String(user.nombre)) + '</strong>,</p>' +
        '<p>Generamos una nueva contraseña para tu cuenta:</p>' +
        '<p><strong>📧 Correo:</strong> <code style="background:#fff;padding:2px 6px;border-radius:4px">' + escapeHtml_(String(user.correo)) + '</code></p>' +
        '<p><strong>🔑 Nueva contraseña:</strong> <code style="background:#fff;padding:2px 6px;border-radius:4px">' + nuevaPass + '</code></p>' +
        '<div style="margin:28px 0">' +
        '<a href="' + portalUrl + '" style="background:#10312D;color:#C2E476;padding:14px 28px;border-radius:10px;text-decoration:none;font-weight:700;font-size:15px">Entrar al Portal →</a>' +
        '</div>' +
        '<p style="font-size:12px;color:#3D5752">Si no pediste esto, escríbenos por WhatsApp: <a href="https://wa.me/51984300510">+51 984 300 510</a></p>' +
        '</div>';
      enviarCorreo_(String(user.correo), '🔑 Nueva contraseña — SINAPSIS EDU', emailBody);
    } catch (emailErr) {
      log_({ accion: 'recuperarPassword', idUsuario: String(user.id_usuario), nivel: 'error', detalle: 'falla email: ' + emailErr });
    }

    log_({ accion: 'recuperarPassword', idUsuario: String(user.id_usuario), nivel: 'info', detalle: 'password regenerada' });
    return generico;
  } catch (err) {
    const detalle = err instanceof Error ? err.message : String(err);
    log_({ accion: 'recuperarPassword', nivel: 'error', detalle: detalle });
    return generico;
  }
}

// ─── misSolicitudes: historial completo del alumno ───────────

/**
 * Devuelve todas las compras del usuario (activas, pendientes, rechazadas).
 * El alumno puede ver el estado de sus solicitudes desde el portal.
 */
function misSolicitudes_(req) {
  const session = validateSession_(req.token);
  if (!session) return fail_('Sesión inválida o expirada');

  try {
    const compras = readAll_(SHEET_NAMES.COMPRAS);
    const resultado = compras
      .filter(function (c) {
        return String(c.id_usuario) === String(session.id_usuario);
      })
      .map(function (c) {
        const plat = findPlataformaById_(String(c.id_plataforma));
        return {
          id_compra: String(c.id_compra),
          plataforma: plat ? String(plat.nombre) : String(c.id_plataforma),
          slug: plat ? String(plat.slug) : '',
          monto: Number(c.monto) || 0,
          metodo_pago: String(c.metodo_pago || ''),
          fecha_solicitud: String(c.fecha_solicitud ? toIsoDate_(c.fecha_solicitud) || String(c.fecha_solicitud) : ''),
          estado_pago: String(c.estado_pago || ''),
          estado_acceso: String(c.estado_acceso || ''),
          fecha_fin: toIsoDate_(c.fecha_fin) || ''
        };
      });

    resultado.sort(function (a, b) {
      return a.fecha_solicitud < b.fecha_solicitud ? 1 : -1;
    });

    return ok_(resultado);
  } catch (err) {
    const detalle = err instanceof Error ? err.message : String(err);
    log_({ accion: 'misSolicitudes', idUsuario: String(session.id_usuario), nivel: 'error', detalle: detalle });
    return fail_('No se pudieron obtener las solicitudes');
  }
}

// ─── Wrappers para google.script.run (llamados desde admin.html) ──

function gs_adminLogin(password) {
  return adminLogin_({ password: password });
}

function gs_listarSolicitudes(adminToken, estado) {
  return listarSolicitudes_({ adminToken: adminToken, estado: estado || 'pendiente' });
}

function gs_aprobarPago(adminToken, idCompra) {
  return aprobarPago_({ adminToken: adminToken, id_compra: idCompra });
}

function gs_rechazarPago(adminToken, idCompra, motivo) {
  return rechazarPago_({ adminToken: adminToken, id_compra: idCompra, motivo: motivo });
}

function gs_listarLogs(adminToken, n) {
  if (!validateAdminSession_(adminToken)) return fail_('Sesión admin inválida');
  try {
    const sheet = getSheet_(SHEET_NAMES.LOGS);
    const lastRow = sheet.getLastRow();
    if (lastRow < 2) return ok_([]);
    const cantidad = Math.min(Number(n) || 50, 200);
    const startRow = Math.max(2, lastRow - cantidad + 1);
    const rows = sheet.getRange(startRow, 1, lastRow - startRow + 1, 5).getValues();
    const logs = rows.reverse().map(function (r) {
      return { timestamp: String(r[0]), accion: String(r[1]), id_usuario: String(r[2]), nivel: String(r[3]), detalle: String(r[4]) };
    });
    return ok_(logs);
  } catch (err) {
    return fail_('Error al leer logs: ' + (err instanceof Error ? err.message : String(err)));
  }
}

function gs_listarCredenciales(adminToken) {
  if (!validateAdminSession_(adminToken)) return fail_('Sesión admin inválida');
  try {
    const rows = readAll_(SHEET_NAMES.CREDENCIALES);
    rows.sort(function (a, b) {
      return String(a.fecha_asignacion) < String(b.fecha_asignacion) ? 1 : -1;
    });
    return ok_(rows);
  } catch (err) {
    return fail_('Error al leer credenciales: ' + (err instanceof Error ? err.message : String(err)));
  }
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
  requireEditor_();
  const correo = 'canazach12@gmail.com';
  const password = 'Test1234';
  const nombre = 'Yubert Canaza (Test)';

  const sheetUsuarios = getSheet_(SHEET_NAMES.USUARIOS);
  const sheetCompras = getSheet_(SHEET_NAMES.COMPRAS);

  // 1. Usuario
  const existing = findUsuarioByCorreo_(correo);
  let userId;
  let userCreated = false;
  if (existing) {
    userId = String(existing.id_usuario);
  } else {
    userId = nextId_('U', nextSequenceFromColumn_(SHEET_NAMES.USUARIOS, 1));
    const salt = generateSalt_();
    const hash = hashPassword_(password, salt);
    sheetUsuarios.appendRow([
      userId,
      nombre,
      correo,
      '51984300510',
      hash,
      salt,
      nowIso_(),
      'activo'
    ]);
    userCreated = true;
  }

  // 2. Compras de prueba (idempotentes por id_usuario + id_plataforma + activo)
  const compras = readAll_(SHEET_NAMES.COMPRAS);
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
    const id = nextId_('C', nextSequenceFromColumn_(SHEET_NAMES.COMPRAS, 1));
    sheetCompras.appendRow([
      id, userId, 'P-002', 49, 'yape',
      addDaysIso_(0), '',
      'aprobado', addDaysIso_(0), addDaysIso_(0), addDaysIso_(30),
      'activo'
    ]);
    created.push(id + ' = ENCIB (vence en 30 dias)');
    compras.push({ id_compra: id, id_usuario: userId, id_plataforma: 'P-002', estado_acceso: 'activo' });
  }

  // ENAM: comprada hace 25 dias, vence en 5 dias (probar warning de "vence pronto")
  if (!yaTieneActiva('P-001')) {
    const id = nextId_('C', nextSequenceFromColumn_(SHEET_NAMES.COMPRAS, 1));
    sheetCompras.appendRow([
      id, userId, 'P-001', 49, 'yape',
      addDaysIso_(-25), '',
      'aprobado', addDaysIso_(-25), addDaysIso_(-25), addDaysIso_(5),
      'activo'
    ]);
    created.push(id + ' = ENAM (vence en 5 dias)');
  }

  log_({
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

function dispatchPublic_(req) {
  const action = String(req.action);
  switch (action) {
    case 'ping':                     return ping_();
    case 'listarPlataformasPublicas':return listarPlataformasPublicas_(req);
    case 'registrarCompra':          return registrarCompra_(req);
    case 'subirVoucher':             return subirVoucher_(req);
    case 'loginAlumno':              return loginAlumno_(req);
    case 'misAccesos':               return misAccesos_(req);
    case 'misSolicitudes':           return misSolicitudes_(req);
    case 'obtenerUrlPlataforma':     return obtenerUrlPlataforma_(req);
    case 'recuperarPassword':        return recuperarPassword_(req);
    default:                         return fail_('Accion desconocida: ' + action);
  }
}

function dispatchAdmin_(req) {
  const action = String(req.action);
  switch (action) {
    case 'adminLogin':         return adminLogin_(req);
    case 'listarSolicitudes':  return listarSolicitudes_(req);
    case 'aprobarPago':        return aprobarPago_(req);
    case 'rechazarPago':       return rechazarPago_(req);
    default:                   return fail_('Accion admin desconocida: ' + action);
  }
}


// ╔═══════════════════════════════════════════════════════════════╗
// ║                           MAIN                                ║
// ║  doGet / doPost / healthcheck                                 ║
// ╚═══════════════════════════════════════════════════════════════╝

function doGet(e) {
  const params = (e && e.parameter) ? e.parameter : {};

  if (params.ping === '1') {
    return jsonResponse_(ping_());
  }

  if (params.page === 'admin') {
    return HtmlService.createHtmlOutputFromFile('admin')
      .setTitle('SINAPSIS EDU — Admin')
      .addMetaTag('viewport', 'width=device-width, initial-scale=1')
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.DEFAULT);
  }

  return jsonResponse_({
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
    return jsonResponse_(fail_('JSON invalido en el body'));
  }

  if (!req || !req.action) {
    return jsonResponse_(fail_('Falta el campo "action"'));
  }

  try {
    const fullAction = String(req.action);
    const isAdmin = fullAction.indexOf('admin.') === 0;
    const action = isAdmin ? fullAction.substring('admin.'.length) : fullAction;
    const innerReq = Object.assign({}, req, { action: action });
    const response = isAdmin ? dispatchAdmin_(innerReq) : dispatchPublic_(innerReq);
    return jsonResponse_(response);
  } catch (err) {
    const detalle = err instanceof Error ? err.message : String(err);
    log_({ accion: String(req.action), nivel: 'error', detalle: detalle });
    return jsonResponse_(fail_('Error interno', 'Ocurrio un problema. Intenta de nuevo.'));
  }
}

function jsonResponse_(payload) {
  return ContentService.createTextOutput(JSON.stringify(payload)).setMimeType(
    ContentService.MimeType.JSON
  );
}

function include_(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

/**
 * Verifica el estado del backend sin tocar nada.
 * Util para correr desde el editor tras un deploy.
 */
function healthcheck() {
  requireEditor_();
  const missing = checkRequiredProperties_();
  const result = { ok: missing.length === 0, missingProperties: missing };

  const sheetId = getProperty_('SHEET_ID');
  if (sheetId) {
    try {
      const ss = SpreadsheetApp.openById(sheetId);
      result.spreadsheet = { id: sheetId, url: ss.getUrl() };
    } catch (e) { /* IDs corruptos */ }
  }

  const folderId = getProperty_('DRIVE_FOLDER_VOUCHERS');
  if (folderId) {
    try {
      const folder = DriveApp.getFolderById(folderId);
      result.driveFolder = { id: folderId, url: folder.getUrl() };
    } catch (e) { /* IDs corruptos */ }
  }

  return result;
}

// ── SECURITY BATCH 2026 ──
// #2 Rate limit real: checkRateLimit_(bucketKey) con CacheService (TTL 3600s,
//    limite = RATE_LIMIT_PER_HOUR o 10). Aplicado a loginAlumno_ (rl_login_*),
//    registrarCompra_ (rl_compra_*), subirVoucher_ (rl_voucher_*) y
//    recuperarPassword_ (rl_recu_*, respuesta generica intacta).
// #3 randomToken_(length) ahora es CSPRNG: deriva bytes de Utilities.getUuid()
//    (SecureRandom) en vez de Math.random(). Misma firma y salida alfanumerica.
// #4 registrarCompra: si no hay detalle_extra y el monto reportado no coincide
//    con precio/precio_promocional, el correo al admin incluye una alerta
//    visible "verificar voucher". No se rechaza ni se recalcula el monto.
// #5 subirVoucher: guard antes de subir a Drive — rechaza si estado_pago no es
//    'pendiente' o si la compra ya tiene voucher_url. El reintento tras una
//    subida fallida sigue funcionando.
// #6 escapeHtml_(s): todo valor de origen usuario interpolado en htmlBody de
//    correos (registrarCompra, subirVoucher, aprobarPago, rechazarPago,
//    recuperarPassword) se escapa. URLs propias y passwords generadas no.
// #7 adminLogin: valida contra ADMIN_PASSWORD_HASH+SALT; si solo existe
//    ADMIN_PASSWORD legado y acierta, migra en caliente a hash+salt y borra el
//    texto plano. setAdminPassword(plain) (editor-only) rota la clave.
// #8 (2026-11-02) Superficie de google.script.run: toda funcion interna termina
//    en "_" (privada en Apps Script, no invocable desde el navegador). Publicas:
//    doGet, doPost y los gs_* (estos exigen token admin). setup,
//    setAdminPassword, createTestUser y healthcheck llaman requireEditor_() y
//    solo corren desde el editor. adminLogin con rate limit global
//    (rl_admin_login). Panel admin con XFrameOptionsMode.DEFAULT.
