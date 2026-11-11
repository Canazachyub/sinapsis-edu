/**
 * Contrato de las acciones de la pasarela (fase 1).
 * Pasarela activa: Mercado Pago Checkout Pro (redirección) o Culqi (modal),
 * según lo que devuelva iniciarCompra en `pasarela`.
 * Ver backend/apps-script-paste/Code.gs → iniciarCompra_, confirmarPagoMP_,
 * confirmarPago_ (Culqi), estadoCompra_.
 */
import { callApi } from '@/api/client';

export interface IniciarCompraReq {
  slug: string;
  nombre: string;
  correo: string;
  dni: string;
  whatsapp: string;
  aceptaTerminos: true;
  /** Solo Anatomía: ids de segmentos. */
  segmentos?: string[];
}

export type Pasarela = 'mercadopago' | 'culqi';

export interface IniciarCompraRes {
  id_compra: string;
  pasarela: Pasarela;
  monto: number;
  montoCentimos: number;
  moneda: 'PEN';
  descripcion: string;
  /** Solo Culqi. */
  publicKey?: string;
  /** Solo Mercado Pago: URL de Checkout Pro a la que se redirige. */
  init_point?: string;
  plataforma: string;
  slug: string;
  duracion_dias: number;
  expira: string;
}

export interface ConfirmarPagoRes {
  id_compra: string;
  estado_pago: 'aprobado';
  fecha_fin: string;
  plataforma: string;
  passwordEnviada: boolean;
  correo: string;
}

export type EstadoPago =
  | 'pendiente' // voucher en revisión
  | 'pendiente_pago' // pasarela: aún no paga
  | 'aprobado'
  | 'rechazado'
  | 'en_revision'
  | 'reembolsado'
  | 'contracargo';

export interface EstadoCompraRes {
  id_compra: string;
  estado_pago: EstadoPago | string;
  estado_acceso: string;
  metodo_pago: string;
  plataforma: string;
  slug: string;
  monto: number;
  moneda: 'PEN';
  fecha_fin: string;
  expirada: boolean;
}

/** Códigos de error que devuelve el backend en `code`. */
export const CODIGO = {
  NO_CONFIGURADA: 'PASARELA_NO_CONFIGURADA',
  RECHAZADO: 'RECHAZADO',
  EN_PROCESO: 'EN_PROCESO',
  REVISION: 'REVISION',
  EXPIRADA: 'EXPIRADA',
  OCUPADO: 'OCUPADO',
  PASARELA_ERROR: 'PASARELA_ERROR',
} as const;

export const iniciarCompra = (req: IniciarCompraReq) =>
  callApi<IniciarCompraRes>('iniciarCompra', { ...req });

export const confirmarPago = (id_compra: string, token: string, correo: string) =>
  callApi<ConfirmarPagoRes>('confirmarPago', { id_compra, token, correo });

/** Mercado Pago: confirma el pago al volver de Checkout Pro. */
export const confirmarPagoMP = (id_compra: string, payment_id: string, correo: string) =>
  callApi<ConfirmarPagoRes>('confirmarPagoMP', { id_compra, payment_id, correo });

export const estadoCompra = (id_compra: string, correo: string) =>
  callApi<EstadoCompraRes>('estadoCompra', { id_compra, correo });

// ─── Compra en curso (para recuperarla si se cierra la pestaña) ───

const KEY = 'sinapsis_compra_en_curso';

export interface CompraEnCurso {
  id_compra: string;
  correo: string;
  slug: string;
  at: number;
  /** Mercado Pago: enlace de pago para reintentar sin volver a llenar datos. */
  init_point?: string;
  /** ISO: hasta cuándo vale ese enlace. */
  expira?: string;
}

export function guardarCompraEnCurso(c: Omit<CompraEnCurso, 'at'>) {
  try {
    localStorage.setItem(KEY, JSON.stringify({ ...c, at: Date.now() }));
  } catch {
    /* almacenamiento no disponible */
  }
}

/** Devuelve la compra guardada si tiene menos de 7 días. */
export function leerCompraEnCurso(): CompraEnCurso | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const c = JSON.parse(raw) as CompraEnCurso;
    if (!c.id_compra || !c.correo || Date.now() - c.at > 7 * 24 * 3600 * 1000) return null;
    return c;
  } catch {
    return null;
  }
}

export function borrarCompraEnCurso() {
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* nada */
  }
}

/** "2026-12-11" → "11/12/2026" */
export function fechaPeru(iso: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso || '');
  return m ? `${m[3]}/${m[2]}/${m[1]}` : iso;
}
