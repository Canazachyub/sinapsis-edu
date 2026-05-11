# Pegar el backend manualmente en Apps Script

> Ruta sin clasp ni terminal. Solo navegador.
> Si prefieres la ruta automática con `clasp push`, ver `README.md` raíz.

---

## Archivos que vas a pegar

En esta carpeta `apps-script-paste/` tienes todo listo:

| Archivo | Dónde va en Apps Script |
|---------|-------------------------|
| `Code.gs` | Archivo `Código.gs` (el que viene por defecto) |
| `../appsscript.json` | Archivo `appsscript.json` (manifest) |
| `../src/views/admin.html` | Archivo HTML nuevo `views/admin` |
| `../src/views/adminScript.html` | Archivo HTML nuevo `views/adminScript` |
| `../src/views/adminStyles.html` | Archivo HTML nuevo `views/adminStyles` |

---

## Paso 1 — Crear el proyecto Apps Script

1. Ve a https://script.google.com (logueado con **canazach12@gmail.com**).
2. Click en **"Nuevo proyecto"** (esquina superior izquierda).
3. Espera a que cargue. Verás un archivo `Código.gs` con la función `myFunction()` vacía.
4. Cambia el nombre del proyecto: click en **"Proyecto sin título"** arriba y escribe **`PortalCentral_Backend`**.

## Paso 2 — Pegar `Code.gs`

1. Abre el archivo [Code.gs](Code.gs) de esta carpeta en tu editor.
2. Selecciona todo (`Ctrl + A`) y copia (`Ctrl + C`).
3. En el editor de Apps Script, selecciona el archivo `Código.gs`.
4. Selecciona todo lo que hay dentro (`Ctrl + A`) y borralo.
5. Pega (`Ctrl + V`).
6. Guarda con `Ctrl + S` (o el ícono de disquete).

## Paso 3 — Pegar los 3 HTML

Por cada uno de estos archivos (admin, adminScript, adminStyles):

1. En el panel izquierdo del editor de Apps Script, click en el **+** junto a "Archivos".
2. Elige **"HTML"**.
3. Ponle el nombre exacto **`views/admin`** (con la barra `/`). Apps Script lo acepta.
4. Selecciona todo el contenido del archivo nuevo (un `<!DOCTYPE html>` mínimo que viene por defecto) y borralo.
5. Abre [../src/views/admin.html](../src/views/admin.html), copia su contenido y pégalo.
6. `Ctrl + S` para guardar.

Repite con **`views/adminScript`** (contenido de [../src/views/adminScript.html](../src/views/adminScript.html))
y **`views/adminStyles`** (contenido de [../src/views/adminStyles.html](../src/views/adminStyles.html)).

> Los nombres deben llevar `views/` adelante porque el código hace
> `HtmlService.createTemplateFromFile('views/admin')` y los `include('views/adminStyles')`.

## Paso 4 — Editar `appsscript.json` (manifest)

1. En el editor de Apps Script, abre **"Configuración del proyecto"** (ícono de engranaje en la barra lateral izquierda).
2. Marca la casilla **"Mostrar el archivo de manifiesto «appsscript.json» en el editor"**.
3. Vuelve al editor (ícono de `<>`). Ahora verás `appsscript.json` en la lista.
4. Abre [../appsscript.json](../appsscript.json), copia su contenido completo.
5. Pega reemplazando lo que haya en el `appsscript.json` del editor.
6. `Ctrl + S`.

Esto le dice a Apps Script qué permisos pedir (Sheets, Drive, Gmail, etc.).

## Paso 5 — Ejecutar `setup()` para crear todo

1. En el dropdown de funciones (arriba, junto al botón "Ejecutar"), elige **`setup`**.
2. Click en **▶ Ejecutar**.
3. Aparece un diálogo: **"Es necesario otorgar autorización"**. Click en **"Revisar permisos"**.
4. Elige tu cuenta `canazach12@gmail.com`.
5. Verás "Google no ha verificado esta aplicación". Click en **"Configuración avanzada"** → **"Ir a PortalCentral_Backend (no seguro)"** → **"Permitir"**.
6. Apps Script ejecuta `setup()`. Espera ~5 segundos.

**Qué crea `setup()`:**
- 📊 Spreadsheet `PortalCentral_DB` en tu Drive raíz, con 4 hojas:
  - `Plataformas` (con las 6 plataformas pre-cargadas: ENAM, ENCIB, ENCAPS, RM, EsSalud, Biblioteca)
  - `Usuarios` (vacía, con headers)
  - `Compras` (vacía, con headers)
  - `Logs` (con la primera entrada de auditoría)
- 📁 Carpeta `PortalCentral_Vouchers` en tu Drive raíz.
- 🔑 Todas las Properties (SHEET_ID, DRIVE_FOLDER_VOUCHERS, ADMIN_EMAIL, NOTIFICACION_EMAIL, SESSION_SECRET aleatorio de 64 caracteres, WHATSAPP_NUMBER=51984300510, RATE_LIMIT_PER_HOUR=10).

**Cómo ves el resultado:** abajo del editor aparece el **"Registro de ejecución"**. Verás algo como:

```
[INFO] {
  "ok": true,
  "spreadsheet": { "id": "1Ab...", "url": "https://docs.google.com/spreadsheets/d/...", "created": true },
  "driveFolder": { "id": "0Bd...", "url": "https://drive.google.com/drive/folders/...", "created": true },
  "sheets": [...],
  "seeded": true,
  ...
}
```

Click en la URL del `spreadsheet` para verificar que las hojas se crearon bien.

> Si vuelves a correr `setup()`, no duplica nada. Es idempotente.

## Paso 6 — Desplegar el Web App

1. Click en **"Implementar"** (botón azul arriba a la derecha) → **"Nueva implementación"**.
2. Click en el ícono de engranaje ⚙ junto a "Selecciona el tipo" → elige **"Aplicación web"**.
3. Configuración:
   - **Descripción**: `MVP v1`
   - **Ejecutar como**: `Yo (canazach12@gmail.com)`
   - **Quién tiene acceso**: `Cualquier persona`
4. Click en **"Implementar"**.
5. Te aparece una **URL del Web App** del estilo:
   ```
   https://script.google.com/macros/s/AKfycb...xxxxx.../exec
   ```
6. **Copia esa URL** — es la que va a `frontend/.env`.

## Paso 7 — Probar el API

Abre la URL del Web App en una pestaña nueva con `?ping=1` al final:

```
https://script.google.com/macros/s/.../exec?ping=1
```

Debes ver un JSON tipo:

```json
{
  "ok": true,
  "data": {
    "status": "online",
    "timestamp": "2026-05-08T...",
    "properties": { "ok": true, "missing": [] },
    "sheetUrl": "https://docs.google.com/..."
  },
  "message": "Portal Central backend OK"
}
```

✅ Si ves `status: "online"`, el backend está vivo.

## Paso 8 — Conectar el frontend

1. Abre `f:\PLATAFORMA MEDICINA PRO\portal-central\frontend\.env`
   (si no existe, copia `.env.example` a `.env`).
2. Reemplaza `VITE_API_URL` con la URL del Web App:
   ```
   VITE_API_URL=https://script.google.com/macros/s/AKfycb.../exec
   VITE_WHATSAPP=51984300510
   ```
3. Si `npm run dev` ya está corriendo, **detenlo** (`Ctrl + C`) y vuélvelo a iniciar — Vite solo lee `.env` al arrancar.
4. Abre http://localhost:5173/.
5. El indicador del hero debe pasar de gris a **verde**: "Backend conectado".

---

## Si algo sale mal

| Problema | Solución |
|----------|----------|
| Apps Script no acepta `views/admin` como nombre | Usa `views_admin` y cambia las 4 referencias en `Code.gs` (`createTemplateFromFile('views_admin')` y los `include(...)`). |
| Error "ReferenceError: ping is not defined" | Falta algún archivo. Verifica que `Code.gs` se pegó completo (1000+ líneas). |
| Error "Authorization required" al correr `setup()` | Es normal la primera vez. Pasa por el flujo de autorización del Paso 5. |
| El frontend sigue mostrando "Backend no desplegado" | Verifica que la URL en `.env` termina en `/exec` y reinicia `npm run dev`. |
| El `?ping=1` devuelve HTML en vez de JSON | El despliegue del Paso 6 no se hizo bien. Repite con "Nueva implementación". |

## Actualizar el código en el futuro

Cuando hagamos cambios en el backend (Fase 2, 3, etc.):
1. Vuelvo a regenerar `Code.gs` en esta carpeta con los cambios.
2. Tú abres el editor de Apps Script y pegas el nuevo contenido en `Código.gs` (reemplazando todo).
3. **No necesitas correr `setup()` de nuevo** — solo cuando agreguemos hojas nuevas.
4. Para que los cambios entren en producción, tienes que crear una **nueva versión del despliegue**:
   - "Implementar" → "Administrar implementaciones" → ícono de lápiz → "Versión: nueva versión" → "Implementar".

> Si te cansas de pegar manualmente, podemos cambiar a `clasp push` cuando quieras —
> ya está instalado en `backend/` y el código TypeScript original está en `backend/src/`.
