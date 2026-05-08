/**
 * main.ts — Único punto de entrada de Apps Script.
 *
 * Maneja:
 *  - doGet:  ?ping=1 (status JSON), ?page=admin (HTML), default (JSON info).
 *  - doPost: toda la API JSON (ping y acciones).
 *
 * Las funciones top-level que aparecen aquí son las que se pueden ejecutar
 * desde el editor de Apps Script (Run dropdown):
 *   setup, inicializarSheets, healthcheck.
 *
 * Sin import/export — Apps Script + clasp usan scope global.
 */

// ─── doGet ───────────────────────────────────────────────────

function doGet(
  e: GoogleAppsScript.Events.DoGet,
): GoogleAppsScript.Content.TextOutput | GoogleAppsScript.HTML.HtmlOutput {
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
    message:
      'Portal Central backend. Usa POST con {"action":"ping"} para JSON, ' +
      '?ping=1 vía GET, o ?page=admin para el panel.',
  });
}

// ─── doPost ──────────────────────────────────────────────────

function doPost(e: GoogleAppsScript.Events.DoPost): GoogleAppsScript.Content.TextOutput {
  let req: ApiRequest;
  try {
    const raw = (e && e.postData && e.postData.contents) ? e.postData.contents : '{}';
    req = JSON.parse(raw) as ApiRequest;
  } catch (_) {
    return jsonResponse(fail('JSON inválido en el body'));
  }

  if (!req || !req.action) {
    return jsonResponse(fail('Falta el campo "action"'));
  }

  try {
    const fullAction = String(req.action);
    const isAdmin = fullAction.indexOf('admin.') === 0;
    const action = isAdmin ? fullAction.substring('admin.'.length) : fullAction;
    const innerReq: ApiRequest = Object.assign({}, req, { action });
    const response = isAdmin ? dispatchAdmin(innerReq) : dispatchPublic(innerReq);
    return jsonResponse(response);
  } catch (err) {
    const detalle = err instanceof Error ? err.message : String(err);
    log({ accion: String(req.action), nivel: 'error', detalle });
    return jsonResponse(fail('Error interno', 'Ocurrió un problema. Intenta de nuevo.'));
  }
}

// ─── Helpers de respuesta ────────────────────────────────────

function jsonResponse(payload: unknown): GoogleAppsScript.Content.TextOutput {
  return ContentService.createTextOutput(JSON.stringify(payload)).setMimeType(
    ContentService.MimeType.JSON,
  );
}

/**
 * Permite incluir HTMLs parciales: `<?!= include('views/adminStyles') ?>`.
 * Apps Script lo invoca automáticamente desde las plantillas evaluadas.
 */
function include(filename: string): string {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

// ─── Healthcheck (para ejecutar desde el editor) ─────────────

/**
 * Verifica el estado del backend sin tocar nada. Útil para correr
 * desde el editor de Apps Script tras un deploy.
 */
function healthcheck(): {
  ok: boolean;
  missingProperties: string[];
  spreadsheet?: { id: string; url: string };
  driveFolder?: { id: string; url: string };
} {
  const missing = checkRequiredProperties();
  const result: {
    ok: boolean;
    missingProperties: string[];
    spreadsheet?: { id: string; url: string };
    driveFolder?: { id: string; url: string };
  } = { ok: missing.length === 0, missingProperties: missing };

  const sheetId = getProperty('SHEET_ID');
  if (sheetId) {
    try {
      const ss = SpreadsheetApp.openById(sheetId);
      result.spreadsheet = { id: sheetId, url: ss.getUrl() };
    } catch (_) { /* IDs corruptos */ }
  }

  const folderId = getProperty('DRIVE_FOLDER_VOUCHERS');
  if (folderId) {
    try {
      const folder = DriveApp.getFolderById(folderId);
      result.driveFolder = { id: folderId, url: folder.getUrl() };
    } catch (_) { /* IDs corruptos */ }
  }

  return result;
}
