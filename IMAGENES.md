# IMAGENES.md — Guía visual de SINAPSIS EDU

> Hoja de ruta visual de **SINAPSIS EDU** (sinapsisedu.com). Prompts AI listos
> para copiar/pegar, dimensiones exactas, dónde guardar y qué nombre debe
> tener cada archivo. Cuando termines de generarlas, renómbralas exactamente
> como se indica y avísame para cablearlas en los componentes.

---

## 🧠 Concepto de marca

**Nombre:** SINAPSIS EDU
**Dominio:** sinapsisedu.com
**Metáfora visual central:** la **sinapsis** — el momento exacto donde dos
neuronas se conectan y el conocimiento "salta". Es la chispa entre estudiar
y aprobar. Entre teoría y caso clínico. Entre intentar y lograrlo.

Esto se traduce en motifs recurrentes en TODAS las imágenes:

- Puntos (nodos) conectados por líneas finas → **patrón de red neuronal**.
- Una chispa o glow en el punto de conexión → **lime green (#C2E476) brillante**.
- Dendritas o ramificaciones sutiles en los fondos.
- En logos: una "S" o "X" que sugiere una conexión.

**Vibe del proyecto:** premium · médico moderno · energético · profesional · inteligente.

**Lo que NO queremos** (negative prompts para todas las imágenes):
- Estilo institucional acartonado, hospital de los 90s.
- Stock photo aburrida (doctor sonriendo con mascarilla y pulgar arriba).
- Gradientes morados de Microsoft Office.
- Iconitos planos genéricos de Material Design.
- Texto en chino, japonés o caracteres no latinos.
- Marcas de agua, watermarks, banners de stock.
- Colores fuera de la paleta (rosa, naranja, amarillo crudo, azul cobalto).

---

## 🎨 Paleta de marca (incluir en TODOS los prompts AI)

```
PRIMARIOS
  Lime green       #C2E476   ← acento vivo, chispa de sinapsis
  Jungle (teal)    #10312D   ← fondo serio, casi negro con tinte verde
  Cream            #F3F1E8   ← fondos neutros, papel, "respiración"

SECUNDARIOS
  Lime Dark        #AACF57   ← gradientes y hover
  Jungle Dark      #0B211F   ← negros más profundos
  Purple accent    #795BC2   ← solo para badges/highlights muy puntuales
  WhatsApp green   #25D366   ← exclusivo del botón WhatsApp
```

**Regla de oro de contraste:**
- Sobre Lime → texto Jungle
- Sobre Jungle → texto Lime o Cream
- Sobre Cream → texto Jungle

---

## 📁 Estructura de carpetas (ya creada)

```
portal-central/frontend/public/images/
├── logo/
├── hero/
├── plataformas/
├── beneficios/
├── pago/
└── og/
```

Respeta el nombre **EXACTO** de cada archivo (minúsculas, sin tildes,
guiones medios). Si lo nombras distinto, dímelo y lo cableo con ese nombre.

---

## 🛠️ Herramientas recomendadas

| Tipo | Herramienta | Cuándo usarla |
|------|-------------|---------------|
| IA generativa | **ChatGPT (DALL·E 3)** | Ilustraciones detalladas, escenas, hero. Mejor en inglés. |
| IA generativa | **Gemini Imagen 3** | Alternativa gratuita potente. Muy bueno con texto en imagen. |
| IA generativa | **Midjourney v6** | La calidad cinematográfica top si tienes suscripción. |
| IA generativa | **Ideogram** | El mejor para imágenes CON texto legible (logos, OG). |
| Ilustraciones SVG | **unDraw.co** | SVG editables con color personalizado. **Atajo más rápido.** |
| Stock photos | **unsplash.com** / **pexels.com** | Fotos reales libres de derechos. Buscar en inglés. |
| Edición rápida | **canva.com** | QR de Yape con marco, OG image, retoques de texto sobre foto. |
| Compresión | **squoosh.app** | Reducir PNG a WebP o JPG optimizado antes de subir. |

---

## 📐 Convenciones técnicas

- **Logos / iconos**: SVG si es posible, o PNG transparente.
- **Cards de plataforma**: PNG/WebP, **ratio 16:9 estricto**, ancho mínimo 1200px.
- **Hero**: PNG transparente, ancho mínimo 1600px.
- **Fotos / QR**: JPG o PNG, ancho 600-1000px.
- **OG image**: PNG **1200×630 (estándar Open Graph)**.
- **Peso por archivo**: máximo 500 KB. Si excede, comprime con squoosh.

---

# 1. LOGO PRINCIPAL — SINAPSIS EDU

**Dónde se usa:** [Navbar](frontend/src/components/Navbar.tsx) · [Footer](frontend/src/components/Footer.tsx) · [Aula](frontend/src/pages/Aula.tsx) · favicon · OG image.

### Archivos a entregar

| Archivo | Dónde guardar | Tamaño | Formato |
|---------|---------------|--------|---------|
| `logo.svg` | `frontend/public/images/logo/` | escalable | SVG (versión sobre fondo claro) |
| `logo-blanco.svg` | `frontend/public/images/logo/` | escalable | SVG (versión sobre fondo Jungle) |
| `logo-icono.svg` | `frontend/public/images/logo/` | 256×256 | Solo el símbolo, sin wordmark |
| `favicon.svg` | `frontend/public/` (sobreescribir) | 64×64 | SVG (solo icono) |

### Prompt AI — Logo principal (Ideogram o DALL·E 3)

```
Premium minimal vector logo design for "SINAPSIS EDU", a Peruvian medical
education platform preparing students for national medical exams.

SYMBOL (left of wordmark): Two abstract nodes connected by a single curved
line, forming a stylized synapse. The connection point has a small spark
or glow. Symbol color: dark teal (#10312D) outline with a lime green
(#C2E476) glow at the synapse junction. Could also read as a stylized
letter "S" if abstracted further.

WORDMARK (right of symbol): "SINAPSIS" in bold condensed uppercase
typography (Barlow Condensed 800 style), all caps, very tight letter
spacing. Below or beside in much smaller size: ".EDU" or "EDU" as a tag
in a lighter weight. Wordmark color: dark teal (#10312D).

STYLE: Flat vector, no gradients, no 3D, no drop shadows. Clean negative
space. Premium SaaS aesthetic similar to Linear, Notion, or Stripe brand
identities. Confident, modern, intelligent.

ASPECT: horizontal landscape, roughly 3:1 ratio. Transparent background.

DO NOT include: stethoscopes, hearts, crosses, hospital crosses, brain
illustrations, generic medical icons, gradients, glow effects beyond the
synapse spark, any text in non-Latin characters.
```

### Prompt para versión blanco/lime (sobre fondo oscuro)

Mismo prompt pero cambia los colores:
- Wordmark "SINAPSIS" → color cream (#F3F1E8)
- Símbolo → outline lime green (#C2E476)
- Spark del synapse → lime brillante

### Prompt para `logo-icono.svg` (solo símbolo, sin texto)

```
Vector symbol icon for SINAPSIS EDU brand. Just the symbol, no wordmark.
Two abstract circular nodes connected by a single curved line with a
small lime green (#C2E476) spark/glow at the connection point. Outline
in dark teal (#10312D). Could be read as a stylized "S". Flat vector,
transparent background, 256x256 canvas with the symbol centered and
sized to ~80% of the canvas.
```

### Alternativa low-effort (si no quieres generar)

Sigue funcionando el SVG actual de [public/logo.svg](frontend/public/logo.svg). Lo modifico para que diga "SINAPSIS EDU" si me lo pides, queda decente sin generar nada.

---

# 2. HERO — Imagen principal de la landing

**Dónde se usa:** [Landing.tsx](frontend/src/pages/Landing.tsx), sección de arriba con el headline.

### Archivos a entregar

| Archivo | Dónde guardar | Tamaño | Formato |
|---------|---------------|--------|---------|
| `hero-ilustracion.png` | `frontend/public/images/hero/` | 1600×1100 | PNG con transparencia |

### Prompt AI — Opción A: Estudiante + sinapsis (recomendado)

```
Editorial-style flat vector illustration for the hero of a medical
education SaaS landing page called "SINAPSIS EDU".

SUBJECT: A confident young Peruvian medical student, around 22-26 years
old, dark wavy hair, wearing a clean white lab coat over casual clothes,
holding an open laptop. She is looking at the laptop with focused
concentration, a soft smile of "I got this". Slightly stylized features,
not hyperrealistic.

ENVIRONMENT: She is surrounded by a glowing neural network — small lime
green (#C2E476) dots floating around her, connected by thin curved lines.
At each connection point, a tiny lime spark. The neural network visually
represents synapses firing — knowledge connecting in her brain. The
network is most dense around her head, fading out toward the edges.

BACKGROUND: A solid cream (#F3F1E8) base with a large soft lime green
(#C2E476) organic blob on the bottom-left and a small dark teal (#10312D)
geometric shape on the top-right. Behind the student, very faint
dotted-grid pattern that hints at neural texture.

UI HINTS: From the laptop screen, soft light rays escape (lime tinted),
hinting at content emerging. One or two minimal UI cards float near her:
a clinical case question, a progress bar.

STYLE: Modern flat illustration similar to high-end SaaS marketing
(Linear, Stripe, Webflow). No gradients, no harsh shadows, only solid
flat colors. Bold confident shapes, premium feel.

COMPOSITION: Subject centered-right, with empty breathing room on the
LEFT half of the canvas for headline text overlay. 1600x1100 pixels.
Transparent or cream background.

DO NOT include: stethoscopes hanging from neck (cliché), thumbs up,
exaggerated smiles, mascots, anime style, hyperrealistic 3D render,
generic stock photo style.
```

### Prompt AI — Opción B: Cerebro / neuronas abstractas (sin persona)

```
Premium abstract editorial illustration for the hero of "SINAPSIS EDU",
a medical exam preparation platform.

CENTER COMPOSITION: A stylized brain made entirely of interconnected
nodes and lines — a neural network forming the silhouette of a human
brain, with each node a small dark teal (#10312D) circle and lines
between them in lime green (#C2E476). At certain key intersections,
larger lime glows representing active synapses firing. Some lines
extend beyond the brain silhouette like dendrites reaching out.

INSIDE THE BRAIN: Subtle medical icons emerging from the synapse network
— a stethoscope outline, a tiny pill, a heart pulse line, a microscope
— all in dark teal, integrated into the neural pattern.

BACKGROUND: Cream (#F3F1E8) base with a large soft lime organic blob
in the bottom-right corner.

STYLE: Editorial illustration, modern flat with subtle texture, premium
SaaS aesthetic. No 3D, no gradients, no shadows except a very soft
ambient glow around active synapses.

COMPOSITION: Centered brain, with breathing room on the left for
headline overlay. 1600x1100 pixels. Transparent or cream background.

DO NOT include: anatomical realism, gore, photorealism, generic brain
stock photos.
```

### Alternativa: solo decoración sutil (sin imagen central)

Si quieres mantener el hero ligero (solo headline + pills), puedo dejar
en el fondo SOLO un patrón de puntos conectados (neural pattern) generado
con CSS. No requiere imagen. Dime si te interesa esta vía.

### Búsqueda en Unsplash (si prefieres foto real)

`female medical student laptop`, `young doctor studying`, `medical book stethoscope flat lay`. Después aplicar overlay duotone Lime/Jungle en Canva.

---

# 3. THUMBNAILS DE PLATAFORMAS (6 imágenes)

**Dónde se usan:** cards en [Landing.tsx](frontend/src/pages/Landing.tsx) y detalle en [Plataforma.tsx](frontend/src/pages/Plataforma.tsx).

### Archivos a entregar

| Archivo | Plataforma | Tamaño |
|---------|------------|--------|
| `enam.png` | ENAM (Examen Nacional de Medicina) | 1200×675 (16:9) |
| `encib.png` | ENCIB (Ciencias Básicas) | 1200×675 |
| `encaps.png` | ENCAPS (Capacidades Clínicas) | 1200×675 |
| `rm.png` | Residentado Médico | 1200×675 |
| `essalud.png` | EsSalud / SERUMS | 1200×675 |
| `biblioteca.png` | Biblioteca Médica | 1200×675 |

Todas en `frontend/public/images/plataformas/`.

### Plantilla común (CRUCIAL: las 6 deben verse como familia)

Si las 6 imágenes parecen venir de 6 sitios diferentes, queda mal.
**Una sola plantilla, 6 variaciones de icono+nombre.**

**Plantilla base — descríbela en cada prompt:**

> Dark teal (#10312D) background with a subtle neural-network texture
> (lime green dots connected by thin lines, very faint, alpha 15%) in
> the background. A large lime green (#C2E476) organic blob shape in
> the top-right corner. Centered on the canvas: a glowing lime green
> medical icon (varies per platform) at large size, with a small lime
> spark behind it suggesting a synapse. Bottom-left aligned text:
> the platform code (e.g. "ENAM") in massive bold condensed uppercase
> (Barlow Condensed 800 style) in cream color (#F3F1E8), and below it
> a small "SINAPSIS EDU" caption in lime green at 30% size. Flat vector
> aesthetic, no 3D, no gradients.

### Prompts individuales por plataforma

Reemplaza `[ICONO]` y `[NOMBRE]` en la plantilla anterior:

#### ENAM (`enam.png`) — Examen Nacional de Medicina

```
Apply the SINAPSIS EDU platform card template (see brand spec) for
"ENAM" — the Peruvian National Medical Exam.

ICON: A large stylized stethoscope curved into a circular shape,
lime green (#C2E476), centered, with a small lime spark/glow at the
earpiece junction (the "synapse point").

WORDMARK: "ENAM" in massive cream-colored Barlow Condensed 800,
bottom-left aligned. Below: "SINAPSIS EDU" small lime green caption.

BACKGROUND: Dark teal (#10312D), neural dot pattern at 15% alpha,
lime blob top-right.

ASPECT: 16:9, 1200x675 pixels. Flat vector, no gradients, no shadows.
```

#### ENCIB (`encib.png`) — Ciencias Básicas

```
Apply the SINAPSIS EDU platform card template for "ENCIB" — National
Basic Sciences Exam.

ICON: A large stylized microscope, lime green (#C2E476), centered,
with a small lime spark at the eyepiece. The microscope can have
subtle dot-connection details suggesting neural pattern.

WORDMARK: "ENCIB" in massive cream Barlow Condensed 800, bottom-left.
Below: "SINAPSIS EDU" small lime caption.

BACKGROUND: Identical to the ENAM card — dark teal, neural dots,
lime blob top-right.

ASPECT: 16:9, 1200x675. Flat vector.
```

#### ENCAPS (`encaps.png`) — Capacidades Clínicas

```
Apply the SINAPSIS EDU platform card template for "ENCAPS" — Clinical
Capabilities Exam.

ICON: A clipboard with a stylized clinical case checklist, lime green
(#C2E476), centered. The checklist has 3-4 lines with lime checkmarks,
the topmost one glowing with a synapse spark.

WORDMARK: "ENCAPS" in massive cream Barlow Condensed 800, bottom-left.
Below: "SINAPSIS EDU" small lime caption.

BACKGROUND: Identical template — dark teal, neural dots, lime blob.

ASPECT: 16:9, 1200x675. Flat vector.
```

#### Residentado Médico (`rm.png`)

```
Apply the SINAPSIS EDU platform card template for "RESIDENTADO MEDICO"
exam preparation.

ICON: A graduation cap with a small stethoscope draped around it,
both in lime green (#C2E476), centered. A small lime spark glows
between the tassel and the stethoscope.

WORDMARK: "RESIDENTADO" in massive cream Barlow Condensed 800,
bottom-left (or "RM" if the word doesn't fit). Below: "SINAPSIS EDU"
small lime caption.

BACKGROUND: Identical template.

ASPECT: 16:9, 1200x675. Flat vector.
```

#### EsSalud (`essalud.png`)

```
Apply the SINAPSIS EDU platform card template for "ESSALUD" exam.

ICON: A stylized hospital building silhouette (minimal, just the
outline of a 3-floor structure with a + cross on top), lime green
(#C2E476), centered. A small lime spark glows on the cross.

WORDMARK: "ESSALUD" in massive cream Barlow Condensed 800, bottom-left.
Below: "SINAPSIS EDU" small lime caption.

BACKGROUND: Identical template.

ASPECT: 16:9, 1200x675. Flat vector.
```

#### Biblioteca Médica (`biblioteca.png`)

```
Apply the SINAPSIS EDU platform card template for "BIBLIOTECA MEDICA"
(digital medical library).

ICON: An open book with abstract page lines suggesting text, lime green
(#C2E476), centered. From the pages, small lime dots rise like neural
sparks — knowledge connecting.

WORDMARK: "BIBLIOTECA" in massive cream Barlow Condensed 800,
bottom-left. Below: "SINAPSIS EDU" small lime caption.

BACKGROUND: Identical template.

ASPECT: 16:9, 1200x675. Flat vector.
```

### Atajo más rápido si no quieres generar las 6

El componente actual de [PlataformaCard](frontend/src/components/PlataformaCard.tsx) ya renderiza
un gradiente Jungle con icono Lime de lucide-react. **No necesita imagen
para funcionar**. Las imágenes son una mejora visual, no obligatorias.

**Mínimo viable:** genera UNA imagen-plantilla buena (ENAM por ejemplo)
y edita solo el icono + texto para las 6 en Canva. 30 minutos vs 6 horas.

---

# 4. BENEFICIOS — 3 ilustraciones para sección oscura

**Dónde se usan:** [Landing.tsx](frontend/src/pages/Landing.tsx), sección "Todo lo que necesitas para aprobar" (fondo Jungle).

### Archivos a entregar

| Archivo | Tema | Tamaño |
|---------|------|--------|
| `banco-preguntas.png` | Bancos de preguntas curados | 800×800 |
| `simulacros.png` | Simulacros cronometrados | 800×800 |
| `multidispositivo.png` | Acceso desde cualquier dispositivo | 800×800 |

Todas en `frontend/public/images/beneficios/`.

### Prompts AI

#### `banco-preguntas.png`

```
Flat geometric illustration for a feature card on a dark teal (#10312D)
background. Subject: a stack of 3-4 question cards floating in the
center, each showing a multiple-choice layout (A/B/C/D buttons). The
topmost card glows with a lime green (#C2E476) circle around the
correct answer. Tiny lime spark connections (synapses) flow from the
top card outward, suggesting "knowledge clicking". Cards are cream
(#F3F1E8) with dark teal text/lines. Style: modern minimal SaaS
illustration similar to Linear or Notion feature graphics. No gradients,
flat colors. Transparent 800x800 PNG.

DO NOT include: realistic paper textures, drop shadows, 3D, marketing
clichés.
```

#### `simulacros.png`

```
Flat geometric illustration for a feature card. Subject: a circular
stopwatch / chronometer with a lime green (#C2E476) progress ring
filled at about 70%. Inside the stopwatch face, instead of numbers,
small dots forming a synapse pattern. Behind the stopwatch and to the
side, a partial floating question card (cream color, dark teal text).
A small lime spark connects the stopwatch ring to a "submit" button
shape. Style: same modern flat as the banco-preguntas illustration.
Transparent 800x800 PNG.

DO NOT include: realistic clock textures, mechanical gears,
photorealism.
```

#### `multidispositivo.png`

```
Flat geometric illustration showing three devices arranged from
left to right at slight angles: a laptop, a tablet, and a smartphone.
Each device displays the same abstract medical app interface — a lime
green (#C2E476) accent button visible, a few cream cards stacked. The
devices are slightly overlapped to suggest synchronization. Between
the three devices, tiny lime spark lines connect them — synapses
representing the seamless sync. Palette: cream device frames, dark
teal screen borders, lime green UI accents. Style: same modern flat
minimal. Transparent 800x800 PNG.

DO NOT include: brand-specific device shapes (Apple/Samsung), realistic
shadows, 3D perspective.
```

### Atajo top: unDraw.co

1. Ve a https://undraw.co/illustrations
2. Cambia el color primario (arriba derecha) a `#C2E476`
3. Descarga estos 3 (busca por nombre exacto):
   - **"Knowledge"** o **"Choice"** → guarda como `banco-preguntas.png`
   - **"Stopwatch"** o **"Time management"** → guarda como `simulacros.png`
   - **"Responsive"** o **"Devices"** → guarda como `multidispositivo.png`

Tiempo total: ~5 minutos para los 3.

---

# 5. SECCIÓN DE PAGO — QR Yape + logos

**Dónde se usan:** [Compra.tsx](frontend/src/pages/Compra.tsx) en el paso 3.

### Archivos a entregar

| Archivo | Tipo | Tamaño | Notas |
|---------|------|--------|-------|
| `qr-yape.png` | **FOTO REAL** | 600×600 | El QR de tu Yape personal. NO se genera con IA. |
| `yape-logo.svg` | Logo oficial | escalable | Descárgalo de https://www.yape.com.pe/prensa |
| `binance-logo.svg` | Logo oficial | escalable | Descárgalo de https://www.binance.com/en/brand |
| `banco-logo.png` | Logo del banco | 400×200 | BCP, Interbank, BBVA, según el que uses |
| `binance-wallet-qr.png` | (opcional) FOTO | 600×600 | Tu QR de dirección Binance USDT |

Guardar en `frontend/public/images/pago/`.

### Para el QR de Yape (instrucciones)

NO se genera con IA. Es tu QR personal.

1. Abre tu app Yape en el celular.
2. Tu nombre arriba → toca tu QR.
3. Captura de pantalla (Power + Vol-).
4. **Recorta solo el QR cuadrado**, sin el fondo de la app, sin tu nombre.
5. Súbelo a https://canva.com → plantilla cuadrada 600×600.
6. Agrega un marco blanco de 30px alrededor, sombra suave, opcionalmente
   un borde lime de 4px.
7. Exporta como PNG → guarda como `qr-yape.png`.

### Logos oficiales — NO los generes con IA

Generar logos de marcas registradas con IA da problemas legales y suelen
salir mal. Descárgalos de las páginas oficiales:

- **Yape**: https://www.yape.com.pe/prensa (sección "Logos y manual")
- **Binance**: https://www.binance.com/en/brand-assets
- **BCP / Interbank / BBVA / Scotiabank**: googlea "[banco] logo oficial vector"
  o usa https://worldvectorlogo.com/

---

# 6. OG IMAGE — Preview para compartir en redes

**Dónde se usa:** `<meta property="og:image">` en [index.html](frontend/index.html). Aparece cuando alguien comparte el link en WhatsApp, Facebook, X, LinkedIn.

### Archivos a entregar

| Archivo | Tamaño | Formato |
|---------|--------|---------|
| `og-image.png` | **1200×630** (estándar Open Graph) | PNG |

Guardar en `frontend/public/images/og/`.

### Prompt AI (Ideogram funciona excelente porque renderiza texto)

```
Open Graph social media preview image (1200x630 pixels) for "SINAPSIS
EDU" — sinapsisedu.com — a Peruvian medical exam preparation platform.

LAYOUT: Diagonal split. Left 55% of the canvas: lime green (#C2E476)
background. Right 45%: dark teal (#10312D) background. The diagonal
edge has a subtle synapse-pattern texture — small dots connected by
thin lines crossing the diagonal.

LEFT SIDE (lime green background):
- Large headline in bold condensed uppercase typography (Barlow
  Condensed 800 style): "PREPARATE PARA TU EXAMEN MEDICO"
- Color: dark teal (#10312D)
- Three lines max, tight letter spacing
- Below the headline, smaller text in Inter Medium: "ENAM · ENCIB ·
  ENCAPS · Residentado Medico · EsSalud" — same dark teal color

RIGHT SIDE (dark teal background):
- A glowing stylized SYNAPSE icon in lime green: two abstract nodes
  connected by a curved line with a bright lime spark at the junction.
  Large, centered vertically.

BOTTOM-LEFT CORNER (over the lime side):
- Small cream-colored text: "SINAPSISEDU.COM"
- Tiny synapse icon next to the URL in dark teal

STYLE: Premium, professional, modern editorial. Flat colors, no
gradients, no shadows except a subtle glow around the synapse spark.
Looks like a Linear / Stripe / Vercel announcement card.

DO NOT include: stock photo doctors, generic medical icons, dollar
signs, stars, decorative borders, gradients.
```

### Receta rápida en Canva (sin IA)

1. Plantilla custom 1200×630.
2. Fondo dividido diagonal: izquierda Lime `#C2E476`, derecha Jungle `#10312D`.
3. Texto izquierdo (Jungle): **"PREPÁRATE PARA TU EXAMEN"** en Barlow
   Condensed 800, 90px.
4. Subtítulo (Jungle): "ENAM · ENCIB · ENCAPS · Residentado · EsSalud"
   en Inter 32px.
5. Icono derecho (Lime): tu logo `logo-icono.svg` a 280px.
6. Esquina inferior izquierda: "SINAPSISEDU.COM" en Inter Medium 22px,
   color Jungle.
7. Exporta PNG. Listo.

---

# 📋 CHECKLIST — qué entregar

Marca con ✅ cuando guardes cada archivo en la ruta correcta:

### Logos
- [ ] `frontend/public/images/logo/logo.svg`
- [ ] `frontend/public/images/logo/logo-blanco.svg`
- [ ] `frontend/public/images/logo/logo-icono.svg`
- [ ] `frontend/public/favicon.svg` (sobreescrito con el nuevo)

### Hero
- [ ] `frontend/public/images/hero/hero-ilustracion.png`

### Plataformas (6)
- [ ] `frontend/public/images/plataformas/enam.png`
- [ ] `frontend/public/images/plataformas/encib.png`
- [ ] `frontend/public/images/plataformas/encaps.png`
- [ ] `frontend/public/images/plataformas/rm.png`
- [ ] `frontend/public/images/plataformas/essalud.png`
- [ ] `frontend/public/images/plataformas/biblioteca.png`

### Beneficios (3)
- [ ] `frontend/public/images/beneficios/banco-preguntas.png`
- [ ] `frontend/public/images/beneficios/simulacros.png`
- [ ] `frontend/public/images/beneficios/multidispositivo.png`

### Pago
- [ ] `frontend/public/images/pago/qr-yape.png`
- [ ] `frontend/public/images/pago/yape-logo.svg`
- [ ] `frontend/public/images/pago/binance-logo.svg`
- [ ] `frontend/public/images/pago/banco-logo.png`

### OG
- [ ] `frontend/public/images/og/og-image.png`

**Total: 17 archivos máximo.** El portal funciona aunque no estén todos —
los componentes ya tienen fallbacks decentes.

---

# 🎯 Prioridad sugerida (si vas por etapas)

1. **Logo** → impacta todo el portal (Navbar, Footer, Aula, OG, favicon).
2. **OG image** → importante para compartir el link de sinapsisedu.com en
   redes y WhatsApp con buena pinta.
3. **Hero** → mejora el primer impacto al entrar al portal.
4. **Plataformas** → lo más visible de la landing.
5. **Beneficios** → completa la landing.
6. **Pago** → solo el QR de Yape es crítico para Fase 2.

---

# 🚀 Cuando termines

1. Avísame qué archivos generaste (puede ser solo algunos).
2. Te confirmo si los nombres están bien o si renombro.
3. Yo cableo cada imagen en su componente correspondiente y actualizo:
   - El nombre `PORTAL CENTRAL` → `SINAPSIS EDU` en Navbar/Footer/index.html.
   - Los meta tags `og:image`, `og:url`, `og:title` con `sinapsisedu.com`.
   - El title del documento HTML.
   - El componente PlataformaCard para usar las imágenes nuevas (con fallback al gradiente actual si la imagen falla).
4. Hacemos un commit `feat(brand): integrar identidad visual de SINAPSIS EDU`.

---

# 💡 Tips finales

- **Consistencia > cantidad.** Mejor 3 imágenes coherentes que 17 dispares.
- **Optimiza siempre.** Usa squoosh.app para bajar peso. Las 6 cards no
  deberían pesar más de 2 MB en total.
- **Si una imagen no convence, regenera.** Iterar el prompt es gratis.
  No aceptes "más o menos".
- **Hot reload.** Cuando guardes una imagen en `public/`, Vite la sirve
  al instante. Solo refresca el navegador.
- **Cache.** Si reemplazas con el mismo nombre, hard refresh (`Ctrl+Shift+R`)
  para que el navegador recargue.
- **Texto en imágenes.** Si la IA pone texto mal escrito ("SINAPSI SEDU"
  en vez de "SINAPSIS EDU"), prueba **Ideogram** que es el mejor para
  texto, o pásala por Canva y reemplaza el texto a mano.
