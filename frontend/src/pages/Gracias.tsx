import { useCallback, useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Check, Clock, Loader2, Mail, MessageCircle } from 'lucide-react';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { WhatsAppButton } from '@/components/WhatsAppButton';
import {
  ResultadoAprobado, ResultadoEnProceso, ResultadoRechazado,
} from '@/components/compra/Resultados';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { estadoCompra, leerCompraEnCurso, type EstadoCompraRes } from '@/api/pagos';

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
          <span><strong>Hasta 24 h hábiles</strong> para validar tu pago (normalmente en minutos).</span>
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

export function Gracias() {
  useDocumentTitle('Estado de tu compra');
  const location = useLocation();
  // Con HashRouter el query string vive después del segundo `?`: /#/gracias?id=C-001
  const idCompra = new URLSearchParams(location.search).get('id');
  const guardada = leerCompraEnCurso();
  const correo = guardada && idCompra && guardada.id_compra === idCompra ? guardada.correo : null;

  const [estado, setEstado] = useState<EstadoCompraRes | null>(null);
  const [cargando, setCargando] = useState<boolean>(!!(idCompra && correo));
  const [fallo, setFallo] = useState(false);

  const consultar = useCallback(async () => {
    if (!idCompra || !correo) return;
    setCargando(true);
    const res = await estadoCompra(idCompra, correo);
    setCargando(false);
    if (res.ok && res.data) {
      setEstado(res.data);
      setFallo(false);
    } else {
      setFallo(true);
    }
  }, [idCompra, correo]);

  useEffect(() => { void consultar(); }, [consultar]);

  let contenido;
  if (cargando && !estado) {
    contenido = (
      <p className="flex items-center gap-2 text-muted" aria-live="polite">
        <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> Consultando el estado de tu compra…
      </p>
    );
  } else if (!estado || fallo) {
    // Sin datos para consultar (o sin conexión): mensaje del flujo de voucher.
    contenido = <VoucherRecibido idCompra={idCompra} />;
  } else {
    const ep = estado.estado_pago;
    if (ep === 'aprobado' && estado.estado_acceso === 'activo') {
      contenido = (
        <ResultadoAprobado plataforma={estado.plataforma} fechaFin={estado.fecha_fin} correo={correo ?? undefined} idCompra={estado.id_compra} />
      );
    } else if (ep === 'pendiente') {
      contenido = <VoucherRecibido idCompra={estado.id_compra} />;
    } else if (ep === 'pendiente_pago') {
      contenido = estado.expirada ? (
        <ResultadoRechazado mensaje="Tu compra expiró sin completar el pago. No se realizó ningún cobro." plataforma={estado.plataforma} />
      ) : (
        <ResultadoEnProceso onConsultar={consultar} consultando={cargando} idCompra={estado.id_compra} />
      );
    } else if (ep === 'en_revision') {
      contenido = (
        <ResultadoEnProceso
          titulo="Recibimos tu pago y lo estamos verificando"
          texto={<>Te escribiremos por correo o WhatsApp en breve. <strong className="text-ink">No vuelvas a pagar.</strong></>}
          idCompra={estado.id_compra}
        />
      );
    } else if (ep === 'rechazado') {
      contenido = <ResultadoRechazado mensaje="No pudimos verificar tu pago." plataforma={estado.plataforma} />;
    } else {
      contenido = (
        <ResultadoEnProceso
          titulo="Tu acceso no está activo"
          texto="Esta compra fue devuelta o anulada. Si crees que es un error, escríbenos."
          idCompra={estado.id_compra}
        />
      );
    }
  }

  const volverACompra = estado && estado.estado_pago === 'pendiente_pago' && estado.slug;

  return (
    <div className="flex min-h-screen flex-col bg-paper">
      <Navbar />
      <main className="container-x flex-1 py-12 md:py-16">
        <div className="card mx-auto max-w-2xl p-5 sm:p-8">
          {contenido}
          {volverACompra && (
            <Link to={`/compra/${estado.slug}`} className="btn-secondary mt-6">Volver a intentar el pago</Link>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
