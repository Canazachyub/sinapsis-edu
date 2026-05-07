interface Props {
  src: string;
  title: string;
}

/**
 * Renderiza una plataforma externa dentro de un iframe ocultando la URL real.
 * Sandbox permite scripts/forms/popups para que la plataforma funcione,
 * pero sigue siendo otra origin: no puede leer cookies del portal.
 */
export function IframeViewer({ src, title }: Props) {
  return (
    <iframe
      src={src}
      title={title}
      className="w-full border-0"
      style={{ height: 'calc(100vh - 56px)' }}
      sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-popups-to-escape-sandbox allow-downloads"
      allow="clipboard-read; clipboard-write; fullscreen"
    />
  );
}
