import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Stethoscope, Check } from 'lucide-react';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { PlataformaCard } from '@/components/PlataformaCard';
import { WhatsAppFloating } from '@/components/WhatsAppButton';
import { PromoBanner } from '@/components/PromoBanner';
import { ScrollLink } from '@/components/ScrollLink';
import { CursosCarousel } from '@/components/CursosCarousel';
import { CursosEspecializados } from '@/components/CursosEspecializados';
import { MisionVisionValores } from '@/components/MisionVisionValores';
import { usePlataformas } from '@/hooks/usePlataformas';
import { ping } from '@/api/client';

interface BenefitData {
  imagen: string;
  titulo: string;
  descripcion: string;
}

const BENEFITS: BenefitData[] = [
  {
    imagen: '/images/beneficios/banco-preguntas.png',
    titulo: 'Bancos curados',
    descripcion: 'Más de 6,000 preguntas con justificación, organizadas por curso y actualizadas al 2025.',
  },
  {
    imagen: '/images/beneficios/simulacros.png',
    titulo: 'Simulacros cronometrados',
    descripcion: 'Vive la experiencia real del examen: tiempo limitado, score y feedback inmediato.',
  },
  {
    imagen: '/images/beneficios/multidispositivo.png',
    titulo: 'Acceso multidispositivo',
    descripcion: 'Móvil, tablet o laptop. Donde estés, tu plataforma sincronizada al instante.',
  },
];

interface Stat {
  numero: string;
  label: string;
}

const STATS: Stat[] = [
  { numero: '500+', label: 'Estudiantes activos' },
  { numero: '95%', label: 'Tasa de aprobación' },
  { numero: '25+', label: 'Cursos biomédicos' },
  { numero: '24/7', label: 'Soporte al alumno' },
];

export function Landing() {
  const { plataformas } = usePlataformas();
  const [backendStatus, setBackendStatus] = useState<'unknown' | 'online' | 'setup-pending' | 'down'>('unknown');
  const location = useLocation();

  useEffect(() => {
    ping().then((res) => {
      if (!res.ok || !res.data) { setBackendStatus('down'); return; }
      setBackendStatus(res.data.status === 'online' ? 'online' : 'setup-pending');
    });
  }, []);

  // Cross-page scroll: cuando otro componente navega con state.scrollTo, scrollea aqui.
  useEffect(() => {
    const state = location.state as { scrollTo?: string } | null;
    if (!state?.scrollTo) return;
    const target = state.scrollTo;
    // Esperar un frame a que el DOM tenga los IDs disponibles.
    const id = window.setTimeout(() => {
      document.getElementById(target)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 80);
    return () => window.clearTimeout(id);
  }, [location.state]);

  return (
    <div className="min-h-screen flex flex-col">
      <PromoBanner />
      <Navbar />

      {/* HERO */}
      <section className="bg-lime relative overflow-hidden">
        <div className="container-x py-16 md:py-24 grid md:grid-cols-12 gap-8 md:gap-12 items-center relative z-10">
          <div className="md:col-span-5">
            <span className="pill"><Stethoscope className="w-4 h-4" /> La central de evaluación médica</span>
            <h1 className="mt-6 text-5xl md:text-6xl xl:text-7xl text-jungle leading-[1.05]">
              Prepárate para tu examen<br /> con las mejores plataformas
            </h1>
            <p className="mt-6 max-w-xl text-lg text-jungle/80">
              ENAM, ENCIB, ENCAPS, Residentado Médico y más. Bancos de preguntas con
              <strong className="font-bold"> justificaciones</strong>, simulacros y
              <strong className="font-bold"> acceso 24/7</strong>.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <ScrollLink to="plataformas" className="btn-primary cursor-pointer">Ver plataformas</ScrollLink>
              <ScrollLink to="beneficios" className="btn-ghost cursor-pointer">¿Cómo funciona?</ScrollLink>
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
          <div className="md:col-span-7">
            <img
              src="/images/hero/hero-ilustracion.png"
              alt="Estudiante de medicina aprendiendo en línea con SINAPSIS EDU"
              className="w-full h-auto max-w-3xl mx-auto block"
              loading="eager"
            />
          </div>
        </div>
      </section>

      {/* STATS */}
      <section className="bg-jungle text-cream">
        <div className="container-x py-14">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {STATS.map((s) => (
              <div key={s.label} className="px-4">
                <div className="font-display text-5xl md:text-6xl text-lime">{s.numero}</div>
                <div className="mt-2 text-sm opacity-80">{s.label}</div>
              </div>
            ))}
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
      <section id="beneficios" className="bg-jungle text-cream">
        <div className="container-x py-20">
          <span className="pill !bg-jungle-dark !text-lime !border-white/10">Beneficios</span>
          <h2 className="mt-4 text-4xl md:text-5xl text-lime max-w-3xl">
            Todo lo que necesitas para aprobar
          </h2>
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {BENEFITS.map((b) => (
              <div key={b.titulo} className="bg-jungle-dark border border-white/5 rounded-2xl p-6">
                <div className="aspect-square rounded-xl bg-jungle/60 overflow-hidden">
                  <img
                    src={b.imagen}
                    alt={b.titulo}
                    className="w-full h-full object-contain"
                    loading="lazy"
                  />
                </div>
                <div className="mt-4 font-semibold text-lg">{b.titulo}</div>
                <p className="mt-2 text-sm opacity-80 leading-relaxed">{b.descripcion}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <CursosEspecializados />
      <CursosCarousel />
      <MisionVisionValores />

      <Footer />
      <WhatsAppFloating />
    </div>
  );
}
