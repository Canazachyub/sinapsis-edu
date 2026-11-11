/**
 * Contenido estático de la landing: colecciones de videoclases y programa de estudios.
 * (Antes vivía dentro de CursosEspecializados.tsx y CursosCarousel.tsx.)
 */

export interface Coleccion {
  id: string;
  nombre: string;
  area: string;
  /** Qué se lista: cursos, academias, segmentos o recursos incluidos. */
  unidad: 'cursos' | 'academias' | 'segmentos' | 'incluye';
  formato: string;
  cursos: ReadonlyArray<string>;
  /** Si tiene página de compra propia. */
  slug?: string;
}

export const COLECCIONES: ReadonlyArray<Coleccion> = [
  {
    id: 'notrero',
    nombre: 'NOTRERO',
    area: 'Ciencias básicas',
    unidad: 'cursos',
    formato: 'Videoclases · PDF · Bancos en Quizizz',
    cursos: [
      'Anatomía',
      'Bioquímica',
      'Farmacología',
      'Fisiología',
      'Fisiopatología',
      'Microbiología y Parasitología',
      'Morfofisiología',
      'Patología',
      'Semiología',
    ],
  },
  {
    id: 'qxmedic',
    nombre: 'Training Medic · QX MEDIC',
    area: 'Ciencias básicas',
    unidad: 'cursos',
    formato: 'Videoclases · PDF · Bancos en Quizizz',
    cursos: ['Anatomía', 'Bioquímica', 'Embriología', 'Farmacología', 'Fisiología', 'Histología', 'Patología'],
  },
  {
    id: 'evisalud',
    nombre: 'EVISALUD',
    area: 'Investigación y medicina basada en evidencia',
    unidad: 'cursos',
    formato: 'Videoclases · PDF',
    cursos: [
      'Casos clínicos',
      'Revisiones sistemáticas de intervención',
      'Lectura crítica de ensayos clínicos',
      'Medicina basada en evidencia',
      'R Studio · Análisis estadístico',
      'Redacción de artículos científicos',
      'Redacción de protocolos',
      'STATA · Análisis estadístico',
    ],
  },
  {
    id: 'otras',
    nombre: 'Otras academias',
    area: 'Preparación para exámenes y residentado',
    unidad: 'academias',
    formato: 'Videoclases · PDF · Bancos',
    cursos: [
      'Villamedic',
      'Galenomedic',
      'Academia AMIR',
      'Academia MIR',
      'Academia Promir',
      'Academia San Fernando',
      'Academia APUREM',
      'Academia ASPEFAM',
      'Academia AEMPPI',
    ],
  },
  {
    id: 'cto',
    nombre: 'Colección CTO',
    area: 'Programa completo, referente en España y Latinoamérica',
    unidad: 'incluye',
    formato: 'Acceso por 1 año',
    cursos: ['Manuales', 'Videoclases', 'Casos clínicos', 'Plataforma online'],
    slug: 'cto',
  },
  {
    id: 'testut',
    nombre: 'Anatomía de Testut',
    area: 'Resúmenes teóricos por segmentos, bancos UNAP y 5 simulacros por segmento',
    unidad: 'segmentos',
    formato: 'Desde S/ 30 por segmento · formato físico disponible',
    cursos: ['Generalidades y Tórax', 'Miembro Superior', 'Región Abdomen', 'Región Pelvis', 'Miembro Inferior'],
    slug: 'anatomia',
  },
];

export interface Etapa {
  id: string;
  nombre: string;
  cursos: ReadonlyArray<string>;
}

export const PROGRAMA: ReadonlyArray<Etapa> = [
  {
    id: 'basicas',
    nombre: 'Ciencias básicas',
    cursos: [
      'Anatomía I',
      'Anatomía II',
      'Biología celular y molecular',
      'Biofísica',
      'Histología humana',
      'Bioquímica',
      'Embriología y genética',
      'Fisiología I',
      'Fisiología II',
      'Microbiología',
      'Parasitología',
      'Inmunología básica',
      'Psicología',
      'Primeros auxilios y bioseguridad',
    ],
  },
  {
    id: 'preclinicas',
    nombre: 'Preclínicas',
    cursos: [
      'Fisiopatología',
      'Farmacología',
      'Semiología',
      'Patología general',
      'Patología especial',
      'Laboratorio clínico',
      'Diagnóstico por imágenes',
      'Psicopatología médica',
      'Nutrición y dietoterapia',
      'Epidemiología',
      'Salud pública I',
      'Ética y deontología médica',
    ],
  },
  {
    id: 'clinicas',
    nombre: 'Clínicas',
    cursos: [
      'Clínica médica I',
      'Clínica médica II',
      'Clínica quirúrgica I',
      'Clínica quirúrgica II',
      'Clínica pediátrica I',
      'Clínica pediátrica II',
      'Ginecología y obstetricia I',
      'Ginecología y obstetricia II',
      'Psiquiatría',
      'Emergencias y urgencias médicas',
      'Medicina legal y patología forense',
      'Salud pública II',
      'Salud pública III',
      'Tesis I',
      'Tesis II',
    ],
  },
  {
    id: 'internado',
    nombre: 'Internado',
    cursos: ['Rotación de Medicina', 'Rotación de Cirugía', 'Rotación de Pediatría', 'Rotación de Ginecología y Obstetricia'],
  },
];

export const TOTAL_CURSOS_PROGRAMA = PROGRAMA.reduce((n, e) => n + e.cursos.length, 0);
