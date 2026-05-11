const PROGRAMA: ReadonlyArray<string> = [
  'ANATOMÍA I',
  'ANATOMÍA II',
  'BIOLOGÍA CELULAR Y MOLECULAR',
  'BIOFÍSICA',
  'FISIOLOGÍA I',
  'HISTOLOGÍA HUMANA',
  'BIOQUÍMICA',
  'EMBRIOLOGÍA Y GENÉTICA',
  'FISIOLOGÍA II',
  'MICROBIOLOGÍA',
  'PARASITOLOGÍA',
  'FISIOPATOLOGÍA',
  'FARMACOLOGÍA',
  'PRIMEROS AUXILIOS Y BIOSEGURIDAD',
  'PSICOLOGÍA',
  'INMUNOLOGÍA BÁSICA',
  'SEMIOLOGÍA',
  'PATOLOGÍA GENERAL',
  'LABORATORIO CLÍNICO',
  'PSICOPATOLOGÍA MÉDICA',
  'CLÍNICA MÉDICA I',
  'DIAGNÓSTICO POR IMÁGENES',
  'SALUD PÚBLICA I',
  'CLÍNICA MÉDICA II',
  'PATOLOGÍA ESPECIAL',
  'EPIDEMIOLOGÍA',
  'CLÍNICA QUIRÚRGICA I',
  'NUTRICIÓN Y DIETOTERAPIA',
  'ÉTICA Y DEONTOLOGÍA MÉDICA',
  'TESIS I',
  'CLÍNICA QUIRÚRGICA II',
  'PSIQUIATRÍA',
  'SALUD PÚBLICA II',
  'CLÍNICA GINECOLÓGICA Y OBSTÉTRICA I',
  'CLÍNICA PEDIÁTRICA I',
  'EMERGENCIAS Y URGENCIAS MÉDICAS',
  'TESIS II',
  'CLÍNICA GINECOLÓGICA Y OBSTÉTRICA II',
  'CLÍNICA PEDIÁTRICA II',
  'MEDICINA LEGAL Y PATOLOGÍA FORENSE',
  'SALUD PÚBLICA III',
  'ROTACIÓN DE MEDICINA',
  'ROTACIÓN DE CIRUGÍA',
  'ROTACIÓN DE PEDIATRÍA',
  'ROTACIÓN DE GINECOLOGÍA Y OBSTETRICIA',
];

export function CursosCarousel() {
  // Duplicamos la lista para que el loop infinito se vea continuo (al llegar a -50% reinicia sin salto).
  const items = [...PROGRAMA, ...PROGRAMA];

  return (
    <section id="programa" className="bg-cream">
      <div className="container-x pt-20">
        <span className="pill">Programa de estudios</span>
        <h2 className="mt-4 text-4xl md:text-5xl max-w-3xl">
          Cubrimos todo el currículum de medicina humana
        </h2>
        <p className="mt-3 text-jungle-light max-w-2xl">
          Más de 45 cursos en nuestro ecosistema, desde ciencias básicas hasta rotaciones clínicas.
        </p>
      </div>

      <div className="mt-10 overflow-hidden py-8 group" aria-label="Lista de cursos del programa">
        <div className="flex gap-4 w-max animate-carousel group-hover:[animation-play-state:paused]">
          {items.map((curso, i) => (
            <div
              key={`${curso}-${i}`}
              className="shrink-0 px-6 py-3 rounded-full bg-white border border-jungle/10 shadow-card
                         text-sm font-medium text-jungle whitespace-nowrap
                         hover:bg-jungle hover:text-lime hover:border-jungle transition-colors"
            >
              {curso}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
