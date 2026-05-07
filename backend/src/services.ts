/**
 * services.ts — Acceso a Google APIs (Sheets, Drive, Gmail) y configuración.
 *
 * Fase 0: stubs y firmas. La implementación real llega en Fase 1.
 * Diseñado para que activar integraciones futuras (OCR, Binance, Stripe,
 * WhatsApp Cloud API) sea solo agregar la Property correspondiente.
 */

import { LogContext } from './utils';

// ─── Properties ──────────────────────────────────────────────

export interface AppProperties {
  SHEET_ID: string;
  DRIVE_FOLDER_VOUCHERS: string;
  ADMIN_EMAIL: string;
  NOTIFICACION_EMAIL: string;
  ADMIN_PASSWORD_HASH: string;
  ADMIN_PASSWORD_SALT: string;
  SESSION_SECRET: string;
  RATE_LIMIT_PER_HOUR: string;
  WHATSAPP_NUMBER: string;
  // Opcionales / futuro
  OPENAI_API_KEY?: string;
  GEMINI_API_KEY?: string;
  BINANCE_API_KEY?: string;
  BINANCE_API_SECRET?: string;
  STRIPE_SECRET_KEY?: string;
  WHATSAPP_CLOUD_API_TOKEN?: string;
}

const REQUIRED_PROPS: (keyof AppProperties)[] = [
  'SHEET_ID',
  'DRIVE_FOLDER_VOUCHERS',
  'ADMIN_EMAIL',
  'NOTIFICACION_EMAIL',
  'SESSION_SECRET',
  'WHATSAPP_NUMBER',
];

export function getProperty<K extends keyof AppProperties>(key: K): AppProperties[K] | undefined {
  const value = PropertiesService.getScriptProperties().getProperty(key);
  return (value ?? undefined) as AppProperties[K] | undefined;
}

export function getRequired<K extends keyof AppProperties>(key: K): string {
  const value = PropertiesService.getScriptProperties().getProperty(key);
  if (!value) throw new Error(`Falta la Property requerida: ${key}`);
  return value;
}

export function checkRequiredProperties(): string[] {
  const missing: string[] = [];
  for (const key of REQUIRED_PROPS) {
    if (!PropertiesService.getScriptProperties().getProperty(key)) missing.push(key);
  }
  return missing;
}

// ─── Sheets (stubs Fase 0) ───────────────────────────────────

export function getSpreadsheet(): GoogleAppsScript.Spreadsheet.Spreadsheet {
  return SpreadsheetApp.openById(getRequired('SHEET_ID'));
}

/**
 * Crea las 4 hojas con sus headers si no existen.
 * Implementación completa en Fase 1.
 */
export function inicializarSheets(): void {
  // TODO Fase 1: crear hojas Plataformas, Usuarios, Compras, Logs.
  Logger.log('inicializarSheets() pendiente — implementar en Fase 1');
}

// ─── Drive (stubs Fase 0) ────────────────────────────────────

export function getCarpetaVouchers(): GoogleAppsScript.Drive.Folder {
  return DriveApp.getFolderById(getRequired('DRIVE_FOLDER_VOUCHERS'));
}

// ─── Gmail (stubs Fase 0) ────────────────────────────────────

export function notificarAdmin(asunto: string, cuerpo: string): void {
  const to = getProperty('NOTIFICACION_EMAIL') ?? getProperty('ADMIN_EMAIL');
  if (!to) {
    Logger.log(`notificarAdmin: sin destinatario configurado. ${asunto}`);
    return;
  }
  MailApp.sendEmail({ to, subject: asunto, htmlBody: cuerpo });
}

// ─── Logs (stub Fase 0) ──────────────────────────────────────

export function log(ctx: LogContext): void {
  // TODO Fase 1: append a hoja Logs con timestamp.
  Logger.log(`[${ctx.nivel ?? 'info'}] ${ctx.accion} | usuario=${ctx.idUsuario ?? '-'} | ${ctx.detalle ?? ''}`);
}

// ─── Integraciones futuras (placeholders) ────────────────────

/** Fase 7+. Devuelve null si no hay API key configurada. */
export function extraerDatosVoucherOCR(_base64: string, _mime: string): unknown | null {
  if (!getProperty('OPENAI_API_KEY') && !getProperty('GEMINI_API_KEY')) return null;
  return null;
}

/** Fase 7+. Devuelve null si no hay credenciales Binance. */
export function verificarPagoBinanceAuto(_idCompra: string): unknown | null {
  if (!getProperty('BINANCE_API_KEY') || !getProperty('BINANCE_API_SECRET')) return null;
  return null;
}
