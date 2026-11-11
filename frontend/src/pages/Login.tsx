import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Check, Eye, EyeOff, MessageCircle } from 'lucide-react';
import { callApi } from '@/api/client';
import { useAuth } from '@/hooks/useAuth';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { config } from '@/config';

interface LoginResponse {
  token: string;
  usuario: { nombre: string; correo: string };
}

const INPUT =
  'w-full rounded-xl border border-line bg-white px-4 py-3 text-[15px] text-ink placeholder:text-subtle ' +
  'outline-none transition focus:border-jungle-600 focus:ring-4 focus:ring-jungle-100';

function waHref(texto: string) {
  return `https://wa.me/${config.whatsappNumber}?text=${encodeURIComponent(texto)}`;
}

export function Login() {
  useDocumentTitle('Iniciar sesión');
  const [modo, setModo] = useState<'login' | 'recuperar'>('login');

  const [correo, setCorreo] = useState('');
  const [password, setPassword] = useState('');
  const [verPass, setVerPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [recoverCorreo, setRecoverCorreo] = useState('');
  const [recoverLoading, setRecoverLoading] = useState(false);
  const [recoverDone, setRecoverDone] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const res = await callApi<LoginResponse>('loginAlumno', { correo, password });
    setLoading(false);
    if (!res.ok || !res.data) {
      setError(res.error || res.message || 'No se pudo iniciar sesión');
      return;
    }
    login(res.data.token, res.data.usuario);
    navigate('/portal');
  }

  async function handleRecover(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setRecoverLoading(true);
    await callApi('recuperarPassword', { correo: recoverCorreo });
    setRecoverLoading(false);
    // Mensaje genérico siempre (no revelamos si el correo existe).
    setRecoverDone(true);
  }

  function irARecuperar() {
    setRecoverCorreo(correo);
    setRecoverDone(false);
    setModo('recuperar');
  }

  return (
    <div className="grid min-h-screen lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
      {/* Panel de marca */}
      <aside className="relative isolate hidden overflow-hidden bg-jungle-900 p-12 text-white lg:flex lg:flex-col">
        <div
          className="absolute inset-0 -z-10 opacity-70"
          style={{
            backgroundImage:
              'radial-gradient(circle at 1px 1px, rgba(194,228,118,0.16) 1px, transparent 0), radial-gradient(700px 420px at 80% 20%, rgba(31,91,82,0.75), transparent 70%)',
            backgroundSize: '26px 26px, auto',
          }}
          aria-hidden
        />
        <Link to="/" className="inline-flex">
          <img src="/images/logo/logo-blanco-transparente.png" alt="SINAPSIS EDU" className="h-10 w-auto" />
        </Link>

        <div className="mt-auto max-w-md">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-lime-400">Acceso alumno</p>
          <h2 className="mt-4 text-4xl leading-tight !text-white">Retoma tu preparación donde la dejaste.</h2>
          <ul className="mt-8 space-y-3 text-[15px] text-white/75">
            {['Tus bancos y simulacros en un solo lugar', 'Accesos activos y fecha de vencimiento', 'Celular, tablet o computadora'].map((t) => (
              <li key={t} className="flex items-center gap-3">
                <span className="grid h-5 w-5 place-items-center rounded-full border border-lime-400/50 text-lime-400">
                  <Check className="h-3 w-3" strokeWidth={3} aria-hidden />
                </span>
                {t}
              </li>
            ))}
          </ul>
        </div>
        <p className="mt-12 text-xs text-white/40">© {new Date().getFullYear()} SINAPSIS EDU</p>
      </aside>

      {/* Formulario */}
      <main className="flex flex-col bg-white">
        <div className="flex items-center justify-between px-6 py-5 md:px-10">
          <Link to="/" className="inline-flex items-center gap-2 text-sm font-medium text-muted hover:text-ink">
            <ArrowLeft className="h-4 w-4" aria-hidden /> Volver al inicio
          </Link>
          <Link to="/" className="lg:hidden">
            <img src="/images/logo/logo.png" alt="SINAPSIS EDU" className="h-8 w-auto" />
          </Link>
        </div>

        <div className="flex flex-1 items-center justify-center px-6 pb-16 md:px-10">
          <div className="w-full max-w-[400px]">
            {modo === 'login' ? (
              <>
                <h1 className="text-[32px] leading-tight">Inicia sesión</h1>
                <p className="mt-2 text-[15px] text-muted">
                  Usa el correo con el que compraste y la contraseña que te enviamos.
                </p>

                <form onSubmit={handleSubmit} className="mt-8 space-y-5">
                  <div>
                    <label htmlFor="correo" className="mb-1.5 block text-sm font-semibold text-ink">Correo</label>
                    <input
                      id="correo"
                      type="email"
                      placeholder="tucorreo@ejemplo.com"
                      value={correo}
                      onChange={(e) => setCorreo(e.target.value)}
                      autoComplete="email"
                      required
                      className={INPUT}
                    />
                  </div>
                  <div>
                    <div className="mb-1.5 flex items-center justify-between">
                      <label htmlFor="password" className="block text-sm font-semibold text-ink">Contraseña</label>
                      <button type="button" onClick={irARecuperar} className="text-sm font-medium text-jungle-600 hover:text-jungle-800">
                        ¿La olvidaste?
                      </button>
                    </div>
                    <div className="relative">
                      <input
                        id="password"
                        type={verPass ? 'text' : 'password'}
                        placeholder="••••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        autoComplete="current-password"
                        required
                        className={`${INPUT} pr-12`}
                      />
                      <button
                        type="button"
                        onClick={() => setVerPass((v) => !v)}
                        aria-label={verPass ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                        className="absolute inset-y-0 right-0 grid w-12 place-items-center text-subtle hover:text-ink"
                      >
                        {verPass ? <EyeOff className="h-[18px] w-[18px]" /> : <Eye className="h-[18px] w-[18px]" />}
                      </button>
                    </div>
                  </div>

                  {error && (
                    <p role="alert" className="rounded-xl border border-wrong/20 bg-red-50 px-4 py-3 text-sm text-wrong">
                      {error}
                    </p>
                  )}

                  <button type="submit" className="btn-primary w-full disabled:opacity-60" disabled={loading}>
                    {loading ? 'Entrando…' : 'Entrar'}
                  </button>
                </form>

                <div className="mt-10 border-t border-line pt-6 text-[15px] text-muted">
                  ¿Aún no tienes acceso?{' '}
                  <Link to="/" state={{ scrollTo: 'plataformas' }} className="font-semibold text-jungle-600 hover:text-jungle-800">
                    Elige tu plataforma
                  </Link>
                </div>
                <div className="mt-3 text-[15px] text-muted">
                  ¿Problemas para entrar?{' '}
                  <a
                    href={waHref('Hola, no puedo entrar a mi cuenta de SINAPSIS EDU.')}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 font-semibold text-jungle-600 hover:text-jungle-800"
                  >
                    <MessageCircle className="h-4 w-4 text-whatsapp" aria-hidden /> Escríbenos por WhatsApp
                  </a>
                </div>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => setModo('login')}
                  className="inline-flex items-center gap-2 text-sm font-medium text-muted hover:text-ink"
                >
                  <ArrowLeft className="h-4 w-4" aria-hidden /> Volver a iniciar sesión
                </button>
                <h1 className="mt-6 text-[32px] leading-tight">Recupera tu contraseña</h1>

                {recoverDone ? (
                  <div className="mt-6 rounded-2xl border border-line bg-paper p-6">
                    <p className="font-semibold text-ink">Revisa tu correo</p>
                    <p className="mt-2 text-[15px] leading-relaxed text-muted">
                      Si <span className="font-medium text-ink">{recoverCorreo}</span> está registrado, te enviamos una
                      nueva contraseña. Revisa también la carpeta de spam.
                    </p>
                    <div className="mt-5 flex flex-wrap gap-3">
                      <button type="button" onClick={() => setModo('login')} className="btn-primary">
                        Iniciar sesión
                      </button>
                      <a
                        href={waHref('Hola, pedí recuperar mi contraseña de SINAPSIS EDU y no me llega el correo.')}
                        target="_blank"
                        rel="noreferrer"
                        className="btn-secondary"
                      >
                        No me llegó
                      </a>
                    </div>
                  </div>
                ) : (
                  <>
                    <p className="mt-2 text-[15px] text-muted">
                      Escribe el correo de tu cuenta y te enviaremos una contraseña nueva.
                    </p>
                    <form onSubmit={handleRecover} className="mt-8 space-y-5">
                      <div>
                        <label htmlFor="recuperar" className="mb-1.5 block text-sm font-semibold text-ink">Correo</label>
                        <input
                          id="recuperar"
                          type="email"
                          placeholder="tucorreo@ejemplo.com"
                          value={recoverCorreo}
                          onChange={(e) => setRecoverCorreo(e.target.value)}
                          autoComplete="email"
                          required
                          className={INPUT}
                        />
                      </div>
                      <button type="submit" className="btn-primary w-full disabled:opacity-60" disabled={recoverLoading}>
                        {recoverLoading ? 'Enviando…' : 'Enviar nueva contraseña'}
                      </button>
                    </form>
                  </>
                )}
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
