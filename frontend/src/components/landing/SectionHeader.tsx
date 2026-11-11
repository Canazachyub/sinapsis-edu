import type { ReactNode } from 'react';

interface Props {
  eyebrow: string;
  title: ReactNode;
  lead?: ReactNode;
  align?: 'left' | 'center';
  className?: string;
  children?: ReactNode;
}

/** Cabecera estándar de sección: eyebrow → h2 → lead (DESIGN.md §6). */
export function SectionHeader({ eyebrow, title, lead, align = 'left', className = '', children }: Props) {
  const center = align === 'center';
  return (
    <div className={`${center ? 'mx-auto text-center' : ''} ${className}`} data-reveal>
      <p className="eyebrow">{eyebrow}</p>
      <h2 className={`section-title ${center ? 'mx-auto' : ''} max-w-[760px]`}>{title}</h2>
      {lead && <p className={`section-lead ${center ? 'mx-auto' : ''}`}>{lead}</p>}
      {children}
    </div>
  );
}
