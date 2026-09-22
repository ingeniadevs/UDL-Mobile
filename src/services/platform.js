import axios from 'axios'
import { PLATFORM_TOKEN_KEY } from '@/config/tenancy'

const baseURL = import.meta.env.VITE_API_URL || '/api'

const platformApi = axios.create({
  baseURL,
  headers: { 'Content-Type': 'application/json' }
})

platformApi.interceptors.request.use((config) => {
  const token = localStorage.getItem(PLATFORM_TOKEN_KEY)
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

platformApi.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem(PLATFORM_TOKEN_KEY)
      localStorage.removeItem('platform_user')
      if (window.location.pathname !== '/platform/login') {
        window.location.assign('/platform/login')
      }
    }
    return Promise.reject(error)
  }
)

export const platformAuthService = {
  async login(email, password) {
    const { data } = await platformApi.post('/platform/auth/login', { email, password })
    return data
  }
}

export const platformService = {
  async listClubs() {
    const { data } = await platformApi.get('/platform/clubs')
    return data
  },
  async createClub(payload) {
    const { data } = await platformApi.post('/platform/clubs', payload)
    return data
  },
  async updateClub(clubId, payload) {
    await platformApi.put(`/platform/clubs/${clubId}`, payload)
  },
  async listDomains() {
    const { data } = await platformApi.get('/platform/domains')
    return data
  },
  async createDomain(payload) {
    const { data } = await platformApi.post('/platform/domains', payload)
    return data
  },
  async updateDomain(domainId, payload) {
    await platformApi.put(`/platform/domains/${domainId}`, payload)
  },
  async deleteDomain(domainId) {
    await platformApi.delete(`/platform/domains/${domainId}`)
  },
  async getSettings(clubId) {
    const { data } = await platformApi.get(`/platform/settings/${clubId}`)
    return data
  },
  async upsertSettings(clubId, payload) {
    await platformApi.put(`/platform/settings/${clubId}`, payload)
  },
  async listSecrets(clubId) {
    const { data } = await platformApi.get(`/platform/secrets/${clubId}`)
    return data
  },
  async upsertSecrets(clubId, secrets) {
    await platformApi.put(`/platform/secrets/${clubId}`, { secrets })
  },
  async listAudit(take = 50) {
    const { data } = await platformApi.get('/platform/audit', { params: { take } })
    return data
  }
}

export default platformApi
