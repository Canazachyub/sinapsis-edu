import { useEffect, useState } from 'react';
import { RotateCcw } from 'lucide-react';

/**
 * Réplica jugable del banqueo "modo juego" (tipo Quizizz) de banqueo.sinapsisedu.com:
 * mosaicos de colores, racha, puntos, tiempo y potenciadores. Usa las mismas imágenes.
 */

const IMG = (n: string) => `${import.meta.env.BASE_URL}images/juego/${n}.webp`;

const TILES = [
  { fig: 'fig-triangulo', color: '#1F5B52' },
  { fig: 'fig-rombo', color: '#2563EB' },
  { fig: 'fig-circulo', color: '#B45309' },
  { fig: 'fig-cuadrado', color: '#7C3AED' },
];

const PREGUNTA = {
  curso: 'Anatomía',
  texto: '¿Qué nervio inerva al músculo deltoides?',
  opciones: ['Nervio radial', 'Nervio axilar', 'Nervio musculocutáneo', 'Nervio supraescapular'],
  correcta: 1,
  porque: 'El nervio axilar (C5-C6) rodea el cuello quirúrgico del húmero e inerva al deltoides y al redondo menor.',
};

const TIEMPO = 20;

export function BanqueoJuego() {
  const [elegida, setElegida] = useState<number | null>(null);
  const [ocultas, setOcultas] = useState<Set<number>>(new Set());
  const [tiempo, setTiempo] = useState(TIEMPO);
  const [racha, setRacha] = useState(4);
  const [puntos, setPuntos] = useState(1240);

  const respondida = elegida !== null;
  const acierto = elegida === PREGUNTA.correcta;

  useEffect(() => {
    if (respondida) return;
    const t = window.setInterval(() => setTiempo((s) => (s <= 0.1 ? TIEMPO : +(s - 0.1).toFixed(1))), 100);
    return () => window.clearInterval(t);
  }, [respondida]);

  const elegir = (i: number) => {
    if (respondida) return;
    setElegida(i);
    if (i === PREGUNTA.correcta) {
      setRacha((r) => r + 1);
      setPuntos((p) => p + 100 + Math.round(tiempo * 5));
    } else {
      setRacha(0);
    }
  };

  const cincuenta = () => {
    if (respondida || ocultas.size) return;
    const malas = [0, 1, 2, 3].filter((i) => i !== PREGUNTA.correcta).slice(0, 2);
    setOcultas(new Set(malas));
  };

  const reiniciar = () => {
    setElegida(null);
    setOcultas(new Set());
    setTiempo(TIEMPO);
  };

  const pct = (tiempo / TIEMPO) * 100;
  const colorTiempo = pct > 50 ? 'bg-lime-400' : pct > 25 ? 'bg-warning' : 'bg-wrong';

  return (
    <div
      className="overflow-hidden rounded-3xl border border-white/10 bg-jungle-900 text-white shadow-mock-dark"
      style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.06) 1px, transparent 0)', backgroundSize: '22px 22px' }}
    >
      {/* Cabecera del juego */}
      <div className="flex items-center justify-between gap-2 border-b border-white/10 px-4 py-3">
        <span className={`inline-flex h-10 items-center gap-2 rounded-full pl-2 pr-3 ${racha > 0 ? 'bg-warning/90' : 'bg-white/10'}`}>
          <img src={IMG('racha')} alt="" className="h-7 w-7" />
          <span className="leading-none">
            <span className="tabular block text-[17px] font-extrabold">{racha}</span>
            <span className="block text-[9px] font-semibold uppercase tracking-[0.08em] text-white/80">Racha</span>
          </span>
        </span>
        <span className="tabular inline-flex h-9 items-center rounded-full bg-white px-4 text-[15px] font-extrabold text-jungle-900">3 / 10</span>
        <span className="tabular inline-flex h-9 items-center gap-1.5 rounded-full bg-lime-400 px-3 text-sm font-extrabold text-jungle-900">
          <img src={IMG('puntos')} alt="" className="-ml-1 h-6 w-6" /> {puntos.toLocaleString('es-PE')}
        </span>
      </div>
      <div className="flex items-center gap-2 px-4 pb-1 pt-2.5">
        <img src={IMG('tiempo')} alt="" className="h-5 w-5" />
        <div className="h-2 flex-1 overflow-hidden rounded-full bg-white/10">
          <div className={`h-full rounded-full ${colorTiempo}`} style={{ width: `${respondida ? pct : pct}%`, transition: 'width 100ms linear' }} />
        </div>
        <span className="tabular w-8 text-right text-xs font-semibold text-white/70">{Math.ceil(tiempo)}s</span>
      </div>

      {/* Pregunta */}
      <div className="px-4 pb-4 pt-3 sm:px-5">
        <span className="inline-flex h-7 items-center rounded-full bg-white/10 px-3 text-[12px] font-semibold text-white/85">{PREGUNTA.curso}</span>
        <p className="mt-3 text-center font-display text-[19px] font-bold leading-snug sm:text-[22px]">{PREGUNTA.texto}</p>

        <div className="mt-4 grid grid-cols-2 gap-2.5">
          {PREGUNTA.opciones.map((op, i) => {
            const t = TILES[i];
            const esCorrecta = respondida && i === PREGUNTA.correcta;
            const esMala = respondida && i === elegida && !acierto;
            const atenuada = respondida && !esCorrecta && !esMala;
            const oculta = ocultas.has(i) && !respondida;
            return (
              <button
                key={op}
                type="button"
                onClick={() => elegir(i)}
                disabled={respondida || oculta}
                className={`relative flex min-h-[86px] flex-col items-center justify-center gap-1.5 rounded-2xl px-2 py-3 text-center text-[14px] font-bold leading-tight shadow-[inset_0_-5px_0_rgba(0,0,0,0.25)] transition-all duration-300 sm:min-h-[100px] sm:text-[15px] ${
                  oculta ? 'invisible' : ''
                } ${atenuada ? 'scale-95 opacity-30' : ''} ${esCorrecta ? 'scale-[1.04] ring-4 ring-lime-400' : ''} ${
                  !respondida ? 'hover:-translate-y-0.5 hover:brightness-110 active:translate-y-0' : ''
                }`}
                style={{ backgroundColor: esCorrecta ? '#16A34A' : esMala ? '#DC2626' : t.color }}
              >
                <img src={IMG(t.fig)} alt="" className="h-7 w-7" />
                {op}
              </button>
            );
          })}
        </div>

        {/* Potenciadores o resultado */}
        {!respondida ? (
          <div className="mt-4 flex items-center justify-center gap-2">
            {[
              { img: 'cincuenta', label: '50/50', on: cincuenta, usado: ocultas.size > 0 },
              { img: 'segunda', label: '2ª vez' },
              { img: 'doble', label: 'x2' },
              { img: 'pista', label: 'Pista' },
            ].map((p) => (
              <button
                key={p.label}
                type="button"
                onClick={p.on}
                disabled={!p.on || p.usado}
                className={`flex w-[64px] flex-col items-center gap-0.5 rounded-xl border border-white/10 bg-white/5 py-1.5 text-[11px] font-semibold text-white/80 ${
                  p.on && !p.usado ? 'hover:bg-white/15' : 'cursor-default'
                } ${p.usado ? 'opacity-40' : ''}`}
                title={p.on ? 'Elimina dos alternativas incorrectas' : 'Potenciador del banqueo'}
              >
                <img src={IMG(p.img)} alt="" className="h-7 w-7" />
                {p.label}
              </button>
            ))}
          </div>
        ) : (
          <div className="mt-4 flex items-start gap-3 rounded-2xl bg-white/[0.07] p-3">
            <img src={IMG(acierto ? 'celebra' : 'piensa')} alt="" className="h-14 w-14 shrink-0" />
            <div className="min-w-0 flex-1">
              <p className={`font-display text-lg font-extrabold ${acierto ? 'text-lime-400' : 'text-white'}`}>
                {acierto ? `¡Correcto! Racha ${racha} 🔥` : 'Casi… la racha vuelve a 0'}
              </p>
              <p className="mt-0.5 text-[13px] leading-snug text-white/75">{PREGUNTA.porque}</p>
            </div>
            <button
              type="button"
              onClick={reiniciar}
              className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-white/10 hover:bg-white/20"
              aria-label="Jugar otra vez"
              title="Jugar otra vez"
            >
              <RotateCcw className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
