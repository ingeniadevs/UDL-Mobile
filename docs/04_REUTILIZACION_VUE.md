# Análisis de reutilización del frontend Vue

Basado en inspección de `C:\Users\juanc\OneDrive\Escritorio\UDL\UDL-Frontend\src` (48 archivos `.vue` / `.js`).

## Resumen ejecutivo

| Ámbito | Reutilización directa | Adaptación | Reescritura |
|--------|----------------------|------------|-------------|
| **Portal Socio (MVP)** | **~75–85 %** | ~10–15 % | ~5 % |
| **Panel Admin** | **~55–65 %** | ~25–30 % | ~10–15 % |
| **Proyecto completo** | **~65–72 %** | ~20–25 % | ~8–12 % |

## Por capa técnica

### Alta reutilización (90–100 %)

| Archivo / carpeta | Líneas aprox. | Notas |
|-------------------|---------------|-------|
| `services/index.js` | ~650 | Todos los servicios REST — sin cambios |
| `services/planesService.js` | pequeño | Igual |
| `services/inventarioService.js` | pequeño | Igual |
| `router` guards lógica | ~50 | Copiado; flag admin móvil |
| `components/shared/EmptyState.vue` | — | 100 % |
| `components/shared/LoadingSpinner.vue` | — | 100 % |

### Reutilización con adaptación (70–90 %)

| Archivo | Cambio requerido |
|---------|------------------|
| `services/api.js` | Token async + secure storage (**hecho**) |
| `stores/auth.js` | `hydrate()` async (**hecho**) |
| `components/shared/ImageUpload.vue` | Cámara nativa (**hecho**) |
| `composables/useTheme.js` | OK en WebView; tema vía localStorage |
| Todas las vistas **socio** | MercadoPago, carrito, query params |
| `layouts/SocioLayout.vue` | Safe area CSS; ya tiene drawer móvil |

### Adaptación media (50–70 %)

| Archivo | Motivo |
|---------|--------|
| Vistas **admin** con DataTable | Scroll horizontal; columnas en móvil |
| `ReporteMovimientos.vue` | `window.print`, html2canvas → Share/Filesystem |
| `PagosView.vue` | Export PDF, `window.print` |
| `ReservasView.vue` (admin) | `window.open` WhatsApp |
| `Dashboard*.vue` | Chart.js OK; reducir altura gráficos |

### Reescritura recomendada (0–40 % reutilización lógica)

| Elemento | Alternativa móvil |
|----------|-------------------|
| Sidebar desktop admin | Bottom nav o Ionic tabs (fase 2) |
| Flujos `window.location` MP | `platform/mercadopago.js` |
| `localStorage` carrito / banners | `useAppStorage` / Preferences |
| Drag & drop en ImageUpload | Solo cámara/galería en nativo |

## Inventario de APIs web usadas en código

| API browser | Archivos afectados | Estrategia móvil |
|-------------|-------------------|------------------|
| `localStorage` | auth, tienda, inicio, theme | `platform/storage.js` |
| `window.location.href` | Login, Tienda, Pagos, Reservas | `mercadopago.js` + Browser |
| `window.location.search` | Tienda, Pagos, Reservas | Deep link `appUrlOpen` |
| `window.open` / `print` | Reportes, Pagos, Reservas | Share / Browser |
| `document.getElementById` | ReporteMovimientos | Mantener en WebView o PDF servidor |
| `FileReader` | ImageUpload | Mantener en web; Camera en nativo |
| `navigator.share` | Carnet | Ya compatible; Capacitor Share opcional |

## Vistas socio — detalle

| Vista | Reutilización estimada |
|-------|------------------------|
| InicioView | 85 % (storage) |
| DashboardView | 90 % |
| PerfilView | 80 % (foto) |
| CarnetDigitalView | 70 % (descarga/share) |
| MiPlanView | 85 % |
| MisPagosView | 75 % (MP) |
| TiendaView | 70 % (carrito + MP) |
| MisPedidosView | 90 % |
| DisciplinasView | 90 % |
| ReservasView | 75 % (MP) |
| LoginView | 80 % (registro MP) |

## Vistas admin — detalle

| Vista | Reutilización estimada |
|-------|------------------------|
| SociosView / SocioDetail | 65 % |
| ReservasView | 55 % (tabla + WA) |
| MovimientosView + componentes | 60 % (PDF/print) |
| ProductosView | 75 % (ImageUpload OK) |
| Resto CRUD estándar | 70–80 % |

## Estrategia de sincronización con web

1. Desarrollar features en `UDL-Frontend` cuando sean compartidas.
2. Ejecutar `scripts/sync-from-web.ps1`.
3. Re-aplicar parches en archivos de la lista “preservados”.
4. Probar `npm run dev` (puerto 5003) y `npm run cap:sync`.

**No editar** `UDL-Frontend` desde el agente de migración móvil; solo `UDL-Mobile`.
