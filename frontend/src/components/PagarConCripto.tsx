import { useCallback, useEffect, useRef, useState } from 'react';
import { Check, Copy, RefreshCw, Wallet } from 'lucide-react';
import { BINANCE, TITULAR } from '@/config/pago';

interface Props {
  /** Precio en soles peruanos a convertir a USDT. */
  priceInPEN: number;
  /** Notas adicionales debajo del QR. */
  note?: string;
}

interface Cotizacion {
  /** Monto en USDT con 2 decimales. */
  usdt: string;
  /** Tasa USD/PEN usada. */
  ratePenPerUsd: number;
  /** Fuente legible de la cotización. */
  source: string;
  /** ISO timestamp local de la última actualización. */
  fetchedAt: string;
}

const REFRESH_MS = 60_000;

/**
 * Binance NO tiene par directo USDT/PEN. Estrategia:
 *   1. Pedir USD/PEN a open.er-api.com (gratis, sin auth).
 *   2. Asumir 1 USDT ≈ 1 USD (es stablecoin pegged al dolar).
 *   3. usdtAmount = pricePEN / ratePenPerUsd.
 *
 * Si la API falla, devuelve un fallback fijo de 3.75 PEN/USD (referencial).
 */
async function obtenerCotizacion(pricePEN: number): Promise<Cotizacion> {
  try {
    const res = await fetch('https://open.er-api.com/v6/latest/USD');
    if (!res.ok) throw new Error('FX HTTP ' + res.status);
    const data = (await res.json()) as { rates?: Record<string, number> };
    const pen = data?.rates?.PEN;
    if (!pen || typeof pen !== 'number') throw new Error('FX sin PEN');
    return {
      usdt: (pricePEN / pen).toFixed(2),
      ratePenPerUsd: pen,
      source: 'open.er-api.com (USD/PEN, USDT≈USD)',
      fetchedAt: new Date().toISOString(),
    };
  } catch (_) {
    const fallbackRate = 3.75;
    return {
      usdt: (pricePEN / fallbackRate).toFixed(2),
      ratePenPerUsd: fallbackRate,
      source: 'fallback offline (3.75 PEN/USD)',
      fetchedAt: new Date().toISOString(),
    };
  }
}

function formatHora(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString('es-PE', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
}

export function PagarConCripto({ priceInPEN, note }: Props) {
  const [cot, setCot] = useState<Cotizacion | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [qrFailed, setQrFailed] = useState(false);
  const copyTimer = useRef<number | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    const c = await obtenerCotizacion(priceInPEN);
    setCot(c);
    setLoading(false);
  }, [priceInPEN]);

  useEffect(() => {
    refresh();
    const id = window.setInterval(refresh, REFRESH_MS);
    return () => window.clearInterval(id);
  }, [refresh]);

  useEffect(() => {
    return () => {
      if (copyTimer.current) window.clearTimeout(copyTimer.current);
    };
  }, []);

  function copiarMonto() {
    if (!cot) return;
    navigator.clipboard.writeText(cot.usdt).then(() => {
      setCopied(true);
      if (copyTimer.current) window.clearTimeout(copyTimer.current);
      copyTimer.current = window.setTimeout(() => setCopied(false), 1800);
    });
  }

  return (
    <div className="bg-jungle text-cream rounded-2xl p-6 shadow-card border border-jungle/20">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2 text-lime">
          <Wallet className="w-5 h-5" aria-hidden />
          <span className="font-semibold uppercase tracking-wider text-sm">
            Paga con Binance Pay
          </span>
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

      <div className="mt-5 grid md:grid-cols-2 gap-6 items-start">
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

        {/* Monto + copia */}
        <div>
          <div className="text-cream/70 text-xs uppercase tracking-wider">A pagar</div>
          <div className="mt-1 flex items-baseline gap-2 flex-wrap">
            <span className="font-display text-5xl md:text-6xl text-lime leading-none">
              {loading || !cot ? '—' : cot.usdt}
            </span>
            <span className="text-xl font-semibold text-lime/80">USDT</span>
          </div>
          <div className="mt-1 text-sm text-cream/70">
            Equivalente a <strong className="text-cream">S/ {priceInPEN.toFixed(2)}</strong>
            {cot && (
              <> · 1 USD ≈ {cot.ratePenPerUsd.toFixed(4)} PEN</>
            )}
          </div>

          <button
            type="button"
            onClick={copiarMonto}
            disabled={!cot}
            className="mt-4 inline-flex items-center gap-2 bg-lime text-jungle font-semibold px-4 py-2.5 rounded-[10px] hover:scale-[1.02] active:scale-100 transition disabled:opacity-50"
          >
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            {copied ? 'Copiado' : `Copiar ${cot?.usdt ?? ''} USDT`}
          </button>

          <ol className="mt-5 space-y-1.5 text-sm text-cream/80 list-decimal list-inside">
            <li>Escanea el QR con la app de Binance.</li>
            <li>Ingresa el monto exacto en USDT (cópialo).</li>
            <li>Red soportada: <strong className="text-lime">{BINANCE.redes.join(' o ')}</strong>.</li>
            <li>Envía y guarda el comprobante para subirlo después.</li>
          </ol>

          {note && <p className="mt-3 text-xs text-cream/60">{note}</p>}
        </div>
      </div>

      <div className="mt-6 pt-4 border-t border-white/10 flex items-center justify-between text-xs text-cream/50 flex-wrap gap-2">
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
