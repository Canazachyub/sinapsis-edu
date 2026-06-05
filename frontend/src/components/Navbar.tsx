import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import { ScrollLink } from './ScrollLink';

export function Navbar() {
  const [open, setOpen] = useState(false);

  // Cerrar al cambiar de viewport a desktop.
  useEffect(() => {
    function handleResize() {
      if (window.innerWidth >= 768) setOpen(false);
    }
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Bloquear scroll del body cuando el menu esta abierto.
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
      return () => { document.body.style.overflow = ''; };
    }
    return;
  }, [open]);

  return (
    <header className="sticky top-0 z-40 backdrop-blur bg-offwhite/90 border-b border-jungle/5">
      <nav className="container-x flex items-center justify-between h-16">
        <Link to="/" className="flex items-center gap-3" onClick={() => setOpen(false)}>
          <img
            src="/images/logo/logo.png"
            alt="SINAPSIS EDU"
            className="h-8 md:h-9 w-auto"
            loading="eager"
          />
        </Link>

        {/* Desktop links */}
        <div className="hidden md:flex items-center gap-5 lg:gap-6 text-sm font-medium text-jungle/80">
          <ScrollLink to="plataformas" className="hover:text-jungle cursor-pointer">Plataformas</ScrollLink>
          <ScrollLink to="programa" className="hover:text-jungle cursor-pointer">Programa</ScrollLink>
          <ScrollLink to="beneficios" className="hover:text-jungle cursor-pointer">Beneficios</ScrollLink>
          <ScrollLink to="cursos" className="hover:text-jungle cursor-pointer">Cursos</ScrollLink>
          <ScrollLink to="nosotros" className="hover:text-jungle cursor-pointer">Nosotros</ScrollLink>
          <ScrollLink to="faq" className="hover:text-jungle cursor-pointer">FAQ</ScrollLink>
          <ScrollLink to="contacto" className="hover:text-jungle cursor-pointer">Contacto</ScrollLink>
        </div>

        {/* Desktop buttons */}
        <div className="hidden md:flex items-center gap-3">
          <Link to="/login" className="btn-ghost !py-2 !px-4 text-sm">Login</Link>
          <ScrollLink to="plataformas" className="btn-primary !py-2 !px-4 text-sm cursor-pointer">
            Empezar ahora
          </ScrollLink>
        </div>

        {/* Mobile: hamburger */}
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-label={open ? 'Cerrar menú' : 'Abrir menú'}
          aria-expanded={open}
          className="md:hidden inline-flex items-center justify-center w-10 h-10 rounded-lg text-jungle hover:bg-jungle/5"
        >
          {open ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </nav>

      {/* Mobile drawer */}
      {open && (
        <>
          {/* Backdrop */}
          <div
            className="md:hidden fixed inset-0 top-16 bg-jungle/30 backdrop-blur-sm z-30"
            onClick={() => setOpen(false)}
            aria-hidden
          />
          {/* Panel */}
          <div
            className="md:hidden fixed left-0 right-0 top-16 bg-offwhite border-b border-jungle/10 shadow-card-hover z-40 max-h-[calc(100vh-4rem)] overflow-y-auto"
            onClick={() => setOpen(false)}
          >
            <div className="container-x py-6 flex flex-col gap-1">
              <ScrollLink to="plataformas" className="py-3 px-2 rounded-lg text-jungle font-medium hover:bg-jungle/5 cursor-pointer">
                Plataformas
              </ScrollLink>
              <ScrollLink to="programa" className="py-3 px-2 rounded-lg text-jungle font-medium hover:bg-jungle/5 cursor-pointer">
                Programa
              </ScrollLink>
              <ScrollLink to="beneficios" className="py-3 px-2 rounded-lg text-jungle font-medium hover:bg-jungle/5 cursor-pointer">
                Beneficios
              </ScrollLink>
              <ScrollLink to="cursos" className="py-3 px-2 rounded-lg text-jungle font-medium hover:bg-jungle/5 cursor-pointer">
                Cursos
              </ScrollLink>
              <ScrollLink to="nosotros" className="py-3 px-2 rounded-lg text-jungle font-medium hover:bg-jungle/5 cursor-pointer">
                Nosotros
              </ScrollLink>
              <ScrollLink to="faq" className="py-3 px-2 rounded-lg text-jungle font-medium hover:bg-jungle/5 cursor-pointer">
                FAQ
              </ScrollLink>
              <ScrollLink to="contacto" className="py-3 px-2 rounded-lg text-jungle font-medium hover:bg-jungle/5 cursor-pointer">
                Contacto
              </ScrollLink>

              <div className="mt-4 grid grid-cols-2 gap-3">
                <Link to="/login" className="btn-ghost w-full justify-center">Login</Link>
                <ScrollLink to="plataformas" className="btn-primary w-full justify-center cursor-pointer">
                  Empezar
                </ScrollLink>
              </div>
            </div>
          </div>
        </>
      )}
    </header>
  );
}
