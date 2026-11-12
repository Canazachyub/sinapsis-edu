/**
 * Configuración del cliente. Los valores reales vienen de `frontend/.env`.
 * Solo variables con prefijo VITE_ se exponen al bundle.
 */

export const config = {
  apiUrl: import.meta.env.VITE_API_URL ?? '',
  whatsappNumber: import.meta.env.VITE_WHATSAPP ?? '51989855026',
  /** Plataforma de simulacros (paso 2 del flujo). */
  simulacrosUrl: import.meta.env.VITE_SIMULACROS_URL ?? 'https://banqueo.sinapsisedu.com/',
} as const;

/** slug de plataforma en SINAPSIS → id de examen en la plataforma de simulacros */
const EXAMEN_POR_SLUG: Record<string, string> = {
  encib: 'encib',
  cb: 'encib',
  enam: 'enam',
  rm: 'rm',
  encaps: 'serums',
  serums: 'serums',
  essalud: 'essalud',
};

/** URL de simulacros con el examen preseleccionado; null si la plataforma no tiene simulacro. */
export function simulacroHref(slug?: string, ruta = ''): string | null {
  const examen = slug ? EXAMEN_POR_SLUG[slug] : 'enam';
  if (!examen) return null;
  const base = config.simulacrosUrl.replace(/\/?$/, '/');
  return `${base}${ruta}?examen=${examen}`;
}

export type AppConfig = typeof config;
