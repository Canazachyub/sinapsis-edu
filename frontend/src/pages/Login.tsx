import { Link } from 'react-router-dom';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { WhatsAppButton } from '@/components/WhatsAppButton';

export function Login() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 container-x py-20 max-w-md mx-auto">
        <span className="pill">Acceso alumno</span>
        <h1 className="mt-4 text-4xl">Inicia sesión</h1>
        <p className="mt-2 text-jungle-light">
          Funcionalidad completa en Fase 5.
        </p>
        <form className="mt-8 bg-white border border-jungle/10 rounded-2xl p-6 shadow-card flex flex-col gap-4">
          <input type="email" placeholder="Correo" className="border border-jungle/15 rounded-[10px] px-4 py-3" disabled />
          <input type="password" placeholder="Contraseña" className="border border-jungle/15 rounded-[10px] px-4 py-3" disabled />
          <button type="button" className="btn-primary" disabled>Entrar</button>
        </form>
        <div className="mt-6 text-center text-sm text-jungle-light">
          <div>¿Olvidaste tu acceso?</div>
          <div className="mt-3"><WhatsAppButton message="Hola Yubert, no puedo entrar a mi cuenta del Portal Central." /></div>
        </div>
        <Link to="/" className="block text-center mt-6 text-sm text-jungle-light hover:text-jungle">
          ← Volver al inicio
        </Link>
      </main>
      <Footer />
    </div>
  );
}
