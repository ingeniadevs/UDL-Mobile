import { createApp } from 'vue'
import { createPinia } from 'pinia'
import PrimeVue from 'primevue/config'
import ToastService from 'primevue/toastservice'
import ConfirmationService from 'primevue/confirmationservice'
import Tooltip from 'primevue/tooltip'

import App from './App.vue'
import router from './router'
import { initPlatform } from '@/platform'
import { initNavigationGuards } from '@/platform/navigation'
import { hydrateTheme } from '@/composables/useTheme'
import { hydrateClubBranding, useClubBranding } from '@/composables/useClubBranding'
import { useAuthStore } from '@/stores/auth'
import { useTenantStore } from '@/stores/tenant'

import 'primevue/resources/primevue.min.css'
import 'primeicons/primeicons.css'
import 'primeflex/primeflex.css'
import './assets/main.css'
import './assets/mobile.css'

async function withTimeout(promise, ms, label) {
  let timer
  try {
    return await Promise.race([
      promise,
      new Promise((_, reject) => {
        timer = setTimeout(() => reject(new Error(`${label} timeout ${ms}ms`)), ms)
      })
    ])
  } finally {
    clearTimeout(timer)
  }
}

async function bootstrap() {
  const app = createApp(App)
  const pinia = createPinia()

  app.use(pinia)
  app.use(router)
  app.use(PrimeVue, { ripple: true })
  app.use(ToastService)
  app.use(ConfirmationService)
  app.directive('tooltip', Tooltip)

  try {
    await hydrateTheme()
  } catch (err) {
    console.warn('hydrateTheme falló', err)
  }

  const tenantStore = useTenantStore()
  try {
    await tenantStore.hydrate()
  } catch (err) {
    console.warn('tenant hydrate falló', err)
  }

  const authStore = useAuthStore()
  try {
    await authStore.hydrate()
  } catch (err) {
    console.warn('auth hydrate falló', err)
  }

  const { setClubId } = useClubBranding()
  setClubId(tenantStore.clubId)
  try {
    // No bloquear el mount si el API local/Railway no responde
    await withTimeout(hydrateClubBranding(), 4000, 'hydrateClubBranding')
  } catch (err) {
    console.warn('hydrateClubBranding omitido', err?.message || err)
  }

  try {
    await withTimeout(initPlatform(), 5000, 'initPlatform')
  } catch (err) {
    console.warn('initPlatform omitido', err?.message || err)
  }

  initNavigationGuards(router)
  await router.isReady()
  app.mount('#app')
}

bootstrap().catch((err) => {
  console.error('Error al iniciar UDL Mobile', err)
  const el = document.getElementById('app')
  if (el && !el.childElementCount) {
    el.innerHTML =
      '<div style="min-height:100vh;display:flex;align-items:center;justify-content:center;padding:24px;font-family:system-ui;background:#0f0f0f;color:#fff;text-align:center">' +
      '<div><p style="font-size:1.1rem;margin:0 0 8px">No se pudo iniciar la app</p>' +
      '<p style="opacity:.7;margin:0;font-size:.9rem">Revisá Logcat / consola WebView</p></div></div>'
  }
})
