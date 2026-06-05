interface Props {
  src: string;
  title: string;
}

/**
 * Renderiza una plataforma externa dentro de un iframe ocultando la URL real.
 * Sandbox permite lo mínimo para que la plataforma funcione (scripts, forms,
 * popups, descargas), pero sigue siendo otra origin: no lee cookies del portal.
 *
 * Nota seguridad: se quitó `allow-popups-to-escape-sandbox` (permitía abrir
 * popups SIN restricciones de sandbox). Si una plataforma futura lo necesita
 * (p. ej. OAuth en ventana nueva), reañadirlo de forma puntual.
 */
export function IframeViewer({ src, title }: Props) {
  return (
    <iframe
      src={src}
      title={title}
      className="w-full border-0"
      style={{ height: 'calc(100vh - 56px)' }}
      sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-downloads"
      allow="clipboard-read; clipboard-write; fullscreen"
    />
  );
}
