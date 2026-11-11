/**
 * Culqi Checkout v4 (https://checkout.culqi.com/js/v4), cargado de forma
 * perezosa solo cuando el alumno pulsa "Pagar".
 *
 * Doc: https://docs.culqi.com/es/documentacion/checkout/v4
 * - Culqi.publicKey = pk_…  (la entrega el backend en iniciarCompra)
 * - Culqi.settings({ title, currency: 'PEN', amount }) → amount en céntimos,
 *   currency y amount son obligatorios para Yape.
 * - Culqi.options({ paymentMethods: { tarjeta, yape, … } })
 * - Culqi.open(); al terminar Culqi llama a la función GLOBAL `culqi()`,
 *   donde Culqi.token.id trae el token (tarjeta o Yape) o Culqi.error el error.
 *
 * La tarjeta nunca toca nuestro servidor: solo enviamos el token.
 */

const SCRIPT_URL = 'https://checkout.culqi.com/js/v4';

interface CulqiV4 {
  publicKey: string;
  settings: (s: { title: string; currency: 'PEN'; amount: number; order?: string }) => void;
  options: (o: Record<string, unknown>) => void;
  open: () => void;
  close: () => void;
  token?: { id: string; email?: string } | null;
  order?: unknown;
  error?: { user_message?: string; merchant_message?: string } | null;
}

declare global {
  interface Window {
    Culqi?: CulqiV4;
    culqi?: () => void;
  }
}

let cargando: Promise<CulqiV4> | null = null;

function cargarScript(): Promise<CulqiV4> {
  if (window.Culqi) return Promise.resolve(window.Culqi);
  if (cargando) return cargando;
  cargando = new Promise<CulqiV4>((resolve, reject) => {
    const s = document.createElement('script');
    s.src = SCRIPT_URL;
    s.async = true;
    s.onload = () => (window.Culqi ? resolve(window.Culqi) : reject(new Error('Culqi no cargó')));
    s.onerror = () => {
      cargando = null;
      s.remove();
      reject(new Error('No se pudo cargar la pasarela de pago. Revisa tu conexión.'));
    };
    document.head.appendChild(s);
  });
  return cargando;
}

export interface AbrirCheckoutOpts {
  publicKey: string;
  titulo: string;
  montoCentimos: number;
  /** Se llama UNA vez cuando Culqi entrega el token. */
  onToken: (token: string) => void;
  /** Error del checkout (tarjeta inválida, Yape vencido, etc.). */
  onError: (mensaje: string) => void;
}

/** Carga Culqi (si hace falta), lo configura y abre el modal. */
export async function abrirCheckoutCulqi(o: AbrirCheckoutOpts): Promise<void> {
  const Culqi = await cargarScript();
  let entregado = false;

  window.culqi = () => {
    const C = window.Culqi;
    if (!C) return;
    if (C.token && C.token.id) {
      const id = C.token.id;
      C.close();
      if (!entregado) {
        entregado = true;
        o.onToken(id);
      }
    } else if (C.error) {
      o.onError(C.error.user_message || 'No se pudo procesar el pago. Intenta de nuevo.');
    }
  };

  Culqi.publicKey = o.publicKey;
  Culqi.settings({
    title: o.titulo,
    currency: 'PEN',
    amount: o.montoCentimos,
  });
  Culqi.options({
    lang: 'auto',
    installments: false,
    paymentMethods: {
      tarjeta: true,
      yape: true,
      bancaMovil: false,
      agente: false,
      billetera: false,
      cuotealo: false,
    },
    style: {
      logo: `${window.location.origin}/images/logo/logo-icono.png`,
      bannerColor: '#10312D',
      buttonBackground: '#10312D',
      menuColor: '#10312D',
      linksColor: '#1F5B52',
      buttonText: '',
      buttonTextColor: '#FFFFFF',
      priceColor: '#10312D',
    },
  });
  Culqi.open();
}
