/**
 * Cliente fetch único contra el Web App de Apps Script.
 * Apps Script solo acepta POST con JSON; el campo `action` define el endpoint.
 *
 * Maneja un glitch intermitente conocido de Apps Script donde a veces
 * devuelve la respuesta de doGet en vez de doPost — en esos casos hace
 * un único reintento automático.
 */

import { config } from '@/config';

export interface ApiEnvelope<T = unknown> {
  ok: boolean;
  message?: string;
  data?: T;
  error?: string;
}

const DEBUG_API = typeof window !== 'undefined' && import.meta.env.DEV;

/** Detecta la respuesta del fallback doGet (cuando Apps Script confunde POST con GET). */
function esRespuestaDoGet(env: ApiEnvelope): boolean {
  return (
    env.ok === true &&
    env.data === undefined &&
    typeof env.message === 'string' &&
    env.message.indexOf('Usa POST con') !== -1
  );
}

async function callApiOnce<T>(
  action: string,
  payload: Record<string, unknown>,
): Promise<ApiEnvelope<T>> {
  const body = JSON.stringify({ action, ...payload });
  if (DEBUG_API) {
    console.log('[api →]', action, {
      url: config.apiUrl,
      bodyLength: body.length,
      body: body.length < 500 ? body : body.slice(0, 200) + '...',
    });
  }

  try {
    const response = await fetch(config.apiUrl, {
      method: 'POST',
      // Apps Script lee text/plain sin disparar preflight CORS.
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body,
      redirect: 'follow',
    });

    if (DEBUG_API) {
      console.log('[api ←]', action, {
        status: response.status,
        ok: response.ok,
        url: response.url,
        type: response.type,
        contentType: response.headers.get('content-type'),
      });
    }

    if (!response.ok) return { ok: false, error: `HTTP ${response.status}` };

    const text = await response.text();
    if (DEBUG_API) {
      console.log('[api ←]', action, 'body:', text.length < 500 ? text : text.slice(0, 300) + '...');
    }

    try {
      return JSON.parse(text) as ApiEnvelope<T>;
    } catch (_) {
      return {
        ok: false,
        error: 'Respuesta del backend no es JSON. Primeros 200 chars: ' + text.slice(0, 200),
      };
    }
  } catch (err) {
    const detail = err instanceof Error ? err.message : String(err);
    if (DEBUG_API) console.error('[api ✗]', action, detail);
    return { ok: false, error: `Error de red: ${detail}` };
  }
}

export async function callApi<T = unknown>(
  action: string,
  payload: Record<string, unknown> = {},
): Promise<ApiEnvelope<T>> {
  if (!config.apiUrl) {
    return {
      ok: false,
      error: 'VITE_API_URL no configurado. Crea frontend/.env y pega la URL del Web App.',
    };
  }

  let res = await callApiOnce<T>(action, payload);

  // Reintento automático si Apps Script devolvió el fallback de doGet.
  if (esRespuestaDoGet(res)) {
    if (DEBUG_API) console.warn('[api ↻] Apps Script devolvió doGet, reintentando', action);
    res = await callApiOnce<T>(action, payload);
  }

  return res;
}

export interface PingPayload {
  status: 'online' | 'setup-pending';
  timestamp: string;
  properties: { ok: boolean; missing: string[] };
  sheetUrl?: string;
}

export async function ping(): Promise<ApiEnvelope<PingPayload>> {
  return callApi<PingPayload>('ping');
}
