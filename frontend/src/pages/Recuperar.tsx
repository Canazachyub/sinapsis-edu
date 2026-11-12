/**
 * Destino del enlace de recuperación que envía el backend:
 *   https://sinapsisedu.com/#/recuperar?t=<token>
 * Consume el token (un solo uso, 30 min) con `confirmarRecuperacion`; el
 * backend genera la contraseña nueva y la envía por correo.
 */
import { useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { callApi } from '@/api/client';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';

type Estado =
  | { tipo: 'cargando' }
  | { tipo: 'ok'; correo?: string }
  | { tipo: 'error'; mensaje: string };

export function Recuperar() {
  useDocumentTitle('Recuperar contraseña');
  const [params] = useSearchParams();
  const token = params.get('t') ?? '';
  const [estado, setEstado] = useState<Estado>({ tipo: 'cargando' });
  // El token sirve una sola vez: evitar la doble llamada de StrictMode.
  const enviado = useRef(false);

  useEffect(() => {
    if (enviado.current) return;
    enviado.current = true;
    if (!/^[A-Za-z0-9]{40}$/.test(token)) {
      setEstado({ tipo: 'error', mensaje: 'El enlace no es válido. Pide uno nuevo desde "¿La olvidaste?".' });
      return;
    }
    callApi<{ correo?: string }>('confirmarRecuperacion', { token }).then((res) => {
      if (res.ok) setEstado({ tipo: 'ok', correo: res.data?.correo });
      else setEstado({ tipo: 'error', mensaje: res.error || res.message || 'No se pudo completar la recuperación.' });
    });
  }, [token]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-white px-6 py-16">
      <div className="w-full max-w-[420px]">
        <Link to="/login" className="inline-flex items-center gap-2 text-sm font-medium text-muted hover:text-ink">
          <ArrowLeft className="h-4 w-4" aria-hidden /> Ir a iniciar sesión
        </Link>
        <h1 className="mt-6 text-[32px] leading-tight">Recupera tu contraseña</h1>

        {estado.tipo === 'cargando' && (
          <p className="mt-6 inline-flex items-center gap-2 text-[15px] text-muted">
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> Generando tu contraseña nueva…
          </p>
        )}

        {estado.tipo === 'ok' && (
          <div className="mt-6 rounded-2xl border border-line bg-paper p-6">
            <p className="font-semibold text-ink">Revisa tu correo</p>
            <p className="mt-2 text-[15px] leading-relaxed text-muted">
              Te enviamos tu contraseña nueva{estado.correo ? <> a <span className="font-medium text-ink">{estado.correo}</span></> : null}.
              Revisa también la carpeta de spam.
            </p>
            <Link to="/login" className="btn-primary mt-5 inline-flex">
              Iniciar sesión
            </Link>
          </div>
        )}

        {estado.tipo === 'error' && (
          <div className="mt-6 space-y-5">
            <p role="alert" className="rounded-xl border border-wrong/20 bg-red-50 px-4 py-3 text-sm text-wrong">
              {estado.mensaje}
            </p>
            <Link to="/login" className="btn-primary inline-flex">
              Volver a iniciar sesión
            </Link>
          </div>
        )}
      </div>
    </main>
  );
}
