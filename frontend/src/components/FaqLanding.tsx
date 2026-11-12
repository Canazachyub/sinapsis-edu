import { Plus } from 'lucide-react';
import { SectionHeader } from './landing/SectionHeader';

interface QA {
  q: string;
  a: string;
}

// FAQ general de la landing (dudas comunes previas a la compra).
const FAQS: QA[] = [
  {
    q: '¿De dónde salen las preguntas?',
    a: 'De exámenes ya tomados: tenemos un archivo de más de 15 000 preguntas reales de ENAM, ENCIB, Residentado, EsSalud y SERUMS, actualizado hasta 2026. Cada una viene con su justificación.',
  },
  {
    q: '¿El simulacro gratis tiene alguna condición?',
    a: 'No. El primer simulacro de cada examen es gratis: solo te registras con tus datos y lo rindes completo, con tiempo real y tu nota al final. No pedimos tarjeta.',
  },
  {
    q: '¿Cómo compro un acceso?',
    a: 'Elige tu plataforma, escribe tu nombre, correo, DNI y WhatsApp, y paga con Yape o tarjeta en la página segura de Mercado Pago. Al aprobarse el pago entras directo a tu Portal y te enviamos tu contraseña por correo.',
  },
  {
    q: '¿Qué métodos de pago aceptan?',
    a: 'Yape, tarjetas de crédito o débito (Visa, Mastercard y otras) y saldo de Mercado Pago, con activación al instante. Si prefieres Binance (USDT) o transferencia BCP, también puedes pagar y subir tu voucher.',
  },
  {
    q: '¿Cuánto tarda en activarse mi acceso?',
    a: 'Con Yape o tarjeta, al instante: apenas Mercado Pago aprueba el pago. Con voucher (Binance o transferencia) lo verificamos dentro de las 24 horas hábiles, normalmente en minutos.',
  },
  {
    q: '¿Es seguro pagar con tarjeta?',
    a: 'Sí. El pago se hace en la página de Mercado Pago, no en la nuestra: tus datos de tarjeta nunca pasan por nuestros servidores. No hay cobros automáticos ni suscripciones.',
  },
  {
    q: '¿Cuánto dura el acceso?',
    a: 'Depende de la plataforma: la mayoría son 30 días y algunos cursos tienen acceso por 1 año. La duración exacta aparece en cada plataforma antes de pagar. No hay renovaciones automáticas.',
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
