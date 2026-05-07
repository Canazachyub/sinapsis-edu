// Stub Fase 0: variante simple. La sección de precios completa llega en Fase 3/6.
interface Props {
  nombre: string;
  precio: number;
  duracion: string;
  destacado?: boolean;
  features: string[];
}

export function PricingCard({ nombre, precio, duracion, destacado, features }: Props) {
  return (
    <div
      className={
        destacado
          ? 'bg-jungle text-cream rounded-[20px] p-8 shadow-card-hover ring-2 ring-lime'
          : 'bg-white text-jungle rounded-[20px] p-8 shadow-card border border-jungle/10'
      }
    >
      {destacado && (
        <span className="inline-block mb-3 px-3 py-1 rounded-pill bg-lime text-jungle text-xs font-semibold">
          Más popular
        </span>
      )}
      <div className="font-display text-2xl uppercase tracking-tight">{nombre}</div>
      <div className="mt-4 flex items-baseline gap-2">
        <span className="text-4xl font-bold">S/. {precio}</span>
        <span className="text-sm opacity-70">/ {duracion}</span>
      </div>
      <ul className="mt-6 space-y-2 text-sm">
        {features.map((f) => (
          <li key={f} className="flex gap-2"><span className="text-lime">✓</span> {f}</li>
        ))}
      </ul>
    </div>
  );
}
