# DESIGN.md — Sistema visual de SINAPSIS EDU (v3 · "Clínico y confiable")

> Fuente de verdad del estilo. Reemplaza la v1 (lime sobre crema) y descarta la v2
> ("Cinematic Glass", demasiado "IA": objetos 3D en las tarjetas y todo oscuro).
> Fecha: 2026-11-02.

---

## 0. Qué vendemos (el estilo sale de aquí)

SINAPSIS EDU vende **dos servicios** para estudiantes y médicos peruanos:

1. **Banqueo:** bancos de preguntas con justificación, simulacros cronometrados y
   estadísticas, para ENAM, ENCIB, ENCAPS, Residentado Médico y EsSalud/SERUMS.
2. **Videoclases y material:** cursos completos (NOTRERO, QX MEDIC, EVISALUD, CTO, Anatomía de
   Testut por segmentos), PDFs y bancos en Quizizz, y la Biblioteca Médica.

Además cubre **más de 45 cursos** del currículo de medicina humana. El acceso se paga por
Yape, Binance o transferencia: se sube el voucher y se recibe el acceso por correo.

**Consecuencias para el diseño:**

- El usuario compra *confianza*: tiene que ver **qué recibe** antes de pagar. El héroe visual
  de la web es **el producto real** (una pregunta con su justificación, un reproductor de video,
  un panel de progreso), no ilustraciones ni objetos 3D.
- Tono **académico y clínico**, como una buena plataforma médica (referencias: Amboss,
  Lecturio, Osmosis, UWorld): fondos claros, mucho orden, datos concretos, precios visibles.
- La pasarela de pago es manual (voucher), así que el proceso de compra debe explicarse con
  pasos claros y tiempos reales ("activación en menos de 24 h hábiles").

## 1. Diagnóstico de la web actual

| Problema | Dónde | Qué hacer |
|---|---|---|
| Texto de desarrollo visible ("Backend conectado…") | Hero `Landing.tsx` | Quitar. |
| Hero lime saturado + ilustración genérica | Hero | Hero oscuro con red neuronal 3D + UI real del producto. |
| No se ve el producto en ninguna parte | Toda la landing | Secciones "Banqueo" y "Videoclases" con capturas/maquetas de UI. |
| Cifras sin respaldo ("95% de aprobación") | `STATS` | Solo datos verificables (n.º de preguntas, cursos, plataformas). |
| "Demo gratuita · Próximamente" | Hero | Quitar hasta que exista. |
| Carrusel infinito de 45 cursos en mayúsculas | `CursosCarousel` | Programa por etapas (Básicas · Preclínicas · Clínicas · Internado) en pestañas. |
| Títulos en mayúsculas condensadas | `globals.css` | Caja de oración, sans sólida. |
| 7 links en la navbar | `Navbar` | 5 máximo. |
| `S/` y `S/.` mezclados; `PricingCard` sin uso | Cards | Siempre `S/ 49`; borrar stub. |

Se conserva: logo, nombre, verde jungle y lime de marca, Inter, rutas y lógica.

---

## 2. Principios

1. **Mostrar, no decorar.** Cada sección enseña una parte real del servicio.
2. **Claro y ordenado.** Fondos blancos/grises muy suaves, una idea por bloque, mucho aire.
3. **Un solo momento "wow":** la animación 3D del hero. El resto es sobrio.
4. **Lime = chispa, no pintura.** El lime aparece en el hero oscuro, en el estado "correcto" de
   una respuesta y en detalles puntuales. Nunca como fondo de sección.
5. **Datos concretos** en vez de adjetivos ("1 500+ preguntas explicadas", no "el mejor banco").

---

## 3. Color

```
MARCA
  jungle-900  #0B211F   fondo del hero y footer
  jungle-800  #10312D   botón primario, títulos sobre claro
  jungle-600  #1F5B52   hover, iconos, enlaces
  jungle-100  #E3EEEC   fondos de iconos, chips suaves
  lime-400    #C2E476   chispa: CTA sobre oscuro, pulsos 3D, check de respuesta correcta
  lime-500    #AACF57   hover del CTA lime

NEUTROS
  white       #FFFFFF   fondo principal
  paper       #F6F8F7   fondo de secciones alternas
  line        #E2E8E6   bordes y divisores
  ink         #0F1A18   texto principal
  muted       #51625E   texto secundario
  subtle      #8A9A96   metadatos, placeholders

ESTADO (también en la UI de preguntas)
  correct  #16A34A · wrong #DC2626 · warning #D97706 · info #2563EB
  whatsapp #25D366 (solo el botón de WhatsApp)
```

Reglas:
- Ritmo de fondos: hero `jungle-900` → secciones `white` / `paper` alternadas → CTA final y
  footer `jungle-900`.
- Botón primario sobre claro: `jungle-800` con texto blanco. Sobre oscuro: `lime-400` con
  texto `jungle-900`.
- Prohibido: crema `#F3F1E8`, gradientes en botones, sombras de color, morado, glassmorphism
  sobre fondos claros.

---

## 4. Tipografía

| Rol | Fuente | Pesos |
|---|---|---|
| Títulos | **Plus Jakarta Sans** | 600, 700, 800 |
| Texto y UI | **Inter** | 400, 500, 600 |
| Datos tabulares (precios, contadores, tiempos) | Inter con `font-variant-numeric: tabular-nums` | — |

```html
<link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@600;700;800&family=Inter:wght@400;500;600&display=swap" rel="stylesheet" />
```

| Token | Móvil → desktop | Línea | Fuente |
|---|---|---|---|
| `h1` | 36 → 60 px | 1.08 | Jakarta 800, tracking -0.025em |
| `h2` | 28 → 40 px | 1.15 | Jakarta 700, tracking -0.02em |
| `h3` | 20 → 22 px | 1.3 | Jakarta 700 |
| `lead` | 17 → 19 px | 1.6 | Inter 400, `muted` |
| `body` | 15 → 16 px | 1.65 | Inter 400 |
| `small` | 13 px | 1.5 | Inter 500 |
| `eyebrow` | 12 px | 1.4 | Inter 600, MAYÚSCULAS, tracking 0.12em, `jungle-600` |

- Caja de oración en títulos. Las MAYÚSCULAS solo en `eyebrow`.
- Resaltar una palabra del h1 con color (`lime-400` en oscuro, `jungle-600` en claro), sin
  itálicas ni subrayados decorativos.

---

## 5. Hero con animación 3D envolvente

### 5.1 Concepto

**"La red que se enciende."** Una red neuronal 3D ocupa todo el hero: cientos de nodos y
conexiones finas en verde-gris, y **pulsos lime** que viajan entre neuronas (la sinapsis). La
cámara flota lentamente dentro de la red, responde al mouse (parallax suave) y al hacer scroll
**atraviesa la red** hasta salir hacia la siguiente sección. Es el único elemento "espectacular"
de la web, y es abstracto a propósito: no compite con el producto.

### 5.2 Composición

```
┌───────────────────────── hero · jungle-900 · min-h-[100svh] ─────────────────────────┐
│  [navbar transparente → blanca al hacer scroll]                                       │
│                                                                                       │
│  EYEBROW: BANQUEO + VIDEOCLASES PARA MEDICINA                ┌───── tarjeta UI ─────┐│
│  h1: Prepárate para el ENAM, ENCIB                           │ ENAM · Pregunta 128  ││
│      y Residentado con banqueo                               │ Paciente de 54 años… ││
│      y videoclases explicadas.                               │ ○ A  ● B ✓  ○ C  ○ D ││
│  lead: 1 500+ preguntas con justificación,                   │ Justificación: …     ││
│        simulacros y cursos completos.                        └──────────────────────┘│
│  [Ver plataformas]  [Cómo funciona ▸]                        ┌─ mini reproductor ──┐ │
│  ✓ Yape · Binance · Transferencia  ✓ Acceso en < 24 h        │ ▶ Fisiología · 12:40│ │
│                                                              └─────────────────────┘ │
│  ░░░░ red neuronal 3D a pantalla completa detrás de todo, con pulsos lime ░░░░         │
└───────────────────────────────────────────────────────────────────────────────────────┘
```

- Las tarjetas de UI son **componentes HTML reales** (no imágenes), en blanco, con borde
  `line` y sombra neutra suave, ligeramente inclinadas en 3D (`perspective` + `rotateY(-8deg)`)
  y con un leve flotado al mover el mouse.
- Sobre la red, un degradado `from-jungle-900/80` a la izquierda para que el texto se lea.

### 5.3 Implementación

- **Three.js** (sin react-three-fiber, para no sumar peso), cargado con `import()` diferido
  después del primer render. Componente `HeroNeural.tsx` con `<canvas>` `absolute inset-0`.
- Red procedural, sin modelos externos: ~600 nodos en desktop / ~220 en móvil, distribuidos en
  un volumen ovalado (forma de cerebro), conexiones a los vecinos más cercanos
  (`LineSegments`, opacidad 0.12–0.25), nodos como `Points` con textura circular suave.
- Pulsos: 30–60 partículas lime que recorren conexiones al azar con brillo aditivo
  (`AdditiveBlending`); al llegar a un nodo lo "encienden" 400 ms.
- Cámara: rotación lenta continua (0.02 rad/s), parallax con el mouse (lerp 0.05) y dolly en
  el eje Z ligado al scroll del hero (de z=9 a z=2, atraviesa la red).
- Niebla `FogExp2` del color `jungle-900` para dar profundidad.
- Rendimiento: `devicePixelRatio` máx. 1.75, pausa con `IntersectionObserver` cuando el hero
  no está visible y con `visibilitychange`; objetivo de 60 fps en una laptop media y 30 fps en
  un celular de gama media.
- **Fallback:** con `prefers-reduced-motion`, sin WebGL o con `saveData` → imagen estática
  `hero-red.webp` (render de la misma red) sin animación.

---

## 6. Secciones de la landing (en orden)

| # | Sección | Fondo | Contenido |
|---|---|---|---|
| 0 | Barra de promoción | `jungle-800` | "Accesos desde **S/ 39**." + link WhatsApp. Una línea, 36 px de alto. |
| 1 | Hero 3D | `jungle-900` | Ver §5. |
| 2 | Franja de exámenes | `white` | "Preparación para" + ENAM · ENCIB · ENCAPS · Residentado Médico · EsSalud · SERUMS en texto gris (sin logos oficiales). |
| 3 | **Banqueo** | `white` | Cifras reales por banco en tabla con divisores (ENAM 2 000+, ENCIB 1 500+, Residentado 3 000+…), **pregunta de prueba interactiva** (`PruebaPregunta`: el visitante responde y ve la justificación y el porqué de cada alternativa) y 4 características en lista numerada. |
| 4 | **Videoclases** | `paper` | **Catálogo real**: índice de colecciones (NOTRERO, QX MEDIC, EVISALUD, otras academias, CTO, Testut) y, al elegir una, su lista numerada de cursos, formato y botón de consulta o compra. |
| 5 | Cómo funciona | `white` | 4 pasos numerados en línea: Elige plataforma → Paga (Yape, Binance, transferencia) → Sube tu voucher → Recibe tu acceso (< 24 h). |
| 6 | Plataformas y precios | `paper` | Tarjetas (§7.2) con su ilustración de marca. Filtro por pestañas: Banqueo · Videoclases · Biblioteca. |
| 7 | Programa de estudios | `white` | 45+ cursos agrupados en pestañas: Ciencias básicas · Preclínicas · Clínicas · Internado. Chips en dos o tres columnas. |
| 8 | Quiénes somos | `paper` | Misión y visión en dos columnas de texto, valores como fila de 5 con icono pequeño. Testimonios solo si son reales (nombre, universidad, examen). |
| 9 | Preguntas frecuentes | `white` | Acordeón de una columna, ancho 760 px. |
| 10 | CTA final | `jungle-900` | "Empieza hoy tu preparación" + botón lime + botón WhatsApp. Red 3D estática de fondo al 30%. |
| 11 | Footer | `jungle-900` | Logo, links, medios de pago, WhatsApp, © año actual. |

Cabecera de sección estándar: `eyebrow` → `h2` → `lead` (máx. 640 px), alineada a la izquierda.

---

## 7. Componentes

### 7.1 Botones

| Variante | Estilo |
|---|---|
| `btn-primary` | `bg-jungle-800 text-white hover:bg-jungle-600` |
| `btn-spark` (solo sobre oscuro) | `bg-lime-400 text-jungle-900 hover:bg-lime-500` |
| `btn-secondary` | `bg-white text-ink border border-line hover:border-jungle-600` |
| `btn-ghost-dark` (sobre oscuro) | `border border-white/25 text-white hover:bg-white/10` |
| `btn-whatsapp` | `bg-whatsapp text-white` |

Comunes: `rounded-xl px-5 py-3 text-[15px] font-semibold`, alto ≥ 44 px, transición de color
150 ms, sin `scale` ni gradientes. Focus: `ring-2 ring-jungle-600/40 ring-offset-2`.

### 7.2 Tarjeta de plataforma (con ilustración de marca)

Cada tarjeta lleva su banner `public/images/plataformas/{slug}.png` (16:9): fondo verde oscuro con
patrón de moléculas, mancha lima arriba a la derecha, ícono de línea lima con destello y título
condensado en crema. Animación: destellos que titilan, zoom suave y un brillo que cruza al pasar el
mouse. Las nuevas ilustraciones se generan con Codex usando `enam.png` como referencia de estilo.


```
┌ white · border line · rounded-2xl · p-6 ───────────────────┐
│ [icono en cuadro jungle-100]                    NUEVO       │
│ ENAM                                     ← h3              │
│ Examen Nacional de Medicina              ← small muted     │
│ ─────────────────────────────                               │
│ ✓ 2 000+ preguntas con justificación                        │
│ ✓ Simulacros cronometrados                                  │
│ ✓ Estadísticas por área                                     │
│ ─────────────────────────────                               │
│ S/ 49  / 30 días            (tachado si hay promo)          │
│ [ Comprar acceso ]  btn-primary, ancho completo             │
│   Ver detalles →    link                                    │
└─────────────────────────────────────────────────────────────┘
```

- Hover: borde `jungle-600` y sombra `0 8px 24px rgba(15,26,24,.08)`. Sin translate.
- Etiqueta (Nuevo, Oferta, Destacado): chip `rounded-full px-2.5 py-0.5 text-xs font-semibold`
  con fondo suave del color de estado (`bg-green-50 text-green-700`, etc.).
- Tarjeta "Más elegida": borde `jungle-800` de 2 px y chip arriba.

### 7.3 Maquetas de producto (UI mockups)

Son componentes React estáticos que imitan la plataforma real con datos de ejemplo verosímiles:
- `MockPregunta`: enunciado clínico, 4–5 alternativas, una marcada correcta (`correct` + check
  lime en oscuro / verde en claro), bloque "Justificación" y referencia bibliográfica.
- `MockVideo`: reproductor 16:9 con fotograma de pizarra/diapositiva, barra de progreso, lista
  de lecciones con duración.
- `MockProgreso`: barra de aciertos por curso y un donut del simulacro.
Estilo: blanco, `rounded-2xl`, borde `line`, sombra `0 24px 48px -12px rgba(15,26,24,.18)`.

### 7.4 Formularios (Compra, Login)

Input `bg-white border border-line rounded-xl px-4 py-3 focus:border-jungle-600 focus:ring-4
focus:ring-jungle-100`. Label `small` encima. Pasos de compra con indicador numerado en la
parte superior y resumen del pedido fijo a la derecha en desktop.

### 7.5 Navbar

- Sobre el hero: transparente, texto blanco, logo blanco. Tras 64 px de scroll: `bg-white/95
  backdrop-blur border-b border-line`, texto `ink`, logo a color.
- Links (5): Banqueo · Videoclases · Plataformas · Cómo funciona · FAQ.
- Derecha: "Ingresar" (link) + "Ver plataformas" (botón).
- Móvil: panel a pantalla completa blanco, links grandes, botones abajo.

---

## 8. Movimiento

- Hero: animación 3D (§5). Es la única animación continua.
- Secciones: fade + `translateY(16px)` → 0, 500 ms, una sola vez al entrar en pantalla.
- Maquetas de producto: en la sección Banqueo, la alternativa correcta se marca sola y la
  justificación se despliega al entrar en pantalla (1 vez, 1.2 s en total).
- Nada de pulsos infinitos, carruseles automáticos ni rebotes.
- Todo se desactiva con `prefers-reduced-motion`.

---

## 9. Imágenes

- **No** se usan objetos 3D realistas, ilustraciones de personajes ni imágenes de stock.
- Excepción aprobada: los banners planos de plataformas (§7.2).
- Lo visual son las **maquetas de UI en código** (§7.3) y la red 3D del hero.
- Si se necesitan fotos (testimonios, docentes), deben ser reales.
- Imágenes generadas con ChatGPT (Codex `image_gen`) solo para: el fallback estático del hero
  (`hero-red.webp`), la imagen OG y los fotogramas de pizarra dentro de `MockVideo`.
- Diagramas o esquemas: draw.io.

---

## 10. Layout

- Contenedor `max-w-[1200px] mx-auto px-5 md:px-8`.
- Secciones `py-20 md:py-28`. Separación cabecera-contenido `mt-12`.
- Radios: botones e inputs `rounded-xl`, tarjetas `rounded-2xl`, chips `rounded-full`.
- Grillas: plataformas 1 / 2 / 3 columnas; bloques producto 1 / 2 columnas (texto 5 · maqueta 7).

## 11. Accesibilidad

Contraste ≥ 4.5:1 (`muted` sobre `white` = 6.4:1), alto táctil ≥ 44 px, `aria-label` en botones
con icono, canvas 3D con `aria-hidden`, focus visible siempre.

## 12. Tailwind

```ts
colors: {
  jungle: { 900: '#0B211F', 800: '#10312D', 600: '#1F5B52', 100: '#E3EEEC' },
  lime: { 400: '#C2E476', 500: '#AACF57' },
  paper: '#F6F8F7', line: '#E2E8E6', ink: '#0F1A18', muted: '#51625E', subtle: '#8A9A96',
  correct: '#16A34A', wrong: '#DC2626', whatsapp: '#25D366',
},
fontFamily: {
  display: ['"Plus Jakarta Sans"', 'Inter', 'sans-serif'],
  sans: ['Inter', 'sans-serif'],
},
```

## 13. Plan

1. Base: tokens, fuentes, `globals.css`, botones; limpiar textos de backend y `PricingCard`.
2. Hero: `HeroNeural.tsx` (Three.js) + tarjetas de UI + fallback.
3. Secciones Banqueo y Videoclases con `MockPregunta`, `MockVideo`, `MockProgreso`.
4. Cómo funciona, Plataformas (sin imágenes), Programa en pestañas, Nosotros, FAQ, CTA, footer.
5. Páginas internas: Plataforma, Compra, Gracias, Login, Portal, Aula.
6. Revisión en 360 px, contraste, reduced motion, Lighthouse ≥ 90.

## 14. No hacer

- Patrón de plantilla "de IA": íconos dentro de cuadritos en listas de beneficios, tarjetas sueltas flotando con sombras, gráficos con datos inventados. Usar listas numeradas con filetes, tablas con divisores y contenido real o interactivo.

- Objetos 3D o renders "de IA" en tarjetas y secciones.
- Glassmorphism, fondos crema, gradientes en botones, morado.
- Cifras de marketing inventadas o testimonios falsos.
- Logos de academias o instituciones de terceros sin permiso.
- Más de una animación continua por página.
