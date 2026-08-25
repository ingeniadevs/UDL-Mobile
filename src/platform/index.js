import { Capacitor, SystemBars, SystemBarsStyle } from '@capacitor/core'
import { StatusBar, Style } from '@capacitor/status-bar'
import { SplashScreen } from '@capacitor/splash-screen'
import { Keyboard } from '@capacitor/keyboard'
import { Network } from '@capacitor/network'
import { initPushNotifications } from './push'

let networkToastHandler = null

export function setNetworkToastHandler(handler) {
  networkToastHandler = handler
}

export async function syncStatusBar(isDark) {
  if (!Capacitor.isNativePlatform()) return
  try {
    /* Capacitor 8+: SystemBars (edge-to-edge). StatusBar legacy en iOS / Android < 15. */
    await SystemBars.setStyle({
      style: isDark ? SystemBarsStyle.Dark : SystemBarsStyle.Light,
    })
    await StatusBar.setStyle({ style: isDark ? Style.Dark : Style.Light })
    await StatusBar.setBackgroundColor({ color: isDark ? '#0f0f0f' : '#ffffff' })
    await StatusBar.setOverlaysWebView({ overlay: true })
  } catch {
    /* iOS / Android pueden ignorar algunas opciones */
  }
}

export async function initPlatform() {
  if (!Capacitor.isNativePlatform()) return

  const isDark = document.documentElement.classList.contains('theme-dark')
  await syncStatusBar(isDark)

  await SplashScreen.hide()

  const status = await Network.getStatus()
  if (!status.connected && networkToastHandler) {
    networkToastHandler('Sin conexión a internet')
  }

  Network.addListener('networkStatusChange', (s) => {
    if (!s.connected && networkToastHandler) {
      networkToastHandler('Conexión perdida')
    }
  })

  try {
    await Keyboard.setAccessoryBarVisible({ isVisible: true })
  } catch {
    /* solo iOS */
  }

  await initPushNotifications()
}

export { Capacitor }
