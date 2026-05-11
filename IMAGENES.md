# IMAGENES.md — Guía completa de imágenes del Portal Central

> Hoja de ruta visual del portal. Prompts AI, dimensiones, ubicaciones y
> convenciones de nombres. Cuando termines de generar las imágenes,
> renómbralas exactamente como se indica y avísame para cablearlas.

---

## 🎨 Paleta de marca (incluir en TODOS los prompts AI)

```
PRIMARIOS
  Lime:    #C2E476   ← acento vivo (botones, highlights)
  Jungle:  #10312D   ← verde oscuro casi negro (fondos serios, texto)
  Cream:   #F3F1E8   ← beige suave (fondos neutros)

SECUNDARIOS
  Lime Dark:  #AACF57   ← gradientes
  Jungle Dark:#0B211F   ← negros con tinte verde
  Purple:     #795BC2   ← acento puntual (badges)
  WhatsApp:   #25D366   ← solo para botón WhatsApp
```

**Vibe del proyecto:** premium, médico moderno, energético, profesional.
**Lo que NO queremos:** institucional acartonado, stock photo aburrida,
fotos de doctores con mascarilla y pulgar arriba, gradientes morados de
hospital, iconitos planos genéricos.

---

## 📁 Dónde guardar las imágenes

Crea esta carpeta:

```
portal-central/frontend/public/images/
├── logo/
├── hero/
├── plataformas/
├── beneficios/
├── pago/
└── og/
```

Cuando guardes un archivo, **respeta el nombre EXACTO** que se indica en
cada sección (en minúsculas, sin tildes, con guiones medios). Si lo
nombras distinto, dímelo y lo cableo con ese nombre.

---

## 🛠️ Herramientas recomendadas

| Tipo | Herramienta | Cuándo usarla |
|------|-------------|---------------|
| Generación IA | **ChatGPT (DALL·E 3)** | Ilustraciones, escenas médicas, hero. Razonablemente bueno con prompts en inglés. |
| Generación IA | **Gemini Imagen** | Alternativa gratuita. Buena calidad. |
| Generación IA | **Midjourney** | Mejor calidad si tienes suscripción. Estilo más cinematográfico. |
| Stock photo | **unsplash.com** | Fotos reales sin marca de agua. Búsqueda en inglés. |
| Stock photo | **pexels.com** | Igual que Unsplash, complementario. |
| Ilustraciones SVG | **unDraw.co** | **MUY RECOMENDADO**: SVG editables con color personalizable. Pones el color #C2E476 y queda perfecto para nuestra marca. |
| Edición rápida | **canva.com** | Para QR de Yape con marco, OG image, retoques. |
| Compresión | **squoosh.app** | Después de generar, comprime PNG → WebP o reduce kB. |

---

## 📐 Convenciones técnicas

- **Logos / iconos**: SVG (escalable) o PNG con fondo transparente.
- **Cards de plataforma**: PNG o JPG, ratio 16:9, ancho mínimo 800px.
- **Hero**: PNG con transparencia, ancho mínimo 1200px.
- **Fotos (vouchers, QR, etc.)**: JPG / PNG, ancho 600-1000px.
- **OG image** (compartir en redes): PNG 1200×630.
- **Tamaño máximo por archivo**: 500 KB. Si excede, comprime con squoosh.

---

# 1. LOGO PRINCIPAL

**Dónde se usa:** [Navbar](frontend/src/components/Navbar.tsx) · [Footer](frontend/src/components/Footer.tsx) · [Aula](frontend/src/pages/Aula.tsx) · favicon · OG image.

### Archivos a entregar

| Archivo | Dónde guardar | Tamaño | Formato |
|---------|---------------|--------|---------|
| `logo.svg` | `frontend/public/images/logo/` | escalable | SVG |
| `logo-blanco.svg` | `frontend/public/images/logo/` | escalable | SVG (versión sobre fondo oscuro) |
| `favicon.svg` | `frontend/public/` (sobreescribir) | 64×64 | SVG |

### Prompt AI

```
Modern minimalist logo for "PORTAL CENTRAL" — a Peruvian medical education
platform. Symbol: a stylized stethoscope curving into the letter "P", or
a shield with a subtle cross/pulse line. Wordmark in bold condensed
uppercase typography (similar to Barlow Condensed 800), all letters
equal weight. Color: dark teal/jungle green #10312D for the wordmark on
light backgrounds. Geometric, confident, premium feel. Flat vector style,
no gradients, no 3D. Clean negative space. Aspect ratio: horizontal
landscape (3:1).
```

### Versión sobre fondo oscuro (para Aula header)

Misma logo pero con el wordmark en color Lime `#C2E476` en vez de Jungle.

### Notas

- Si no tienes ganas de generar uno propio, sigue funcionando el SVG actual de [public/logo.svg](frontend/public/logo.svg). Es serviciable pero genérico.
- El nombre **"PORTAL CENTRAL"** debe leerse claro a 200px de ancho.

---

# 2. HERO — Fondo del hero principal

**Dónde se usa:** [Landing.tsx](frontend/src/pages/Landing.tsx), sección de arriba.

### Archivos a entregar

| Archivo | Dónde guardar | Tamaño | Formato |
|---------|---------------|--------|---------|
| `hero-ilustracion.png` | `frontend/public/images/hero/` | 1200×800 | PNG con transparencia |

### Prompt AI (ChatGPT / DALL·E 3 / Gemini)

```
Editorial-style flat illustration of a confident young Peruvian medical
student, dark hair, white lab coat, holding an iPad showing a question
bank interface. Background: abstract geometric shapes in lime green
(#C2E476), dark forest green (#10312D) and cream (#F3F1E8). Floating UI
elements around her: a stethoscope icon, a microscope, a graduation cap,
a checkmark. Modern, clean, premium SaaS landing page illustration style
similar to Stripe, Linear or Vercel marketing pages. No drop shadows,
flat colors only. Composition: subject centered-right, breathing room on
the left for headline text. Transparent background.
```

### Alternativa minimalista (si quieres algo más sutil)

```
Abstract flat geometric composition for a medical SaaS landing page hero.
Layered shapes: a large lime green (#C2E476) circle, overlapping dark
teal (#10312D) rounded rectangle, a small purple (#795BC2) accent dot,
and a thin cream (#F3F1E8) wave line crossing through. Floating in the
center: stylized stethoscope outline, microscope, and book icons in
dark teal. Bauhaus-inspired, premium feel, no gradients, transparent
background. 1200x800px.
```

### Búsqueda en stock (Unsplash / Pexels)

Busca: `medical student tablet`, `young doctor studying laptop`, `flat lay stethoscope notebook`.
Filtra por verticales con espacio para texto a un lado.

### Notas

- Si NO quieres imagen de hero (preferir solo tipografía), avísame y dejo el hero sin imagen pero con animación de fondo.
- DESIGN.md menciona que el hero puede ir solo con texto + tag pill. Es válido.

---

# 3. THUMBNAILS DE PLATAFORMAS (6 imágenes)

**Dónde se usan:** cards en [Landing.tsx](frontend/src/pages/Landing.tsx) sección "Plataformas" y en [Plataforma.tsx](frontend/src/pages/Plataforma.tsx) detalle.

### Archivos a entregar

| Archivo | Plataforma | Dónde guardar | Tamaño |
|---------|------------|---------------|--------|
| `enam.png` | ENAM | `frontend/public/images/plataformas/` | 800×450 (16:9) |
| `encib.png` | ENCIB | `frontend/public/images/plataformas/` | 800×450 |
| `encaps.png` | ENCAPS | `frontend/public/images/plataformas/` | 800×450 |
| `rm.png` | Residentado Médico | `frontend/public/images/plataformas/` | 800×450 |
| `essalud.png` | EsSalud | `frontend/public/images/plataformas/` | 800×450 |
| `biblioteca.png` | Biblioteca Médica | `frontend/public/images/plataformas/` | 800×450 |

### Estilo común (CRUCIAL)

**Las 6 cards deben verse como una familia.** Mismo estilo, misma paleta,
mismo tratamiento. Si parecen 6 imágenes de 6 sitios distintos, se ve mal.

Tres opciones de estilo (elige UNA y aplícala a las 6):

#### Opción A — Mockup de plataforma sobre fondo abstracto (recomendado)

Cada imagen muestra un mockup de laptop/tablet con un screenshot de
interfaz de banco de preguntas, sobre un fondo geométrico de la paleta
de marca. El icono médico de la materia flotando al lado.

#### Opción B — Iconografía + tipografía sobre gradiente

Fondo gradiente Jungle (#10312D) a Jungle-light, icono grande en Lime
centrado, nombre de la plataforma en Barlow Condensed bold abajo.

#### Opción C — Foto realista temática

Foto real (stock) relacionada al tema, con overlay duotone Lime/Jungle.
Más caro de generar pero muy premium.

### Prompts AI por plataforma (Opción A)

#### ENAM (`enam.png`) — Examen Nacional de Medicina

```
Hero card image for "ENAM" (Peruvian medical exam) on a 16:9 canvas.
Layout: dark teal background (#10312D) with a soft lime green (#C2E476)
geometric blob in the corner. Centered: a 3/4 angle mockup of a laptop
screen showing a multiple-choice clinical question interface (clean,
white background, lime accent buttons). Floating to the side: a glowing
stethoscope icon in lime green. Bottom-left corner text: "ENAM" in bold
condensed uppercase typography (Barlow Condensed 800) in cream color.
Premium SaaS marketing card aesthetic. Flat colors, no harsh shadows.
800x450 pixels.
```

#### ENCIB (`encib.png`) — Ciencias Básicas

```
Hero card image for "ENCIB" (Examen Nacional de Ciencias Básicas) on a
16:9 canvas. Layout: dark teal background (#10312D) with a soft lime
geometric shape. Centered: 3/4 mockup of tablet screen showing a
biology/anatomy diagram with a multiple-choice question below. Floating
icon: a microscope in lime green (#C2E476). Bottom-left text: "ENCIB"
in bold condensed uppercase, cream color. Same premium style as the
ENAM card. 800x450 pixels.
```

#### ENCAPS (`encaps.png`) — Capacidades Clínicas

```
Hero card image for "ENCAPS" (Capacidades Clínicas exam) on a 16:9
canvas. Same template as ENAM/ENCIB cards: dark teal background, lime
geometric accents, mockup of a clinical case interface on tablet,
floating icon of an open medical book or a clipboard with checkmark in
lime green. Bottom-left text: "ENCAPS" in cream bold condensed. 800x450.
```

#### Residentado Médico (`rm.png`)

```
Hero card image for "RESIDENTADO MEDICO" exam preparation on a 16:9
canvas. Same template style. Floating icon: a graduation cap with a
small stethoscope underneath, lime green color. Bottom-left text:
"RESIDENTADO" in cream bold condensed. Background dark teal with lime
geometric shapes. 800x450.
```

#### EsSalud (`essalud.png`)

```
Hero card image for "ESSALUD" concurso preparation on a 16:9 canvas.
Same template style: dark teal background, lime accents, mockup of a
question interface. Floating icon: a building/hospital silhouette in
lime green. Bottom-left text: "ESSALUD" in cream bold condensed. 800x450.
```

#### Biblioteca Médica (`biblioteca.png`)

```
Hero card image for "BIBLIOTECA MEDICA" (digital medical library) on a
16:9 canvas. Same template style: dark teal background, lime accents,
mockup of a tablet showing a stack of book covers or a reader interface.
Floating icon: an open book with a small bookmark in lime green.
Bottom-left text: "BIBLIOTECA" in cream bold condensed. 800x450.
```

### Búsqueda en stock (si prefieres Opción C foto real)

Busca y aplica luego overlay duotone (puedes hacerlo en Canva):
- ENAM: `medical exam students`, `stethoscope on book`
- ENCIB: `microscope`, `biology lab`
- ENCAPS: `clinical case`, `doctor patient consultation`
- RM: `medical residency`, `graduation hospital`
- EsSalud: `hospital building peru`, `medical clinic exterior`
- Biblioteca: `medical books stack`, `library reading`

### Notas

- Si elegiste Opción B (sin mockup), reusa el componente actual de
  PlataformaCard — ya renderiza un gradiente Jungle con icono Lime de
  lucide-react. No hace falta imagen. Solo necesitas imágenes si quieres
  algo más premium.
- Para una primera versión rápida, **basta con generar 1 imagen "plantilla"**
  y editar el ícono+texto para las 6. Te dejo el código para que cargue
  desde public/.

---

# 4. BENEFICIOS — 3 ilustraciones para sección oscura

**Dónde se usan:** [Landing.tsx](frontend/src/pages/Landing.tsx), sección "Todo lo que necesitas para aprobar".

### Archivos a entregar

| Archivo | Tema | Tamaño |
|---------|------|--------|
| `banco-preguntas.png` | Bancos de preguntas curados | 600×600 |
| `simulacros.png` | Simulacros cronometrados | 600×600 |
| `multidispositivo.png` | Acceso desde cualquier dispositivo | 600×600 |

Guardar en `frontend/public/images/beneficios/`.

### Prompt AI

#### `banco-preguntas.png`

```
Flat geometric illustration for a feature card on a dark background.
Subject: a stack of question cards floating, each with a multiple-choice
A/B/C/D layout, the top card glowing with a lime green (#C2E476) check
mark. Background: transparent. Color palette: lime green (#C2E476) as
primary accent, cream white (#F3F1E8) for the cards, dark teal (#10312D)
strokes. Style: modern, minimal, SaaS hero illustration like Linear or
Notion. Square 600x600 transparent PNG.
```

#### `simulacros.png`

```
Flat geometric illustration for a feature card. Subject: a stopwatch /
chronometer with a lime green (#C2E476) progress ring filling up, and
behind it a partial exam paper with multiple-choice questions. Style
same as previous: modern SaaS, minimal, flat. Palette: lime accents,
cream paper, dark teal outlines. Transparent 600x600 PNG.
```

#### `multidispositivo.png`

```
Flat geometric illustration showing three devices side-by-side at an
angle: a laptop, a tablet, and a smartphone, each displaying the same
abstract medical app interface (lime green accent button visible). The
devices are slightly overlapped to show responsive design. Palette:
cream device frames, dark teal screen edges, lime green UI accents.
Modern minimal SaaS style. Transparent 600x600 PNG.
```

### Atajo recomendado: unDraw.co

Ve a https://undraw.co/illustrations y busca:
- `questions` → elige "Knowledge" o "Choice"
- `stopwatch` → "Stopwatch" o "Time management"
- `devices` → "Responsive" o "Devices"

Cambia el color primario a **#C2E476** en el selector de la web, descarga
el SVG. ¡Listo!

---

# 5. SECCIÓN DE PAGO — QR Yape, Binance, banco

**Dónde se usan:** [Compra.tsx](frontend/src/pages/Compra.tsx) en el paso 3.

### Archivos a entregar

| Archivo | Tipo | Tamaño | Notas |
|---------|------|--------|-------|
| `qr-yape.png` | **FOTO REAL** | 500×500 | El QR de tu cuenta Yape personal. Capturalo desde tu app y recortalo. |
| `yape-logo.svg` | Logo | escalable | Logo oficial de Yape (descárgalo de https://www.yape.com.pe) |
| `binance-logo.svg` | Logo | escalable | Logo oficial de Binance (descárgalo de https://binance.com/en/brand) |
| `banco-logo.png` | Logo del banco | 400×200 | BCP, Interbank, BBVA — el que uses para transferencias |
| `binance-wallet-qr.png` | (opcional) FOTO REAL | 500×500 | Tu QR de dirección Binance USDT |

Guardar en `frontend/public/images/pago/`.

### Para el QR de Yape (importante)

NO es una imagen generada por IA. Es una foto REAL de tu QR personal:

1. Abre tu app Yape.
2. Toca tu QR personal.
3. Captura de pantalla (Power + Vol- en celular).
4. Recorta el QR cuadrado limpio, sin fondo de la app.
5. Guarda como `qr-yape.png` 500×500.

Si quieres marco bonito alrededor: súbelo a Canva, agrégale un borde
verde lime de 8px, fondo blanco. Sale en 30 segundos.

### Logos oficiales (NO generes con IA)

- **Yape**: usa el logo oficial de https://www.yape.com.pe/prensa o pídele a
  un diseñador. Generarlo con IA puede dar problemas legales.
- **Binance**: descárgalo de https://www.binance.com/en/brand-assets
- **Bancos**: usa el logo oficial del banco (BCP, Interbank, etc.).

---

# 6. OG IMAGE — Vista previa para compartir en redes

**Dónde se usa:** `<meta property="og:image" />` en [index.html](frontend/index.html). Es lo que aparece cuando alguien comparte el link en WhatsApp, Facebook, X, etc.

### Archivos a entregar

| Archivo | Tamaño | Formato |
|---------|--------|---------|
| `og-image.png` | **1200×630** (estándar OG) | PNG |

Guardar en `frontend/public/images/og/`.

### Prompt AI

```
Open Graph social media preview image (1200x630 pixels) for "Portal
Central" — Peruvian medical exam preparation platform.
Layout: Lime green (#C2E476) background on the left half, dark teal
(#10312D) on the right half, diagonal split. Left side: large bold
condensed uppercase headline "PREPARATE PARA TU EXAMEN MEDICO" in dark
teal color, three lines max. Right side: a stylized stethoscope icon
in lime green, large, centered. Bottom-right: small "portalcentral.com"
URL placeholder in cream. Premium, professional SaaS landing page
preview style. Flat colors, geometric, no gradients.
```

### Alternativa rápida en Canva

1. Plantilla "Open Graph" (1200×630).
2. Fondo dividido: izquierda Lime, derecha Jungle.
3. Texto izquierdo: **"PREPÁRATE PARA TU EXAMEN"** en Barlow Condensed
   bold 96px, color Jungle.
4. Subtítulo: "ENAM · ENCIB · ENCAPS · Residentado" en Inter 32px Jungle.
5. Icono derecho: estetoscopio Lime grande.
6. Esquina inferior: el logo de Portal Central.
7. Exporta como PNG.

---

# 📋 CHECKLIST — qué entregar para considerar imágenes completas

Marca con ✅ cuando guardes cada archivo en la ruta correcta:

### Logos
- [ ] `frontend/public/images/logo/logo.svg`
- [ ] `frontend/public/images/logo/logo-blanco.svg`
- [ ] `frontend/public/favicon.svg` (sobreescrito)

### Hero
- [ ] `frontend/public/images/hero/hero-ilustracion.png`

### Plataformas
- [ ] `frontend/public/images/plataformas/enam.png`
- [ ] `frontend/public/images/plataformas/encib.png`
- [ ] `frontend/public/images/plataformas/encaps.png`
- [ ] `frontend/public/images/plataformas/rm.png`
- [ ] `frontend/public/images/plataformas/essalud.png`
- [ ] `frontend/public/images/plataformas/biblioteca.png`

### Beneficios
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

**Total: 17 archivos máximo.** Empieza por las plataformas y el hero si
quieres ver el cambio más vistoso.

---

# 🚀 Cuando termines

1. Avísame qué archivos generaste y cuáles no (no necesitas TODAS — el
   código actual fallback a iconos cuando no hay imagen).
2. Te confirmo si los nombres están bien o si renombro alguno.
3. Yo cableo cada imagen en su componente correspondiente.
4. Hacemos un commit "feat(visual): integrar imágenes de marca".

**Prioridad sugerida** (si vas a generar por etapas):

1. **Logo** (impacta todo el portal)
2. **Plataformas** (lo más visible en la landing)
3. **OG image** (importante para compartir el link)
4. **Hero** (mejora el primer impacto)
5. **Beneficios** (mejora la sección oscura)
6. **Pago** (QR de Yape es el único crítico para Fase 2)

---

# 🎯 Tips finales

- **Consistencia > cantidad.** Mejor 3 imágenes coherentes que 17 dispares.
- **Optimiza siempre.** Usa squoosh.app para bajar peso. Las 6 cards no deberían pesar más de 1.5 MB en total.
- **Si una imagen no convence, regenera.** Cambia el prompt iterando, no aceptes "más o menos".
- **Hot reload.** Cuando guardes una imagen en `public/`, Vite la sirve al instante. Solo hay que refrescar el navegador.
- **Cache.** Si reemplazas una imagen con el mismo nombre, hard refresh (`Ctrl+Shift+R`) para que el navegador la recargue.
