import { Sparkles, MessageCircle } from 'lucide-react';
import { WHATSAPP } from '@/config/pago';

export function PromoBanner() {
  return (
    <div className="bg-gradient-to-r from-jungle-dark via-jungle to-jungle-dark text-cream relative overflow-hidden">
      <div className="container-x py-2.5 flex items-center justify-center gap-3 text-sm flex-wrap">
        <Sparkles className="w-4 h-4 text-lime shrink-0" aria-hidden />
        <span className="text-center">
          <strong className="text-lime">Promoción de lanzamiento:</strong> accesos desde
          <strong className="text-lime"> S/ 39</strong>. Coordina por WhatsApp y te ayudamos.
        </span>
        <a
          href={`https://wa.me/${WHATSAPP.numero}?text=${encodeURIComponent('Hola, vi la promoción de SINAPSIS EDU y quiero más info')}`}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-lime text-jungle font-semibold text-xs hover:scale-[1.03] transition shrink-0"
        >
          <MessageCircle className="w-3.5 h-3.5" /> Quiero info
        </a>
      </div>
    </div>
  );
}
