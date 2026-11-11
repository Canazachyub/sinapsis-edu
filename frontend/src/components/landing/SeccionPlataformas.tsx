import { useMemo, useState } from 'react';
import { SectionHeader } from './SectionHeader';
import { PlataformaCard, type PlataformaCardData } from '@/components/PlataformaCard';

type Filtro = 'todas' | 'banqueo' | 'cursos' | 'biblioteca';

const GRUPO: Record<string, Exclude<Filtro, 'todas'>> = {
  enam: 'banqueo',
  encib: 'banqueo',
  encaps: 'banqueo',
  rm: 'banqueo',
  essalud: 'banqueo',
  anatomia: 'cursos',
  cto: 'cursos',
  cb: 'cursos',
  biblioteca: 'biblioteca',
};

const TABS: Array<{ id: Filtro; label: string }> = [
  { id: 'todas', label: 'Todas' },
  { id: 'banqueo', label: 'Banqueo' },
  { id: 'cursos', label: 'Cursos y videoclases' },
  { id: 'biblioteca', label: 'Biblioteca' },
];

export function SeccionPlataformas({ plataformas }: { plataformas: PlataformaCardData[] }) {
  const [filtro, setFiltro] = useState<Filtro>('todas');

  const visibles = useMemo(
    () => (filtro === 'todas' ? plataformas : plataformas.filter((p) => (GRUPO[p.slug] ?? 'cursos') === filtro)),
    [plataformas, filtro],
  );

  return (
    <section id="plataformas" className="bg-paper">
      <div className="container-x py-20 md:py-28">
        <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
          <SectionHeader
            eyebrow="Plataformas"
            title="Elige tu plataforma"
            lead="Precios por periodo de acceso, sin renovaciones automáticas. El acceso empieza cuando verificamos tu pago."
          />
          <div
            role="tablist"
            aria-label="Filtrar plataformas"
            className="flex w-full gap-1 overflow-x-auto rounded-xl border border-line bg-white p-1 lg:w-auto"
          >
            {TABS.map((t) => (
              <button
                key={t.id}
                role="tab"
                type="button"
                aria-selected={filtro === t.id}
                onClick={() => setFiltro(t.id)}
                className={`shrink-0 rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${
                  filtro === t.id ? 'bg-jungle-800 text-white' : 'text-muted hover:bg-paper hover:text-ink'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {visibles.map((p) => (
            <PlataformaCard key={p.slug} data={p} />
          ))}
        </div>
      </div>
    </section>
  );
}
