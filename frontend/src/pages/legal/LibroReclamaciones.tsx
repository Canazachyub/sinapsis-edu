/*
 * Libro de Reclamaciones virtual (Ley N.° 29571, art. 150, y su Reglamento).
 * Fase 1: sin backend nuevo. La hoja se arma en el navegador y se envía por
 * WhatsApp o correo; el consumidor puede guardar/imprimir su copia.
 */
import { useMemo, useState, type ChangeEvent, type FormEvent } from 'react';
import { Mail, MessageCircle, Printer } from 'lucide-react';
import { config } from '@/config';
import { EMPRESA, esMarcador } from '@/config/empresa';
import { DatoEmpresa, LegalLayout, Seccion } from './LegalLayout';

interface Hoja {
  nombre: string;
  tipoDoc: 'DNI' | 'CE' | 'Pasaporte';
  numDoc: string;
  domicilio: string;
  telefono: string;
  correo: string;
  apoderado: string;
  bien: 'servicio' | 'producto';
  descripcionBien: string;
  monto: string;
  tipo: 'reclamo' | 'queja';
  detalle: string;
  pedido: string;
  acepta: boolean;
}

const VACIA: Hoja = {
  nombre: '', tipoDoc: 'DNI', numDoc: '', domicilio: '', telefono: '', correo: '', apoderado: '',
  bien: 'servicio', descripcionBien: '', monto: '', tipo: 'reclamo', detalle: '', pedido: '', acepta: false,
};

function codigoHoja(d: Date): string {
  const p = (n: number) => String(n).padStart(2, '0');
  return `LR-${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}-${p(d.getHours())}${p(d.getMinutes())}${p(d.getSeconds())}`;
}

const inputCls = 'w-full rounded-xl border border-line bg-white px-4 py-3 text-[16px] text-ink focus:border-jungle-600 focus:outline-none focus:ring-4 focus:ring-jungle-100';

function Etiqueta({ htmlFor, children }: { htmlFor: string; children: string }) {
  return <label htmlFor={htmlFor} className="mb-1.5 block text-[13px] font-medium text-ink">{children}</label>;
}

export function LibroReclamaciones() {
  const [h, setH] = useState<Hoja>(VACIA);
  const [error, setError] = useState<string | null>(null);
  const [lista, setLista] = useState<{ codigo: string; fecha: string; texto: string } | null>(null);
  const correoDisponible = !esMarcador(EMPRESA.correoContacto);

  function set<K extends keyof Hoja>(k: K) {
    return (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
      const v = e.target instanceof HTMLInputElement && e.target.type === 'checkbox' ? e.target.checked : e.target.value;
      setH((x) => ({ ...x, [k]: v }));
      setError(null);
    };
  }

  const fechaTexto = useMemo(() => (lista ? lista.fecha : ''), [lista]);

  function generar(ev: FormEvent) {
    ev.preventDefault();
    if (h.nombre.trim().length < 3) return setError('Escribe tu nombre completo.');
    if (h.numDoc.trim().length < 6) return setError('Escribe tu número de documento.');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(h.correo.trim())) return setError('Escribe un correo válido para enviarte la respuesta.');
    if (h.detalle.trim().length < 10) return setError('Cuéntanos el detalle de tu reclamo o queja.');
    if (h.pedido.trim().length < 3) return setError('Indica qué pides que hagamos.');
    if (!h.acepta) return setError('Confirma que los datos son correctos.');

    const ahora = new Date();
    const codigo = codigoHoja(ahora);
    const fecha = ahora.toLocaleString('es-PE');
    const texto = [
      `LIBRO DE RECLAMACIONES — HOJA ${codigo}`,
      `Fecha: ${fecha}`,
      `Proveedor: ${EMPRESA.titular} (${EMPRESA.nombreComercial}) · ${EMPRESA.tipoDocumento} ${EMPRESA.documento} · ${EMPRESA.direccion}`,
      '',
      '1. CONSUMIDOR',
      `Nombre: ${h.nombre.trim()}`,
      `${h.tipoDoc}: ${h.numDoc.trim()}`,
      `Domicilio: ${h.domicilio.trim() || '-'}`,
      `Teléfono: ${h.telefono.trim() || '-'}`,
      `Correo: ${h.correo.trim()}`,
      h.apoderado.trim() ? `Padre/madre/apoderado (menor de edad): ${h.apoderado.trim()}` : '',
      '',
      '2. BIEN CONTRATADO',
      `Tipo: ${h.bien === 'servicio' ? 'Servicio' : 'Producto'}`,
      `Descripción: ${h.descripcionBien.trim() || '-'}`,
      `Monto reclamado: ${h.monto.trim() ? 'S/ ' + h.monto.trim() : '-'}`,
      '',
      `3. ${h.tipo === 'reclamo' ? 'RECLAMO' : 'QUEJA'}`,
      `Detalle: ${h.detalle.trim()}`,
      `Pedido: ${h.pedido.trim()}`,
    ].filter((l) => l !== '').join('\n');
    setLista({ codigo, fecha, texto });
  }

  const waHref = lista ? `https://wa.me/${config.whatsappNumber}?text=${encodeURIComponent(lista.texto)}` : '#';
  const mailHref = lista && correoDisponible
    ? `mailto:${EMPRESA.correoContacto}?subject=${encodeURIComponent('Libro de Reclamaciones ' + lista.codigo)}&body=${encodeURIComponent(lista.texto)}`
    : undefined;

  return (
    <LegalLayout
      eyebrow="Atención al consumidor"
      titulo="Libro de Reclamaciones"
      intro={
        <>
          Conforme al Código de Protección y Defensa del Consumidor (Ley N.° 29571), ponemos a tu disposición este Libro
          de Reclamaciones virtual. Te responderemos en un plazo máximo de <strong className="text-ink">15 días hábiles</strong>.
        </>
      }
    >
      <Seccion titulo="Proveedor">
        <dl className="grid gap-x-6 gap-y-1 sm:grid-cols-[max-content_1fr]">
          <dt className="text-muted">Titular</dt><dd><DatoEmpresa v={EMPRESA.titular} /></dd>
          <dt className="text-muted">Nombre comercial</dt><dd>{EMPRESA.nombreComercial}</dd>
          <dt className="text-muted">{EMPRESA.tipoDocumento}</dt><dd><DatoEmpresa v={EMPRESA.documento} /></dd>
          <dt className="text-muted">Domicilio</dt><dd><DatoEmpresa v={EMPRESA.direccion} /></dd>
        </dl>
        <ul className="text-[14px] text-muted">
          <li><strong className="text-ink">Reclamo:</strong> disconformidad con el servicio o producto que compraste.</li>
          <li><strong className="text-ink">Queja:</strong> malestar por la atención recibida, no relacionado directamente con el servicio.</li>
        </ul>
      </Seccion>

      {!lista ? (
        <form onSubmit={generar} noValidate className="space-y-8">
          <Seccion titulo="1. Tus datos">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2"><Etiqueta htmlFor="lr-nombre">Nombre completo</Etiqueta><input id="lr-nombre" className={inputCls} value={h.nombre} onChange={set('nombre')} autoComplete="name" /></div>
              <div>
                <Etiqueta htmlFor="lr-tipodoc">Documento</Etiqueta>
                <select id="lr-tipodoc" className={inputCls} value={h.tipoDoc} onChange={set('tipoDoc')}>
                  <option value="DNI">DNI</option><option value="CE">Carné de extranjería</option><option value="Pasaporte">Pasaporte</option>
                </select>
              </div>
              <div><Etiqueta htmlFor="lr-numdoc">Número de documento</Etiqueta><input id="lr-numdoc" className={inputCls} value={h.numDoc} onChange={set('numDoc')} /></div>
              <div className="sm:col-span-2"><Etiqueta htmlFor="lr-dom">Domicilio</Etiqueta><input id="lr-dom" className={inputCls} value={h.domicilio} onChange={set('domicilio')} autoComplete="street-address" /></div>
              <div><Etiqueta htmlFor="lr-tel">Teléfono</Etiqueta><input id="lr-tel" type="tel" className={inputCls} value={h.telefono} onChange={set('telefono')} autoComplete="tel" /></div>
              <div><Etiqueta htmlFor="lr-correo">Correo</Etiqueta><input id="lr-correo" type="email" className={inputCls} value={h.correo} onChange={set('correo')} autoComplete="email" /></div>
              <div className="sm:col-span-2"><Etiqueta htmlFor="lr-apod">Si eres menor de edad: nombre de tu madre, padre o apoderado</Etiqueta><input id="lr-apod" className={inputCls} value={h.apoderado} onChange={set('apoderado')} /></div>
            </div>
          </Seccion>

          <Seccion titulo="2. Bien contratado">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Etiqueta htmlFor="lr-bien">Tipo</Etiqueta>
                <select id="lr-bien" className={inputCls} value={h.bien} onChange={set('bien')}>
                  <option value="servicio">Servicio</option><option value="producto">Producto</option>
                </select>
              </div>
              <div><Etiqueta htmlFor="lr-monto">Monto reclamado (S/)</Etiqueta><input id="lr-monto" inputMode="decimal" className={inputCls} value={h.monto} onChange={set('monto')} /></div>
              <div className="sm:col-span-2"><Etiqueta htmlFor="lr-desc">Descripción (plataforma, código de compra)</Etiqueta><input id="lr-desc" className={inputCls} value={h.descripcionBien} onChange={set('descripcionBien')} /></div>
            </div>
          </Seccion>

          <Seccion titulo="3. Detalle">
            <fieldset>
              <legend className="mb-2 text-[13px] font-medium text-ink">Tipo</legend>
              <div className="flex flex-wrap gap-4">
                {(['reclamo', 'queja'] as const).map((t) => (
                  <label key={t} className="flex min-h-[44px] cursor-pointer items-center gap-2 text-[15px]">
                    <input type="radio" name="lr-tipo" value={t} checked={h.tipo === t} onChange={set('tipo')} className="h-5 w-5 accent-jungle-800" />
                    {t === 'reclamo' ? 'Reclamo' : 'Queja'}
                  </label>
                ))}
              </div>
            </fieldset>
            <div><Etiqueta htmlFor="lr-detalle">Detalle</Etiqueta><textarea id="lr-detalle" rows={5} className={inputCls} value={h.detalle} onChange={set('detalle')} /></div>
            <div><Etiqueta htmlFor="lr-pedido">Pedido del consumidor</Etiqueta><textarea id="lr-pedido" rows={3} className={inputCls} value={h.pedido} onChange={set('pedido')} /></div>
            <label htmlFor="lr-acepta" className="flex cursor-pointer items-start gap-3 text-[14px]">
              <input id="lr-acepta" type="checkbox" checked={h.acepta} onChange={set('acepta')} className="mt-0.5 h-5 w-5 shrink-0 accent-jungle-800" />
              Declaro que los datos son correctos.
            </label>
            {error && <div role="alert" className="rounded-xl border border-wrong/20 bg-wrong/5 px-4 py-3 text-sm text-wrong">{error}</div>}
            <button type="submit" className="btn-primary w-full sm:w-auto">Generar hoja de reclamación</button>
          </Seccion>
        </form>
      ) : (
        <Seccion titulo={`Hoja ${lista.codigo}`}>
          <p>
            Tu hoja está lista ({fechaTexto}). <strong>Envíala</strong> por uno de estos medios para que quede registrada
            y guarda una copia. Te responderemos al correo que indicaste en un máximo de 15 días hábiles.
          </p>
          <pre className="max-h-80 overflow-auto whitespace-pre-wrap break-words rounded-xl border border-line bg-paper p-4 font-mono text-[13px] text-ink">{lista.texto}</pre>
          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap print:hidden">
            <a href={waHref} target="_blank" rel="noreferrer" className="btn-whatsapp"><MessageCircle className="h-5 w-5" aria-hidden /> Enviar por WhatsApp</a>
            {mailHref ? (
              <a href={mailHref} className="btn-primary"><Mail className="h-4 w-4" aria-hidden /> Enviar por correo</a>
            ) : (
              <span className="text-sm text-muted">Envío por correo disponible pronto: <DatoEmpresa v={EMPRESA.correoContacto} /></span>
            )}
            <button type="button" onClick={() => window.print()} className="btn-secondary"><Printer className="h-4 w-4" aria-hidden /> Imprimir o guardar PDF</button>
          </div>
          <button type="button" onClick={() => setLista(null)} className="min-h-[44px] text-sm font-semibold text-jungle-600 hover:text-jungle-800 print:hidden">← Corregir la hoja</button>
          <p className="text-[13px] text-muted">
            La formulación del reclamo no impide acudir a otras vías de solución de controversias ni es requisito previo
            para interponer una denuncia ante INDECOPI.
          </p>
        </Seccion>
      )}
    </LegalLayout>
  );
}
