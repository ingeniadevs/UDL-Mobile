import { Browser } from '@capacitor/browser'
import { App } from '@capacitor/app'
import { Capacitor } from '@capacitor/core'

/**
 * Abre checkout MercadoPago.
 * Web: redirección completa. Nativo: InAppBrowser + deep link de retorno.
 */
export async function openMercadoPagoCheckout(initPoint) {
  if (!initPoint) {
    throw new Error('URL de MercadoPago no disponible')
  }

  if (!Capacitor.isNativePlatform()) {
    window.location.href = initPoint
    return null
  }

  await Browser.open({ url: initPoint, presentationStyle: 'fullscreen' })

  return new Promise((resolve) => {
    let settled = false
    const finish = async (data) => {
      if (settled) return
      settled = true
      await Browser.close().catch(() => {})
      sub?.remove?.()
      resolve(data)
    }

    const sub = App.addListener('appUrlOpen', async (event) => {
      await finish(parseMpReturnUrl(event.url))
    })

    setTimeout(() => finish(null), 30 * 60 * 1000)
  })
}

export function parseMpReturnUrl(url) {
  try {
    const parsed = new URL(url)
    return {
      status: parsed.searchParams.get('status'),
      pedidoId: parsed.searchParams.get('pedidoId'),
      paymentId: parsed.searchParams.get('payment_id'),
      externalReference: parsed.searchParams.get('external_reference'),
      raw: url
    }
  } catch {
    return {
      status: null,
      pedidoId: null,
      paymentId: null,
      externalReference: null,
      raw: url
    }
  }
}

export function clearMpQueryParams() {
  if (typeof window === 'undefined') return
  const path = window.location.pathname || '/'
  window.history.replaceState({}, document.title, path)
}
