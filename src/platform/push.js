import { PushNotifications } from '@capacitor/push-notifications'
import { Capacitor } from '@capacitor/core'
import { ensurePushPermission } from './permissions'
import api from '@/services/api'

let listenersRegistered = false

/**
 * Registra el dispositivo para push (FCM / APNs).
 * Requiere configuración en Firebase + backend endpoint (ver docs/PUSH_NOTIFICATIONS.md).
 */
export async function initPushNotifications() {
  if (!Capacitor.isNativePlatform()) return null

  // Requiere google-services.json (Android) / GoogleService-Info.plist (iOS).
  // Sin Firebase, PushNotifications.register() crashea el proceso nativo.
  if (import.meta.env.VITE_ENABLE_PUSH !== 'true') {
    console.info('[Push] Deshabilitado (VITE_ENABLE_PUSH != true). Ver docs/06_PUSH_CAMERA_PERMISOS.md')
    return null
  }

  const granted = await ensurePushPermission()
  if (!granted) return null

  if (!listenersRegistered) {
    listenersRegistered = true

    await PushNotifications.addListener('registration', async (token) => {
      console.info('[Push] Token registrado')
      try {
        await api.post('/notificaciones/dispositivos', {
          token: token.value,
          plataforma: Capacitor.getPlatform()
        })
      } catch (err) {
        console.warn('[Push] No se pudo registrar token en API', err)
      }
    })

    await PushNotifications.addListener('registrationError', (error) => {
      console.error('[Push] Error de registro', error)
    })

    await PushNotifications.addListener('pushNotificationReceived', (notification) => {
      console.info('[Push] Recibida en foreground', notification)
    })

    await PushNotifications.addListener('pushNotificationActionPerformed', (action) => {
      console.info('[Push] Acción', action)
      // TODO: deep link a ruta según action.notification.data
    })
  }

  await PushNotifications.register()
  return true
}
