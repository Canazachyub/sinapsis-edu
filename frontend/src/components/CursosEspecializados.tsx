import { Microscope, UserRound, BookText, GraduationCap, type LucideIcon } from 'lucide-react';

interface Categoria {
  titulo: string;
  Icon: LucideIcon;
  cursos: ReadonlyArray<string>;
}

const CATEGORIAS: ReadonlyArray<Categoria> = [
  {
    titulo: 'Ciencias Básicas NOTRERO',
    Icon: Microscope,
    cursos: [
      'Anatomía NOTRERO 13',
      'Bioquímica NOTRERO 13',
      'Farmacología NOTRERO 13',
      'Fisiología NOTRERO 13',
      'Fisiopatología NOTRERO 13',
      'Microbiología y Parasitología NOTRERO 13',
      'Morfofisiología NOTRERO 13',
      'Patología NOTRERO',
      'Semiología NOTRERO 13',
    ],
  },
  {
    titulo: 'Training Medic · QX MEDIC',
    Icon: UserRound,
    cursos: [
      'Anatomía',
      'Bioquímica',
      'Embriología',
      'Farmacología',
      'Fisiología',
      'Histología',
      'Patología',
    ],
  },
  {
    titulo: 'EVISALUD · Investigación',
    Icon: BookText,
    cursos: [
      'Casos Clínicos',
      'Revisiones Sistemáticas de Intervención',
      'Lectura Crítica de Ensayos Clínicos',
      'Medicina Basada en Evidencia',
      'R studio · Análisis Estadístico',
      'Redacción de Artículos Científicos',
      'Redacción de Protocolos',
      'STATA · Análisis Estadístico',
    ],
  },
  {
    titulo: 'Otras academias especializadas',
    Icon: GraduationCap,
    cursos: [
      'Villamedic',
      'Galenomedic',
      'Academia Amir',
      'Academia MIR',
      'Academia Promir',
      'Academia San Fernando',
      'Academia APUREM',
      'Academia ASPEFAM',
      'Academia AEMPPI',
    ],
  },
];

export function CursosEspecializados() {
  return (
    <section id="cursos" className="bg-cream">
      <div className="container-x py-20">
        <span className="pill">Cursos especializados</span>
        <h2 className="mt-4 text-4xl md:text-5xl max-w-3xl">
          Videoclases, PDFs y bancos en Quizizz
        </h2>
        <p className="mt-3 text-jungle-light max-w-2xl">
          Acceso completo a las academias y bancos más reconocidos del país y la región.
        </p>

        <div className="mt-10 grid gap-6 md:grid-cols-2">
          {CATEGORIAS.map(({ titulo, Icon, cursos }) => (
            <div
              key={titulo}
              className="bg-white rounded-2xl border border-jungle/10 p-6 shadow-card
                         hover:shadow-card-hover hover:-translate-y-0.5 transition-all"
            >
              <div className="flex items-center gap-3 pb-3 border-b border-jungle/10">
                <Icon className="w-6 h-6 text-jungle" aria-hidden />
                <h3 className="text-xl">{titulo}</h3>
              </div>
              <ul className="mt-4 space-y-1.5 text-sm text-jungle-light">
                {cursos.map((c) => (
                  <li key={c} className="flex gap-2">
                    <span className="text-success shrink-0">✓</span>
                    <span>{c}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
