/**
 * Plan B: pago manual con voucher (Yape/Plin, transferencia BCP o Binance).
 * Flujo existente: registrarCompra → subirVoucher → /gracias?id=…
 * El admin revisa el voucher y aprueba desde el panel.
 */
import { useRef, useState, type ChangeEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Check, Copy, FileUp, Loader2 } from 'lucide-react';
import { PagoOpciones, type MetodoPago } from '@/components/PagoOpciones';
import { PagarConCripto } from '@/components/PagarConCripto';
import { callApi } from '@/api/client';
import { guardarCompraEnCurso } from '@/api/pagos';
import { BCP_SOLES, BINANCE, YAPE } from '@/config/pago';
import { fileToBase64, validateVoucherFile } from '@/utils/fileToBase64';

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
      className="inline-flex min-h-[36px] items-center gap-1.5 rounded-lg px-2 text-xs font-medium text-jungle-600 hover:text-jungle-800"
      aria-label={`Copiar ${label}`}
    >
      {copied ? <Check className="h-3.5 w-3.5 text-correct" aria-hidden /> : <Copy className="h-3.5 w-3.5" aria-hidden />}
      {copied ? 'Copiado' : 'Copiar'}
    </button>
  );
}

function Dato({ k, v, copiar, label }: { k: string; v: string; copiar: string; label: string }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-line bg-paper px-3 py-2">
      <div className="min-w-0">
        <div className="text-[11px] font-semibold uppercase tracking-wide text-muted">{k}</div>
        <div className="break-all font-mono text-sm font-semibold text-ink">{v}</div>
      </div>
      <CopyButton value={copiar} label={label} />
    </div>
  );
}

function YapeBlock({ monto }: { monto: number }) {
  const [imgFailed, setImgFailed] = useState(false);
  return (
    <div className="grid items-start gap-5 sm:grid-cols-2">
      <div className="mx-auto w-full max-w-[260px] rounded-2xl bg-jungle-900 p-3">
        {!imgFailed ? (
          <img
            src={YAPE.qrImage}
            alt="Código QR de Yape de SINAPSIS EDU"
            className="aspect-square w-full rounded-lg bg-white object-contain"
            onError={() => setImgFailed(true)}
          />
        ) : (
          <div className="flex aspect-square items-center justify-center rounded-lg bg-white px-4 text-center text-xs text-muted">
            QR no disponible. Usa el número.
          </div>
        )}
      </div>
      <div className="space-y-3">
        <div>
          <div className="text-xs font-semibold uppercase tracking-wide text-muted">Titular</div>
          <div className="font-semibold text-ink">{YAPE.titular}</div>
        </div>
        <Dato k="Número Yape / Plin" v={YAPE.numero} copiar={YAPE.numeroPlano} label="número Yape" />
        <ol className="list-decimal space-y-1 pl-5 text-sm text-muted">
          <li>Escanea el QR o usa el número.</li>
          <li>Envía exactamente <strong className="text-ink">S/ {monto.toFixed(2)}</strong>.</li>
          <li>Toma captura del comprobante y súbela abajo.</li>
        </ol>
      </div>
    </div>
  );
}

function BancoBlock({ monto }: { monto: number }) {
  return (
    <div className="space-y-3">
      <div>
        <div className="text-xs font-semibold uppercase tracking-wide text-muted">Titular</div>
        <div className="font-semibold text-ink">{BCP_SOLES.titular}</div>
        <div className="text-sm text-muted">{BCP_SOLES.banco} · Cuenta en soles</div>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <Dato k="Cuenta BCP" v={BCP_SOLES.cuenta} copiar={BCP_SOLES.cuenta.replace(/\s/g, '')} label="cuenta BCP" />
        <Dato k="Interbancaria (CCI)" v={BCP_SOLES.interbancaria} copiar={BCP_SOLES.interbancaria.replace(/\s/g, '')} label="CCI" />
      </div>
      <p className="text-sm text-muted">
        Transfiere exactamente <strong className="text-ink">S/ {monto.toFixed(2)}</strong> y sube el comprobante abajo.
      </p>
    </div>
  );
}

export interface DatosComprador {
  nombre: string;
  correo: string;
  whatsapp: string;
}

interface Props {
  slug: string;
  idPlataforma: string;
  monto: number;
  datos: DatosComprador;
  detalleExtra?: Record<string, unknown>;
  onVolver: () => void;
}

export function PagoVoucher({ slug, idPlataforma, monto, datos, detalleExtra, onVolver }: Props) {
  const navigate = useNavigate();
  const [metodo, setMetodo] = useState<MetodoPago>('yape');
  const [voucherFile, setVoucherFile] = useState<File | null>(null);
  const [enviando, setEnviando] = useState<false | 'registrando' | 'subiendo'>(false);
  const [error, setError] = useState<string | null>(null);
  const [idCompraCreada, setIdCompraCreada] = useState<string | null>(null);
  // Token que devuelve registrarCompra: el backend lo exige para subir el voucher.
  const [uploadToken, setUploadToken] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function onFileChange(e: ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0] ?? null;
    if (!f) {
      setVoucherFile(null);
      return;
    }
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

  async function enviar() {
    if (!voucherFile) {
      setError('Sube tu comprobante (jpg, png o pdf).');
      return;
    }
    if (!idPlataforma) {
      setError('Plataforma no identificada.');
      return;
    }
    setError(null);

    let idCompra = idCompraCreada;
    let token = uploadToken;
    if (!idCompra || !token) {
      setEnviando('registrando');
      const reg = await callApi<{ id_compra: string; upload_token: string }>('registrarCompra', {
        nombre: datos.nombre.trim(),
        correo: datos.correo.trim(),
        whatsapp: datos.whatsapp.trim(),
        id_plataforma: idPlataforma,
        metodo_pago: metodo,
        monto,
        detalle_extra: detalleExtra,
      });
      if (!reg.ok || !reg.data?.id_compra || !reg.data.upload_token) {
        setEnviando(false);
        setError(reg.message || reg.error || 'No se pudo registrar tu compra.');
        return;
      }
      idCompra = reg.data.id_compra;
      token = reg.data.upload_token;
      setIdCompraCreada(idCompra);
      setUploadToken(token);
      guardarCompraEnCurso({ id_compra: idCompra, correo: datos.correo.trim().toLowerCase(), slug });
    }

    setEnviando('subiendo');
    try {
      const file = await fileToBase64(voucherFile);
      const up = await callApi('subirVoucher', {
        id_compra: idCompra,
        upload_token: token,
        archivo_base64: file.base64,
        tipo: file.mime,
        nombre: file.name,
      });
      setEnviando(false);
      if (!up.ok) {
        setError(up.message || up.error || 'No se pudo subir el comprobante. Tu compra quedó registrada: intenta subirlo de nuevo.');
        return;
      }
      navigate(`/gracias?id=${encodeURIComponent(idCompra)}`);
    } catch (err) {
      setEnviando(false);
      setError('Error al leer el archivo: ' + (err instanceof Error ? err.message : 'desconocido'));
    }
  }

  return (
    <div className="space-y-6">
      <button type="button" onClick={onVolver} className="inline-flex min-h-[44px] items-center gap-2 text-sm font-semibold text-jungle-600 hover:text-jungle-800">
        <ArrowLeft className="h-4 w-4" aria-hidden /> Volver al pago con tarjeta o Yape
      </button>

      <div>
        <h2 className="text-2xl">Pagar con voucher</h2>
        <p className="mt-1 text-[15px] text-muted">
          Paga por tu cuenta, sube el comprobante y activamos tu acceso
          en cuanto lo verificamos.
        </p>
      </div>

      <div>
        <div className="mb-2 text-sm font-semibold text-ink">1. Elige cómo pagar</div>
        <PagoOpciones selected={metodo} onSelect={setMetodo} />
      </div>

      <div className="card p-5">
        <div className="mb-4 flex items-baseline justify-between gap-3">
          <div className="text-sm font-semibold text-ink">2. Paga</div>
          <div className="tabular font-display text-2xl font-extrabold text-ink">S/ {monto.toFixed(2)}</div>
        </div>
        {metodo === 'yape' && <YapeBlock monto={monto} />}
        {metodo === 'transferencia' && <BancoBlock monto={monto} />}
        {metodo === 'binance' && (
          <PagarConCripto priceInPEN={monto} note={`Binance Pay ID: ${BINANCE.payId}. Red: ${BINANCE.redes.join(' o ')}.`} />
        )}
      </div>

      <div className="card p-5">
        <label htmlFor="voucher" className="text-sm font-semibold text-ink">3. Sube tu comprobante</label>
        <p className="mt-1 text-sm text-muted">JPG, PNG o PDF. Máximo 5 MB.</p>
        <input
          id="voucher"
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/jpg,image/png,application/pdf"
          onChange={onFileChange}
          className="mt-3 block w-full text-sm text-muted file:mr-3 file:min-h-[44px] file:cursor-pointer file:rounded-xl file:border-0 file:bg-jungle-800 file:px-4 file:font-semibold file:text-white hover:file:bg-jungle-600"
        />
        {voucherFile && (
          <div className="mt-3 inline-flex max-w-full items-center gap-2 rounded-lg border border-line bg-paper px-3 py-2 text-sm">
            <FileUp className="h-4 w-4 shrink-0 text-correct" aria-hidden />
            <span className="truncate font-medium">{voucherFile.name}</span>
            <span className="shrink-0 text-muted">({(voucherFile.size / 1024).toFixed(0)} KB)</span>
          </div>
        )}
        {idCompraCreada && error && (
          <p className="mt-3 text-sm text-muted">
            Tu compra <strong className="text-ink">{idCompraCreada}</strong> ya está registrada; solo falta el comprobante.
          </p>
        )}
        {error && (
          <div role="alert" className="mt-3 rounded-lg border border-wrong/20 bg-wrong/5 px-3 py-2 text-sm text-wrong">
            {error}
          </div>
        )}
        <button type="button" onClick={enviar} disabled={!!enviando} className="btn-primary mt-5 w-full disabled:opacity-60 sm:w-auto">
          {enviando === 'registrando' && (<><Loader2 className="h-4 w-4 animate-spin" aria-hidden /> Registrando…</>)}
          {enviando === 'subiendo' && (<><Loader2 className="h-4 w-4 animate-spin" aria-hidden /> Subiendo comprobante…</>)}
          {!enviando && (idCompraCreada ? 'Reintentar subir comprobante' : 'Enviar comprobante')}
        </button>
      </div>
    </div>
  );
}
