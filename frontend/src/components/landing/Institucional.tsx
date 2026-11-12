import { useState } from 'react';
import { ArrowRight, Handshake, HeartHandshake, Lightbulb, MessageCircle, ShieldCheck, Trophy } from 'lucide-react';
import { SectionHeader } from './SectionHeader';
import { ScrollLink } from '@/components/ScrollLink';
import { PROGRAMA, TOTAL_CURSOS_PROGRAMA } from '@/data/contenido';
import { WHATSAPP } from '@/config/pago';
import { simulacroHref } from '@/config';

// ── Programa de estudios ─────────────────────────────────────────

export function ProgramaEstudios() {
  const [etapa, setEtapa] = useState(PROGRAMA[0].id);
  const actual = PROGRAMA.find((e) => e.id === etapa) ?? PROGRAMA[0];

  return (
    <section id="programa" className="bg-white">
      <div className="container-x py-20 md:py-28">
        <SectionHeader
          eyebrow="Programa de estudios"
          title={`${TOTAL_CURSOS_PROGRAMA} cursos de medicina humana`}
          lead="Cubrimos el currículo completo, desde ciencias básicas hasta las rotaciones del internado."
        />

        <div className="mt-12 grid gap-8 lg:grid-cols-12" data-reveal>
          <div role="tablist" aria-label="Etapas de la carrera" className="flex gap-2 overflow-x-auto lg:col-span-3 lg:flex-col">
            {PROGRAMA.map((e, i) => (
              <button
                key={e.id}
                role="tab"
                type="button"
                aria-selected={etapa === e.id}
                onClick={() => setEtapa(e.id)}
                className={`flex shrink-0 items-center justify-between gap-4 rounded-xl border px-4 py-3 text-left text-[15px] font-semibold transition-colors lg:w-full ${
                  etapa === e.id
                    ? 'border-jungle-800 bg-jungle-800 text-white'
                    : 'border-line bg-white text-ink hover:border-jungle-600/50'
                }`}
              >
                <span>
                  <span className={`tabular mr-2 text-xs ${etapa === e.id ? 'text-lime-400' : 'text-subtle'}`}>0{i + 1}</span>
                  {e.nombre}
                </span>
                <span className={`tabular text-xs ${etapa === e.id ? 'text-white/70' : 'text-subtle'}`}>{e.cursos.length}</span>
              </button>
            ))}
          </div>

          <ul role="tabpanel" className="grid content-start gap-3 sm:grid-cols-2 lg:col-span-9 lg:grid-cols-3">
            {actual.cursos.map((c) => (
              <li key={c} className="flex items-center gap-3 rounded-xl border border-line bg-paper/60 px-4 py-3 text-[14.5px] text-ink">
                <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-jungle-600" aria-hidden />
                {c}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

// ── Nosotros ─────────────────────────────────────────────────────

const VALORES = [
  { Icon: ShieldCheck, titulo: 'Integridad', desc: 'Actuamos con honestidad y responsabilidad.' },
  { Icon: Handshake, titulo: 'Compromiso', desc: 'Nos dedicamos al éxito académico de cada alumno.' },
  { Icon: Trophy, titulo: 'Excelencia', desc: 'Mejora continua en todos nuestros procesos.' },
  { Icon: Lightbulb, titulo: 'Innovación', desc: 'Incorporamos nuevas tecnologías y métodos.' },
  { Icon: HeartHandshake, titulo: 'Humanismo', desc: 'Trato digno y respeto hacia cada persona.' },
];

export function Nosotros() {
  return (
    <section id="nosotros" className="bg-paper">
      <div className="container-x py-20 md:py-28">
        <SectionHeader
          eyebrow="Quiénes somos"
          title="Formación médica en línea, hecha en Tacna para todo el Perú"
          lead="Un centro educativo en línea para estudiantes y médicos: banqueo, simulacros y cursos pensados para aprobar los exámenes nacionales."
        />

        <ul className="mt-12 grid gap-px overflow-hidden rounded-2xl border border-line bg-line sm:grid-cols-2 lg:grid-cols-5" data-reveal>
          {VALORES.map(({ Icon, titulo, desc }) => (
            <li key={titulo} className="bg-white p-6">
              <Icon className="h-5 w-5 text-jungle-600" aria-hidden />
              <div className="mt-3 font-display font-bold text-ink">{titulo}</div>
              <p className="mt-1 text-sm leading-relaxed text-muted">{desc}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

// ── Llamado final ────────────────────────────────────────────────

export function CtaFinal() {
  const href = `https://wa.me/${WHATSAPP.numero}?text=${encodeURIComponent('Hola, quiero información sobre las plataformas de SINAPSIS EDU')}`;
  return (
    <section className="relative isolate overflow-hidden bg-jungle-900 text-white">
      <div
        className="absolute inset-0 -z-10 opacity-60"
        style={{
          backgroundImage:
            'radial-gradient(circle at 1px 1px, rgba(194,228,118,0.18) 1px, transparent 0), radial-gradient(900px 400px at 85% 0%, rgba(31,91,82,0.7), transparent 70%)',
          backgroundSize: '28px 28px, auto',
        }}
        aria-hidden
      />
      <div className="container-x flex flex-col items-start gap-8 py-20 md:py-24 lg:flex-row lg:items-center lg:justify-between">
        <div data-reveal>
          <h2 className="text-[32px] leading-tight !text-white md:text-[44px]">Empieza hoy tu preparación</h2>
          <p className="mt-3 max-w-xl text-lg text-white/70">
            Mide tu nivel gratis hoy, elige tu plataforma o escríbenos y te ayudamos a escoger.
          </p>
        </div>
        <div className="flex flex-wrap gap-3" data-reveal>
          <a href={simulacroHref()!} className="btn-spark px-6 hover:shadow-cta">
            Simulacro gratis <ArrowRight className="h-[18px] w-[18px]" aria-hidden />
          </a>
          <ScrollLink to="plataformas" className="btn-ghost-dark cursor-pointer px-6">
            Ver plataformas
          </ScrollLink>
          <a href={href} target="_blank" rel="noreferrer" className="btn-ghost-dark px-6">
            <MessageCircle className="h-[18px] w-[18px] text-whatsapp" aria-hidden /> Escríbenos por WhatsApp
          </a>
        </div>
      </div>
    </section>
  );
}
