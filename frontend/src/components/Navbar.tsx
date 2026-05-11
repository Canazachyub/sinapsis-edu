import { Link } from 'react-router-dom';
import { ScrollLink } from './ScrollLink';

export function Navbar() {
  return (
    <header className="sticky top-0 z-40 backdrop-blur bg-offwhite/80 border-b border-jungle/5">
      <nav className="container-x flex items-center justify-between h-16">
        <Link to="/" className="flex items-center gap-3">
          <img
            src="/images/logo/logo.png"
            alt="SINAPSIS EDU"
            className="h-9 w-auto"
            loading="eager"
          />
        </Link>
        <div className="hidden md:flex items-center gap-8 text-sm font-medium text-jungle/80">
          <ScrollLink to="plataformas" className="hover:text-jungle cursor-pointer">Plataformas</ScrollLink>
          <ScrollLink to="beneficios" className="hover:text-jungle cursor-pointer">Beneficios</ScrollLink>
          <ScrollLink to="cursos" className="hover:text-jungle cursor-pointer">Cursos</ScrollLink>
          <ScrollLink to="nosotros" className="hover:text-jungle cursor-pointer">Nosotros</ScrollLink>
          <ScrollLink to="contacto" className="hover:text-jungle cursor-pointer">Contacto</ScrollLink>
        </div>
        <div className="flex items-center gap-3">
          <Link to="/login" className="btn-ghost !py-2 !px-4 text-sm">Login</Link>
          <ScrollLink to="plataformas" className="btn-primary !py-2 !px-4 text-sm cursor-pointer">
            Empezar ahora
          </ScrollLink>
        </div>
      </nav>
    </header>
  );
}
