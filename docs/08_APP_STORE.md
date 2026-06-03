# Apple App Store — configuración

> Requiere **macOS** con Xcode para firmar y subir builds.

## Identidad

| Campo | Valor |
|-------|-------|
| Bundle ID | `ar.ingenialabs.udl` (registrar en Apple Developer) |
| Proyecto | `C:\Users\juanc\OneDrive\Escritorio\UDL-Mobile\ios\` |
| Display name | UDL Club |

## Certificados y perfiles

1. Apple Developer Program ($99/año)
2. App ID con capabilities: Push Notifications, Associated Domains (si universal links MP)
3. Distribution certificate + App Store provisioning profile

## Build

```bash
cd UDL-Mobile
npm run build
npx cap sync ios
npx cap open ios
```

En Xcode:

- Team de desarrollo
- Version / Build number
- Archive → Distribute App → App Store Connect

## App Store Connect checklist

- [ ] Política de privacidad
- [ ] Screenshots iPhone 6.7" y 5.5" (obligatorios)
- [ ] Screenshots iPad si soportas tablet
- [ ] Categoría: Sports / Lifestyle
- [ ] Export compliance (cifrado HTTPS estándar → exempt simplificado)
- [ ] Sign in with Apple: **no requerido** si solo login propio email/password
- [ ] TestFlight beta antes de revisión

## Push (APNs)

- Subir clave `.p8` o certificado push en Developer
- `GoogleService-Info.plist` si usas Firebase como capa sobre APNs

## Deep link MercadoPago

URL scheme `udlclub` configurado en `ios/App/App/Info.plist`.

Para universal links HTTPS adicionales, configurar Associated Domains en Xcode y `apple-app-site-association` en el dominio.

## Revisión App Store

Documentar en “Notes for reviewer”:

- Credenciales de cuenta demo socio
- Flujo de pago abre Safari/in-app browser y vuelve por deep link
