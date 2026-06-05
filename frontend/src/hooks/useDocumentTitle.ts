import { useEffect } from 'react';

const BASE = 'SINAPSIS EDU';

/**
 * Actualiza el `<title>` del documento según la página actual.
 * Pasa `null`/`undefined` para mostrar solo la marca base.
 *
 * Ej: useDocumentTitle('ENAM') → "ENAM · SINAPSIS EDU"
 */
export function useDocumentTitle(title?: string | null) {
  useEffect(() => {
    document.title = title ? `${title} · ${BASE}` : `${BASE} · Plataformas médicas`;
  }, [title]);
}
