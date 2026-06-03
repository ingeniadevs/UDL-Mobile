import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { authService } from '@/services'
import {
  getToken,
  setToken,
  getUserJson,
  setUserJson,
  clearAuthStorage
} from '@/platform/storage'

function parseUser(raw) {
  if (!raw) return null
  try {
    const u = JSON.parse(raw)
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

export const useAuthStore = defineStore('auth', () => {
  const user = ref(null)
  const token = ref(null)
  const hydrated = ref(false)

  const isAuthenticated = computed(() => !!token.value)
  const isAdmin = computed(
    () => user.value?.rol === 'admin' || user.value?.rol === 'master'
  )
  const isMaster = computed(() => user.value?.rol === 'master')
  const isSocio = computed(() => user.value?.rol === 'socio')

  function hasPermiso(seccion) {
    if (!user.value) return false
    if (user.value.rol === 'master') return true
    const permisos = user.value.permisos || []
    return permisos.includes(seccion)
  }

  async function hydrate() {
    const storedToken = await getToken()
    const storedUser = parseUser(await getUserJson())

    if (!storedToken || !storedUser || isTokenExpired(storedToken)) {
      await clearAuthStorage()
      token.value = null
      user.value = null
    } else {
      token.value = storedToken
      user.value = storedUser
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
  }

  async function logout() {
    clearSession()
    await clearAuthStorage()
  }

  function clearSession() {
    token.value = null
    user.value = null
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
    isAuthenticated,
    isAdmin,
    isMaster,
    isSocio,
    hasPermiso,
    hydrate,
    login,
    loginAdmin,
    loginSocio,
    updateFoto,
    logout,
    clearSession
  }
})
