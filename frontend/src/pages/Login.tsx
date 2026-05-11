import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { WhatsAppButton } from '@/components/WhatsAppButton';
import { callApi } from '@/api/client';
import { useAuth } from '@/hooks/useAuth';

interface LoginResponse {
  token: string;
  usuario: { nombre: string; correo: string };
}

export function Login() {
  const [correo, setCorreo] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
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

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 container-x py-20 max-w-md mx-auto">
        <span className="pill">Acceso alumno</span>
        <h1 className="mt-4 text-4xl">Inicia sesión</h1>
        <p className="mt-2 text-jungle-light">Ingresa con tus credenciales del Portal Central.</p>

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
        </form>

        <div className="mt-6 text-center text-sm text-jungle-light">
          <div>¿Olvidaste tu acceso?</div>
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
