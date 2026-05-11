import { Link } from 'react-router-dom';

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
          <a href="#plataformas" className="hover:text-jungle">Plataformas</a>
          <a href="#beneficios" className="hover:text-jungle">Beneficios</a>
          <a href="#precios" className="hover:text-jungle">Precios</a>
          <a href="#faq" className="hover:text-jungle">FAQ</a>
        </div>
        <div className="flex items-center gap-3">
          <Link to="/login" className="btn-ghost !py-2 !px-4 text-sm">Login</Link>
          <a href="#plataformas" className="btn-primary !py-2 !px-4 text-sm">Empezar ahora</a>
        </div>
      </nav>
    </header>
  );
}
