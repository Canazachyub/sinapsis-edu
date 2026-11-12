import { useState } from 'react';
import {
  Bookmark, Brain, Eraser, Eye, Filter, Highlighter, History, Moon, Play, RotateCcw, Save,
  Sparkles, Target, Volume2, XCircle, type LucideIcon,
} from 'lucide-react';

/**
 * "Arma tu banqueo": réplica del constructor de banqueo.sinapsisedu.com (temas, fuente/año,
 * categorías, cantidad y modo) con los beneficios reales contados en clave de marketing.
 */

const TEMAS = ['Miembro superior', 'Tórax', 'Abdomen', 'Neuroanatomía', 'Cabeza y cuello', 'Pelvis'];
const FUENTES = ['ENAM 2025', 'ENAM 2024', 'ENAM 2023', 'ENCIB 2025', 'EsSalud 2024'];
const CATEGORIAS: Array<{ id: string; label: string; n: number; Icon: LucideIcon; color: string }> = [
  { id: 'nuevas', label: 'Nuevas', n: 1168, Icon: Sparkles, color: 'text-lime-400' },
  { id: 'repasar', label: 'Para repasar', n: 42, Icon: History, color: 'text-sky-300' },
  { id: 'falladas', label: 'Falladas', n: 27, Icon: XCircle, color: 'text-red-300' },
  { id: 'marcadas', label: 'Marcadas', n: 9, Icon: Bookmark, color: 'text-amber-300' },
];
const CANTIDADES = ['10', '20', '50', 'Todas'];

function Chip({ on, children, onClick }: { on: boolean; children: React.ReactNode; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={on}
      className={`min-h-[34px] rounded-full border px-3 text-[13px] font-semibold transition-colors ${
        on ? 'border-lime-400 bg-lime-400 text-jungle-900' : 'border-white/15 bg-white/5 text-white/85 hover:border-white/40'
      }`}
    >
      {children}
    </button>
  );
}

function Constructor() {
  const [temas, setTemas] = useState<string[]>(['Miembro superior', 'Tórax']);
  const [fuentes, setFuentes] = useState<string[]>(['ENAM 2025', 'ENAM 2024']);
  const [cat, setCat] = useState('falladas');
  const [cant, setCant] = useState('20');
  const [modo, setModo] = useState<'practica' | 'examen'>('practica');
  const toggle = (arr: string[], set: (v: string[]) => void, v: string) =>
    set(arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v]);

  const base = CATEGORIAS.find((c) => c.id === cat)?.n ?? 0;
  const disponibles = Math.max(1, Math.round(base * (0.35 + temas.length * 0.1) * (0.4 + fuentes.length * 0.12)));
  const vistas = 312;
  const total = 1480;

  return (
    <div
      className="overflow-hidden rounded-3xl border border-white/10 bg-jungle-900 p-4 text-white shadow-mock-dark sm:p-5"
      style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.06) 1px, transparent 0)', backgroundSize: '22px 22px' }}
    >
      <div className="flex items-center justify-between">
        <p className="font-display text-lg font-extrabold">Arma tu banqueo · Anatomía</p>
        <Filter className="h-4 w-4 text-white/50" aria-hidden />
      </div>

      {/* Cobertura */}
      <div className="mt-3 rounded-2xl bg-black/25 p-3">
        <div className="flex justify-between text-[12.5px] text-white/70">
          <span>Viste <strong className="text-white">{vistas}</strong> de {total.toLocaleString('es-PE')} ({Math.round((vistas / total) * 100)} %)</span>
          <span className="text-lime-400">Cobertura</span>
        </div>
        <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-white/10">
          <div className="h-full rounded-full bg-lime-400" style={{ width: `${(vistas / total) * 100}%` }} />
        </div>
      </div>

      <p className="mt-4 text-[11px] font-bold uppercase tracking-[0.1em] text-white/50">Temas</p>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {TEMAS.map((t) => <Chip key={t} on={temas.includes(t)} onClick={() => toggle(temas, setTemas, t)}>{t}</Chip>)}
      </div>

      <p className="mt-4 text-[11px] font-bold uppercase tracking-[0.1em] text-white/50">Fuente / año</p>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {FUENTES.map((f) => <Chip key={f} on={fuentes.includes(f)} onClick={() => toggle(fuentes, setFuentes, f)}>{f}</Chip>)}
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
        {CATEGORIAS.map(({ id, label, n, Icon, color }) => (
          <button
            key={id}
            type="button"
            onClick={() => setCat(id)}
            aria-pressed={cat === id}
            className={`rounded-2xl border p-2.5 text-left transition-colors ${cat === id ? 'border-lime-400 bg-lime-400/10' : 'border-white/10 bg-white/5 hover:border-white/30'}`}
          >
            <Icon className={`h-4 w-4 ${color}`} aria-hidden />
            <span className="mt-1 block text-[13px] font-bold leading-tight">{label}</span>
            <span className="tabular text-[12px] text-white/60">{n.toLocaleString('es-PE')}</span>
          </button>
        ))}
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
        <div className="flex gap-1.5">
          {CANTIDADES.map((c) => <Chip key={c} on={cant === c} onClick={() => setCant(c)}>{c}</Chip>)}
        </div>
        <span className="tabular text-[12.5px] text-white/60">disponibles: <strong className="text-white">{disponibles}</strong></span>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2">
        {([
          ['practica', 'Práctica', 'Justificación al instante'],
          ['examen', 'Examen', 'Sin pistas hasta el final'],
        ] as const).map(([id, label, desc]) => (
          <button
            key={id}
            type="button"
            onClick={() => setModo(id)}
            aria-pressed={modo === id}
            className={`rounded-2xl border p-3 text-left transition-colors ${modo === id ? 'border-lime-400 bg-lime-400/10' : 'border-white/10 bg-white/5 hover:border-white/30'}`}
          >
            <span className="block text-[15px] font-bold">{label}</span>
            <span className="text-[12px] text-white/60">{desc}</span>
          </button>
        ))}
      </div>

      <div className="mt-4 flex min-h-[48px] items-center justify-center gap-2 rounded-2xl bg-lime-400 font-display text-[16px] font-extrabold text-jungle-900">
        <Play className="h-4 w-4" aria-hidden /> Empezar · {cant === 'Todas' ? disponibles : Math.min(Number(cant), disponibles)} preguntas
      </div>
    </div>
  );
}

const BENEFICIOS: Array<{ Icon: LucideIcon; titulo: string; texto: string }> = [
  { Icon: Target, titulo: 'Estudias exactamente lo que te falta', texto: 'Eliges tema, subtema, examen y año. Nada de relleno: solo lo que te va a tomar.' },
  { Icon: Brain, titulo: 'Repaso que no te deja olvidar', texto: 'Tus falladas y las que tocan repasar vuelven en el momento justo, hasta que se quedan para siempre.' },
  { Icon: Eye, titulo: 'Ves cuánto ya dominas', texto: 'Una barra de cobertura por curso te dice qué porcentaje del banco ya conquistaste.' },
  { Icon: RotateCcw, titulo: 'Practica o ponte a prueba', texto: 'Modo práctica con la justificación al instante, o modo examen sin pistas, como el día real.' },
];

const HERRAMIENTAS: Array<{ Icon: LucideIcon; t: string }> = [
  { Icon: Highlighter, t: 'Subrayador' },
  { Icon: Eraser, t: 'Descartar alternativas' },
  { Icon: Volume2, t: 'Lectura en voz alta' },
  { Icon: Moon, t: 'Modo oscuro' },
  { Icon: Save, t: 'Guardado automático' },
];

export function ArmaTuBanqueo() {
  return (
    <div className="mt-20 grid items-center gap-10 lg:grid-cols-12 lg:gap-14">
      <div className="lg:order-2 lg:col-span-5" data-reveal>
        <p className="eyebrow">Arma tu banqueo</p>
        <h3 className="mt-3 text-[28px] leading-tight md:text-[34px]">Tu banqueo, hecho a tu medida en segundos</h3>
        <p className="mt-3 text-[16px] leading-relaxed text-muted">
          Cada alumno llega con vacíos distintos. Por eso tú decides qué practicar, y el sistema se encarga de que lo aprendas de verdad.
        </p>
        <ul className="mt-6 space-y-4">
          {BENEFICIOS.map(({ Icon, titulo, texto }) => (
            <li key={titulo} className="flex gap-3">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-jungle-800 text-lime-400">
                <Icon className="h-5 w-5" aria-hidden />
              </span>
              <div>
                <p className="font-semibold text-ink">{titulo}</p>
                <p className="mt-0.5 text-[14.5px] leading-snug text-muted">{texto}</p>
              </div>
            </li>
          ))}
        </ul>
        <div className="mt-6">
          <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-subtle">Y en cada pregunta tienes</p>
          <ul className="mt-2 flex flex-wrap gap-2">
            {HERRAMIENTAS.map(({ Icon, t }) => (
              <li key={t} className="inline-flex items-center gap-1.5 rounded-full border border-line bg-paper px-3 py-1.5 text-[13px] font-semibold text-ink">
                <Icon className="h-3.5 w-3.5 text-jungle-600" aria-hidden /> {t}
              </li>
            ))}
          </ul>
        </div>
      </div>
      <div className="lg:order-1 lg:col-span-7" data-reveal={120}>
        <Constructor />
        <p className="mt-3 text-center text-sm text-subtle">Toca los filtros: así se arma en la plataforma.</p>
      </div>
    </div>
  );
}
