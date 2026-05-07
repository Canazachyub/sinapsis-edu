import { Link } from 'react-router-dom';
import { Check } from 'lucide-react';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';

export function Gracias() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 container-x py-24 text-center max-w-xl mx-auto">
        <div className="inline-flex w-16 h-16 rounded-full bg-success/15 items-center justify-center">
          <Check className="w-8 h-8 text-success" aria-hidden />
        </div>
        <h1 className="mt-6 text-4xl">¡Gracias!</h1>
        <p className="mt-4 text-jungle-light">
          Recibimos tu solicitud. Te avisaremos por correo apenas validemos el pago.
        </p>
        <Link to="/" className="btn-ghost mt-8">Volver al inicio</Link>
      </main>
      <Footer />
    </div>
  );
}
