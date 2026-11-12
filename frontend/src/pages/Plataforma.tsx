import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  ArrowRight, BookOpen, Building2, Bone, CheckCircle2, Clock,
  FileText, GraduationCap, Library, Microscope, PlayCircle, Stethoscope, Zap,
} from 'lucide-react';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { WhatsAppButton } from '@/components/WhatsAppButton';
import { usePlataformas } from '@/hooks/usePlataformas';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import type { LucideIcon } from 'lucide-react';
import { SEGMENTOS_ANATOMIA, PRECIO_POR_SEGMENTO_PEN } from '@/data/segmentosAnatomia';
import { COLECCIONES, PROGRAMA } from '@/data/contenido';
import { BanqueoDetalle, SLUGS_BANQUEO } from '@/components/plataforma/BanqueoDetalle';
import { simulacroHref } from '@/config';

// ── Contenido estático por slug ────────────────────────────────

interface PlataformaInfo {
  Icon: LucideIcon;
  tagline: string;
  features: string[];
  incluye: string[];
  faq: Array<{ q: string; a: string }>;
}

const INFO: Record<string, PlataformaInfo> = {
  enam: {
    Icon: Stethoscope,
    tagline: 'La preparación más completa para el Examen Nacional de Medicina.',
    features: [
      'Más de 2 000 preguntas con justificación detallada',
      'Simulacros cronometrados con análisis de rendimiento',
      'Estadísticas de aciertos por área temática',
      'Banco actualizado con preguntas de años anteriores',
      'Modo repaso: solo tus preguntas fallidas',
      'Acceso inmediato al pagar con tarjeta o Yape',
    ],
    incluye: [
      'Plataforma en línea, 24 h / 7 d',
      'Actualización automática del banco de preguntas',
      'Soporte por WhatsApp',
      '30 días de acceso continuo',
    ],
    faq: [
      { q: '¿Cuánto tiempo tengo acceso?', a: '30 días desde que se aprueba tu pago. Con tarjeta o Yape es al instante.' },
      { q: '¿Se actualiza el banco de preguntas?', a: 'Sí, agregamos preguntas continuamente sin costo adicional.' },
      { q: '¿Funciona en celular?', a: 'Sí, la plataforma es completamente responsive.' },
    ],
  },
  encib: {
    Icon: Microscope,
    tagline: 'Domina las ciencias básicas con más de 1 500 preguntas explicadas.',
    features: [
      'Más de 1 500 preguntas organizadas por curso',
      'Justificaciones con fundamento teórico',
      'Filtros por asignatura: Anatomía, Fisiología, Bioquímica y más',
      'Simulacros de tiempo real',
      'Historial de resultados y curvas de progreso',
      'Modo estudio y modo examen',
    ],
    incluye: [
      'Acceso completo a todas las áreas de ciencias básicas',
      'Estadísticas personalizadas',
      'Simulacros ilimitados durante el período',
      '30 días de acceso',
    ],
    faq: [
      { q: '¿Qué cursos cubre?', a: 'Anatomía, Histología, Fisiología, Bioquímica, Microbiología, Patología, Farmacología e Inmunología.' },
      { q: '¿Puedo pausar y continuar?', a: 'Sí, tu progreso se guarda automáticamente.' },
      { q: '¿Hay modo offline?', a: 'Por ahora la plataforma requiere conexión a internet.' },
    ],
  },
  encaps: {
    Icon: BookOpen,
    tagline: 'Casos clínicos reales para dominar las capacidades clínicas del ENCAPS.',
    features: [
      'Banco de casos clínicos con enfoque en diagnóstico y manejo',
      'Retroalimentación detallada para cada opción de respuesta',
      'Cobertura de las áreas del ENCAPS oficial',
      'Simulacros cronometrados',
      'Estadísticas por competencia clínica',
      'Material de repaso integrado',
    ],
    incluye: [
      'Casos clínicos organizados por especialidad',
      'Justificaciones extensas de cada respuesta',
      'Simulacros de tiempo real',
      '30 días de acceso',
    ],
    faq: [
      { q: '¿Cuántos casos clínicos hay?', a: 'Más de 800 casos actualizados según el esquema del ENCAPS.' },
      { q: '¿Cubren el formato vigente del examen?', a: 'Sí, seguimos el esquema de competencias del examen actual.' },
    ],
  },
  rm: {
    Icon: GraduationCap,
    tagline: 'Preparación integral para el Residentado Médico. Por especialidades.',
    features: [
      'Cobertura por especialidades: Medicina Interna, Cirugía, Pediatría, Gineco-obstetricia y más',
      'Más de 3 000 preguntas con justificaciones',
      'Simulacros por especialidad y multidisciplinario',
      'Estadísticas de rendimiento desglosadas',
      'Material teórico complementario integrado',
      'Modos: estudio dirigido y examen cronometrado',
    ],
    incluye: [
      'Acceso a todas las especialidades incluidas',
      'Simulacros ilimitados',
      'Soporte prioritario por WhatsApp',
      '30 días de acceso',
    ],
    faq: [
      { q: '¿Qué especialidades incluye?', a: 'Medicina Interna, Cirugía General, Pediatría, Gineco-Obstetricia, Psiquiatría, Neurología, entre otras.' },
      { q: '¿Puedo cambiar de especialidad en cualquier momento?', a: 'Sí, puedes cambiar de sección libremente desde el menú de la plataforma.' },
    ],
  },
  essalud: {
    Icon: Building2,
    tagline: 'Material actualizado para concursos EsSalud y SERUMS.',
    features: [
      'Banco específico para convocatorias EsSalud',
      'Material SERUMS con enfoque en salud pública y atención primaria',
      'Simulacros con temática de concursos reales',
      'Actualizaciones según convocatorias recientes',
      'Guías de estudio organizadas por bloque temático',
      'Estadísticas por área',
    ],
    incluye: [
      'Banco EsSalud + banco SERUMS',
      'Guías de estudio complementarias',
      'Simulacros cronometrados',
      '30 días de acceso',
    ],
    faq: [
      { q: '¿Cubren los concursos más recientes?', a: 'Actualizamos el banco después de cada convocatoria publicada.' },
      { q: '¿El material SERUMS incluye salud pública?', a: 'Sí, incluye epidemiología, salud pública y atención primaria de salud.' },
    ],
  },
  biblioteca: {
    Icon: Library,
    tagline: 'Libros, guías clínicas y material complementario en un solo lugar.',
    features: [
      'Libros de texto médico digitalizados de referencia',
      'Guías clínicas nacionales e internacionales actualizadas',
      'Material de consulta rápida por especialidad',
      'Formato de lectura optimizado para móvil y escritorio',
      'Buscador integrado por tema o patología',
      'Descargas disponibles durante el período de acceso',
    ],
    incluye: [
      'Colección completa de libros médicos digitales',
      'Guías clínicas MINSA, ESSALUD y OPS',
      'Actualizaciones automáticas de la colección',
      '30 días de acceso',
    ],
    faq: [
      { q: '¿Qué libros incluye?', a: 'Harrison, Robbins, Guyton, Goodman & Gilman, Schwartz, Williams Obstetricia y más.' },
      { q: '¿Puedo descargar los libros?', a: 'Sí, puedes descargar para lectura offline durante tu período de acceso.' },
    ],
  },
  anatomia: {
    Icon: Bone,
    tagline: 'Resúmenes Testut por segmentos anatómicos, bancos UNAP y simulacros.',
    features: [
      'Resúmenes teóricos basados en Testut — el estándar de Puno/UNAP',
      'Banco de preguntas por segmento anatómico',
      '5 simulacros cronometrados por segmento',
      'Compra por segmento: paga solo lo que necesitas',
      'Formato físico disponible en coordinación directa',
      'Soporte por WhatsApp con el docente',
    ],
    incluye: [
      `S/ ${PRECIO_POR_SEGMENTO_PEN} por segmento anatómico`,
      '30 días de acceso por segmento',
      'Banco UNAP específico por área',
      '5 simulacros por segmento',
    ],
    faq: [
      { q: '¿Por qué se vende por segmento?', a: 'Para que pagues exactamente lo que estudias. No todos los alumnos necesitan todos los segmentos al mismo tiempo.' },
      { q: '¿Puedo comprar todos los segmentos juntos?', a: 'Sí, en la página de compra puedes seleccionar varios segmentos y pagar el total de una vez.' },
      { q: '¿Hay material físico?', a: 'Sí, coordina directamente por WhatsApp para el material impreso.' },
      { q: '¿En qué universidad está enfocado?', a: 'El banco está adaptado al programa de anatomía de la UNAP, aunque es útil para cualquier estudiante de medicina.' },
    ],
  },
  cb: {
    Icon: Microscope,
    tagline: 'Videoclases, PDF y bancos de ciencias básicas y preclínicas, en un solo acceso.',
    features: [
      'Videoclases completas por curso',
      'Resúmenes en PDF para repasar rápido',
      'Bancos de preguntas por curso',
      'Desde Anatomía hasta Farmacología y Patología',
      'Estudias a tu ritmo, en celular o PC',
      'Acceso inmediato al pagar con tarjeta o Yape',
    ],
    incluye: [
      'Colección NOTRERO de ciencias básicas',
      'Videoclases + PDF + bancos',
      'Soporte por WhatsApp',
      '30 días de acceso',
    ],
    faq: [
      { q: '¿Qué cursos incluye?', a: 'Anatomía, Bioquímica, Farmacología, Fisiología, Fisiopatología, Microbiología y Parasitología, Morfofisiología, Patología y Semiología.' },
      { q: '¿Sirve para el ENCIB?', a: 'Sí. Cubre los cursos de ciencias básicas que evalúa el ENCIB. Para practicar con preguntas tipo examen, complementa con el banqueo ENCIB.' },
      { q: '¿Incluye Anatomía de Testut por segmentos?', a: 'Anatomía de Testut se vende aparte, por segmento, para que pagues solo lo que estudias.' },
    ],
  },
  cto: {
    Icon: GraduationCap,
    tagline: 'El programa CTO — referente en España y Latinoamérica — en tu portal.',
    features: [
      'Manuales CTO completos en formato digital',
      'Videos de clase magistral por especialidad',
      'Casos clínicos CTO con resolución paso a paso',
      'Plataforma online con banco de preguntas MIR',
      'Material de autoevaluación y test por capítulo',
      '365 días de acceso — prepárate a tu ritmo',
    ],
    incluye: [
      'Manuales completos de todas las especialidades',
      'Banco de preguntas MIR histórico',
      'Videos y material audiovisual',
      '365 días de acceso (1 año)',
    ],
    faq: [
      { q: '¿Para qué examen es útil?', a: 'Principalmente MIR (España), aunque es una referencia estándar para cualquier examen de especialidades médicas.' },
      { q: '¿El precio de S/ 50 es el final?', a: 'Sí, ese es el precio promocional vigente. Puede cambiar cuando termine la promoción.' },
      { q: '¿Incluye actualizaciones?', a: 'Sí, el acceso incluye actualizaciones del material durante el período de un año.' },
    ],
  },
};

// Alias de slugs: URLs alternativas que la gente comparte/recuerda → slug canónico.
const SLUG_ALIASES: Record<string, string> = {
  residentado: 'rm',
  'residentado-medico': 'rm',
  testut: 'anatomia',
};

// ── Ciencias Básicas: videoclases y programa (antes en la landing) ─

function ContenidoCienciasBasicas() {
  const notrero = COLECCIONES.find((c) => c.id === 'notrero');
  const etapas = PROGRAMA.filter((e) => e.id === 'basicas' || e.id === 'preclinicas');
  const [etapa, setEtapa] = useState(etapas[0]?.id);
  const actual = etapas.find((e) => e.id === etapa) ?? etapas[0];

  return (
    <>
      {notrero && (
        <section>
          <h2 className="text-3xl mb-2">Videoclases incluidas</h2>
          <p className="text-jungle-light mb-6 text-sm">{notrero.formato}</p>
          <div className="overflow-hidden rounded-2xl border border-jungle/10 bg-white shadow-card">
            <div className="flex items-center justify-between gap-4 border-b border-jungle/10 px-5 py-4">
              <div>
                <div className="font-display text-lg font-bold">{notrero.nombre}</div>
                <div className="text-xs text-jungle-light">{notrero.cursos.length} cursos de ciencias básicas</div>
              </div>
              <div className="flex gap-2 text-jungle-600" aria-hidden>
                <PlayCircle className="h-5 w-5" /><FileText className="h-5 w-5" />
              </div>
            </div>
            <ul className="grid gap-px bg-jungle/10 sm:grid-cols-3">
              {notrero.cursos.map((c) => (
                <li key={c} className="flex items-center gap-2 bg-white px-4 py-3 text-sm">
                  <PlayCircle className="h-4 w-4 shrink-0 text-success" aria-hidden /> {c}
                </li>
              ))}
            </ul>
          </div>

          <Link
            to="/plataforma/anatomia"
            className="group mt-3 flex items-center justify-between gap-4 rounded-2xl border border-jungle/10 bg-white px-5 py-4 shadow-card hover:border-jungle/30"
          >
            <div className="flex items-center gap-3">
              <Bone className="h-6 w-6 text-jungle-600" aria-hidden />
              <div>
                <div className="font-semibold">Anatomía de Testut, por segmentos</div>
                <div className="text-xs text-jungle-light">Resúmenes, banco UNAP y 5 simulacros por segmento · desde S/ {PRECIO_POR_SEGMENTO_PEN}</div>
              </div>
            </div>
            <ArrowRight className="h-4 w-4 shrink-0 text-jungle-light transition-transform group-hover:translate-x-0.5" aria-hidden />
          </Link>
        </section>
      )}

      {actual && (
        <section>
          <h2 className="text-3xl mb-5">Programa de estudios</h2>
          <div role="tablist" aria-label="Etapas" className="mb-4 flex gap-2">
            {etapas.map((e) => (
              <button
                key={e.id}
                role="tab"
                type="button"
                aria-selected={etapa === e.id}
                onClick={() => setEtapa(e.id)}
                className={`rounded-xl border px-4 py-2 text-sm font-semibold transition-colors ${
                  etapa === e.id ? 'border-jungle bg-jungle text-cream' : 'border-jungle/15 bg-white hover:border-jungle/40'
                }`}
              >
                {e.nombre} <span className="opacity-60">· {e.cursos.length}</span>
              </button>
            ))}
          </div>
          <ul role="tabpanel" className="grid gap-2 sm:grid-cols-2">
            {actual.cursos.map((c) => (
              <li key={c} className="flex items-center gap-2 rounded-xl border border-jungle/10 bg-white px-4 py-2.5 text-sm">
                <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-success" aria-hidden /> {c}
              </li>
            ))}
          </ul>
        </section>
      )}
    </>
  );
}

// ── Componente principal ───────────────────────────────────────

function formatDuracion(dias: number): string {
  if (dias >= 360) return '1 año de acceso';
  if (dias === 30) return '30 días de acceso';
  return `${dias} días de acceso`;
}

function FaqItem({ q, a }: { q: string; a: string }) {
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

export function Plataforma() {
  const { slug: rawSlug } = useParams<{ slug: string }>();
  // Normaliza alias (ej. "residentado" → "rm") antes de buscar.
  const slug = rawSlug ? (SLUG_ALIASES[rawSlug] ?? rawSlug) : undefined;
  const { plataformas } = usePlataformas();
  const data = plataformas.find((p) => p.slug === slug);
  const info = slug ? INFO[slug] : undefined;

  useDocumentTitle(data?.nombre);

  if (!data) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1 container-x py-20">
          <h1 className="text-3xl">Plataforma no encontrada</h1>
          <Link to="/" className="btn-ghost mt-6 inline-flex">Volver al inicio</Link>
        </main>
        <Footer />
      </div>
    );
  }

  const Icon = info?.Icon ?? Stethoscope;
  const hayPromo =
    typeof data.precio_promocional === 'number' &&
    data.precio_promocional > 0 &&
    data.precio_promocional < data.precio;
  const precioMostrado = hayPromo ? data.precio_promocional! : data.precio;
  const esAnatomia = slug === 'anatomia';
  const simGratis = slug && SLUGS_BANQUEO.includes(slug) ? simulacroHref(slug, 'registro') : null;

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      {/* ── Hero ── */}
      <section className="bg-jungle text-cream">
        <div className="container-x py-16 md:py-20">
          <div className="flex flex-col md:flex-row gap-10 md:gap-16 items-start">
            {/* Icono (solo si no hay imagen de la plataforma) */}
            <div className="shrink-0 w-20 h-20 md:hidden rounded-3xl bg-lime/10 border border-lime/20 flex items-center justify-center">
              <Icon className="w-10 h-10 text-lime" />
            </div>

            <div className="flex-1">
              {data.etiqueta && (
                <span className="pill-lime mb-3">{data.etiqueta}</span>
              )}
              <h1 className="text-4xl md:text-6xl text-lime leading-none">{data.nombre}</h1>
              {info && (
                <p className="mt-4 text-xl text-cream/75 max-w-xl leading-relaxed">{info.tagline}</p>
              )}

              <div className="mt-6 flex items-baseline gap-3 flex-wrap">
                {esAnatomia ? (
                  <>
                    <span className="text-cream/60 text-base">Desde</span>
                    <span className="text-5xl font-bold text-lime">S/ {PRECIO_POR_SEGMENTO_PEN}</span>
                    <span className="text-cream/60">/ segmento</span>
                  </>
                ) : (
                  <>
                    {hayPromo && (
                      <span className="text-2xl text-cream/50 line-through">S/ {data.precio}</span>
                    )}
                    <span className="text-5xl font-bold text-lime">S/ {precioMostrado}</span>
                    <span className="text-cream/60">/ {formatDuracion(data.duracion_dias)}</span>
                  </>
                )}
              </div>

              <div className="mt-8 flex flex-wrap gap-3">
                <Link to={`/compra/${data.slug}`} className="btn-primary-lime">
                  Comprar acceso
                </Link>
                {simGratis ? (
                  <a href={simGratis} className="btn inline-flex items-center gap-2 rounded-xl border border-cream/25 px-5 text-cream hover:bg-cream/10">
                    Simulacro gratis
                  </a>
                ) : (
                  <WhatsAppButton
                    message={`Hola, quiero más información sobre ${data.nombre}.`}
                    label="Consultar por WhatsApp"
                    className="!border-cream/20 !text-cream hover:!bg-cream/10"
                  />
                )}
              </div>
            </div>

            <div className="hidden md:block md:w-[38%] shrink-0 self-center">
              <img
                src={`${import.meta.env.BASE_URL}images/plataformas/${data.slug}.webp`}
                alt=""
                className="w-full rounded-3xl border border-cream/10 shadow-mock-dark"
                onError={(e) => { e.currentTarget.style.display = 'none'; }}
              />
            </div>
          </div>
        </div>
      </section>

      {/* ── Cuerpo ── */}
      <main className="flex-1 container-x py-14 md:py-20">
        <div className="grid md:grid-cols-3 gap-10 md:gap-16">

          {/* Columna principal */}
          <div className="md:col-span-2 space-y-12">

            {/* Descripción */}
            <section>
              <h2 className="text-3xl mb-4">¿Qué es {data.nombre}?</h2>
              <p className="text-jungle-light leading-relaxed">{data.descripcion}</p>
            </section>

            {/* Características */}
            {info?.features && !simGratis && (
              <section>
                <h2 className="text-3xl mb-5">Lo que vas a encontrar</h2>
                <ul className="grid sm:grid-cols-2 gap-3">
                  {info.features.map((f) => (
                    <li key={f} className="flex items-start gap-3 bg-white rounded-xl border border-jungle/10 p-4 shadow-card">
                      <CheckCircle2 className="w-5 h-5 text-success shrink-0 mt-0.5" />
                      <span className="text-sm leading-snug">{f}</span>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {slug && SLUGS_BANQUEO.includes(slug) && <BanqueoDetalle slug={slug} />}

            {slug === 'cb' && <ContenidoCienciasBasicas />}

            {/* Segmentos Anatomía */}
            {esAnatomia && (
              <section>
                <h2 className="text-3xl mb-2">Segmentos disponibles</h2>
                <p className="text-jungle-light mb-6 text-sm">
                  Cada segmento incluye resúmenes Testut, banco UNAP y 5 simulacros.
                  Puedes comprar uno o varios a la vez.
                </p>
                <div className="grid gap-3">
                  {SEGMENTOS_ANATOMIA.map((s) => (
                    <details key={s.id} className="group border border-jungle/10 rounded-2xl bg-white overflow-hidden shadow-card">
                      <summary className="cursor-pointer list-none px-5 py-4 flex items-center justify-between gap-4 hover:bg-jungle/[.03]">
                        <div>
                          <div className="font-semibold">{s.nombre}</div>
                          <div className="text-xs text-jungle-light mt-0.5">{s.temas.length} temas · S/ {PRECIO_POR_SEGMENTO_PEN}</div>
                        </div>
                        <div className="flex items-center gap-3 shrink-0">
                          <span className="font-bold text-jungle">S/ {PRECIO_POR_SEGMENTO_PEN}</span>
                          <span className="text-jungle-light group-open:rotate-180 transition-transform">▾</span>
                        </div>
                      </summary>
                      <div className="px-5 pb-4">
                        <ul className="grid sm:grid-cols-2 gap-1 text-sm text-jungle-light">
                          {s.temas.map((t) => (
                            <li key={t} className="flex gap-2">
                              <span className="text-success shrink-0">•</span> {t}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </details>
                  ))}
                </div>
              </section>
            )}

            {/* FAQ */}
            {info?.faq && info.faq.length > 0 && (
              <section>
                <h2 className="text-3xl mb-5">Preguntas frecuentes</h2>
                <div className="space-y-3">
                  {info.faq.map((item) => (
                    <FaqItem key={item.q} q={item.q} a={item.a} />
                  ))}
                </div>
              </section>
            )}
          </div>

          {/* Sidebar */}
          <aside className="space-y-5">
            {/* Card resumen */}
            <div className="bg-white border border-jungle/10 rounded-2xl p-6 shadow-card sticky top-6">
              <div className="font-display text-xl uppercase tracking-tight mb-4">{data.nombre}</div>

              {info?.incluye && (
                <>
                  <div className="text-xs font-bold uppercase tracking-wider text-jungle-light mb-3">Incluye</div>
                  <ul className="space-y-2 mb-5">
                    {info.incluye.map((item) => (
                      <li key={item} className="flex items-start gap-2 text-sm">
                        <CheckCircle2 className="w-4 h-4 text-success shrink-0 mt-0.5" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </>
              )}

              <div className="border-t border-jungle/10 pt-4 mb-5">
                {esAnatomia ? (
                  <div>
                    <div className="text-xs text-jungle-light">Desde</div>
                    <div className="text-3xl font-bold">S/ {PRECIO_POR_SEGMENTO_PEN} <span className="text-base font-normal text-jungle-light">/ segmento</span></div>
                  </div>
                ) : (
                  <div>
                    {hayPromo && <div className="text-base text-jungle-light line-through">S/ {data.precio}</div>}
                    <div className="text-3xl font-bold">S/ {precioMostrado}</div>
                    <div className="text-sm text-jungle-light flex items-center gap-1 mt-1">
                      <Clock className="w-3.5 h-3.5" /> {formatDuracion(data.duracion_dias)}
                    </div>
                  </div>
                )}
              </div>

              <Link to={`/compra/${data.slug}`} className="btn-primary w-full">
                {esAnatomia ? 'Elegir segmentos →' : 'Comprar acceso →'}
              </Link>

              <div className="mt-3 flex items-center gap-2 text-xs text-jungle-light justify-center">
                <Zap className="w-3.5 h-3.5 text-warning" />
                Pago seguro con tarjeta o Yape · acceso inmediato
              </div>
            </div>

            {/* WhatsApp */}
            <div className="bg-jungle/5 border border-jungle/10 rounded-2xl p-5 text-center">
              <div className="text-sm font-semibold mb-1">¿Tienes dudas?</div>
              <div className="text-xs text-jungle-light mb-3">Escríbenos y te respondemos en minutos.</div>
              <WhatsAppButton
                message={`Hola, tengo preguntas sobre ${data.nombre}.`}
                label="Consultar ahora"
                className="w-full justify-center"
              />
            </div>
          </aside>
        </div>
      </main>

      {/* Móvil: compra siempre a mano */}
      <div className="sticky bottom-0 z-30 border-t border-jungle/10 bg-white/95 px-4 py-3 backdrop-blur md:hidden">
        <div className="flex items-center justify-between gap-3">
          <div className="leading-tight">
            <div className="text-xs text-jungle-light">{esAnatomia ? 'Desde' : formatDuracion(data.duracion_dias)}</div>
            <div className="text-xl font-bold">S/ {esAnatomia ? PRECIO_POR_SEGMENTO_PEN : precioMostrado}</div>
          </div>
          <Link to={`/compra/${data.slug}`} className="btn-primary !min-h-[44px] px-5">
            {esAnatomia ? 'Elegir segmentos' : 'Comprar'} <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
        </div>
      </div>

      <Footer />
    </div>
  );
}
