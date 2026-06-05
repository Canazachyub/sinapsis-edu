# Auditoría UX/QA — SINAPSIS EDU

> Backlog del test E2E por fases (agente de navegador + revisión de código).
> Estado: **✅ 4 fases completas. Grupo A + decisiones del Grupo B implementados
> y desplegados (2026-06-05).** Ver el detalle de cambios en `CHANGELOG.md`.
> Quedan: B3 pricing, A5 acentos en Sheet, y la deuda de seguridad (#2–#7).

---

## FASE 1 — Landing + Detalle de plataformas

### Bugs confirmados en código

| ID | Sev | Descripción | Causa raíz (verificada) | Archivo |
|----|-----|-------------|-------------------------|---------|
| BUG-01 | Alta | `/#/plataforma/residentado` → "Plataforma no encontrada" | El slug real es `rm`; no hay alias. `data = plataformas.find(p => p.slug===slug)` y `INFO[slug]` no matchean "residentado" | `pages/Plataforma.tsx:230-238` |
| BUG-02 | Media | Links de Plataformas en footer no son clickables | Son `<li>` de texto plano, sin `<a href>` | `components/Footer.tsx` (ul Plataformas) |
| BUG-03 | Baja | Sección `#programa` existe pero no está enlazada en navbar | Navbar no incluye enlace a `#programa` | `components/Navbar.tsx` + `pages/Landing.tsx` |
| BUG-04 | Media | No hay FAQ en la Landing (solo en detalle) | Landing no monta sección FAQ | `pages/Landing.tsx` |
| BUG-05 | Baja-Media | "Contacto" del navbar hace scroll al footer (id="contacto"), no a sección/form propia | Footer tiene `id="contacto"`; no hay sección de contacto dedicada | `components/Footer.tsx` / `Navbar.tsx` |

### Slugs reales (para corregir enlaces)
`enam`, `encib`, `encaps`, `rm`, `essalud`, `biblioteca`, `anatomia`, `cto`.
(No existe `cb`; "Ciencias Básicas" = `encib`. "Residentado Médico" = `rm`.)

### Mejoras UX (Fase 1)
| ID | Esf | Mejora |
|----|-----|--------|
| UX-01 | B | Acentos faltantes en textos ("Preparacion", "RESIDENTADO MEDICO", "Ciencias Basicas") |
| UX-02 | M | Pricing landing solo muestra `/1 mes`; sin planes semestral/anual ni claridad de promo "desde S/39" |
| UX-03 | M | Sin demo/prueba gratuita visible (barrera de entrada SaaS) |
| UX-04 | B | "Ver detalles" en cards poco prominente vs "Comprar acceso" |
| UX-05 | B | `/#/login` sin CTA para nuevos usuarios ("¿No tienes acceso? Elige tu plataforma") |
| UX-06 | B | `<title>` genérico, no cambia por ruta (SEO) |

### Consola/Red Fase 1
- Sin errores JS. 4 POST a Apps Script HTTP 200 (auto-checks al cargar). Sin 4xx/5xx.

---

## FASE 2 — Compra + voucher + Gracias
> Recibida y verificada. Flujo registrarCompra → subirVoucher → /#/gracias funciona E2E.

### Bugs confirmados en código

| ID | Sev | Descripción | Causa raíz (verificada) | Archivo |
|----|-----|-------------|-------------------------|---------|
| BUG-06 | Media | Tras "Confirmar solicitud", la página de gracias queda con el scroll abajo; hay que subir para ver la confirmación | No hay `ScrollToTop` global; React Router conserva la posición de scroll al navegar `/compra`→`/gracias` | `router.tsx` (falta componente) · `Compra.tsx:287` navega |

> Fix: crear `<ScrollToTop>` que escuche `useLocation().pathname` y haga `window.scrollTo(0,0)`, montado dentro de `<HashRouter>`. **Ojo:** no romper el scroll-a-sección de la Landing (`Landing.tsx:64` usa `location.state.scrollTo`); saltar el reset si hay `state.scrollTo`.

### Mejoras UX (Fase 2)
| ID | Esf | Mejora |
|----|-----|--------|
| UX-07 | B | Mensaje intermedio "Solicitud C-006 registrada. Solo falta el voucher" confunde: el voucher ya se estaba subiendo. Cambiar a "Registrando… subiendo voucher" |
| UX-08 | M | Flujo de 2 requests (registrar→subir): si la subida del voucher falla, la compra queda registrada sin comprobante. Agregar reintento de subida visible desde la pantalla |

### Consola/Red Fase 2
- 2 POST a Apps Script HTTP 200 (registrarCompra → C-006; subirVoucher). Respuestas opacas en DevTools (no-cors) pero la UI confirma `ok:true`. Sin errores JS ni 4xx/5xx.
- Nota: se creó la compra de prueba **C-006** (Nombre "QA-TEST AgenteNavegador", correo yubequizles@gmail.com) → limpiar luego de las hojas Compras/Usuarios.

## FASE 3 — Login + Portal + Aula
> Recibida y verificada. Sin bugs bloqueantes. Seguridad cliente: limpia (URL real oculta, sin pass/hash en storage, logout limpia `pc_user`/`pc_token`).

### Bugs / gaps confirmados en código

| ID | Sev | Descripción | Causa raíz (verificada) | Archivo |
|----|-----|-------------|-------------------------|---------|
| UX-09 | Baja | Portal muestra "vence en 5 días" pero **sin fecha exacta** | `venceTexto()` solo devuelve texto relativo; `fecha_fin` ya viene en los datos, no se muestra | `pages/Portal.tsx:39-44,143` |
| UX-10 | Baja | Header del aula **sin vencimiento** (solo logo/nombre/Salir) | `Aula.tsx` no recibe ni muestra `fecha_fin` | `pages/Aula.tsx:49-66` |
| UX-11 | Baja | Tras login, "Cargando tu portal…" ~3-5s **sin spinner** | Falta indicador de progreso durante fetch de accesos | `pages/Portal.tsx` |
| UX-12 | Media | Sin "olvidé contraseña" self-service (solo WhatsApp manual) | No implementado (aceptable para el modelo, mejora futura) | `pages/Login.tsx` |
| SEC-01 | Baja | `sandbox` del iframe tiene permisos extra vs. spec | `allow-popups-to-escape-sandbox` + `allow-downloads` añadidos; spec CLAUDE.md §10 era `allow-same-origin allow-scripts allow-forms allow-popups`. Contenido es cross-origin (github.io) → no accede al storage, pero revisar necesidad | `components/IframeViewer.tsx:18` |

### Consola/Red Fase 3
- 3 POST a Apps Script HTTP 200 (login/portal). Sin errores JS de la app ni 4xx/5xx.
- (El log "i18next… Locize" proviene de una extensión del navegador, no del sitio.)

### Fuera de alcance (verificado por el agente)
- Comportamiento con acceso **vencido** no se probó (la cuenta no tiene uno caducado aún).

## FASE 4 — Responsive + consola
> Recibida. Sin bugs de layout detectados, pero **no verificado pixel-perfect en móvil** (el entorno del agente quedó fijo en viewport 1020px, sin emulador real). Auditoría hecha por inspección + breakpoints CSS.

### Hallazgos

| ID | Sev | Descripción | Resolución |
|----|-----|-------------|-----------|
| FP-01 | — | `<span>` "Stop Claude" en el DOM del Aula | **FALSO POSITIVO.** No existe en el repo (grep vacío). Es el overlay de control del agente de navegador, no del sitio. Sin inyección |
| UX-13 | Baja | Validar Aula a 375px (embed YouTube + grid 8 cursos = mayor riesgo de desborde) | Usar `aspect-ratio` en el iframe de YouTube; re-test con emulador real |
| — | — | Responsive landing/compra/portal | Sin desbordes (`scrollWidth ≤ innerWidth`), mobile-first Tailwind, hamburguesa OK |

### Pendiente metodológico
- Re-test responsive 375/768 con emulador real (este entorno no lo permitió).
- Sin errores de consola del sitio en ninguna ruta. Único log = extensión del navegador.

---

## ✅ BACKLOG FINAL PRIORIZADO (4 fases completas)

### Grupo A — Fixes de código, sin decisiones de producto (los puedo hacer ya)
| # | Tipo | Sev/Esf | Item | Archivo |
|---|------|---------|------|---------|
| A1 | Bug | Alta | Alias de slugs (`residentado→rm`, etc.) o 404 con sugerencia | `Plataforma.tsx` |
| A2 | Bug | Media | Footer: envolver plataformas en `<Link>` | `Footer.tsx` |
| A3 | Bug | Media | `<ScrollToTop>` global (respetando scrollTo de Landing) | `router.tsx` nuevo comp. |
| A4 | Bug | Baja | Enlazar `#programa` en navbar (o quitarla) | `Navbar.tsx` |
| A5 | UX | B | Acentos faltantes ("Preparacion", "Basicas", "MEDICO"...) | varios |
| A6 | UX | B | `<title>` dinámico por ruta | por página |
| A7 | UX | B | "Ver detalles" con jerarquía visual de botón | `Landing.tsx` |
| A8 | UX | B | Login: CTA "¿No tienes acceso? Elige tu plataforma" | `Login.tsx` |
| A9 | UX | B | Mensaje "Registrando… subiendo voucher" (no "Solo falta el voucher") | `Compra.tsx` |
| A10 | UX | B | Portal: mostrar fecha exacta de vencimiento | `Portal.tsx` |
| A11 | UX | B | Aula: mostrar vencimiento en el header | `Aula.tsx` |
| A12 | UX | B | Spinner/skeleton en "Cargando tu portal…" + error si falla | `Portal.tsx` |
| A13 | Sec | Baja | Revisar/recortar `sandbox` del iframe (quitar lo no usado) | `IframeViewer.tsx` |
| A14 | UX | B | YouTube embed con `aspect-ratio` (responsive móvil) | Aula/IframeViewer |

### Grupo B — Requieren decisión/contenido de Yubert
| # | Tipo | Item | Necesita |
|---|------|------|----------|
| B1 | Bug/UX | FAQ en la Landing | ¿Qué preguntas/respuestas? (o reuso de las de detalle) |
| B2 | UX | "Contacto" del navbar: ¿sección/form propio o dejar scroll a footer? | Decisión |
| B3 | UX | Pricing: planes semestral/anual + aclarar promo "desde S/39" | Definir planes/precios |
| B4 | UX | Demo/prueba gratuita visible | ¿Existe demo? ¿link? |
| B5 | UX | Reintento de subida de voucher si falla (compra sin comprobante) | OK para implementar (M) |
| B6 | UX | "Olvidé contraseña" self-service | ¿Implementar o seguir vía WhatsApp? |

---

## Plan de implementación
1. **Grupo A** en un solo batch → 1 build + 1 deploy (push a main).
2. **Grupo B** según decisiones de Yubert.
3. Limpieza de datos de prueba: borrar compra **C-006** y usuario de prueba de las hojas.
