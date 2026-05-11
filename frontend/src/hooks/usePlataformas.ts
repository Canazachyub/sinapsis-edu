import { useEffect, useState } from 'react';
import { callApi } from '@/api/client';
import type { PlataformaCardData } from '@/components/PlataformaCard';

/**
 * Fuente de verdad: hoja Plataformas en Google Sheets (vía Apps Script).
 *
 * Estrategia para no parpadear:
 *   1. Si hay cache en sessionStorage (TTL 5 min) → mostrarla al instante.
 *   2. En paralelo, refrescar contra el backend.
 *   3. Si el backend cae o tarda → usar la lista hardcoded como fallback.
 *
 * Resultado: editas un precio en el Sheet, refrescas el portal y todos los
 * componentes (PlataformaCard, Compra, PagarConCripto) reciben el nuevo
 * precio y recalculan automáticamente (USDT, BTC, ETH, BNB, soles).
 */

const CACHE_KEY = 'sinapsis_plataformas_v1';
const CACHE_TTL_MS = 5 * 60 * 1000;

interface ApiPlataforma {
  id_plataforma: string;
  nombre: string;
  slug: string;
  descripcion: string;
  precio: number | string;
  duracion_dias: number | string;
  activo: boolean | string;
}

interface Cached {
  data: PlataformaCardData[];
  at: number;
}

const PLATAFORMAS_FALLBACK: PlataformaCardData[] = [
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

/**
 * Plataformas extra que el frontend muestra SIEMPRE, aunque no estén en el
 * Sheet. Si el backend ya las trae (P-007, P-008), se respeta lo del Sheet.
 * Si no, se inyectan acá para que la landing las vea de todos modos.
 */
const PLATAFORMAS_EXTRA: PlataformaCardData[] = [
  {
    slug: 'anatomia',
    nombre: 'Anatomía de Testut',
    descripcion: 'Resúmenes teóricos basados en Testut. Material por segmentos anatómicos. Bancos UNAP y 5 simulacros por segmento. Formato físico disponible.',
    precio: 20,
    duracion_dias: 30,
  },
  {
    slug: 'cto',
    nombre: 'Colección CTO',
    descripcion: 'Programa completo CTO, referente en España y Latinoamérica. Manuales, videos, casos y plataforma online.',
    precio: 50,
    duracion_dias: 365,
  },
];

function mergeExtras(base: PlataformaCardData[]): PlataformaCardData[] {
  const slugsExistentes = new Set(base.map((p) => p.slug));
  const faltantes = PLATAFORMAS_EXTRA.filter((p) => !slugsExistentes.has(p.slug));
  return [...base, ...faltantes];
}

function leerCache(): PlataformaCardData[] | null {
  try {
    const raw = sessionStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const c = JSON.parse(raw) as Cached;
    if (!c.at || Date.now() - c.at > CACHE_TTL_MS) return null;
    return c.data;
  } catch {
    return null;
  }
}

function guardarCache(data: PlataformaCardData[]) {
  try {
    const payload: Cached = { data, at: Date.now() };
    sessionStorage.setItem(CACHE_KEY, JSON.stringify(payload));
  } catch {
    /* sessionStorage lleno o no disponible: ok seguir sin cache */
  }
}

function mapApiData(rows: ReadonlyArray<ApiPlataforma>): PlataformaCardData[] {
  return rows.map((p) => ({
    slug: String(p.slug),
    nombre: String(p.nombre),
    descripcion: String(p.descripcion),
    precio: Number(p.precio),
    duracion_dias: Number(p.duracion_dias),
  }));
}

export type PlataformasSource = 'cache' | 'backend' | 'fallback' | 'loading';

export function usePlataformas() {
  const cached = typeof window !== 'undefined' ? leerCache() : null;
  const [plataformas, setPlataformas] = useState<PlataformaCardData[]>(
    cached ? mergeExtras(cached) : [],
  );
  const [loading, setLoading] = useState<boolean>(!cached);
  const [source, setSource] = useState<PlataformasSource>(cached ? 'cache' : 'loading');

  useEffect(() => {
    let cancelled = false;
    callApi<ApiPlataforma[]>('listarPlataformasPublicas').then((res) => {
      if (cancelled) return;
      if (res.ok && Array.isArray(res.data) && res.data.length > 0) {
        const mapped = mapApiData(res.data);
        setPlataformas(mergeExtras(mapped));
        setSource('backend');
        guardarCache(mapped); // cache solo lo que vino del backend (los extras se aplican siempre)
      } else if (plataformas.length === 0) {
        setPlataformas(mergeExtras(PLATAFORMAS_FALLBACK));
        setSource('fallback');
      }
      setLoading(false);
    });
    return () => { cancelled = true; };
    // Solo en mount: el cache inicial ya se aplicó arriba con useState.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { plataformas, loading, source };
}
