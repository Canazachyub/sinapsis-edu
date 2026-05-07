import { Link, useParams } from 'react-router-dom';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { usePlataformas } from '@/hooks/usePlataformas';

export function Plataforma() {
  const { slug } = useParams<{ slug: string }>();
  const { plataformas } = usePlataformas();
  const data = plataformas.find((p) => p.slug === slug);

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 container-x py-16">
        {!data ? (
          <div>
            <h1 className="text-3xl">Plataforma no encontrada</h1>
            <Link to="/" className="btn-ghost mt-6">Volver al inicio</Link>
          </div>
        ) : (
          <div className="max-w-3xl">
            <span className="pill">Detalle de plataforma</span>
            <h1 className="mt-4 text-4xl md:text-6xl">{data.nombre}</h1>
            <p className="mt-4 text-lg text-jungle-light">{data.descripcion}</p>
            <div className="mt-8 flex items-baseline gap-2">
              <span className="text-4xl font-bold">S/. {data.precio}</span>
              <span className="text-jungle-light">/ {data.duracion_dias} días</span>
            </div>
            <Link to={`/compra/${data.slug}`} className="btn-primary mt-6">Comprar acceso</Link>
            <p className="mt-10 text-sm text-jungle-light">
              Página de detalle completa (features, reviews, FAQ específica) en Fase 3.
            </p>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
