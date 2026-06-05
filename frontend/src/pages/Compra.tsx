import { useMemo, useRef, useState, type ChangeEvent, type FormEvent } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  AlertTriangle, Check, Copy, FileUp, Loader2, Wallet,
} from 'lucide-react';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { PagoOpciones, type MetodoPago } from '@/components/PagoOpciones';
import { PagarConCripto } from '@/components/PagarConCripto';
import { WhatsAppButton } from '@/components/WhatsAppButton';
import { AnatomiaSegmentos } from '@/components/AnatomiaSegmentos';
import { usePlataformas } from '@/hooks/usePlataformas';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { callApi } from '@/api/client';
import { BCP_SOLES, YAPE, BINANCE } from '@/config/pago';
import { PRECIO_POR_SEGMENTO_PEN, SEGMENTOS_ANATOMIA } from '@/data/segmentosAnatomia';
import { fileToBase64, validateVoucherFile } from '@/utils/fileToBase64';

// ─── Sub-componentes de UI ───────────────────────────────────

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
            <li>Captura el voucher y súbelo abajo.</li>
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
          Transfiere exactamente <strong className="text-jungle">S/ {priceInPEN.toFixed(2)}</strong> y sube el voucher abajo.
        </p>
      </div>
    </div>
  );
}

function AvisoSeleccionar() {
  return (
    <div className="bg-warning/10 border border-warning/30 text-jungle rounded-2xl p-5 flex gap-3 items-start">
      <AlertTriangle className="w-5 h-5 text-warning shrink-0 mt-0.5" />
      <div>
        <div className="font-semibold">Selecciona al menos un segmento</div>
        <p className="text-sm text-jungle-light mt-1">
          Anatomía de Testut se compra por segmentos. Marca arriba los que necesitas.
        </p>
      </div>
    </div>
  );
}

// ─── Página principal ────────────────────────────────────────

interface FormData {
  nombre: string;
  correo: string;
  whatsapp: string;
}

const FORM_VACIO: FormData = { nombre: '', correo: '', whatsapp: '' };

const RE_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const RE_WHATSAPP = /^\+?\d{8,15}$/;

function validateForm(f: FormData): string | null {
  if (f.nombre.trim().length < 3) return 'Ingresa tu nombre completo';
  if (!RE_EMAIL.test(f.correo.trim())) return 'Correo inválido';
  if (!RE_WHATSAPP.test(f.whatsapp.replace(/\s|-/g, ''))) return 'WhatsApp inválido (8-15 dígitos)';
  return null;
}

export function Compra() {
  const { slug } = useParams<{ slug: string }>();
  const { plataformas } = usePlataformas();
  const data = plataformas.find((p) => p.slug === slug);
  const navigate = useNavigate();
  useDocumentTitle(data ? `Comprar ${data.nombre}` : 'Comprar acceso');

  // Estado del flujo
  const [metodo, setMetodo] = useState<MetodoPago>('yape');
  const [form, setForm] = useState<FormData>(FORM_VACIO);
  const [voucherFile, setVoucherFile] = useState<File | null>(null);
  const [enviando, setEnviando] = useState<false | 'registrando' | 'subiendo'>(false);
  const [error, setError] = useState<string | null>(null);
  const [idCompraCreada, setIdCompraCreada] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Anatomía: selección de segmentos
  const esAnatomia = slug === 'anatomia';
  const [segmentos, setSegmentos] = useState<Set<string>>(new Set());

  const precioFinal = useMemo(() => {
    if (esAnatomia) return segmentos.size * PRECIO_POR_SEGMENTO_PEN;
    if (!data) return 0;
    if (typeof data.precio_promocional === 'number' && data.precio_promocional > 0 && data.precio_promocional < data.precio) {
      return data.precio_promocional;
    }
    return data.precio;
  }, [esAnatomia, segmentos, data]);

  const idPlataforma = useMemo(() => {
    // Mapear slug a id_plataforma. Las EXTRA (anatomia/cto) usan P-007/P-008 cuando estan en el Sheet,
    // si no, mandamos slug directamente y el backend lo busca.
    const id_local: Record<string, string> = {
      enam: 'P-001', encib: 'P-002', encaps: 'P-003', rm: 'P-004',
      essalud: 'P-005', biblioteca: 'P-006', anatomia: 'P-007', cto: 'P-008',
    };
    return id_local[slug ?? ''] ?? '';
  }, [slug]);

  const puedeProceder = !esAnatomia || segmentos.size > 0;
  const formError = validateForm(form);

  function onField(field: keyof FormData) {
    return (e: ChangeEvent<HTMLInputElement>) => {
      setForm((f) => ({ ...f, [field]: e.target.value }));
      setError(null);
    };
  }

  function onFileChange(e: ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0] ?? null;
    if (!f) { setVoucherFile(null); return; }
    const v = validateVoucherFile(f);
    if (!v.ok) {
      setError(v.error);
      setVoucherFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }
    setError(null);
    setVoucherFile(f);
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!data) return;
    if (formError) { setError(formError); return; }
    if (!puedeProceder) { setError('Selecciona al menos un segmento de Anatomía'); return; }
    if (!voucherFile) { setError('Sube tu voucher (jpg, png o pdf)'); return; }
    if (!idPlataforma) { setError('Plataforma no identificada'); return; }

    setError(null);

    // Detalle extra (segmentos para anatomía).
    const detalle_extra = esAnatomia
      ? { segmentos: SEGMENTOS_ANATOMIA.filter((s) => segmentos.has(s.id)).map((s) => s.id) }
      : undefined;

    // 1) Si aún no hemos registrado la compra → llamamos registrarCompra
    let idCompra = idCompraCreada;
    if (!idCompra) {
      setEnviando('registrando');
      const reg = await callApi<{ id_compra: string; id_usuario: string; message?: string }>(
        'registrarCompra',
        {
          nombre: form.nombre.trim(),
          correo: form.correo.trim(),
          whatsapp: form.whatsapp.trim(),
          id_plataforma: idPlataforma,
          metodo_pago: metodo,
          monto: precioFinal,
          detalle_extra,
        },
      );
      if (!reg.ok || !reg.data?.id_compra) {
        setEnviando(false);
        setError(reg.error || reg.message || 'No se pudo registrar tu compra.');
        return;
      }
      idCompra = reg.data.id_compra;
      setIdCompraCreada(idCompra);
    }

    // 2) Subir el voucher
    setEnviando('subiendo');
    try {
      const file = await fileToBase64(voucherFile);
      const up = await callApi<{ message?: string }>('subirVoucher', {
        id_compra: idCompra,
        archivo_base64: file.base64,
        tipo: file.mime,
        nombre: file.name,
      });
      setEnviando(false);
      if (!up.ok) {
        setError(up.error || up.message || 'No se pudo subir el voucher. La compra quedó registrada, intenta subir el voucher de nuevo.');
        return;
      }
      // Éxito total
      navigate(`/gracias?id=${idCompra}`);
    } catch (err) {
      setEnviando(false);
      const detalle = err instanceof Error ? err.message : 'Error desconocido';
      setError('Error al procesar archivo: ' + detalle);
    }
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 container-x py-12 md:py-16 max-w-3xl">
        {!data ? (
          <div>
            <h1 className="text-3xl">Plataforma no encontrada</h1>
            <Link to="/" className="btn-ghost mt-6">Volver al inicio</Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <span className="pill">Comprar acceso</span>
            <h1 className="mt-4 text-3xl sm:text-4xl">{data.nombre}</h1>
            <p className="mt-2 text-jungle-light">
              {esAnatomia
                ? `Cada segmento cuesta S/ ${PRECIO_POR_SEGMENTO_PEN} por 30 días. Elige uno o varios.`
                : `S/ ${precioFinal.toFixed(2)} por ${data.duracion_dias} días.`}
            </p>

            {esAnatomia && (
              <section className="mt-10">
                <h2 className="text-2xl">Paso 1 — Elige tus segmentos</h2>
                <p className="text-sm text-jungle-light mt-1">
                  Material por segmentos basado en Testut. Banco UNAP + 5 simulacros por segmento.
                </p>
                <div className="mt-4">
                  <AnatomiaSegmentos seleccionados={segmentos} onChange={setSegmentos} />
                </div>
              </section>
            )}

            <section className="mt-10">
              <h2 className="text-2xl">Paso {esAnatomia ? '2' : '1'} — Tus datos</h2>
              <div className="mt-4 bg-white border border-jungle/10 rounded-2xl p-6 shadow-card">
                <div className="grid gap-4 sm:grid-cols-2">
                  <input
                    className="border border-jungle/15 rounded-[10px] px-4 py-3 focus:outline-none focus:border-jungle"
                    placeholder="Nombre completo"
                    value={form.nombre}
                    onChange={onField('nombre')}
                    autoComplete="name"
                    required
                  />
                  <input
                    type="email"
                    className="border border-jungle/15 rounded-[10px] px-4 py-3 focus:outline-none focus:border-jungle"
                    placeholder="Correo"
                    value={form.correo}
                    onChange={onField('correo')}
                    autoComplete="email"
                    required
                  />
                  <input
                    type="tel"
                    className="border border-jungle/15 rounded-[10px] px-4 py-3 sm:col-span-2 focus:outline-none focus:border-jungle"
                    placeholder="WhatsApp (ej. 51974707622)"
                    value={form.whatsapp}
                    onChange={onField('whatsapp')}
                    autoComplete="tel"
                    required
                  />
                </div>
              </div>
            </section>

            <section className="mt-10">
              <h2 className="text-2xl">Paso {esAnatomia ? '3' : '2'} — Elige cómo pagar</h2>
              <div className="mt-4">
                <PagoOpciones selected={metodo} onSelect={setMetodo} />
              </div>
            </section>

            <section className="mt-10">
              <h2 className="text-2xl">Paso {esAnatomia ? '4' : '3'} — Paga y sube tu voucher</h2>

              {!puedeProceder ? (
                <div className="mt-4"><AvisoSeleccionar /></div>
              ) : (
                <>
                  <div className="mt-4">
                    {metodo === 'yape' && <YapeBlock priceInPEN={precioFinal} />}
                    {metodo === 'transferencia' && <BancoBlock priceInPEN={precioFinal} />}
                    {metodo === 'binance' && (
                      <PagarConCripto
                        priceInPEN={precioFinal}
                        note={`Binance Pay ID: ${BINANCE.payId}. Red: ${BINANCE.redes.join(' o ')}.`}
                      />
                    )}
                  </div>

                  <div className="mt-6 bg-white border border-jungle/10 rounded-2xl p-6 shadow-card">
                    <div className="font-semibold text-jungle">Sube tu voucher</div>
                    <p className="text-sm text-jungle-light mt-1">
                      JPG, PNG o PDF. Máximo 5 MB.
                    </p>

                    <label className="mt-4 block">
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/jpeg,image/jpg,image/png,application/pdf"
                        onChange={onFileChange}
                        className="block w-full text-sm text-jungle-light
                                   file:mr-3 file:py-2 file:px-4
                                   file:rounded-lg file:border-0
                                   file:bg-jungle file:text-lime file:font-semibold
                                   file:cursor-pointer
                                   hover:file:bg-jungle-dark"
                      />
                    </label>

                    {voucherFile && (
                      <div className="mt-3 inline-flex items-center gap-2 text-sm bg-cream px-3 py-2 rounded-lg border border-jungle/10">
                        <FileUp className="w-4 h-4 text-success" />
                        <span className="font-medium">{voucherFile.name}</span>
                        <span className="text-jungle-light">
                          ({(voucherFile.size / 1024).toFixed(0)} KB)
                        </span>
                      </div>
                    )}

                    {idCompraCreada && (
                      <div className="mt-4 text-sm bg-success/10 border border-success/30 rounded-lg px-3 py-2">
                        {enviando === 'subiendo' ? (
                          <>⏳ Compra <strong>{idCompraCreada}</strong> registrada. Subiendo tu voucher…</>
                        ) : error ? (
                          <>⚠️ Compra <strong>{idCompraCreada}</strong> registrada, pero el voucher no se subió. Vuelve a intentar (no se cobra de nuevo).</>
                        ) : (
                          <>✅ Compra <strong>{idCompraCreada}</strong> registrada. Confirma para subir tu voucher.</>
                        )}
                      </div>
                    )}

                    {error && (
                      <div className="mt-4 text-sm text-danger bg-danger/10 border border-danger/20 rounded-lg px-3 py-2">
                        {error}
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={!!enviando}
                      className="btn-primary mt-5 disabled:opacity-60"
                    >
                      {enviando === 'registrando' && (<><Loader2 className="w-4 h-4 animate-spin" /> Registrando…</>)}
                      {enviando === 'subiendo' && (<><Loader2 className="w-4 h-4 animate-spin" /> Subiendo voucher…</>)}
                      {!enviando && (idCompraCreada ? 'Reintentar subir voucher' : 'Confirmar solicitud')}
                    </button>
                  </div>
                </>
              )}
            </section>

            <div className="mt-10 flex items-center gap-4">
              <span className="h-px flex-1 bg-jungle/10" />
              <span className="text-jungle-light text-sm">o</span>
              <span className="h-px flex-1 bg-jungle/10" />
            </div>

            <div className="mt-6 text-center">
              <p className="text-jungle-light mb-3">Prefiero coordinar por WhatsApp</p>
              <WhatsAppButton
                message={`Hola, quiero comprar acceso a ${data.nombre} en SINAPSIS EDU. Total: S/ ${precioFinal.toFixed(2)}.`}
              />
            </div>
          </form>
        )}
      </main>
      <Footer />
    </div>
  );
}
