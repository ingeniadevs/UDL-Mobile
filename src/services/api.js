import axios from 'axios'
import { getToken, clearAuthStorage } from '@/platform/storage'

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
  '/auth/resetear-password'
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
      await clearAuthStorage()
      const { useAuthStore } = await import('@/stores/auth')
      const authStore = useAuthStore()
      authStore.clearSession()
      const { default: router } = await import('@/router')
      if (router.currentRoute.value.path !== '/login') {
        router.push('/login')
      }
    }
    return Promise.reject(error)
  }
)

export default api
