import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { PagoOpciones, type MetodoPago } from '@/components/PagoOpciones';
import { WhatsAppButton } from '@/components/WhatsAppButton';
import { usePlataformas } from '@/hooks/usePlataformas';

export function Compra() {
  const { slug } = useParams<{ slug: string }>();
  const { plataformas } = usePlataformas();
  const data = plataformas.find((p) => p.slug === slug);
  const [metodo, setMetodo] = useState<MetodoPago | null>(null);

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
              S/. {data.precio} por {data.duracion_dias} días.
            </p>

            <section className="mt-10">
              <h2 className="text-2xl">Paso 1 — Tus datos</h2>
              <p className="text-sm text-jungle-light mt-1">Formulario completo en Fase 3.</p>
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
              <div className="mt-4 bg-white border border-jungle/10 rounded-2xl p-6 shadow-card">
                <p className="text-sm text-jungle-light">QR de Yape, datos de Binance/banco, y subida de voucher en Fase 3.</p>
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
                message={`Hola Yubert, quiero comprar acceso a ${data.nombre}.`}
              />
            </div>
          </>
        )}
      </main>
      <Footer />
    </div>
  );
}
