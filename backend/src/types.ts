/**
 * types.ts — Modelo de datos compartido del Portal Central.
 *
 * Apps Script + clasp transpila cada .ts y los une en un único scope global.
 * Por eso aquí NO usamos `import` ni `export`: las definiciones quedan
 * disponibles automáticamente en el resto de archivos del proyecto.
 */

type EstadoPago = 'pendiente' | 'aprobado' | 'rechazado';
type EstadoAcceso = 'pendiente' | 'activo' | 'vencido' | 'revocado';
type MetodoPago = 'yape' | 'transferencia' | 'binance' | 'whatsapp';
type EstadoUsuario = 'activo' | 'bloqueado';
type NivelLog = 'info' | 'warning' | 'error';

interface Plataforma {
  id_plataforma: string;
  nombre: string;
  slug: string;
  descripcion: string;
  url_real: string;
  precio: number;
  duracion_dias: number;
  activo: boolean;
}

interface Usuario {
  id_usuario: string;
  nombre: string;
  correo: string;
  whatsapp: string;
  password_hash?: string;
  password_salt?: string;
  fecha_registro: string;
  estado: EstadoUsuario;
}

interface Compra {
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

interface LogEntry {
  timestamp: string;
  accion: string;
  id_usuario: string;
  nivel: NivelLog;
  detalle: string;
}

interface LogContext {
  accion: string;
  idUsuario?: string;
  nivel?: NivelLog;
  detalle?: string;
}

interface ApiResponse<T = unknown> {
  ok: boolean;
  message?: string;
  data?: T;
  error?: string;
}

interface ApiRequest {
  action: string;
  token?: string;
  [key: string]: unknown;
}
