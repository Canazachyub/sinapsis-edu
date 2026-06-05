import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Clock, LogOut, AlertCircle, CheckCircle2, XCircle, RefreshCw } from 'lucide-react';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { WhatsAppButton } from '@/components/WhatsAppButton';
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

interface SolicitudData {
  id_compra: string;
  plataforma: string;
  slug: string;
  monto: number;
  metodo_pago: string;
  fecha_solicitud: string;
  estado_pago: 'pendiente' | 'aprobado' | 'rechazado';
  estado_acceso: string;
  fecha_fin: string;
}

function venceColor(dias: number | null): string {
  if (dias === null) return 'text-jungle-light';
  if (dias <= 0) return 'text-danger';
  if (dias <= 7) return 'text-warning';
  return 'text-success';
}

function venceTexto(dias: number | null): string {
  if (dias === null) return 'sin fecha';
  if (dias < 0) return `vencido hace ${Math.abs(dias)} ${Math.abs(dias) === 1 ? 'día' : 'días'}`;
  if (dias === 0) return 'vence hoy';
  if (dias === 1) return 'vence mañana';
  return `vence en ${dias} días`;
}

export function Portal() {
  const { user, token, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  const [accesos, setAccesos] = useState<AccesoData[]>([]);
  const [solicitudes, setSolicitudes] = useState<SolicitudData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  function handleSessionExpired() {
    logout();
    navigate('/login', { replace: true });
  }

  useEffect(() => {
    if (!isAuthenticated || !token) {
      navigate('/login', { replace: true });
      return;
    }
    let cancelled = false;

    async function fetchAll() {
      const [resAccesos, resSolicitudes] = await Promise.all([
        callApi<AccesoData[]>('misAccesos', { token }),
        callApi<SolicitudData[]>('misSolicitudes', { token }),
      ]);
      if (cancelled) return;
      setLoading(false);

      if (!resAccesos.ok) {
        if ((resAccesos.error || '').toLowerCase().includes('sesi')) { handleSessionExpired(); return; }
        setError(resAccesos.error || 'No se pudieron cargar los accesos');
        return;
      }
      setAccesos(resAccesos.data ?? []);

      if (resSolicitudes.ok && resSolicitudes.data) {
        const noActivas = resSolicitudes.data.filter(
          (s) => s.estado_pago !== 'aprobado' || s.estado_acceso !== 'activo',
        );
        setSolicitudes(noActivas);
      }
    }

    fetchAll();
    return () => { cancelled = true; };
  }, [isAuthenticated, token]); // eslint-disable-line react-hooks/exhaustive-deps

  function handleLogout() {
    logout();
    navigate('/login', { replace: true });
  }

  const pendientes = solicitudes.filter((s) => s.estado_pago === 'pendiente');
  const rechazadas = solicitudes.filter((s) => s.estado_pago === 'rechazado');

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 container-x py-16">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-4xl">Hola, {user?.nombre?.split(' ')[0] ?? 'alumno'} 👋</h1>
            <p className="mt-2 text-jungle-light">
              {loading
                ? 'Cargando tu portal…'
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

        {/* ── Accesos activos ── */}
        {!loading && accesos.length > 0 && (
          <section className="mt-10">
            <h2 className="text-2xl mb-5 flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-success" /> Mis accesos activos
            </h2>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
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
          </section>
        )}

        {/* ── Solicitudes en revisión ── */}
        {!loading && pendientes.length > 0 && (
          <section className="mt-12">
            <h2 className="text-2xl mb-5 flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-warning" /> En revisión
            </h2>
            <div className="flex flex-col gap-3">
              {pendientes.map((s) => (
                <div
                  key={s.id_compra}
                  className="bg-white border border-warning/20 rounded-2xl p-5 shadow-card flex flex-wrap items-center justify-between gap-4"
                >
                  <div>
                    <div className="font-semibold">{s.plataforma}</div>
                    <div className="text-sm text-jungle-light mt-1">
                      Solicitud {s.id_compra} · {s.fecha_solicitud.slice(0, 10)} · {s.metodo_pago} · S/ {s.monto}
                    </div>
                  </div>
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-warning/15 text-jungle">
                      <RefreshCw className="w-3.5 h-3.5" /> Verificando pago…
                    </span>
                    <WhatsAppButton
                      message={`Hola, envié mi voucher para ${s.plataforma} (${s.id_compra}). ¿Cuándo lo verifican?`}
                      label="Consultar"
                      className="!py-1.5 !px-3 !text-xs"
                    />
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ── Solicitudes rechazadas ── */}
        {!loading && rechazadas.length > 0 && (
          <section className="mt-12">
            <h2 className="text-2xl mb-5 flex items-center gap-2">
              <XCircle className="w-5 h-5 text-danger" /> No aprobadas
            </h2>
            <div className="flex flex-col gap-3">
              {rechazadas.map((s) => (
                <div
                  key={s.id_compra}
                  className="bg-white border border-danger/20 rounded-2xl p-5 shadow-card flex flex-wrap items-center justify-between gap-4"
                >
                  <div>
                    <div className="font-semibold">{s.plataforma}</div>
                    <div className="text-sm text-jungle-light mt-1">
                      Solicitud {s.id_compra} · {s.fecha_solicitud.slice(0, 10)} · S/ {s.monto}
                    </div>
                  </div>
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-danger/10 text-danger">
                      <XCircle className="w-3.5 h-3.5" /> Pago no verificado
                    </span>
                    <Link to={`/compra/${s.slug}`} className="btn-ghost !py-1.5 !px-3 !text-xs">
                      Reintentar
                    </Link>
                    <WhatsAppButton
                      message={`Hola, mi pago para ${s.plataforma} (${s.id_compra}) fue rechazado. ¿Pueden ayudarme?`}
                      label="Soporte"
                      className="!py-1.5 !px-3 !text-xs"
                    />
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ── Estado vacío ── */}
        {!loading && accesos.length === 0 && pendientes.length === 0 && rechazadas.length === 0 && !error && (
          <div className="mt-10 bg-white border border-jungle/10 rounded-2xl p-8 shadow-card text-center">
            <p className="text-jungle-light">Compra tu primer acceso para empezar a estudiar.</p>
            <Link to="/" className="btn-primary mt-4 inline-flex">Ver plataformas</Link>
          </div>
        )}

        <Link
          to="/"
          className="inline-block mt-10 text-jungle-light hover:text-jungle text-sm"
        >
          ¿Quieres más? → Ver todas las plataformas
        </Link>
      </main>
      <Footer />
    </div>
  );
}
