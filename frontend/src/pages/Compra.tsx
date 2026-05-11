import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Check, Copy, Wallet } from 'lucide-react';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { PagoOpciones, type MetodoPago } from '@/components/PagoOpciones';
import { PagarConCripto } from '@/components/PagarConCripto';
import { WhatsAppButton } from '@/components/WhatsAppButton';
import { usePlataformas } from '@/hooks/usePlataformas';
import { BCP_SOLES, YAPE, BINANCE } from '@/config/pago';

function CopyButton({ value, label }: { value: string; label: string }) {
  const [copied, setCopied] = useState(false);
  function copy() {
    navigator.clipboard.writeText(value).then(() => {
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    });
  }
  return (
    <button
      type="button"
      onClick={copy}
      className="inline-flex items-center gap-1.5 text-xs text-jungle-light hover:text-jungle"
      title={`Copiar ${label}`}
    >
      {copied ? <Check className="w-3.5 h-3.5 text-success" /> : <Copy className="w-3.5 h-3.5" />}
      {copied ? 'Copiado' : 'Copiar'}
    </button>
  );
}

/** Encabezado común para los métodos en soles: muestra el total a pagar en grande. */
function HeaderSoles({ priceInPEN, label }: { priceInPEN: number; label: string }) {
  return (
    <div className="bg-jungle text-cream rounded-t-2xl px-6 pt-6 pb-5">
      <div className="flex items-center gap-2 text-lime">
        <Wallet className="w-5 h-5" aria-hidden />
        <span className="font-semibold uppercase tracking-wider text-sm">{label}</span>
      </div>
      <div className="mt-3 text-cream/70 text-xs uppercase tracking-wider">Total en soles</div>
      <div className="font-display text-4xl md:text-5xl text-lime leading-none">
        S/ {priceInPEN.toFixed(2)}
      </div>
    </div>
  );
}

function YapeBlock({ priceInPEN }: { priceInPEN: number }) {
  const [imgFailed, setImgFailed] = useState(false);
  return (
    <div className="bg-white rounded-2xl border border-jungle/10 shadow-card overflow-hidden">
      <HeaderSoles priceInPEN={priceInPEN} label="Paga con Yape · Plin" />
      <div className="p-6 grid md:grid-cols-2 gap-6 items-start">
        <div className="flex flex-col items-center">
          <div className="bg-[#7B1FA2] rounded-2xl p-3 w-full max-w-[340px]">
            {!imgFailed ? (
              <img
                src={YAPE.qrImage}
                alt="QR de Yape"
                className="w-full aspect-square object-contain rounded-lg bg-white"
                onError={() => setImgFailed(true)}
              />
            ) : (
              <div className="aspect-square flex items-center justify-center bg-white rounded-lg text-jungle/60 text-xs text-center px-4">
                Sube tu QR a<br />
                <code className="text-jungle font-semibold">{YAPE.qrImage}</code>
              </div>
            )}
          </div>
        </div>
        <div>
          <div className="text-jungle-light text-xs uppercase tracking-wider">Titular</div>
          <div className="mt-1 font-semibold text-lg text-jungle">{YAPE.titular}</div>
          <div className="mt-3 flex items-center justify-between bg-cream rounded-lg px-3 py-2 border border-jungle/10">
            <div>
              <div className="text-[11px] uppercase text-jungle-light">Número</div>
              <div className="font-mono font-semibold">{YAPE.numero}</div>
            </div>
            <CopyButton value={YAPE.numeroPlano} label="número Yape" />
          </div>
          <ol className="mt-4 text-sm text-jungle-light space-y-1.5 list-decimal list-inside">
            <li>Escanea el QR con Yape o Plin.</li>
            <li>O usa el número <strong>{YAPE.numero}</strong> y confirma el titular.</li>
            <li>Envía exactamente <strong className="text-jungle">S/ {priceInPEN.toFixed(2)}</strong>.</li>
            <li>Sube tu voucher abajo para aprobar el acceso.</li>
          </ol>
        </div>
      </div>
    </div>
  );
}

function BancoBlock({ priceInPEN }: { priceInPEN: number }) {
  return (
    <div className="bg-white rounded-2xl border border-jungle/10 shadow-card overflow-hidden">
      <HeaderSoles priceInPEN={priceInPEN} label="Transferencia bancaria" />
      <div className="p-6">
        <div className="text-jungle-light text-xs uppercase tracking-wider">Titular</div>
        <div className="mt-1 font-semibold text-lg text-jungle">{BCP_SOLES.titular}</div>
        <div className="mt-1 text-sm text-jungle-light">{BCP_SOLES.banco} · Cuenta en Soles</div>

        <dl className="mt-5 grid sm:grid-cols-2 gap-3">
          <div className="bg-cream rounded-lg px-3 py-2 border border-jungle/10">
            <div className="flex items-center justify-between">
              <dt className="text-[11px] uppercase text-jungle-light">Cuenta BCP</dt>
              <CopyButton value={BCP_SOLES.cuenta.replace(/\s/g, '')} label="cuenta BCP" />
            </div>
            <dd className="font-mono font-semibold mt-0.5">{BCP_SOLES.cuenta}</dd>
          </div>
          <div className="bg-cream rounded-lg px-3 py-2 border border-jungle/10">
            <div className="flex items-center justify-between">
              <dt className="text-[11px] uppercase text-jungle-light">Interbancaria (CCI)</dt>
              <CopyButton value={BCP_SOLES.interbancaria.replace(/\s/g, '')} label="CCI" />
            </div>
            <dd className="font-mono font-semibold mt-0.5">{BCP_SOLES.interbancaria}</dd>
          </div>
        </dl>

        <p className="mt-4 text-sm text-jungle-light">
          Transfiere exactamente <strong className="text-jungle">S/ {priceInPEN.toFixed(2)}</strong> desde tu banca móvil y sube el voucher abajo.
        </p>
      </div>
    </div>
  );
}

export function Compra() {
  const { slug } = useParams<{ slug: string }>();
  const { plataformas } = usePlataformas();
  const data = plataformas.find((p) => p.slug === slug);
  const [metodo, setMetodo] = useState<MetodoPago>('yape');

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 container-x py-16 max-w-3xl">
        {!data ? (
          <div>
            <h1 className="text-3xl">Plataforma no encontrada</h1>
            <Link to="/" className="btn-ghost mt-6">Volver al inicio</Link>
          </div>
        ) : (
          <>
            <span className="pill">Comprar acceso</span>
            <h1 className="mt-4 text-4xl">{data.nombre}</h1>
            <p className="mt-2 text-jungle-light">
              S/ {data.precio.toFixed(2)} por {data.duracion_dias} días.
            </p>

            <section className="mt-10">
              <h2 className="text-2xl">Paso 1 — Tus datos</h2>
              <p className="text-sm text-jungle-light mt-1">
                Formulario completo en Fase 2. Por ahora coordina por WhatsApp.
              </p>
              <div className="mt-4 bg-white border border-jungle/10 rounded-2xl p-6 shadow-card">
                <div className="grid gap-4 sm:grid-cols-2">
                  <input className="border border-jungle/15 rounded-[10px] px-4 py-3" placeholder="Nombre completo" disabled />
                  <input className="border border-jungle/15 rounded-[10px] px-4 py-3" placeholder="Correo" disabled />
                  <input className="border border-jungle/15 rounded-[10px] px-4 py-3 sm:col-span-2" placeholder="WhatsApp" disabled />
                </div>
              </div>
            </section>

            <section className="mt-10">
              <h2 className="text-2xl">Paso 2 — Elige cómo pagar</h2>
              <div className="mt-4">
                <PagoOpciones selected={metodo} onSelect={setMetodo} />
              </div>
            </section>

            <section className="mt-10">
              <h2 className="text-2xl">Paso 3 — Paga y sube tu voucher</h2>
              <div className="mt-4">
                {metodo === 'yape' && <YapeBlock priceInPEN={data.precio} />}
                {metodo === 'transferencia' && <BancoBlock priceInPEN={data.precio} />}
                {metodo === 'binance' && (
                  <PagarConCripto
                    priceInPEN={data.precio}
                    note={`Binance Pay ID: ${BINANCE.payId}. Red: ${BINANCE.redes.join(' o ')}. Moneda preferida: ${BINANCE.moneda}.`}
                  />
                )}
              </div>

              <div className="mt-6 bg-white border border-jungle/10 rounded-2xl p-6 shadow-card">
                <p className="text-sm text-jungle-light">
                  Subida de voucher disponible en Fase 2. Por ahora, envía la captura por WhatsApp.
                </p>
                <button className="btn-primary mt-4" disabled>Confirmar solicitud</button>
              </div>
            </section>

            <div className="mt-10 flex items-center gap-4">
              <span className="h-px flex-1 bg-jungle/10" />
              <span className="text-jungle-light text-sm">o</span>
              <span className="h-px flex-1 bg-jungle/10" />
            </div>

            <div className="mt-6 text-center">
              <p className="text-jungle-light mb-3">Prefiero coordinar por WhatsApp</p>
              <WhatsAppButton
                message={`Hola, quiero comprar acceso a ${data.nombre} en SINAPSIS EDU. Total: S/ ${data.precio.toFixed(2)}.`}
              />
            </div>
          </>
        )}
      </main>
      <Footer />
    </div>
  );
}
