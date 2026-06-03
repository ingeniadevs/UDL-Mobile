import { Camera } from '@capacitor/camera'
import { PushNotifications } from '@capacitor/push-notifications'
import { Capacitor } from '@capacitor/core'

export async function ensureCameraPermission() {
  if (!Capacitor.isNativePlatform()) return true

  const current = await Camera.checkPermissions()
  if (current.camera === 'granted' && current.photos === 'granted') {
    return true
  }

  const requested = await Camera.requestPermissions({
    permissions: ['camera', 'photos']
  })
  return requested.camera === 'granted' || requested.photos === 'granted'
}

export async function ensurePushPermission() {
  if (!Capacitor.isNativePlatform()) return false

  const current = await PushNotifications.checkPermissions()
  if (current.receive === 'granted') return true

  const requested = await PushNotifications.requestPermissions()
  return requested.receive === 'granted'
}
