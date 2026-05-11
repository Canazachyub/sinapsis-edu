import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { LogOut } from 'lucide-react';
import { IframeViewer } from '@/components/IframeViewer';
import { callApi } from '@/api/client';
import { useAuth } from '@/hooks/useAuth';

export function Aula() {
  const { slug } = useParams<{ slug: string }>();
  const { token, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const [url, setUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated || !token) {
      navigate('/login', { replace: true });
      return;
    }
    if (!slug) {
      setError('Falta la plataforma');
      return;
    }
    let cancelled = false;
    callApi<{ url: string }>('obtenerUrlPlataforma', { token, slug }).then((res) => {
      if (cancelled) return;
      if (!res.ok || !res.data) {
        const expired = (res.error || '').toLowerCase().includes('sesi');
        if (expired) {
          logout();
          navigate('/login', { replace: true });
          return;
        }
        setError(res.error || 'No se pudo cargar la plataforma');
        return;
      }
      setUrl(res.data.url);
    });
    return () => { cancelled = true; };
  }, [slug, isAuthenticated, token, navigate, logout]);

  function handleLogout() {
    logout();
    navigate('/login', { replace: true });
  }

  return (
    <div className="min-h-screen flex flex-col">
      <header className="h-14 bg-jungle text-cream flex items-center justify-between px-5 shrink-0">
        <div className="flex items-center gap-3">
          <Link to="/portal" className="flex items-center gap-3 hover:opacity-80">
            <img src="/images/logo/logo-blanco.png" alt="SINAPSIS EDU" className="h-7 w-auto" />
          </Link>
          <span className="text-cream/40">|</span>
          <span className="uppercase text-sm font-medium text-lime">{slug}</span>
        </div>
        <div className="flex items-center gap-4">
          <Link to="/portal" className="text-sm text-cream/80 hover:text-lime">Mis accesos</Link>
          <button
            onClick={handleLogout}
            className="inline-flex items-center gap-2 text-sm text-cream hover:text-lime"
          >
            <LogOut className="w-4 h-4" /> Salir
          </button>
        </div>
      </header>

      {error && (
        <div className="container-x py-10">
          <div className="bg-danger/10 border border-danger/20 rounded-2xl p-6 text-center">
            <h2 className="text-2xl text-danger">No se pudo abrir el aula</h2>
            <p className="mt-2 text-jungle-light">{error}</p>
            <Link to="/portal" className="btn-ghost mt-6 inline-flex">Volver al portal</Link>
          </div>
        </div>
      )}

      {!error && !url && (
        <div className="flex-1 flex items-center justify-center text-jungle-light">
          Cargando plataforma…
        </div>
      )}

      {!error && url && <IframeViewer src={url} title={`Plataforma ${slug ?? ''}`} />}
    </div>
  );
}
