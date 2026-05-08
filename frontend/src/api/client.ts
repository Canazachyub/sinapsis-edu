/**
 * Cliente fetch único contra el Web App de Apps Script.
 * Apps Script solo acepta POST con JSON; el campo `action` define el endpoint.
 */

import { config } from '@/config';

export interface ApiEnvelope<T = unknown> {
  ok: boolean;
  message?: string;
  data?: T;
  error?: string;
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

  try {
    const response = await fetch(config.apiUrl, {
      method: 'POST',
      // Apps Script lee text/plain sin disparar preflight CORS
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ action, ...payload }),
      redirect: 'follow',
    });
    if (!response.ok) {
      return { ok: false, error: `HTTP ${response.status}` };
    }
    return (await response.json()) as ApiEnvelope<T>;
  } catch (err) {
    const detail = err instanceof Error ? err.message : String(err);
    return { ok: false, error: `Error de red: ${detail}` };
  }
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
