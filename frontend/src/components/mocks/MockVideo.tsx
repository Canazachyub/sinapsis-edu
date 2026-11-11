import { Maximize, PlayCircle, Play, Settings, Volume2 } from 'lucide-react';

/**
 * Maqueta de reproductor de videoclase (DESIGN.md §7.3).
 * La "diapositiva" es un SVG plano (ciclo cardíaco), sin imágenes generadas.
 */

function DiapositivaCiclo() {
  // ECG estilizado + presión ventricular, con fases marcadas.
  return (
    <svg viewBox="0 0 480 270" className="h-full w-full" role="img" aria-label="Diapositiva: ciclo cardíaco">
      <rect width="480" height="270" fill="#FBFCFB" />
      <text x="24" y="38" fontFamily="Plus Jakarta Sans, sans-serif" fontWeight="700" fontSize="18" fill="#0F1A18">
        Ciclo cardíaco
      </text>
      <text x="24" y="58" fontFamily="Inter, sans-serif" fontSize="11" fill="#51625E">
        Relación entre ECG y presión ventricular izquierda
      </text>

      {/* Fases */}
      <rect x="60" y="76" width="130" height="170" fill="#E3EEEC" opacity="0.55" />
      <rect x="190" y="76" width="150" height="170" fill="#F1F7F5" />
      <text x="125" y="92" textAnchor="middle" fontFamily="Inter" fontSize="10" fontWeight="600" fill="#1F5B52">SÍSTOLE</text>
      <text x="265" y="92" textAnchor="middle" fontFamily="Inter" fontSize="10" fontWeight="600" fill="#1F5B52">DIÁSTOLE</text>

      {/* Ejes */}
      <line x1="40" y1="246" x2="456" y2="246" stroke="#C9D3D0" />
      <text x="30" y="132" fontFamily="Inter" fontSize="9" fill="#8A9A96" transform="rotate(-90 30 132)">mmHg</text>

      {/* Presión VI */}
      <path
        d="M40 228 C 70 228, 75 226, 82 222 C 95 160, 105 120, 130 116 C 160 112, 175 150, 190 220 C 200 232, 230 230, 340 228 C 360 227, 372 226, 380 222 C 393 160, 403 120, 428 116 C 444 114, 452 130, 456 150"
        fill="none"
        stroke="#10312D"
        strokeWidth="2.5"
      />
      {/* ECG */}
      <path
        d="M40 196 L 52 196 L 56 190 L 60 196 L 66 196 L 69 200 L 73 168 L 77 206 L 81 196 L 110 196 C 120 186, 132 186, 142 196 L 340 196 L 350 196 L 354 190 L 358 196 L 364 196 L 367 200 L 371 168 L 375 206 L 379 196 L 408 196 C 418 186, 430 186, 440 196 L 456 196"
        fill="none"
        stroke="#16A34A"
        strokeWidth="1.8"
      />
      <circle cx="73" cy="168" r="3" fill="#C2E476" stroke="#10312D" strokeWidth="1" />
      <text x="80" y="164" fontFamily="Inter" fontSize="9" fill="#51625E">QRS</text>
      <text x="136" y="182" fontFamily="Inter" fontSize="9" fill="#51625E">T</text>
      <text x="138" y="108" fontFamily="Inter" fontSize="9" fill="#51625E">Presión VI</text>
    </svg>
  );
}

interface Leccion {
  titulo: string;
  duracion: string;
}

const LECCIONES: Leccion[] = [
  { titulo: 'Introducción a la fisiología cardiovascular', duracion: '09:20' },
  { titulo: 'Potencial de acción cardíaco', duracion: '15:45' },
  { titulo: 'Ciclo cardíaco', duracion: '12:40' },
  { titulo: 'Gasto cardíaco y sus determinantes', duracion: '18:05' },
  { titulo: 'Regulación de la presión arterial', duracion: '21:30' },
  { titulo: 'Banco de preguntas del módulo', duracion: '30 preg.' },
];

interface Props {
  /** Muestra la lista de lecciones a la derecha. */
  withPlaylist?: boolean;
  className?: string;
}

export function MockVideo({ withPlaylist = false, className = '' }: Props) {
  const activa = 2;
  return (
    <div className={`card shadow-mock overflow-hidden ${className}`}>
      <div className={withPlaylist ? 'grid md:grid-cols-[1.55fr_1fr]' : ''}>
        <div className="bg-jungle-900">
          <div className="flex items-center justify-between gap-3 bg-white px-4 py-2.5 text-[13px] border-b border-line">
            <div className="flex items-center gap-2 text-muted">
              <PlayCircle className="h-4 w-4 text-jungle-600" aria-hidden />
              <span className="font-semibold text-ink">Fisiología</span>
              <span>· Ciclo cardíaco</span>
            </div>
            <span className="tabular text-muted">12:40</span>
          </div>
          <div className="relative aspect-video">
            <DiapositivaCiclo />
            <div className="absolute inset-0 grid place-items-center">
              <span className="grid h-14 w-14 place-items-center rounded-full bg-jungle-800/90 text-white shadow-lg ring-4 ring-white/40">
                <Play className="ml-0.5 h-6 w-6 fill-current" aria-hidden />
              </span>
            </div>
          </div>
          <div className="bg-jungle-900 px-4 pb-3 pt-2.5 text-white">
            <div className="h-1 overflow-hidden rounded-full bg-white/20">
              <div className="h-full animate-progress rounded-full bg-lime-400" />
            </div>
            <div className="mt-2 flex items-center justify-between text-[11px] text-white/70">
              <span className="tabular">06:12 / 12:40</span>
              <span className="flex items-center gap-3">
                <span className="font-semibold">1x</span>
                <Volume2 className="h-3.5 w-3.5" aria-hidden />
                <Settings className="h-3.5 w-3.5" aria-hidden />
                <Maximize className="h-3.5 w-3.5" aria-hidden />
              </span>
            </div>
          </div>
        </div>

        {withPlaylist && (
          <div className="border-t border-line md:border-l md:border-t-0">
            <div className="flex items-center justify-between px-4 py-3 text-[13px]">
              <span className="font-semibold text-ink">Módulo · Cardiovascular</span>
              <span className="text-muted">6 clases</span>
            </div>
            <ol className="pb-2">
              {LECCIONES.map((l, i) => (
                <li
                  key={l.titulo}
                  className={`flex items-center gap-3 px-4 py-2.5 text-[12.5px] ${
                    i === activa ? 'bg-jungle-50 font-semibold text-jungle-800' : 'text-muted'
                  }`}
                >
                  <span
                    className={`grid h-5 w-5 shrink-0 place-items-center rounded-full text-[10px] ${
                      i < activa ? 'bg-correct text-white' : i === activa ? 'bg-jungle-800 text-white' : 'border border-line'
                    }`}
                  >
                    {i < activa ? '✓' : i + 1}
                  </span>
                  <span className="flex-1 leading-snug">{l.titulo}</span>
                  <span className="tabular shrink-0 text-subtle">{l.duracion}</span>
                </li>
              ))}
            </ol>
          </div>
        )}
      </div>
    </div>
  );
}
