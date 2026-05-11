# Portal Central de Accesos

Portal que vende y sirve acceso a 6 plataformas médicas independientes (ENAM, ENCIB, ENCAPS, Residentado Médico, EsSalud, Biblioteca Médica). Las plataformas se muestran **embebidas** dentro del portal sin revelar su URL real.

> Ver `CLAUDE.md` (arquitectura y reglas) y `DESIGN.md` (sistema visual) en la raíz del repositorio padre.

---

## Estructura

```
portal-central/
├── package.json            workspaces (backend + frontend)
├── .env.example            plantilla de claves (referencia)
├── .gitignore
│
├── backend/                Apps Script + TypeScript (clasp)
│   ├── appsscript.json     manifest con scopes Sheets/Drive/Gmail
│   ├── package.json        scripts: push, deploy, logs, typecheck
│   ├── tsconfig.json       TS estricto, target ES2019, módulo none
│   ├── .clasp.json.example plantilla (.clasp.json real va en .gitignore)
│   ├── .claspignore
│   └── src/
│       ├── main.ts         doGet + doPost (único punto de entrada)
│       ├── api.ts          dispatcher público y admin
│       ├── services.ts     Sheets, Drive, Gmail, Properties, Logs
│       ├── utils.ts        validación, hashing, IDs, fechas
│       ├── types.ts        modelo de datos compartido
│       └── views/
│           ├── admin.html
│           ├── adminScript.html
│           └── adminStyles.html
│
└── frontend/               Vite + React + TypeScript + Tailwind
    ├── package.json
    ├── tsconfig.json + tsconfig.node.json
    ├── vite.config.ts
    ├── tailwind.config.ts  paleta exacta de DESIGN.md
    ├── postcss.config.js
    ├── index.html          fuentes Google: Barlow Condensed + Inter
    ├── public/
    │   ├── favicon.svg
    │   └── logo.svg
    └── src/
        ├── main.tsx
        ├── App.tsx
        ├── router.tsx      HashRouter (gh-pages compatible)
        ├── config.ts
        ├── vite-env.d.ts
        ├── api/
        │   └── client.ts   fetch wrapper al Apps Script
        ├── components/
        │   ├── Navbar.tsx
        │   ├── Footer.tsx
        │   ├── PlataformaCard.tsx
        │   ├── PricingCard.tsx
        │   ├── PagoOpciones.tsx
        │   ├── WhatsAppButton.tsx
        │   └── IframeViewer.tsx
        ├── hooks/
        │   ├── useAuth.ts
        │   └── usePlataformas.ts
        ├── pages/
        │   ├── Landing.tsx
        │   ├── Plataforma.tsx
        │   ├── Compra.tsx
        │   ├── Gracias.tsx
        │   ├── Login.tsx
        │   ├── Portal.tsx
        │   └── Aula.tsx
        └── styles/
            └── globals.css
```

---

## Estado del proyecto

### ✅ Fase 0 — Setup completo (2026-05-07)

- [x] Estructura de carpetas creada en `portal-central/`.
- [x] Backend Apps Script + TypeScript con clasp (placeholders, sin desplegar).
- [x] Frontend Vite + React 18 + TypeScript + Tailwind 3.
- [x] Tailwind configurado con la paleta exacta de DESIGN.md (lime/jungle/cream + tipografías Barlow Condensed e Inter).
- [x] 7 páginas y 7 componentes en estado stub navegables.
- [x] Hook `usePlataformas` con datos demo de las 6 plataformas.
- [x] Hook `useAuth` con sessionStorage (firma lista para Fase 5).
- [x] Cliente API único (`api/client.ts`) con `ping()` para verificar el backend.
- [x] Build verificado: `npm run build` (frontend, 188 KB JS / 17 KB CSS) y `npm run typecheck` (backend) pasan sin errores.
- [x] Repositorio Git local inicializado (rama `main`, 2 commits).
- [x] Servidor dev corriendo en `http://localhost:5173/` (HTTP 200).

### ✅ Fase 1 — Backend Apps Script desplegado (2026-05-11)

- [x] Backend Apps Script container-bound al Sheet `1LQf-scklnp...`.
- [x] 4 pestañas creadas con headers Jungle/Lime: Plataformas (+ 6 filas seed), Usuarios, Compras, Logs.
- [x] Carpeta Drive de vouchers configurada (`18KTajQ...`).
- [x] Todas las Properties seteadas: SHEET_ID, DRIVE_FOLDER_VOUCHERS, ADMIN_EMAIL, NOTIFICACION_EMAIL, SESSION_SECRET, WHATSAPP_NUMBER, RATE_LIMIT_PER_HOUR.
- [x] Web App desplegado y respondiendo: `ping` devuelve `status: online` y `listarPlataformasPublicas` devuelve las 6 plataformas (sin `url_real`).
- [x] `frontend/.env` apuntando al Web App. Landing en localhost:5173 muestra "Backend conectado" 🟢.
- [x] `tsc --noEmit` pasa en backend (TypeScript original) y frontend.

Ruta de despliegue usada: paste manual de [Code.gs](backend/apps-script-paste/Code.gs) en script abierto desde **Extensiones → Apps Script** del Sheet (container-bound, sin clasp).

Lo que falta — son comandos que solo tú puedes correr:

#### Paso 1 — Login y crear el proyecto Apps Script (una sola vez)

```powershell
cd "f:\PLATAFORMA MEDICINA PRO\portal-central\backend"
npx clasp login
# Abre tu navegador → loguéate con canazach12@gmail.com → autoriza clasp.
```

Si es la primera vez, tendrás que habilitar la API de Apps Script en
https://script.google.com/home/usersettings (toggle "Google Apps Script API" → ON).

```powershell
npx clasp create --type webapp --title "PortalCentral_Backend" --rootDir ./src
```

Esto crea un nuevo proyecto Apps Script y genera `.clasp.json` con el `scriptId`.
**Ya está en `.gitignore`**, no se sube al repo.

#### Paso 2 — Subir el código

```powershell
npm run push
```

Sube `appsscript.json` + los 5 archivos `.ts` (clasp los transpila) + las 3 vistas HTML.

#### Paso 3 — Ejecutar `setup()` desde el editor (una sola vez)

```powershell
npx clasp open
```

Se abre el proyecto Apps Script en el navegador. En el editor:
1. Selecciona el archivo `services.gs` (o el que tenga la función `setup`).
2. En el dropdown de funciones (arriba), elige **`setup`**.
3. Click en **Run** (▶).
4. Autoriza los permisos cuando lo pida (Sheets + Drive + Gmail).
5. Revisa el log de ejecución: debe imprimir un objeto con `ok: true`,
   los IDs del Spreadsheet y la carpeta Drive creados, y la lista de Properties añadidas.

`setup()` es idempotente: puedes correrlo múltiples veces sin duplicar nada.

#### Paso 4 — Desplegar el Web App

```powershell
npm run deploy
```

Imprime una URL del tipo `https://script.google.com/macros/s/AKfycb.../exec`.

#### Paso 5 — Conectar el frontend

Crea `frontend/.env` (si no existe) y pega la URL como `VITE_API_URL`:

```powershell
cd ..\frontend
Copy-Item .env.example .env
# edita .env y reemplaza la URL
```

Luego reinicia `npm run dev`. El indicador del hero debe pasar de
"Backend no desplegado" → "Backend conectado" 🟢.

#### Verificación rápida (opcional)

```powershell
# Test directo desde la terminal:
$url = "https://script.google.com/macros/s/TU_SCRIPT_ID/exec"
Invoke-RestMethod "$url`?ping=1"
```

Debe devolver `ok: true, data: { status: "online", properties: { ok: true } }`.

### Fases siguientes

| Fase | Entregable |
|------|------------|
| 2 | API pública (`registrarCompra`, `subirVoucher`) + correo a admin |
| 3 | Frontend premium completo (formularios reales, QR Yape, voucher upload) |
| 4 | Panel admin (login, aprobar/rechazar, enviar credenciales) |
| 5 | Login alumno + Portal con accesos + Aula con iframe |
| 6 | Pulido (logs, vencimientos, FAQ, testimonios) |
| 7+ | Stripe, OCR voucher, WhatsApp Cloud API, dominio Hostinger |

---

## Setup local

### Frontend (ya configurado)

```powershell
cd portal-central\frontend
npm install
Copy-Item .env.example .env       # editar VITE_API_URL cuando exista el deploy
npm run dev                        # http://localhost:5173
```

Comandos útiles:
- `npm run build` — genera `dist/` listo para servir.
- `npm run preview` — sirve la build estática.
- `npm run typecheck` — verifica TypeScript sin emitir.

### Backend (Fase 1, pendiente de credenciales)

```powershell
cd portal-central\backend
npm install
npx clasp login                                    # una vez por máquina
npx clasp create --type webapp --title "PortalCentral_Backend" --rootDir ./src
# copiar el scriptId que imprime al .clasp.json
npm run push                                       # sube el código a Apps Script
npm run deploy                                     # genera URL del Web App
```

Pegar la URL del Web App en `frontend/.env` como `VITE_API_URL`.

Properties que hay que configurar en Apps Script (Project Settings → Script Properties):

| Clave | Valor |
|-------|-------|
| `SHEET_ID` | ID del Spreadsheet `PortalCentral_DB` |
| `DRIVE_FOLDER_VOUCHERS` | ID de la carpeta privada de Drive |
| `ADMIN_EMAIL` | correo del administrador |
| `NOTIFICACION_EMAIL` | correo donde llegan las solicitudes |
| `SESSION_SECRET` | string aleatorio largo |
| `WHATSAPP_NUMBER` | `51984300510` |
| `RATE_LIMIT_PER_HOUR` | `10` |

---

## Stack

| Capa | Tecnología |
|------|------------|
| Frontend | Vite 5 + React 18 + TypeScript 5 + Tailwind 3 |
| Routing | React Router v6 (HashRouter para gh-pages) |
| Iconos | lucide-react |
| Backend | Google Apps Script + TypeScript (vía clasp) |
| BD | Google Sheets (4 hojas: Plataformas, Usuarios, Compras, Logs) |
| Storage | Google Drive (vouchers privados) |
| Email | Gmail (`MailApp.sendEmail`) |
| Pagos MVP | Yape QR · Binance · Transferencia · WhatsApp manual |

---

## Convenciones

- **Idioma:** comunicación en español, código en inglés (variables) + español (datos de Sheets).
- **TypeScript estricto** en ambos lados.
- **IDs** con prefijo: `U-001`, `C-001`, `P-001`.
- **Fechas** en ISO 8601.
- **Commits** en español, descriptivos: `feat:`, `fix:`, `chore:`, `docs:`.
- **Reglas de diseño:** nunca improvisar colores/tipografías; ver `DESIGN.md`.
- **Reglas de seguridad:** la API pública nunca devuelve `url_real`, `password_hash` ni datos de otros usuarios.

---

## WhatsApp

Número único: **+51 984 300 510**

Usado para:
1. Pago manual alternativo (botón en `Compra.tsx`).
2. Soporte (botón flotante `<WhatsAppFloating />`).
3. Recuperación de cuenta (link en `Login.tsx`).
