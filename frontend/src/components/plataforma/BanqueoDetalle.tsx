import { ArrowRight, BarChart3, Brain, Clock, FileCheck2, Filter, ListChecks, Target, Timer, type LucideIcon } from 'lucide-react';
import { simulacroHref } from '@/config';
import { BanqueoJuego } from '@/components/landing/BanqueoJuego';

/**
 * Bloque de la página de detalle de cada plataforma de banqueo: ficha del examen,
 * lo que incluye el banqueo (con gráficos) y el simulacro gratis de ese examen.
 * Los datos del examen son los mismos que usa banqueo.sinapsisedu.com.
 */

interface Ficha {
  examen: string;
  entidad: string;
  preguntas: number;
  minutos: number;
  nota: string;
  areas: string;
  /** Distribución oficial por curso, si la conocemos. */
  distribucion?: Array<{ curso: string; n: number }>;
  enfoque: string;
}

const FICHAS: Record<string, Ficha> = {
  enam: {
    examen: 'ENAM', entidad: 'ASPEFAM', preguntas: 180, minutos: 180, nota: 'Escala 0–20 · aprueba con 11', areas: '32 cursos y áreas',
    enfoque: 'Preguntas clínicas de todas las especialidades, como las de los ENAM anteriores.',
  },
  encib: {
    examen: 'ENCIB', entidad: 'ASPEFAM', preguntas: 100, minutos: 120, nota: 'Escala 0–20', areas: '8 cursos de ciencias básicas',
    enfoque: 'Preguntas por curso, con el mismo peso que tiene cada uno en el examen.',
    distribucion: [
      { curso: 'Anatomía', n: 16 }, { curso: 'Fisiología', n: 16 }, { curso: 'Patología', n: 16 }, { curso: 'Farmacología', n: 16 },
      { curso: 'Microbiología', n: 11 }, { curso: 'Histología', n: 9 }, { curso: 'Bioquímica', n: 9 }, { curso: 'Embriología', n: 7 },
    ],
  },
  encaps: {
    examen: 'ENCAPS · SERUMS', entidad: 'MINSA', preguntas: 100, minutos: 120, nota: 'Escala 0–20', areas: '5 áreas',
    enfoque: 'Casos clínicos y salud pública con el enfoque de la evaluación para el SERUMS.',
  },
  rm: {
    examen: 'Residentado Médico', entidad: 'CONAREME', preguntas: 200, minutos: 240, nota: 'Nota sobre 80', areas: '24 áreas',
    enfoque: 'Preguntas por especialidad y multidisciplinarias, como en la admisión al residentado.',
  },
  essalud: {
    examen: 'Internado EsSalud', entidad: 'EsSalud', preguntas: 100, minutos: 180, nota: 'Escala 0–20 · aprueba con 13', areas: '28 áreas · 5 alternativas',
    enfoque: 'Preguntas de concursos EsSalud y material para SERUMS en un solo acceso.',
  },
};

export const SLUGS_BANQUEO = Object.keys(FICHAS);

const INCLUYE: Array<{ Icon: LucideIcon; img?: string; titulo: string; texto: string }> = [
  { Icon: Target, img: 'racha', titulo: 'Modo juego', texto: 'Racha, puntos y potenciadores. Banqueas sin aburrirte.' },
  { Icon: Filter, titulo: 'Arma tu banqueo', texto: 'Elige tema, subtema, año y cuántas preguntas.' },
  { Icon: Timer, titulo: 'Modo simulacro', texto: 'Con el tiempo y el número de preguntas del examen real.' },
  { Icon: Brain, titulo: 'Repaso inteligente', texto: 'Tus falladas vuelven hasta que las dominas.' },
];

function horas(min: number) {
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m ? `${h} h ${m} min` : `${h} h`;
}

export function BanqueoDetalle({ slug }: { slug: string }) {
  const f = FICHAS[slug];
  if (!f) return null;
  const sim = simulacroHref(slug, 'registro');
  const max = f.distribucion ? Math.max(...f.distribucion.map((d) => d.n)) : 0;

  return (
    <>
      {/* Archivo real */}
      <section className="rounded-2xl border-2 border-jungle-800 bg-jungle-50 p-5 md:p-6">
        <div className="flex items-start gap-4">
          <FileCheck2 className="mt-1 h-8 w-8 shrink-0 text-jungle-800" aria-hidden />
          <div>
            <p className="font-display text-xl font-bold text-ink">Preguntas de exámenes {f.examen} ya tomados</p>
            <p className="mt-1 text-[15px] text-muted">
              Salen de nuestro archivo de exámenes reales, actualizado hasta 2026, y cada una trae su justificación. {f.enfoque}
            </p>
          </div>
        </div>
      </section>

      {/* Ficha del examen */}
      <section>
        <h2 className="text-3xl mb-5">Así es el {f.examen}</h2>
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { Icon: ListChecks, v: String(f.preguntas), k: 'preguntas' },
            { Icon: Clock, v: horas(f.minutos), k: 'de duración' },
            { Icon: BarChart3, v: f.nota.split(' · ')[0], k: f.nota.split(' · ')[1] ?? 'nota final' },
            { Icon: Target, v: f.areas.split(' · ')[0], k: f.entidad },
          ].map(({ Icon, v, k }) => (
            <li key={k} className="rounded-2xl border border-jungle/10 bg-white p-4 shadow-card">
              <Icon className="h-5 w-5 text-jungle-600" aria-hidden />
              <div className="mt-2 font-display text-lg font-extrabold leading-tight">{v}</div>
              <div className="text-xs text-jungle-light">{k}</div>
            </li>
          ))}
        </ul>

        {f.distribucion && (
          <div className="mt-5 rounded-2xl border border-jungle/10 bg-white p-5 shadow-card">
            <p className="text-sm font-semibold">Preguntas por curso en el examen</p>
            <ul className="mt-3 space-y-2">
              {f.distribucion.map((d) => (
                <li key={d.curso} className="grid grid-cols-[110px_1fr_28px] items-center gap-3 text-sm">
                  <span className="truncate text-jungle-light">{d.curso}</span>
                  <span className="h-2.5 overflow-hidden rounded-full bg-jungle/5">
                    <span className="block h-full rounded-full bg-jungle-600" style={{ width: `${(d.n / max) * 100}%` }} />
                  </span>
                  <span className="tabular text-right font-semibold">{d.n}</span>
                </li>
              ))}
            </ul>
            <p className="mt-3 text-xs text-jungle-light">Tu banqueo y tus simulacros respetan este mismo peso por curso.</p>
          </div>
        )}
      </section>

      {/* Qué incluye */}
      <section>
        <h2 className="text-3xl mb-5">Tu banqueo {f.examen} incluye</h2>
        <ul className="grid gap-3 sm:grid-cols-2">
          {INCLUYE.map(({ Icon, img, titulo, texto }) => (
            <li key={titulo} className="flex items-start gap-3 rounded-2xl border border-jungle/10 bg-white p-4 shadow-card">
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-jungle-900 text-lime-400">
                {img ? <img src={`${import.meta.env.BASE_URL}images/juego/${img}.webp`} alt="" className="h-7 w-7" /> : <Icon className="h-5 w-5" aria-hidden />}
              </span>
              <div>
                <p className="font-semibold">{titulo}</p>
                <p className="text-sm leading-snug text-jungle-light">{texto}</p>
              </div>
            </li>
          ))}
        </ul>
        <div className="mt-5">
          <BanqueoJuego />
          <p className="mt-2 text-center text-xs text-jungle-light">Pruébalo: así se ve el modo juego por dentro.</p>
        </div>
      </section>

      {/* Simulacro gratis de este examen */}
      {sim && (
        <section className="flex flex-col gap-4 rounded-2xl bg-jungle-900 p-6 text-white sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-lime-400">Antes de comprar</p>
            <p className="mt-1 font-display text-xl font-bold !text-white">Rinde gratis un simulacro {f.examen} completo</p>
            <p className="mt-1 text-sm text-white/70">{f.preguntas} preguntas · {horas(f.minutos)} · tu nota al final.</p>
          </div>
          <a href={sim} className="btn-spark shrink-0 px-6">
            Empezar gratis <ArrowRight className="h-4 w-4" aria-hidden />
          </a>
        </section>
      )}
    </>
  );
}
