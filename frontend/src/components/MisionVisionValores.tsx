import { Target, Eye, Sparkles } from 'lucide-react';

const VALORES = [
  { titulo: 'Integridad', desc: 'Actuamos con honestidad y responsabilidad.' },
  { titulo: 'Compromiso', desc: 'Nos dedicamos al éxito académico de cada alumno.' },
  { titulo: 'Excelencia', desc: 'Mejora continua en todos nuestros procesos.' },
  { titulo: 'Innovación', desc: 'Incorporamos nuevas tecnologías y métodos.' },
  { titulo: 'Humanismo', desc: 'Trato digno y respeto hacia cada persona.' },
] as const;

export function MisionVisionValores() {
  return (
    <section id="nosotros" className="bg-offwhite">
      <div className="container-x py-20">
        <span className="pill">Quiénes somos</span>
        <h2 className="mt-4 text-4xl md:text-5xl max-w-3xl">
          Formación médica de excelencia
        </h2>
        <p className="mt-4 text-jungle-light max-w-2xl">
          SINAPSIS EDU es un centro educativo en línea dedicado a la formación de profesionales
          en medicina humana, integrando conocimiento científico con habilidades prácticas.
        </p>

        <div className="mt-10 grid gap-6 md:grid-cols-3">
          <article className="bg-white rounded-2xl border border-jungle/10 p-6 shadow-card">
            <div className="inline-flex w-11 h-11 rounded-xl bg-lime items-center justify-center">
              <Target className="w-5 h-5 text-jungle" aria-hidden />
            </div>
            <h3 className="mt-4 text-2xl">Misión</h3>
            <p className="mt-2 text-jungle-light leading-relaxed">
              Formar profesionales de la salud con conocimientos sólidos y habilidades prácticas,
              comprometidos con la excelencia académica y el bienestar de la comunidad.
            </p>
          </article>

          <article className="bg-white rounded-2xl border border-jungle/10 p-6 shadow-card">
            <div className="inline-flex w-11 h-11 rounded-xl bg-lime items-center justify-center">
              <Eye className="w-5 h-5 text-jungle" aria-hidden />
            </div>
            <h3 className="mt-4 text-2xl">Visión</h3>
            <p className="mt-2 text-jungle-light leading-relaxed">
              Ser reconocidos a nivel nacional e internacional como líderes en educación médica,
              innovando continuamente en la enseñanza y promoviendo la investigación científica.
            </p>
          </article>

          <article className="bg-jungle text-cream rounded-2xl p-6 shadow-card-hover">
            <div className="inline-flex w-11 h-11 rounded-xl bg-lime items-center justify-center">
              <Sparkles className="w-5 h-5 text-jungle" aria-hidden />
            </div>
            <h3 className="mt-4 text-2xl text-lime">Valores</h3>
            <ul className="mt-3 space-y-2 text-sm">
              {VALORES.map((v) => (
                <li key={v.titulo}>
                  <strong className="text-lime">{v.titulo}:</strong>{' '}
                  <span className="opacity-85">{v.desc}</span>
                </li>
              ))}
            </ul>
          </article>
        </div>
      </div>
    </section>
  );
}
