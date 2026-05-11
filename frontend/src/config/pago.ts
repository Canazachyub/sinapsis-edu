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
  numero: '900 266 810',
  numeroPlano: '900266810',
  qrImage: '/images/pago/qr-yape.png',
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

export const WHATSAPP = {
  numero: '51974707622',
  display: '+51 974 707 622',
  numeroAlternativo: '51921647291',
  displayAlternativo: '+51 921 647 291',
} as const;

export const CONTACTO = {
  email: 'sinapsistartup@auladigitalpe.com',
  direccion: 'Tacna, Perú',
  horario: 'Lun a Sáb · 7:30 – 18:00',
} as const;
