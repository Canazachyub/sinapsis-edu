# Mercado Pago en producción: cómo funciona, cómo diagnosticar y qué falta

Última actualización: 2026-11-12. Estado: **en producción**, ya publicado en sinapsisedu.com.
Pendiente: un pago real de S/ 1 hecho por **otra persona**. Ver la sección 5.

---

## 1. Estado actual

| Pieza | Estado |
|---|---|
| Web | `https://sinapsisedu.com`, en GitHub Pages. Se publica con cada push a `main` (`.github/workflows/deploy.yml`). |
| Banqueo / simulacros | `https://banqueo.sinapsisedu.com`, desde el repo `Canazachyub/simulaencib`. La dirección vieja `canazachyub.github.io/simulaencib/` redirige sola con un 301. |
| Servidor | Apps Script, implementación `AKfycby6vGh6…/exec`, **versión 22**. |
| Mercado Pago | Credenciales de **producción** de la app `3333654853480580` (App-Checkout-Pro), cuenta de vendedor **del dueño** (correo personal, no se publica aquí). |
| Hoja | `PLATAFORMA CENTRAL`. Usuarios, Compras y Pagos se reiniciaron el 2026-11-12; los datos anteriores están en las pestañas `Copia de …`. |

## 2. Cómo es el pago

1. El alumno llena sus datos en `/#/compra/<slug>` y pulsa **Pagar S/ X**.
2. `iniciarCompra` crea la fila en Compras (`pendiente_pago`) y una *preference* de Checkout Pro. La web redirige a su `init_point`.
3. El alumno paga en Mercado Pago con Yape, tarjeta o saldo.
4. Mercado Pago avisa por **webhook** (`notification_url = WEBAPP_URL?source=mp`) y la compra se **activa sola**, aunque el alumno cierre la pestaña.
5. Mercado Pago devuelve al alumno a `https://sinapsisedu.com/pago-retorno.html`, que redirige a `/#/gracias`. Ahí `confirmarPagoMP` confirma con el `payment_id` y, si el pago es de las últimas 2 horas y el correo coincide, **abre la sesión sola**: "¡Bienvenido! Ya estás dentro".
6. Si la cuenta es nueva, se envía un correo con usuario y contraseña. Si el correo ya tenía cuenta, **no se manda contraseña nueva**: se usa la misma de antes.

A Mercado Pago **solo se le envía `payer.email` y `payer.name`**. El DNI del formulario se queda en la hoja y Mercado Pago no lo ve.

## 3. Propiedades del script (Apps Script → Configuración del proyecto)

| Propiedad | En producción |
|---|---|
| `MP_ACCESS_TOKEN` | Token de **producción** (`APP_USR-3333654853480580-…`). Nunca se pega en el chat. |
| `MP_PUBLIC_KEY` | Public key de producción. Checkout Pro no la usa. |
| `MP_SANDBOX` | **No debe existir.** Si vale `true`, la web pasa a modo prueba. |
| `SITE_URL` | **No debe existir.** El valor por defecto es `https://sinapsisedu.com`. Solo se usa con `http://localhost:5173` para probar en local. |
| `WEBAPP_URL` | La URL `/exec`. Hace falta para el webhook. |

Cambiar propiedades **no requiere** implementar de nuevo. Cambiar `Code.gs` **sí**: Implementar → Administrar implementaciones → ✏️ → Nueva versión.

## 4. Diagnóstico: funciones del editor

Se ejecutan desde el editor de Apps Script: se elige la función en el desplegable y se pulsa ▶ Ejecutar. No imprimen secretos.

- **`testMPConfig`**: muestra si el token es de producción, `modoSandbox` (debe ser `false`), `SITE_URL`, `back_url`, `notification_url` y si la API responde con la cuenta correcta. Hoy la cuenta correcta es el nickname `EHAGBCEDF93059`, del país MPE.
- **`ultimosPagosMP`**: muestra los datos de la cuenta de vendedor (correo enmascarado, `puedeCobrar.allow`, correo confirmado) y los **últimos 8 pagos** con `estado`, **`motivo` (`status_detail`)**, medio, compra y si el pagador es el propio vendedor.

| Lo que ves | Qué significa |
|---|---|
| `pagos: []` aunque alguien "pagó" y vio un error | Mercado Pago cortó el pago **antes de crearlo**. Ver 5.1. |
| `motivo: cc_rejected_high_risk` | Lo rechazó el antifraude. Que pruebe otro medio de pago u otra persona. |
| `motivo: cc_rejected_insufficient_amount` | Saldo insuficiente. |
| `motivo: cc_rejected_bad_filled_*` | Un dato de la tarjeta está mal escrito. |
| `estado: approved` pero la compra no se activó | Revisar la pestaña Logs (`activarCompra`) y que `WEBAPP_URL` esté bien. |
| `puedeCobrar.allow: false` | La cuenta de vendedor está restringida. Revisarlo en Mercado Pago. |

## 5. El problema del 2026-11-12: "Yape rechazó tu pago" y "No pudimos procesar tu pago"

### 5.1 Qué pasó y por qué
- Se probaron dos pagos de S/ 1 desde el celular del dueño: uno con Yape y otro con su tarjeta BCP de débito. **Los dos fallaron.**
- `ultimosPagosMP` devolvió **0 pagos**: Mercado Pago bloqueó antes de crear el pago.
- **Causa:** la cuenta de vendedor está registrada con **el mismo DNI y el mismo celular** con que se intentó pagar: el Yape de ese número y la tarjeta a nombre del mismo DNI. Además, en el navegador estaba abierta una cuenta de Mercado Pago del mismo dueño (can…@gmail). **Mercado Pago no deja que el vendedor se pague a sí mismo** y muestra un error genérico.
- **Cambiar el correo del formulario no lo arregla**, porque Mercado Pago identifica al pagador por el Yape, la tarjeta y la sesión, no por ese correo.
- Antes también ayudó a confundir que la app Yape estaba desactualizada y que el correo de la cuenta de vendedor no estaba validado. El correo ya se validó el mismo día. La sección "Seguridad" del perfil solo sugiere opciones extra (2FA, llave de acceso) y no bloquea cobros.

### 5.2 Cómo hacer el pago real de prueba (pendiente)
1. Buscar a **otra persona** (familiar o amigo) con **su** Yape o **su** tarjeta.
2. Bajar el precio temporalmente: hoja `Plataformas`, columna `precio` (F) de ENAM (`P-001`), de 49 a **1**. No hay caché: cambia al instante.
3. Esa persona entra a `https://sinapsisedu.com/#/compra/enam` desde **su celular**. Si usa el del dueño, en incógnito y **sin iniciar sesión** en ninguna cuenta de Mercado Pago del dueño.
   - El **correo del formulario** puede ser uno del dueño, para recibir la contraseña, pero debe ser un correo **sin cuenta previa** en la hoja Usuarios. Si no, no llega contraseña nueva.
   - Con Yape: generar el **código de aprobación** en la app justo antes de pegarlo, porque dura poco.
4. Comprobar:
   - en la web: "¡Bienvenido! Ya estás dentro" y el Portal muestra ENAM;
   - en la hoja: usuario `U-001` y compra `C-001` con estado `aprobado` / `activo`, y una fila en Pagos;
   - en Logs: `activarCompra … origen=webhook` o `origen=retorno`;
   - en el correo: llegó el usuario y la contraseña. Revisar Spam.
5. **Volver el precio de ENAM a 49.**
6. Devolver el dinero: Mercado Pago (cuenta de vendedor) → **Actividad** → el pago → **Devolver dinero**. Normalmente también devuelve la comisión.

Si falla otra vez, ejecutar `ultimosPagosMP` y buscar el `motivo` en la tabla de la sección 4.

## 6. Comisiones
- El comprador paga exactamente el precio, sin recargo.
- Al vendedor Mercado Pago le descuenta alrededor del 4 % más IGV por venta (Checkout Pro, Perú). El monto exacto aparece en el detalle del pago y en "Comisiones y cuotas" del panel.

## 7. Volver a probar en local con modo prueba (sandbox)
1. En Script Properties: `MP_ACCESS_TOKEN` = token del **vendedor de prueba**, `MP_SANDBOX=true` y `SITE_URL=http://localhost:5173`.
2. Pagar con el **comprador de prueba**, en incógnito, con la tarjeta APRO o con saldo.
3. **Ojo:** mientras esté así, la web en producción también cobra en modo prueba. Al terminar, volver a poner el token de producción y **borrar** `MP_SANDBOX` y `SITE_URL`.

## 8. Subdominio del banqueo
- DNS en Hostinger: `CNAME banqueo → canazachyub.github.io`.
- GitHub Pages del repo `simulaencib`: dominio propio `banqueo.sinapsisedu.com` con HTTPS forzado (`gh api repos/Canazachyub/simulaencib/pages`).
- Código: `vite.config.ts` usa `base: '/'`, `BrowserRouter` va sin `basename` y `public/404.html` tiene `pathSegmentsToKeep = 0`.
- SINAPSIS enlaza al banqueo con `config.simulacrosUrl`, cuyo valor por defecto es `https://banqueo.sinapsisedu.com/`. Para probar en local, `frontend/.env` usa `VITE_SIMULACROS_URL=http://localhost:5180/`.
- La columna `url_real` de la hoja Plataformas todavía tiene la URL vieja de github.io. Funciona por la redirección, pero conviene actualizarla.

## 9. Pendientes
- [ ] Pago real de S/ 1 hecho por otra persona (sección 5.2) y su devolución.
- [ ] Actualizar `url_real` en Plataformas a `https://banqueo.sinapsisedu.com/`.
- [ ] Borrar las pestañas `Copia de Usuarios/Compras/Pagos` cuando ya no hagan falta.
- [ ] (Opcional) Activar 2FA y una llave de acceso en la cuenta de vendedor de Mercado Pago.
- [ ] Unificar el número de WhatsApp: `WHATSAPP_NUMBER` del script vs `VITE_WHATSAPP` de la web.
