import { useState } from 'react';
import { Check, ChevronDown } from 'lucide-react';
import { SEGMENTOS_ANATOMIA, PRECIO_POR_SEGMENTO_PEN, type SegmentoAnatomia } from '@/data/segmentosAnatomia';

interface Props {
  /** Set de IDs de segmentos seleccionados. */
  seleccionados: ReadonlySet<string>;
  onChange: (next: Set<string>) => void;
}

export const ANATOMIA_PRECIO_UNITARIO = PRECIO_POR_SEGMENTO_PEN;

function SegmentoCard({
  segmento,
  selected,
  onToggle,
}: {
  segmento: SegmentoAnatomia;
  selected: boolean;
  onToggle: () => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div
      className={`rounded-2xl border transition-all overflow-hidden ${
        selected
          ? 'bg-jungle text-cream border-lime shadow-card-hover'
          : 'bg-white text-jungle border-jungle/10 shadow-card hover:border-jungle/30'
      }`}
    >
      <button
        type="button"
        onClick={onToggle}
        className="w-full text-left px-5 py-4 flex items-center gap-4"
      >
        <span
          className={`inline-flex w-6 h-6 rounded-md items-center justify-center shrink-0 border-2 ${
            selected ? 'bg-lime border-lime' : 'border-jungle/40 bg-white'
          }`}
          aria-hidden
        >
          {selected && <Check className="w-4 h-4 text-jungle" />}
        </span>
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-lg uppercase tracking-tight font-display">
            {segmento.nombre}
          </div>
          <div className={`text-xs ${selected ? 'text-cream/80' : 'text-jungle-light'}`}>
            {segmento.temas.length} {segmento.temas.length === 1 ? 'tema' : 'temas'} · S/ {PRECIO_POR_SEGMENTO_PEN}
          </div>
        </div>
        <span className={`font-display text-xl shrink-0 ${selected ? 'text-lime' : 'text-jungle'}`}>
          S/ {PRECIO_POR_SEGMENTO_PEN}
        </span>
      </button>

      <div className="px-5 pb-4">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setOpen((v) => !v);
          }}
          className={`text-xs inline-flex items-center gap-1 underline-offset-4 ${
            selected ? 'text-cream/80 hover:text-lime' : 'text-jungle-light hover:text-jungle'
          }`}
        >
          <ChevronDown
            className={`w-3.5 h-3.5 transition-transform ${open ? 'rotate-180' : ''}`}
          />
          {open ? 'Ocultar temario' : `Ver temario (${segmento.temas.length} temas)`}
        </button>

        {open && (
          <ul
            className={`mt-3 grid gap-1 text-sm md:grid-cols-2 ${
              selected ? 'text-cream/85' : 'text-jungle-light'
            }`}
          >
            {segmento.temas.map((t) => (
              <li key={t} className="flex gap-2">
                <span className={selected ? 'text-lime' : 'text-success'}>•</span>
                <span>{t}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

export function AnatomiaSegmentos({ seleccionados, onChange }: Props) {
  function toggle(id: string) {
    const next = new Set(seleccionados);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    onChange(next);
  }

  function seleccionarTodos() {
    onChange(new Set(SEGMENTOS_ANATOMIA.map((s) => s.id)));
  }

  function limpiar() {
    onChange(new Set());
  }

  const total = seleccionados.size * PRECIO_POR_SEGMENTO_PEN;

  return (
    <div>
      <div className="flex items-center justify-between flex-wrap gap-3">
        <p className="text-sm text-jungle-light">
          Selecciona uno o más segmentos. Cada uno cuesta{' '}
          <strong className="text-jungle">S/ {PRECIO_POR_SEGMENTO_PEN}</strong> y dura 30 días.
        </p>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={seleccionarTodos}
            className="text-xs px-3 py-1.5 rounded-full border border-jungle/20 text-jungle hover:bg-jungle hover:text-lime transition"
          >
            Todos
          </button>
          <button
            type="button"
            onClick={limpiar}
            disabled={seleccionados.size === 0}
            className="text-xs px-3 py-1.5 rounded-full border border-jungle/20 text-jungle-light hover:text-jungle disabled:opacity-40"
          >
            Limpiar
          </button>
        </div>
      </div>

      <div className="mt-5 grid gap-3">
        {SEGMENTOS_ANATOMIA.map((s) => (
          <SegmentoCard
            key={s.id}
            segmento={s}
            selected={seleccionados.has(s.id)}
            onToggle={() => toggle(s.id)}
          />
        ))}
      </div>

      <div className="mt-6 bg-jungle text-cream rounded-2xl p-5 flex items-center justify-between flex-wrap gap-4">
        <div>
          <div className="text-xs uppercase tracking-wider text-cream/70">
            {seleccionados.size === 0
              ? 'Aún no seleccionas segmentos'
              : `${seleccionados.size} ${seleccionados.size === 1 ? 'segmento seleccionado' : 'segmentos seleccionados'}`}
          </div>
          <div className="font-display text-4xl md:text-5xl text-lime mt-1 leading-none">
            S/ {total.toFixed(2)}
          </div>
        </div>
        <div className="text-sm text-cream/80 max-w-xs">
          El total se descuenta automáticamente en cada método de pago de abajo.
          También calcula el equivalente en USDT, BTC, ETH y BNB.
        </div>
      </div>
    </div>
  );
}
