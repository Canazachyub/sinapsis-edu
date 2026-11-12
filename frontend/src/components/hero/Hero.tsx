import { lazy, Suspense, useEffect, useRef } from 'react';
import { ArrowRight, Check, PlayCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { ScrollLink } from '@/components/ScrollLink';
import { simulacroHref } from '@/config';
import { useAuth } from '@/hooks/useAuth';
import { MockPregunta } from '@/components/mocks/MockPregunta';
import { MockVideo } from '@/components/mocks/MockVideo';

const HeroNeural = lazy(() => import('./HeroNeural'));

/** Hero de la landing (DESIGN.md §5): red neuronal 3D + UI real del producto. */
export function Hero() {
  const { isAuthenticated } = useAuth();
  const mocksRef = useRef<HTMLDivElement>(null);

  // Parallax suave de las tarjetas con el mouse (solo desktop, sin reduced-motion).
  useEffect(() => {
    const el = mocksRef.current;
    if (!el) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    if (!window.matchMedia('(pointer: fine)').matches) return;
    let raf = 0;
    const target = { x: 0, y: 0 };
    const cur = { x: 0, y: 0 };
    const onMove = (e: PointerEvent) => {
      target.x = (e.clientX / window.innerWidth) * 2 - 1;
      target.y = (e.clientY / window.innerHeight) * 2 - 1;
    };
    const tick = () => {
      cur.x += (target.x - cur.x) * 0.06;
      cur.y += (target.y - cur.y) * 0.06;
      el.style.transform = `perspective(1600px) rotateY(${-9 + cur.x * 3}deg) rotateX(${3 - cur.y * 2}deg)`;
      raf = requestAnimationFrame(tick);
    };
    window.addEventListener('pointermove', onMove, { passive: true });
    raf = requestAnimationFrame(tick);
    return () => {
      window.removeEventListener('pointermove', onMove);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <section className="relative isolate overflow-hidden bg-jungle-900 text-white">
      {/* Fondo: red 3D (con fallback CSS mientras carga o sin WebGL) */}
      <div
        className="absolute inset-0 -z-20"
        style={{
          background:
            'radial-gradient(1200px 600px at 75% 40%, rgba(31,91,82,0.55), transparent 70%), #0B211F',
        }}
      />
      <Suspense fallback={null}>
        <HeroNeural className="absolute inset-0 -z-10" />
      </Suspense>
      {/* Scrim para legibilidad del texto */}
      <div className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-r from-jungle-900/90 via-jungle-900/55 to-transparent" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 -z-10 h-40 bg-gradient-to-t from-jungle-900 to-transparent" />

      <div className="container-x grid min-h-[100svh] items-center gap-12 pb-20 pt-[128px] lg:grid-cols-12 lg:gap-8 lg:pb-32">
        <div className="relative z-10 lg:col-span-7">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-lime-400">
            Banqueo y simulacros para medicina
          </p>
          <h1 className="mt-5 text-[36px] leading-[1.07] !text-white sm:text-5xl lg:text-[46px] xl:text-[50px]">
            Banquea <span className="text-lime-400">como en el examen real</span> y llega listo al día de la prueba.
          </h1>
          <ul className="mt-6 flex flex-wrap gap-2" aria-label="Exámenes">
            {['ENAM', 'ENCIB', 'ENCAPS', 'Residentado', 'EsSalud', 'SERUMS'].map((e) => (
              <li key={e} className="rounded-full border border-white/15 bg-white/[0.06] px-3 py-1 text-[13px] font-semibold text-white/90">{e}</li>
            ))}
          </ul>
          <p className="mt-5 max-w-[560px] text-[17px] leading-relaxed text-white/75 md:text-lg">
            Más de 15 000 preguntas explicadas, simulacros cronometrados y tus aciertos por curso.
            Empieza con un simulacro gratis.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <a href={simulacroHref()!} className="btn-spark px-6 hover:shadow-cta">
              <PlayCircle className="h-[18px] w-[18px]" aria-hidden /> Simulacro gratis
            </a>
            <ScrollLink to="plataformas" className="btn-ghost-dark cursor-pointer px-6">
              Ver plataformas <ArrowRight className="h-[18px] w-[18px]" aria-hidden />
            </ScrollLink>
          </div>

          <ul className="mt-8 flex flex-wrap gap-x-6 gap-y-3 text-sm text-white/75">
            {['Paga con Yape o tarjeta', 'Acceso al instante', 'Celular, tablet o PC'].map((t) => (
              <li key={t} className="inline-flex items-center gap-2">
                <span className="grid h-5 w-5 place-items-center rounded-full border border-lime-400/50 text-lime-400">
                  <Check className="h-3 w-3" strokeWidth={3} aria-hidden />
                </span>
                {t}
              </li>
            ))}
          </ul>

          <p className="mt-6 text-sm text-white/60">
            {isAuthenticated ? (
              <Link to="/portal" className="font-semibold text-white underline decoration-lime-400/60 underline-offset-4 hover:text-lime-400">Ir a mi portal →</Link>
            ) : (
              <>¿Ya tienes cuenta?{' '}
                <Link to="/login" className="font-semibold text-white underline decoration-lime-400/60 underline-offset-4 hover:text-lime-400">Ingresa aquí</Link></>
            )}
          </p>
        </div>

        {/* Maquetas de producto */}
        <div className="relative hidden lg:col-span-5 lg:block lg:-mr-10 xl:-mr-20">
          <div
            ref={mocksRef}
            className="relative ml-auto w-full max-w-[560px] will-change-transform"
            style={{ transform: 'perspective(1600px) rotateY(-9deg) rotateX(3deg)', transformStyle: 'preserve-3d' }}
          >
            <MockPregunta className="w-[84%] !shadow-mock-dark" />
            <MockVideo className="absolute -bottom-24 -right-6 w-[54%] !shadow-mock-dark xl:-right-12" />
          </div>
        </div>

        {/* Móvil: solo la pregunta */}
        <div className="lg:hidden">
          <MockPregunta compact className="!shadow-mock-dark" />
        </div>
      </div>
    </section>
  );
}
