import { useCallback, useEffect, useRef, useState } from 'react';
import { Check, Copy, RefreshCw, Wallet } from 'lucide-react';
import { BINANCE, TITULAR } from '@/config/pago';

interface Props {
  /** Precio en soles peruanos a convertir. */
  priceInPEN: number;
  /** Notas adicionales debajo del QR. */
  note?: string;
}

type Cripto = 'USDT' | 'BTC' | 'ETH' | 'BNB';

interface CriptoMeta {
  id: Cripto;
  /** Nombre legible para el usuario. */
  nombre: string;
  /** Decimales en la representación del monto. */
  decimales: number;
  /** Símbolo de Binance para obtener el precio en USDT (USDT no necesita). */
  binanceSymbol?: string;
}

const CRIPTOS: ReadonlyArray<CriptoMeta> = [
  { id: 'USDT', nombre: 'Tether', decimales: 2 },
  { id: 'BTC', nombre: 'Bitcoin', decimales: 8, binanceSymbol: 'BTCUSDT' },
  { id: 'ETH', nombre: 'Ethereum', decimales: 6, binanceSymbol: 'ETHUSDT' },
  { id: 'BNB', nombre: 'BNB', decimales: 4, binanceSymbol: 'BNBUSDT' },
];

interface Cotizacion {
  /** Tasa PEN por 1 USD (USDT≈USD). */
  ratePenPerUsd: number;
  /** Cuánto USDT vale 1 unidad de cada cripto. */
  usdtPerUnit: Record<Cripto, number>;
  /** Fuente legible. */
  source: string;
  /** Hora ISO. */
  fetchedAt: string;
}

const REFRESH_MS = 60_000;

async function obtenerCotizacion(): Promise<Cotizacion> {
  // 1) USD/PEN — Binance no tiene par directo con PEN.
  let ratePenPerUsd = 3.75;
  let fxSource = 'fallback (3.75)';
  try {
    const r = await fetch('https://open.er-api.com/v6/latest/USD');
    if (r.ok) {
      const data = (await r.json()) as { rates?: Record<string, number> };
      if (typeof data?.rates?.PEN === 'number') {
        ratePenPerUsd = data.rates.PEN;
        fxSource = 'open.er-api.com';
      }
    }
  } catch (_) { /* mantener fallback */ }

  // 2) BTC/ETH/BNB en USDT — un solo request a Binance.
  const usdtPerUnit: Record<Cripto, number> = {
    USDT: 1,
    BTC: 80_000,
    ETH: 2_300,
    BNB: 650,
  };
  let binSource = 'fallback';
  try {
    const symbolsParam = encodeURIComponent('["BTCUSDT","ETHUSDT","BNBUSDT"]');
    const r = await fetch(`https://api.binance.com/api/v3/ticker/price?symbols=${symbolsParam}`);
    if (r.ok) {
      const arr = (await r.json()) as Array<{ symbol: string; price: string }>;
      for (const t of arr) {
        const p = parseFloat(t.price);
        if (!Number.isFinite(p)) continue;
        if (t.symbol === 'BTCUSDT') usdtPerUnit.BTC = p;
        else if (t.symbol === 'ETHUSDT') usdtPerUnit.ETH = p;
        else if (t.symbol === 'BNBUSDT') usdtPerUnit.BNB = p;
      }
      binSource = 'binance';
    }
  } catch (_) { /* mantener fallback */ }

  return {
    ratePenPerUsd,
    usdtPerUnit,
    source: `${fxSource} + ${binSource}`,
    fetchedAt: new Date().toISOString(),
  };
}

function montoEnCripto(priceInPEN: number, cot: Cotizacion, cripto: Cripto, decimales: number): string {
  const usdtTotal = priceInPEN / cot.ratePenPerUsd; // priceInPEN → USDT
  const unidades = usdtTotal / cot.usdtPerUnit[cripto];
  return unidades.toFixed(decimales);
}

function formatHora(iso: string): string {
  return new Date(iso).toLocaleTimeString('es-PE', {
    hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false,
  });
}

export function PagarConCripto({ priceInPEN, note }: Props) {
  const [cot, setCot] = useState<Cotizacion | null>(null);
  const [loading, setLoading] = useState(true);
  const [seleccionado, setSeleccionado] = useState<Cripto>('USDT');
  const [copied, setCopied] = useState(false);
  const [qrFailed, setQrFailed] = useState(false);
  const copyTimer = useRef<number | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    const c = await obtenerCotizacion();
    setCot(c);
    setLoading(false);
  }, []);

  useEffect(() => {
    refresh();
    const id = window.setInterval(refresh, REFRESH_MS);
    return () => window.clearInterval(id);
  }, [refresh]);

  useEffect(() => () => {
    if (copyTimer.current) window.clearTimeout(copyTimer.current);
  }, []);

  const meta = CRIPTOS.find((c) => c.id === seleccionado)!;
  const monto = cot ? montoEnCripto(priceInPEN, cot, seleccionado, meta.decimales) : '—';

  function copiarMonto() {
    if (!cot) return;
    navigator.clipboard.writeText(monto).then(() => {
      setCopied(true);
      if (copyTimer.current) window.clearTimeout(copyTimer.current);
      copyTimer.current = window.setTimeout(() => setCopied(false), 1800);
    });
  }

  return (
    <div className="bg-jungle text-cream rounded-2xl overflow-hidden shadow-card border border-jungle/20">
      {/* Header: precio en soles + selector cripto */}
      <div className="px-6 pt-6">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2 text-lime">
            <Wallet className="w-5 h-5" aria-hidden />
            <span className="font-semibold uppercase tracking-wider text-sm">Paga con cripto</span>
          </div>
          <button
            type="button"
            onClick={refresh}
            disabled={loading}
            className="inline-flex items-center gap-1.5 text-xs text-cream/70 hover:text-lime disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Actualizar
          </button>
        </div>

        <div className="mt-3 text-cream/70 text-xs uppercase tracking-wider">Total en soles</div>
        <div className="font-display text-4xl md:text-5xl text-cream leading-none">
          S/ {priceInPEN.toFixed(2)}
        </div>
      </div>

      {/* Pills selector */}
      <div className="px-6 mt-5 flex flex-wrap gap-2">
        {CRIPTOS.map((c) => {
          const active = c.id === seleccionado;
          return (
            <button
              key={c.id}
              type="button"
              onClick={() => setSeleccionado(c.id)}
              className={`px-3 py-1.5 rounded-full text-sm font-semibold border transition ${
                active
                  ? 'bg-lime text-jungle border-lime'
                  : 'bg-transparent text-cream/80 border-white/15 hover:border-lime hover:text-lime'
              }`}
            >
              {c.id}
              <span className="ml-1 text-[10px] opacity-70 font-normal">· {c.nombre}</span>
            </button>
          );
        })}
      </div>

      <div className="px-6 mt-6 grid md:grid-cols-2 gap-6 items-start">
        {/* QR */}
        <div className="flex flex-col items-center">
          <div className="bg-cream rounded-xl p-3 w-full max-w-[260px]">
            {!qrFailed ? (
              <img
                src={BINANCE.qrImage}
                alt="QR de Binance Pay"
                className="w-full aspect-square object-contain"
                onError={() => setQrFailed(true)}
              />
            ) : (
              <div className="aspect-square flex items-center justify-center bg-jungle/5 rounded-lg text-jungle/60 text-xs text-center px-4">
                Sube tu QR a<br />
                <code className="text-jungle font-semibold">{BINANCE.qrImage}</code>
              </div>
            )}
          </div>
          <div className="mt-2 text-xs text-cream/60">{BINANCE.payId}</div>
        </div>

        {/* Monto */}
        <div>
          <div className="text-cream/70 text-xs uppercase tracking-wider">A pagar en {seleccionado}</div>
          <div className="mt-1 flex items-baseline gap-2 flex-wrap">
            <span className="font-display text-4xl md:text-5xl text-lime leading-none break-all">
              {loading || !cot ? '—' : monto}
            </span>
            <span className="text-xl font-semibold text-lime/80">{seleccionado}</span>
          </div>
          <div className="mt-2 text-sm text-cream/70">
            {cot && (
              <>
                1 USD ≈ <strong className="text-cream">S/ {cot.ratePenPerUsd.toFixed(4)}</strong>
                {seleccionado !== 'USDT' && (
                  <> · 1 {seleccionado} ≈ <strong className="text-cream">S/ {(cot.usdtPerUnit[seleccionado] * cot.ratePenPerUsd).toFixed(2)}</strong></>
                )}
              </>
            )}
          </div>

          <button
            type="button"
            onClick={copiarMonto}
            disabled={!cot}
            className="mt-4 inline-flex items-center gap-2 bg-lime text-jungle font-semibold px-4 py-2.5 rounded-[10px] hover:scale-[1.02] active:scale-100 transition disabled:opacity-50"
          >
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            {copied ? 'Copiado' : `Copiar ${monto} ${seleccionado}`}
          </button>

          <ol className="mt-5 space-y-1.5 text-sm text-cream/80 list-decimal list-inside">
            <li>Escanea el QR con la app de Binance.</li>
            <li>Ingresa el monto exacto en <strong className="text-lime">{seleccionado}</strong>.</li>
            <li>Red soportada: <strong className="text-lime">{BINANCE.redes.join(' o ')}</strong>.</li>
            <li>Envía y guarda el comprobante para subirlo después.</li>
          </ol>

          {note && <p className="mt-3 text-xs text-cream/60">{note}</p>}
        </div>
      </div>

      <div className="mt-6 px-6 py-4 border-t border-white/10 flex items-center justify-between text-xs text-cream/50 flex-wrap gap-2">
        <span>Titular: {TITULAR}</span>
        {cot && (
          <span title={cot.source}>
            Cotización: {formatHora(cot.fetchedAt)} · refresca cada 60s
          </span>
        )}
      </div>
    </div>
  );
}
