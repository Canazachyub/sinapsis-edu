import { Plus } from 'lucide-react';
import { SectionHeader } from './landing/SectionHeader';

interface QA {
  q: string;
  a: string;
}

// FAQ general de la landing (dudas comunes previas a la compra).
const FAQS: QA[] = [
  {
    q: '¿Cómo compro un acceso?',
    a: 'Elige tu plataforma, completa tus datos, paga por Yape, Binance o transferencia y sube tu voucher. Cuando verifiquemos el pago te enviamos tus credenciales por correo.',
  },
  {
    q: '¿Qué métodos de pago aceptan?',
    a: 'Yape (QR), Binance (USDT) y transferencia bancaria. También puedes coordinar el pago por WhatsApp si lo prefieres.',
  },
  {
    q: '¿Cuánto tarda en activarse mi acceso?',
    a: 'Normalmente lo verificamos dentro de las 24 horas hábiles tras recibir tu voucher. Te avisamos por correo apenas esté listo.',
  },
  {
    q: '¿Cuánto dura el acceso?',
    a: 'Depende de la plataforma: la mayoría son 30 días; CTO es de 1 año. La duración exacta aparece en cada plataforma antes de comprar.',
  },
  {
    q: '¿Funciona en celular?',
    a: 'Sí. Todas las plataformas son responsive: puedes estudiar desde el celular, tablet o computadora.',
  },
  {
    q: '¿Cómo recupero mi contraseña?',
    a: 'Desde la pantalla de Login usa "¿Olvidaste tu contraseña?" para recibir una nueva por correo, o escríbenos por WhatsApp.',
  },
];

export function FaqLanding() {
  return (
    <section id="faq" className="bg-white">
      <div className="container-x grid gap-12 py-20 md:py-28 lg:grid-cols-12">
        <div className="lg:col-span-4">
          <SectionHeader
            eyebrow="Preguntas frecuentes"
            title="Resolvemos tus dudas"
            lead="¿No encuentras tu respuesta? Escríbenos por WhatsApp de lunes a sábado, de 7:30 a 18:00."
          />
        </div>
        <div className="lg:col-span-8" data-reveal>
          {FAQS.map(({ q, a }) => (
            <details key={q} className="group border-b border-line first:border-t">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-6 py-5 text-[17px] font-semibold text-ink marker:hidden [&::-webkit-details-marker]:hidden">
                {q}
                <Plus className="h-5 w-5 shrink-0 text-subtle transition-transform duration-200 group-open:rotate-45" aria-hidden />
              </summary>
              <p className="-mt-1 pb-5 pr-10 text-[15px] leading-relaxed text-muted">{a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
