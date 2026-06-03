# UDL Mobile — Capacitor + Vue.js 3

Aplicación móvil (Android / iOS) del portal **Unión Deportiva Laspiur**, construida sobre el frontend Vue existente y consumiendo la **API .NET 8** sin modificar el repositorio web.

**Raíz del proyecto:** `C:\Users\juanc\OneDrive\Escritorio\UDL-Mobile`

**Referencia web (solo lectura):** `C:\Users\juanc\OneDrive\Escritorio\UDL\UDL-Frontend`

## Inicio rápido

```powershell
# Opción A: script que abre 3 ventanas (backend + mobile + web)
C:\Users\juanc\OneDrive\Escritorio\UDL-Mobile\scripts\start-review.ps1

# Opción B: manual
cd C:\Users\juanc\OneDrive\Escritorio\UDL\UDL-Backend\ClubSocios.Api
dotnet run --launch-profile http

cd C:\Users\juanc\OneDrive\Escritorio\UDL-Mobile
npm run dev
```

| Servicio | URL |
|----------|-----|
| **Mobile (revisar)** | http://localhost:5003 |
| Backend local | http://localhost:5055/swagger |
| Web referencia | http://localhost:5002 (o 5004 si el puerto está ocupado) |

API en desarrollo: proxy Vite → `http://localhost:5055`.

### Solo Railway (sin backend local)

```powershell
cd C:\Users\juanc\OneDrive\Escritorio\UDL-Mobile
npm run dev:railway
```

Usa `.env.railway` → `https://udl-backend-production.up.railway.app/api`

## Build nativo

```powershell
npm run build
npm run cap:sync
npm run cap:android   # Android Studio
npm run cap:ios       # Xcode (macOS)
```

## Documentación

| Documento | Contenido |
|-----------|-----------|
| [docs/01_ANALISIS_ESTRATEGIAS.md](docs/01_ANALISIS_ESTRATEGIAS.md) | Comparativa Capacitor / Ionic / MAUI / Flutter / RN |
| [docs/02_ARQUITECTURA.md](docs/02_ARQUITECTURA.md) | Arquitectura completa |
| [docs/03_PLAN_MIGRACION.md](docs/03_PLAN_MIGRACION.md) | Migración incremental |
| [docs/04_REUTILIZACION_VUE.md](docs/04_REUTILIZACION_VUE.md) | % reutilización por capa |
| [docs/05_INTEGRACION_API_JWT.md](docs/05_INTEGRACION_API_JWT.md) | API, JWT, almacenamiento seguro |
| [docs/06_PUSH_CAMERA_PERMISOS.md](docs/06_PUSH_CAMERA_PERMISOS.md) | Push, cámara, permisos |
| [docs/07_PLAY_STORE.md](docs/07_PLAY_STORE.md) | Google Play |
| [docs/08_APP_STORE.md](docs/08_APP_STORE.md) | Apple App Store |

## Estado de migración (código)

- Portal **socio**: MercadoPago, carrito, carnet, inicio personalizado — adaptado a móvil
- Portal **admin**: rutas habilitadas (`VITE_ENABLE_ADMIN=true`), WhatsApp, export PDF/CSV, reportes
- Build + sync Android/iOS: `npm run build && npm run cap:sync`

Pendiente operativo: Firebase push, logos en `public/images/`, QA en dispositivo, URLs MP en backend.

## Sincronizar cambios desde la web

```powershell
.\scripts\sync-from-web.ps1
```

Revisa siempre los archivos adaptados en `src/platform/`, `src/services/api.js` y `src/stores/auth.js` antes de sobrescribir.
