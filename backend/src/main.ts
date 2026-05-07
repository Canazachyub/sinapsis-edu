/**
 * main.ts — Único punto de entrada de Apps Script.
 * Maneja doGet (sirve admin HTML + ping) y doPost (toda la API JSON).
 *
 * NOTA: Apps Script transpila todos los .ts al mismo scope global.
 * Las funciones doGet/doPost deben estar en este archivo y exportadas
 * con el nombre exacto que Apps Script espera (no renombrar).
 */

import { ApiRequest } from './types';
import { dispatchAdmin, dispatchPublic, ping } from './api';
import { fail } from './utils';
import { log } from './services';

// ─── doGet ───────────────────────────────────────────────────

function doGet(e: GoogleAppsScript.Events.DoGet): GoogleAppsScript.Content.TextOutput | GoogleAppsScript.HTML.HtmlOutput {
  const params = e?.parameter ?? {};

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
    message: 'Portal Central backend. Usa POST para la API o ?page=admin para el panel.',
  });
}

// ─── doPost ──────────────────────────────────────────────────

function doPost(e: GoogleAppsScript.Events.DoPost): GoogleAppsScript.Content.TextOutput {
  let req: ApiRequest;
  try {
    const raw = e?.postData?.contents ?? '{}';
    req = JSON.parse(raw) as ApiRequest;
  } catch (err) {
    return jsonResponse(fail('JSON inválido en el body'));
  }

  if (!req?.action) {
    return jsonResponse(fail('Falta el campo "action"'));
  }

  try {
    const isAdmin = String(req.action).startsWith('admin.');
    const action = isAdmin ? String(req.action).slice('admin.'.length) : String(req.action);
    const response = isAdmin
      ? dispatchAdmin({ ...req, action })
      : dispatchPublic({ ...req, action });
    return jsonResponse(response);
  } catch (err) {
    const detalle = err instanceof Error ? err.message : String(err);
    log({ accion: req.action, nivel: 'error', detalle });
    return jsonResponse(fail('Error interno', 'Ocurrió un problema. Intenta de nuevo.'));
  }
}

// ─── Helpers de respuesta ────────────────────────────────────

function jsonResponse(payload: unknown): GoogleAppsScript.Content.TextOutput {
  return ContentService.createTextOutput(JSON.stringify(payload)).setMimeType(
    ContentService.MimeType.JSON,
  );
}

/** Apps Script lo usa para incluir vistas HTML parciales (`<?!= include('...') ?>`). */
function include(filename: string): string {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}
