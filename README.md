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

### ⏳ Fase 1 — Backend Apps Script (siguiente)

Lo que se construirá:
- Web App de Apps Script desplegado vía clasp con URL pública.
- `?ping=1` devolviendo JSON `{ ok: true, status: "online" }`.
- `inicializarSheets()` que crea las 4 hojas (`Plataformas`, `Usuarios`, `Compras`, `Logs`) con sus headers en el Spreadsheet `PortalCentral_DB`.
- `services.ts` con acceso real a Sheets, Drive y Gmail.
- Properties cargadas en Apps Script (SHEET_ID, DRIVE_FOLDER_VOUCHERS, ADMIN_EMAIL, etc.).
- `frontend/.env` actualizado con `VITE_API_URL` apuntando al deploy.

Lo que necesito de Yubert antes de empezar Fase 1:
- ID del Spreadsheet `PortalCentral_DB` (o autorización para crear uno nuevo).
- ID de la carpeta Drive para vouchers (o autorización para crear una nueva).
- Correo admin para notificaciones (¿`canazach12@gmail.com` u otro?).
- Confirmación de la cuenta Google con la que correrá `clasp login`.

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
