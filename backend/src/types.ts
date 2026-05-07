/**
 * types.ts — Modelo de datos compartido del Portal Central.
 * Refleja exactamente las hojas del Spreadsheet PortalCentral_DB.
 */

export type EstadoPago = 'pendiente' | 'aprobado' | 'rechazado';
export type EstadoAcceso = 'pendiente' | 'activo' | 'vencido' | 'revocado';
export type MetodoPago = 'yape' | 'transferencia' | 'binance' | 'whatsapp';
export type EstadoUsuario = 'activo' | 'bloqueado';
export type NivelLog = 'info' | 'warning' | 'error';

export interface Plataforma {
  id_plataforma: string;
  nombre: string;
  slug: string;
  descripcion: string;
  url_real: string;
  precio: number;
  duracion_dias: number;
  activo: boolean;
}

export interface Usuario {
  id_usuario: string;
  nombre: string;
  correo: string;
  whatsapp: string;
  password_hash?: string;
  password_salt?: string;
  fecha_registro: string;
  estado: EstadoUsuario;
}

export interface Compra {
  id_compra: string;
  id_usuario: string;
  id_plataforma: string;
  monto: number;
  metodo_pago: MetodoPago;
  fecha_solicitud: string;
  voucher_url?: string;
  estado_pago: EstadoPago;
  fecha_aprobacion?: string;
  fecha_inicio?: string;
  fecha_fin?: string;
  estado_acceso: EstadoAcceso;
}

export interface LogEntry {
  timestamp: string;
  accion: string;
  id_usuario: string;
  nivel: NivelLog;
  detalle: string;
}

export interface ApiResponse<T = unknown> {
  ok: boolean;
  message?: string;
  data?: T;
  error?: string;
}

export interface ApiRequest {
  action: string;
  token?: string;
  [key: string]: unknown;
}
