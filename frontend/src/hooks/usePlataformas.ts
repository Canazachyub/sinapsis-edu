// Stub Fase 0. En Fase 2 reemplazará el array hardcodeado por callApi('listarPlataformasPublicas').
import { useEffect, useState } from 'react';
import type { PlataformaCardData } from '@/components/PlataformaCard';

const PLATAFORMAS_DEMO: PlataformaCardData[] = [
  {
    slug: 'enam',
    nombre: 'ENAM',
    descripcion: 'Examen Nacional de Medicina. Banco de preguntas con justificaciones y simulacros cronometrados.',
    precio: 49,
    duracion_dias: 30,
  },
  {
    slug: 'encib',
    nombre: 'ENCIB',
    descripcion: 'Examen Nacional de Ciencias Básicas. Más de 1500 preguntas explicadas, organizadas por curso.',
    precio: 49,
    duracion_dias: 30,
  },
  {
    slug: 'encaps',
    nombre: 'ENCAPS',
    descripcion: 'Evaluación Nacional Capacidades Clínicas. Casos clínicos con retroalimentación detallada.',
    precio: 49,
    duracion_dias: 30,
  },
  {
    slug: 'rm',
    nombre: 'Residentado Médico',
    descripcion: 'Preparación integral para el examen de residentado. Cobertura por especialidades.',
    precio: 79,
    duracion_dias: 30,
  },
  {
    slug: 'essalud',
    nombre: 'EsSalud',
    descripcion: 'Plataforma para concursos EsSalud y SERUMS. Material actualizado y simulacros.',
    precio: 59,
    duracion_dias: 30,
  },
  {
    slug: 'biblioteca',
    nombre: 'Biblioteca Médica',
    descripcion: 'Acceso a libros, guías clínicas y material complementario para tu carrera médica.',
    precio: 39,
    duracion_dias: 30,
  },
];

export function usePlataformas() {
  const [plataformas, setPlataformas] = useState<PlataformaCardData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // TODO Fase 2: reemplazar por callApi('listarPlataformasPublicas')
    setPlataformas(PLATAFORMAS_DEMO);
    setLoading(false);
  }, []);

  return { plataformas, loading };
}
