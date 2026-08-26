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

async function bootstrap() {
  const app = createApp(App)
  const pinia = createPinia()

  app.use(pinia)
  app.use(router)
  app.use(PrimeVue, { ripple: true })
  app.use(ToastService)
  app.use(ConfirmationService)
  app.directive('tooltip', Tooltip)

  await hydrateTheme()

  const tenantStore = useTenantStore()
  await tenantStore.hydrate()

  const authStore = useAuthStore()
  await authStore.hydrate()

  const { setClubId } = useClubBranding()
  setClubId(tenantStore.clubId)
  await hydrateClubBranding()

  await initPlatform()
  initNavigationGuards(router)
  await router.isReady()
  app.mount('#app')
}

bootstrap().catch((err) => {
  console.error('Error al iniciar UDL Mobile', err)
})
