/**
 * Datos de pago oficiales de SINAPSIS EDU.
 * Único lugar donde viven cuentas, números, IDs.
 * NO commitear cambios de IDs reales — usar .env si se vuelven sensibles.
 */

/**
 * Titular enmascarado: ocultamos el segundo nombre y apellido materno
 * en la UI pública. El nombre completo vive solo en los registros
 * bancarios; el alumno reconoce al titular por las iniciales visibles.
 */
export const TITULAR = 'Yubert *** Canaza ****';

export const YAPE = {
  titular: TITULAR,
  numero: '989 855 026',
  numeroPlano: '989855026',
  /** QR del Yape 989 855 026. Si el archivo falta, la UI muestra solo el número. */
  qrImage: '/images/pago/qr-yape-989855026.png',
} as const;

export const BCP_SOLES = {
  titular: TITULAR,
  cuenta: '4950 0370 1760 93',
  interbancaria: '0024 9510 0370 1760 9309',
  moneda: 'PEN',
  banco: 'BCP (Banco de Crédito del Perú)',
} as const;

export const BINANCE = {
  titular: TITULAR,
  payId: 'User-c8086',
  redes: ['BEP20', 'TRC20'] as const,
  moneda: 'USDT (Tether)',
  qrImage: '/images/pago/qr-binance.png',
} as const;

/** Único número de contacto (WhatsApp, llamadas y Yape). */
export const WHATSAPP = {
  numero: '51989855026',
  display: '+51 989 855 026',
} as const;

export const CONTACTO = {
  email: 'sinapsistartup@auladigitalpe.com',
  direccion: 'Tacna, Perú',
  horario: 'Lun a Sáb · 7:30 – 18:00',
} as const;
