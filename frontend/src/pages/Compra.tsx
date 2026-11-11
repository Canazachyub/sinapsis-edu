import { useEffect, useMemo, useRef, useState, type ChangeEvent, type FormEvent, type InputHTMLAttributes } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Check, Clock, Loader2, Lock, ShieldCheck } from 'lucide-react';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { AnatomiaSegmentos } from '@/components/AnatomiaSegmentos';
import { PagoVoucher } from '@/components/compra/PagoVoucher';
import {
  AvisoSuave, ResultadoAprobado, ResultadoEnProceso, ResultadoRechazado,
} from '@/components/compra/Resultados';
import { usePlataformas } from '@/hooks/usePlataformas';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import {
  CODIGO, confirmarPago, estadoCompra, guardarCompraEnCurso, iniciarCompra, leerCompraEnCurso,
  type CompraEnCurso, type IniciarCompraRes,
} from '@/api/pagos';
import { abrirCheckoutCulqi } from '@/utils/culqi';
import { PRECIO_POR_SEGMENTO_PEN, SEGMENTOS_ANATOMIA } from '@/data/segmentosAnatomia';

// ─── Tipos y validación ──────────────────────────────────────

interface Datos {
  nombre: string;
  correo: string;
  dni: string;
  whatsapp: string;
  acepta: boolean;
}

const DATOS_VACIOS: Datos = { nombre: '', correo: '', dni: '', whatsapp: '', acepta: false };

const RE_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const RE_WHATSAPP = /^\+?\d{8,15}$/;
const RE_DNI = /^\d{8}$/;

type Errores = Partial<Record<keyof Datos, string>>;

function validar(d: Datos): Errores {
  const e: Errores = {};
  if (d.nombre.trim().length < 3) e.nombre = 'Escribe tu nombre completo.';
  if (!RE_EMAIL.test(d.correo.trim())) e.correo = 'Revisa tu correo: ahí te llega el acceso.';
  if (!RE_DNI.test(d.dni.trim())) e.dni = 'El DNI tiene 8 dígitos.';
  if (!RE_WHATSAPP.test(d.whatsapp.replace(/\s|-/g, ''))) e.whatsapp = 'Escribe tu número con código de país, p. ej. 51987654321.';
  if (!d.acepta) e.acepta = 'Debes aceptar los Términos y la Política de Privacidad.';
  return e;
}

type Paso = 'datos' | 'pago' | 'resultado' | 'voucher';

type Resultado =
  | { tipo: 'aprobado'; plataforma: string; fechaFin: string; correo?: string; passwordEnviada?: boolean }
  | { tipo: 'rechazado'; mensaje: string }
  | { tipo: 'expirada' }
  | { tipo: 'en_proceso' }
  | { tipo: 'revision' };

const ID_POR_SLUG: Record<string, string> = {
  enam: 'P-001', encib: 'P-002', encaps: 'P-003', rm: 'P-004',
  essalud: 'P-005', biblioteca: 'P-006', anatomia: 'P-007', cto: 'P-008',
};

function formatDuracion(dias: number): string {
  if (dias >= 360) return '1 año de acceso';
  return `${dias} días de acceso`;
}

function formatMonto(n: number): string {
  return n.toFixed(n % 1 === 0 ? 0 : 2);
}

// ─── Subcomponentes ──────────────────────────────────────────

/** Medios de pago aceptados (texto, sin logos de terceros) + sello de seguridad. */
function MediosPago() {
  return (
    <div className="text-center">
      <ul className="flex flex-wrap justify-center gap-1.5" aria-label="Medios de pago aceptados">
        {['Yape', 'Visa', 'Mastercard', 'Débito', 'Saldo Mercado Pago'].map((m) => (
          <li key={m} className="rounded-full border border-line bg-white px-2.5 py-1 text-[12px] font-semibold text-muted">{m}</li>
        ))}
      </ul>
      <p className="mt-2 inline-flex items-center gap-1.5 text-[12px] text-subtle">
        <ShieldCheck className="h-3.5 w-3.5 text-jungle-600" aria-hidden />
        Pagas en la página segura de Mercado Pago. Tu tarjeta no pasa por nuestros servidores.
      </p>
    </div>
  );
}

const PASOS = ['Tus datos', 'Pago', 'Listo'] as const;

function Stepper({ actual }: { actual: 1 | 2 | 3 }) {
  return (
    <ol className="flex items-center gap-2 sm:gap-3" aria-label="Pasos de la compra">
      {PASOS.map((label, i) => {
        const n = i + 1;
        const hecho = n < actual;
        const activo = n === actual;
        return (
          <li key={label} className="flex min-w-0 flex-1 items-center gap-2" aria-current={activo ? 'step' : undefined}>
            <span
              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold ${
                hecho ? 'bg-jungle-800 text-white' : activo ? 'bg-jungle-800 text-white ring-4 ring-jungle-100' : 'border border-line bg-white text-subtle'
              }`}
            >
              {hecho ? <Check className="h-4 w-4" aria-hidden /> : n}
            </span>
            <span className={`truncate text-sm font-semibold ${activo || hecho ? 'text-ink' : 'text-subtle'}`}>{label}</span>
            {n < PASOS.length && <span className="hidden h-px flex-1 bg-line sm:block" aria-hidden />}
          </li>
        );
      })}
    </ol>
  );
}

function Campo({
  id, label, error, ayuda, ...input
}: { id: string; label: string; error?: string; ayuda?: string } & InputHTMLAttributes<HTMLInputElement>) {
  const descr = error ? `${id}-error` : ayuda ? `${id}-ayuda` : undefined;
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-[13px] font-medium text-ink">{label}</label>
      <input
        id={id}
        aria-invalid={!!error}
        aria-describedby={descr}
        className={`w-full rounded-xl border bg-white px-4 py-3 text-[16px] text-ink placeholder:text-subtle focus:outline-none focus:ring-4 ${
          error ? 'border-wrong focus:ring-wrong/10' : 'border-line focus:border-jungle-600 focus:ring-jungle-100'
        }`}
        {...input}
      />
      {error ? (
        <p id={`${id}-error`} className="mt-1 text-[13px] text-wrong">{error}</p>
      ) : ayuda ? (
        <p id={`${id}-ayuda`} className="mt-1 text-[13px] text-muted">{ayuda}</p>
      ) : null}
    </div>
  );
}

function Resumen({
  plataforma, duracion, monto, extra, proveedor,
}: { plataforma: string; duracion: number; monto: number; extra?: string; proveedor: string }) {
  return (
    <div className="card p-5 sm:p-6">
      <div className="eyebrow">Tu pedido</div>
      <div className="mt-3 flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="font-display text-lg font-bold text-ink">{plataforma}</div>
          <div className="mt-0.5 flex items-center gap-1.5 text-sm text-muted">
            <Clock className="h-3.5 w-3.5" aria-hidden /> {formatDuracion(duracion)}
          </div>
          {extra && <div className="mt-1 text-sm text-muted">{extra}</div>}
        </div>
      </div>
      <div className="mt-4 flex items-baseline justify-between border-t border-line pt-4">
        <span className="text-sm font-medium text-muted">Total</span>
        <span className="tabular font-display text-[28px] font-extrabold text-ink">S/ {monto.toFixed(2)}</span>
      </div>
      <ul className="mt-4 space-y-2 text-[13px] text-muted">
        <li className="flex gap-2"><ShieldCheck className="h-4 w-4 shrink-0 text-jungle-600" aria-hidden /> Pago seguro procesado por {proveedor}. Tu tarjeta no pasa por nuestros servidores.</li>
        <li className="flex gap-2"><Check className="h-4 w-4 shrink-0 text-jungle-600" aria-hidden /> Acceso inmediato al aprobarse el pago.</li>
      </ul>
    </div>
  );
}

// ─── Página ──────────────────────────────────────────────────

export function Compra() {
  const { slug = '' } = useParams<{ slug: string }>();
  const { plataformas, loading } = usePlataformas();
  const data = plataformas.find((p) => p.slug === slug);
  useDocumentTitle(data ? `Comprar ${data.nombre}` : 'Comprar acceso');

  const [paso, setPaso] = useState<Paso>('datos');
  const [datos, setDatos] = useState<Datos>(DATOS_VACIOS);
  const [errores, setErrores] = useState<Errores>({});
  const [errorGeneral, setErrorGeneral] = useState<string | null>(null);
  const [avisoVoucher, setAvisoVoucher] = useState<string | null>(null);
  const [iniciando, setIniciando] = useState(false);
  const [compra, setCompra] = useState<IniciarCompraRes | null>(null);
  const [abriendoCulqi, setAbriendoCulqi] = useState(false);
  const [procesando, setProcesando] = useState(false);
  const [consultando, setConsultando] = useState(false);
  const [resultado, setResultado] = useState<Resultado | null>(null);
  const [pendiente, setPendiente] = useState<CompraEnCurso | null>(null);
  const procesandoRef = useRef(false);
  const topRef = useRef<HTMLDivElement>(null);

  const esAnatomia = slug === 'anatomia';
  const [segmentos, setSegmentos] = useState<Set<string>>(new Set());

  useEffect(() => {
    const c = leerCompraEnCurso();
    if (c && c.slug === slug) setPendiente(c);
  }, [slug]);

  // Si el alumno vuelve con "Atrás" desde Mercado Pago (página restaurada de
  // la caché del navegador), reactivar el botón de pagar.
  useEffect(() => {
    const onShow = (e: PageTransitionEvent) => { if (e.persisted) { setAbriendoCulqi(false); setIniciando(false); } };
    window.addEventListener('pageshow', onShow);
    return () => window.removeEventListener('pageshow', onShow);
  }, []);

  // Al cambiar de paso (no en la primera carga), subir al indicador (móvil).
  const primerRender = useRef(true);
  useEffect(() => {
    if (primerRender.current) { primerRender.current = false; return; }
    topRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [paso]);

  const precioCliente = useMemo(() => {
    if (esAnatomia) return segmentos.size * PRECIO_POR_SEGMENTO_PEN;
    if (!data) return 0;
    if (typeof data.precio_promocional === 'number' && data.precio_promocional > 0 && data.precio_promocional < data.precio) {
      return data.precio_promocional;
    }
    return data.precio;
  }, [esAnatomia, segmentos, data]);

  const segmentosIds = useMemo(
    () => SEGMENTOS_ANATOMIA.filter((s) => segmentos.has(s.id)).map((s) => s.id),
    [segmentos],
  );
  const montoMostrado = compra?.monto ?? precioCliente;
  const extraResumen = esAnatomia && segmentosIds.length > 0
    ? `${segmentosIds.length} segmento${segmentosIds.length > 1 ? 's' : ''}`
    : undefined;

  function onCampo(campo: Exclude<keyof Datos, 'acepta'>) {
    return (e: ChangeEvent<HTMLInputElement>) => {
      const v = campo === 'dni' ? e.target.value.replace(/\D/g, '').slice(0, 8) : e.target.value;
      setDatos((d) => ({ ...d, [campo]: v }));
      setErrores((er) => ({ ...er, [campo]: undefined }));
      setErrorGeneral(null);
    };
  }

  function validarTodo(): boolean {
    const e = validar(datos);
    setErrores(e);
    if (esAnatomia && segmentos.size === 0) {
      setErrorGeneral('Elige al menos un segmento de Anatomía.');
      return false;
    }
    if (Object.keys(e).length > 0) {
      const primero = Object.keys(e)[0];
      document.getElementById(`f-${primero}`)?.focus();
      return false;
    }
    return true;
  }

  async function continuarAlPago(ev: FormEvent<HTMLFormElement>) {
    ev.preventDefault();
    if (iniciando || !data) return;
    if (!validarTodo()) return;
    setIniciando(true);
    setErrorGeneral(null);
    const correo = datos.correo.trim().toLowerCase();
    const res = await iniciarCompra({
      slug,
      nombre: datos.nombre.trim(),
      correo,
      dni: datos.dni.trim(),
      whatsapp: datos.whatsapp.replace(/\s|-/g, ''),
      aceptaTerminos: true,
      ...(esAnatomia ? { segmentos: segmentosIds } : {}),
    });
    setIniciando(false);
    if (res.ok && res.data) {
      setCompra(res.data);
      guardarCompraEnCurso({
        id_compra: res.data.id_compra, correo, slug,
        init_point: res.data.init_point, expira: res.data.expira,
      });
      // Mercado Pago: directo a su página segura (un clic menos). Culqi abre su modal en el paso 2.
      if (res.data.pasarela === 'mercadopago' && res.data.init_point) {
        setAbriendoCulqi(true);
        window.location.assign(res.data.init_point);
        return;
      }
      setPaso('pago');
      return;
    }
    if (res.code === CODIGO.NO_CONFIGURADA) {
      setAvisoVoucher('El pago con tarjeta o Yape todavía no está disponible. Puedes pagar con voucher y activamos tu acceso en cuanto lo revisemos.');
      setPaso('voucher');
      return;
    }
    if (res.code === CODIGO.PASARELA_ERROR) {
      setErrorGeneral('No pudimos conectar con la pasarela de pago. Intenta de nuevo en unos minutos o paga con voucher (enlace abajo).');
      return;
    }
    setErrorGeneral(res.message || res.error || 'No pudimos continuar. Revisa tu conexión e intenta de nuevo.');
  }

  function irAVoucher() {
    if (paso === 'datos' && !validarTodo()) return;
    setAvisoVoucher(null);
    setPaso('voucher');
  }

  async function pagar() {
    if (!compra || abriendoCulqi || procesandoRef.current) return;
    setErrorGeneral(null);

    // Mercado Pago Checkout Pro: redirección en la misma pestaña. La compra
    // en curso ya quedó guardada para retomarla al volver (/gracias).
    if (compra.pasarela === 'mercadopago') {
      if (!compra.init_point) {
        setErrorGeneral('No pudimos preparar el pago. Vuelve a intentarlo o paga con voucher.');
        return;
      }
      setAbriendoCulqi(true);
      window.location.assign(compra.init_point);
      return;
    }

    if (!compra.publicKey) {
      setErrorGeneral('No pudimos preparar el pago. Vuelve a intentarlo o paga con voucher.');
      return;
    }
    setAbriendoCulqi(true);
    try {
      await abrirCheckoutCulqi({
        publicKey: compra.publicKey,
        titulo: 'SINAPSIS EDU',
        montoCentimos: compra.montoCentimos,
        onToken: (token) => { void confirmar(token); },
        onError: (m) => setErrorGeneral(m),
      });
    } catch (err) {
      setErrorGeneral(
        (err instanceof Error ? err.message : 'No se pudo abrir la pasarela.') +
        ' Si el problema sigue, paga con voucher.',
      );
    } finally {
      setAbriendoCulqi(false);
    }
  }

  /** Consulta el estado real antes de decir que algo falló. */
  async function verificarEstado(): Promise<void> {
    if (!compra) return;
    setConsultando(true);
    const correo = datos.correo.trim().toLowerCase();
    let res = await estadoCompra(compra.id_compra, correo);
    if (!res.ok) {
      await new Promise((r) => window.setTimeout(r, 2500));
      res = await estadoCompra(compra.id_compra, correo);
    }
    setConsultando(false);
    const d = res.data;
    if (res.ok && d) {
      if (d.estado_pago === 'aprobado') {
        setResultado({ tipo: 'aprobado', plataforma: d.plataforma, fechaFin: d.fecha_fin, correo });
      } else if (d.estado_pago === 'en_revision') {
        setResultado({ tipo: 'revision' });
      } else if (d.expirada) {
        setResultado({ tipo: 'expirada' });
      } else {
        setResultado({ tipo: 'en_proceso' });
      }
    } else {
      setResultado({ tipo: 'en_proceso' });
    }
    setPaso('resultado');
  }

  async function confirmar(token: string) {
    if (!compra || procesandoRef.current) return;
    procesandoRef.current = true;
    setProcesando(true);
    setErrorGeneral(null);
    const correo = datos.correo.trim().toLowerCase();
    try {
      const res = await confirmarPago(compra.id_compra, token, correo);
      if (res.ok && res.data) {
        setResultado({
          tipo: 'aprobado',
          plataforma: res.data.plataforma,
          fechaFin: res.data.fecha_fin,
          correo: res.data.correo,
          passwordEnviada: res.data.passwordEnviada,
        });
        setPaso('resultado');
        return;
      }
      switch (res.code) {
        case CODIGO.RECHAZADO:
          setResultado({ tipo: 'rechazado', mensaje: res.error || 'Tu pago fue rechazado.' });
          setPaso('resultado');
          return;
        case CODIGO.REVISION:
          setResultado({ tipo: 'revision' });
          setPaso('resultado');
          return;
        case CODIGO.EXPIRADA:
          setResultado({ tipo: 'expirada' });
          setPaso('resultado');
          return;
        case CODIGO.NO_CONFIGURADA:
          setAvisoVoucher('El pago en línea no está disponible ahora. Puedes pagar con voucher.');
          setPaso('voucher');
          return;
        case CODIGO.OCUPADO:
          setErrorGeneral(res.error || 'Estamos procesando otro pago. Intenta en unos segundos.');
          return;
        default:
          // Error de red, EN_PROCESO u otro: preguntar al servidor antes de decir que falló.
          await verificarEstado();
      }
    } finally {
      procesandoRef.current = false;
      setProcesando(false);
    }
  }

  function reintentar() {
    setResultado(null);
    setErrorGeneral(null);
    setPaso('pago');
  }

  function empezarDeNuevo() {
    setResultado(null);
    setCompra(null);
    setErrorGeneral(null);
    setPaso('datos');
  }

  const pasoNum: 1 | 2 | 3 = paso === 'datos' ? 1 : paso === 'resultado' ? 3 : 2;

  // ─── Render ────────────────────────────────────────────────

  if (!data) {
    return (
      <div className="flex min-h-screen flex-col">
        <Navbar />
        <main className="container-x flex-1 py-16">
          {loading ? (
            <p className="flex items-center gap-2 text-muted"><Loader2 className="h-4 w-4 animate-spin" aria-hidden /> Cargando…</p>
          ) : (
            <>
              <h1 className="text-3xl">Plataforma no encontrada</h1>
              <Link to="/" className="btn-secondary mt-6">Volver al inicio</Link>
            </>
          )}
        </main>
        <Footer />
      </div>
    );
  }

  const duracion = compra?.duracion_dias ?? data.duracion_dias;

  return (
    <div className="flex min-h-screen flex-col bg-paper">
      <Navbar />
      <main className="container-x flex-1 py-10 md:py-14">
        <div ref={topRef} className="scroll-mt-24">
          <Link to={`/plataforma/${slug}`} className="inline-flex min-h-[44px] items-center gap-2 text-sm font-semibold text-jungle-600 hover:text-jungle-800">
            <ArrowLeft className="h-4 w-4" aria-hidden /> {data.nombre}
          </Link>
          <p className="eyebrow mt-2">Comprar acceso</p>
          <h1 className="mt-2 text-[30px] leading-tight sm:text-[40px]">{data.nombre}</h1>
          <div className="mt-6 max-w-xl">
            <Stepper actual={pasoNum} />
          </div>
        </div>

        <div className="mt-8 grid gap-8 lg:grid-cols-12">
          <section className="min-w-0 lg:col-span-7">
            {pendiente && paso === 'datos' && (
              <div className="mb-6">
                <AvisoSuave>
                  Tienes una compra reciente (<span className="font-mono">{pendiente.id_compra}</span>).{' '}
                  <Link to={`/gracias?id=${encodeURIComponent(pendiente.id_compra)}`} className="font-semibold text-jungle-600 underline underline-offset-2">
                    Ver su estado
                  </Link>
                </AvisoSuave>
              </div>
            )}

            {/* ── Paso 1: datos ── */}
            {paso === 'datos' && (
              <form onSubmit={continuarAlPago} noValidate className="space-y-6">
                {esAnatomia && (
                  <div>
                    <h2 className="text-xl">Elige tus segmentos</h2>
                    <p className="mt-1 text-sm text-muted">S/ {PRECIO_POR_SEGMENTO_PEN} por segmento, 30 días cada uno.</p>
                    <div className="mt-4">
                      <AnatomiaSegmentos seleccionados={segmentos} onChange={(s) => { setSegmentos(s); setErrorGeneral(null); }} />
                    </div>
                  </div>
                )}

                <div className="card space-y-4 p-5 sm:p-6">
                  <div>
                    <h2 className="text-xl">Tus datos</h2>
                    <p className="mt-1 text-sm text-muted">Te enviaremos el acceso a tu correo.</p>
                  </div>
                  <Campo id="f-nombre" label="Nombre completo" value={datos.nombre} onChange={onCampo('nombre')} autoComplete="name" error={errores.nombre} />
                  <Campo id="f-correo" label="Correo" type="email" inputMode="email" value={datos.correo} onChange={onCampo('correo')} autoComplete="email" error={errores.correo} />
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Campo id="f-dni" label="DNI" inputMode="numeric" maxLength={8} value={datos.dni} onChange={onCampo('dni')} error={errores.dni} />
                    <Campo id="f-whatsapp" label="WhatsApp" type="tel" inputMode="tel" placeholder="51987654321" value={datos.whatsapp} onChange={onCampo('whatsapp')} autoComplete="tel" error={errores.whatsapp} />
                  </div>

                  <div>
                    <label htmlFor="f-acepta" className="flex cursor-pointer items-start gap-3 text-[14px] leading-relaxed text-ink">
                      <input
                        id="f-acepta"
                        type="checkbox"
                        checked={datos.acepta}
                        onChange={(e) => { setDatos((d) => ({ ...d, acepta: e.target.checked })); setErrores((er) => ({ ...er, acepta: undefined })); }}
                        aria-invalid={!!errores.acepta}
                        aria-describedby={errores.acepta ? 'f-acepta-error' : undefined}
                        className="mt-0.5 h-5 w-5 shrink-0 rounded border-line accent-jungle-800"
                      />
                      <span>
                        Acepto los{' '}
                        <a href="#/terminos" target="_blank" rel="noopener" className="font-semibold text-jungle-600 underline underline-offset-2">Términos y Condiciones</a>{' '}
                        y la{' '}
                        <a href="#/privacidad" target="_blank" rel="noopener" className="font-semibold text-jungle-600 underline underline-offset-2">Política de Privacidad</a>.
                        Entiendo que la cuenta es personal y no se puede compartir.
                      </span>
                    </label>
                    {errores.acepta && <p id="f-acepta-error" className="mt-1 text-[13px] text-wrong">{errores.acepta}</p>}
                  </div>
                </div>

                {errorGeneral && (
                  <div role="alert" className="rounded-xl border border-wrong/20 bg-wrong/5 px-4 py-3 text-sm text-wrong">{errorGeneral}</div>
                )}

                <div className="flex flex-col gap-3">
                  <button type="submit" disabled={iniciando || abriendoCulqi || (esAnatomia && segmentos.size === 0)} className="btn-primary w-full py-4 text-base disabled:opacity-60">
                    {abriendoCulqi
                      ? <><Loader2 className="h-4 w-4 animate-spin" aria-hidden /> Te llevamos a Mercado Pago…</>
                      : iniciando
                        ? <><Loader2 className="h-4 w-4 animate-spin" aria-hidden /> Preparando tu pago…</>
                        : <><Lock className="h-4 w-4" aria-hidden /> Pagar S/ {formatMonto(precioCliente)}</>}
                  </button>
                  <MediosPago />
                  <button type="button" onClick={irAVoucher} className="mt-1 min-h-[44px] self-center text-sm font-semibold text-jungle-600 underline underline-offset-2 hover:text-jungle-800">
                    ¿Prefieres Binance o transferencia? Paga con voucher
                  </button>
                </div>
              </form>
            )}

            {/* ── Paso 2: pago ── */}
            {paso === 'pago' && compra && (
              <div className="space-y-6">
                <div className="card p-5 sm:p-6">
                  <div className="eyebrow">Resumen</div>
                  <dl className="mt-4 divide-y divide-line text-[15px]">
                    <div className="flex justify-between gap-4 py-2.5"><dt className="text-muted">Plataforma</dt><dd className="text-right font-semibold text-ink">{compra.plataforma}</dd></div>
                    <div className="flex justify-between gap-4 py-2.5"><dt className="text-muted">Vigencia</dt><dd className="text-right font-semibold text-ink">{formatDuracion(compra.duracion_dias)}</dd></div>
                    <div className="flex justify-between gap-4 py-2.5"><dt className="text-muted">Acceso para</dt><dd className="min-w-0 break-all text-right font-semibold text-ink">{datos.correo.trim().toLowerCase()}</dd></div>
                  </dl>
                  <div className="mt-4 border-t border-line pt-4">
                    <div className="text-sm font-medium text-muted">Total a pagar</div>
                    <div className="tabular font-display text-[44px] font-extrabold leading-none text-ink">S/ {compra.monto.toFixed(2)}</div>
                  </div>
                </div>

                {errorGeneral && (
                  <div role="alert" className="rounded-xl border border-wrong/20 bg-wrong/5 px-4 py-3 text-sm text-wrong">{errorGeneral}</div>
                )}

                <div>
                  <button
                    type="button"
                    onClick={pagar}
                    disabled={abriendoCulqi || procesando}
                    className="btn-primary w-full text-base disabled:opacity-60"
                  >
                    {abriendoCulqi
                      ? <><Loader2 className="h-4 w-4 animate-spin" aria-hidden /> {compra.pasarela === 'mercadopago' ? 'Te llevamos a Mercado Pago…' : 'Abriendo la pasarela…'}</>
                      : <><Lock className="h-4 w-4" aria-hidden /> Pagar S/ {compra.monto.toFixed(compra.monto % 1 === 0 ? 0 : 2)} con tarjeta o Yape</>}
                  </button>
                  <p className="mt-2 text-center text-[13px] text-muted">
                    {compra.pasarela === 'mercadopago'
                      ? 'Te llevaremos a la página segura de Mercado Pago. Al terminar volverás aquí solo.'
                      : 'Se abre la ventana segura de Culqi. Con Yape necesitas el código de aprobación de tu app.'}
                    {' '}Tienes 30 minutos para completar el pago.
                  </p>
                </div>

                <div className="flex flex-col gap-2 border-t border-line pt-4 sm:flex-row sm:justify-between">
                  <button type="button" onClick={() => { setPaso('datos'); setCompra(null); setErrorGeneral(null); }} className="min-h-[44px] self-start text-sm font-semibold text-jungle-600 hover:text-jungle-800">
                    ← Corregir mis datos
                  </button>
                  <button type="button" onClick={irAVoucher} className="min-h-[44px] self-start text-sm font-semibold text-jungle-600 underline underline-offset-2 hover:text-jungle-800">
                    Prefiero pagar con voucher
                  </button>
                </div>
              </div>
            )}

            {/* ── Paso 3: resultado ── */}
            {paso === 'resultado' && resultado && (
              <div className="card p-5 sm:p-8">
                {resultado.tipo === 'aprobado' && (
                  <ResultadoAprobado
                    plataforma={resultado.plataforma}
                    fechaFin={resultado.fechaFin}
                    correo={resultado.correo}
                    passwordEnviada={resultado.passwordEnviada}
                    idCompra={compra?.id_compra}
                  />
                )}
                {resultado.tipo === 'rechazado' && (
                  <ResultadoRechazado mensaje={resultado.mensaje} onReintentar={reintentar} onVoucher={irAVoucher} plataforma={data.nombre} />
                )}
                {resultado.tipo === 'expirada' && (
                  <ResultadoRechazado
                    mensaje="Pasaron más de 30 minutos sin completar el pago."
                    onReintentar={empezarDeNuevo}
                    onVoucher={irAVoucher}
                    plataforma={data.nombre}
                  />
                )}
                {resultado.tipo === 'en_proceso' && (
                  <ResultadoEnProceso onConsultar={verificarEstado} consultando={consultando} idCompra={compra?.id_compra} />
                )}
                {resultado.tipo === 'revision' && (
                  <ResultadoEnProceso
                    titulo="Recibimos tu pago y lo estamos verificando"
                    texto={<>Necesitamos revisar un detalle antes de activar tu acceso. <strong className="text-ink">No vuelvas a pagar.</strong> Te escribiremos por correo o WhatsApp en breve.</>}
                    idCompra={compra?.id_compra}
                  />
                )}
              </div>
            )}

            {/* ── Plan B: voucher ── */}
            {paso === 'voucher' && (
              <div className="space-y-4">
                {avisoVoucher && <AvisoSuave>{avisoVoucher}</AvisoSuave>}
                <PagoVoucher
                  slug={slug}
                  idPlataforma={ID_POR_SLUG[slug] ?? ''}
                  monto={precioCliente}
                  datos={{ nombre: datos.nombre, correo: datos.correo, whatsapp: datos.whatsapp }}
                  detalleExtra={esAnatomia ? { segmentos: segmentosIds } : undefined}
                  onVolver={() => { setPaso(compra ? 'pago' : 'datos'); setAvisoVoucher(null); }}
                />
              </div>
            )}
          </section>

          <aside className="lg:col-span-5">
            <div className="lg:sticky lg:top-24">
              <Resumen
                plataforma={data.nombre}
                duracion={duracion}
                monto={montoMostrado}
                extra={extraResumen}
                proveedor={compra?.pasarela === 'culqi' ? 'Culqi' : 'Mercado Pago'}
              />
            </div>
          </aside>
        </div>
      </main>
      <Footer />

      {procesando && (
        <div
          role="alertdialog"
          aria-modal="true"
          aria-labelledby="procesando-titulo"
          className="fixed inset-0 z-[60] flex items-center justify-center bg-jungle-900/70 px-5"
        >
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 text-center shadow-mock">
            <Loader2 className="mx-auto h-8 w-8 animate-spin text-jungle-800" aria-hidden />
            <div id="procesando-titulo" className="mt-4 font-display text-xl font-bold text-ink">Procesando tu pago…</div>
            <p className="mt-2 text-sm text-muted">No cierres ni recargues esta página. Toma unos segundos.</p>
          </div>
        </div>
      )}
    </div>
  );
}
