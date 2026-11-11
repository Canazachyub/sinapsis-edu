/**
 * Pantallas de resultado del pago (paso 3 de Compra y página Gracias).
 */
import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, ArrowRight, CheckCircle2, Clock, Loader2, Mail, RotateCcw, XCircle } from 'lucide-react';
import { WhatsAppButton } from '@/components/WhatsAppButton';
import { fechaPeru } from '@/api/pagos';
import { simulacroHref } from '@/config';

type Tono = 'ok' | 'error' | 'espera';

function Encabezado({ tono, titulo, children }: { tono: Tono; titulo: string; children?: ReactNode }) {
  const Icon = tono === 'ok' ? CheckCircle2 : tono === 'error' ? XCircle : Clock;
  const color = tono === 'ok' ? 'bg-correct/10 text-correct' : tono === 'error' ? 'bg-wrong/10 text-wrong' : 'bg-warning/10 text-warning';
  return (
    <div className="text-center sm:text-left">
      <div className={`inline-flex h-14 w-14 items-center justify-center rounded-full ${color}`}>
        <Icon className="h-7 w-7" aria-hidden />
      </div>
      <h2 className="mt-4 text-[28px] leading-tight sm:text-[32px]">{titulo}</h2>
      {children && <div className="mt-2 text-[16px] leading-relaxed text-muted">{children}</div>}
    </div>
  );
}

export function ResultadoAprobado({
  plataforma, fechaFin, correo, passwordEnviada, idCompra, slug, sesionIniciada,
}: {
  plataforma: string; fechaFin: string; correo?: string; passwordEnviada?: boolean; idCompra?: string;
  /** Para el botón directo al simulacro de esa plataforma. */
  slug?: string;
  /** El servidor abrió la sesión automáticamente: el alumno ya está dentro. */
  sesionIniciada?: boolean;
}) {
  const simulacro = slug ? simulacroHref(slug, 'registro') : null;
  return (
    <div className="space-y-6" aria-live="polite">
      <div className="flex flex-col items-center gap-5 text-center sm:flex-row sm:text-left">
        <img
          src={`${import.meta.env.BASE_URL}images/flujo/pago-aprobado.webp`}
          alt=""
          width={112}
          height={112}
          className="h-28 w-28 shrink-0 rounded-2xl bg-jungle-900"
          onError={(e) => { e.currentTarget.style.display = 'none'; }}
        />
        <div>
          <h2 className="text-[28px] leading-tight sm:text-[32px]">
            {sesionIniciada ? '¡Bienvenido! Ya estás dentro' : '¡Listo! Tu pago fue aprobado'}
          </h2>
          <p className="mt-2 text-[16px] leading-relaxed text-muted">
            Tienes acceso a <strong className="text-ink">{plataforma}</strong> hasta el{' '}
            <strong className="tabular text-ink">{fechaPeru(fechaFin)}</strong>.
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        {sesionIniciada ? (
          <>
            <Link to="/portal" className="btn-primary text-base">
              Empezar a estudiar <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
            {simulacro && <a href={simulacro} className="btn-secondary">Rendir un simulacro</a>}
          </>
        ) : (
          <>
            <Link to="/login" className="btn-primary text-base">
              Iniciar sesión <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
            <Link to="/portal" className="btn-secondary">Ir al Portal</Link>
          </>
        )}
      </div>

      <ol className="divide-y divide-line rounded-2xl border border-line bg-white">
        <li className="flex gap-3 p-4">
          <Mail className="mt-0.5 h-5 w-5 shrink-0 text-jungle-600" aria-hidden />
          <div className="text-[15px]">
            <div className="font-semibold text-ink">
              {sesionIniciada ? 'Guarda tu contraseña para la próxima vez' : 'Revisa tu correo'}
            </div>
            <div className="text-muted">
              {passwordEnviada === true && (
                <>Te enviamos tu usuario y contraseña{correo ? <> a <strong className="break-all text-ink">{correo}</strong></> : ''}. Revisa también Spam o Promociones.</>
              )}
              {passwordEnviada === false && (
                <>Tus datos de acceso están en tu correo{correo ? <> <strong className="break-all text-ink">{correo}</strong></> : ''} (revisa también Spam). Si ya tenías cuenta, usa tu misma contraseña.</>
              )}
              {passwordEnviada === undefined && (
                <>Te enviamos un correo con tus datos de acceso. Revisa también Spam o Promociones.</>
              )}
            </div>
          </div>
        </li>
        <li className="flex gap-3 p-4">
          <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-jungle-600" aria-hidden />
          <div className="text-[15px]">
            <div className="font-semibold text-ink">Todo en tu Portal</div>
            <div className="text-muted">Ahí ves tus accesos, los días que te quedan y entras al simulacro o al aula.</div>
          </div>
        </li>
      </ol>
      {idCompra && <p className="text-xs text-subtle">Código de compra: <span className="font-mono">{idCompra}</span></p>}
    </div>
  );
}

export function ResultadoRechazado({
  mensaje, onReintentar, onVoucher, plataforma,
}: { mensaje: string; onReintentar?: () => void; onVoucher?: () => void; plataforma?: string }) {
  return (
    <div className="space-y-6" aria-live="assertive">
      <Encabezado tono="error" titulo="Tu pago no se completó">
        <span className="font-medium text-ink">{mensaje}</span>
        <span className="mt-1 block">No se realizó ningún cobro. Puedes intentarlo de nuevo.</span>
      </Encabezado>
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
        {onReintentar && (
          <button type="button" onClick={onReintentar} className="btn-primary">
            <RotateCcw className="h-4 w-4" aria-hidden /> Reintentar
          </button>
        )}
        {onVoucher && (
          <button type="button" onClick={onVoucher} className="btn-secondary">Pagar por voucher</button>
        )}
        <WhatsAppButton
          label="Ayuda por WhatsApp"
          message={`Hola, intenté pagar${plataforma ? ` ${plataforma}` : ''} con tarjeta o Yape y no se completó.`}
        />
      </div>
    </div>
  );
}

export function ResultadoEnProceso({
  onConsultar, consultando, idCompra, titulo, texto,
}: { onConsultar?: () => void; consultando?: boolean; idCompra?: string; titulo?: string; texto?: ReactNode }) {
  return (
    <div className="space-y-6" aria-live="polite">
      <Encabezado tono="espera" titulo={titulo ?? 'Estamos confirmando tu pago'}>
        {texto ?? (
          <>No pudimos confirmar el resultado todavía. <strong className="text-ink">No vuelvas a pagar.</strong>{' '}
          Si el pago se realizó, tu acceso se activa solo y te avisamos por correo.</>
        )}
      </Encabezado>
      <div className="flex flex-col gap-3 sm:flex-row">
        {onConsultar && (
          <button type="button" onClick={onConsultar} disabled={consultando} className="btn-primary disabled:opacity-60">
            {consultando ? <><Loader2 className="h-4 w-4 animate-spin" aria-hidden /> Consultando…</> : 'Consultar de nuevo'}
          </button>
        )}
        <WhatsAppButton
          label="Escribir por WhatsApp"
          message={`Hola, quiero confirmar el estado de mi compra${idCompra ? ` ${idCompra}` : ''}.`}
        />
      </div>
      {idCompra && <p className="text-xs text-subtle">Código de compra: <span className="font-mono">{idCompra}</span></p>}
    </div>
  );
}

export function AvisoSuave({ children }: { children: ReactNode }) {
  return (
    <div role="status" className="flex items-start gap-3 rounded-xl border border-warning/30 bg-warning/5 p-4 text-[15px] text-ink">
      <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-warning" aria-hidden />
      <div>{children}</div>
    </div>
  );
}
