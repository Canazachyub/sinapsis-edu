import { ArrowRight, BarChart3, BookOpenCheck, CreditCard, FileText, ListChecks, MailCheck, MousePointerClick, RotateCcw, Sparkles, Timer, Trophy, type LucideIcon } from 'lucide-react';
import { SectionHeader } from './SectionHeader';
import { ScrollLink } from '@/components/ScrollLink';
import { PruebaPregunta } from './PruebaPregunta';
import { BanqueoJuego } from './BanqueoJuego';
import { ArmaTuBanqueo } from './ArmaTuBanqueo';
import { simulacroHref } from '@/config';

// ── Franja de exámenes ───────────────────────────────────────────

const EXAMENES = ['ENAM', 'ENCIB', 'ENCAPS', 'Residentado Médico', 'EsSalud', 'SERUMS'];

export function FranjaExamenes() {
  return (
    <section className="border-b border-line bg-white">
      <div className="container-x flex flex-col items-center gap-4 py-7 md:flex-row md:justify-between">
        <span className="text-sm font-medium text-subtle">Preparación para</span>
        <ul className="flex flex-wrap items-center justify-center gap-x-8 gap-y-2 md:gap-x-10">
          {EXAMENES.map((e) => (
            <li key={e} className="font-display text-[17px] font-bold tracking-tight text-ink/45">
              {e}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

// ── Banqueo: el ciclo, mostrado con gráficos ─────────────────────

/** 1 · Responde: una pregunta con el tiempo corriendo. */
function GraficoResponde() {
  const opciones = [
    { l: 'A', w: 'w-[72%]' },
    { l: 'B', w: 'w-[58%]', ok: true },
    { l: 'C', w: 'w-[80%]' },
  ];
  return (
    <div className="w-full max-w-[240px] rounded-xl bg-white p-3.5 shadow-card">
      <div className="flex items-center justify-between text-[11px] font-semibold">
        <span className="rounded-md bg-jungle-50 px-1.5 py-0.5 text-jungle-800">Fisiología</span>
        <span className="tabular inline-flex items-center gap-1 text-warning"><Timer className="h-3 w-3" aria-hidden />00:42</span>
      </div>
      <div className="mt-2 h-2 w-[92%] rounded bg-ink/15" />
      <div className="mt-1.5 h-2 w-[70%] rounded bg-ink/15" />
      <ul className="mt-2.5 space-y-1.5">
        {opciones.map((o) => (
          <li
            key={o.l}
            className={`flex items-center gap-2 rounded-lg border px-2 py-1.5 ${o.ok ? 'border-correct bg-correct/10' : 'border-line'}`}
          >
            <span className={`grid h-4 w-4 place-items-center rounded-full text-[9px] font-bold ${o.ok ? 'bg-correct text-white' : 'bg-paper text-subtle'}`}>{o.l}</span>
            <span className={`h-1.5 rounded ${o.w} ${o.ok ? 'bg-correct/50' : 'bg-ink/10'}`} />
          </li>
        ))}
      </ul>
    </div>
  );
}

/** 2 · Entiende: la justificación con el concepto clave resaltado. */
function GraficoEntiende() {
  return (
    <div className="w-full max-w-[240px] rounded-xl bg-white p-3.5 shadow-card">
      <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-jungle-600">
        <BookOpenCheck className="h-3.5 w-3.5" aria-hidden /> Justificación
      </div>
      <p className="mt-2 text-[12px] leading-snug text-muted">
        La <mark className="rounded bg-lime-400/60 px-0.5 font-semibold text-ink">ley de Frank-Starling</mark> explica que, a mayor llenado,
        mayor fuerza de contracción…
      </p>
      <div className="mt-2.5 space-y-1.5">
        <div className="h-1.5 w-full rounded bg-ink/10" />
        <div className="h-1.5 w-[85%] rounded bg-ink/10" />
      </div>
      <div className="mt-3 flex flex-wrap gap-1 text-[10px] font-semibold text-subtle">
        <span className="rounded bg-paper px-1.5 py-0.5">ENAM 2023</span>
        <span className="rounded bg-paper px-1.5 py-0.5">Cardiología</span>
      </div>
    </div>
  );
}

/** 3 · Mide: aciertos por curso. */
function GraficoMide() {
  const cursos = [
    { c: 'Anatomía', v: 82, col: 'bg-correct' },
    { c: 'Fisiología', v: 68, col: 'bg-jungle-600' },
    { c: 'Bioquímica', v: 45, col: 'bg-warning' },
    { c: 'Farmaco', v: 31, col: 'bg-wrong' },
  ];
  return (
    <div className="w-full max-w-[240px] rounded-xl bg-white p-3.5 shadow-card">
      <div className="text-[11px] font-bold uppercase tracking-wide text-jungle-600">Tus aciertos</div>
      <ul className="mt-2.5 space-y-2">
        {cursos.map((c) => (
          <li key={c.c} className="grid grid-cols-[64px_1fr_28px] items-center gap-2 text-[11px]">
            <span className="truncate text-muted">{c.c}</span>
            <span className="h-2 overflow-hidden rounded-full bg-paper">
              <span className={`block h-full rounded-full ${c.col}`} style={{ width: `${c.v}%` }} />
            </span>
            <span className="tabular text-right font-semibold text-ink">{c.v}%</span>
          </li>
        ))}
      </ul>
      <p className="mt-2.5 text-[11px] text-subtle">Refuerza: <span className="font-semibold text-wrong">Farmacología</span></p>
    </div>
  );
}

/** 4 · Repasa: solo las falladas, hasta dominarlas. */
function GraficoRepasa() {
  const total = 24;
  const hechas = 18;
  const r = 34;
  const c = 2 * Math.PI * r;
  return (
    <div className="flex w-full max-w-[240px] items-center gap-4 rounded-xl bg-white p-3.5 shadow-card">
      <svg viewBox="0 0 80 80" className="h-20 w-20 shrink-0 -rotate-90" aria-hidden>
        <circle cx="40" cy="40" r={r} fill="none" stroke="#E2E8E6" strokeWidth="8" />
        <circle
          cx="40" cy="40" r={r} fill="none" stroke="#16A34A" strokeWidth="8" strokeLinecap="round"
          strokeDasharray={c} strokeDashoffset={c * (1 - hechas / total)}
        />
      </svg>
      <div>
        <div className="tabular font-display text-2xl font-extrabold text-ink">{hechas}/{total}</div>
        <div className="text-[11px] leading-tight text-muted">falladas que ya dominas</div>
        <div className="mt-1.5 inline-flex items-center gap-1 rounded-md bg-jungle-50 px-1.5 py-0.5 text-[10px] font-semibold text-jungle-800">
          <RotateCcw className="h-3 w-3" aria-hidden /> Modo repaso
        </div>
      </div>
    </div>
  );
}

const CICLO: Array<{ Icon: LucideIcon; titulo: string; texto: string; Grafico: () => JSX.Element }> = [
  { Icon: Timer, titulo: 'Responde', texto: 'Preguntas reales, con el tiempo del examen.', Grafico: GraficoResponde },
  { Icon: BookOpenCheck, titulo: 'Entiende', texto: 'Cada respuesta explicada, con su fuente.', Grafico: GraficoEntiende },
  { Icon: BarChart3, titulo: 'Mide', texto: 'Ves tus aciertos por curso al instante.', Grafico: GraficoMide },
  { Icon: RotateCcw, titulo: 'Repasa', texto: 'Vuelves solo a lo que fallaste.', Grafico: GraficoRepasa },
];

const CIFRAS = [
  { dato: '6', texto: 'exámenes nacionales' },
  { dato: 'Hasta 2026', texto: 'archivo de exámenes' },
  { dato: '1.er', texto: 'simulacro gratis' },
  { dato: '24/7', texto: 'en celular o PC' },
];

const JUEGO = [
  { img: 'racha', t: 'Rachas de aciertos' },
  { img: 'puntos', t: 'Puntos por rapidez' },
  { img: 'cincuenta', t: 'Potenciadores 50/50' },
  { img: 'celebra', t: 'Reta a tus amigos' },
];

export function SeccionBanqueo() {
  return (
    <section id="banqueo" className="bg-white">
      <div className="container-x py-20 md:py-28">
        <SectionHeader
          eyebrow="Banqueo"
          title="Así se banquea en SINAPSIS"
          lead="Respondes, entiendes el porqué, ves en qué fallas y repasas solo eso. Cada vuelta te acerca a la nota que necesitas."
        />

        {/* Lo más importante: de dónde salen las preguntas */}
        <div className="mt-8 flex flex-col gap-4 rounded-2xl border-2 border-jungle-800 bg-jungle-50 p-5 sm:flex-row sm:items-center sm:gap-6 md:p-6" data-reveal>
          <div className="tabular shrink-0 font-display text-[40px] font-extrabold leading-none text-jungle-800 md:text-[52px]">15 000+</div>
          <div>
            <p className="font-display text-lg font-bold text-ink md:text-xl">
              preguntas explicadas, <span className="text-jungle-600">todas de exámenes ya tomados</span>
            </p>
            <p className="mt-1 text-[15px] text-muted">
              Salen de nuestro archivo de exámenes reales (ENAM, ENCIB, Residentado, EsSalud, SERUMS), actualizado hasta 2026.
              Practicas con lo que de verdad toman.
            </p>
          </div>
        </div>

        {/* El ciclo en 4 gráficos */}
        <ol className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {CICLO.map(({ Icon, titulo, texto, Grafico }, i) => (
            <li key={titulo} className="flex flex-col overflow-hidden rounded-2xl border border-line bg-white" data-reveal={i * 80}>
              <div className="grid h-[210px] place-items-center overflow-hidden bg-gradient-to-br from-jungle-50 to-paper px-5">
                <Grafico />
              </div>
              <div className="flex items-start gap-3 p-5">
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-jungle-800 font-display text-sm font-bold text-lime-400">
                  {i + 1}
                </span>
                <div>
                  <h3 className="flex items-center gap-1.5 text-[17px]">
                    <Icon className="h-4 w-4 text-jungle-600" aria-hidden /> {titulo}
                  </h3>
                  <p className="mt-1 text-[14.5px] leading-snug text-muted">{texto}</p>
                </div>
              </div>
            </li>
          ))}
        </ol>

        {/* Cifras */}
        <ul className="mt-6 grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-line bg-line lg:grid-cols-4" data-reveal>
          {CIFRAS.map((c) => (
            <li key={c.texto} className="bg-paper px-5 py-5 text-center">
              <div className="tabular font-display text-2xl font-extrabold text-jungle-800 md:text-3xl">{c.dato}</div>
              <div className="mt-0.5 text-[13.5px] text-muted">{c.texto}</div>
            </li>
          ))}
        </ul>

        {/* Modo juego tipo Quizizz: jugable aquí mismo */}
        <div className="mt-16 grid items-center gap-10 lg:grid-cols-12 lg:gap-14">
          <div className="lg:col-span-5" data-reveal>
            <p className="eyebrow">Modo juego</p>
            <h3 className="mt-3 text-[28px] leading-tight md:text-[34px]">Banquear se siente como jugar</h3>
            <p className="mt-3 text-[16px] leading-relaxed text-muted">
              Como en Quizizz, pero con preguntas de tu examen: sumas puntos, cuidas tu racha y usas potenciadores.
              Te enganchas y repasas más sin darte cuenta.
            </p>
            <ul className="mt-6 grid grid-cols-2 gap-3">
              {JUEGO.map((j) => (
                <li key={j.t} className="flex items-center gap-2.5 rounded-xl border border-line bg-paper px-3 py-2.5">
                  <img src={`${import.meta.env.BASE_URL}images/juego/${j.img}.webp`} alt="" className="h-8 w-8 shrink-0" loading="lazy" />
                  <span className="text-[14px] font-semibold leading-tight text-ink">{j.t}</span>
                </li>
              ))}
            </ul>
            <p className="mt-5 text-sm text-subtle">Pruébalo aquí mismo: elige una respuesta o usa el 50/50.</p>
          </div>
          <div className="lg:col-span-7" data-reveal={120}>
            <BanqueoJuego />
          </div>
        </div>

        <ArmaTuBanqueo />

        {/* Modo simulacro: pregunta real con justificación */}
        <div className="mt-16" data-reveal>
          <p className="eyebrow mb-4">Modo simulacro</p>
          <PruebaPregunta />
        </div>

      </div>
    </section>
  );
}

// ── Simulacro gratis: sección protagonista ───────────────────────

const SIM_EXAMENES: Array<{ slug: string; label: string }> = [
  { slug: 'enam', label: 'ENAM' },
  { slug: 'encib', label: 'ENCIB' },
  { slug: 'rm', label: 'Residentado' },
  { slug: 'encaps', label: 'SERUMS' },
  { slug: 'essalud', label: 'EsSalud' },
];

const SIM_INCLUYE: Array<{ Icon: LucideIcon; texto: string }> = [
  { Icon: ListChecks, texto: '100 preguntas con el formato oficial' },
  { Icon: Timer, texto: 'Cronómetro con el tiempo real del examen' },
  { Icon: Trophy, texto: 'Tu nota y tus aciertos por curso al terminar' },
];

export function SimulacroGratis() {
  return (
    <section id="simulacro-gratis" className="relative isolate overflow-hidden bg-jungle-900 text-white">
      <div
        className="absolute inset-0 -z-10 opacity-70"
        style={{
          backgroundImage:
            'radial-gradient(circle at 1px 1px, rgba(194,228,118,0.16) 1px, transparent 0), radial-gradient(800px 420px at 80% 30%, rgba(31,91,82,0.85), transparent 70%)',
          backgroundSize: '26px 26px, auto',
        }}
        aria-hidden
      />
      <div className="container-x grid items-center gap-10 py-16 md:py-24 lg:grid-cols-12 lg:gap-12">
        <div className="lg:col-span-6" data-reveal>
          <span className="inline-flex items-center gap-2 rounded-full bg-lime-400 px-3 py-1 text-xs font-extrabold uppercase tracking-[0.12em] text-jungle-900">
            <Sparkles className="h-3.5 w-3.5" aria-hidden /> Gratis
          </span>
          <h2 className="mt-5 text-[32px] leading-[1.08] !text-white md:text-[44px]">
            Rinde tu primer simulacro <span className="text-lime-400">sin pagar nada</span>
          </h2>
          <p className="mt-4 max-w-[520px] text-[17px] leading-relaxed text-white/75">
            Mide tu nivel hoy con un examen completo, igual al real. Solo te registras y empiezas.
          </p>

          <ul className="mt-7 space-y-3">
            {SIM_INCLUYE.map(({ Icon, texto }) => (
              <li key={texto} className="flex items-center gap-3 text-[15.5px] text-white/90">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-lime-400/30 bg-lime-400/10 text-lime-400">
                  <Icon className="h-[18px] w-[18px]" aria-hidden />
                </span>
                {texto}
              </li>
            ))}
          </ul>

          <a href={simulacroHref('enam', 'registro')!} className="btn-spark mt-8 w-full px-7 text-base hover:shadow-cta sm:w-auto">
            Empezar mi simulacro gratis <ArrowRight className="h-[18px] w-[18px]" aria-hidden />
          </a>

          <div className="mt-6">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-white/50">O elige tu examen</p>
            <ul className="mt-3 flex flex-wrap gap-2">
              {SIM_EXAMENES.map((e) => {
                const href = simulacroHref(e.slug, 'registro');
                return href ? (
                  <li key={e.slug}>
                    <a
                      href={href}
                      className="inline-flex min-h-[40px] items-center rounded-full border border-white/20 px-4 text-sm font-semibold text-white transition-colors hover:border-lime-400 hover:text-lime-400"
                    >
                      {e.label}
                    </a>
                  </li>
                ) : null;
              })}
            </ul>
          </div>
        </div>

        <div className="relative lg:col-span-6" data-reveal={120}>
          <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-jungle-800 shadow-mock-dark">
            <img
              src={`${import.meta.env.BASE_URL}images/flujo/simulacro-gratis.webp`}
              alt=""
              width={800}
              height={600}
              loading="lazy"
              decoding="async"
              className="aspect-[4/3] h-full w-full object-cover"
              onError={(e) => { e.currentTarget.style.display = 'none'; }}
            />
          </div>
          {/* Resultado de ejemplo flotando sobre la imagen */}
          <div className="absolute -bottom-5 left-4 flex items-center gap-3 rounded-2xl bg-white px-4 py-3 text-ink shadow-mock-dark sm:left-8">
            <span className="grid h-11 w-11 place-items-center rounded-full bg-correct/10 font-display text-lg font-extrabold text-correct">16</span>
            <div className="leading-tight">
              <div className="text-[13px] font-bold">Nota de ejemplo</div>
              <div className="text-[12px] text-muted">82 de 100 correctas · 1 h 48 min</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ── Cómo funciona ────────────────────────────────────────────────

const PASOS: Array<{ Icon: LucideIcon; img: string; titulo: string; texto: string; dato: string }> = [
  {
    Icon: MousePointerClick, img: 'paso-elige', titulo: 'Elige tu plataforma',
    texto: 'ENAM, ENCIB, Residentado, EsSalud y más. Ves el precio y qué incluye antes de pagar.',
    dato: 'Precio claro',
  },
  {
    Icon: CreditCard, img: 'paso-paga', titulo: 'Paga con Yape o tarjeta',
    texto: 'Escribe tu nombre y correo, y paga en la página segura de Mercado Pago. Sin suscripciones.',
    dato: 'Menos de 2 minutos',
  },
  {
    Icon: MailCheck, img: 'paso-acceso', titulo: 'Entra al instante',
    texto: 'Apenas se aprueba el pago entras a tu Portal. Tu contraseña te llega por correo.',
    dato: 'Acceso inmediato',
  },
];

export function ComoFunciona() {
  return (
    <section id="como-funciona" className="bg-white">
      <div className="container-x py-20 md:py-28">
        <SectionHeader
          eyebrow="Cómo funciona"
          title="Empieza a estudiar en tres pasos"
          lead="Pagas una sola vez por el periodo que elijas y entras en el momento."
        />
        <ol className="mt-14 grid gap-6 md:grid-cols-3">
          {PASOS.map(({ Icon, img, titulo, texto, dato }, i) => (
            <li key={titulo} className="overflow-hidden rounded-2xl border border-line bg-white" data-reveal={i * 100}>
              <div className="relative aspect-[4/3] bg-jungle-900">
                <img
                  src={`${import.meta.env.BASE_URL}images/flujo/${img}.webp`}
                  alt=""
                  width={800}
                  height={600}
                  loading="lazy"
                  decoding="async"
                  className="h-full w-full object-cover"
                  onError={(e) => { e.currentTarget.style.display = 'none'; }}
                />
                <span className="absolute left-4 top-4 grid h-9 w-9 place-items-center rounded-full bg-lime-400 font-display text-sm font-extrabold text-jungle-900">
                  {i + 1}
                </span>
              </div>
              <div className="p-5 sm:p-6">
                <div className="flex items-center gap-2 text-[12px] font-semibold uppercase tracking-[0.1em] text-jungle-600">
                  <Icon className="h-4 w-4" aria-hidden /> {dato}
                </div>
                <h3 className="mt-2 text-lg">{titulo}</h3>
                <p className="mt-2 text-[15px] leading-relaxed text-muted">{texto}</p>
              </div>
            </li>
          ))}
        </ol>
        <div className="mt-10 flex flex-col gap-4 rounded-2xl border border-line bg-paper px-5 py-5 sm:flex-row sm:items-center sm:justify-between" data-reveal>
          <p className="flex items-start gap-3 text-sm text-muted">
            <FileText className="mt-0.5 h-5 w-5 shrink-0 text-jungle-600" aria-hidden />
            <span>¿Prefieres Binance o transferencia BCP? También puedes pagar y subir tu voucher; lo activamos en menos de 24 h hábiles.</span>
          </p>
          <ScrollLink to="plataformas" className="btn-primary shrink-0 cursor-pointer">Ver plataformas</ScrollLink>
        </div>
      </div>
    </section>
  );
}
