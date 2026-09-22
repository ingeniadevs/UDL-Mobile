# UDL Mobile — Capacitor + Vue.js 3

Aplicación móvil (Android / iOS) del portal **Unión Deportiva Laspiur**, construida sobre el frontend Vue existente y consumiendo la **API .NET 8** sin modificar el repositorio web.

 **Raíz del proyecto:** `c:\dev\Personal\Clubes\Mobile\UDL-Mobile`

**Referencia web (solo lectura):** `c:\dev\Personal\Clubes\UDL\UDL-Frontend`

## Perfiles de API (Railway vs Docker)

| Perfil | Cuándo | Env | API |
|--------|--------|-----|-----|
| **Railway** | sin backend local | `.env.railway` | `https://udl-backend-production.up.railway.app/api` |
| **Docker** | API en `docker compose` (:5055) | `.env.android` | `http://10.0.2.2:5055/api` (emulador) |

### Perfil Railway

```powershell
cd C:\dev\Personal\Clubes\Mobile\UDL-Mobile

# Script
.\scripts\start-android.ps1 -OpenStudio

# O npm
npm run cap:android:railway
# sync sin abrir Studio: npm run cap:sync:railway
```

### Perfil Docker (emulador → PC)

```powershell
# 1) API local
cd C:\dev\Personal\Clubes\UDL\UDL-Backend
docker compose up -d
.\scripts\seed-tenants.ps1   # opcional, primera vez

# 2) App mobile
cd C:\dev\Personal\Clubes\Mobile\UDL-Mobile
.\scripts\start-android-local.ps1 -OpenStudio

# O npm
npm run cap:android:local
# sync sin abrir Studio: npm run cap:sync:local
```

Celular físico (misma Wi‑Fi): copiá `.env.android.local.example` → `.env.android.local` con la IP LAN de tu PC (`http://192.168.x.x:5055/api`) y volvé a `npm run cap:android:local`.

| Comando | Perfil |
|---------|--------|
| `npm run cap:android` / `cap:android:railway` | Railway |
| `npm run cap:android:local` / `cap:android:docker` | Docker |
| `npm run android:run:railway` | Railway + `cap run` |
| `npm run android:run:local` | Docker + `cap run` |
| `npm run dev` / `dev:local` | Navegador + proxy → Docker `:5055` |
| `npm run dev:railway` | Navegador → Railway |

Alias: `*:docker` = `*:local`.

## Inicio rápido (navegador)

```powershell
# Opción A: script que abre 3 ventanas (backend + mobile + web)
c:\dev\Personal\Clubes\Mobile\UDL-Mobile\scripts\start-review.ps1

# Opción B: manual
cd c:\dev\Personal\Clubes\UDL\UDL-Backend
docker compose up -d

cd c:\dev\Personal\Clubes\Mobile\UDL-Mobile
npm run dev
```

| Servicio | URL |
|----------|-----|
| **Mobile (revisar)** | http://localhost:5003 |
| Backend Docker | http://localhost:5055/swagger |
| Web referencia | http://localhost:5002 |

API en desarrollo navegador: proxy Vite → `http://localhost:5055`.

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
- Build + sync: `npm run cap:sync:railway` o `npm run cap:sync:local`

Pendiente operativo: Firebase push, logos en `public/images/`, QA en dispositivo, URLs MP en backend.

## Sincronizar cambios desde la web

```powershell
.\scripts\sync-from-web.ps1
```

Copia `views`, `components`, `services` (excepto `api.js`), `layouts`, `composables` y `utils` desde UDL-Frontend. Preserva capa móvil (`platform/`, `api.js`, `auth.js`, `router/`, branding Ingenia, `LoginView.vue`, etc.).

Después del sync: reaplicar adaptaciones Capacitor en vistas/layouts y cablear rutas nuevas en `src/router/index.js`. El login Ingenia (multitenant plantilla) **no** se sobrescribe.
