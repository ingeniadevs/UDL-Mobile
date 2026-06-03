# Integración API .NET 8 y JWT

## Configuración de entorno

Archivo: `C:\Users\juanc\OneDrive\Escritorio\UDL-Mobile\.env.development`

```env
VITE_API_URL=
VITE_DEV_API_PROXY=http://localhost:5055
```

- Vacío `VITE_API_URL` → Vite proxy `/api` → backend local (igual que web en dev).
- Producción móvil:

```env
VITE_API_URL=https://tu-dominio-api.com/api
```

## Cliente HTTP

Archivo: `C:\Users\juanc\OneDrive\Escritorio\UDL-Mobile\src\services\api.js`

- Base URL desde `import.meta.env.VITE_API_URL || '/api'`
- Interceptor async: `Authorization: Bearer ${token}`
- Rutas públicas: login, registro, recuperación contraseña
- 401: limpia sesión y redirige a login

## Almacenamiento seguro de credenciales

Archivo: `C:\Users\juanc\OneDrive\Escritorio\UDL-Mobile\src\platform\storage.js`

| Dato | Nativo | Desarrollo browser |
|------|--------|-------------------|
| JWT `token` | `capacitor-secure-storage-plugin` (Keychain / Keystore) | localStorage |
| Usuario JSON | `@capacitor/preferences` | localStorage |
| Carrito, tema, UI | Preferences | localStorage |

**Nunca** guardar contraseñas en el dispositivo.

## Store de autenticación

Archivo: `C:\Users\juanc\OneDrive\Escritorio\UDL-Mobile\src\stores\auth.js`

1. Al arranque: `await authStore.hydrate()` en `main.js`
2. Valida expiración JWT (`exp` claim) igual que web
3. Invalida sesiones sin array `permisos`

## Cambios recomendados en backend (referencia)

En `ClubSocios.Api` **Program.cs** producción:

- CORS no afecta apps nativas que llaman por HTTPS directo
- Asegurar certificado TLS válido en API pública
- Opcional: refresh tokens (no implementado hoy en web)

## Prueba manual JWT

```powershell
# Login desde Swagger o curl, pegar token en DevTools nativo no aplica.
# Usar la app: login socio → cerrar app → reabrir → debe mantener sesión.
```

## Subida de imágenes

Endpoint existente: `POST /api/upload/image` multipart.

`ImageUpload.vue` y `uploadService` del web funcionan sin cambio de contrato; solo cambia origen del archivo (cámara vs input).

## HTTPS y cleartext Android

Para API HTTP solo en **desarrollo** local con dispositivo físico, en `capacitor.config.json`:

```json
"server": {
  "url": "http://IP-LAN:5003",
  "cleartext": true
}
```

En producción usar siempre HTTPS; `android:usesCleartextTraffic` debe permanecer `false`.
