# Bitácora de cambios — SINAPSIS EDU

> Registro vivo de modificaciones, decisiones y datos operativos del portal.
> Léelo antes de hacer cambios para tener contexto. Complementa a `CLAUDE.md`
> (reglas del proyecto) y `AUDITORIA.md` (hallazgos del test E2E).

---

## 🌐 Estado actual (producción)

| Pieza | Dónde | Cómo se despliega |
|-------|-------|-------------------|
| **Frontend** | https://sinapsisedu.com (GitHub Pages, dominio propio) | **Automático**: `git push origin main` → GitHub Action build + deploy a `gh-pages` |
| **Backend** | Web App de Apps Script (container-bound al Sheet) | **Manual**: pegar `backend/apps-script-paste/Code.gs` en el editor → Implementar → Gestionar implementaciones → ✏️ editar → Nueva versión |
| **Base de datos** | Google Sheets `PortalCentral_DB` | Hojas: Plataformas, Usuarios, Compras, Logs, Credenciales |
| **Vouchers** | Carpeta Drive privada | Subidos vía `subirVoucher` |

> ⚠️ **Importante:** un `git push` **NO** actualiza el backend. El `Code.gs` siempre
> se re-pega y re-despliega a mano (Apps Script es container-bound).

---

## 🔑 Datos operativos

- **Web App (API):** `.../macros/s/AKfycby6vGh6...AgdiF43PIA/exec` (en `frontend/.env` como `VITE_API_URL`)
- **Panel admin:** abrir la URL del Web App + `?page=admin`. Login con `ADMIN_PASSWORD` (Script Properties).
- **Usuario de prueba:** `canazach12@gmail.com` / `Test1234` (recrea con `createTestUser()` desde el editor).
- **Slugs reales:** `enam, encib, encaps, rm, essalud, biblioteca, anatomia, cto`.
  - Aliases que redirigen: `residentado→rm`, `ciencias-basicas/cb→encib`, `testut→anatomia`.
- **WhatsApp soporte:** `+51 974 707 622` (footer) · backend usa `+51 984 300 510` en algunos correos.

---

## 📋 Changelog

### 2026-07-19 — Batch de seguridad backend + fix de slug `cb`

Orquestado por Opus (lee/verifica) + Fable (ejecuta). Backend re-deployado a
mano (Nueva versión, misma URL) y frontend desplegado por push a `main`.
Verificado: `?ping=1` online con todas las Properties; `url_real` no se filtra.

**Seguridad (`Code.gs`) — deuda #2–#7 cerrada**
- **#2 Rate limit real** por correo/`id_compra` en `CacheService` (10/h, `RATE_LIMIT_PER_HOUR`), aplicado en `loginAlumno`, `registrarCompra`, `subirVoucher` y `recuperarPassword` (este último devuelve la respuesta genérica al exceder, sin enumerar).
- **#3 Tokens CSPRNG:** `randomToken` ahora deriva de `Utilities.getUuid()` (SecureRandom) en vez de `Math.random()`. Misma firma/longitud/charset → sesión, salt, password y `SESSION_SECRET` intactos.
- **#5 Guard de `subirVoucher`:** solo acepta subida si la compra está `pendiente` y sin `voucher_url`. Bloquea manipular compras aprobadas/rechazadas y el doble-spam; el reintento legítimo (voucher vacío) sigue pasando.
- **#6 Escape HTML** (`escapeHtml`) en todos los correos (admin y alumno): `nombre`, `correo`, `whatsapp`, `detalle_extra`, `motivo`, `plataforma`. Cierra la inyección HTML en la bandeja del admin.
- **#7 `ADMIN_PASSWORD` → hash+salt:** `adminLogin` valida contra `ADMIN_PASSWORD_HASH`/`ADMIN_PASSWORD_SALT`; migra el valor legado en texto plano **en caliente** en el primer login y borra la Property vieja. Nuevo helper editor-only `setAdminPassword(plain)` para rotarla.
- **#4 Alerta de monto:** el `monto` del cliente se conserva (aprobación manual mitiga), pero el correo al admin **avisa** si difiere del precio base; no aplica a anatomía/CTO (precio por segmento). Se optó por *registrar y alertar*, no rechazar ni recalcular.
- Riesgo residual documentado: los `id_compra` siguen siendo enumerables; el rate limit lo mitiga. Vincular la subida a un token de identidad queda como follow-up. Tokens de sesión/admin viven 6h (tope de `CacheService`), no 24h (preexistente).

**Frontend**
- **Fix `cb`:** se quitó el alias `cb`/`ciencias-basicas`→`encib` en `pages/Plataforma.tsx`. `cb` (P-009 "Qx Ciencias Básicas", plataforma de videos, distinta de ENCIB) ahora abre su propia página de detalle. Pendiente opcional: contenido `INFO['cb']`.
- **A13 sandbox:** `IframeViewer.tsx` recortado a `allow-same-origin allow-scripts allow-forms allow-popups` (spec §10; se quitó `allow-downloads`).

### 2026-06-05 — Auditoría E2E + batch de mejoras

Test completo (4 fases) con agente de navegador → backlog en `AUDITORIA.md`.
Implementado y desplegado:

**Bugs corregidos (frontend)**
- Alias de slugs (`residentado`→`rm`, etc.) — `pages/Plataforma.tsx`
- Footer: plataformas ahora son `<Link>` navegables — `components/Footer.tsx`
- Navbar enlaza `#programa` y `#faq` — `components/Navbar.tsx`
- `<ScrollToTop>` global (arregla scroll en /gracias; respeta scroll-a-sección de Landing) — `components/ScrollToTop.tsx` + `router.tsx`

**Mejoras UX (frontend)**
- `<title>` dinámico por ruta — `hooks/useDocumentTitle.ts`
- "Ver detalles" como botón secundario — `components/PlataformaCard.tsx`
- Login: CTA para usuarios nuevos + recuperación de contraseña self-service — `pages/Login.tsx`
- Compra: mensaje del voucher según estado + reintento de subida — `pages/Compra.tsx`
- Portal: fecha exacta de vencimiento + spinner/skeleton de carga — `pages/Portal.tsx`
- Aula: vencimiento en el header — `pages/Aula.tsx`
- iframe: sandbox endurecido (sin `allow-popups-to-escape-sandbox`) — `components/IframeViewer.tsx`
- FAQ general en la landing — `components/FaqLanding.tsx`
- Badge "Demo gratuita · Próximamente" — `pages/Landing.tsx`

**Backend (`Code.gs`)**
- `obtenerUrlPlataforma` ahora devuelve `nombre`, `fecha_fin`, `dias_restantes` (para el header del aula). Mantiene el control de acceso (sesión + compra activa).
- Nuevo endpoint público `recuperarPassword`: reset self-service por correo. Respuesta siempre genérica (no revela si el correo existe).
- **Seguridad:** `aprobarPago` ya **no** guarda la contraseña en texto plano en la hoja `Credenciales` (solo `(enviada por correo)`).
- **Decisión:** `registrarCompra` **conserva** el nombre/WhatsApp del registro inicial cuando el correo ya existe (la cuenta se identifica por correo; así se gestionan todos los accesos del alumno bajo su identidad original).

**Decisiones del Grupo B (auditoría)**
- FAQ landing → reusar/adaptar preguntas generales. ✅
- "Contacto" del navbar → se mantiene el scroll al footer (tiene WhatsApp/tel/email). ✅
- Demo → badge "Próximamente" (aún no hay demo). ✅
- Recuperación de contraseña → self-service por correo. ✅

---

## 🧹 Limpieza de datos pendiente

- Corregir el nombre del usuario `yubequizles@gmail.com` en la hoja `Usuarios`
  (quedó "QA-TEST AgenteNavegador" de la prueba; ahora el nombre **no** se
  autoactualiza, hay que editarlo a mano).
- Borrar la compra de prueba **C-006** de la hoja `Compras` si ya no se usa.

---

## 🚧 Pendiente / deuda técnica

**Mejoras de producto (necesitan decisión/contenido)**
- **B3 — Pricing:** planes semestral/anual + aclarar promo "desde S/39". Requiere definir precios.
- **A5 — Acentos en el Sheet:** corregir en hoja `Plataformas` (datos, no código):
  `RESIDENTADO MEDICO`→`Residentado Médico`, `Ciencias Basicas`→`Ciencias Básicas`, `Preparacion`→`Preparación`.

**Seguridad**
- ✅ **#2–#7 resueltos y desplegados (2026-07-19).** Ver la entrada de esa fecha arriba.
- Informativo (sin cambiar): `hashPassword` es SHA-256 de una ronda (coincide con el spec MVP; para prod real considerar key-stretching).
- Follow-up abierto: vincular `subirVoucher` a un token de identidad (los `id_compra` siguen siendo enumerables; el rate limit lo mitiga por ahora).

---

## 📝 Cómo registrar futuros cambios aquí

1. Agrega una entrada con fecha bajo **Changelog** (qué, por qué, archivo).
2. Si tocaste `Code.gs`, recuerda el paso manual de redeploy.
3. Mueve los ítems resueltos fuera de **Pendiente / deuda técnica**.
