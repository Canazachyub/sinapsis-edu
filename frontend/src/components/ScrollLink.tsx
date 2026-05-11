import type { MouseEvent, ReactNode } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

interface Props {
  /** ID del elemento destino (sin el `#`). */
  to: string;
  children: ReactNode;
  className?: string;
}

/**
 * Link a una sección de la landing por ID. Maneja dos casos:
 *
 *  - Si estás en `/` (landing): hace `scrollIntoView` suave a la sección.
 *  - Si estás en otra ruta (login, portal, compra): navega a `/` con un
 *    state `{ scrollTo }` que la Landing detecta y aplica al montar.
 *
 * Con HashRouter, los `<a href="#plataformas">` "rompen" porque el
 * hash es la ruta del router; este componente evita ese conflicto.
 */
export function ScrollLink({ to, children, className }: Props) {
  const navigate = useNavigate();
  const location = useLocation();

  function handleClick(e: MouseEvent<HTMLAnchorElement>) {
    e.preventDefault();
    if (location.pathname === '/') {
      const el = document.getElementById(to);
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else {
      navigate('/', { state: { scrollTo: to } });
    }
  }

  return (
    <a href={`#${to}`} onClick={handleClick} className={className}>
      {children}
    </a>
  );
}
