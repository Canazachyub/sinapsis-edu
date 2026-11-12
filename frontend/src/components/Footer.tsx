import { Link } from 'react-router-dom';
import { BookOpen, Clock, Mail, MapPin, MessageCircle, Phone } from 'lucide-react';
import { ScrollLink } from './ScrollLink';
import { CONTACTO, WHATSAPP } from '@/config/pago';
import { EMPRESA } from '@/config/empresa';

const FOOTER_PLATAFORMAS: Array<{ label: string; slug: string }> = [
  { label: 'Banco ENAM', slug: 'enam' },
  { label: 'Banco ENCIB', slug: 'encib' },
  { label: 'Banco ENCAPS', slug: 'encaps' },
  { label: 'Residentado Médico', slug: 'rm' },
  { label: 'Banco EsSalud', slug: 'essalud' },
  { label: 'Biblioteca Médica', slug: 'biblioteca' },
];

const FOOTER_SECCIONES: Array<{ label: string; to: string }> = [
  { label: 'Banqueo', to: 'banqueo' },
  { label: 'Plataformas', to: 'plataformas' },
  { label: 'Cómo funciona', to: 'como-funciona' },
  { label: 'Quiénes somos', to: 'nosotros' },
  { label: 'Preguntas frecuentes', to: 'faq' },
];

export function Footer() {
  return (
    <footer id="contacto" className="border-t border-white/10 bg-jungle-900 text-white/70">
      <div className="container-x grid gap-12 py-16 md:grid-cols-2 lg:grid-cols-12">
        <div className="lg:col-span-4">
          <img src="/images/logo/logo-blanco-transparente.png" alt="SINAPSIS EDU" className="h-10 w-auto" loading="lazy" />
          <p className="mt-5 max-w-sm text-[15px] leading-relaxed">
            Banqueo, simulacros y videoclases para ENAM, ENCIB, ENCAPS, Residentado Médico, EsSalud y más.
          </p>
          <div className="mt-6">
            <div className="text-xs font-semibold uppercase tracking-[0.12em] text-white/40">Medios de pago</div>
            <div className="mt-2 text-sm text-white/80">Yape · Tarjeta (Mercado Pago) · Binance (USDT) · Transferencia BCP</div>
          </div>
        </div>

        <div className="lg:col-span-2">
          <div className="text-sm font-semibold text-white">Plataformas</div>
          <ul className="mt-3 text-sm md:mt-4 md:space-y-1">
            {FOOTER_PLATAFORMAS.map((p) => (
              <li key={p.slug}>
                <Link to={`/plataforma/${p.slug}`} className="inline-flex min-h-[44px] items-center transition-colors hover:text-lime-400 md:min-h-0 md:py-1">{p.label}</Link>
              </li>
            ))}
          </ul>
        </div>

        <div className="lg:col-span-2">
          <div className="text-sm font-semibold text-white">SINAPSIS EDU</div>
          <ul className="mt-3 text-sm md:mt-4 md:space-y-1">
            {FOOTER_SECCIONES.map((s) => (
              <li key={s.to}>
                <ScrollLink to={s.to} className="inline-flex min-h-[44px] cursor-pointer items-center transition-colors hover:text-lime-400 md:min-h-0 md:py-1">{s.label}</ScrollLink>
              </li>
            ))}
            <li>
              <Link to="/login" className="inline-flex min-h-[44px] items-center transition-colors hover:text-lime-400 md:min-h-0 md:py-1">Ingresar</Link>
            </li>
          </ul>
        </div>

        <div className="lg:col-span-4">
          <div className="text-sm font-semibold text-white">Contacto</div>
          <ul className="mt-3 space-y-1 text-sm md:mt-4 md:space-y-3">
            <li className="flex items-center gap-2.5 md:items-start">
              <MessageCircle className="h-4 w-4 md:mt-0.5 shrink-0 text-whatsapp" aria-hidden />
              <a href={`https://wa.me/${WHATSAPP.numero}`} target="_blank" rel="noreferrer" className="inline-flex min-h-[44px] items-center hover:text-lime-400 md:min-h-0">
                WhatsApp: {WHATSAPP.display}
              </a>
            </li>
            <li className="flex items-center gap-2.5 md:items-start">
              <Phone className="h-4 w-4 md:mt-0.5 shrink-0" aria-hidden />
              <a href={`tel:+${WHATSAPP.numero}`} className="inline-flex min-h-[44px] items-center hover:text-lime-400 md:min-h-0">Llamar: {WHATSAPP.display}</a>
            </li>
            <li className="flex items-center gap-2.5 md:items-start">
              <Mail className="h-4 w-4 md:mt-0.5 shrink-0" aria-hidden />
              <a href={`mailto:${CONTACTO.email}`} className="inline-flex min-h-[44px] items-center break-all hover:text-lime-400 md:min-h-0">{CONTACTO.email}</a>
            </li>
            <li className="flex items-center gap-2.5 md:items-start">
              <Clock className="h-4 w-4 md:mt-0.5 shrink-0" aria-hidden />
              <span>{CONTACTO.horario}</span>
            </li>
            <li className="flex items-center gap-2.5 md:items-start">
              <MapPin className="h-4 w-4 md:mt-0.5 shrink-0" aria-hidden />
              <span>{CONTACTO.direccion}</span>
            </li>
          </ul>
        </div>
      </div>
      <div className="border-t border-white/10">
        <div className="container-x flex flex-col gap-4 py-5 text-xs text-white/45 md:flex-row md:items-center md:justify-between">
          <nav aria-label="Legal" className="flex flex-wrap gap-x-5 md:gap-y-2">
            <Link to="/terminos" className="inline-flex min-h-[44px] items-center transition-colors hover:text-lime-400 md:min-h-0 md:py-1">Términos y Condiciones</Link>
            <Link to="/privacidad" className="inline-flex min-h-[44px] items-center transition-colors hover:text-lime-400 md:min-h-0 md:py-1">Política de Privacidad</Link>
            <Link to="/libro-de-reclamaciones" className="inline-flex min-h-[44px] items-center gap-1.5 transition-colors hover:text-lime-400 md:min-h-0 md:py-1">
              <BookOpen className="h-3.5 w-3.5" aria-hidden /> Libro de Reclamaciones
            </Link>
          </nav>
          <span>
            © {new Date().getFullYear()} {EMPRESA.nombreComercial}
          </span>
        </div>
      </div>
    </footer>
  );
}
