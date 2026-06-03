import { Capacitor } from '@capacitor/core'
import { App } from '@capacitor/app'
import { StatusBar, Style } from '@capacitor/status-bar'
import { SplashScreen } from '@capacitor/splash-screen'
import { Keyboard } from '@capacitor/keyboard'
import { Network } from '@capacitor/network'
import { initPushNotifications } from './push'

let networkToastHandler = null

export function setNetworkToastHandler(handler) {
  networkToastHandler = handler
}

export async function initPlatform() {
  if (!Capacitor.isNativePlatform()) return

  try {
    await StatusBar.setStyle({ style: Style.Dark })
    await StatusBar.setBackgroundColor({ color: '#0f0f0f' })
  } catch {
    /* iOS puede ignorar background */
  }

  await SplashScreen.hide()

  App.addListener('backButton', ({ canGoBack }) => {
    if (canGoBack) {
      window.history.back()
    } else {
      App.minimizeApp()
    }
  })

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
