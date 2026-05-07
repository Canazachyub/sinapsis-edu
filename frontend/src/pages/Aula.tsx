import { Link, useParams } from 'react-router-dom';
import { LogOut } from 'lucide-react';
import { IframeViewer } from '@/components/IframeViewer';

// Fase 0: usa una URL de demo para todas las plataformas (per CLAUDE.md sección 1).
// En Fase 5 esto se reemplaza por callApi('obtenerUrlPlataforma', { token, slug }).
const DEMO_URL = 'https://canazachyub.github.io/simulaencib/';

export function Aula() {
  const { slug } = useParams<{ slug: string }>();

  return (
    <div className="min-h-screen flex flex-col">
      <header className="h-14 bg-jungle text-cream flex items-center justify-between px-5">
        <div className="flex items-center gap-3">
          <span className="inline-block w-7 h-7 rounded-md bg-lime" aria-hidden />
          <span className="font-display tracking-wide text-lg">PORTAL CENTRAL</span>
          <span className="text-cream/40">|</span>
          <span className="uppercase text-sm font-medium text-lime">{slug}</span>
        </div>
        <Link to="/portal" className="inline-flex items-center gap-2 text-sm text-cream hover:text-lime">
          <LogOut className="w-4 h-4" /> Salir
        </Link>
      </header>
      <IframeViewer src={DEMO_URL} title={`Plataforma ${slug ?? ''}`} />
    </div>
  );
}
