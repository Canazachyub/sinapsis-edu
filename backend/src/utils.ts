/**
 * utils.ts — Helpers puros: validación, hashing, IDs, fechas, respuestas.
 * Sin acceso a Sheets/Drive/Gmail (eso vive en services.ts).
 *
 * Sin import/export — todo es global en Apps Script.
 */

// ─── Respuestas estándar ─────────────────────────────────────

function ok<T>(data?: T, message?: string): ApiResponse<T> {
  const res: ApiResponse<T> = { ok: true };
  if (data !== undefined) res.data = data;
  if (message) res.message = message;
  return res;
}

function fail<T = unknown>(error: string, message?: string): ApiResponse<T> {
  const res: ApiResponse<T> = { ok: false, error };
  if (message) res.message = message;
  return res;
}

// ─── Validación ──────────────────────────────────────────────

const RE_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const RE_WHATSAPP = /^\+?\d{8,15}$/;
const VOUCHER_TYPES_OK: ReadonlyArray<string> = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'application/pdf',
];
const VOUCHER_MAX_BYTES = 5 * 1024 * 1024;

function isEmail(value: unknown): value is string {
  return typeof value === 'string' && RE_EMAIL.test(value);
}

function isWhatsapp(value: unknown): value is string {
  return typeof value === 'string' && RE_WHATSAPP.test(value.replace(/\s|-/g, ''));
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function validateVoucher(mime: string, base64: string): { ok: boolean; error?: string } {
  if (VOUCHER_TYPES_OK.indexOf(mime) === -1) {
    return { ok: false, error: 'Tipo de archivo no permitido. Solo jpg, png o pdf.' };
  }
  const bytes = Math.floor((base64.length * 3) / 4);
  if (bytes > VOUCHER_MAX_BYTES) {
    return { ok: false, error: 'El archivo supera 5MB.' };
  }
  return { ok: true };
}

// ─── IDs ─────────────────────────────────────────────────────

function nextId(prefix: 'U' | 'C' | 'P', lastNumber: number): string {
  const n = (lastNumber + 1).toString();
  const padded = n.length >= 3 ? n : ('000' + n).slice(-3);
  return `${prefix}-${padded}`;
}

function randomToken(length: number): string {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let out = '';
  for (let i = 0; i < length; i++) {
    out += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return out;
}

// ─── Hashing ─────────────────────────────────────────────────

function hashPassword(password: string, salt: string): string {
  const bytes = Utilities.computeDigest(
    Utilities.DigestAlgorithm.SHA_256,
    password + salt,
    Utilities.Charset.UTF_8,
  );
  let hex = '';
  for (let i = 0; i < bytes.length; i++) {
    const b = bytes[i] < 0 ? bytes[i] + 256 : bytes[i];
    const v = b.toString(16);
    hex += v.length === 1 ? '0' + v : v;
  }
  return hex;
}

function generateSalt(): string {
  return randomToken(16);
}

// ─── Fechas ──────────────────────────────────────────────────

function nowIso(): string {
  return new Date().toISOString();
}

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

function addDaysIso(daysFromToday: number): string {
  const d = new Date();
  d.setDate(d.getDate() + daysFromToday);
  return d.toISOString().slice(0, 10);
}
