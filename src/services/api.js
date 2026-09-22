import axios from 'axios'
import { getToken } from '@/platform/storage'
import { TENANT_HEADER } from '@/config/tenancy'

const baseURL = import.meta.env.VITE_API_URL || '/api'

const api = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json'
  },
  timeout: 60000
})

const PUBLIC_ROUTES = [
  '/auth/login',
  '/auth/registro',
  '/auth/solicitar-recuperacion',
  '/auth/resetear-password',
  '/clubs',
  '/club/branding',
  '/clubs/branding',
  '/clubs/settings'
]

api.interceptors.request.use(
  async (config) => {
    const isPublic = PUBLIC_ROUTES.some((route) => config.url?.includes(route))
    if (!isPublic) {
      const token = await getToken()
      if (token) {
        config.headers.Authorization = `Bearer ${token}`
      }
    }

    try {
      const { useTenantStore } = await import('@/stores/tenant')
      const tenantId = useTenantStore().clubId
      if (tenantId) {
        config.headers[TENANT_HEADER] = tenantId
      }
    } catch {
      /* pinia aún no listo */
    }

    return config
  },
  (error) => Promise.reject(error)
)

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const isPublic = PUBLIC_ROUTES.some((route) =>
      error.config?.url?.includes(route)
    )
    if (error.response?.status === 401 && !isPublic) {
      const { useAuthStore } = await import('@/stores/auth')
      const authStore = useAuthStore()
      await authStore.logout()
      const { default: router } = await import('@/router')
      if (router.currentRoute.value.path !== '/login') {
        router.push('/login')
      }
    }
    return Promise.reject(error)
  }
)

export default api
