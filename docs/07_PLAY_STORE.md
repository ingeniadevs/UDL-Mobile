# Google Play Store — configuración

## Identidad de la app

| Campo | Valor en proyecto |
|-------|-------------------|
| applicationId | `ar.ingenialabs.udl` |
| Nombre visible | UDL Club |
| Proyecto Gradle | `C:\Users\juanc\OneDrive\Escritorio\UDL-Mobile\android\` |

## Build de release

1. Generar keystore (una sola vez, guardar backup seguro):

```powershell
keytool -genkey -v -keystore udl-release.keystore -alias udl -keyalg RSA -keysize 2048 -validity 10000
```

2. `android/app/build.gradle` — configurar `signingConfigs` (no commitear contraseñas; usar variables de entorno).

3. Build:

```powershell
cd C:\Users\juanc\OneDrive\Escritorio\UDL-Mobile
npm run build
npx cap sync android
cd android
.\gradlew bundleRelease
```

Salida: `android/app/build/outputs/bundle/release/app-release.aab`

## Play Console checklist

- [ ] Cuenta desarrollador Google ($25 único)
- [ ] Política de privacidad (URL pública)
- [ ] Clasificación de contenido (cuestionario)
- [ ] Capturas: teléfono 6.7" y 5.5" mínimo
- [ ] Icono 512×512, feature graphic 1024×500
- [ ] Descripción corta / larga en español
- [ ] Data safety: declarar datos de usuario (email, foto, pagos)
- [ ] Target API level según requisito actual de Google
- [ ] Prueba interna → cerrada → producción

## Firebase (push)

- Subir `google-services.json` antes del build release con push habilitado.

## Notas de revisión

- Explicar uso de cámara (foto de perfil / productos admin)
- Si hay pagos MercadoPago, indicar que pagos se procesan fuera de la app (browser)
