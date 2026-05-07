import { Link } from 'react-router-dom';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { useAuth } from '@/hooks/useAuth';

export function Portal() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 container-x py-16">
        <h1 className="text-4xl">Hola, {user?.nombre ?? 'alumno'} 👋</h1>
        <p className="mt-2 text-jungle-light">Tus accesos activos aparecerán aquí (Fase 5).</p>
        <div className="mt-10 grid gap-6 md:grid-cols-3">
          <div className="bg-white border border-jungle/10 rounded-2xl p-6 shadow-card">
            <div className="font-semibold text-lg">ENCIB</div>
            <div className="text-sm text-jungle-light mt-1">⏳ Vence en 14 días</div>
            <Link to="/aula/encib" className="btn-primary w-full mt-4">Entrar al aula</Link>
          </div>
        </div>
        <Link to="/" className="inline-block mt-10 text-jungle-light hover:text-jungle text-sm">
          ¿Quieres más? → Ver todas las plataformas
        </Link>
      </main>
      <Footer />
    </div>
  );
}
