/**
 * utils.ts — Helpers puros: validación, hashing, IDs, fechas, respuestas.
 * No accede a Sheets/Drive/Gmail (eso es services.ts).
 */

import { ApiResponse, NivelLog } from './types';

// ─── Respuestas estándar ─────────────────────────────────────

export function ok<T>(data?: T, message?: string): ApiResponse<T> {
  return { ok: true, ...(data !== undefined && { data }), ...(message && { message }) };
}

export function fail(error: string, message?: string): ApiResponse {
  return { ok: false, error, ...(message && { message }) };
}

// ─── Validación ──────────────────────────────────────────────

const RE_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const RE_WHATSAPP = /^\+?\d{8,15}$/;
const VOUCHER_TYPES_OK = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
const VOUCHER_MAX_BYTES = 5 * 1024 * 1024;

export function isEmail(value: unknown): value is string {
  return typeof value === 'string' && RE_EMAIL.test(value);
}

export function isWhatsapp(value: unknown): value is string {
  return typeof value === 'string' && RE_WHATSAPP.test(value.replace(/\s|-/g, ''));
}

export function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

export function validateVoucher(mime: string, base64: string): { ok: boolean; error?: string } {
  if (!VOUCHER_TYPES_OK.includes(mime)) {
    return { ok: false, error: 'Tipo de archivo no permitido. Solo jpg, png o pdf.' };
  }
  const bytes = Math.floor((base64.length * 3) / 4);
  if (bytes > VOUCHER_MAX_BYTES) {
    return { ok: false, error: 'El archivo supera 5MB.' };
  }
  return { ok: true };
}

// ─── IDs ─────────────────────────────────────────────────────

export function nextId(prefix: 'U' | 'C' | 'P', lastNumber: number): string {
  const n = (lastNumber + 1).toString().padStart(3, '0');
  return `${prefix}-${n}`;
}

export function randomToken(length: number = 32): string {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let out = '';
  for (let i = 0; i < length; i++) {
    out += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return out;
}

// ─── Hashing ─────────────────────────────────────────────────

export function hashPassword(password: string, salt: string): string {
  const bytes = Utilities.computeDigest(
    Utilities.DigestAlgorithm.SHA_256,
    password + salt,
    Utilities.Charset.UTF_8,
  );
  return bytes
    .map((b) => {
      const v = (b < 0 ? b + 256 : b).toString(16);
      return v.length === 1 ? '0' + v : v;
    })
    .join('');
}

export function generateSalt(): string {
  return randomToken(16);
}

// ─── Fechas ──────────────────────────────────────────────────

export function nowIso(): string {
  return new Date().toISOString();
}

export function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

export function addDaysIso(daysFromToday: number): string {
  const d = new Date();
  d.setDate(d.getDate() + daysFromToday);
  return d.toISOString().slice(0, 10);
}

// ─── Logging (firma; impl en services.ts) ────────────────────

export interface LogContext {
  accion: string;
  idUsuario?: string;
  nivel?: NivelLog;
  detalle?: string;
}
