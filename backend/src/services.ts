/**
 * services.ts — Acceso a Google APIs (Sheets, Drive, Gmail, Properties, Logs).
 *
 * Implementación Fase 1. Sin import/export — todo global en Apps Script.
 *
 * Diseño: las integraciones futuras (OCR, Binance, Stripe, WhatsApp Cloud API)
 * tienen placeholders que devuelven `null` si la Property correspondiente
 * no existe. Activarlas será solo agregar la variable.
 */

// ─── Constantes ──────────────────────────────────────────────

const SHEET_NAMES = {
  PLATAFORMAS: 'Plataformas',
  USUARIOS: 'Usuarios',
  COMPRAS: 'Compras',
  LOGS: 'Logs',
} as const;

const HEADERS_PLATAFORMAS: ReadonlyArray<string> = [
  'id_plataforma',
  'nombre',
  'slug',
  'descripcion',
  'url_real',
  'precio',
  'duracion_dias',
  'activo',
];

const HEADERS_USUARIOS: ReadonlyArray<string> = [
  'id_usuario',
  'nombre',
  'correo',
  'whatsapp',
  'password_hash',
  'password_salt',
  'fecha_registro',
  'estado',
];

const HEADERS_COMPRAS: ReadonlyArray<string> = [
  'id_compra',
  'id_usuario',
  'id_plataforma',
  'monto',
  'metodo_pago',
  'fecha_solicitud',
  'voucher_url',
  'estado_pago',
  'fecha_aprobacion',
  'fecha_inicio',
  'fecha_fin',
  'estado_acceso',
];

const HEADERS_LOGS: ReadonlyArray<string> = [
  'timestamp',
  'accion',
  'id_usuario',
  'nivel',
  'detalle',
];

const REQUIRED_PROPS: ReadonlyArray<string> = [
  'SHEET_ID',
  'DRIVE_FOLDER_VOUCHERS',
  'ADMIN_EMAIL',
  'NOTIFICACION_EMAIL',
  'SESSION_SECRET',
  'WHATSAPP_NUMBER',
];

// ─── Properties ──────────────────────────────────────────────

function getProperty(key: string): string | undefined {
  const v = PropertiesService.getScriptProperties().getProperty(key);
  return v === null ? undefined : v;
}

function setProperty(key: string, value: string): void {
  PropertiesService.getScriptProperties().setProperty(key, value);
}

function getRequired(key: string): string {
  const v = getProperty(key);
  if (!v) throw new Error(`Falta la Property requerida: ${key}. Corre setup() primero.`);
  return v;
}

function checkRequiredProperties(): string[] {
  const missing: string[] = [];
  for (let i = 0; i < REQUIRED_PROPS.length; i++) {
    if (!getProperty(REQUIRED_PROPS[i])) missing.push(REQUIRED_PROPS[i]);
  }
  return missing;
}

// ─── Sheets ──────────────────────────────────────────────────

function getSpreadsheet(): GoogleAppsScript.Spreadsheet.Spreadsheet {
  return SpreadsheetApp.openById(getRequired('SHEET_ID'));
}

function getSheet(name: string): GoogleAppsScript.Spreadsheet.Sheet {
  const ss = getSpreadsheet();
  const sheet = ss.getSheetByName(name);
  if (!sheet) throw new Error(`Hoja no encontrada: ${name}. Corre setup() primero.`);
  return sheet;
}

function ensureSheet(
  ss: GoogleAppsScript.Spreadsheet.Spreadsheet,
  name: string,
  headers: ReadonlyArray<string>,
): { sheet: GoogleAppsScript.Spreadsheet.Sheet; created: boolean } {
  let sheet = ss.getSheetByName(name);
  let created = false;
  if (!sheet) {
    sheet = ss.insertSheet(name);
    created = true;
  }
  // Siempre fuerza los headers en la fila 1 (idempotente).
  const range = sheet.getRange(1, 1, 1, headers.length);
  range.setValues([headers.slice()]);
  range.setFontWeight('bold');
  range.setBackground('#10312D');
  range.setFontColor('#C2E476');
  sheet.setFrozenRows(1);
  return { sheet, created };
}

function inicializarSheets(): {
  spreadsheetId: string;
  spreadsheetUrl: string;
  sheets: Array<{ name: string; created: boolean }>;
  seeded: boolean;
} {
  const ss = getSpreadsheet();

  const r1 = ensureSheet(ss, SHEET_NAMES.PLATAFORMAS, HEADERS_PLATAFORMAS);
  const r2 = ensureSheet(ss, SHEET_NAMES.USUARIOS, HEADERS_USUARIOS);
  const r3 = ensureSheet(ss, SHEET_NAMES.COMPRAS, HEADERS_COMPRAS);
  const r4 = ensureSheet(ss, SHEET_NAMES.LOGS, HEADERS_LOGS);

  // Borra la hoja "Sheet1" / "Hoja 1" por defecto si quedó vacía.
  const candidatos = ['Sheet1', 'Hoja 1', 'Hoja1'];
  for (let i = 0; i < candidatos.length; i++) {
    const def = ss.getSheetByName(candidatos[i]);
    if (def && ss.getSheets().length > 1) {
      const lastRow = def.getLastRow();
      const lastCol = def.getLastColumn();
      if (lastRow === 0 || (lastRow <= 1 && lastCol <= 1)) {
        try { ss.deleteSheet(def); } catch (_) { /* ignorar */ }
      }
    }
  }

  // Seed plataformas si la hoja está vacía (solo headers).
  let seeded = false;
  const plat = ss.getSheetByName(SHEET_NAMES.PLATAFORMAS)!;
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
      { name: SHEET_NAMES.LOGS, created: r4.created },
    ],
    seeded,
  };
}

function seedPlataformas(sheet: GoogleAppsScript.Spreadsheet.Sheet): void {
  // Para el MVP de prueba, las 6 plataformas apuntan al mismo URL (ver CLAUDE.md §1).
  const URL_DEMO = 'https://canazachyub.github.io/simulaencib/';
  const data: Array<Array<string | number | boolean>> = [
    ['P-001', 'ENAM', 'enam',
      'Examen Nacional de Medicina. Banco de preguntas con justificaciones y simulacros cronometrados.',
      URL_DEMO, 49, 30, true],
    ['P-002', 'ENCIB', 'encib',
      'Examen Nacional de Ciencias Básicas. Más de 1500 preguntas explicadas, organizadas por curso.',
      URL_DEMO, 49, 30, true],
    ['P-003', 'ENCAPS', 'encaps',
      'Evaluación Nacional de Capacidades Clínicas. Casos clínicos con retroalimentación detallada.',
      URL_DEMO, 49, 30, true],
    ['P-004', 'Residentado Médico', 'rm',
      'Preparación integral para el examen de residentado. Cobertura por especialidades.',
      URL_DEMO, 79, 30, true],
    ['P-005', 'EsSalud', 'essalud',
      'Plataforma para concursos EsSalud y SERUMS. Material actualizado y simulacros.',
      URL_DEMO, 59, 30, true],
    ['P-006', 'Biblioteca Médica', 'biblioteca',
      'Acceso a libros, guías clínicas y material complementario para tu carrera médica.',
      URL_DEMO, 39, 30, true],
  ];
  sheet.getRange(2, 1, data.length, data[0].length).setValues(data);
}

/** Lee toda la hoja como array de objetos usando la primera fila como claves. */
function readAll<T = Record<string, unknown>>(sheetName: string): T[] {
  const sheet = getSheet(sheetName);
  const lastRow = sheet.getLastRow();
  const lastCol = sheet.getLastColumn();
  if (lastRow < 2) return [];
  const values = sheet.getRange(1, 1, lastRow, lastCol).getValues();
  const headers = values[0] as string[];
  const rows: T[] = [];
  for (let i = 1; i < values.length; i++) {
    const row = values[i];
    const obj: Record<string, unknown> = {};
    for (let j = 0; j < headers.length; j++) {
      obj[String(headers[j])] = row[j];
    }
    rows.push(obj as T);
  }
  return rows;
}

/** Devuelve el siguiente número correlativo a partir de IDs tipo `P-001`. */
function nextSequenceFromColumn(sheetName: string, columnIndex: number): number {
  const sheet = getSheet(sheetName);
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return 0;
  const values = sheet.getRange(2, columnIndex, lastRow - 1, 1).getValues();
  let max = 0;
  for (let i = 0; i < values.length; i++) {
    const id = String(values[i][0] ?? '');
    const m = id.match(/-(\d+)$/);
    if (m) {
      const n = parseInt(m[1], 10);
      if (!isNaN(n) && n > max) max = n;
    }
  }
  return max;
}

// ─── Drive ───────────────────────────────────────────────────

function getCarpetaVouchers(): GoogleAppsScript.Drive.Folder {
  return DriveApp.getFolderById(getRequired('DRIVE_FOLDER_VOUCHERS'));
}

function subirVoucherDrive(
  base64: string,
  mime: string,
  filename: string,
): { fileId: string; fileUrl: string } {
  const blob = Utilities.newBlob(Utilities.base64Decode(base64), mime, filename);
  const folder = getCarpetaVouchers();
  const file = folder.createFile(blob);
  // Aseguramos que la carpeta y los archivos sean privados.
  try {
    file.setSharing(DriveApp.Access.PRIVATE, DriveApp.Permission.NONE);
  } catch (_) { /* algunos workspaces ya lo restringen por política */ }
  return { fileId: file.getId(), fileUrl: file.getUrl() };
}

// ─── Gmail ───────────────────────────────────────────────────

function notificarAdmin(asunto: string, cuerpoHtml: string): void {
  const to = getProperty('NOTIFICACION_EMAIL') ?? getProperty('ADMIN_EMAIL');
  if (!to) {
    Logger.log(`notificarAdmin: sin destinatario configurado. Asunto: ${asunto}`);
    return;
  }
  MailApp.sendEmail({ to, subject: asunto, htmlBody: cuerpoHtml });
}

function enviarCorreo(to: string, asunto: string, cuerpoHtml: string): void {
  MailApp.sendEmail({ to, subject: asunto, htmlBody: cuerpoHtml });
}

// ─── Logs ────────────────────────────────────────────────────

function log(ctx: LogContext): void {
  try {
    const sheetId = getProperty('SHEET_ID');
    if (!sheetId) {
      Logger.log(`[log] SHEET_ID no configurado | ${JSON.stringify(ctx)}`);
      return;
    }
    const sheet = SpreadsheetApp.openById(sheetId).getSheetByName(SHEET_NAMES.LOGS);
    if (!sheet) {
      Logger.log(`[log] hoja Logs no existe | ${JSON.stringify(ctx)}`);
      return;
    }
    sheet.appendRow([
      new Date().toISOString(),
      ctx.accion,
      ctx.idUsuario ?? '',
      ctx.nivel ?? 'info',
      ctx.detalle ?? '',
    ]);
  } catch (err) {
    Logger.log(`[log fallido] ${err} | ${JSON.stringify(ctx)}`);
  }
}

// ─── setup() — instalador idempotente ────────────────────────

interface SetupResult {
  ok: boolean;
  spreadsheet: { id: string; url: string; created: boolean };
  driveFolder: { id: string; url: string; created: boolean };
  sheets: Array<{ name: string; created: boolean }>;
  seeded: boolean;
  properties: { added: string[]; existing: string[] };
  next: string;
}

/**
 * Instala todo lo necesario en una sola corrida desde el editor de Apps Script:
 *  1. Crea (o reutiliza) el Spreadsheet PortalCentral_DB.
 *  2. Crea (o reutiliza) la carpeta de Drive para vouchers.
 *  3. Inicializa las 4 hojas con headers y siembra Plataformas.
 *  4. Genera SESSION_SECRET aleatorio si falta.
 *  5. Configura ADMIN_EMAIL/NOTIFICACION_EMAIL con el correo del usuario activo.
 *  6. Setea defaults (WHATSAPP_NUMBER=51984300510, RATE_LIMIT_PER_HOUR=10).
 *
 * Es idempotente: correr setup() varias veces no duplica datos.
 */
function setup(): SetupResult {
  const props = PropertiesService.getScriptProperties();
  const added: string[] = [];
  const existing: string[] = [];

  // 1. Spreadsheet
  let sheetId = props.getProperty('SHEET_ID');
  let sheetCreated = false;
  let spreadsheet: GoogleAppsScript.Spreadsheet.Spreadsheet;
  if (!sheetId) {
    spreadsheet = SpreadsheetApp.create('PortalCentral_DB');
    sheetId = spreadsheet.getId();
    props.setProperty('SHEET_ID', sheetId);
    added.push('SHEET_ID');
    sheetCreated = true;
  } else {
    spreadsheet = SpreadsheetApp.openById(sheetId);
    existing.push('SHEET_ID');
  }

  // 2. Drive folder
  let folderId = props.getProperty('DRIVE_FOLDER_VOUCHERS');
  let folderCreated = false;
  let folder: GoogleAppsScript.Drive.Folder;
  if (!folderId) {
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
  } catch (_) { /* sin permiso, dejará vacío */ }

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
    props.setProperty('WHATSAPP_NUMBER', '51984300510');
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
    detalle: `sheetCreated=${sheetCreated} folderCreated=${folderCreated} seeded=${init.seeded} added=[${added.join(',')}]`,
  });

  return {
    ok: true,
    spreadsheet: { id: sheetId, url: spreadsheet.getUrl(), created: sheetCreated },
    driveFolder: { id: folderId, url: folder.getUrl(), created: folderCreated },
    sheets: init.sheets,
    seeded: init.seeded,
    properties: { added, existing },
    next: 'Despliega el Web App con `clasp deploy` y pega la URL en frontend/.env como VITE_API_URL.',
  };
}

// ─── Integraciones futuras (Fase 7+) ─────────────────────────

/** OCR de voucher: devuelve null si no hay API key configurada. */
function extraerDatosVoucherOCR(_base64: string, _mime: string): unknown | null {
  if (!getProperty('OPENAI_API_KEY') && !getProperty('GEMINI_API_KEY')) return null;
  // TODO Fase 7+: llamar OpenAI/Gemini Vision
  return null;
}

/** Verificación automática de pago Binance: null si no hay credenciales. */
function verificarPagoBinanceAuto(_idCompra: string): unknown | null {
  if (!getProperty('BINANCE_API_KEY') || !getProperty('BINANCE_API_SECRET')) return null;
  // TODO Fase 7+: consultar Binance Pay API
  return null;
}
