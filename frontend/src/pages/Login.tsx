import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { WhatsAppButton } from '@/components/WhatsAppButton';
import { callApi } from '@/api/client';
import { useAuth } from '@/hooks/useAuth';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';

interface LoginResponse {
  token: string;
  usuario: { nombre: string; correo: string };
}

export function Login() {
  useDocumentTitle('Iniciar sesión');
  const [correo, setCorreo] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Recuperación de contraseña (self-service por correo).
  const [recoverOpen, setRecoverOpen] = useState(false);
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

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 container-x py-20 max-w-md mx-auto">
        <span className="pill">Acceso alumno</span>
        <h1 className="mt-4 text-4xl">Inicia sesión</h1>
        <p className="mt-2 text-jungle-light">Ingresa con las credenciales que te enviamos por correo.</p>

        <form
          onSubmit={handleSubmit}
          className="mt-8 bg-white border border-jungle/10 rounded-2xl p-6 shadow-card flex flex-col gap-4"
        >
          <input
            type="email"
            placeholder="Correo"
            value={correo}
            onChange={(e) => setCorreo(e.target.value)}
            autoComplete="email"
            required
            className="border border-jungle/15 rounded-[10px] px-4 py-3 focus:outline-none focus:border-jungle"
          />
          <input
            type="password"
            placeholder="Contraseña"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            required
            className="border border-jungle/15 rounded-[10px] px-4 py-3 focus:outline-none focus:border-jungle"
          />
          {error && (
            <div className="text-sm text-danger bg-danger/10 border border-danger/20 rounded-lg px-3 py-2">
              {error}
            </div>
          )}
          <button type="submit" className="btn-primary disabled:opacity-60" disabled={loading}>
            {loading ? 'Entrando…' : 'Entrar'}
          </button>
          <button
            type="button"
            onClick={() => { setRecoverOpen((v) => !v); setRecoverDone(false); }}
            className="text-sm text-jungle-light hover:text-jungle text-center"
          >
            ¿Olvidaste tu contraseña?
          </button>
        </form>

        {/* Recuperación de contraseña self-service */}
        {recoverOpen && (
          <div className="mt-4 bg-white border border-jungle/10 rounded-2xl p-6 shadow-card">
            {recoverDone ? (
              <div className="text-sm text-jungle">
                <p className="font-semibold">Listo ✅</p>
                <p className="mt-1 text-jungle-light">
                  Si el correo está registrado, te enviamos una nueva contraseña. Revisa tu bandeja
                  (y spam). ¿No llega? Escríbenos por WhatsApp.
                </p>
                <div className="mt-3">
                  <WhatsAppButton
                    message="Hola, pedí recuperar mi contraseña del Portal y no me llega el correo."
                    label="Escribir por WhatsApp"
                    className="!py-1.5 !px-3 !text-xs"
                  />
                </div>
              </div>
            ) : (
              <form onSubmit={handleRecover} className="flex flex-col gap-3">
                <p className="text-sm text-jungle-light">
                  Ingresa tu correo y te enviaremos una nueva contraseña.
                </p>
                <input
                  type="email"
                  placeholder="Tu correo registrado"
                  value={recoverCorreo}
                  onChange={(e) => setRecoverCorreo(e.target.value)}
                  required
                  className="border border-jungle/15 rounded-[10px] px-4 py-3 focus:outline-none focus:border-jungle"
                />
                <button type="submit" className="btn-primary disabled:opacity-60" disabled={recoverLoading}>
                  {recoverLoading ? 'Enviando…' : 'Enviar nueva contraseña'}
                </button>
              </form>
            )}
          </div>
        )}

        {/* CTA para usuarios nuevos */}
        <div className="mt-6 bg-cream border border-jungle/10 rounded-2xl p-5 text-center">
          <p className="text-sm text-jungle-light">¿Aún no tienes acceso?</p>
          <Link to="/" className="btn-ghost mt-3 inline-flex justify-center">
            Elige tu plataforma
          </Link>
        </div>

        <div className="mt-6 text-center text-sm text-jungle-light">
          <div>¿Problemas para entrar?</div>
          <div className="mt-3">
            <WhatsAppButton message="Hola Yubert, no puedo entrar a mi cuenta del Portal Central." />
          </div>
        </div>

        <Link to="/" className="block text-center mt-6 text-sm text-jungle-light hover:text-jungle">
          ← Volver al inicio
        </Link>
      </main>
      <Footer />
    </div>
  );
}
