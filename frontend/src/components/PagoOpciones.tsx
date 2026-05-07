// Stub Fase 0. Implementación completa en Fase 3.
import { Wallet, Building2, CreditCard } from 'lucide-react';

export type MetodoPago = 'yape' | 'binance' | 'transferencia';

interface Props {
  selected: MetodoPago | null;
  onSelect: (m: MetodoPago) => void;
}

const OPCIONES: { id: MetodoPago; nombre: string; descripcion: string; Icon: typeof Wallet }[] = [
  { id: 'yape', nombre: 'Yape', descripcion: 'Pago instantáneo con QR', Icon: Wallet },
  { id: 'binance', nombre: 'Binance', descripcion: 'USDT (TRC20 / BEP20)', Icon: CreditCard },
  { id: 'transferencia', nombre: 'Transferencia', descripcion: 'Cuenta bancaria', Icon: Building2 },
];

export function PagoOpciones({ selected, onSelect }: Props) {
  return (
    <div className="grid gap-4 sm:grid-cols-3">
      {OPCIONES.map(({ id, nombre, descripcion, Icon }) => {
        const active = selected === id;
        return (
          <button
            key={id}
            type="button"
            onClick={() => onSelect(id)}
            className={`text-left rounded-2xl p-5 border transition-all
              ${active
                ? 'border-lime-dark bg-cream shadow-card'
                : 'border-jungle/10 bg-white hover:border-lime-dark hover:-translate-y-1'}`}
          >
            <Icon className="w-7 h-7 text-jungle" aria-hidden />
            <div className="mt-3 font-semibold">{nombre}</div>
            <div className="text-sm text-jungle-light">{descripcion}</div>
          </button>
        );
      })}
    </div>
  );
}
