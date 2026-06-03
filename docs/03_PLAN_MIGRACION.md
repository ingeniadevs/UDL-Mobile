# Plan de migración incremental

Objetivo: publicar en tiendas manteniendo **UDL-Frontend** operativo y comparando feature a feature con **UDL-Mobile**.

## Fase 0 — Infraestructura (completada en repo)

- [x] Crear `C:\Users\juanc\OneDrive\Escritorio\UDL-Mobile`
- [x] Proyecto Vite + Vue 3 + PrimeVue 3 alineado con web
- [x] Capacitor + `android/` + `ios/`
- [x] Capa `src/platform/`
- [x] `api.js` + `auth.js` adaptados

## Fase 1 — MVP Portal Socio (4–6 semanas)

| Semana | Entregable | Estado |
|--------|------------|--------|
| 1 | Login, hydrate JWT, navegación socio | ✅ Código |
| 2 | Inicio, Perfil, Carnet (share nativo) | ✅ Código |
| 3 | Mis Pagos + MercadoPago in-app browser | ✅ Código |
| 4 | Reservas + Tienda + carrito (Preferences) | ✅ Código |
| 5 | Mis Pedidos, Disciplinas, Mi Plan | ✅ Copiado (sin cambios extra) |
| 6 | Beta interna (TestFlight + Play Internal) | ⏳ Pendiente QA dispositivo |

### Tareas técnicas por vista (socio)

| Vista | Acción | Estado |
|-------|--------|--------|
| `LoginView.vue` | MP registro + clipboard | ✅ |
| `TiendaView.vue` | Carrito Preferences + MP | ✅ |
| `MisPagosView.vue` | MP + deep link | ✅ |
| `ReservasView.vue` | MP + deep link | ✅ |
| `CarnetDigitalView.vue` | Share + descarga nativa | ✅ |
| `InicioView.vue` | Preferences tiles | ✅ |

### Fase 1b — Admin móvil (código base)

| Vista / módulo | Acción | Estado |
|----------------|--------|--------|
| `AdminLayout` / `SocioLayout` | Sidebar móvil-first en nativo | ✅ |
| `admin/InicioView` | Preferences tiles | ✅ |
| `admin/ReservasView` | WhatsApp Browser + CSV/PDF share | ✅ |
| `admin/PagosView` | Cupón share / print móvil | ✅ |
| `ReporteMovimientos` | PDF share nativo | ✅ |
| Resto admin CRUD | PrimeVue responsive (sin reescritura) | ✅ Copiado |

## Fase 2 — Pulido nativo (2–3 semanas)

- Push notifications (endpoint backend + Firebase)
- Splash / iconos / pantallas de marca
- Offline banner (`@capacitor/network`)
- Haptics en acciones críticas (opcional)

## Fase 3 — Admin móvil opcional (4–8 semanas)

Activar `VITE_ENABLE_ADMIN=true` solo si el negocio lo requiere.

- Tablas PrimeVue: modo card en `<768px`
- Reportes PDF: `@capacitor/share` en lugar de `window.print`
- `ReservasView`: WhatsApp con `@capacitor/browser`

## Fase 4 — Publicación (2 semanas)

Ver `07_PLAY_STORE.md` y `08_APP_STORE.md`.

## Backend (sin romper web)

Añadir en `CORS:AllowedOrigins` (producción):

- Origen del WebView no aplica (app nativa llama API directa)
- Asegurar `VITE_API_URL` HTTPS público

Opcional nuevo endpoint:

```
POST /api/notificaciones/dispositivos
{ token, plataforma: "android" | "ios" }
```

## Workflow diario desarrollador

```powershell
# Terminal 1 — API
cd C:\Users\juanc\OneDrive\Escritorio\UDL\UDL-Backend\ClubSocios.Api
dotnet run

# Terminal 2 — Mobile web
cd C:\Users\juanc\OneDrive\Escritorio\UDL-Mobile
npm run dev

# Terminal 3 — después de cambios en web compartidos
.\scripts\sync-from-web.ps1
npm run cap:sync
```

## Criterios de “paridad” web vs móvil

Para cada pantalla socio documentar en checklist:

- [ ] Mismos endpoints
- [ ] Mismos flujos de error (toast)
- [ ] MP funciona y vuelve a la app
- [ ] Permisos solicitados en primer uso
- [ ] Token persiste tras cerrar app
