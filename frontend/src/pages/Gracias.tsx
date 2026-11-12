import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Check, Clock, Loader2, Mail, MessageCircle } from 'lucide-react';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { WhatsAppButton } from '@/components/WhatsAppButton';
import {
  ResultadoAprobado, ResultadoEnProceso, ResultadoRechazado,
} from '@/components/compra/Resultados';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { useAuth } from '@/hooks/useAuth';
import {
  CODIGO, borrarCompraEnCurso, confirmarPagoMP, estadoCompra, leerCompraEnCurso, type CompraEnCurso,
} from '@/api/pagos';

/** Contenido para el pago por voucher (pendiente de revisión manual). */
function VoucherRecibido({ idCompra }: { idCompra: string | null }) {
  return (
    <div className="space-y-6">
      <div>
        <div className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-correct/10">
          <Check className="h-7 w-7 text-correct" aria-hidden />
        </div>
        <h1 className="mt-4 text-[30px] leading-tight sm:text-[36px]">¡Solicitud enviada!</h1>
        <p className="mt-2 text-[16px] text-muted">
          Ya tenemos tu comprobante. Validamos tu pago y te enviamos el acceso por correo.
        </p>
        {idCompra && (
          <p className="mt-3 text-sm text-muted">Código: <span className="font-mono font-semibold text-ink">{idCompra}</span></p>
        )}
      </div>
      <ol className="divide-y divide-line rounded-2xl border border-line bg-white">
        <li className="flex gap-3 p-4 text-[15px]">
          <Clock className="mt-0.5 h-5 w-5 shrink-0 text-warning" aria-hidden />
          <span>Activamos tu acceso <strong>en cuanto validamos tu pago</strong>.</span>
        </li>
        <li className="flex gap-3 p-4 text-[15px]">
          <Mail className="mt-0.5 h-5 w-5 shrink-0 text-jungle-600" aria-hidden />
          <span>Te llegará un correo con tu <strong>usuario y contraseña</strong> apenas aprobemos.</span>
        </li>
        <li className="flex gap-3 p-4 text-[15px]">
          <MessageCircle className="mt-0.5 h-5 w-5 shrink-0 text-whatsapp" aria-hidden />
          <span>Si pasa más de 1 hora, escríbenos por WhatsApp con tu código{idCompra && <strong> {idCompra}</strong>}.</span>
        </li>
      </ol>
      <div className="flex flex-col gap-3 sm:flex-row">
        <WhatsAppButton
          message={idCompra ? `Hola, quiero confirmar el estado de mi compra ${idCompra}.` : 'Hola, acabo de hacer una compra en SINAPSIS EDU.'}
        />
        <Link to="/" className="btn-secondary">Volver al inicio</Link>
      </div>
    </div>
  );
}

type Vista =
  | { tipo: 'cargando' }
  | { tipo: 'voucher' }
  | { tipo: 'aprobado'; plataforma: string; fechaFin: string; correo?: string; passwordEnviada?: boolean; sesionIniciada?: boolean }
  | { tipo: 'rechazado'; mensaje: string }
  | { tipo: 'en_proceso' }
  | { tipo: 'revision' }
  | { tipo: 'anulada' }
  | { tipo: 'aprobado_sin_datos' }
  | { tipo: 'sin_compra' };

const RE_PAYMENT = /^\d{1,20}$/;

export function Gracias() {
  useDocumentTitle('Estado de tu compra');
  const location = useLocation();
  const navigate = useNavigate();
  // Con HashRouter el query string vive después del segundo `?`: /#/gracias?id_compra=C-001&payment_id=…
  const q = new URLSearchParams(location.search);
  const idCompra = q.get('id_compra') || q.get('id');
  const paymentIdRaw = q.get('payment_id') || '';
  const paymentId = RE_PAYMENT.test(paymentIdRaw) ? paymentIdRaw : null;
  const statusMP = q.get('status'); // approved | pending | in_process | rejected | null…

  const [guardada] = useState<CompraEnCurso | null>(() => leerCompraEnCurso());
  const propia = guardada && idCompra && guardada.id_compra === idCompra ? guardada : null;
  const correo = propia ? propia.correo : null;

  const [vista, setVista] = useState<Vista>({ tipo: 'cargando' });
  const [consultando, setConsultando] = useState(false);
  const { login, isAuthenticated } = useAuth();
  const slug = propia?.slug;

  /** Mercado Pago: confirma con el pago que trae la URL. */
  const confirmarMP = useCallback(async (): Promise<boolean> => {
    if (!idCompra || !paymentId) return false;
    // Sin correo guardado (otro navegador/dispositivo) el servidor valida con el payment_id.
    const res = await confirmarPagoMP(idCompra, paymentId, correo ?? '');
    if (res.ok && res.data) {
      const s = res.data.sesion;
      if (s?.token) login(s.token, s.usuario);
      borrarCompraEnCurso();
      setVista({
        tipo: 'aprobado', plataforma: res.data.plataforma, fechaFin: res.data.fecha_fin,
        correo: res.data.correo, passwordEnviada: res.data.passwordEnviada,
        sesionIniciada: !!s?.token || isAuthenticated,
      });
      return true;
    }
    if (res.code === CODIGO.RECHAZADO) { setVista({ tipo: 'rechazado', mensaje: res.error || 'Tu pago fue rechazado.' }); return true; }
    if (res.code === CODIGO.EN_PROCESO) { setVista({ tipo: 'en_proceso' }); return true; }
    if (res.code === CODIGO.REVISION) { setVista({ tipo: 'revision' }); return true; }
    return false; // red u otro: consultar el estado de la compra
  }, [idCompra, correo, paymentId, login, isAuthenticated]);

  /** Estado de la compra en el servidor (vale para todas las pasarelas y el voucher). */
  const consultarEstado = useCallback(async () => {
    if (!idCompra || !correo) return;
    const res = await estadoCompra(idCompra, correo);
    const d = res.data;
    if (!res.ok || !d) { setVista({ tipo: 'en_proceso' }); return; }
    const ep = d.estado_pago;
    if (ep === 'aprobado' && d.estado_acceso === 'activo') {
      setVista({ tipo: 'aprobado', plataforma: d.plataforma, fechaFin: d.fecha_fin, correo });
    } else if (ep === 'pendiente') {
      setVista({ tipo: 'voucher' });
    } else if (ep === 'pendiente_pago') {
      if (d.expirada) setVista({ tipo: 'rechazado', mensaje: 'Tu compra expiró sin completar el pago. No se realizó ningún cobro.' });
      else if (statusMP && statusMP !== 'approved' && statusMP !== 'pending' && statusMP !== 'in_process') {
        setVista({ tipo: 'rechazado', mensaje: 'El pago no se completó. No se realizó ningún cobro.' });
      } else setVista({ tipo: 'en_proceso' });
    } else if (ep === 'en_revision') {
      setVista({ tipo: 'revision' });
    } else if (ep === 'rechazado') {
      setVista({ tipo: 'rechazado', mensaje: 'No pudimos verificar tu pago.' });
    } else {
      setVista({ tipo: 'anulada' });
    }
  }, [idCompra, correo, statusMP]);

  const actualizar = useCallback(async () => {
    setConsultando(true);
    try {
      // Sin código de compra (entrada directa o enlace incompleto): no afirmamos nada sobre un pago.
      if (!idCompra) { setVista({ tipo: 'sin_compra' }); return; }
      if (!correo && paymentId && (await confirmarMP())) return;
      if (!correo) {
        // Otro navegador/dispositivo: no podemos consultar. Mostramos lo que dijo MP.
        if (statusMP === 'approved') setVista({ tipo: 'aprobado_sin_datos' });
        else if (statusMP === 'pending' || statusMP === 'in_process') setVista({ tipo: 'en_proceso' });
        else if (statusMP) setVista({ tipo: 'rechazado', mensaje: 'El pago no se completó.' });
        else setVista({ tipo: 'voucher' });
        return;
      }
      if (paymentId && (await confirmarMP())) return;
      await consultarEstado();
    } finally {
      setConsultando(false);
    }
  }, [idCompra, correo, statusMP, paymentId, confirmarMP, consultarEstado]);

  // Primera consulta al llegar. (Solo una vez: `actualizar` cambia tras el login automático.)
  const consultado = useRef(false);
  useEffect(() => {
    if (consultado.current) return;
    consultado.current = true;
    void actualizar();
  }, [actualizar]);

  // Pago en proceso (Yape/PagoEfectivo lentos): volver a consultar solo cada 6 s, hasta 3 min.
  const intentos = useRef(0);
  useEffect(() => {
    if (vista.tipo !== 'en_proceso' || !correo) return;
    if (intentos.current >= 30) return;
    const id = window.setTimeout(() => { intentos.current += 1; void actualizar(); }, 6000);
    return () => window.clearTimeout(id);
  }, [vista, correo, actualizar]);

  /** Reintentar: reabre el mismo enlace de pago si sigue vigente; si no, vuelve a la compra. */
  function reintentar() {
    if (propia?.init_point && propia.expira && new Date(propia.expira).getTime() > Date.now() + 60_000) {
      window.location.assign(propia.init_point);
      return;
    }
    navigate(propia ? `/compra/${propia.slug}` : '/');
  }
  function irAVoucher() {
    navigate(propia ? `/compra/${propia.slug}` : '/');
  }

  let contenido: ReactNode;
  switch (vista.tipo) {
    case 'cargando':
      contenido = (
        <p className="flex items-center gap-2 text-muted" aria-live="polite">
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> Consultando el estado de tu pago…
        </p>
      );
      break;
    case 'voucher':
      contenido = <VoucherRecibido idCompra={idCompra} />;
      break;
    case 'sin_compra':
      contenido = (
        <div className="space-y-5">
          <h1 className="text-[30px] leading-tight sm:text-[36px]">No encontramos una compra en curso</h1>
          <p className="text-[16px] text-muted">
            Si ya pagaste, revisa tu correo o entra a tu portal. Si tienes un código de compra, escríbenos y lo revisamos.
          </p>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Link to="/portal" className="btn-primary">Ir a mi portal</Link>
            <WhatsAppButton message="Hola, quiero consultar el estado de mi compra en SINAPSIS EDU." />
            <Link to="/" className="btn-secondary">Volver al inicio</Link>
          </div>
        </div>
      );
      break;
    case 'aprobado':
      contenido = (
        <ResultadoAprobado
          plataforma={vista.plataforma} fechaFin={vista.fechaFin} correo={vista.correo}
          passwordEnviada={vista.passwordEnviada} idCompra={idCompra ?? undefined}
          slug={slug} sesionIniciada={vista.sesionIniciada}
        />
      );
      break;
    case 'aprobado_sin_datos':
      contenido = (
        <ResultadoEnProceso
          titulo="¡Pago recibido!"
          texto="Mercado Pago aprobó tu pago. Estamos activando tu acceso y te enviaremos un correo con tus datos en unos minutos."
          idCompra={idCompra ?? undefined}
        />
      );
      break;
    case 'rechazado':
      contenido = <ResultadoRechazado mensaje={vista.mensaje} onReintentar={reintentar} onVoucher={propia ? irAVoucher : undefined} />;
      break;
    case 'en_proceso':
      contenido = (
        <ResultadoEnProceso
          onConsultar={correo ? actualizar : undefined}
          consultando={consultando}
          idCompra={idCompra ?? undefined}
          texto={<>Tu pago está en proceso. <strong className="text-ink">No vuelvas a pagar.</strong> Apenas se confirme, tu acceso se activa solo y te avisamos por correo.</>}
        />
      );
      break;
    case 'revision':
      contenido = (
        <ResultadoEnProceso
          titulo="Recibimos tu pago y lo estamos verificando"
          texto={<>Te escribiremos por correo o WhatsApp en breve. <strong className="text-ink">No vuelvas a pagar.</strong></>}
          idCompra={idCompra ?? undefined}
        />
      );
      break;
    case 'anulada':
      contenido = (
        <ResultadoEnProceso
          titulo="Tu acceso no está activo"
          texto="Esta compra fue devuelta o anulada. Si crees que es un error, escríbenos."
          idCompra={idCompra ?? undefined}
        />
      );
      break;
  }

  return (
    <div className="flex min-h-screen flex-col bg-paper">
      <Navbar />
      <main className="container-x flex-1 py-12 md:py-16">
        <div className="card mx-auto max-w-2xl p-5 sm:p-8">{contenido}</div>
      </main>
      <Footer />
    </div>
  );
}
