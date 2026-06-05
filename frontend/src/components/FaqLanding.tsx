interface QA {
  q: string;
  a: string;
}

// FAQ general de la landing (reúne las dudas comunes previas a la compra,
// reutilizando el estilo del acordeón de las páginas de detalle).
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

function FaqItem({ q, a }: QA) {
  return (
    <details className="group border border-jungle/10 rounded-2xl bg-white overflow-hidden">
      <summary className="cursor-pointer flex items-center justify-between gap-4 px-5 py-4 font-semibold list-none select-none hover:bg-jungle/[.03]">
        {q}
        <span className="shrink-0 text-jungle-light group-open:rotate-180 transition-transform">▾</span>
      </summary>
      <div className="px-5 pb-4 text-jungle-light text-sm leading-relaxed">{a}</div>
    </details>
  );
}

export function FaqLanding() {
  return (
    <section id="faq" className="bg-offwhite">
      <div className="container-x py-20">
        <span className="pill">Preguntas frecuentes</span>
        <h2 className="mt-4 text-4xl md:text-5xl">¿Tienes dudas?</h2>
        <div className="mt-10 grid gap-3 md:grid-cols-2">
          {FAQS.map((f) => (
            <FaqItem key={f.q} {...f} />
          ))}
        </div>
      </div>
    </section>
  );
}
