import { onMounted } from 'vue'
import { useToast } from 'primevue/usetoast'
import { App } from '@capacitor/app'
import { Capacitor } from '@capacitor/core'
import { parseMpReturnUrl, clearMpQueryParams } from '@/platform/mercadopago'

const DEFAULT_TOASTS = {
  success: {
    severity: 'success',
    summary: '¡Pago exitoso!',
    detail: 'El pago fue procesado correctamente con MercadoPago.',
    life: 6000
  },
  failure: {
    severity: 'error',
    summary: 'Pago rechazado',
    detail: 'El pago no pudo procesarse. Podés intentarlo nuevamente.',
    life: 6000
  },
  pending: {
    severity: 'warn',
    summary: 'Pago pendiente',
    detail: 'Tu pago está siendo procesado. Te avisaremos cuando se confirme.',
    life: 6000
  }
}

/**
 * Escucha retornos de MercadoPago (query web o deep link udlclub://).
 */
export function useMercadoPagoReturn(options = {}) {
  const toast = useToast()

  async function handleReturn(data) {
    const status = data?.status
    if (!status) return

    if (status === 'success' && options.onSuccess) {
      await options.onSuccess(data)
    } else if (status === 'failure' && options.onFailure) {
      await options.onFailure(data)
    } else if (status === 'pending' && options.onPending) {
      await options.onPending(data)
    } else {
      const cfg = options.messages?.[status] || DEFAULT_TOASTS[status]
      if (cfg) toast.add(cfg)
    }

    if (status === 'success' && options.reload) {
      await options.reload()
    }
  }

  function processFromSearchParams() {
    if (typeof window === 'undefined') return
    const params = new URLSearchParams(window.location.search)
    if (!params.get('status')) return
    handleReturn({
      status: params.get('status'),
      pedidoId: params.get('pedidoId'),
      paymentId: params.get('payment_id'),
      externalReference: params.get('external_reference')
    })
    clearMpQueryParams()
  }

  onMounted(() => {
    processFromSearchParams()

    if (Capacitor.isNativePlatform()) {
      App.addListener('appUrlOpen', (event) => {
        const parsed = parseMpReturnUrl(event.url)
        handleReturn(parsed)
      })
    }
  })

  return { handleReturn }
}
