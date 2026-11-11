import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Bone,
  BookOpen,
  Building2,
  GraduationCap,
  Library,
  Microscope,
  Stethoscope,
  type LucideIcon,
} from 'lucide-react';

const ICONS: Record<string, LucideIcon> = {
  enam: Stethoscope,
  encib: Microscope,
  encaps: BookOpen,
  rm: GraduationCap,
  essalud: Building2,
  biblioteca: Library,
  anatomia: Bone,
  cto: GraduationCap,
  cb: Microscope,
};

function formatDuracion(dias: number): string {
  if (dias >= 360) return '1 año';
  if (dias >= 180) return '6 meses';
  if (dias === 90) return '3 meses';
  if (dias === 60) return '2 meses';
  if (dias === 30) return '30 días';
  if (dias === 15) return '15 días';
  if (dias === 7) return '1 semana';
  return `${dias} días`;
}

function chipColor(etiqueta: string): string {
  const e = etiqueta.toLowerCase();
  if (e === 'nuevo') return 'bg-green-50 text-correct ring-1 ring-correct/20';
  if (e === 'oferta') return 'bg-red-50 text-wrong ring-1 ring-wrong/20';
  if (e === 'destacado') return 'bg-amber-50 text-warning ring-1 ring-warning/20';
  return 'bg-jungle-900/85 text-lime-400 ring-1 ring-lime-400/30 backdrop-blur'; // Premium y otras
}

/** Destellos de 4 puntas que titilan sobre la ilustración (mismo lenguaje que las imágenes). */
function Destellos() {
  const stars = [
    { top: '16%', left: '58%', size: 14, delay: '0s' },
    { top: '62%', left: '86%', size: 10, delay: '0.8s' },
    { top: '30%', left: '12%', size: 8, delay: '1.6s' },
  ];
  return (
    <>
      {stars.map((s, i) => (
        <svg
          key={i}
          viewBox="0 0 24 24"
          className="pointer-events-none absolute animate-twinkle text-lime-400 drop-shadow-[0_0_6px_rgba(194,228,118,0.8)]"
          style={{ top: s.top, left: s.left, width: s.size, height: s.size, animationDelay: s.delay }}
          aria-hidden
        >
          <path d="M12 0 C12.8 8 16 11.2 24 12 C16 12.8 12.8 16 12 24 C11.2 16 8 12.8 0 12 C8 11.2 11.2 8 12 0Z" fill="currentColor" />
        </svg>
      ))}
    </>
  );
}

export interface PlataformaCardData {
  slug: string;
  nombre: string;
  descripcion: string;
  precio: number;
  duracion_dias: number;
  /** Si está, este es el precio "actual" y `precio` el original tachado. */
  precio_promocional?: number;
  /** Etiqueta: "Nuevo", "Premium", "Oferta", "Destacado". */
  etiqueta?: string;
  /** Orden de aparición (menor = primero). */
  orden?: number;
}

export function PlataformaCard({ data }: { data: PlataformaCardData }) {
  const Icon = ICONS[data.slug] ?? Stethoscope;
  const [imgFailed, setImgFailed] = useState(false);
  const imgSrc = `/images/plataformas/${data.slug}.webp`;

  const hayPromo =
    typeof data.precio_promocional === 'number' &&
    data.precio_promocional > 0 &&
    data.precio_promocional < data.precio;
  const precioMostrado = hayPromo ? data.precio_promocional! : data.precio;

  return (
    <article className="group card flex flex-col p-4 transition-[border-color,box-shadow] duration-200 hover:border-jungle-600/40 hover:shadow-card-hover">
      <Link
        to={`/plataforma/${data.slug}`}
        className="relative block aspect-[16/9] overflow-hidden rounded-xl bg-jungle-900"
        tabIndex={-1}
        aria-hidden
      >
        {!imgFailed ? (
          <img
            src={imgSrc}
            alt=""
            className="h-full w-full object-cover transition-transform duration-700 ease-expo group-hover:scale-[1.04]"
            loading="lazy"
            onError={() => setImgFailed(true)}
          />
        ) : (
          <div className="grid h-full place-items-center">
            <Icon className="h-12 w-12 text-lime-400" aria-hidden />
          </div>
        )}
        <Destellos />
        {/* Brillo que cruza la imagen al pasar el mouse */}
        <span className="pointer-events-none absolute inset-y-0 -left-1/2 w-1/3 -skew-x-12 bg-gradient-to-r from-transparent via-white/15 to-transparent transition-transform duration-1000 ease-expo group-hover:translate-x-[420%]" />
        {data.etiqueta && (
          <span className={`chip absolute right-3 top-3 uppercase tracking-wider text-[10.5px] ${chipColor(data.etiqueta)}`}>
            {data.etiqueta}
          </span>
        )}
      </Link>

      <div className="flex flex-1 flex-col px-1 pb-1 pt-5">
        <h3 className="text-xl">{data.nombre}</h3>
        <p className="mt-2 line-clamp-3 flex-1 text-[14.5px] leading-relaxed text-muted">{data.descripcion}</p>

        <div className="mt-5 flex flex-wrap items-baseline gap-x-2 gap-y-1 border-t border-line pt-4">
          {data.slug === 'anatomia' ? (
            <>
              <span className="text-sm text-muted">Desde</span>
              <span className="tabular font-display text-[28px] font-bold text-ink">S/ 30</span>
              <span className="text-sm text-muted">/ segmento</span>
            </>
          ) : (
            <>
              {hayPromo && (
                <span className="tabular text-base text-subtle line-through decoration-wrong/60">S/ {data.precio}</span>
              )}
              <span className="tabular font-display text-[28px] font-bold text-ink">S/ {precioMostrado}</span>
              <span className="text-sm text-muted">/ {formatDuracion(data.duracion_dias)}</span>
            </>
          )}
        </div>

        <div className="mt-4 grid grid-cols-[1fr_auto] items-center gap-3">
          <Link to={`/compra/${data.slug}`} className="btn-primary w-full">Comprar acceso</Link>
          <Link
            to={`/plataforma/${data.slug}`}
            className="inline-flex min-h-[44px] items-center gap-1 px-2 text-[14px] font-semibold text-jungle-600 hover:text-jungle-800"
          >
            Detalles <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" aria-hidden />
          </Link>
        </div>
      </div>
    </article>
  );
}
