import { Link } from 'react-router-dom';
import { ArrowRight, Zap } from 'lucide-react';
import { WHATSAPP } from '@/config/pago';
import { useCampana, useCuentaRegresiva } from '@/hooks/useCampana';

const dos = (n: number) => String(n).padStart(2, '0');

function Reloj({ fin }: { fin: string }) {
  const t = useCuentaRegresiva(fin);
  if (t.terminado) return null;
  const bloques = [
    ...(t.d > 0 ? [{ v: String(t.d), l: 'd' }] : []),
    { v: dos(t.h), l: 'h' },
    { v: dos(t.m), l: 'm' },
    { v: dos(t.s), l: 's' },
  ];
  return (
    <span className="inline-flex items-center gap-1" aria-label="Tiempo restante de la oferta">
      {bloques.map((b) => (
        <span key={b.l} className="tabular rounded-md bg-white/10 px-1.5 py-0.5 font-semibold text-white">
          {b.v}<span className="text-white/60">{b.l}</span>
        </span>
      ))}
    </span>
  );
}

export function PromoBanner() {
  const campana = useCampana();

  if (campana) {
    return (
      <div className="relative z-50 bg-gradient-to-r from-ink via-jungle-900 to-ink text-white">
        <div className="container-x flex min-h-[44px] flex-wrap items-center justify-center gap-x-4 gap-y-1.5 py-2 text-[13.5px]">
          <span className="inline-flex items-center gap-2">
            <Zap className="h-4 w-4 fill-lime-400 text-lime-400" aria-hidden />
            <span className="font-display font-extrabold uppercase tracking-wider text-lime-400">{campana.nombre}</span>
            <span className="rounded-full bg-lime-400 px-2 py-0.5 text-[12px] font-extrabold text-ink">
              -{campana.descuento_pct}%
            </span>
          </span>
          {campana.mensaje && <span className="hidden text-white/80 sm:inline">{campana.mensaje}</span>}
          <span className="inline-flex items-center gap-2 text-white/70">
            Termina en <Reloj fin={campana.fin} />
          </span>
          <Link
            to="/"
            state={{ scrollTo: 'plataformas' }}
            className="inline-flex items-center gap-1 font-semibold text-white underline decoration-lime-400/50 underline-offset-4 hover:decoration-lime-400"
          >
            Aprovechar <ArrowRight className="h-3.5 w-3.5" aria-hidden />
          </Link>
        </div>
      </div>
    );
  }

  const href = `https://wa.me/${WHATSAPP.numero}?text=${encodeURIComponent('Hola, vi la promoción de SINAPSIS EDU y quiero más info')}`;
  return (
    <div className="relative z-50 bg-jungle-800 text-white">
      <div className="container-x flex min-h-[40px] flex-wrap items-center justify-center gap-x-4 gap-y-1 py-2 text-[13.5px]">
        <span className="text-white/85">
          <span className="font-semibold text-lime-400">Promoción de lanzamiento:</span> accesos desde{' '}
          <span className="font-semibold text-white">S/ 30</span>
        </span>
        <a
          href={href}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1 font-semibold text-white underline decoration-white/30 underline-offset-4 hover:decoration-lime-400"
        >
          Escríbenos por WhatsApp <ArrowRight className="h-3.5 w-3.5" aria-hidden />
        </a>
      </div>
    </div>
  );
}
