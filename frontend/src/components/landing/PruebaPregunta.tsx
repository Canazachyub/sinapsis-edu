import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { ArrowRight, Check, Clock3, RotateCcw, X } from 'lucide-react';
import { ScrollLink } from '@/components/ScrollLink';
import { PREGUNTAS_MUESTRA } from '@/data/preguntasMuestra';
import { useInView } from '@/hooks/useInView';

/**
 * Preguntas reales de exámenes anteriores, con el mismo formato que la plataforma:
 * tiempo por pregunta, curso, examen de origen y justificación al responder.
 */

const LETRAS = ['A', 'B', 'C', 'D', 'E'];

/** `**texto**` → negrita resaltada (formato de la JUSTIFICACION). */
function conNegritas(texto: string): ReactNode[] {
  return texto.split(/(\*\*[^*]+\*\*)/g).map((parte, i) =>
    parte.startsWith('**') && parte.endsWith('**') ? (
      <strong key={i} className="font-semibold text-ink">
        {parte.slice(2, -2)}
      </strong>
    ) : (
      parte
    ),
  );
}

/** Resalta en el enunciado los fragmentos exactos indicados en PISTAS. */
function conPistas(texto: string, pistas: string[] | undefined, activo: boolean): ReactNode[] | string {
  if (!activo || !pistas?.length) return texto;
  const escapar = (t: string) => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const re = new RegExp(`(${pistas.map(escapar).join('|')})`, 'g');
  return texto.split(re).map((parte, i) =>
    pistas.includes(parte) ? (
      <mark key={i} className="bg-transparent text-ink underline decoration-lime-500 decoration-2 underline-offset-4">
        {parte}
      </mark>
    ) : (
      parte
    ),
  );
}

function formatTiempo(s: number) {
  const m = Math.floor(s / 60);
  return `${String(m).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
}

export function PruebaPregunta() {
  const preguntas = PREGUNTAS_MUESTRA;
  const { ref, inView } = useInView<HTMLDivElement>();
  const [idx, setIdx] = useState(0);
  const [elegida, setElegida] = useState<number | null>(null);
  const [agotado, setAgotado] = useState(false);
  const [aciertos, setAciertos] = useState(0);
  const [terminado, setTerminado] = useState(false);
  const [restante, setRestante] = useState(preguntas[0].timeInSeconds);

  const p = preguntas[idx];
  const correcta = p.correctAnswer - 1;
  const respondida = elegida !== null || agotado;

  // Cuenta regresiva: corre solo si la pregunta está en pantalla y sin responder.
  useEffect(() => {
    if (!inView || respondida || terminado) return;
    if (restante <= 0) {
      setAgotado(true);
      return;
    }
    const t = window.setTimeout(() => setRestante((r) => r - 1), 1000);
    return () => window.clearTimeout(t);
  }, [inView, respondida, terminado, restante]);

  function elegir(i: number) {
    if (respondida) return;
    setElegida(i);
    if (i === correcta) setAciertos((a) => a + 1);
  }

  function irA(n: number) {
    setIdx(n);
    setElegida(null);
    setAgotado(false);
    setRestante(preguntas[n].timeInSeconds);
  }

  function siguiente() {
    if (idx === preguntas.length - 1) setTerminado(true);
    else irA(idx + 1);
  }

  function reiniciar() {
    setAciertos(0);
    setTerminado(false);
    irA(0);
  }

  const pctTiempo = (restante / p.timeInSeconds) * 100;

  return (
    <div ref={ref} className="overflow-hidden rounded-2xl border border-line bg-white">
      {/* Barra superior */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line bg-paper px-5 py-3 text-sm">
        <div className="flex items-center gap-3">
          <span className="font-semibold text-ink">Prueba preguntas reales de nuestros bancos</span>
          <span className="hidden text-subtle sm:inline">·</span>
          <span className="hidden text-muted sm:inline">Así funciona dentro del banco</span>
        </div>
        <div className="flex items-center gap-1.5" aria-label={`Pregunta ${idx + 1} de ${preguntas.length}`}>
          {preguntas.map((_, i) => (
            <span
              key={i}
              className={`h-1.5 w-6 rounded-full ${i < idx || terminado ? 'bg-jungle-600' : i === idx ? 'bg-jungle-800' : 'bg-line'}`}
            />
          ))}
        </div>
      </div>

      {terminado ? (
        <div className="grid place-items-center px-6 py-16 text-center">
          <div className="tabular font-display text-5xl font-bold text-ink">
            {aciertos}/{preguntas.length}
          </div>
          <p className="mt-3 max-w-md text-muted">
            Estas son preguntas reales de exámenes anteriores (ENAM y Residentado). En los bancos encontrarás miles más, organizadas por
            curso, tema y examen, cada una con su justificación.
          </p>
          <div className="mt-7 flex flex-wrap justify-center gap-3">
            <ScrollLink to="plataformas" className="btn-primary cursor-pointer">
              Ver plataformas <ArrowRight className="h-4 w-4" aria-hidden />
            </ScrollLink>
            <button type="button" onClick={reiniciar} className="btn-secondary">
              <RotateCcw className="h-4 w-4" aria-hidden /> Volver a intentar
            </button>
          </div>
        </div>
      ) : (
        <div className="grid lg:grid-cols-[1.15fr_1fr]">
          {/* Pregunta */}
          <div className="p-6 md:p-8">
            <div className="flex flex-wrap items-center gap-2 text-[13px]">
              <span className="rounded-md bg-jungle-800 px-2 py-0.5 font-semibold text-white">{p.nombreDelArchivo}</span>
              <span className="rounded-md bg-jungle-50 px-2 py-0.5 font-medium text-jungle-600">{p.curso}</span>
              {p.tema && <span className="text-muted">{p.tema}</span>}
              <span className="tabular ml-auto text-subtle">
                Pregunta {idx + 1} de {preguntas.length}
              </span>
            </div>

            {/* Temporizador */}
            <div className="mt-5 flex items-center gap-3">
              <Clock3 className={`h-4 w-4 ${restante <= 15 && !respondida ? 'text-wrong' : 'text-muted'}`} aria-hidden />
              <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-paper">
                <div
                  className={`h-full rounded-full transition-[width] duration-1000 ease-linear ${
                    restante <= 15 ? 'bg-wrong' : 'bg-jungle-600'
                  }`}
                  style={{ width: `${pctTiempo}%` }}
                />
              </div>
              <span className={`tabular w-12 text-right text-sm font-semibold ${restante <= 15 && !respondida ? 'text-wrong' : 'text-ink'}`}>
                {formatTiempo(restante)}
              </span>
            </div>

            <p className="mt-5 text-[16px] font-medium leading-relaxed text-ink">{conPistas(p.questionText, p.pistas, respondida)}</p>
            {p.imageLink && (
              <img src={p.imageLink} alt="Imagen de la pregunta" className="mt-4 max-h-64 rounded-xl border border-line" loading="lazy" />
            )}

            <ul className="mt-6 space-y-2.5">
              {p.options.map((o, i) => {
                const esCorrecta = i === correcta;
                const esElegida = i === elegida;
                let estilo = 'border-line hover:border-jungle-600 hover:bg-jungle-50/50';
                if (respondida) {
                  if (esCorrecta) estilo = 'border-correct bg-green-50';
                  else if (esElegida) estilo = 'border-wrong bg-red-50';
                  else estilo = 'border-line opacity-60';
                }
                return (
                  <li key={o}>
                    <button
                      type="button"
                      onClick={() => elegir(i)}
                      disabled={respondida}
                      className={`flex w-full items-start gap-3 rounded-xl border px-4 py-3 text-left text-[15px] text-ink transition-colors disabled:cursor-default ${estilo}`}
                    >
                      <span
                        className={`grid h-6 w-6 shrink-0 place-items-center rounded-md text-xs font-semibold ${
                          respondida && esCorrecta
                            ? 'bg-correct text-white'
                            : respondida && esElegida
                              ? 'bg-wrong text-white'
                              : 'bg-paper text-muted'
                        }`}
                      >
                        {respondida && esCorrecta ? (
                          <Check className="h-3.5 w-3.5" strokeWidth={3} aria-hidden />
                        ) : respondida && esElegida ? (
                          <X className="h-3.5 w-3.5" strokeWidth={3} aria-hidden />
                        ) : (
                          LETRAS[i]
                        )}
                      </span>
                      <span className="pt-0.5">{o}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>

          {/* Justificación */}
          <div className="border-t border-line bg-paper/60 p-6 md:p-8 lg:border-l lg:border-t-0">
            {!respondida ? (
              <div className="flex h-full min-h-[220px] flex-col items-center justify-center text-center">
                <p className="max-w-[280px] text-[15px] leading-relaxed text-muted">
                  Tienes {p.timeInSeconds} segundos, como en el banco. Elige una alternativa para ver la
                  justificación.
                </p>
              </div>
            ) : (
              <div>
                {/* Veredicto en una línea, sin cajas */}
                <p className="flex items-baseline gap-2 border-b border-line pb-4 text-[15px]">
                  <span className={`font-semibold ${elegida === correcta ? 'text-correct' : 'text-wrong'}`}>
                    {elegida === correcta ? 'Correcto.' : agotado && elegida === null ? 'Tiempo agotado.' : 'Incorrecto.'}
                  </span>
                  <span className="text-ink">
                    Respuesta {LETRAS[correcta]}: <span className="font-semibold">{p.options[correcta]}</span>
                  </span>
                </p>

                {/* Dibujo de resolución */}
                {p.lamina && (
                  <figure className="mt-5">
                    <figcaption className="mb-2 text-[13px] font-semibold uppercase tracking-[0.12em] text-jungle-600">
                      Resolución
                    </figcaption>
                    <img
                      src={p.lamina.src}
                      alt={p.lamina.pie}
                      className="aspect-[4/3] w-full rounded-lg border border-line bg-white object-contain"
                      loading="lazy"
                    />
                    <p className="mt-2 text-[13px] leading-snug text-muted">{p.lamina.pie}</p>
                  </figure>
                )}

                <h3 className="mt-6 text-[13px] font-semibold uppercase tracking-[0.12em] text-jungle-600">Justificación</h3>
                <p className="mt-2 text-[15px] leading-relaxed text-ink/85">{conNegritas(p.justificacion)}</p>

                {p.perla && (
                  <div className="mt-5 border-t border-line pt-4">
                    <h3 className="text-[13px] font-semibold uppercase tracking-[0.12em] text-jungle-600">Para recordar</h3>
                    <p className="mt-2 text-[15px] leading-relaxed text-ink">{p.perla}</p>
                  </div>
                )}

                {p.pistas?.length ? (
                  <p className="mt-5 text-[13px] leading-relaxed text-muted">
                    En la pregunta quedaron marcados los datos del enunciado que llevan a la respuesta.
                  </p>
                ) : null}

                <p className="mt-5 text-[13px] text-subtle">
                  {p.curso} · {p.nombreDelArchivo}
                </p>

                <button type="button" onClick={siguiente} className="btn-primary mt-5">
                  {idx === preguntas.length - 1 ? 'Ver resultado' : 'Siguiente pregunta'}
                  <ArrowRight className="h-4 w-4" aria-hidden />
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
