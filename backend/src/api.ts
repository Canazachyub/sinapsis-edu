/**
 * api.ts — Handlers públicos y de admin.
 *
 * Fase 0: cada acción devuelve un stub `{ ok: true, message: 'pendiente Fase X' }`
 * para que el router compile y el frontend pueda probar el ping.
 * Implementación real llega en Fase 2 (público) y Fase 4 (admin).
 */

import { ApiRequest, ApiResponse } from './types';
import { fail, ok } from './utils';

// ─── Públicos ────────────────────────────────────────────────

export function ping(): ApiResponse<{ status: string; timestamp: string }> {
  return ok({ status: 'online', timestamp: new Date().toISOString() }, 'Portal Central backend OK');
}

export function listarPlataformasPublicas(_req: ApiRequest): ApiResponse {
  return ok([], 'pendiente Fase 2');
}

export function registrarCompra(_req: ApiRequest): ApiResponse {
  return ok(undefined, 'pendiente Fase 2');
}

export function subirVoucher(_req: ApiRequest): ApiResponse {
  return ok(undefined, 'pendiente Fase 2');
}

export function loginAlumno(_req: ApiRequest): ApiResponse {
  return ok(undefined, 'pendiente Fase 5');
}

export function misAccesos(_req: ApiRequest): ApiResponse {
  return ok([], 'pendiente Fase 5');
}

export function obtenerUrlPlataforma(_req: ApiRequest): ApiResponse {
  return ok(undefined, 'pendiente Fase 5');
}

// ─── Admin ───────────────────────────────────────────────────

export function adminLogin(_req: ApiRequest): ApiResponse {
  return ok(undefined, 'pendiente Fase 4');
}

export function listarSolicitudes(_req: ApiRequest): ApiResponse {
  return ok([], 'pendiente Fase 4');
}

export function aprobarPago(_req: ApiRequest): ApiResponse {
  return ok(undefined, 'pendiente Fase 4');
}

export function rechazarPago(_req: ApiRequest): ApiResponse {
  return ok(undefined, 'pendiente Fase 4');
}

// ─── Dispatcher ──────────────────────────────────────────────

type Handler = (req: ApiRequest) => ApiResponse;

const PUBLIC_ACTIONS: Record<string, Handler> = {
  ping,
  listarPlataformasPublicas,
  registrarCompra,
  subirVoucher,
  loginAlumno,
  misAccesos,
  obtenerUrlPlataforma,
};

const ADMIN_ACTIONS: Record<string, Handler> = {
  adminLogin,
  listarSolicitudes,
  aprobarPago,
  rechazarPago,
};

export function dispatchPublic(req: ApiRequest): ApiResponse {
  const handler = PUBLIC_ACTIONS[req.action];
  if (!handler) return fail(`Acción desconocida: ${req.action}`);
  return handler(req);
}

export function dispatchAdmin(req: ApiRequest): ApiResponse {
  const handler = ADMIN_ACTIONS[req.action];
  if (!handler) return fail(`Acción admin desconocida: ${req.action}`);
  return handler(req);
}
