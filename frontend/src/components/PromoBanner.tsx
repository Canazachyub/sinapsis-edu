import { ArrowRight } from 'lucide-react';
import { WHATSAPP } from '@/config/pago';

export function PromoBanner() {
  const href = `https://wa.me/${WHATSAPP.numero}?text=${encodeURIComponent('Hola, vi la promoción de SINAPSIS EDU y quiero más info')}`;
  return (
    <div className="relative z-50 bg-jungle-800 text-white">
      <div className="container-x flex min-h-[40px] flex-wrap items-center justify-center gap-x-4 gap-y-1 py-2 text-[13.5px]">
        <span className="text-white/85">
          <span className="font-semibold text-lime-400">Promoción de lanzamiento:</span> accesos desde{' '}
          <span className="font-semibold text-white">S/ 39</span>
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
