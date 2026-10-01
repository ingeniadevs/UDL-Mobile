import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { Capacitor } from '@capacitor/core'
import { authService } from '@/services'
import {
  getToken,
  setToken,
  getUserJson,
  setUserJson,
  clearAuthStorage
} from '@/platform/storage'
import { isBiometricEnabled, authenticateWithBiometric } from '@/platform/biometric'
import { isValidRole } from '@/utils/authRoles'
import { getClubIdFromToken, clubIdsMatch } from '@/utils/jwt'

function parseUser(raw) {
  if (!raw) return null
  try {
    const u = JSON.parse(raw)
    if (!isValidRole(u.rol)) return null
    if (!Array.isArray(u.permisos)) return null
    return u
  } catch {
    return null
  }
}

function isTokenExpired(token) {
  if (!token) return true
  try {
    const payload = JSON.parse(atob(token.split('.')[1]))
    return payload.exp && payload.exp * 1000 < Date.now()
  } catch {
    return true
  }
}

function tokenAlreadyBoundToClub(token, club) {
  if (!club) return false
  const tokenClub = getClubIdFromToken(token)
  if (!tokenClub) return false
  return clubIdsMatch(tokenClub, club.id, club.slug)
}

export const useAuthStore = defineStore('auth', () => {
  const user = ref(null)
  const token = ref(null)
  const hydrated = ref(false)
  const sessionUnlocked = ref(true)

  const isAuthenticated = computed(() => !!token.value)
  const isAdmin = computed(
    () => user.value?.rol === 'admin' || user.value?.rol === 'master'
  )
  const isMaster = computed(() => user.value?.rol === 'master')
  const isSocio = computed(() => user.value?.rol === 'socio')
  const hasSubcomision = computed(() => !!user.value?.subcomisionId)

  function hasPermiso(seccion) {
    if (!user.value) return false
    if (user.value.rol === 'master') return true
    const permisos = user.value.permisos || []
    return permisos.includes(seccion)
  }

  function hasValidSession() {
    return !!token.value && !!user.value && isValidRole(user.value.rol)
  }

  async function hydrate() {
    const storedToken = await getToken()
    const storedUser = parseUser(await getUserJson())

    if (!storedToken || !storedUser || isTokenExpired(storedToken)) {
      await clearAuthStorage()
      token.value = null
      user.value = null
      try {
        const { useTenantStore } = await import('@/stores/tenant')
        useTenantStore().endSession()
      } catch {
        /* pinia */
      }
    } else {
      token.value = storedToken
      user.value = storedUser
      if (Capacitor.isNativePlatform() && (await isBiometricEnabled())) {
        sessionUnlocked.value = false
      }
    }
    hydrated.value = true
  }

  async function login(identificador, password) {
    const response = await authService.login(identificador, password)
    await setAuth(response)
    return response
  }

  async function loginAdmin(email, password) {
    const response = await authService.loginAdmin(email, password)
    await setAuth(response)
    return response
  }

  async function loginSocio(email, password) {
    const response = await authService.loginSocio(email, password)
    await setAuth(response)
    return response
  }

  async function setAuth(data) {
    token.value = data.token
    user.value = {
      id: data.id,
      nombre: data.nombre,
      email: data.email,
      rol: data.rol,
      foto: data.foto || null,
      deporte: data.deporte || null,
      subcomisionId: data.subcomisionId || null,
      subcomisionNombre: data.subcomisionNombre || null,
      permisos: (() => {
        try {
          return JSON.parse(data.permisos || '[]')
        } catch {
          return []
        }
      })()
    }
    await setToken(data.token)
    await setUserJson(JSON.stringify(user.value))
    sessionUnlocked.value = true
  }

  async function applyClubSession(data) {
    await setAuth(data)
    return data
  }

  /**
   * Asegura tenantStore + JWT club_id alineados antes del portal.
   * Reemite token vía POST /auth/select-club si hace falta.
   */
  async function bindClubSession(club) {
    if (!club?.id && !club?.slug) {
      const err = new Error('No hay club para vincular la sesión')
      err.code = 'CLUB_REQUIRED'
      throw err
    }

    const { useTenantStore } = await import('@/stores/tenant')
    const tenantStore = useTenantStore()
    const selected = await tenantStore.selectClub(club)
    const clubKey = selected.id || selected.slug

    if (tokenAlreadyBoundToClub(token.value, selected)) {
      return { club: selected, rebound: false }
    }

    try {
      const data = await authService.selectClub(clubKey)
      await applyClubSession(data)
      return { club: selected, rebound: true, data }
    } catch (error) {
      const message =
        error.response?.data?.message ||
        'No se pudo vincular tu usuario a este club. Verificá que tengas membresía activa.'
      const err = new Error(message)
      err.code = 'CLUB_BIND_FAILED'
      err.cause = error
      throw err
    }
  }

  async function logout() {
    clearSession()
    await clearAuthStorage()
    try {
      const { useTenantStore } = await import('@/stores/tenant')
      useTenantStore().endSession()
    } catch {
      /* pinia */
    }
  }

  function clearSession() {
    token.value = null
    user.value = null
    sessionUnlocked.value = true
  }

  async function unlockWithBiometric() {
    const result = await authenticateWithBiometric()
    if (result.success) {
      sessionUnlocked.value = true
    }
    return result.success
  }

  function lockSession() {
    if (Capacitor.isNativePlatform()) {
      sessionUnlocked.value = false
    }
  }

  async function updateFoto(foto) {
    if (user.value) {
      user.value.foto = foto || null
      await setUserJson(JSON.stringify(user.value))
    }
  }

  return {
    user,
    token,
    hydrated,
    sessionUnlocked,
    isAuthenticated,
    isAdmin,
    isMaster,
    isSocio,
    hasSubcomision,
    hasPermiso,
    hasValidSession,
    hydrate,
    login,
    loginAdmin,
    loginSocio,
    applyClubSession,
    bindClubSession,
    updateFoto,
    logout,
    clearSession,
    unlockWithBiometric,
    lockSession
  }
})
