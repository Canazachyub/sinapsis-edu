import { useEffect, useState } from 'react';
import { callApi } from '@/api/client';

/** Campaña de descuento vigente (Black Friday, etc.). El precio real lo calcula el servidor. */
export interface Campana {
  nombre: string;
  descuento_pct: number;
  fin: string; // ISO
  plataformas: string[];
  mensaje: string;
}

const KEY = 'sinapsis_campana_v1';
const TTL = 2 * 60 * 1000;

export function useCampana(): Campana | null {
  const [campana, setCampana] = useState<Campana | null>(() => {
    try {
      const raw = sessionStorage.getItem(KEY);
      if (!raw) return null;
      const c = JSON.parse(raw) as { data: Campana | null; at: number };
      if (Date.now() - c.at > TTL || !c.data || Date.parse(c.data.fin) < Date.now()) return null;
      return c.data;
    } catch {
      return null;
    }
  });

  useEffect(() => {
    let cancel = false;
    callApi<Campana | null>('campanaActual').then((res) => {
      if (cancel || !res.ok) return;
      const data = res.data && Date.parse(res.data.fin) > Date.now() ? res.data : null;
      setCampana(data);
      try { sessionStorage.setItem(KEY, JSON.stringify({ data, at: Date.now() })); } catch { /* lleno */ }
    });
    return () => { cancel = true; };
  }, []);

  return campana;
}

/** Cuenta regresiva hasta `finIso`; se actualiza cada segundo. */
export function useCuentaRegresiva(finIso?: string) {
  const [ahora, setAhora] = useState(() => Date.now());
  useEffect(() => {
    if (!finIso) return;
    const id = window.setInterval(() => setAhora(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, [finIso]);
  const ms = finIso ? Math.max(0, Date.parse(finIso) - ahora) : 0;
  const s = Math.floor(ms / 1000);
  return { terminado: ms <= 0, d: Math.floor(s / 86400), h: Math.floor((s % 86400) / 3600), m: Math.floor((s % 3600) / 60), s: s % 60 };
}
