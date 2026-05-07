# Portal Central de Accesos

Portal que vende y sirve acceso a 6 plataformas médicas independientes (ENAM, ENCIB, ENCAPS, Residentado Médico, EsSalud, Biblioteca Médica).
Las plataformas se muestran **embebidas** dentro del portal sin revelar su URL real.

> Ver `CLAUDE.md` (arquitectura/reglas) y `DESIGN.md` (sistema visual) en la raíz del repositorio padre.

## Estructura

```
portal-central/
├── backend/      Apps Script + TypeScript (clasp)
└── frontend/     Vite + React + TypeScript + Tailwind
```

## Setup local

### 1. Frontend
```bash
cd frontend
npm install
cp .env.example .env       # ajusta VITE_API_URL cuando tengas el web app deploy
npm run dev                # http://localhost:5173
```

### 2. Backend (cuando estés listo en Fase 1)
```bash
cd backend
npm install
npx clasp login            # una sola vez con tu cuenta Google
npx clasp create --type webapp --title "PortalCentral_Backend"
npm run push               # sube el código a Apps Script
npm run deploy             # crea un Web App con URL pública
```

Pega la URL del Web App en `frontend/.env` como `VITE_API_URL`.

## Stack

| Capa     | Tecnología |
|----------|------------|
| Frontend | Vite + React 18 + TypeScript + Tailwind 3 |
| Routing  | React Router v6 (HashRouter) |
| Backend  | Google Apps Script + TypeScript (clasp) |
| BD       | Google Sheets (4 hojas) |
| Storage  | Google Drive (vouchers privados) |

## Estado

Fase 0 — Setup completo, proyecto compilable.
Próximo paso: Fase 1 (router backend + servicios Sheets/Drive/Gmail).
