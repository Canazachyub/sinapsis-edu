import { useEffect, useState } from 'react';
import { BookOpen, Bookmark, CheckCircle2, Clock3, FileText } from 'lucide-react';
import { useInView } from '@/hooks/useInView';

/**
 * Maqueta estática de una pregunta del banqueo (DESIGN.md §7.3).
 * Al entrar en pantalla marca la alternativa correcta y despliega la justificación.
 */

interface Pregunta {
  examen: string;
  numero: number;
  total: number;
  tiempo: string;
  tags: string[];
  enunciado: string;
  alternativas: string[];
  correcta: number;
  justificacion: string;
  referencia: string;
}

export const PREGUNTA_ENAM: Pregunta = {
  examen: 'ENAM 2021',
  numero: 12,
  total: 100,
  tiempo: '01:30',
  tags: ['Anestesiología'],
  enunciado:
    'Varón de 65 años en postoperatorio inmediato y con anestesia raquídea; la enfermera reporta que no puede miccionar. Al examen: globo vesical. ¿Cuál es la conducta a seguir?',
  alternativas: [
    'Colocar sonda vesical de doble vía',
    'Indicar sonda Nelatón',
    'Indicar sonda vesical de triple vía',
    'Realizar talla vesical suprapúbica',
  ],
  correcta: 0,
  justificacion:
    'Los pacientes varones ancianos pueden cursar con retención urinaria en el postoperatorio luego de haber recibido anestesia regional, en especial la raquídea.',
  referencia: 'Pregunta del ENAM 2021.',
};


const LETRAS = ['A', 'B', 'C', 'D', 'E'];

interface Props {
  data?: Pregunta;
  /** Si es true, la respuesta se revela sola al entrar en pantalla. */
  animate?: boolean;
  compact?: boolean;
  className?: string;
}

export function MockPregunta({ data = PREGUNTA_ENAM, animate = true, compact = false, className = '' }: Props) {
  const { ref, inView } = useInView<HTMLDivElement>();
  const [step, setStep] = useState(animate ? 0 : 2); // 0: sin responder · 1: marcada · 2: justificación

  useEffect(() => {
    if (!animate || !inView) return;
    const t1 = window.setTimeout(() => setStep(1), 700);
    const t2 = window.setTimeout(() => setStep(2), 1400);
    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
    };
  }, [animate, inView]);

  const progreso = Math.round((data.numero / data.total) * 100);

  return (
    <div ref={ref} className={`card shadow-mock overflow-hidden text-left ${className}`}>
      {/* Cabecera */}
      <div className="flex items-center justify-between gap-3 border-b border-line px-5 py-3">
        <div className="flex items-center gap-2 text-[13px] text-muted">
          <FileText className="h-4 w-4 text-jungle-600" aria-hidden />
          <span className="font-semibold text-ink">{data.examen}</span>
          <span>· Pregunta {data.numero} de {data.total}</span>
        </div>
        <div className="flex items-center gap-3 text-[13px] text-muted">
          <span className="tabular inline-flex items-center gap-1.5">
            <Clock3 className="h-4 w-4" aria-hidden /> {data.tiempo}
          </span>
          <Bookmark className="h-4 w-4" aria-hidden />
        </div>
      </div>
      <div className="h-1 bg-paper">
        <div className="h-full bg-jungle-600" style={{ width: `${progreso}%` }} />
      </div>

      <div className={compact ? 'p-4' : 'p-5'}>
        <div className="flex flex-wrap gap-1.5">
          {data.tags.map((t) => (
            <span key={t} className="chip bg-jungle-50 text-jungle-600">{t}</span>
          ))}
        </div>
        <p className={`mt-3 font-medium leading-relaxed text-ink ${compact ? 'text-[13px]' : 'text-[14px]'}`}>
          {data.enunciado}
        </p>

        <ul className="mt-4 space-y-2">
          {data.alternativas.map((alt, i) => {
            const isCorrect = step >= 1 && i === data.correcta;
            return (
              <li
                key={alt}
                className={`flex items-center gap-3 rounded-xl border px-3 py-2.5 text-[13px] transition-colors duration-300 ${
                  isCorrect ? 'border-correct/40 bg-green-50 text-ink' : 'border-line bg-white text-ink/90'
                }`}
              >
                <span
                  className={`grid h-6 w-6 shrink-0 place-items-center rounded-full text-xs font-semibold transition-colors duration-300 ${
                    isCorrect ? 'bg-correct text-white' : 'bg-paper text-muted'
                  }`}
                >
                  {LETRAS[i]}
                </span>
                <span className="flex-1">{alt}</span>
                {isCorrect && (
                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-correct">
                    <CheckCircle2 className="h-4 w-4" aria-hidden /> Correcta
                  </span>
                )}
              </li>
            );
          })}
        </ul>

        <div
          className={`grid transition-all duration-500 ease-expo ${
            step >= 2 ? 'mt-4 grid-rows-[1fr] opacity-100' : 'mt-0 grid-rows-[0fr] opacity-0'
          }`}
        >
          <div className="overflow-hidden">
            <div className="rounded-xl bg-paper p-4">
              <div className="flex items-center gap-2 text-[13px] font-semibold text-ink">
                <BookOpen className="h-4 w-4 text-jungle-600" aria-hidden /> Justificación
              </div>
              <p className="mt-2 text-[12.5px] leading-relaxed text-muted">{data.justificacion}</p>
              <p className="mt-2 text-[11px] italic text-subtle">{data.referencia}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
