# DEPLOY.md — Subir SINAPSIS EDU a GitHub Pages + dominio sinapsisedu.com

Esta guía cubre el deploy de PRODUCCIÓN (frontend) y los pasos pendientes
del backend Apps Script. Para correr local, ver `README.md`.

---

## 📋 Orden recomendado (60 minutos total)

| Paso | Tiempo | Quién |
|------|--------|-------|
| 1. Actualizar Code.gs y re-deploy backend | 5 min | tú |
| 2. Crear repo en GitHub | 2 min | tú |
| 3. Pushear el código local al repo remoto | 3 min | yo te doy los comandos |
| 4. Configurar secrets en GitHub | 2 min | tú |
| 5. Esperar primer deploy del GitHub Action | 3 min | automático |
| 6. Configurar DNS en Hostinger | 5 min | tú |
| 7. Esperar propagación DNS y certificado SSL | 30 min | automático |

---

## 1. Backend: re-pegar Code.gs + setup + usuario test

Ahora hay 2 cosas nuevas en `Code.gs`:
- `seedPlataformas` es **idempotente**: agrega Anatomía y CTO si faltan, no duplica las existentes.
- Schema con 3 columnas nuevas en `Plataformas` (`precio_promocional`, `etiqueta`, `orden`) y 1 en `Compras` (`detalle_extra`).

### Pasos

1. Abre tu Apps Script (Extensiones → Apps Script desde tu Sheet).
2. Abre [`backend/apps-script-paste/Code.gs`](backend/apps-script-paste/Code.gs), copia todo (`Ctrl+A`, `Ctrl+C`).
3. En el editor → archivo `Código.gs` → `Ctrl+A` → borra → `Ctrl+V` → `Ctrl+S`.
4. **Implementar → Administrar implementaciones → ✏️ Editar → Versión: Nueva versión → Implementar**.
   - La URL del Web App se mantiene: `AKfycby6vGh6slmvosiyi0ZDtjIACS64a21Ql8kC4C7HH1h1OZ_LctRFat-K0ud3AgdiF43PIA/exec`.
5. En el dropdown de funciones → `setup` → click **▶ Ejecutar**. Resultado esperado:
   - Headers extendidos con las 4 columnas nuevas.
   - Plataformas agrega P-007 (Anatomía) y P-008 (CTO) si no existían.
6. En el dropdown → `createTestUser` → click **▶ Ejecutar**. Resultado:
   - Crea el usuario `canazach12@gmail.com / Test1234`.
   - Crea 2 compras de prueba (ENCIB 30 días, ENAM 5 días) si no existen.

Verifica abriendo tu Sheet: deberías ver 8 plataformas y 1 usuario activo.

---

## 2. Crear el repo en GitHub

Ya estás en https://github.com/new (vi tu captura).

1. **Repository name:** `sinapsis-edu` (sugerido) o el que quieras.
2. **Visibility:** Public (gratis y permite Pages sin restricciones) o Private (Pages funciona con plan free actual de GitHub).
3. **NO marques** "Add a README", "Add .gitignore" ni "Add license" — el repo local ya tiene archivos.
4. Click **"Create repository"**.

GitHub te mostrará comandos para conectar un repo existente. **No los ejecutes todavía** — yo te doy los correctos abajo (porque tu repo local tiene una subcarpeta y commits previos).

---

## 3. Pushear el código al repo

Reemplaza `sinapsis-edu` por el nombre que pusiste:

```powershell
cd "f:\PLATAFORMA MEDICINA PRO\portal-central"

# Renombrar rama main si hace falta
git branch -M main

# Conectar al repo remoto (cambia 'sinapsis-edu' si elegiste otro nombre)
git remote add origin https://github.com/Canazachyub/sinapsis-edu.git

# Subir todo
git push -u origin main
```

GitHub te va a pedir credenciales (HTTPS con Personal Access Token, o SSH).
Más fácil con HTTPS: cuando te pida password, usa un **Personal Access Token**
de https://github.com/settings/tokens (Tokens classic → Generate new → tilde `repo`).

---

## 4. Configurar el secret `VITE_API_URL` en GitHub

El frontend necesita saber a qué backend pegar. El GitHub Action lo lee de un secret.

1. En tu repo en GitHub → **Settings** → **Secrets and variables** → **Actions**.
2. Click **"New repository secret"**.
3. Name: `VITE_API_URL`.
4. Value:
   ```
   https://script.google.com/macros/s/AKfycby6vGh6slmvosiyi0ZDtjIACS64a21Ql8kC4C7HH1h1OZ_LctRFat-K0ud3AgdiF43PIA/exec
   ```
5. **Add secret**.

(Opcional) También puedes agregar como variable `VITE_WHATSAPP` con valor `51974707622`. Si no lo agregas, el workflow usa ese mismo valor por default.

---

## 5. Primer deploy

Apenas haces `git push`, el GitHub Action `Deploy frontend to GitHub Pages`
se dispara automáticamente. Para ver el progreso:

1. Repo → pestaña **Actions** → entra al workflow corriendo.
2. Espera ~3 minutos a que termine en verde ✅.
3. La Action publica el `frontend/dist/` a la rama `gh-pages` y crea un CNAME.

Si todo OK, ve a **Settings → Pages**:
- Source: **Deploy from a branch**
- Branch: **gh-pages** / `/` (root)
- Custom domain: aparecerá `sinapsisedu.com` (el CNAME lo configuró la Action).
- Marca **"Enforce HTTPS"** (puede tardar 24h en estar disponible).

Mientras tanto, tu portal ya es accesible en:
- `https://canazachyub.github.io/sinapsis-edu/` (si el repo es público)
- O directo en `https://sinapsisedu.com/` una vez configurado DNS (paso 6).

---

## 6. Configurar DNS en Hostinger

Para que `sinapsisedu.com` apunte a GitHub Pages.

1. Entra a https://hpanel.hostinger.com → dominio `sinapsisedu.com`.
2. Menú lateral → **DNS / Nameservers**.
3. Si los nameservers son `lunar.dns-parking.com` / `solar.dns-parking.com`,
   cámbialos a los nameservers de Hostinger:
   - `ns1.dns-parking.com`, `ns2.dns-parking.com` o los que indique Hostinger
   - O usa los nameservers default de Hostinger
4. En la sección **DNS records**, agrega:

   **Registros A (apex, para `sinapsisedu.com`):**

   | Tipo | Nombre | Apunta a | TTL |
   |------|--------|----------|-----|
   | A | @ | `185.199.108.153` | 14400 |
   | A | @ | `185.199.109.153` | 14400 |
   | A | @ | `185.199.110.153` | 14400 |
   | A | @ | `185.199.111.153` | 14400 |

   **Registro CNAME (para `www.sinapsisedu.com`):**

   | Tipo | Nombre | Apunta a | TTL |
   |------|--------|----------|-----|
   | CNAME | www | `canazachyub.github.io` | 14400 |

5. Guarda. La propagación DNS toma 5-60 minutos típicamente, máximo 24h.

---

## 7. Verificación final

Cuando termine la propagación:

```powershell
nslookup sinapsisedu.com
# debe responder con 185.199.108-111.x
```

Abre `https://sinapsisedu.com/` → deberías ver SINAPSIS EDU.

Pruebas rápidas:
- Login con `canazach12@gmail.com` / `Test1234` → debe loguear y mostrar Portal.
- Hard refresh con Ctrl+Shift+R → 8 cards de plataformas.
- `/#/compra/anatomia` → selector de segmentos funciona, recalcula USDT/BTC.

---

## 🔁 Re-deploy automático

Cualquier `git push` a `main` dispara el Action y actualiza el sitio en
~3 minutos. No necesitas tocar Hostinger ni GitHub Pages para cambios
del frontend.

Cambios al backend (Code.gs): siguen requiriendo re-pegar y re-deploy
manual desde el editor de Apps Script (no es código en este repo, vive
container-bound en tu Sheet).

---

## ❗ Troubleshooting

| Síntoma | Causa probable | Fix |
|---------|---------------|-----|
| Action falla con `npm ci` | `package-lock.json` desincronizado | `npm install` local, commit el lock, push otra vez |
| Sitio dice "404 - File not found" | Pages no encuentra `index.html` | Verifica que la Action publicó a `gh-pages` con `dist/` en root |
| `sinapsisedu.com` da error SSL | Cert aún no emitido | Espera ~30 min. Marca "Enforce HTTPS" en Settings → Pages |
| Login da "Network error" | `VITE_API_URL` no configurado en secrets | Agrega el secret y dispara el Action manualmente |
| Las plataformas no aparecen | Backend Apps Script no respondió | Probar `?ping=1` en la URL del Web App |
