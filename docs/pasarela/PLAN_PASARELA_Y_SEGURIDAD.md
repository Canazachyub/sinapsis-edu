# Plan: pasarela de pago, acceso integrado y protección del contenido

> Estado: **BORRADOR PARA APROBACIÓN** · noviembre 2026
> Diagramas: `flujo-pasarela.drawio` (3 páginas) y sus PNG en esta carpeta.
> Pasarela: **Culqi** si hay RUC (más barata: 3.44 % + US$0.20 sin IGV, Yape incluido) · **Mercado Pago** si aún no hay RUC (3.49 % + S/1 + IGV, dinero al instante). El diseño es el mismo para ambas; solo cambia el "conector".

---

## 0. Objetivos

1. El alumno compra en 2 minutos, con tarjeta o Yape, y **entra al instante**, sin esperar al admin.
2. **Una sola cuenta** para sinapsisedu.com (compra, portal) y la plataforma de simulacros/banqueo.
3. **Nadie accede sin pagar** ni puede **descargar o revender el banco**.
4. Nosotros vemos todo en el panel admin: ventas, accesos, alertas.

---

## 1. Lo que vive el alumno (pantalla por pantalla)

| # | Pantalla | Qué ve | Qué pasa por detrás |
|---|---|---|---|
| 1 | **Landing** sinapsisedu.com | Plataformas con precio, "Simulacro gratis" | Nada sensible |
| 2 | **Detalle de plataforma** (ej. ENAM) | Qué incluye, precio, vigencia (30 días), botón **Comprar** | Precio leído del servidor |
| 3 | **Datos** | Nombre, correo, DNI, WhatsApp, acepto Términos y Privacidad | `iniciarCompra` crea la compra **PENDIENTE** (expira en 30 min) y fija el monto en el servidor |
| 4 | **Pago** | Ventana de la pasarela: tarjeta o **Yape** (código de aprobación) | La tarjeta **nunca toca nuestro servidor**; la pasarela nos da un token |
| 5a | **¡Listo!** | "Pago aprobado. Ya tienes acceso hasta el 10/12/2026" + botón **Ir a mis simulacros** | Servidor confirma el pago con la pasarela, activa el acceso, envía correo con contraseña |
| 5b | **Pago rechazado** | Motivo claro (fondos, tarjeta, Yape vencido) + **Reintentar** / otro medio / WhatsApp | Compra sigue PENDIENTE hasta que expire |
| 5c | **Pago en proceso** (PagoEfectivo / Yape lento) | "Te avisaremos por correo apenas se confirme" | El aviso (webhook) de la pasarela activa el acceso |
| 6 | **Correo de bienvenida** | Usuario, contraseña temporal, vigencia, botón directo | Contraseña guardada solo como hash + sal |
| 7 | **Login / Portal** | Mis accesos, días restantes, **Rendir simulacro** / **Banqueo** / **Renovar** | Sesión con token de servidor |
| 8 | **Entrar a simulacros** | Abre la app directamente, **sin volver a escribir DNI** | Portal pide un **ticket firmado** de 2 min; la app lo canjea por su propia sesión |
| 9 | **Simulacro / Banqueo** | La experiencia actual (Wayground) | Cada pedido valida sesión + acceso vigente a ESE examen |
| 10 | **Aviso de vencimiento** | Correo 3 días antes y 1 día después + botón Renovar | Disparador diario (trigger) |
| 11 | **Renovar** | Mismo flujo 2–5 con datos precargados | La vigencia se suma a la actual |

Plan B que se mantiene: **voucher Yape/transferencia/Binance** → revisión manual en el panel admin (como hoy).

---

## 2. Flujo técnico del pago (seguro)

Ver página 2 del diagrama. Reglas no negociables:

1. **El precio sale de la hoja `Plataformas`**, nunca del navegador. `iniciarCompra(slug, datos)` devuelve `{id_compra, monto, moneda}` y guarda la compra como `PENDIENTE` con `expira = ahora + 30 min`.
2. **Llaves**: pública en el frontend; **secreta solo en Script Properties** del Apps Script (`CULQI_SECRET` o `MP_ACCESS_TOKEN`), separadas en **prueba** y **producción**. Nunca en GitHub ni en el navegador.
3. **Culqi (sincrónico)**: el checkout de Culqi devuelve un *token* (tarjeta) o una *orden* (Yape). El navegador envía `{id_compra, token}` a `confirmarPago`; el Apps Script crea el cargo en la API de Culqi **con el monto de la hoja** y la referencia `id_compra`. Si Culqi responde "venta exitosa" → activar.
   **Mercado Pago (asincrónico)**: `crearPreferencia` en el servidor → el alumno paga en MP → vuelve a `/#/gracias?payment_id=…` y además llega el **webhook**.
4. **Nunca se confía en el aviso**: Apps Script no puede leer cabeceras ni firmas de webhooks, así que **siempre re-consulta el pago por su ID en la API de la pasarela** antes de activar.
5. **Validaciones antes de activar**: estado = aprobado · monto == precio de la compra · moneda = PEN · referencia == `id_compra` · compra en `PENDIENTE` y no expirada · `payment_id` **no usado antes** (hoja `Pagos` con columna única).
6. **Idempotencia**: `LockService` alrededor de `activarCompra`; si el webhook y la vuelta del alumno llegan a la vez, solo uno activa.
7. **Activación** (`activarCompra`, compartida con la aprobación manual del admin): crea/actualiza usuario, genera contraseña aleatoria (CSPRNG) si es nuevo, registra `Accesos{usuario, examen, inicio, fin}`, correo de bienvenida, log.
8. **Reembolsos / contracargos**: el aviso de devolución **revoca el acceso** y lo registra.
9. **Alertas al admin** (correo + panel): monto distinto, pagos repetidos, muchos rechazos del mismo correo.
10. **Comprobante**: con RUC, emitir boleta electrónica (fase 2: Nubefact u otro OSE).

---

## 3. Acceso integrado (una sola cuenta)

Ver página 3 del diagrama.

- **Login** (sinapsisedu.com): correo + contraseña (hash SHA-256 + sal, ya existe) · máx. 5 intentos/15 min por correo · recuperar contraseña por correo (ya existe).
- **Sesión**: token aleatorio de 32 bytes guardado en el servidor, vence en 7 días de inactividad. **Una sesión activa por alumno**: al iniciar en otro dispositivo, la anterior se cierra (avisando "tu cuenta se abrió en otro dispositivo").
- **Puente a simulacros (ticket firmado)**:
  1. Portal → `emitirTicket(sesión, examen)` en el Backend 1.
  2. Ticket = `base64(payload).firma` con **HMAC-SHA256** y una **clave compartida** guardada en Script Properties de ambos Apps Script. `payload = {uid, correo, examen, fin_acceso, exp: ahora+120 s, nonce}`.
  3. Redirección a `app.sinapsisedu.com/#t=<ticket>` (en el **fragmento**, no viaja a servidores ni queda en logs).
  4. La app envía el ticket a `canjearTicket` (Backend 2): verifica firma, `exp`, que el `nonce` **no se haya usado** (CacheService) y crea **su propia sesión**. La app borra el ticket de la URL.
- **Backend 2** exige en **cada** pedido: sesión válida + acceso vigente **a ese examen**. Comprar ENAM habilita solo ENAM.
- Se elimina la hoja `confirmado` por DNI (hoy cualquiera con un DNI+correo de la lista entra).

---

## 4. Protección del contenido (anti-piratería)

Honestidad primero: **nada en la web es 100 % inviolable** (alguien puede fotografiar la pantalla). El objetivo es que **piratear el banco completo sea lento, caro, rastreable y poco rentable**.

| Riesgo | Hoy | Medida |
|---|---|---|
| Descargar el banco desde la API | `?action=questions` entrega preguntas **con clave** a cualquiera | Todo pedido exige **sesión + acceso vigente**; sin sesión, nada |
| Ver la clave en el navegador (F12) | La clave viaja con la pregunta | **Simulacro**: preguntas **sin clave**; el servidor **califica** y guarda. **Banqueo**: la clave y la justificación llegan **solo después de responder** (`responder(id, opción)`) |
| Falsificar la nota | La nota la calcula el navegador | Nota calculada **en el servidor** |
| Compartir la cuenta | Sin control | **Una sesión activa**, registro de dispositivos, cierre remoto desde el panel |
| Bajar todo con un robot | Sin límites | **Límite de ritmo** (ej. 400 preguntas/día y 60/10 min por alumno), lotes de 30, IDs opacos; patrón anómalo → **suspensión automática temporal** + alerta |
| Capturas/reventa en grupos | Sin rastro | **Marca de agua** tenue con correo/DNI del alumno sobre la pregunta (rastreable si se filtra), sin selección de texto ni menú contextual (disuasivo) |
| Abrir las hojas de Google | ENCIB está como "cualquiera con el enlace" y su ID está en GitHub | Hojas **privadas**; IDs solo en el servidor; repos privados o IDs fuera del código |
| Enlace del simulacro reenviado | La web es pública | Sin ticket/sesión no carga nada útil |
| Robo de llaves | — | Llaves solo en Script Properties; rotación si hay sospecha |
| Pérdida de datos | — | Copia semanal automática de las hojas a una carpeta privada |

**Legal (también protege)**: Términos y Condiciones con prohibición de compartir/revender y suspensión sin reembolso, Política de Privacidad (Ley 29733) y **Libro de Reclamaciones virtual** (obligatorio para vender online en Perú; la pasarela lo pide al afiliarte).

---

## 5. Límites técnicos a tener presentes

- Apps Script **no ve la IP** del visitante (no podemos bloquear por IP).
- Cuotas de Google (gratis): ~20 000 llamadas externas/día, 6 min por ejecución, ~30 usuarios simultáneos cómodos. Para cientos de alumnos a la vez → migrar backend a Supabase/Cloud Run (el diseño lo permite sin rehacer la web).
- Webhooks de pasarela hacia Apps Script reciben una redirección 302; por eso la activación **también** ocurre cuando el alumno vuelve (doble camino) y es idempotente.

---

## 6. Plan de implementación

| Fase | Qué | Necesito de ti |
|---|---|---|
| **1. Pasarela en PRUEBA** | `iniciarCompra`, `confirmarPago`/webhook, `activarCompra`, hoja `Pagos`, pantallas 3–5, alertas | Cuenta Culqi o MP + **llaves de prueba** (las cargas tú en Script Properties) |
| **2. Cuenta única + ticket** | Sesión única, `emitirTicket`/`canjearTicket`, accesos por examen, quitar `confirmado` | Generar la clave HMAC (te doy la función) |
| **3. Blindaje del contenido** | Preguntas sin clave, calificación en servidor, `responder()`, límites, marca de agua, monitoreo | — |
| **4. Legal y dominio** | Términos, Privacidad, Libro de Reclamaciones, `app.sinapsisedu.com` | Datos de la empresa/RUC, acceso al DNS del dominio |
| **5. Pasar a PRODUCCIÓN** | Llaves reales, prueba de punta a punta con un pago real pequeño y su devolución | Tu aprobación final |
| 6. Después | Renovación automática, vencimientos, boleta electrónica, progreso del banqueo en la cuenta | — |

**Pruebas de cada fase**: tarjetas y Yape de prueba de la pasarela, pagos duplicados, montos alterados, webhook repetido, ticket vencido/reutilizado, sesión en 2 dispositivos, robot que pide 1 000 preguntas.
