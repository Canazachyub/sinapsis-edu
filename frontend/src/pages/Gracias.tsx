import { Link, useLocation } from 'react-router-dom';
import { Check, Mail, MessageCircle, Clock } from 'lucide-react';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { WhatsAppButton } from '@/components/WhatsAppButton';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';

export function Gracias() {
  useDocumentTitle('¡Gracias!');
  const location = useLocation();
  // Con HashRouter el query string vive después de un segundo `?`.
  // Ej: /#/gracias?id=C-001 → location.search = "?id=C-001"
  const params = new URLSearchParams(location.search);
  const idCompra = params.get('id');

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 container-x py-16 max-w-xl mx-auto text-center">
        <div className="inline-flex w-16 h-16 rounded-full bg-success/15 items-center justify-center">
          <Check className="w-8 h-8 text-success" aria-hidden />
        </div>
        <h1 className="mt-6 text-4xl">¡Solicitud enviada!</h1>
        {idCompra && (
          <div className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-cream border border-jungle/10 font-mono text-sm">
            ID: <strong className="text-jungle">{idCompra}</strong>
          </div>
        )}
        <p className="mt-5 text-jungle-light">
          Tu voucher ya está en nuestras manos. Vamos a validar tu pago y enviarte
          las credenciales de acceso por correo.
        </p>

        <div className="mt-8 bg-white border border-jungle/10 rounded-2xl p-6 shadow-card text-left">
          <div className="font-semibold mb-3">Qué sigue</div>
          <ul className="space-y-3 text-sm">
            <li className="flex gap-3">
              <Clock className="w-5 h-5 text-warning shrink-0 mt-0.5" />
              <span>
                <strong>Hasta 24h hábiles</strong> para validar tu pago (normalmente en minutos).
              </span>
            </li>
            <li className="flex gap-3">
              <Mail className="w-5 h-5 text-jungle shrink-0 mt-0.5" />
              <span>
                Te enviaremos un correo con tu <strong>usuario y contraseña</strong> apenas aprobemos.
              </span>
            </li>
            <li className="flex gap-3">
              <MessageCircle className="w-5 h-5 text-whatsapp shrink-0 mt-0.5" />
              <span>
                Si pasan más de 1 hora, escríbenos por WhatsApp con tu ID
                {idCompra && <strong> ({idCompra})</strong>} y lo agilizamos.
              </span>
            </li>
          </ul>
        </div>

        <div className="mt-6">
          <WhatsAppButton
            message={
              idCompra
                ? `Hola, soy ${idCompra} y quiero confirmar el estado de mi compra.`
                : 'Hola, acabo de hacer una compra en SINAPSIS EDU.'
            }
          />
        </div>

        <Link to="/" className="btn-ghost mt-8 inline-flex">Volver al inicio</Link>
      </main>
      <Footer />
    </div>
  );
}
