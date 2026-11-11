import { Link } from 'react-router-dom';
import { Clock, Mail, MapPin, MessageCircle, Phone } from 'lucide-react';
import { ScrollLink } from './ScrollLink';
import { CONTACTO, WHATSAPP } from '@/config/pago';

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
  { label: 'Videoclases', to: 'videoclases' },
  { label: 'Cómo funciona', to: 'como-funciona' },
  { label: 'Programa de estudios', to: 'programa' },
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
            <div className="mt-2 text-sm text-white/80">Yape · Binance (USDT) · Transferencia BCP</div>
          </div>
        </div>

        <div className="lg:col-span-2">
          <div className="text-sm font-semibold text-white">Plataformas</div>
          <ul className="mt-4 space-y-2.5 text-sm">
            {FOOTER_PLATAFORMAS.map((p) => (
              <li key={p.slug}>
                <Link to={`/plataforma/${p.slug}`} className="transition-colors hover:text-lime-400">{p.label}</Link>
              </li>
            ))}
          </ul>
        </div>

        <div className="lg:col-span-2">
          <div className="text-sm font-semibold text-white">SINAPSIS EDU</div>
          <ul className="mt-4 space-y-2.5 text-sm">
            {FOOTER_SECCIONES.map((s) => (
              <li key={s.to}>
                <ScrollLink to={s.to} className="cursor-pointer transition-colors hover:text-lime-400">{s.label}</ScrollLink>
              </li>
            ))}
            <li>
              <Link to="/login" className="transition-colors hover:text-lime-400">Ingresar</Link>
            </li>
          </ul>
        </div>

        <div className="lg:col-span-4">
          <div className="text-sm font-semibold text-white">Contacto</div>
          <ul className="mt-4 space-y-3 text-sm">
            <li className="flex items-start gap-2.5">
              <MessageCircle className="mt-0.5 h-4 w-4 shrink-0 text-whatsapp" aria-hidden />
              <a href={`https://wa.me/${WHATSAPP.numero}`} target="_blank" rel="noreferrer" className="hover:text-lime-400">
                WhatsApp: {WHATSAPP.display}
              </a>
            </li>
            <li className="flex items-start gap-2.5">
              <Phone className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
              <a href={`tel:+${WHATSAPP.numeroAlternativo}`} className="hover:text-lime-400">{WHATSAPP.displayAlternativo}</a>
            </li>
            <li className="flex items-start gap-2.5">
              <Mail className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
              <a href={`mailto:${CONTACTO.email}`} className="break-all hover:text-lime-400">{CONTACTO.email}</a>
            </li>
            <li className="flex items-start gap-2.5">
              <Clock className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
              <span>{CONTACTO.horario}</span>
            </li>
            <li className="flex items-start gap-2.5">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
              <span>{CONTACTO.direccion}</span>
            </li>
          </ul>
        </div>
      </div>
      <div className="border-t border-white/10">
        <div className="container-x flex flex-wrap justify-between gap-2 py-5 text-xs text-white/45">
          <span>© {new Date().getFullYear()} SINAPSIS EDU · sinapsisedu.com</span>
          <span>Hecho en Tacna, Perú</span>
        </div>
      </div>
    </footer>
  );
}
