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

## Pasarela de pago (Fase 1)

La web cobra con **Mercado Pago Checkout Pro** (por defecto). El código de **Culqi** se conserva
como alternativa. Se elige con la Script Property `PASARELA`:

| `PASARELA` | Qué pasa |
|---|---|
| vacía | Mercado Pago si existe `MP_ACCESS_TOKEN`; si no, Culqi si tiene llaves; si no, solo voucher |
| `mercadopago` | Mercado Pago (si falta el token → "Pasarela no configurada" y la web ofrece voucher) |
| `culqi` | Culqi (ver sección de Culqi más abajo) |

## Mercado Pago (Checkout Pro por redirección)

Cómo funciona: el alumno llena sus datos → el backend crea una **preferencia** con el precio de la
hoja → el alumno paga en la página de Mercado Pago (tarjeta, Yape o saldo MP; sin cuotas) → vuelve a
`https://sinapsisedu.com/pago-retorno.html` → la web pide al backend confirmar el pago → el backend
**vuelve a consultar el pago a Mercado Pago** y valida monto, moneda (PEN), referencia (id de compra)
y que el pago no se haya usado antes → activa el acceso y manda el correo.
Además Mercado Pago avisa al backend (webhook); si el alumno cerró la pestaña, el aviso activa la compra.

> Apps Script no puede leer la cabecera `x-signature` de Mercado Pago. Por eso el backend **nunca
> confía en el aviso**: solo toma el id y vuelve a consultar el pago con tu Access Token.

### 1. Crear la aplicación en Mercado Pago Developers

1. Entra a <https://www.mercadopago.com.pe/developers/panel> con tu cuenta de Mercado Pago (persona natural).
2. **Crear aplicación** → nombre `SINAPSIS EDU web` → tipo de pago **Pagos online** → producto **Checkout Pro** → acepta y crea.
3. En la aplicación verás **Credenciales de prueba** y **Credenciales de producción** (Public Key y Access Token).
   Para producción Mercado Pago te pedirá completar los datos del negocio (rubro, sitio web `https://sinapsisedu.com`).

### 2. Cuentas de prueba (obligatorias para probar)

Mercado Pago no deja probar pagando con tu propia cuenta. Necesitas dos usuarios de prueba:

1. En tu aplicación → **Cuentas de prueba** → **+ Crear cuenta de prueba**.
2. Crea una **Vendedor** (país Perú) y una **Comprador** (país Perú). Al comprador ponle saldo ficticio si quieres probar con saldo.
3. Anota usuario y contraseña de cada una (con el menú ⋮ puedes generar una contraseña nueva). Si al iniciar sesión te piden un código de 6 dígitos, está en esa misma tabla.
4. Las **credenciales de prueba** que usa el backend son las de la **cuenta vendedora de prueba**:
   abre una ventana de incógnito, entra a Mercado Pago Developers **con el usuario vendedor de prueba**,
   crea ahí una aplicación Checkout Pro y copia su **Access Token** (empieza con `APP_USR-`).
   *(Si tu panel aún muestra credenciales `TEST-…`, también sirven.)*
5. Para pagar en las pruebas, abre el enlace de pago en otra ventana de incógnito e **inicia sesión con el usuario comprador de prueba**.
   En el formulario de la web usa el **correo del comprador de prueba** (mezclar un correo real con credenciales de prueba suele dar error en Mercado Pago).

### 3. Script Properties

| Propiedad | Valor |
|---|---|
| `MP_ACCESS_TOKEN` | Access Token (prueba: el del vendedor de prueba; producción: `APP_USR-…` de tu cuenta). **Secreto: solo aquí.** |
| `MP_PUBLIC_KEY` | Public Key. No la usa Checkout Pro por redirección; guárdala para el futuro. |
| `PASARELA` | `mercadopago` (o déjala vacía). |
| `SITE_URL` | `https://sinapsisedu.com` (es el valor por defecto; cámbialo solo si la web vive en otro dominio). |
| `MP_SANDBOX` | Opcional, `true` para usar el enlace `sandbox_init_point`. Con las cuentas de prueba actuales normalmente **no** hace falta. |
| `WEBAPP_URL` | Opcional: la URL `/exec` del Web App, si `testMPConfig()` dice que no puede obtenerla sola. |

### 4. Pegar, verificar y redesplegar

1. Pega `Code.gs` y `admin.html`. Corre **`setup()`** (crea la hoja `Pagos` y columnas nuevas al final de `Compras`/`Usuarios`).
2. Corre **`testMPConfig()`**: muestra si el token existe y responde, la pasarela activa, la URL de retorno y la de notificación. No imprime secretos.
3. **Implementar → Gestionar implementaciones → lápiz → Nueva versión → Implementar.**
4. Publica la web (el archivo `frontend/public/pago-retorno.html` debe quedar en `https://sinapsisedu.com/pago-retorno.html`).

### 5. Webhook en el panel

El backend ya manda `notification_url` en cada preferencia (`…/exec?source=mp`). Además, regístralo en el panel:
tu aplicación → **Webhooks → Configurar notificaciones** → URL `https://script.google.com/macros/s/…/exec?source=mp`
→ eventos **Pagos** (y **Órdenes comerciales** / **Contracargos** si aparecen) → Guardar. Hazlo en la pestaña de
prueba y en la de producción. La "clave secreta" que genera el panel no se usa (Apps Script no ve la firma).

### 6. Probar

Tarjetas de prueba de Mercado Pago (vencimiento **11/30**):

| Tarjeta | Número | CVV |
|---|---|---|
| Mastercard crédito | 5031 7557 3453 0604 | 123 |
| Visa crédito | 4009 1753 3280 6176 | 123 |
| American Express | 3711 803032 57522 | 1234 |
| Mastercard débito | 5178 7816 2220 2455 | 123 |

El **nombre del titular** decide el resultado; documento `123456789`:

| Titular | Resultado |
|---|---|
| `APRO` | Aprobado |
| `CONT` | Pendiente (pantalla "en proceso") |
| `FUND` | Rechazado por fondos insuficientes |
| `SECU` | Rechazado por CVV |
| `CALL` | Rechazado: llamar al banco |
| `OTHE` | Rechazado por error general |

**Yape de prueba** (documentado para la integración por API de Mercado Pago; en Checkout Pro puede no
aparecer en modo prueba): celular `111111111`, código `123456` → aprobado; `111111113` → saldo insuficiente.

Checklist: pago `APRO` activa y llega el correo · `FUND` muestra el rechazo y "Reintentar" · `CONT` muestra
"en proceso" y al aprobarse llega por webhook · cerrar la pestaña antes de volver: el webhook activa igual ·
devolver el pago desde el panel de MP → la compra queda `reembolsado` y el acceso `revocado`.

### 7. Pasar a producción

Cambia `MP_ACCESS_TOKEN` por el `APP_USR-…` de **producción** de tu cuenta real, borra `MP_SANDBOX`,
redespliega (nueva versión) y haz una compra real pequeña y su devolución.

---

## Pasarela Culqi (alternativa: `PASARELA=culqi`)

### 1. Crear las llaves en Script Properties

En el editor de Apps Script → **Configuración del proyecto** (engranaje) → **Propiedades del script** → **Agregar propiedad**:

| Propiedad | Valor | Dónde la sacas |
|---|---|---|
| `CULQI_PUBLIC_KEY` | `pk_test_…` (luego `pk_live_…`) | Panel CulqiOnline → Desarrollo → API Keys |
| `CULQI_SECRET_KEY` | `sk_test_…` (luego `sk_live_…`) | Mismo lugar. **Nunca** la pegues en el código, en GitHub ni en `frontend/.env` |

Las dos deben ser del **mismo entorno** (las dos `test` o las dos `live`).
Mientras falte alguna, la web muestra "Pasarela no configurada" y ofrece el pago por voucher.

`WHATSAPP_NUMBER` (ya existe) es el número que sale en los correos de bienvenida.

### 2. Pegar el código y actualizar las hojas

1. Pega el nuevo `Code.gs` completo y `admin.html` (como en los pasos 2 y 3).
2. Corre **`setup()`** una vez: crea la hoja **`Pagos`** y agrega al **final** de `Compras`
   las columnas `dni`, `expira`, `id_pago`, `terminos_aceptados` (y `dni` en `Usuarios`).
   No mueve ni borra columnas existentes. (Si no lo corres, el código las crea solo la primera vez que se usa.)
3. Corre **`testCulqiConfig()`**: dice si las llaves existen, si son del mismo entorno y si
   Culqi acepta la secreta. **No imprime las llaves.**
4. **Redespliega**: Implementar → Gestionar implementaciones → lápiz → Versión: **Nueva versión** → Implementar.
   La URL `/exec` no cambia. Sin este paso el Web App sigue con el código viejo.

### 3. Webhook (aviso de Culqi)

En el panel de CulqiOnline → **Desarrollo → Eventos (Webhooks)** agrega la URL `/exec` del Web App
para los eventos de **cargos** y **devoluciones** (y contracargos si aparecen).
El backend **no confía** en el contenido del aviso: toma el id y lo vuelve a consultar a la API de Culqi.

- Cargo exitoso que no llegó por la web (el alumno cerró la pestaña) → activa la compra.
- Devolución / contracargo → **revoca** el acceso de esa compra, lo registra en `Pagos` y te avisa.

### 4. Probar en modo prueba

Tarjetas oficiales de prueba de Culqi (solo con llaves `test`):

| Resultado | Número | Venc. | CVV |
|---|---|---|---|
| Venta exitosa (Visa débito) | 4111 1111 1111 1111 | 09/30 | 123 |
| Venta exitosa (Mastercard) | 5111 1111 1111 1118 | 12/30 | 039 |
| Venta exitosa (Amex) | 3712 1212 1212 122 | 12/30 | 2841 |
| Fondos insuficientes | 4000 0400 0000 0008 | 03/30 | 295 |
| Tarjeta robada | 4000 0200 0000 0000 | 10/30 | 354 |
| CVV incorrecto | 5400 0200 0000 0003 | 07/30 | 203 |
| Contactar al emisor | 5400 0000 0000 0005 | 01/30 | 492 |

**Yape de prueba:** celular `900 000 001`, código de aprobación: cualquier número de 6 dígitos.

Las tarjetas que piden 3DS (`4456 5300 0000 1096`, etc.) **aún no** se completan en esta fase:
el alumno ve un mensaje para usar Yape, otra tarjeta o voucher.

Qué revisar después de cada prueba: hoja `Compras` (estado `aprobado`, `fecha_fin`), hoja `Pagos`
(una fila por intento), correo de bienvenida, y que el alumno pueda entrar al Portal.

### Estados nuevos en `Compras.estado_pago`

| Estado | Significa |
|---|---|
| `pendiente_pago` | Llenó sus datos, aún no paga (expira a los 30 min) |
| `aprobado` | Pagado y activo |
| `en_revision` | Culqi cobró pero algo no cuadró (monto, referencia). **Revisa y aprueba o devuelve** desde el panel |
| `reembolsado` / `contracargo` | Devolución o contracargo: acceso revocado |

## Actualizar el código en el futuro

Cuando hagamos cambios en el backend (Fase 2, 3, etc.):
1. Vuelvo a regenerar `Code.gs` en esta carpeta con los cambios.
2. Tú abres el editor de Apps Script y pegas el nuevo contenido en `Código.gs` (reemplazando todo).
3. **No necesitas correr `setup()` de nuevo** — solo cuando agreguemos hojas nuevas.
4. Para que los cambios entren en producción, tienes que crear una **nueva versión del despliegue**:
   - "Implementar" → "Administrar implementaciones" → ícono de lápiz → "Versión: nueva versión" → "Implementar".

> Si te cansas de pegar manualmente, podemos cambiar a `clasp push` cuando quieras —
> ya está instalado en `backend/` y el código TypeScript original está en `backend/src/`.
