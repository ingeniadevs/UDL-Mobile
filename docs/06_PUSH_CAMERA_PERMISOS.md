# Push, cámara, permisos e imágenes

## Cámara y galería

| Archivo | Rol |
|---------|-----|
| `src/platform/camera.js` | `Camera.getPhoto` / fallback input web |
| `src/platform/permissions.js` | `ensureCameraPermission()` |
| `src/components/shared/ImageUpload.vue` | Integración subida API |

### Permisos Android

`C:\Users\juanc\OneDrive\Escritorio\UDL-Mobile\android\app\src\main\AndroidManifest.xml`

- `CAMERA`
- `READ_MEDIA_IMAGES` (Android 13+)
- `READ_EXTERNAL_STORAGE` (maxSdk 32)

### Permisos iOS

`C:\Users\juanc\OneDrive\Escritorio\UDL-Mobile\ios\App\App\Info.plist`

- `NSCameraUsageDescription`
- `NSPhotoLibraryUsageDescription`

## Push notifications

| Archivo | Rol |
|---------|-----|
| `src/platform/push.js` | Registro FCM/APNs |
| `src/platform/index.js` | Llama `initPushNotifications()` al arranque nativo |

### Configuración requerida (pendiente negocio)

1. Proyecto **Firebase** → app Android + iOS
2. Colocar `google-services.json` en `android/app/`
3. Colocar `GoogleService-Info.plist` en `ios/App/App/`
4. Backend: endpoint para guardar token FCM/APNs (ver comentario en `push.js`)
5. Apple: certificado APNs en Apple Developer

### Android 13+

Permiso `POST_NOTIFICATIONS` ya declarado en manifest; runtime request vía plugin.

## Deep links MercadoPago

Esquema: `udlclub://callback`

- Android: intent-filter en `AndroidManifest.xml` (**configurado**)
- iOS: `CFBundleURLSchemes` en `Info.plist` (**configurado**)

Adaptar vistas socio para usar:

```javascript
import { openMercadoPagoCheckout } from '@/platform/mercadopago'
await openMercadoPagoCheckout(response.initPoint)
```

## Subida de imágenes (resumen flujo)

1. Usuario elige foto → `pickImage()`
2. Validación tipo/tamaño (5 MB) en componente
3. `FormData` + `POST /upload/image`
4. Servidor devuelve URL → `modelValue` en formulario

URLs `/uploads/*`: en producción prefijar con host de API si no usas proxy.
