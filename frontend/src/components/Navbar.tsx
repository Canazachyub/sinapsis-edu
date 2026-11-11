import { useEffect, useState } from 'react';
import { simulacroHref } from '@/config';
import { Link } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import { ScrollLink } from './ScrollLink';

const LINKS: Array<{ to: string; label: string }> = [
  { to: 'banqueo', label: 'Banqueo' },
  { to: 'videoclases', label: 'Videoclases' },
  { to: 'plataformas', label: 'Plataformas' },
  { to: 'como-funciona', label: 'Cómo funciona' },
  { to: 'faq', label: 'FAQ' },
];

interface Props {
  /** Transparente sobre un hero oscuro; se vuelve blanca al hacer scroll. */
  overlay?: boolean;
}

export function Navbar({ overlay = false }: Props) {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    if (!overlay) return;
    const onScroll = () => setScrolled(window.scrollY > 64);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [overlay]);

  useEffect(() => {
    const onResize = () => window.innerWidth >= 1024 && setOpen(false);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  const dark = overlay && !scrolled;

  return (
    <header
      className={`sticky top-0 z-40 transition-colors duration-300 ${
        dark ? 'bg-transparent' : 'bg-white/95 backdrop-blur border-b border-line'
      } ${overlay ? '-mb-[72px]' : ''}`}
    >
      <nav className="container-x flex h-[72px] items-center justify-between gap-6">
        <Link to="/" className="flex shrink-0 items-center" onClick={() => setOpen(false)}>
          <img
            src={dark ? '/images/logo/logo-blanco-transparente.png' : '/images/logo/logo.png'}
            alt="SINAPSIS EDU"
            className="h-9 w-auto"
            loading="eager"
          />
        </Link>

        <div className={`hidden items-center gap-7 text-[15px] font-medium lg:flex ${dark ? 'text-white/80' : 'text-muted'}`}>
          {LINKS.map((l) => (
            <ScrollLink
              key={l.to}
              to={l.to}
              className={`cursor-pointer transition-colors ${dark ? 'hover:text-white' : 'hover:text-ink'}`}
            >
              {l.label}
            </ScrollLink>
          ))}
        </div>

        <div className="hidden items-center gap-5 lg:flex">
          <a
            href={simulacroHref()!}
            className={`text-[15px] font-semibold transition-colors ${dark ? 'text-white hover:text-lime-400' : 'text-ink hover:text-jungle-600'}`}
          >
            Simulacros
          </a>
          <Link
            to="/login"
            className={`text-[15px] font-semibold transition-colors ${dark ? 'text-white hover:text-lime-400' : 'text-ink hover:text-jungle-600'}`}
          >
            Ingresar
          </Link>
          <ScrollLink
            to="plataformas"
            className={`cursor-pointer !min-h-[40px] !py-2 ${dark ? 'btn bg-white text-jungle-900 hover:bg-lime-400' : 'btn-primary'}`}
          >
            Ver plataformas
          </ScrollLink>
        </div>

        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-label={open ? 'Cerrar menú' : 'Abrir menú'}
          aria-expanded={open}
          className={`grid h-11 w-11 place-items-center rounded-xl lg:hidden ${
            dark ? 'text-white hover:bg-white/10' : 'text-ink hover:bg-paper'
          }`}
        >
          {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </nav>

      {/* Menú móvil a pantalla completa */}
      <div
        className={`fixed inset-0 top-0 z-50 flex flex-col bg-white transition-opacity duration-300 ease-expo lg:hidden ${
          open ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0'
        }`}
        aria-hidden={!open}
      >
        <div className="container-x flex h-[72px] items-center justify-between border-b border-line">
          <img src="/images/logo/logo.png" alt="SINAPSIS EDU" className="h-9 w-auto" />
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label="Cerrar menú"
            className="grid h-11 w-11 place-items-center rounded-xl text-ink hover:bg-paper"
          >
            <X className="h-6 w-6" />
          </button>
        </div>
        <div className="container-x flex flex-1 flex-col py-6" onClick={() => setOpen(false)}>
          {LINKS.map((l, i) => (
            <ScrollLink
              key={l.to}
              to={l.to}
              className={`cursor-pointer border-b border-line py-4 font-display text-2xl font-bold text-ink transition-all duration-500 ease-expo ${
                open ? 'translate-y-0 opacity-100' : 'translate-y-3 opacity-0'
              }`}
            >
              <span style={{ transitionDelay: open ? `${80 + i * 50}ms` : '0ms' }}>{l.label}</span>
            </ScrollLink>
          ))}
          <a href={simulacroHref()!} className="border-b border-line py-4 font-display text-2xl font-bold text-ink">
            Simulacros
          </a>
          <div className="mt-auto grid grid-cols-2 gap-3 pt-6">
            <Link to="/login" className="btn-secondary w-full">Ingresar</Link>
            <ScrollLink to="plataformas" className="btn-primary w-full cursor-pointer">Ver plataformas</ScrollLink>
          </div>
        </div>
      </div>
    </header>
  );
}
