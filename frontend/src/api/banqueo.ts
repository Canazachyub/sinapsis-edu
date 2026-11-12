/**
 * Entrada al banqueo (banqueo.sinapsisedu.com) con la cuenta SINAPSIS.
 * Pide al backend un ticket de un solo uso (5 min) y arma la URL de /acceso del banqueo,
 * que lo canjea servidor a servidor por su propia sesión.
 */

import { callApi } from '@/api/client';
import { banqueoBaseUrl } from '@/config';

/** A dónde ir dentro del banqueo tras entrar. */
export type DestinoBanqueo = 'banqueo' | 'simulacro';

export type ResultadoBanqueo =
  | { ok: true; url: string }
  | { ok: false; error: string; sesionVencida: boolean; sinAcceso: boolean };

export const SIN_ACCESO_BANQUEO = 'No tienes un acceso activo al banqueo';

export async function urlEntradaBanqueo(
  token: string,
  examen?: string | null,
  destino: DestinoBanqueo = 'banqueo',
): Promise<ResultadoBanqueo> {
  const res = await callApi<{ ticket: string }>('ticketBanqueo', { token });
  if (!res.ok || !res.data?.ticket) {
    const error = res.error || res.message || 'No se pudo abrir el banqueo. Intenta de nuevo.';
    return {
      ok: false,
      error,
      sesionVencida: /sesi[oó]n/i.test(error),
      sinAcceso: error === SIN_ACCESO_BANQUEO,
    };
  }
  const params = new URLSearchParams({ ticket: res.data.ticket });
  if (examen) params.set('examen', examen);
  if (destino === 'simulacro') params.set('destino', 'simulacro');
  return { ok: true, url: `${banqueoBaseUrl()}acceso?${params.toString()}` };
}
