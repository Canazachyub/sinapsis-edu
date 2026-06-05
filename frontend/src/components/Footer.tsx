import { Link } from 'react-router-dom';
import { Phone, Mail, MapPin, Clock, MessageCircle } from 'lucide-react';

const FOOTER_PLATAFORMAS: Array<{ label: string; slug: string }> = [
  { label: 'Banco ENAM', slug: 'enam' },
  { label: 'Banco ENCIB', slug: 'encib' },
  { label: 'Banco ENCAPS', slug: 'encaps' },
  { label: 'Residentado Médico', slug: 'rm' },
  { label: 'Banco EsSalud', slug: 'essalud' },
  { label: 'Biblioteca Médica', slug: 'biblioteca' },
];

export function Footer() {
  return (
    <footer id="contacto" className="bg-jungle text-cream">
      <div className="container-x py-14 grid gap-10 md:grid-cols-4">
        <div className="md:col-span-2">
          <img
            src="/images/logo/logo-blanco.png"
            alt="SINAPSIS EDU"
            className="h-10 w-auto"
            loading="lazy"
          />
          <p className="mt-4 text-sm opacity-80 max-w-md leading-relaxed">
            La sinapsis entre tu esfuerzo y tu examen.
            Bancos de preguntas, simulacros y videoclases para
            ENAM, ENCIB, ENCAPS, Residentado Médico, EsSalud y más.
          </p>
        </div>

        <div>
          <div className="font-semibold mb-3 text-lime">Plataformas</div>
          <ul className="space-y-2 text-sm opacity-80">
            {FOOTER_PLATAFORMAS.map((p) => (
              <li key={p.slug}>
                <Link to={`/plataforma/${p.slug}`} className="hover:text-lime transition-colors">
                  {p.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <div className="font-semibold mb-3 text-lime">Contacto</div>
          <ul className="space-y-3 text-sm opacity-80">
            <li className="flex items-start gap-2">
              <MessageCircle className="w-4 h-4 mt-0.5 shrink-0 text-whatsapp" />
              <a
                href="https://wa.me/51974707622"
                target="_blank"
                rel="noreferrer"
                className="hover:text-lime"
              >
                WhatsApp: +51 974 707 622
              </a>
            </li>
            <li className="flex items-start gap-2">
              <Phone className="w-4 h-4 mt-0.5 shrink-0" />
              <a href="tel:+51921647291" className="hover:text-lime">+51 921 647 291</a>
            </li>
            <li className="flex items-start gap-2">
              <Mail className="w-4 h-4 mt-0.5 shrink-0" />
              <a href="mailto:sinapsistartup@auladigitalpe.com" className="hover:text-lime break-all">
                sinapsistartup@auladigitalpe.com
              </a>
            </li>
            <li className="flex items-start gap-2">
              <Clock className="w-4 h-4 mt-0.5 shrink-0" />
              <span>Lun a Sáb · 7:30 – 18:00</span>
            </li>
            <li className="flex items-start gap-2">
              <MapPin className="w-4 h-4 mt-0.5 shrink-0" />
              <span>Tacna, Perú</span>
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="container-x py-4 text-xs opacity-60 flex flex-wrap gap-2 justify-between">
          <span>© {new Date().getFullYear()} SINAPSIS EDU · sinapsisedu.com</span>
          <span>Hecho con ☕ en Tacna</span>
        </div>
      </div>
    </footer>
  );
}
