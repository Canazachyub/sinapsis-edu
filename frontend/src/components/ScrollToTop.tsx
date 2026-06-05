import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * Resetea el scroll al tope en cada cambio de ruta.
 *
 * Sin esto, React Router conserva la posición de scroll al navegar; p. ej. al
 * pasar de `/compra` (con scroll abajo, en el botón "Confirmar") a `/gracias`,
 * la página de gracias quedaba renderizada pero el viewport seguía abajo.
 *
 * Excepción: cuando se navega a la Landing con `state.scrollTo` (desde el
 * <ScrollLink>), NO reseteamos, para no pisar el scroll-a-sección que la
 * Landing aplica al montar.
 */
export function ScrollToTop() {
  const { pathname, state } = useLocation();

  useEffect(() => {
    const wantsSection = !!(state as { scrollTo?: string } | null)?.scrollTo;
    if (wantsSection) return;
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  }, [pathname, state]);

  return null;
}
