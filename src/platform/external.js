import { Browser } from '@capacitor/browser'
import { Capacitor } from '@capacitor/core'

export async function openExternalUrl(url) {
  if (!url) return
  if (Capacitor.isNativePlatform()) {
    await Browser.open({ url, presentationStyle: 'popover' })
    return
  }
  window.open(url, '_blank', 'noopener,noreferrer')
}

export async function openWhatsApp(telefono, texto = '') {
  const num = String(telefono).replace(/\D/g, '')
  if (!num) return
  const url = `https://wa.me/${num}?text=${encodeURIComponent(texto)}`
  await openExternalUrl(url)
}
