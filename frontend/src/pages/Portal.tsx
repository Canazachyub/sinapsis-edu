import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Clock, LogOut } from 'lucide-react';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { callApi } from '@/api/client';
import { useAuth } from '@/hooks/useAuth';

interface AccesoData {
  id_acceso: string;
  id_plataforma: string;
  plataforma: string;
  slug: string;
  fecha_inicio: string;
  fecha_fin: string;
  dias_restantes: number | null;
}

function venceColor(dias: number | null): string {
  if (dias === null) return 'text-jungle-light';
  if (dias <= 0) return 'text-danger';
  if (dias <= 7) return 'text-warning';
  return 'text-success';
}

function venceTexto(dias: number | null): string {
  if (dias === null) return 'sin fecha de vencimiento';
  if (dias < 0) return `vencido hace ${Math.abs(dias)} ${Math.abs(dias) === 1 ? 'día' : 'días'}`;
  if (dias === 0) return 'vence hoy';
  if (dias === 1) return 'vence mañana';
  return `vence en ${dias} días`;
}

export function Portal() {
  const { user, token, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const [accesos, setAccesos] = useState<AccesoData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated || !token) {
      navigate('/login', { replace: true });
      return;
    }
    let cancelled = false;
    callApi<AccesoData[]>('misAccesos', { token }).then((res) => {
      if (cancelled) return;
      setLoading(false);
      if (!res.ok) {
        const expired = (res.error || '').toLowerCase().includes('sesi');
        if (expired) {
          logout();
          navigate('/login', { replace: true });
          return;
        }
        setError(res.error || 'No se pudieron cargar los accesos');
        return;
      }
      setAccesos(res.data ?? []);
    });
    return () => { cancelled = true; };
  }, [isAuthenticated, token, navigate, logout]);

  function handleLogout() {
    logout();
    navigate('/login', { replace: true });
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 container-x py-16">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-4xl">Hola, {user?.nombre?.split(' ')[0] ?? 'alumno'} 👋</h1>
            <p className="mt-2 text-jungle-light">
              {loading
                ? 'Cargando tus accesos…'
                : accesos.length === 0
                  ? 'Aún no tienes accesos activos.'
                  : `Tienes ${accesos.length} ${accesos.length === 1 ? 'acceso activo' : 'accesos activos'}.`}
            </p>
          </div>
          <button onClick={handleLogout} className="btn-ghost !py-2 !px-4 text-sm">
            <LogOut className="w-4 h-4" /> Cerrar sesión
          </button>
        </div>

        {error && (
          <div className="mt-6 text-sm text-danger bg-danger/10 border border-danger/20 rounded-lg px-4 py-3">
            {error}
          </div>
        )}

        {!loading && accesos.length > 0 && (
          <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {accesos.map((a) => (
              <article
                key={a.id_acceso}
                className="bg-white border border-jungle/10 rounded-2xl p-6 shadow-card"
              >
                <div className="font-display text-2xl uppercase tracking-tight">{a.plataforma}</div>
                <div className={`mt-2 inline-flex items-center gap-1.5 text-sm font-medium ${venceColor(a.dias_restantes)}`}>
                  <Clock className="w-4 h-4" /> {venceTexto(a.dias_restantes)}
                </div>
                <Link to={`/aula/${a.slug}`} className="btn-primary w-full mt-5">
                  Entrar al aula
                </Link>
              </article>
            ))}
          </div>
        )}

        {!loading && accesos.length === 0 && !error && (
          <div className="mt-10 bg-white border border-jungle/10 rounded-2xl p-8 shadow-card text-center">
            <p className="text-jungle-light">Compra tu primer acceso para empezar a estudiar.</p>
            <Link to="/#plataformas" className="btn-primary mt-4">Ver plataformas</Link>
          </div>
        )}

        <Link
          to="/#plataformas"
          className="inline-block mt-10 text-jungle-light hover:text-jungle text-sm"
        >
          ¿Quieres más? → Ver todas las plataformas
        </Link>
      </main>
      <Footer />
    </div>
  );
}
