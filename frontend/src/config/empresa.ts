/**
 * Datos legales de la empresa. ÚNICO lugar donde viven: Términos,
 * Privacidad, Libro de Reclamaciones y el footer los leen de aquí.
 *
 * Los valores entre corchetes [ASÍ] son marcadores visibles a propósito:
 * complétalos antes de pasar la pasarela a producción.
 */
export const EMPRESA = {
  razonSocial: 'INGENIERIA TELCOM E.I.R.L.',
  ruc: '20602277900',
  nombreComercial: 'SINAPSIS EDU',
  direccion: '[DIRECCIÓN]',
  correoContacto: '[CORREO DE CONTACTO]',
  sitio: 'sinapsisedu.com',
  /** Fecha de la última actualización de los textos legales (AAAA-MM-DD). */
  actualizacionLegal: '2026-11-11',
} as const;

/** true si un dato todavía es un marcador sin completar. */
export function esMarcador(valor: string): boolean {
  return /^\[.*\]$/.test(valor.trim());
}
