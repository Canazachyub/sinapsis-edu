import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { PromoBanner } from '@/components/PromoBanner';
import { WhatsAppFloating } from '@/components/WhatsAppButton';
import { FaqLanding } from '@/components/FaqLanding';
import { Hero } from '@/components/hero/Hero';
import { ComoFunciona, FranjaExamenes, SeccionBanqueo, SimulacroGratis } from '@/components/landing/Servicios';
import { SeccionPlataformas } from '@/components/landing/SeccionPlataformas';
import { CtaFinal, Nosotros } from '@/components/landing/Institucional';
import { usePlataformas } from '@/hooks/usePlataformas';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { useRevealAll } from '@/hooks/useInView';

export function Landing() {
  useDocumentTitle();
  useRevealAll();
  const { plataformas } = usePlataformas();
  const location = useLocation();

  // Cross-page scroll: cuando otro componente navega con state.scrollTo, scrollea aquí.
  useEffect(() => {
    const state = location.state as { scrollTo?: string } | null;
    if (!state?.scrollTo) return;
    const target = state.scrollTo;
    const id = window.setTimeout(() => {
      document.getElementById(target)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 80);
    return () => window.clearTimeout(id);
  }, [location.state]);

  return (
    <div className="flex min-h-screen flex-col">
      <PromoBanner />
      <Navbar overlay />
      <main>
        <Hero />
        <FranjaExamenes />
        <SeccionBanqueo />
        <SimulacroGratis />
        <SeccionPlataformas plataformas={plataformas} />
        <ComoFunciona />
        <Nosotros />
        <FaqLanding />
        <CtaFinal />
      </main>
      <Footer />
      <WhatsAppFloating message="Hola, necesito ayuda con SINAPSIS EDU." />
    </div>
  );
}
