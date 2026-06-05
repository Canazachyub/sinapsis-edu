import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
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
};

function formatDuracion(dias: number): string {
  if (dias >= 360) return '1 año';
  if (dias >= 180) return '6 meses';
  if (dias === 90) return '3 meses';
  if (dias === 60) return '2 meses';
  if (dias === 30) return '1 mes';
  if (dias === 15) return '15 días';
  if (dias === 7) return '1 semana';
  return `${dias} días`;
}

function ribbonColor(etiqueta: string): string {
  const e = etiqueta.toLowerCase();
  if (e === 'premium') return 'bg-purple text-white';
  if (e === 'nuevo') return 'bg-success text-white';
  if (e === 'oferta') return 'bg-danger text-white';
  if (e === 'destacado') return 'bg-warning text-jungle';
  return 'bg-jungle text-lime';
}

export interface PlataformaCardData {
  slug: string;
  nombre: string;
  descripcion: string;
  precio: number;
  duracion_dias: number;
  /** Si está, este es el precio "actual" y `precio` el original tachado. */
  precio_promocional?: number;
  /** Ribbon: "Nuevo", "Premium", "Oferta", "Destacado". */
  etiqueta?: string;
  /** Orden de aparición (menor = primero). */
  orden?: number;
}

export function PlataformaCard({ data }: { data: PlataformaCardData }) {
  const Icon = ICONS[data.slug] ?? Stethoscope;
  const [imgFailed, setImgFailed] = useState(false);
  const imgSrc = `/images/plataformas/${data.slug}.png`;

  const hayPromo =
    typeof data.precio_promocional === 'number' &&
    data.precio_promocional > 0 &&
    data.precio_promocional < data.precio;
  const precioMostrado = hayPromo ? data.precio_promocional! : data.precio;

  return (
    <article
      className="relative bg-white rounded-[20px] border border-jungle/10 p-5 sm:p-6 shadow-card
                 transition-all duration-200 hover:-translate-y-1.5 hover:shadow-card-hover hover:border-lime-dark
                 flex flex-col"
    >
      {data.etiqueta && (
        <span
          className={`absolute top-4 right-4 z-10 px-3 py-1 rounded-full text-[11px] font-semibold uppercase tracking-wider shadow-md ${ribbonColor(data.etiqueta)}`}
        >
          {data.etiqueta}
        </span>
      )}

      <div className="aspect-[16/9] rounded-xl overflow-hidden bg-gradient-to-br from-jungle to-jungle-light
                      flex items-center justify-center">
        {!imgFailed ? (
          <img
            src={imgSrc}
            alt={data.nombre}
            className="w-full h-full object-cover"
            loading="lazy"
            onError={() => setImgFailed(true)}
          />
        ) : (
          <Icon className="w-12 h-12 text-lime" aria-hidden />
        )}
      </div>

      <h3 className="mt-5 text-xl sm:text-2xl">{data.nombre}</h3>
      <p className="mt-2 text-sm text-jungle-light leading-relaxed line-clamp-3 flex-1">
        {data.descripcion}
      </p>

      <div className="my-4 sm:my-5 border-t border-jungle/10" />

      <div className="flex items-baseline gap-2 flex-wrap">
        {data.slug === 'anatomia' ? (
          <>
            <span className="text-sm text-jungle-light">Desde</span>
            <span className="text-3xl font-bold text-jungle">S/ 30</span>
            <span className="text-sm text-jungle-light">/ segmento</span>
          </>
        ) : (
          <>
            {hayPromo && (
              <span className="text-base text-jungle-light line-through decoration-danger/70">
                S/ {data.precio}
              </span>
            )}
            <span className="text-3xl font-bold text-jungle">S/ {precioMostrado}</span>
            <span className="text-sm text-jungle-light">/ {formatDuracion(data.duracion_dias)}</span>
          </>
        )}
      </div>

      <div className="mt-5 flex flex-col gap-2">
        <Link to={`/compra/${data.slug}`} className="btn-primary w-full">Comprar acceso</Link>
        <Link to={`/plataforma/${data.slug}`} className="btn-ghost w-full justify-center">
          Ver detalles
        </Link>
      </div>
    </article>
  );
}
