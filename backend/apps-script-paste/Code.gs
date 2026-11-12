/**
 * ╔════════════════════════════════════════════════════════════════╗
 * ║  PORTAL CENTRAL — Backend Apps Script                          ║
 * ║  Pega este archivo COMPLETO dentro de Code.gs en el editor.    ║
 * ║                                                                ║
 * ║  Orden interno: utils → services → api → main.                 ║
 * ║  Apps Script V8 (ES2019) — todo en scope global.               ║
 * ╚════════════════════════════════════════════════════════════════╝
 *
 * ── PASARELA DE PAGO (Fase 1) ───────────────────────────────────
 * Script Properties (Configuración del proyecto → Propiedades del
 * script). NUNCA pegues llaves en este archivo.
 *
 *   PASARELA           'mercadopago' | 'culqi'. Vacía = mercadopago si
 *                      existe MP_ACCESS_TOKEN; si no, culqi si tiene llaves.
 *
 *   ▸ Mercado Pago (Checkout Pro por redirección) — pasarela por defecto
 *   MP_ACCESS_TOKEN    Access Token (APP_USR-… de producción o de la cuenta
 *                      de prueba vendedora; TEST-… en credenciales antiguas).
 *   MP_PUBLIC_KEY      Public Key. No la usa Checkout Pro por redirección;
 *                      se guarda para integraciones futuras.
 *   MP_SANDBOX         'true' para usar sandbox_init_point (opcional; se
 *                      activa solo si el token empieza con TEST-).
 *   SITE_URL           Default https://sinapsisedu.com. Mercado Pago vuelve
 *                      a SITE_URL/pago-retorno.html.
 *   WEBAPP_URL         Opcional: URL /exec del Web App para notification_url
 *                      (si no, se usa ScriptApp.getService().getUrl()).
 *   Corre testMPConfig() para verificar (no imprime secretos).
 *
 *   ▸ Culqi (alternativa, se conserva detrás de PASARELA='culqi')
 *   CULQI_PUBLIC_KEY   pk_test_xxx (prueba) o pk_live_xxx (producción).
 *                      Se entrega al navegador vía iniciarCompra.
 *   CULQI_SECRET_KEY   sk_test_xxx o sk_live_xxx. Solo vive aquí.
 *                      Ambas deben ser del MISMO entorno (test/live).
 *
 * Sin estas dos llaves, iniciarCompra responde "Pasarela no configurada"
 * y la web ofrece el pago por voucher (Plan B).
 *
 * Después de pegar este archivo:
 *   1. Corre setup() una vez (crea la hoja Pagos y las columnas nuevas de
 *      Compras/Usuarios al final, sin tocar las existentes).
 *   2. Corre testCulqiConfig() para verificar las llaves (no las imprime).
 *      La primera vez Google pedirá el permiso "conectarse a un servicio
 *      externo" (UrlFetchApp): acéptalo.
 *   3. Implementar → Gestionar implementaciones → editar → Nueva versión.
 *      Si no redespliegas, el Web App sigue con el código anterior.
 *   4. En el panel de Culqi (Desarrollo → Eventos/Webhooks) registra la URL
 *      del Web App (la misma /exec) para los eventos de cargos y
 *      devoluciones. El backend re-consulta cada evento a la API de Culqi.
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
const PRECONFIGURED_WHATSAPP = '51989855026';


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
 * `limitOverride` (opcional) fija un limite propio para ese bucket.
 */
function checkRateLimit_(bucketKey, limitOverride) {
  try {
    const cache = CacheService.getScriptCache();
    const limit = Number(limitOverride) || Number(getProperty_('RATE_LIMIT_PER_HOUR')) || 10;
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
  PAGOS: 'Pagos',
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
  'password_salt', 'fecha_registro', 'estado',
  // Agregadas en Fase 1 de pasarela (al final, retrocompatible):
  'dni'
];

const HEADERS_COMPRAS = [
  'id_compra', 'id_usuario', 'id_plataforma', 'monto', 'metodo_pago',
  'fecha_solicitud', 'voucher_url', 'estado_pago', 'fecha_aprobacion',
  'fecha_inicio', 'fecha_fin', 'estado_acceso',
  // Metadata adicional como JSON string (segmentos de anatomia,
  // modulos de CTO, codigo de cupon, etc.). Vacio si no aplica.
  'detalle_extra',
  // Agregadas en Fase 1 de pasarela (al final, retrocompatible; las filas
  // antiguas quedan vacias en estas columnas):
  'dni',                // DNI del comprador (8 digitos)
  'expira',             // ISO: hasta cuando se puede pagar una compra pendiente_pago
  'id_pago',            // id del cargo Culqi que activo la compra
  'terminos_aceptados'  // ISO: cuando acepto Terminos y Privacidad
];

/** Pagos de la pasarela: un intento por fila. id_pago es UNICO. */
const HEADERS_PAGOS = [
  'id_pago', 'id_compra', 'monto', 'moneda', 'metodo', 'estado',
  'fecha', 'correo', 'respuesta'
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
  const r6 = ensureSheet_(ss, SHEET_NAMES.PAGOS, HEADERS_PAGOS);

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
      { name: SHEET_NAMES.CREDENCIALES, created: r5.created },
      { name: SHEET_NAMES.PAGOS, created: r6.created }
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
  const URL_DEMO = 'https://banqueo.sinapsisedu.com/';
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

// ─── Columnas por nombre (para las columnas agregadas al final) ───

/** Cache por ejecucion de las hojas cuyas columnas ya se verificaron. */
const COLUMNAS_VERIFICADAS_ = {};

/**
 * Agrega AL FINAL de la fila 1 los encabezados de `headers` que falten.
 * No mueve ni renombra columnas existentes (retrocompatible con el panel y
 * con el codigo que usa indices fijos para las 13 primeras columnas).
 * Si la hoja no existe, la crea con todos los encabezados.
 */
function ensureColumnas_(sheetName, headers) {
  if (COLUMNAS_VERIFICADAS_[sheetName]) return;
  const ss = getSpreadsheet_();
  let sheet = ss.getSheetByName(sheetName);
  if (!sheet) {
    ensureSheet_(ss, sheetName, headers);
    COLUMNAS_VERIFICADAS_[sheetName] = true;
    return;
  }
  const lastCol = Math.max(sheet.getLastColumn(), 1);
  const actuales = sheet.getRange(1, 1, 1, lastCol).getValues()[0].map(String);
  const faltan = headers.filter(function (h) { return actuales.indexOf(h) === -1; });
  if (faltan.length > 0) {
    const realLast = sheet.getLastColumn();
    const range = sheet.getRange(1, realLast + 1, 1, faltan.length);
    range.setValues([faltan]);
    range.setFontWeight('bold');
    range.setBackground('#10312D');
    range.setFontColor('#C2E476');
  }
  COLUMNAS_VERIFICADAS_[sheetName] = true;
}

/** { nombreColumna: indice 1-based } a partir de la fila 1. */
function headerMap_(sheet) {
  const lastCol = sheet.getLastColumn();
  const headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
  const map = {};
  for (let i = 0; i < headers.length; i++) map[String(headers[i])] = i + 1;
  return map;
}

/** appendRow usando nombres de columna; las columnas no indicadas quedan vacias. */
function appendRowByHeaders_(sheetName, obj) {
  const sheet = getSheet_(sheetName);
  const map = headerMap_(sheet);
  const width = sheet.getLastColumn();
  const row = [];
  for (let i = 0; i < width; i++) row.push('');
  Object.keys(obj).forEach(function (k) {
    if (map[k]) row[map[k] - 1] = obj[k];
  });
  sheet.appendRow(row);
}

/** Escribe varias celdas de una fila por nombre de columna. */
function setCellsByHeaders_(sheetName, rowIndex, obj) {
  const sheet = getSheet_(sheetName);
  const map = headerMap_(sheet);
  Object.keys(obj).forEach(function (k) {
    if (map[k]) sheet.getRange(rowIndex, map[k]).setValue(obj[k]);
  });
}

/** Lee una fila como objeto {encabezado: valor}. null si rowIndex < 2. */
function readRowObject_(sheetName, rowIndex) {
  if (rowIndex < 2) return null;
  const sheet = getSheet_(sheetName);
  const lastCol = sheet.getLastColumn();
  const headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
  const vals = sheet.getRange(rowIndex, 1, 1, lastCol).getValues()[0];
  const obj = {};
  for (let i = 0; i < headers.length; i++) obj[String(headers[i])] = vals[i];
  return obj;
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

/** Numero de WhatsApp de soporte (Script Property WHATSAPP_NUMBER), solo digitos. */
function whatsappNumero_() {
  return String(getProperty_('WHATSAPP_NUMBER') || PRECONFIGURED_WHATSAPP || '').replace(/\D/g, '');
}

/** "+51 989 855 026" a partir del numero configurado. */
function whatsappDisplay_() {
  const n = whatsappNumero_();
  if (n.length === 11 && n.indexOf('51') === 0) {
    return '+51 ' + n.slice(2, 5) + ' ' + n.slice(5, 8) + ' ' + n.slice(8);
  }
  return '+' + n;
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
 *   6. Defaults: WHATSAPP_NUMBER=51989855026, RATE_LIMIT_PER_HOUR=10.
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
    props.setProperty('WHATSAPP_NUMBER', PRECONFIGURED_WHATSAPP || '51989855026');
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

/**
 * Precio vigente de una plataforma (fila de la hoja): precio_promocional si
 * existe, es > 0 y es MENOR que el precio; si no, el precio base.
 */
function precioVigente_(plat) {
  const base = Number(plat.precio);
  const promo = (plat.precio_promocional === undefined || plat.precio_promocional === '')
    ? NaN : Number(plat.precio_promocional);
  let vigente = (!isNaN(promo) && promo > 0 && (!isFinite(base) || promo < base)) ? promo
    : (isFinite(base) ? base : 0);
  // Campaña (Black Friday, etc.): descuento sobre el precio BASE; gana el más barato.
  const conCampana = precioConCampana_(plat);
  if (conCampana !== null && conCampana > 0 && conCampana < vigente) vigente = conCampana;
  return vigente;
}

// ── Campañas de descuento (hoja "Campanas") ─────────────────────────────────
// Una fila por campaña. Se aplica la primera activa cuya ventana incluya "ahora".
//   nombre        Texto del banner y de la etiqueta ("NOVIEMBRE FRIDAY")
//   descuento_pct 1..90
//   inicio, fin   Fecha/hora (hora de Lima). Fuera de la ventana no aplica.
//   plataformas   slugs separados por coma; vacío = todas
//   activo        TRUE/FALSE (interruptor manual)
//   mensaje       Texto corto opcional para el banner
// El precio SIEMPRE se calcula aquí: el navegador solo lo muestra.
const SHEET_CAMPANAS = 'Campanas';
const HEADERS_CAMPANAS = ['nombre', 'descuento_pct', 'inicio', 'fin', 'plataformas', 'activo', 'mensaje'];

function campanaVigente_() {
  const cache = CacheService.getScriptCache();
  const hit = cache.get('campana_v1');
  if (hit) return hit === 'none' ? null : JSON.parse(hit);
  let res = null;
  try {
    const sh = getSpreadsheet_().getSheetByName(SHEET_CAMPANAS);
    if (sh && sh.getLastRow() >= 2) {
      const ahora = Date.now();
      const rows = readAll_(SHEET_CAMPANAS);
      for (let i = 0; i < rows.length; i++) {
        const r = rows[i];
        const activo = r.activo === true || String(r.activo).toLowerCase() === 'true';
        const pct = Number(r.descuento_pct);
        const ini = toMillis_(r.inicio), fin = toMillis_(r.fin);
        if (!activo || !(pct > 0 && pct <= 90) || !(fin > ahora)) continue;
        if (isFinite(ini) && ini > ahora) continue;
        res = {
          nombre: String(r.nombre || 'Oferta').slice(0, 40),
          descuento_pct: pct,
          fin: new Date(fin).toISOString(),
          plataformas: String(r.plataformas || '').split(',')
            .map(function (x) { return x.trim().toLowerCase(); }).filter(String),
          mensaje: String(r.mensaje || '').slice(0, 140)
        };
        break;
      }
    }
  } catch (e) { res = null; }
  // 60 s de caché, sin pasar del fin de la campaña.
  let ttl = 60;
  if (res) ttl = Math.max(1, Math.min(60, Math.floor((toMillis_(res.fin) - Date.now()) / 1000)));
  cache.put('campana_v1', res ? JSON.stringify(res) : 'none', ttl);
  return res;
}

function campanaAplica_(camp, slug) {
  if (!camp) return false;
  return camp.plataformas.length === 0 || camp.plataformas.indexOf(String(slug).toLowerCase()) >= 0;
}

/** Precio con la campaña vigente (redondeado a soles enteros) o null si no aplica. */
function precioConCampana_(plat) {
  const camp = campanaVigente_();
  if (!campanaAplica_(camp, plat.slug)) return null;
  const base = Number(plat.precio);
  if (!isFinite(base) || base <= 0) return null;
  return Math.max(1, Math.round(base * (1 - camp.descuento_pct / 100)));
}

/** Público: datos de la campaña para el banner (sin nada sensible). */
function campanaActual_() {
  const c = campanaVigente_();
  if (!c) return ok_(null);
  return ok_({ nombre: c.nombre, descuento_pct: c.descuento_pct, fin: c.fin,
               plataformas: c.plataformas, mensaje: c.mensaje });
}

/**
 * Ejecutar UNA vez desde el editor: crea la hoja "Campanas" con una fila de ejemplo
 * (NOVIEMBRE FRIDAY). Queda con activo = FALSE: revisa % y fechas y ponlo en TRUE.
 */
function crearHojaCampanas() {
  requireEditor_();
  const ss = getSpreadsheet_();
  let sh = ss.getSheetByName(SHEET_CAMPANAS);
  if (sh) return 'La hoja Campanas ya existe.';
  sh = ss.insertSheet(SHEET_CAMPANAS);
  sh.getRange(1, 1, 1, HEADERS_CAMPANAS.length).setValues([HEADERS_CAMPANAS]).setFontWeight('bold');
  sh.getRange(2, 1, 1, HEADERS_CAMPANAS.length).setValues([[
    'NOVIEMBRE FRIDAY', 30, new Date('2026-11-20T00:00:00-05:00'), new Date('2026-11-30T23:59:00-05:00'),
    '', false, 'Hasta 30 % en todas las plataformas. Solo por noviembre.'
  ]]);
  sh.getRange('C2:D2').setNumberFormat('dd/mm/yyyy hh:mm');
  sh.setFrozenRows(1);
  return 'Hoja Campanas creada. Revisa la fila 2 y pon activo = TRUE para lanzarla.';
}

/** Para probar desde el editor: muestra la campaña vigente y los precios resultantes. */
function testCampana() {
  CacheService.getScriptCache().remove('campana_v1');
  const c = campanaVigente_();
  Logger.log('Campaña vigente: ' + JSON.stringify(c));
  readAll_(SHEET_NAMES.PLATAFORMAS).forEach(function (p) {
    Logger.log(p.slug + ': base S/' + p.precio + ' → cobra S/' + precioVigente_(p));
  });
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
        // precio_promocional = lo que realmente se cobra (incluye campaña), si es menor.
        const vig = precioVigente_(p);
        const promo = (isFinite(vig) && vig > 0 && vig < Number(p.precio)) ? vig : null;
        const camp = campanaVigente_();
        const enCampana = campanaAplica_(camp, p.slug) && precioConCampana_(p) === vig;
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
          etiqueta: enCampana ? ('-' + camp.descuento_pct + '% ' + camp.nombre)
            : (p.etiqueta ? String(p.etiqueta) : ''),
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
        precio_esperado: p.id_plataforma ? precioVigente_(p) : 0,
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

/**
 * Activa una compra: genera contraseña si el alumno aun no tiene, marca la
 * compra como aprobada con su vigencia, envia el correo de bienvenida,
 * registra en Credenciales y deja log. Logica UNICA compartida por:
 *   - aprobarPago_ (aprobacion manual del admin, origen 'admin')
 *   - confirmarPago_ / webhook Culqi (origen 'culqi' | 'webhook')
 *
 * Idempotente: si la compra ya esta aprobada, no toca nada y devuelve el
 * estado actual con yaAprobada=true.
 * Vigencia: si el alumno YA tiene acceso vigente a esa plataforma por otra
 * compra, la duracion se suma desde la fecha_fin mas lejana.
 * El llamador debe sostener el LockService del script.
 *
 * @param {string} idCompra
 * @param {string} origen 'admin' | 'culqi' | 'webhook'
 * @param {{id: string, monto: number}|null} pago cargo de la pasarela, si aplica
 */
function activarCompra_(idCompra, origen, pago) {
  ensureColumnas_(SHEET_NAMES.COMPRAS, HEADERS_COMPRAS);
  const compraRow = findRowIndex_(SHEET_NAMES.COMPRAS, 1, idCompra);
  if (compraRow < 0) throw new Error('Compra no encontrada: ' + idCompra);
  const compra = readRowObject_(SHEET_NAMES.COMPRAS, compraRow);

  const plat = findPlataformaById_(String(compra.id_plataforma));
  const platNombre = plat ? String(plat.nombre) : String(compra.id_plataforma);
  const duracion = plat ? (Number(plat.duracion_dias) || 30) : 30;

  const userRow = findRowIndex_(SHEET_NAMES.USUARIOS, 1, String(compra.id_usuario));
  const usuario = readRowObject_(SHEET_NAMES.USUARIOS, userRow);
  if (!usuario) throw new Error('Usuario no encontrado para ' + idCompra);

  if (String(compra.estado_pago) === 'aprobado') {
    return {
      yaAprobada: true,
      id_compra: idCompra,
      correo: String(usuario.correo),
      plataforma: platNombre,
      fecha_fin: toIsoDate_(compra.fecha_fin),
      password_generado: false
    };
  }

  // Contraseña solo si el usuario aun no tiene una.
  let plainPassword = null;
  if (!usuario.password_hash || String(usuario.password_hash).trim() === '') {
    plainPassword = randomToken_(10);
    const salt = generateSalt_();
    const sheetUsuarios = getSheet_(SHEET_NAMES.USUARIOS);
    sheetUsuarios.getRange(userRow, 5).setValue(hashPassword_(plainPassword, salt));
    sheetUsuarios.getRange(userRow, 6).setValue(salt);
  }

  // Vigencia: sumar desde el acceso vigente mas lejano a la misma plataforma.
  const hoy = todayIso_();
  let base = hoy;
  const compras = readAll_(SHEET_NAMES.COMPRAS);
  for (let i = 0; i < compras.length; i++) {
    const c = compras[i];
    if (String(c.id_compra) === idCompra) continue;
    if (String(c.id_usuario) !== String(compra.id_usuario)) continue;
    if (String(c.id_plataforma) !== String(compra.id_plataforma)) continue;
    if (String(c.estado_pago) !== 'aprobado' || String(c.estado_acceso) !== 'activo') continue;
    const fin = toIsoDate_(c.fecha_fin);
    if (fin && fin >= hoy && fin > base) base = fin;
  }
  const extendida = base !== hoy;
  const fechaFin = addDaysFromIso_(base, duracion);

  // Cols: estado_pago=8, fecha_aprobacion=9, fecha_inicio=10, fecha_fin=11, estado_acceso=12
  const sheetCompras = getSheet_(SHEET_NAMES.COMPRAS);
  sheetCompras.getRange(compraRow, 8, 1, 5).setValues([['aprobado', hoy, hoy, fechaFin, 'activo']]);
  if (pago && pago.id) setCellsByHeaders_(SHEET_NAMES.COMPRAS, compraRow, { id_pago: pago.id });

  // Correo de bienvenida
  try {
    const portalUrl = 'https://sinapsisedu.com/#/login';
    const correo = String(usuario.correo);
    const wa = whatsappNumero_();
    let emailBody =
      '<div style="font-family:Inter,system-ui,sans-serif;max-width:520px;margin:auto;background:#F6F8F7;padding:32px;border-radius:16px">' +
      '<h2 style="color:#10312D;margin:0 0 16px">¡Tu acceso está activo! ✅</h2>' +
      '<p>Hola <strong>' + escapeHtml_(String(usuario.nombre)) + '</strong>,</p>' +
      '<p>' + (origen === 'admin' ? 'Tu pago para ' : 'Recibimos tu pago para ') +
      '<strong>' + escapeHtml_(platNombre) + '</strong>' +
      (origen === 'admin' ? ' fue verificado.' : '.') + ' Ya puedes entrar.</p>' +
      '<hr style="border:none;border-top:1px solid #E2E8E6;margin:20px 0">' +
      '<p><strong>📧 Usuario:</strong> <code style="background:#fff;padding:2px 6px;border-radius:4px">' + escapeHtml_(correo) + '</code></p>';
    if (plainPassword) {
      emailBody += '<p><strong>🔑 Contraseña:</strong> <code style="background:#fff;padding:2px 6px;border-radius:4px">' + plainPassword + '</code></p>' +
        '<p style="font-size:13px;color:#51625E"><em>Guárdala. Si la pierdes, usa "¿Olvidaste tu contraseña?" en el inicio de sesión.</em></p>';
    } else {
      emailBody += '<p><strong>🔑 Contraseña:</strong> la que ya tenías registrada.</p>';
    }
    emailBody +=
      '<p><strong>📅 Vigencia:</strong> hasta el <strong>' + fechaFin + '</strong>' +
      (extendida ? ' (se sumaron ' + duracion + ' días a tu acceso vigente)' : ' (' + duracion + ' días)') + '</p>' +
      (pago && pago.id ? '<p style="font-size:13px;color:#51625E">Código de compra: ' + escapeHtml_(idCompra) + '</p>' : '') +
      '<div style="margin:28px 0">' +
      '<a href="' + portalUrl + '" style="background:#10312D;color:#ffffff;padding:14px 28px;border-radius:10px;text-decoration:none;font-weight:700;font-size:15px">Entrar al Portal →</a>' +
      '</div>' +
      '<p style="font-size:12px;color:#51625E">¿Problemas? WhatsApp: <a href="https://wa.me/' + wa + '">' + escapeHtml_(whatsappDisplay_()) + '</a></p>' +
      '</div>';
    enviarCorreo_(correo, '✅ Acceso activo — ' + platNombre + ' | SINAPSIS EDU', emailBody);
  } catch (emailErr) {
    log_({ accion: 'activarCompra', nivel: 'warning', detalle: idCompra + ' falla email alumno: ' + emailErr });
  }

  // Registro en Credenciales (sin contraseña en texto plano).
  try {
    getSheet_(SHEET_NAMES.CREDENCIALES).appendRow([
      idCompra,
      String(compra.id_usuario),
      String(usuario.correo),
      platNombre,
      plainPassword ? '(enviada por correo)' : '(contraseña existente, no se regeneró)',
      hoy
    ]);
  } catch (credErr) {
    log_({ accion: 'activarCompra', nivel: 'warning', detalle: 'falla al escribir Credenciales: ' + credErr });
  }

  log_({
    accion: 'activarCompra', idUsuario: String(compra.id_usuario), nivel: 'info',
    detalle: idCompra + ' origen=' + origen + (pago && pago.id ? ' pago=' + pago.id : '') +
      ' fin=' + fechaFin + ' extendida=' + extendida + ' password_generado=' + !!plainPassword
  });

  return {
    yaAprobada: false,
    id_compra: idCompra,
    correo: String(usuario.correo),
    plataforma: platNombre,
    fecha_fin: fechaFin,
    password_generado: !!plainPassword
  };
}

/** Suma `dias` a una fecha 'YYYY-MM-DD' (en UTC, igual que todayIso_). */
function addDaysFromIso_(iso, dias) {
  const d = new Date(String(iso).slice(0, 10) + 'T00:00:00Z');
  d.setUTCDate(d.getUTCDate() + Number(dias));
  return d.toISOString().slice(0, 10);
}

function aprobarPago_(req) {
  try {
    requireAdmin_(req);
    const idCompra = String(req.id_compra || '').trim();
    if (!isNonEmptyString_(idCompra)) return fail_('Falta id_compra');

    const compraRow = findRowIndex_(SHEET_NAMES.COMPRAS, 1, idCompra);
    if (compraRow < 0) return fail_('Compra no encontrada: ' + idCompra);

    const lock = LockService.getScriptLock();
    if (!lock.tryLock(20000)) return fail_('Otro proceso está activando compras. Intenta en unos segundos.');
    let r;
    try {
      r = activarCompra_(idCompra, 'admin', null);
    } finally {
      lock.releaseLock();
    }
    if (r.yaAprobada) return fail_('Esta compra ya fue aprobada');

    return ok_({
      id_compra: idCompra,
      correo: r.correo,
      fecha_fin: r.fecha_fin,
      password_generado: r.password_generado
    }, 'Pago aprobado. ' + (r.password_generado ? 'Credenciales enviadas al alumno.' : 'Confirmación enviada al alumno.'));
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
            '<p><a href="https://wa.me/' + whatsappNumero_() + '?text=Hola%2C%20mi%20pago%20' + encodeURIComponent(idCompra) + '%20fue%20rechazado%2C%20quisiera%20aclarar." style="background:#10312D;color:#C2E476;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:700">Escribir por WhatsApp →</a></p>' +
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

    // Find or create user (la cuenta se identifica por el correo; nombre y
    // WhatsApp se conservan del registro inicial). Password se genera al aprobar.
    const userId = upsertUsuario_(nombre, correo, whatsapp, '');

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
        const precioBase = Number(plat.precio);
        const precioEsperado = precioVigente_(plat);
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
    // Solo las 8 primeras columnas (las agregadas al final pueden no existir aun).
    const filaCompra = sheetCompras.getRange(rowIndex, 1, 1, 8).getValues()[0];
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
        '<p style="font-size:12px;color:#3D5752">Si no pediste esto, escríbenos por WhatsApp: <a href="https://wa.me/' + whatsappNumero_() + '">' + escapeHtml_(whatsappDisplay_()) + '</a></p>' +
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

// ─── Fase 1 pasarela: Culqi (tarjeta + Yape) ─────────────────

const CULQI_API_BASE = 'https://api.culqi.com/v2';
const COMPRA_EXPIRA_MINUTOS = 30;
const RE_DNI = /^\d{8}$/;
const RE_ID_COMPRA = /^C-\d{1,9}$/;
const RE_CULQI_TOKEN = /^[A-Za-z0-9_]{8,120}$/;
const RE_CULQI_CHARGE = /^chr_(test|live)_[A-Za-z0-9]+$/;
const RE_CULQI_REFUND = /^ref_(test|live)_[A-Za-z0-9]+$/;
const ESTADO_PENDIENTE_PAGO = 'pendiente_pago';
const MAX_SEGMENTOS_ANATOMIA = 20;

/** Error con codigo para que el frontend decida que pantalla mostrar. */
function failCode_(code, error, message) {
  const res = fail_(error, message);
  res.code = code;
  return res;
}

function culqiConfigurado_() {
  return !!(getProperty_('CULQI_PUBLIC_KEY') && getProperty_('CULQI_SECRET_KEY'));
}

/**
 * Llamada autenticada a la API de Culqi. Nunca loguea la llave ni el body
 * (el body de un cargo lleva el token de la tarjeta/Yape).
 * Devuelve { status, body } — body es {} si la respuesta no es JSON.
 * Lanza si hay error de red (el llamador decide).
 */
function culqiRequest_(method, path, payload) {
  const sk = getProperty_('CULQI_SECRET_KEY');
  if (!sk) throw new Error('CULQI_SECRET_KEY no configurada');
  const opts = {
    method: method,
    muteHttpExceptions: true,
    headers: { Authorization: 'Bearer ' + sk },
    contentType: 'application/json'
  };
  if (payload) opts.payload = JSON.stringify(payload);
  const res = UrlFetchApp.fetch(CULQI_API_BASE + path, opts);
  let body = {};
  try { body = JSON.parse(res.getContentText()) || {}; } catch (e) { body = {}; }
  return { status: res.getResponseCode(), body: body };
}

/** Milisegundos de una celda (Date o string ISO). NaN si vacia. */
function toMillis_(v) {
  if (v instanceof Date) return v.getTime();
  if (v === null || v === undefined || v === '') return NaN;
  return new Date(String(v)).getTime();
}

/** Lee una compra por id. { row, compra } o null. */
function getCompra_(idCompra) {
  const row = findRowIndex_(SHEET_NAMES.COMPRAS, 1, idCompra);
  if (row < 0) return null;
  return { row: row, compra: readRowObject_(SHEET_NAMES.COMPRAS, row) };
}

/** Usuario por id_usuario (objeto) o null. */
function getUsuarioById_(idUsuario) {
  const row = findRowIndex_(SHEET_NAMES.USUARIOS, 1, String(idUsuario));
  return readRowObject_(SHEET_NAMES.USUARIOS, row);
}

/**
 * Busca un usuario por correo; si no existe lo crea SIN contraseña (se genera
 * al activar la primera compra). Si existe, conserva nombre/WhatsApp
 * originales y solo completa el DNI si estaba vacio. Devuelve id_usuario.
 * Compartido por registrarCompra_ (voucher) e iniciarCompra_ (Culqi).
 */
function upsertUsuario_(nombre, correo, whatsapp, dni) {
  const existente = findUsuarioByCorreo_(correo);
  if (existente) {
    const userId = String(existente.id_usuario);
    if (dni && !String(existente.dni || '').trim()) {
      ensureColumnas_(SHEET_NAMES.USUARIOS, HEADERS_USUARIOS);
      const row = findRowIndex_(SHEET_NAMES.USUARIOS, 1, userId);
      if (row > 0) setCellsByHeaders_(SHEET_NAMES.USUARIOS, row, { dni: dni });
    }
    return userId;
  }
  const userId = nextId_('U', nextSequenceFromColumn_(SHEET_NAMES.USUARIOS, 1));
  if (dni) {
    ensureColumnas_(SHEET_NAMES.USUARIOS, HEADERS_USUARIOS);
    appendRowByHeaders_(SHEET_NAMES.USUARIOS, {
      id_usuario: userId, nombre: nombre, correo: correo, whatsapp: whatsapp,
      password_hash: '', password_salt: '', fecha_registro: nowIso_(), estado: 'activo', dni: dni
    });
  } else {
    getSheet_(SHEET_NAMES.USUARIOS).appendRow([
      userId, nombre, correo, whatsapp, '', '', nowIso_(), 'activo'
    ]);
  }
  return userId;
}

// ─── Hoja Pagos ──────────────────────────────────────────────

function findPago_(idPago) {
  ensureColumnas_(SHEET_NAMES.PAGOS, HEADERS_PAGOS);
  const row = findRowIndex_(SHEET_NAMES.PAGOS, 1, idPago);
  return row < 0 ? null : readRowObject_(SHEET_NAMES.PAGOS, row);
}

/** Registra un intento/pago. Si id_pago ya existe, no duplica (devuelve false). */
function registrarPago_(p) {
  ensureColumnas_(SHEET_NAMES.PAGOS, HEADERS_PAGOS);
  if (findRowIndex_(SHEET_NAMES.PAGOS, 1, p.id_pago) > 0) return false;
  appendRowByHeaders_(SHEET_NAMES.PAGOS, {
    id_pago: p.id_pago,
    id_compra: p.id_compra || '',
    monto: p.monto === undefined ? '' : p.monto,
    moneda: p.moneda || 'PEN',
    metodo: p.metodo || '',
    estado: p.estado,
    fecha: nowIso_(),
    correo: p.correo || '',
    respuesta: String(p.respuesta || '').slice(0, 300)
  });
  return true;
}

/** 'yape' | 'tarjeta' segun el id de la fuente del cargo/token. */
function metodoDesdeFuente_(sourceId) {
  return /^ype_/.test(String(sourceId || '')) ? 'culqi-yape' : 'culqi-tarjeta';
}

/** Resumen sin datos sensibles de una respuesta de Culqi para la hoja Pagos. */
function resumenCulqi_(body) {
  if (!body) return '';
  if (body.object === 'charge') {
    const o = body.outcome || {};
    return [o.type, o.code, o.merchant_message].filter(Boolean).join(' | ');
  }
  return [body.type, body.code, body.decline_code, body.merchant_message].filter(Boolean).join(' | ');
}

/** Cuenta rechazos por correo; al 4.º en ~1 h avisa al admin (una vez). */
function contarRechazo_(correo, idCompra) {
  try {
    const cache = CacheService.getScriptCache();
    const key = 'rech_' + correo;
    const n = (Number(cache.get(key)) || 0) + 1;
    cache.put(key, String(n), 3600);
    if (n === 4) {
      notificarAdmin_(
        '[SINAPSIS EDU] ⚠️ Muchos rechazos de pago: ' + correo,
        '<h2 style="color:#10312D">Más de 3 pagos rechazados en 1 hora</h2>' +
        '<p><strong>Correo:</strong> ' + escapeHtml_(correo) + '</p>' +
        '<p><strong>Última compra:</strong> ' + escapeHtml_(idCompra) + '</p>' +
        '<p>Puede ser un alumno con problemas con su tarjeta (escríbele) o alguien probando tarjetas robadas.</p>'
      );
    }
  } catch (e) { /* best-effort */ }
}

/** ¿El cargo de Culqi es una venta exitosa? */
function cargoExitoso_(charge) {
  if (!charge || charge.object !== 'charge') return false;
  const outcome = charge.outcome || {};
  return outcome.type === 'venta_exitosa' || /^AUT/.test(String(outcome.code || ''));
}

/**
 * Pago normalizado (independiente de la pasarela):
 * { id, id_compra, monto (soles), moneda, metodo, correo, exitoso, motivoNoExito,
 *   resumen, proveedor }
 */
function normalizarCargoCulqi_(charge) {
  const exitoso = cargoExitoso_(charge) && !charge.action_code;
  return {
    id: String(charge.id || ''),
    id_compra: String((charge.metadata || {}).id_compra || ''),
    monto: Number(charge.amount) / 100,
    moneda: String(charge.currency_code || ''),
    metodo: metodoDesdeFuente_(charge.source && charge.source.id),
    correo: String(charge.email || ''),
    exitoso: exitoso,
    motivoNoExito: charge.action_code
      ? 'cargo requiere accion: ' + charge.action_code
      : 'cargo no exitoso (' + ((charge.outcome || {}).type || '?') + ')',
    resumen: resumenCulqi_(charge),
    proveedor: 'Culqi'
  };
}

/**
 * Valida un pago normalizado contra la compra (monto y moneda DE LA HOJA).
 * @return {{ok: boolean, motivo?: string, montoDistinto?: boolean}}
 */
function validarPago_(p, idCompra, compra) {
  if (!p.exitoso) return { ok: false, motivo: p.motivoNoExito || 'pago no aprobado' };
  if (String(p.id_compra) !== String(idCompra)) return { ok: false, motivo: 'referencia (id_compra) distinta' };
  if (String(p.moneda) !== 'PEN') return { ok: false, motivo: 'moneda ' + p.moneda };
  const esperado = Math.round(Number(compra.monto) * 100);
  const recibido = Math.round(Number(p.monto) * 100);
  if (recibido !== esperado) {
    return { ok: false, motivo: 'monto ' + (recibido / 100) + ' != esperado ' + (esperado / 100), montoDistinto: true };
  }
  return { ok: true };
}

/** Compatibilidad: procesa un cargo de Culqi. */
function procesarCargoExitoso_(charge, origen) {
  return procesarPagoExitoso_(normalizarCargoCulqi_(charge), origen);
}

/**
 * Procesa un pago aprobado por la pasarela (desde la vuelta del alumno o
 * desde el webhook). Debe llamarse con el lock tomado. Nunca confia en datos
 * del navegador: el monto esperado sale de la hoja.
 * @return {{estado: 'activada'|'ya_activa'|'revision', activacion?: object}}
 */
function procesarPagoExitoso_(p, origen) {
  const idCompra = p.id_compra;
  const prov = p.proveedor;

  const found = RE_ID_COMPRA.test(idCompra) ? getCompra_(idCompra) : null;
  if (!found) {
    const nuevo = registrarPago_({ id_pago: p.id, id_compra: idCompra, monto: p.monto,
      moneda: p.moneda, metodo: p.metodo, estado: 'observado', correo: p.correo,
      respuesta: 'pago sin compra asociada' });
    if (nuevo) {
      notificarAdmin_('[SINAPSIS EDU] ⚠️ Pago sin compra: ' + p.id,
        '<p>' + escapeHtml_(prov) + ' reporta el pago <strong>' + escapeHtml_(p.id) + '</strong> por S/ ' +
        Number(p.monto).toFixed(2) + ' (' + escapeHtml_(p.correo) +
        ') pero no encontramos la compra <code>' + escapeHtml_(idCompra) + '</code>. Revisa en el panel de ' + escapeHtml_(prov) + '.</p>');
    }
    return { estado: 'revision' };
  }
  const compra = found.compra;

  // Mismo pago visto antes → idempotente (p. ej. webhook tras la vuelta del
  // alumno). Si estaba con otro estado (observado, devuelto...), no re-alertar.
  const previo = findPago_(p.id);
  if (previo) {
    if (String(compra.estado_pago) === 'aprobado' && String(previo.estado) === 'aprobado') {
      return { estado: 'ya_activa', activacion: activarCompra_(idCompra, origen, null) };
    }
    return { estado: 'revision' };
  }

  const v = validarPago_(p, idCompra, compra);
  if (!v.ok) {
    registrarPago_({ id_pago: p.id, id_compra: idCompra, monto: p.monto,
      moneda: p.moneda, metodo: p.metodo, estado: 'observado', correo: p.correo, respuesta: v.motivo });
    // Sacar la compra de pendiente_pago: no se reutiliza ni se vuelve a cobrar
    // hasta que el admin la revise (puede aprobarla desde el panel).
    if (String(compra.estado_pago) === ESTADO_PENDIENTE_PAGO) {
      setCellsByHeaders_(SHEET_NAMES.COMPRAS, found.row, { estado_pago: 'en_revision' });
    }
    notificarAdmin_('[SINAPSIS EDU] ⚠️ Pago observado ' + idCompra,
      '<h2 style="color:#10312D">Pago que no pasó las validaciones</h2>' +
      '<p><strong>Compra:</strong> ' + escapeHtml_(idCompra) + ' · <strong>Pago ' + escapeHtml_(prov) + ':</strong> ' + escapeHtml_(p.id) + '</p>' +
      '<p><strong>Motivo:</strong> ' + escapeHtml_(v.motivo) + '</p>' +
      (v.montoDistinto ? '<p style="color:#b45309"><strong>Monto distinto al de la hoja.</strong></p>' : '') +
      '<p>No se activó el acceso. Revisa en ' + escapeHtml_(prov) + ' y decide si apruebas manualmente o devuelves el dinero.</p>');
    log_({ accion: 'procesarPago', nivel: 'warning', detalle: idCompra + ' ' + p.id + ' observado: ' + v.motivo });
    return { estado: 'revision' };
  }

  // Compra ya aprobada con OTRO pago → cobro duplicado.
  if (String(compra.estado_pago) === 'aprobado' && String(compra.id_pago || '') !== String(p.id)) {
    registrarPago_({ id_pago: p.id, id_compra: idCompra, monto: p.monto,
      moneda: 'PEN', metodo: p.metodo, estado: 'duplicado', correo: p.correo, respuesta: 'compra ya aprobada con ' + compra.id_pago });
    notificarAdmin_('[SINAPSIS EDU] ⚠️ Cobro repetido ' + idCompra,
      '<p>La compra <strong>' + escapeHtml_(idCompra) + '</strong> ya estaba aprobada (pago ' +
      escapeHtml_(String(compra.id_pago || 'manual')) + ') y llegó otro pago aprobado <strong>' +
      escapeHtml_(p.id) + '</strong>. Devuelve el dinero desde el panel de ' + escapeHtml_(prov) + '.</p>');
    return { estado: 'ya_activa', activacion: activarCompra_(idCompra, origen, null) };
  }

  if (String(compra.estado_pago) !== ESTADO_PENDIENTE_PAGO && String(compra.estado_pago) !== 'aprobado') {
    registrarPago_({ id_pago: p.id, id_compra: idCompra, monto: p.monto,
      moneda: 'PEN', metodo: p.metodo, estado: 'observado', correo: p.correo,
      respuesta: 'estado de compra ' + compra.estado_pago });
    notificarAdmin_('[SINAPSIS EDU] ⚠️ Pago sobre compra ' + compra.estado_pago + ' ' + idCompra,
      '<p>Llegó el pago aprobado ' + escapeHtml_(p.id) + ' para la compra ' + escapeHtml_(idCompra) +
      ' que está en estado <strong>' + escapeHtml_(String(compra.estado_pago)) + '</strong>. No se activó.</p>');
    return { estado: 'revision' };
  }

  // Nota: no se exige "no expirada" aqui. Si el dinero ya se cobro y todo
  // coincide, se activa (no dejar sin acceso a un alumno que pago).
  registrarPago_({ id_pago: p.id, id_compra: idCompra, monto: p.monto,
    moneda: 'PEN', metodo: p.metodo, estado: 'aprobado', correo: p.correo, respuesta: p.resumen });
  const act = activarCompra_(idCompra, origen, { id: p.id, monto: p.monto });
  return { estado: act.yaAprobada ? 'ya_activa' : 'activada', activacion: act };
}

// ─── Acciones publicas ───────────────────────────────────────

/**
 * iniciarCompra: crea la compra PENDIENTE DE PAGO con el monto fijado por el
 * servidor y devuelve lo que la pasarela activa necesita:
 *   pasarela 'mercadopago' → init_point (URL de Checkout Pro)
 *   pasarela 'culqi'       → publicKey (Checkout v4)
 * Body: { slug, nombre, correo, dni, whatsapp, aceptaTerminos: true, segmentos? }
 */
function iniciarCompra_(req) {
  try {
    const nombre = String(req.nombre || '').trim();
    const correo = String(req.correo || '').trim().toLowerCase();
    const dni = String(req.dni || '').trim();
    const whatsapp = String(req.whatsapp || '').trim().replace(/\s|-/g, '');
    const slug = String(req.slug || '').trim().toLowerCase();

    if (!isEmail_(correo)) return fail_('Correo inválido');
    if (checkRateLimit_('rl_inicio_' + correo)) {
      log_({ accion: 'iniciarCompra', nivel: 'warning', detalle: 'rate limit excedido: ' + correo });
      return fail_('Demasiados intentos. Espera unos minutos.');
    }
    if (!isNonEmptyString_(nombre) || nombre.length < 3 || nombre.length > 120) return fail_('Ingresa tu nombre completo');
    if (!RE_DNI.test(dni)) return fail_('El DNI debe tener 8 dígitos');
    if (!isWhatsapp_(whatsapp)) return fail_('WhatsApp inválido');
    if (req.aceptaTerminos !== true) return fail_('Debes aceptar los Términos y la Política de Privacidad');
    if (!/^[a-z0-9-]{2,40}$/.test(slug)) return fail_('Plataforma no encontrada');

    const pasarela = pasarelaActiva_();
    if (!pasarela) {
      return failCode_('PASARELA_NO_CONFIGURADA', 'Pasarela no configurada',
        'El pago con tarjeta o Yape aún no está disponible. Puedes pagar por voucher.');
    }

    const plat = findPlataformaBySlug_(slug);
    if (!plat) return fail_('Plataforma no encontrada');
    const activo = plat.activo === true || String(plat.activo).toLowerCase() === 'true';
    if (!activo) return fail_('Plataforma no disponible');

    // Monto: SIEMPRE de la hoja. Anatomia se vende por segmento.
    let monto = precioVigente_(plat);
    let detalleExtra = '';
    if (slug === 'anatomia') {
      const segs = Array.isArray(req.segmentos) ? req.segmentos.map(String) : [];
      const unicos = segs.filter(function (s, i) { return segs.indexOf(s) === i && /^[a-z0-9-]{2,40}$/.test(s); });
      if (unicos.length === 0 || unicos.length !== segs.length || unicos.length > MAX_SEGMENTOS_ANATOMIA) {
        return fail_('Elige al menos un segmento válido');
      }
      monto = monto * unicos.length;
      detalleExtra = JSON.stringify({ segmentos: unicos });
    }
    monto = Math.round(monto * 100) / 100;
    if (!isFinite(monto) || monto <= 0) return fail_('Plataforma sin precio configurado');

    ensureColumnas_(SHEET_NAMES.COMPRAS, HEADERS_COMPRAS);
    const userId = upsertUsuario_(nombre, correo, whatsapp, dni);
    const expira = new Date(Date.now() + COMPRA_EXPIRA_MINUTOS * 60 * 1000).toISOString();

    // Reutiliza una compra pendiente_pago vigente identica (evita filas basura
    // si el alumno vuelve atras y reintenta).
    let idCompra = null;
    const compras = readAll_(SHEET_NAMES.COMPRAS);
    for (let i = compras.length - 1; i >= 0; i--) {
      const c = compras[i];
      if (String(c.id_usuario) !== userId) continue;
      if (String(c.id_plataforma) !== String(plat.id_plataforma)) continue;
      if (String(c.estado_pago) !== ESTADO_PENDIENTE_PAGO) continue;
      if (String(c.metodo_pago) !== pasarela) continue;
      if (Number(c.monto) !== monto || String(c.detalle_extra || '') !== detalleExtra) continue;
      if (!(toMillis_(c.expira) > Date.now())) continue;
      idCompra = String(c.id_compra);
      const row = findRowIndex_(SHEET_NAMES.COMPRAS, 1, idCompra);
      setCellsByHeaders_(SHEET_NAMES.COMPRAS, row, { expira: expira, dni: dni, terminos_aceptados: nowIso_() });
      break;
    }

    if (!idCompra) {
      idCompra = nextId_('C', nextSequenceFromColumn_(SHEET_NAMES.COMPRAS, 1));
      appendRowByHeaders_(SHEET_NAMES.COMPRAS, {
        id_compra: idCompra,
        id_usuario: userId,
        id_plataforma: String(plat.id_plataforma),
        monto: monto,
        metodo_pago: pasarela,
        fecha_solicitud: nowIso_(),
        voucher_url: '',
        estado_pago: ESTADO_PENDIENTE_PAGO,
        estado_acceso: 'pendiente',
        detalle_extra: detalleExtra,
        dni: dni,
        expira: expira,
        terminos_aceptados: nowIso_()
      });
    }

    const duracion = Number(plat.duracion_dias) || 30;
    // Culqi: description de 5 a 80 caracteres.
    const descripcion = ('SINAPSIS EDU - ' + String(plat.nombre) + ' (' + duracion + ' dias)').slice(0, 80);

    log_({ accion: 'iniciarCompra', idUsuario: userId, nivel: 'info',
      detalle: idCompra + ' ' + plat.nombre + ' S/' + monto + ' ' + pasarela });

    const base = {
      id_compra: idCompra,
      pasarela: pasarela,
      monto: monto,
      montoCentimos: Math.round(monto * 100),
      moneda: 'PEN',
      descripcion: descripcion,
      plataforma: String(plat.nombre),
      slug: String(plat.slug),
      duracion_dias: duracion,
      expira: expira
    };

    if (pasarela === 'mercadopago') {
      let pref;
      try {
        pref = crearPreferenciaMP_(idCompra, plat, monto, correo, nombre, expira);
      } catch (mpErr) {
        log_({ accion: 'iniciarCompra', idUsuario: userId, nivel: 'error',
          detalle: idCompra + ' ' + (mpErr instanceof Error ? mpErr.message : String(mpErr)) });
        return failCode_('PASARELA_ERROR', 'No pudimos conectar con Mercado Pago',
          'Intenta de nuevo en unos minutos o paga por voucher.');
      }
      base.init_point = pref.url;
      return ok_(base);
    }

    base.publicKey = String(getProperty_('CULQI_PUBLIC_KEY'));
    return ok_(base);
  } catch (err) {
    const detalle = err instanceof Error ? err.message : String(err);
    log_({ accion: 'iniciarCompra', nivel: 'error', detalle: detalle });
    return fail_('Error interno', 'No se pudo iniciar tu compra. Intenta de nuevo.');
  }
}

/**
 * confirmarPago: crea el cargo en Culqi con el monto de la hoja y, si es
 * exitoso y pasa las validaciones, activa la compra.
 * Body: { id_compra, token, correo }
 * Codigos de error (campo `code`): PASARELA_NO_CONFIGURADA, OCUPADO, EXPIRADA,
 * RECHAZADO (mensaje de Culqi para el usuario), REVISION, EN_PROCESO.
 */
function confirmarPago_(req) {
  const idCompra = String(req.id_compra || '').trim();
  const token = String(req.token || '').trim();
  const correo = String(req.correo || '').trim().toLowerCase();

  if (!RE_ID_COMPRA.test(idCompra)) return fail_('Compra no encontrada');
  if (!RE_CULQI_TOKEN.test(token)) return fail_('Pago inválido. Vuelve a intentarlo.');
  if (!isEmail_(correo)) return fail_('Correo inválido');
  if (checkRateLimit_('rl_pago_' + correo, 15)) {
    log_({ accion: 'confirmarPago', nivel: 'warning', detalle: 'rate limit excedido: ' + correo });
    return fail_('Demasiados intentos. Espera unos minutos.');
  }
  if (!culqiConfigurado_()) {
    return failCode_('PASARELA_NO_CONFIGURADA', 'Pasarela no configurada',
      'El pago en línea no está disponible. Puedes pagar por voucher.');
  }

  const lock = LockService.getScriptLock();
  if (!lock.tryLock(20000)) {
    return failCode_('OCUPADO', 'Estamos procesando otro pago. Intenta en unos segundos.');
  }
  try {
    const found = getCompra_(idCompra);
    if (!found) return fail_('Compra no encontrada');
    const compra = found.compra;
    const usuario = getUsuarioById_(compra.id_usuario);
    if (!usuario || String(usuario.correo).toLowerCase() !== correo) return fail_('Compra no encontrada');

    if (String(compra.estado_pago) === 'aprobado') {
      const act = activarCompra_(idCompra, 'culqi', null); // idempotente: solo lee el estado
      return ok_(respuestaActivacion_(act, compra), 'Tu pago ya estaba confirmado.');
    }
    if (String(compra.estado_pago) !== ESTADO_PENDIENTE_PAGO || String(compra.metodo_pago) !== 'culqi') {
      return fail_('Esta compra ya no admite pagos en línea.');
    }
    if (!(toMillis_(compra.expira) > Date.now())) {
      return failCode_('EXPIRADA', 'Tu compra expiró', 'Pasaron más de 30 minutos. Vuelve a empezar; no se te cobró nada.');
    }

    const plat = findPlataformaById_(String(compra.id_plataforma));
    const platNombre = plat ? String(plat.nombre) : String(compra.id_plataforma);
    const montoCentimos = Math.round(Number(compra.monto) * 100);
    const metodo = metodoDesdeFuente_(token);

    let resp;
    try {
      resp = culqiRequest_('post', '/charges', {
        amount: montoCentimos,
        currency_code: 'PEN',
        email: correo,
        source_id: token,
        description: ('SINAPSIS EDU - ' + platNombre).slice(0, 80),
        metadata: { id_compra: idCompra }
      });
    } catch (netErr) {
      // No sabemos si Culqi cobró: el webhook lo resolverá.
      log_({ accion: 'confirmarPago', nivel: 'error', detalle: idCompra + ' error de red con Culqi: ' + netErr });
      notificarAdmin_('[SINAPSIS EDU] ⚠️ Sin respuesta de Culqi ' + idCompra,
        '<p>No hubo respuesta de Culqi al cobrar la compra ' + escapeHtml_(idCompra) +
        '. Si el cargo existe, el webhook lo activará; si no, revisa en el panel de Culqi.</p>');
      return failCode_('EN_PROCESO', 'No pudimos confirmar tu pago todavía',
        'Si se realizó, tu acceso se activará solo y te avisaremos por correo.');
    }

    const body = resp.body || {};
    if ((resp.status === 200 || resp.status === 201) && body.object === 'charge') {
      if (body.action_code) {
        // 3DS: el checkout v4 de fase 1 no completa la autenticacion.
        registrarPago_({ id_pago: body.id || ('3ds-' + Utilities.getUuid()), id_compra: idCompra,
          monto: montoCentimos / 100, metodo: metodo, estado: 'requiere_3ds', correo: correo,
          respuesta: 'action_code=' + body.action_code });
        contarRechazo_(correo, idCompra);
        return failCode_('RECHAZADO',
          'Tu banco pidió una verificación adicional que aún no podemos completar. Prueba con Yape, con otra tarjeta o paga por voucher.');
      }
      const r = procesarCargoExitoso_(body, 'culqi');
      if (r.estado === 'revision') {
        return failCode_('REVISION', 'Recibimos tu pago y lo estamos verificando',
          'Te escribiremos por correo en breve. No vuelvas a pagar.');
      }
      return ok_(respuestaActivacion_(r.activacion, compra), '¡Pago aprobado!');
    }

    // Rechazo / error de Culqi.
    const idIntento = (body.charge_id && RE_CULQI_CHARGE.test(String(body.charge_id)))
      ? String(body.charge_id) : 'rech-' + Utilities.getUuid();
    registrarPago_({ id_pago: idIntento, id_compra: idCompra, monto: montoCentimos / 100,
      metodo: metodo, estado: 'rechazado', correo: correo,
      respuesta: 'HTTP ' + resp.status + ' ' + resumenCulqi_(body) });
    contarRechazo_(correo, idCompra);
    log_({ accion: 'confirmarPago', idUsuario: String(compra.id_usuario), nivel: 'info',
      detalle: idCompra + ' rechazado HTTP ' + resp.status + ' ' + (body.code || '') + ' ' + (body.decline_code || '') });

    if (resp.status === 401 || resp.status >= 500) {
      return failCode_('RECHAZADO', 'No pudimos procesar el pago en este momento. Intenta de nuevo en unos minutos o paga por voucher.');
    }
    const userMsg = isNonEmptyString_(body.user_message)
      ? String(body.user_message).slice(0, 200)
      : 'Tu pago fue rechazado. Revisa los datos o prueba con otro medio.';
    return failCode_('RECHAZADO', userMsg);
  } catch (err) {
    const detalle = err instanceof Error ? err.message : String(err);
    log_({ accion: 'confirmarPago', nivel: 'error', detalle: idCompra + ' ' + detalle });
    return failCode_('EN_PROCESO', 'No pudimos confirmar tu pago todavía',
      'Consulta el estado en unos segundos. Si se realizó, te avisaremos por correo.');
  } finally {
    lock.releaseLock();
  }
}

function respuestaActivacion_(act, compra) {
  return {
    id_compra: act.id_compra,
    estado_pago: 'aprobado',
    fecha_fin: act.fecha_fin,
    plataforma: act.plataforma,
    passwordEnviada: !!act.password_generado,
    correo: act.correo
  };
}

/**
 * estadoCompra: estado actual de una compra (pantalla "en proceso" y
 * recuperacion tras cerrar la pestaña). Body: { id_compra, correo }
 */
function estadoCompra_(req) {
  try {
    const idCompra = String(req.id_compra || '').trim();
    const correo = String(req.correo || '').trim().toLowerCase();
    if (!RE_ID_COMPRA.test(idCompra) || !isEmail_(correo)) return fail_('Compra no encontrada');
    if (checkRateLimit_('rl_estado_' + idCompra, 60)) return fail_('Demasiadas consultas. Espera un momento.');

    const found = getCompra_(idCompra);
    if (!found) return fail_('Compra no encontrada');
    const c = found.compra;
    const usuario = getUsuarioById_(c.id_usuario);
    if (!usuario || String(usuario.correo).toLowerCase() !== correo) return fail_('Compra no encontrada');

    const plat = findPlataformaById_(String(c.id_plataforma));
    const expiraMs = toMillis_(c.expira);
    return ok_({
      id_compra: idCompra,
      estado_pago: String(c.estado_pago || ''),
      estado_acceso: String(c.estado_acceso || ''),
      metodo_pago: String(c.metodo_pago || ''),
      plataforma: plat ? String(plat.nombre) : '',
      slug: plat ? String(plat.slug) : '',
      monto: Number(c.monto) || 0,
      moneda: 'PEN',
      fecha_fin: toIsoDate_(c.fecha_fin) || '',
      expirada: String(c.estado_pago) === ESTADO_PENDIENTE_PAGO && !(expiraMs > Date.now())
    });
  } catch (err) {
    const detalle = err instanceof Error ? err.message : String(err);
    log_({ accion: 'estadoCompra', nivel: 'error', detalle: detalle });
    return fail_('Error interno', 'No se pudo consultar tu compra.');
  }
}

// ─── Webhook de Culqi ────────────────────────────────────────

/** ¿El body de doPost parece un evento de Culqi? (Apps Script no ve cabeceras.) */
function esEventoCulqi_(body) {
  return !!body && body.object === 'event' && typeof body.type === 'string' && !body.action;
}

/**
 * Procesa un evento de Culqi. NUNCA confia en el cuerpo: solo extrae el id
 * del cargo/devolucion y lo RE-CONSULTA a la API con la llave secreta.
 * Siempre responde ok (200) para que Culqi no reintente sin fin.
 */
function webhookCulqi_(evt) {
  const recibido = ok_({ recibido: true });
  try {
    if (checkRateLimit_('rl_webhook_culqi', 300)) {
      log_({ accion: 'webhookCulqi', nivel: 'warning', detalle: 'rate limit de webhook excedido' });
      return recibido;
    }
    if (!culqiConfigurado_()) return recibido;

    let data = evt.data;
    if (typeof data === 'string') { try { data = JSON.parse(data); } catch (e) { data = {}; } }
    data = data || {};
    const type = String(evt.type);
    const objeto = String(data.object || '');

    const esDevolucion = /^refund/.test(type) || objeto === 'refund';
    const esContracargo = /dispute|chargeback|contracargo/i.test(type);

    if (esDevolucion) {
      const refundId = String(data.id || '');
      if (!RE_CULQI_REFUND.test(refundId)) return recibido;
      const r = culqiRequest_('get', '/refunds/' + encodeURIComponent(refundId));
      if (r.status !== 200 || !r.body || !r.body.charge_id) {
        log_({ accion: 'webhookCulqi', nivel: 'warning', detalle: 'devolución no verificable ' + refundId + ' HTTP ' + r.status });
        return recibido;
      }
      conLock_(function () { procesarDevolucion_(String(r.body.charge_id), refundId, Number(r.body.amount) / 100, 'devolucion'); });
      return recibido;
    }

    const chargeId = String(
      (objeto === 'charge' && data.id) || data.charge_id || (data.charge && data.charge.id) || ''
    );
    if (!RE_CULQI_CHARGE.test(chargeId)) {
      log_({ accion: 'webhookCulqi', nivel: 'info', detalle: 'evento ignorado: ' + type });
      return recibido;
    }
    const r = culqiRequest_('get', '/charges/' + encodeURIComponent(chargeId));
    if (r.status !== 200 || !r.body || r.body.object !== 'charge') {
      log_({ accion: 'webhookCulqi', nivel: 'warning', detalle: 'cargo no verificable ' + chargeId + ' HTTP ' + r.status });
      return recibido;
    }

    if (esContracargo) {
      // El cargo existe en Culqi (verificado). Solo actuamos si es nuestro.
      conLock_(function () { procesarDevolucion_(chargeId, 'cb-' + chargeId, Number(r.body.amount) / 100, 'contracargo'); });
      return recibido;
    }

    if (cargoExitoso_(r.body)) {
      // procesarCargoExitoso_ valida monto/moneda/referencia contra la hoja.
      conLock_(function () { procesarCargoExitoso_(r.body, 'webhook'); });
    }
    return recibido;
  } catch (err) {
    const detalle = err instanceof Error ? err.message : String(err);
    log_({ accion: 'webhookCulqi', nivel: 'error', detalle: detalle });
    return recibido;
  }
}

/** Ejecuta fn con el lock del script (20 s). Lanza si no se obtiene. */
function conLock_(fn) {
  const lock = LockService.getScriptLock();
  if (!lock.tryLock(20000)) throw new Error('No se obtuvo el lock');
  try { return fn(); } finally { lock.releaseLock(); }
}

/**
 * Devolución o contracargo verificado: revoca el acceso de la compra pagada
 * con ese cargo, lo registra en Pagos y avisa al admin. Idempotente por id.
 */
function procesarDevolucion_(chargeId, idEvento, monto, tipo) {
  const pago = findPago_(chargeId);
  if (!pago || String(pago.estado) !== 'aprobado') {
    log_({ accion: 'webhookCulqi', nivel: 'info', detalle: tipo + ' de cargo no activado por nosotros: ' + chargeId });
    return;
  }
  const idCompra = String(pago.id_compra);
  const nuevo = registrarPago_({ id_pago: idEvento, id_compra: idCompra, monto: isFinite(monto) ? monto : '',
    moneda: 'PEN', metodo: String(pago.metodo || ''), estado: tipo === 'contracargo' ? 'contracargo' : 'devuelto',
    correo: String(pago.correo || ''), respuesta: tipo + ' de ' + chargeId });
  if (!nuevo) return; // ya procesado

  const found = getCompra_(idCompra);
  if (found) {
    setCellsByHeaders_(SHEET_NAMES.COMPRAS, found.row, {
      estado_pago: tipo === 'contracargo' ? 'contracargo' : 'reembolsado',
      estado_acceso: 'revocado'
    });
  }
  log_({ accion: 'webhookCulqi', nivel: 'warning', detalle: idCompra + ' acceso revocado por ' + tipo + ' ' + chargeId });
  notificarAdmin_('[SINAPSIS EDU] Acceso revocado por ' + tipo + ' — ' + idCompra,
    '<p>Culqi confirmó un(a) <strong>' + escapeHtml_(tipo) + '</strong> del cargo ' + escapeHtml_(chargeId) +
    ' (compra ' + escapeHtml_(idCompra) + ', ' + escapeHtml_(String(pago.correo || '')) + ').</p>' +
    '<p>El acceso de esa compra quedó <strong>revocado</strong>.</p>');
}

// ─── Pasarela Mercado Pago (Checkout Pro por redireccion) ────
//
// Flujo: iniciarCompra crea una PREFERENCIA (monto de la hoja,
// external_reference = id_compra) → el alumno paga en la web de Mercado Pago
// (tarjeta, Yape, saldo) → MP lo devuelve a SITE_URL/pago-retorno.html, que
// redirige a /#/gracias → la web llama confirmarPagoMP → el backend RE-CONSULTA
// el pago a la API de MP y valida todo antes de activar.
// En paralelo llega el webhook (notification_url ?source=mp). Apps Script NO
// puede leer la cabecera x-signature de MP, por eso el aviso nunca se usa como
// verdad: siempre se re-consulta el pago por su id con el Access Token.

const MP_API_BASE = 'https://api.mercadopago.com';
const RE_MP_ID = /^\d{1,20}$/;

function mpConfigurado_() {
  return !!getProperty_('MP_ACCESS_TOKEN');
}

/**
 * Pasarela activa segun Script Property PASARELA ('mercadopago' | 'culqi').
 * Sin PASARELA: Mercado Pago si tiene llave; si no, Culqi si tiene llaves.
 * Devuelve null si la elegida no esta configurada.
 */
function pasarelaActiva_() {
  const elegida = String(getProperty_('PASARELA') || '').trim().toLowerCase();
  if (elegida === 'culqi') return culqiConfigurado_() ? 'culqi' : null;
  if (elegida === 'mercadopago') return mpConfigurado_() ? 'mercadopago' : null;
  if (mpConfigurado_()) return 'mercadopago';
  if (culqiConfigurado_()) return 'culqi';
  return null;
}

/** Llamada autenticada a la API de MP. Nunca loguea el token. */
function mpRequest_(method, path, payload) {
  const token = getProperty_('MP_ACCESS_TOKEN');
  if (!token) throw new Error('MP_ACCESS_TOKEN no configurado');
  const opts = {
    method: method,
    muteHttpExceptions: true,
    headers: { Authorization: 'Bearer ' + token },
    contentType: 'application/json'
  };
  if (payload) {
    opts.payload = JSON.stringify(payload);
    // Evita preferencias duplicadas si UrlFetch reintenta.
    opts.headers['X-Idempotency-Key'] = Utilities.getUuid();
  }
  const res = UrlFetchApp.fetch(MP_API_BASE + path, opts);
  let body = {};
  try { body = JSON.parse(res.getContentText()) || {}; } catch (e) { body = {}; }
  return { status: res.getResponseCode(), body: body };
}

function mpSandbox_() {
  const token = String(getProperty_('MP_ACCESS_TOKEN') || '');
  return token.indexOf('TEST-') === 0 || String(getProperty_('MP_SANDBOX') || '').toLowerCase() === 'true';
}

function siteUrl_() {
  return String(getProperty_('SITE_URL') || 'https://sinapsisedu.com').replace(/\/+$/, '');
}

/** URL publica /exec del Web App (Property WEBAPP_URL o la del servicio). */
function webAppUrl_() {
  const prop = getProperty_('WEBAPP_URL');
  if (prop) return String(prop);
  try { return ScriptApp.getService().getUrl() || ''; } catch (e) { return ''; }
}

/** Fecha en el formato que pide MP: yyyy-MM-dd'T'HH:mm:ss.SSS-05:00 */
function mpFecha_(date) {
  return Utilities.formatDate(date, 'America/Lima', "yyyy-MM-dd'T'HH:mm:ss.SSSXXX");
}

/**
 * Crea la preferencia de Checkout Pro para una compra.
 * @return {{id: string, url: string}}
 */
function crearPreferenciaMP_(idCompra, plat, monto, correo, nombre, expiraIso) {
  const duracion = Number(plat.duracion_dias) || 30;
  const retorno = siteUrl_() + '/pago-retorno.html';
  const notif = webAppUrl_();
  const body = {
    items: [{
      id: String(plat.id_plataforma),
      title: ('SINAPSIS EDU - ' + String(plat.nombre) + ' (' + duracion + ' días)').slice(0, 250),
      description: 'Acceso a la plataforma ' + String(plat.nombre) + ' por ' + duracion + ' días',
      quantity: 1,
      unit_price: Number(monto),
      currency_id: 'PEN'
    }],
    external_reference: idCompra,
    metadata: { id_compra: idCompra },
    back_urls: { success: retorno, pending: retorno, failure: retorno },
    expires: true,
    expiration_date_from: mpFecha_(new Date(Date.now() - 60 * 1000)),
    expiration_date_to: mpFecha_(new Date(expiraIso)),
    statement_descriptor: 'SINAPSIS EDU',
    // Sin cuotas. No se excluye ningun medio (tarjetas, Yape, saldo MP).
    payment_methods: { installments: 1 }
  };
  // En pruebas (MP_SANDBOX=true) NO se envía el correo del alumno: si no es el de un
  // usuario de prueba, MP responde "Una de las partes ... es de prueba".
  if (!mpSandbox_()) body.payer = { email: correo, name: nombre };
  // MP rechaza auto_return si la URL de vuelta no es https (p. ej. localhost en pruebas):
  // en ese caso el alumno vuelve con el botón "Volver al sitio" de Mercado Pago.
  if (/^https:\/\//.test(retorno)) body.auto_return = 'approved';
  if (/^https:\/\//.test(notif)) {
    body.notification_url = notif + (notif.indexOf('?') === -1 ? '?' : '&') + 'source=mp';
  }
  const r = mpRequest_('post', '/checkout/preferences', body);
  if ((r.status !== 200 && r.status !== 201) || !r.body.id) {
    throw new Error('MP preferencia HTTP ' + r.status + ' ' + String(r.body.message || r.body.error || '').slice(0, 150));
  }
  // Con credenciales de usuario de prueba (APP_USR-…) MP pide usar init_point y pagar con
  // la sesión del comprador de prueba; sandbox_init_point solo para tokens TEST- antiguos.
  const tokenTest = String(getProperty_('MP_ACCESS_TOKEN') || '').indexOf('TEST-') === 0;
  const url = tokenTest ? (r.body.sandbox_init_point || r.body.init_point) : (r.body.init_point || r.body.sandbox_init_point);
  if (!url) throw new Error('MP no devolvio init_point');
  return { id: String(r.body.id), url: String(url) };
}

/** Pago de MP → pago normalizado (ver normalizarCargoCulqi_). */
function normalizarPagoMP_(pay) {
  const refund = Number(pay.transaction_amount_refunded) || 0;
  const tipo = String(pay.payment_type_id || '');
  return {
    id: String(pay.id || ''),
    id_compra: String(pay.external_reference || ''),
    monto: Number(pay.transaction_amount),
    moneda: String(pay.currency_id || ''),
    metodo: 'mp-' + (String(pay.payment_method_id || '') === 'yape' ? 'yape' : (tipo || 'otro')),
    correo: String((pay.payer && pay.payer.email) || ''),
    exitoso: String(pay.status) === 'approved' && refund === 0,
    motivoNoExito: 'status ' + pay.status + (refund ? ' con devolucion ' + refund : ''),
    resumen: [pay.status, pay.status_detail, pay.payment_method_id].filter(Boolean).join(' | '),
    proveedor: 'Mercado Pago'
  };
}

/** Mensaje claro para el alumno segun status_detail de un pago rechazado. */
function mensajeRechazoMP_(detalle) {
  const m = {
    cc_rejected_insufficient_amount: 'Tu tarjeta no tiene fondos suficientes.',
    cc_rejected_bad_filled_security_code: 'El código de seguridad (CVV) no es correcto.',
    cc_rejected_bad_filled_date: 'La fecha de vencimiento no es correcta.',
    cc_rejected_bad_filled_card_number: 'El número de tarjeta no es correcto.',
    cc_rejected_bad_filled_other: 'Revisa los datos de tu tarjeta.',
    cc_rejected_call_for_authorize: 'Tu banco necesita que autorices este pago. Llama a tu banco y vuelve a intentarlo.',
    cc_rejected_card_disabled: 'Tu tarjeta no está activa para compras por internet. Actívala con tu banco o usa otro medio.',
    cc_rejected_duplicated_payment: 'Ya hiciste un pago igual hace un momento. Revisa tu correo antes de volver a pagar.',
    cc_rejected_high_risk: 'El pago fue rechazado por seguridad. Prueba con Yape u otro medio.',
    cc_rejected_max_attempts: 'Superaste los intentos permitidos. Prueba con otra tarjeta o con Yape.',
    cc_rejected_blacklist: 'No pudimos procesar el pago con este medio. Prueba con otro.',
    cc_rejected_card_error: 'No se pudo procesar tu tarjeta. Prueba con otra o con Yape.',
    cc_rejected_other_reason: 'Tu banco rechazó el pago. Prueba con otro medio.',
    insufficient_amount: 'No tienes saldo suficiente.',
    required_call_for_authorize: 'Necesitas autorizar el pago con tu banco o Yape.',
    expired: 'El tiempo para pagar se venció. Vuelve a intentarlo.'
  };
  return m[String(detalle || '')] || 'Tu pago no se completó. Prueba de nuevo o con otro medio.';
}

/**
 * Re-consulta un pago de MP por id y actua segun su estado (idempotente).
 * Debe llamarse con el lock tomado.
 * @return {{tipo: 'aprobado'|'ya_activa'|'revision'|'pendiente'|'rechazado'|'devuelto'|'no_encontrado',
 *           pago?: object, activacion?: object, mensaje?: string}}
 */
function procesarPagoMPPorId_(paymentId, origen, payPrevio) {
  let pay = payPrevio;
  if (!pay) {
    const r = mpRequest_('get', '/v1/payments/' + encodeURIComponent(paymentId));
    if (r.status !== 200 || !r.body || !r.body.id) return { tipo: 'no_encontrado' };
    pay = r.body;
  }
  const p = normalizarPagoMP_(pay);
  const status = String(pay.status || '');

  if (status === 'refunded' || status === 'charged_back' || (status === 'approved' && Number(pay.transaction_amount_refunded) > 0)) {
    const tipo = status === 'charged_back' ? 'contracargo' : 'devolucion';
    procesarDevolucion_(p.id, 'mp-' + tipo + '-' + p.id, Number(pay.transaction_amount_refunded) || p.monto, tipo);
    return { tipo: 'devuelto', pago: p };
  }
  if (status === 'approved') {
    const res = procesarPagoExitoso_(p, origen);
    return { tipo: res.estado === 'revision' ? 'revision' : (res.estado === 'ya_activa' ? 'ya_activa' : 'aprobado'),
      pago: p, activacion: res.activacion };
  }
  if (status === 'in_mediation') {
    notificarAdmin_('[SINAPSIS EDU] ⚠️ Pago en disputa ' + p.id_compra,
      '<p>El pago ' + escapeHtml_(p.id) + ' (compra ' + escapeHtml_(p.id_compra) + ') está en mediación en Mercado Pago. Revísalo en el panel.</p>');
    return { tipo: 'pendiente', pago: p };
  }
  if (status === 'pending' || status === 'in_process' || status === 'authorized') {
    return { tipo: 'pendiente', pago: p };
  }
  // rejected / cancelled
  const nuevo = registrarPago_({ id_pago: p.id, id_compra: p.id_compra, monto: p.monto, moneda: p.moneda,
    metodo: p.metodo, estado: 'rechazado', correo: p.correo, respuesta: p.resumen });
  if (nuevo && p.correo) contarRechazo_(String(p.correo).toLowerCase(), p.id_compra);
  return { tipo: 'rechazado', pago: p, mensaje: mensajeRechazoMP_(pay.status_detail) };
}

/**
 * confirmarPagoMP: la web lo llama al volver de Mercado Pago.
 * Body: { id_compra, payment_id, correo }
 * Codigos (campo `code`): RECHAZADO, EN_PROCESO, REVISION, OCUPADO, PASARELA_NO_CONFIGURADA.
 */
/**
 * Sesión automática tras un pago aprobado hace menos de 2 h (ventana corta:
 * el enlace de vuelta con payment_id puede quedar en el historial).
 * Devuelve { token, usuario } o null.
 */
function sesionTrasPago_(usuario, fechaAprobacion) {
  const t = fechaAprobacion ? new Date(fechaAprobacion).getTime() : NaN;
  if (!isFinite(t) || Date.now() - t > 2 * 3600 * 1000) return null;
  const token = createSession_({
    id_usuario: String(usuario.id_usuario),
    correo: String(usuario.correo),
    nombre: String(usuario.nombre)
  });
  log_({ accion: 'sesionTrasPago', idUsuario: String(usuario.id_usuario), nivel: 'info', detalle: 'login automatico tras pago' });
  return { token: token, usuario: { nombre: String(usuario.nombre), correo: String(usuario.correo) } };
}

/** "yubert.c@gmail.com" → "yu•••@gmail.com" */
function enmascararCorreo_(correo) {
  const s = String(correo || '');
  const at = s.indexOf('@');
  if (at < 1) return '';
  return s.slice(0, Math.min(2, at)) + '•••' + s.slice(at);
}

function confirmarPagoMP_(req) {
  const idCompra = String(req.id_compra || '').trim();
  const paymentId = String(req.payment_id || '').trim();
  const correo = String(req.correo || '').trim().toLowerCase();

  // El correo es opcional: si el alumno vuelve en otro navegador/dispositivo
  // (app de MP en el celular, pestaña cerrada) no lo tenemos guardado. En ese
  // caso la prueba es el payment_id, que MP solo entrega a quien pagó, y debe
  // pertenecer a ESTA compra (external_reference). La respuesta enmascara el correo.
  if (!RE_ID_COMPRA.test(idCompra) || (correo && !isEmail_(correo))) return fail_('Compra no encontrada');
  if (!RE_MP_ID.test(paymentId)) return fail_('Pago no encontrado');
  if (checkRateLimit_('rl_pagomp_' + idCompra, 30)) return fail_('Demasiadas consultas. Espera un momento.');
  if (!mpConfigurado_()) return failCode_('PASARELA_NO_CONFIGURADA', 'Pasarela no configurada');

  const found = getCompra_(idCompra);
  if (!found) return fail_('Compra no encontrada');
  const usuario = getUsuarioById_(found.compra.id_usuario);
  if (!usuario || (correo && String(usuario.correo).toLowerCase() !== correo)) return fail_('Compra no encontrada');

  const lock = LockService.getScriptLock();
  if (!lock.tryLock(20000)) return failCode_('OCUPADO', 'Estamos procesando tu pago. Consulta de nuevo en unos segundos.');
  try {
    // El pago debe pertenecer a ESTA compra antes de procesar nada.
    const pre = mpRequest_('get', '/v1/payments/' + encodeURIComponent(paymentId));
    if (pre.status !== 200 || String((pre.body || {}).external_reference || '') !== idCompra) {
      return fail_('Pago no encontrado');
    }
    const r = procesarPagoMPPorId_(paymentId, 'mercadopago', pre.body);
    if (r.tipo === 'aprobado' || r.tipo === 'ya_activa') {
      const resp = respuestaActivacion_(r.activacion, found.compra);
      if (!correo) resp.correo = enmascararCorreo_(resp.correo);
      else {
        // Mismo navegador (correo guardado + payment_id) y pago reciente: el alumno
        // entra directo al Portal sin esperar el correo con la contraseña.
        const sesion = sesionTrasPago_(usuario, (pre.body || {}).date_approved);
        if (sesion) resp.sesion = sesion;
      }
      return ok_(resp, '¡Pago aprobado!');
    }
    if (r.tipo === 'pendiente') {
      return failCode_('EN_PROCESO', 'Tu pago está en proceso',
        'Mercado Pago lo está confirmando. Te avisaremos por correo apenas se apruebe.');
    }
    if (r.tipo === 'rechazado') return failCode_('RECHAZADO', r.mensaje);
    if (r.tipo === 'revision') {
      return failCode_('REVISION', 'Recibimos tu pago y lo estamos verificando',
        'Te escribiremos por correo en breve. No vuelvas a pagar.');
    }
    if (r.tipo === 'devuelto') return fail_('Este pago fue devuelto.');
    return fail_('Pago no encontrado');
  } catch (err) {
    const detalle = err instanceof Error ? err.message : String(err);
    log_({ accion: 'confirmarPagoMP', nivel: 'error', detalle: idCompra + ' ' + detalle });
    return failCode_('EN_PROCESO', 'No pudimos confirmar tu pago todavía',
      'Si se realizó, tu acceso se activará solo y te avisaremos por correo.');
  } finally {
    lock.releaseLock();
  }
}

/**
 * Webhook / IPN de Mercado Pago. Llega a /exec?source=mp con:
 *   query:  type=payment&data.id=123   (Webhooks)  o  topic=payment&id=123 (IPN)
 *   cuerpo: { action, type, data: { id } }
 * NUNCA confia en el aviso: re-consulta el recurso con el Access Token.
 * Siempre responde ok rapido (MP reintenta si no recibe 200/201 en 22 s).
 */
function webhookMP_(params, body) {
  const recibido = ok_({ recibido: true });
  try {
    if (!mpConfigurado_()) return recibido;
    if (checkRateLimit_('rl_webhook_mp', 300)) {
      log_({ accion: 'webhookMP', nivel: 'warning', detalle: 'rate limit de webhook excedido' });
      return recibido;
    }
    params = params || {};
    body = body || {};
    const tipo = String(body.type || params.type || params.topic || body.topic || '');
    const id = String((body.data && body.data.id) || params['data.id'] || params.id || body.id || '');
    if (!RE_MP_ID.test(id)) {
      log_({ accion: 'webhookMP', nivel: 'info', detalle: 'aviso ignorado tipo=' + tipo });
      return recibido;
    }

    if (tipo === 'payment') {
      conLock_(function () { procesarPagoMPPorId_(id, 'webhook'); });
    } else if (tipo === 'merchant_order' || tipo === 'topic_merchant_order_wh') {
      const mo = mpRequest_('get', '/merchant_orders/' + encodeURIComponent(id));
      const pagos = (mo.status === 200 && mo.body && Array.isArray(mo.body.payments)) ? mo.body.payments : [];
      pagos.slice(0, 5).forEach(function (pg) {
        if (pg && RE_MP_ID.test(String(pg.id))) {
          conLock_(function () { procesarPagoMPPorId_(String(pg.id), 'webhook'); });
        }
      });
    } else if (/chargeback/.test(tipo)) {
      // El pago afectado tambien llega como payment (status charged_back),
      // que es lo que revoca. Aqui solo avisamos.
      notificarAdmin_('[SINAPSIS EDU] ⚠️ Aviso de contracargo en Mercado Pago',
        '<p>Mercado Pago avisó un contracargo (id ' + escapeHtml_(id) + '). Revisa el panel de Mercado Pago.</p>');
    } else {
      log_({ accion: 'webhookMP', nivel: 'info', detalle: 'tipo no manejado: ' + tipo });
    }
    return recibido;
  } catch (err) {
    const detalle = err instanceof Error ? err.message : String(err);
    log_({ accion: 'webhookMP', nivel: 'error', detalle: detalle });
    return recibido;
  }
}

/**
 * EDITOR-ONLY: verifica la configuracion de Mercado Pago sin imprimir secretos.
 */
function testMPConfig() {
  requireEditor_();
  const token = String(getProperty_('MP_ACCESS_TOKEN') || '');
  const pk = String(getProperty_('MP_PUBLIC_KEY') || '');
  const result = {
    MP_ACCESS_TOKEN: token ? (/^(TEST-|APP_USR-)/.test(token) ? 'ok (' + token.split('-')[0] + ')' : 'formato raro') : 'FALTA',
    MP_PUBLIC_KEY: pk ? 'ok (no se usa en Checkout Pro)' : 'falta (opcional)',
    PASARELA: getProperty_('PASARELA') || '(vacía → mercadopago si hay token)',
    pasarelaActiva: pasarelaActiva_(),
    modoSandbox: mpSandbox_(),
    SITE_URL: siteUrl_(),
    back_url: siteUrl_() + '/pago-retorno.html',
    notification_url: webAppUrl_() ? webAppUrl_() + '?source=mp' : 'NO DISPONIBLE: define WEBAPP_URL con la URL /exec',
    apiResponde: null,
    cuenta: null
  };
  if (token) {
    try {
      const r = mpRequest_('get', '/users/me');
      result.apiResponde = r.status === 200 ? 'ok (HTTP 200)' : 'HTTP ' + r.status + (r.status === 401 ? ' — token inválido' : '');
      if (r.status === 200) result.cuenta = { site_id: r.body.site_id, nickname: r.body.nickname };
    } catch (e) {
      result.apiResponde = 'error de red: ' + (e instanceof Error ? e.message : String(e));
    }
  }
  result.siguiente = 'Si todo dice ok: Implementar → Gestionar implementaciones → Nueva versión.';
  Logger.log(JSON.stringify(result, null, 2));
  return result;
}

/**
 * EDITOR-ONLY: últimos pagos recibidos en Mercado Pago con el MOTIVO del
 * rechazo (status_detail). Sirve para diagnosticar "No pudimos procesar tu pago".
 * No imprime datos de tarjeta; el correo del pagador sale enmascarado.
 */
function ultimosPagosMP() {
  requireEditor_();
  const yo = mpRequest_('get', '/users/me');
  const miId = yo.status === 200 ? yo.body.id : null;
  const r = mpRequest_('get', '/v1/payments/search?sort=date_created&criteria=desc&limit=8');
  const pagos = ((r.body && r.body.results) || []).map(function (p) {
    return {
      id: p.id, fecha: p.date_created, monto: p.transaction_amount,
      estado: p.status, motivo: p.status_detail,
      medio: p.payment_method_id + ' / ' + p.payment_type_id,
      compra: p.external_reference,
      pagadorEsElVendedor: !!(miId && p.payer && String(p.payer.id) === String(miId)),
      pagador: p.payer && p.payer.email ? enmascararCorreo_(p.payer.email) : null
    };
  });
  const b = yo.body || {};
  const cuenta = {
    id: miId, correo: b.email ? enmascararCorreo_(b.email) : null, pais: b.site_id,
    tipo: b.user_type, estado: b.status && b.status.site_status,
    puedeCobrar: b.status && b.status.sell, verificacion: b.status && b.status.confirmed_email,
    identidad: b.identification ? b.identification.type : null
  };
  Logger.log(JSON.stringify({ cuenta: cuenta, http: r.status, pagos: pagos }, null, 2));
  return pagos;
}

// ─── Editor: verificacion de llaves ──────────────────────────

/**
 * EDITOR-ONLY: verifica que las llaves de Culqi existan, sean del mismo
 * entorno y que la secreta sea aceptada por la API. NUNCA imprime las llaves.
 */
function testCulqiConfig() {
  requireEditor_();
  const pk = getProperty_('CULQI_PUBLIC_KEY') || '';
  const sk = getProperty_('CULQI_SECRET_KEY') || '';
  const result = {
    CULQI_PUBLIC_KEY: pk ? (/^pk_(test|live)_/.test(pk) ? 'ok (' + pk.split('_')[1] + ')' : 'formato raro') : 'FALTA',
    CULQI_SECRET_KEY: sk ? (/^sk_(test|live)_/.test(sk) ? 'ok (' + sk.split('_')[1] + ')' : 'formato raro') : 'FALTA',
    mismoEntorno: !!pk && !!sk && pk.split('_')[1] === sk.split('_')[1],
    apiResponde: null
  };
  if (sk) {
    try {
      const r = culqiRequest_('get', '/charges?limit=1');
      result.apiResponde = r.status === 200 ? 'ok (HTTP 200)' : 'HTTP ' + r.status + (r.status === 401 ? ' — llave secreta inválida' : '');
    } catch (e) {
      result.apiResponde = 'error de red: ' + (e instanceof Error ? e.message : String(e));
    }
  }
  result.siguiente = 'Si todo dice ok: Implementar → Gestionar implementaciones → Nueva versión.';
  Logger.log(JSON.stringify(result, null, 2));
  return result;
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
      '51989855026',
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
    case 'campanaActual':            return campanaActual_();
    case 'registrarCompra':          return registrarCompra_(req);
    case 'subirVoucher':             return subirVoucher_(req);
    case 'loginAlumno':              return loginAlumno_(req);
    case 'misAccesos':               return misAccesos_(req);
    case 'misSolicitudes':           return misSolicitudes_(req);
    case 'obtenerUrlPlataforma':     return obtenerUrlPlataforma_(req);
    case 'recuperarPassword':        return recuperarPassword_(req);
    case 'iniciarCompra':            return iniciarCompra_(req);
    case 'confirmarPago':            return confirmarPago_(req);
    case 'estadoCompra':             return estadoCompra_(req);
    case 'confirmarPagoMP':          return confirmarPagoMP_(req);
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

  // IPN de Mercado Pago por GET (formato antiguo ?topic=payment&id=…).
  if (params.source === 'mp') {
    return jsonResponse_(webhookMP_(params, {}));
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
  // Webhook/IPN de Mercado Pago: notification_url lleva ?source=mp. El aviso
  // NO se usa como verdad (Apps Script no puede leer x-signature): se
  // re-consulta el pago a la API.
  const qp = (e && e.parameter) ? e.parameter : {};
  if (qp.source === 'mp') {
    let cuerpo = {};
    try { cuerpo = JSON.parse((e.postData && e.postData.contents) || '{}') || {}; } catch (err) { cuerpo = {}; }
    return jsonResponse_(webhookMP_(qp, cuerpo));
  }

  let req;
  try {
    const raw = (e && e.postData && e.postData.contents) ? e.postData.contents : '{}';
    req = JSON.parse(raw);
  } catch (err) {
    return jsonResponse_(fail_('JSON invalido en el body'));
  }

  // Webhook de Culqi: se reconoce por la forma del cuerpo (Apps Script no
  // expone cabeceras). El cuerpo NO se usa como verdad: se re-consulta la API.
  if (esEventoCulqi_(req)) {
    return jsonResponse_(webhookCulqi_(req));
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
// #9 (2026-11-11) Pasarela Culqi fase 1: iniciarCompra / confirmarPago /
//    estadoCompra + webhook. Precio SIEMPRE de la hoja; llave secreta solo en
//    Script Properties; tokens y llaves nunca se loguean; cargos validados
//    (monto, PEN, metadata.id_compra, exito, id unico en hoja Pagos) bajo
//    LockService; webhooks re-consultados a la API. activarCompra_ es la unica
//    logica de activacion (la usa tambien aprobarPago_ del admin).

/**
 * PRUEBA DE PUNTA A PUNTA SIN NAVEGADOR (solo con credenciales de PRUEBA).
 * Crea una compra, cobra con la tarjeta de prueba APRO por la API de Mercado Pago
 * (sin dinero real) y pasa el pago por la MISMA verificación y activación que usa
 * la web (confirmarPagoMP_). Ejecutar desde el editor y leer el registro.
 */
function pruebaPagoMPCompleta() {
  requireEditor_();
  if (!mpSandbox_()) throw new Error('Solo en modo prueba: define MP_SANDBOX=true.');
  const log = function (t, o) { Logger.log(t + (o === undefined ? '' : ' ' + JSON.stringify(o))); };
  const correo = 'alumno.prueba.api@example.com';

  // 1) Compra pendiente (precio desde la hoja).
  const ini = iniciarCompra_({ slug: 'enam', nombre: 'Alumno Prueba API', correo: correo,
    dni: '12345678', whatsapp: '987654321', aceptaTerminos: true });
  log('1. iniciarCompra:', ini.ok ? { id: ini.data.id_compra, monto: ini.data.monto } : ini);
  if (!ini.ok) return;
  const idCompra = ini.data.id_compra;

  // 2) Token de la tarjeta de prueba (titular APRO = aprobado).
  const pk = getProperty_('MP_PUBLIC_KEY');
  const tok = mpRequest_('post', '/v1/card_tokens' + (pk ? '?public_key=' + encodeURIComponent(pk) : ''), {
    card_number: '5031755734530604', expiration_month: 11, expiration_year: 2030,
    security_code: '123', cardholder: { name: 'APRO', identification: { type: 'DNI', number: '12345678' } }
  });
  log('2. card_token HTTP ' + tok.status, tok.body.id ? 'ok' : tok.body);
  if (!tok.body.id) return;

  // 3) Pago (con external_reference = id de la compra, igual que Checkout Pro).
  const notif = webAppUrl_();
  const emails = ['test_user_' + Date.now() + '@testuser.com', 'comprador.prueba@example.com'];
  let pay = null;
  for (let i = 0; i < emails.length; i++) {
    const body = {
      transaction_amount: Number(ini.data.monto), token: tok.body.id, installments: 1,
      payment_method_id: 'master', description: ini.data.descripcion,
      external_reference: idCompra, payer: { email: emails[i] }
    };
    if (/^https:\/\//.test(notif)) body.notification_url = notif + '?source=mp';
    pay = mpRequest_('post', '/v1/payments', body);
    log('3. pago (payer ' + emails[i] + ') HTTP ' + pay.status,
      { id: pay.body.id, status: pay.body.status, detail: pay.body.status_detail, msg: pay.body.message });
    if (pay.body.id) break;
  }
  if (!pay || !pay.body.id) return;

  // 4) Misma confirmación que usa la web al volver de Mercado Pago.
  const conf = confirmarPagoMP_({ id_compra: idCompra, payment_id: String(pay.body.id), correo: correo });
  log('4. confirmarPagoMP:', conf);

  // 5) Repetir la confirmación: debe ser idempotente (no activar dos veces).
  const conf2 = confirmarPagoMP_({ id_compra: idCompra, payment_id: String(pay.body.id), correo: correo });
  log('5. confirmar otra vez (idempotencia):', conf2);

  // 6) Estado final.
  log('6. estadoCompra:', estadoCompra_({ id_compra: idCompra, correo: correo }));
}
