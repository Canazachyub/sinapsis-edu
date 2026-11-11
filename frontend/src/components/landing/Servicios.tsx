import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, CreditCard, FileText, MailCheck, MessageCircle, MousePointerClick, type LucideIcon } from 'lucide-react';
import { SectionHeader } from './SectionHeader';
import { ScrollLink } from '@/components/ScrollLink';
import { PruebaPregunta } from './PruebaPregunta';
import { COLECCIONES } from '@/data/contenido';
import { WHATSAPP } from '@/config/pago';
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

// ── Lista numerada (reemplaza los íconos en cuadros) ────────────

function ListaNumerada({ items }: { items: Array<{ titulo: string; texto: string }> }) {
  return (
    <ol className="grid gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
      {items.map((it, i) => (
        <li key={it.titulo} className="border-t border-ink/80 pt-5" data-reveal={i * 80}>
          <span className="tabular text-sm font-semibold text-jungle-600">0{i + 1}</span>
          <h3 className="mt-2 text-[17px]">{it.titulo}</h3>
          <p className="mt-2 text-[15px] leading-relaxed text-muted">{it.texto}</p>
        </li>
      ))}
    </ol>
  );
}

// ── Banqueo ──────────────────────────────────────────────────────

const BANCOS: Array<{ examen: string; dato: string; detalle: string; slug: string }> = [
  { examen: 'ENAM', dato: '2 000+', detalle: 'preguntas con justificación', slug: 'enam' },
  { examen: 'ENCIB', dato: '1 500+', detalle: 'preguntas por curso', slug: 'encib' },
  { examen: 'Residentado', dato: '3 000+', detalle: 'preguntas por especialidad', slug: 'rm' },
  { examen: 'ENCAPS', dato: 'Casos', detalle: 'clínicos por especialidad', slug: 'encaps' },
  { examen: 'EsSalud · SERUMS', dato: '2 bancos', detalle: 'según convocatorias', slug: 'essalud' },
];

const CARACTERISTICAS_BANQUEO = [
  { titulo: 'Justificación en cada pregunta', texto: 'Cada respuesta viene explicada, organizada por curso, tema y examen de origen.' },
  { titulo: 'Simulacros cronometrados', texto: 'Con el tiempo y el formato del examen real, y tu puntaje al terminar.' },
  { titulo: 'Estadísticas por área', texto: 'Tus aciertos por curso o especialidad para saber qué reforzar.' },
  { titulo: 'Modo repaso', texto: 'Vuelve solo a las preguntas que fallaste hasta dominarlas.' },
];

export function SeccionBanqueo() {
  return (
    <section id="banqueo" className="bg-white">
      <div className="container-x py-20 md:py-28">
        <div className="grid gap-12 lg:grid-cols-12 lg:items-end">
          <SectionHeader
            className="lg:col-span-6"
            eyebrow="Banqueo"
            title="Practica con preguntas que se explican solas"
            lead="Bancos por examen y por curso, organizados como el examen real y actualizados de forma continua."
          />
          <div className="divide-y divide-line border-y border-line lg:col-span-6" data-reveal>
            {BANCOS.map((b) => (
              <Link
                key={b.slug}
                to={`/plataforma/${b.slug}`}
                className="group grid grid-cols-[1fr_auto] items-baseline gap-4 py-3.5 sm:grid-cols-[150px_110px_1fr_auto]"
              >
                <span className="font-semibold text-ink">{b.examen}</span>
                <span className="tabular hidden font-display text-lg font-bold text-ink sm:block">{b.dato}</span>
                <span className="hidden text-[15px] text-muted sm:block">{b.detalle}</span>
                <ArrowRight className="h-4 w-4 text-subtle transition-transform group-hover:translate-x-0.5 group-hover:text-jungle-600" aria-hidden />
              </Link>
            ))}
          </div>
        </div>

        <div className="mt-14" data-reveal>
          <PruebaPregunta />
        </div>

        <div
          className="mt-10 flex flex-col gap-5 rounded-2xl border border-line bg-paper p-6 sm:flex-row sm:items-center sm:justify-between md:p-8"
          data-reveal
        >
          <div>
            <p className="eyebrow">Simulacro gratis</p>
            <p className="mt-2 font-display text-xl font-bold text-ink md:text-2xl">
              Rinde un simulacro completo con el formato oficial.
            </p>
            <p className="mt-1 text-[15px] text-muted">
              ENAM, ENCIB, Residentado, SERUMS o EsSalud. El primero de cada examen no tiene costo.
            </p>
          </div>
          <a href={simulacroHref()!} className="btn-primary shrink-0">
            Empezar simulacro <ArrowRight className="h-4 w-4" aria-hidden />
          </a>
        </div>

        <div className="mt-16">
          <ListaNumerada items={CARACTERISTICAS_BANQUEO} />
        </div>
      </div>
    </section>
  );
}

// ── Videoclases: catálogo ────────────────────────────────────────

const UNIDAD_LABEL: Record<(typeof COLECCIONES)[number]['unidad'], string> = {
  cursos: 'cursos',
  academias: 'academias',
  segmentos: 'segmentos',
  incluye: 'recursos',
};

export function SeccionVideoclases() {
  const [activa, setActiva] = useState(COLECCIONES[0].id);
  const col = COLECCIONES.find((c) => c.id === activa) ?? COLECCIONES[0];
  const consulta = `https://wa.me/${WHATSAPP.numero}?text=${encodeURIComponent(`Hola, quiero información sobre la colección ${col.nombre}`)}`;

  return (
    <section id="videoclases" className="bg-paper">
      <div className="container-x py-20 md:py-28">
        <div className="grid gap-8 lg:grid-cols-12 lg:items-end">
          <SectionHeader
            className="lg:col-span-7"
            eyebrow="Videoclases"
            title="Cursos completos en video y PDF"
            lead="Las colecciones de las academias más reconocidas del país y la región, desde ciencias básicas hasta investigación y residentado."
          />
          <p className="text-[15px] leading-relaxed text-muted lg:col-span-5 lg:pb-1" data-reveal>
            Elige una colección para ver qué cursos incluye. Si no encuentras lo que buscas, escríbenos: te
            decimos en qué colección está.
          </p>
        </div>

        <div className="mt-12 grid overflow-hidden rounded-2xl border border-line bg-white lg:grid-cols-12" data-reveal>
          {/* Índice de colecciones */}
          <div role="tablist" aria-label="Colecciones" className="flex overflow-x-auto border-b border-line lg:col-span-4 lg:flex-col lg:border-b-0 lg:border-r">
            {COLECCIONES.map((c) => {
              const on = c.id === activa;
              return (
                <button
                  key={c.id}
                  role="tab"
                  type="button"
                  aria-selected={on}
                  onClick={() => setActiva(c.id)}
                  className={`relative shrink-0 border-line px-5 py-4 text-left transition-colors lg:border-b lg:last:border-b-0 ${
                    on ? 'bg-jungle-50' : 'hover:bg-paper'
                  }`}
                >
                  {on && <span className="absolute inset-x-0 bottom-0 h-0.5 bg-jungle-800 lg:inset-y-0 lg:left-0 lg:right-auto lg:h-auto lg:w-0.5" aria-hidden />}
                  <span className={`block whitespace-nowrap font-semibold ${on ? 'text-jungle-800' : 'text-ink'}`}>{c.nombre}</span>
                  <span className="tabular mt-0.5 block text-[13px] text-subtle">
                    {c.cursos.length} {UNIDAD_LABEL[c.unidad]}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Detalle */}
          <div role="tabpanel" className="flex flex-col p-6 md:p-8 lg:col-span-8">
            <div className="flex flex-wrap items-start justify-between gap-4 border-b border-line pb-5">
              <div>
                <h3 className="text-2xl">{col.nombre}</h3>
                <p className="mt-1 text-[15px] text-muted">{col.area}</p>
              </div>
              <span className="rounded-lg bg-paper px-3 py-1.5 text-[13px] font-medium text-muted">{col.formato}</span>
            </div>

            <ol className="mt-2 grid flex-1 content-start sm:grid-cols-2 sm:gap-x-8">
              {col.cursos.map((c, i) => (
                <li key={c} className="flex items-baseline gap-4 border-b border-line py-3 text-[15px] text-ink">
                  <span className="tabular w-6 shrink-0 text-[13px] text-subtle">{String(i + 1).padStart(2, '0')}</span>
                  {c}
                </li>
              ))}
            </ol>

            <div className="mt-6 flex flex-wrap gap-3">
              {col.slug ? (
                <Link to={`/plataforma/${col.slug}`} className="btn-primary">
                  Ver precio y detalles <ArrowRight className="h-4 w-4" aria-hidden />
                </Link>
              ) : (
                <a href={consulta} target="_blank" rel="noreferrer" className="btn-primary">
                  <MessageCircle className="h-4 w-4" aria-hidden /> Consultar por esta colección
                </a>
              )}
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
    texto: 'ENAM, ENCIB, Residentado, EsSalud o videoclases. Ves el precio y qué incluye antes de pagar.',
    dato: 'Precio claro',
  },
  {
    Icon: CreditCard, img: 'paso-paga', titulo: 'Paga con Yape o tarjeta',
    texto: 'Escribe tu nombre y correo, y paga en la página segura de Mercado Pago. Sin suscripciones ni cobros automáticos.',
    dato: 'Menos de 2 minutos',
  },
  {
    Icon: MailCheck, img: 'paso-acceso', titulo: 'Entra al instante',
    texto: 'Apenas se aprueba el pago entras a tu Portal y te enviamos tu contraseña por correo para la próxima vez.',
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
          lead="Pagas una sola vez por el periodo que elijas y entras en el momento. Sin esperar a que alguien revise tu pago."
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
