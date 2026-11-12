/**
 * Datos legales del titular del negocio. ÚNICO lugar donde viven: Términos,
 * Privacidad, Libro de Reclamaciones y el footer los leen de aquí.
 *
 * El titular es una PERSONA NATURAL que opera con el nombre comercial
 * "SINAPSIS EDU". Los valores entre corchetes [ASÍ] son marcadores visibles
 * a propósito: complétalos antes de pasar la pasarela a producción.
 */
export const EMPRESA = {
  /** Nombre completo del titular (persona natural). */
  titular: '[NOMBRE DEL TITULAR]',
  /** Etiqueta del documento que se muestra junto al número: 'DNI' o 'RUC'. */
  tipoDocumento: 'DNI / RUC',
  /** Número de DNI o RUC (RUC 10… de persona natural, si lo tiene). */
  documento: '[DNI o RUC]',
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
