/**
 * api.ts — Handlers públicos y de admin.
 *
 * Fase 1: ping real con check de Properties + listarPlataformasPublicas
 * (porque el seed ya se ejecutó). El resto sigue como stub hasta Fase 2/4/5.
 *
 * Sin import/export — todo global en Apps Script.
 */

interface PingPayload {
  status: 'online' | 'setup-pending';
  timestamp: string;
  properties: { ok: boolean; missing: string[] };
  sheetUrl?: string;
}

function ping(): ApiResponse<PingPayload> {
  const missing = checkRequiredProperties();
  const isOk = missing.length === 0;
  let sheetUrl: string | undefined;
  if (isOk) {
    try { sheetUrl = getSpreadsheet().getUrl(); } catch (_) { /* ignorar */ }
  }
  return ok<PingPayload>(
    {
      status: isOk ? 'online' : 'setup-pending',
      timestamp: new Date().toISOString(),
      properties: { ok: isOk, missing },
      sheetUrl,
    },
    isOk ? 'Portal Central backend OK' : 'Backend respondiendo. Falta correr setup().',
  );
}

function listarPlataformasPublicas(_req: ApiRequest): ApiResponse<Array<Omit<Plataforma, 'url_real'>>> {
  try {
    const all = readAll<Plataforma>(SHEET_NAMES.PLATAFORMAS);
    // Nunca devolvemos url_real al cliente público (regla §2.2 de CLAUDE.md).
    const safe = all
      .filter((p) => p.activo === true || String(p.activo).toLowerCase() === 'true')
      .map((p) => ({
        id_plataforma: String(p.id_plataforma),
        nombre: String(p.nombre),
        slug: String(p.slug),
        descripcion: String(p.descripcion),
        precio: Number(p.precio),
        duracion_dias: Number(p.duracion_dias),
        activo: true,
      }));
    return ok(safe);
  } catch (err) {
    const detalle = err instanceof Error ? err.message : String(err);
    log({ accion: 'listarPlataformasPublicas', nivel: 'error', detalle });
    return fail('No se pudo leer plataformas', 'Inténtalo en unos segundos.');
  }
}

function registrarCompra(_req: ApiRequest): ApiResponse {
  return ok(undefined, 'pendiente Fase 2');
}

function subirVoucher(_req: ApiRequest): ApiResponse {
  return ok(undefined, 'pendiente Fase 2');
}

function loginAlumno(_req: ApiRequest): ApiResponse {
  return ok(undefined, 'pendiente Fase 5');
}

function misAccesos(_req: ApiRequest): ApiResponse {
  return ok([], 'pendiente Fase 5');
}

function obtenerUrlPlataforma(_req: ApiRequest): ApiResponse {
  return ok(undefined, 'pendiente Fase 5');
}

// ─── Admin ───────────────────────────────────────────────────

function adminLogin(_req: ApiRequest): ApiResponse {
  return ok(undefined, 'pendiente Fase 4');
}

function listarSolicitudes(_req: ApiRequest): ApiResponse {
  return ok([], 'pendiente Fase 4');
}

function aprobarPago(_req: ApiRequest): ApiResponse {
  return ok(undefined, 'pendiente Fase 4');
}

function rechazarPago(_req: ApiRequest): ApiResponse {
  return ok(undefined, 'pendiente Fase 4');
}

// ─── Dispatcher ──────────────────────────────────────────────

type ApiHandler = (req: ApiRequest) => ApiResponse;

function dispatchPublic(req: ApiRequest): ApiResponse {
  const action = String(req.action);
  switch (action) {
    case 'ping': return ping();
    case 'listarPlataformasPublicas': return listarPlataformasPublicas(req);
    case 'registrarCompra': return registrarCompra(req);
    case 'subirVoucher': return subirVoucher(req);
    case 'loginAlumno': return loginAlumno(req);
    case 'misAccesos': return misAccesos(req);
    case 'obtenerUrlPlataforma': return obtenerUrlPlataforma(req);
    default: return fail(`Acción desconocida: ${action}`);
  }
}

function dispatchAdmin(req: ApiRequest): ApiResponse {
  const action = String(req.action);
  switch (action) {
    case 'adminLogin': return adminLogin(req);
    case 'listarSolicitudes': return listarSolicitudes(req);
    case 'aprobarPago': return aprobarPago(req);
    case 'rechazarPago': return rechazarPago(req);
    default: return fail(`Acción admin desconocida: ${action}`);
  }
}
