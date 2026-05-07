import { MessageCircle } from 'lucide-react';
import { config } from '@/config';

interface Props {
  message?: string;
  className?: string;
  label?: string;
}

export function WhatsAppButton({ message, className = '', label = 'Coordinar por WhatsApp' }: Props) {
  const text = encodeURIComponent(message ?? 'Hola Yubert, quisiera más información sobre Portal Central.');
  const href = `https://wa.me/${config.whatsappNumber}?text=${text}`;

  return (
    <a href={href} target="_blank" rel="noreferrer" className={`btn-whatsapp ${className}`}>
      <MessageCircle className="w-5 h-5" aria-hidden /> {label}
    </a>
  );
}

/** Botón flotante fijo, abajo a la derecha. */
export function WhatsAppFloating({ message }: { message?: string }) {
  const text = encodeURIComponent(message ?? 'Hola Yubert, necesito ayuda con Portal Central.');
  const href = `https://wa.me/${config.whatsappNumber}?text=${text}`;
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      aria-label="Soporte por WhatsApp"
      className="fixed z-50 bottom-5 right-5 inline-flex items-center justify-center
                 w-14 h-14 rounded-full bg-whatsapp text-white shadow-card-hover
                 hover:scale-105 transition-transform"
    >
      <MessageCircle className="w-7 h-7" aria-hidden />
    </a>
  );
}
