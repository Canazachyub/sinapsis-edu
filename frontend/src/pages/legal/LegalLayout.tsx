import type { ReactNode } from 'react';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { EMPRESA, esMarcador } from '@/config/empresa';
import { fechaPeru } from '@/api/pagos';

/**
 * Muestra un dato de la empresa. Si sigue siendo un marcador ([DIRECCIÓN], etc.)
 * lo resalta para que sea fácil de ver y completar en config/empresa.ts.
 */
export function DatoEmpresa({ v }: { v: string }) {
  if (esMarcador(v)) {
    return <mark className="rounded bg-warning/15 px-1 font-semibold text-ink">{v}</mark>;
  }
  return <>{v}</>;
}

export function Seccion({ id, titulo, children }: { id?: string; titulo: string; children: ReactNode }) {
  return (
    <section id={id} className="scroll-mt-24 border-t border-line pt-6">
      <h2 className="text-[22px] leading-snug">{titulo}</h2>
      <div className="mt-3 space-y-3 text-[15px] leading-relaxed text-ink [&_li]:pl-1 [&_ol]:list-decimal [&_ol]:space-y-1.5 [&_ol]:pl-5 [&_ul]:list-disc [&_ul]:space-y-1.5 [&_ul]:pl-5">
        {children}
      </div>
    </section>
  );
}

export function LegalLayout({
  titulo, eyebrow, intro, children,
}: { titulo: string; eyebrow: string; intro?: ReactNode; children: ReactNode }) {
  useDocumentTitle(titulo);
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="container-x flex-1 py-12 md:py-16">
        <article className="mx-auto max-w-[760px]">
          <p className="eyebrow">{eyebrow}</p>
          <h1 className="mt-2 text-[32px] leading-tight sm:text-[44px]">{titulo}</h1>
          <p className="mt-3 text-sm text-muted">
            Última actualización: {fechaPeru(EMPRESA.actualizacionLegal)} ·{' '}
            {EMPRESA.nombreComercial} · <DatoEmpresa v={EMPRESA.titular} /> ({EMPRESA.tipoDocumento} <DatoEmpresa v={EMPRESA.documento} />)
          </p>
          {intro && <div className="mt-6 text-[16px] leading-relaxed text-muted">{intro}</div>}
          <div className="mt-8 space-y-8">{children}</div>
        </article>
      </main>
      <Footer />
    </div>
  );
}
