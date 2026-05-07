/**
 * Configuración del cliente. Los valores reales vienen de `frontend/.env`.
 * Solo variables con prefijo VITE_ se exponen al bundle.
 */

export const config = {
  apiUrl: import.meta.env.VITE_API_URL ?? '',
  whatsappNumber: import.meta.env.VITE_WHATSAPP ?? '51984300510',
} as const;

export type AppConfig = typeof config;
