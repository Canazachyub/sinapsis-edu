/**
 * Segmentos del curso "Anatomía de Testut" (UNAP).
 * Cada segmento se compra por separado. Precio por segmento: ver
 * PRECIO_POR_SEGMENTO_PEN abajo.
 */

export const PRECIO_POR_SEGMENTO_PEN = 30;
export const DURACION_DIAS_ANATOMIA = 30;

export interface SegmentoAnatomia {
  id: string;
  nombre: string;
  temas: ReadonlyArray<string>;
}

export const SEGMENTOS_ANATOMIA: ReadonlyArray<SegmentoAnatomia> = [
  {
    id: 'generalidades-torax',
    nombre: 'Generalidades y Tórax',
    temas: [
      'Introducción de anatomía. Generalidades e introducción',
      'Región ósea del tórax: costillas, cartílagos costales, esternón y columna dorsal',
      'Articulaciones del tórax y de la columna dorsal',
      'Músculos de la región del tórax',
      'Región diafragmática',
      'Región mamaria',
      'Mediastino anterior: corazón y pericardio',
      'Timo, grandes vasos: aorta, VCS, TVBC',
      'Mediastino posterior: esófago torácico, aorta torácica, conducto torácico, sistema ácigos, neumogástrico y gran simpático',
      'Región pleuro pulmonar',
      'Examen teórico práctico',
    ],
  },
  {
    id: 'miembro-superior',
    nombre: 'Miembro Superior',
    temas: [
      'Región escapular y deltoidea',
      'Articulación glenohumeral',
      'Región axilar: contenido y continente',
      'Brazo',
      'Articulación del codo',
      'Región antebraquial',
      'Muñeca y mano',
      'Examen teórico práctico',
    ],
  },
  {
    id: 'abdomen',
    nombre: 'Región Abdomen',
    temas: [
      'Región esternocostopúbica y costoiliaca',
      'Región inguino abdominal',
      'Región lumboiliaca',
      'Esófago abdominal y estómago',
      'Duodeno, páncreas y bazo',
      'Intestino delgado, irrigación e inervación',
      'Intestino grueso, irrigación e inervación',
      'Hígado y vesícula biliar',
      'Riñón y conductos excretores',
    ],
  },
  {
    id: 'pelvis',
    nombre: 'Región Pelvis',
    temas: [
      'Pelvis ósea',
      'Pelvimetría',
      'Articulación sacroilíaca',
      'Articulación del pubis',
      'Perineo femenino',
      'Perineo masculino',
      'Genitales femeninos',
      'Genitales masculinos',
    ],
  },
  {
    id: 'miembro-inferior',
    nombre: 'Miembro Inferior',
    temas: [
      'Región glútea',
      'Articulación coxofemoral',
      'Región del muslo',
      'Región de la rodilla',
      'Región de la pierna',
      'Región del tobillo y pie',
      'Examen teórico-práctico final',
    ],
  },
];
