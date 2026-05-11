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

export interface PlataformaCardData {
  slug: string;
  nombre: string;
  descripcion: string;
  precio: number;
  duracion_dias: number;
}

export function PlataformaCard({ data }: { data: PlataformaCardData }) {
  const Icon = ICONS[data.slug] ?? Stethoscope;
  const [imgFailed, setImgFailed] = useState(false);
  const imgSrc = `/images/plataformas/${data.slug}.png`;

  return (
    <article
      className="bg-white rounded-[20px] border border-jungle/10 p-6 shadow-card
                 transition-all duration-200 hover:-translate-y-1.5 hover:shadow-card-hover hover:border-lime-dark
                 flex flex-col"
    >
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
      <h3 className="mt-5 text-2xl">{data.nombre}</h3>
      <p className="mt-2 text-sm text-jungle-light leading-relaxed line-clamp-3 flex-1">
        {data.descripcion}
      </p>
      <div className="my-5 border-t border-jungle/10" />
      <div className="flex items-baseline gap-2">
        <span className="text-3xl font-bold text-jungle">S/ {data.precio}</span>
        <span className="text-sm text-jungle-light">/ {formatDuracion(data.duracion_dias)}</span>
      </div>
      <div className="mt-5 flex flex-col gap-2">
        <Link to={`/compra/${data.slug}`} className="btn-primary w-full">Comprar acceso</Link>
        <Link
          to={`/plataforma/${data.slug}`}
          className="text-sm text-jungle-light hover:text-jungle text-center underline-offset-4 hover:underline"
        >
          Ver detalles
        </Link>
      </div>
    </article>
  );
}
