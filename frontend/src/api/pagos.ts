/**
 * Contrato de las acciones de la pasarela (Culqi, fase 1).
 * Ver backend/apps-script-paste/Code.gs → iniciarCompra_, confirmarPago_, estadoCompra_.
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

export interface IniciarCompraRes {
  id_compra: string;
  monto: number;
  montoCentimos: number;
  moneda: 'PEN';
  descripcion: string;
  publicKey: string;
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
} as const;

export const iniciarCompra = (req: IniciarCompraReq) =>
  callApi<IniciarCompraRes>('iniciarCompra', { ...req });

export const confirmarPago = (id_compra: string, token: string, correo: string) =>
  callApi<ConfirmarPagoRes>('confirmarPago', { id_compra, token, correo });

export const estadoCompra = (id_compra: string, correo: string) =>
  callApi<EstadoCompraRes>('estadoCompra', { id_compra, correo });

// ─── Compra en curso (para recuperarla si se cierra la pestaña) ───

const KEY = 'sinapsis_compra_en_curso';

export interface CompraEnCurso {
  id_compra: string;
  correo: string;
  slug: string;
  at: number;
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
