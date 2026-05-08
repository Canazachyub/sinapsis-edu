import { useEffect, useState } from 'react';
import { Stethoscope, Check } from 'lucide-react';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { PlataformaCard } from '@/components/PlataformaCard';
import { WhatsAppFloating } from '@/components/WhatsAppButton';
import { usePlataformas } from '@/hooks/usePlataformas';
import { ping } from '@/api/client';

// Fase 0: landing con hero, grid de plataformas, beneficios y CTA.
// Diseño completo (FAQ, testimonios, animaciones de scroll) en Fase 3/6.
export function Landing() {
  const { plataformas } = usePlataformas();
  const [backendStatus, setBackendStatus] = useState<'unknown' | 'online' | 'setup-pending' | 'down'>('unknown');

  useEffect(() => {
    ping().then((res) => {
      if (!res.ok || !res.data) { setBackendStatus('down'); return; }
      setBackendStatus(res.data.status === 'online' ? 'online' : 'setup-pending');
    });
  }, []);

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      {/* HERO */}
      <section className="bg-lime">
        <div className="container-x py-20 md:py-28">
          <span className="pill"><Stethoscope className="w-4 h-4" /> La central de evaluación médica</span>
          <h1 className="mt-6 text-5xl md:text-7xl text-jungle leading-[1.05] max-w-4xl">
            Prepárate para tu examen<br /> con las mejores plataformas
          </h1>
          <p className="mt-6 max-w-2xl text-lg text-jungle/80">
            ENAM, ENCIB, ENCAPS, Residentado Médico y más. Bancos de preguntas con
            <strong className="font-bold"> justificaciones</strong>, simulacros y
            <strong className="font-bold"> acceso 24/7</strong>.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <a href="#plataformas" className="btn-primary">Ver plataformas</a>
            <a href="#como-funciona" className="btn-ghost">¿Cómo funciona?</a>
          </div>
          <div className="mt-8 flex flex-wrap items-center gap-4 text-sm text-jungle/80">
            <Check className="w-4 h-4" /> Pago por Yape · Binance · Transferencia
            <span className="text-jungle/30">·</span>
            <span className={
              backendStatus === 'online' ? 'text-success' :
              backendStatus === 'setup-pending' ? 'text-warning' :
              backendStatus === 'down' ? 'text-jungle/50' : 'text-jungle/40'
            }>
              {backendStatus === 'online' ? 'Backend conectado' :
               backendStatus === 'setup-pending' ? 'Backend respondiendo, falta correr setup()' :
               backendStatus === 'down' ? 'Backend no desplegado todavía' :
               'Verificando backend...'}
            </span>
          </div>
        </div>
      </section>

      {/* PLATAFORMAS */}
      <section id="plataformas" className="bg-cream">
        <div className="container-x py-20">
          <span className="pill">Plataformas disponibles</span>
          <h2 className="mt-4 text-4xl md:text-5xl">Elige la que necesitas</h2>
          <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {plataformas.map((p) => (
              <PlataformaCard key={p.slug} data={p} />
            ))}
          </div>
        </div>
      </section>

      {/* BENEFICIOS */}
      <section id="como-funciona" className="bg-jungle text-cream">
        <div className="container-x py-20">
          <span className="pill !bg-jungle-dark !text-lime !border-white/10">Beneficios</span>
          <h2 className="mt-4 text-4xl md:text-5xl text-lime max-w-3xl">
            Todo lo que necesitas para aprobar
          </h2>
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {[
              ['Bancos curados', 'Preguntas con justificación, organizadas por curso.'],
              ['Simulacros cronometrados', 'Vive la experiencia real del examen.'],
              ['Acceso multidispositivo', 'Móvil, tablet o laptop. Desde donde estés.'],
            ].map(([title, desc]) => (
              <div key={title} className="bg-jungle-dark border border-white/5 rounded-2xl p-6">
                <div className="w-10 h-10 rounded-lg bg-lime mb-4" aria-hidden />
                <div className="font-semibold text-lg">{title}</div>
                <p className="mt-2 text-sm opacity-80">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Footer />
      <WhatsAppFloating />
    </div>
  );
}
