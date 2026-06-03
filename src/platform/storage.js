import { Preferences } from '@capacitor/preferences'
import { Capacitor } from '@capacitor/core'
import { SecureStoragePlugin } from 'capacitor-secure-storage-plugin'

const TOKEN_KEY = 'udl_auth_token'
const USER_KEY = 'udl_auth_user'

const isNative = () => Capacitor.isNativePlatform()

async function secureGet(key) {
  try {
    const { value } = await SecureStoragePlugin.get({ key })
    return value ?? null
  } catch {
    return null
  }
}

async function secureSet(key, value) {
  if (value == null || value === '') {
    try {
      await SecureStoragePlugin.remove({ key })
    } catch {
      /* key inexistente */
    }
    return
  }
  await SecureStoragePlugin.set({ key, value })
}

async function prefGet(key) {
  const { value } = await Preferences.get({ key })
  return value ?? null
}

async function prefSet(key, value) {
  if (value == null) {
    await Preferences.remove({ key })
    return
  }
  await Preferences.set({ key, value })
}

/** JWT: almacenamiento seguro en iOS Keychain / Android Keystore */
export async function getToken() {
  if (isNative()) return secureGet(TOKEN_KEY)
  return localStorage.getItem('token')
}

export async function setToken(token) {
  if (isNative()) return secureSet(TOKEN_KEY, token)
  if (token) localStorage.setItem('token', token)
  else localStorage.removeItem('token')
}

/** Perfil de usuario (sin contraseña): Preferences en nativo, localStorage en web */
export async function getUserJson() {
  if (isNative()) return prefGet(USER_KEY)
  return localStorage.getItem('user')
}

export async function setUserJson(json) {
  if (isNative()) return prefSet(USER_KEY, json)
  if (json) localStorage.setItem('user', json)
  else localStorage.removeItem('user')
}

export async function clearAuthStorage() {
  await setToken(null)
  await setUserJson(null)
  if (!isNative()) {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
  }
}

/** Preferencias no sensibles (carrito, tema, banners vistos) */
export async function getPreference(key, fallback = null) {
  const raw = await prefGet(key)
  if (raw == null) return fallback
  try {
    return JSON.parse(raw)
  } catch {
    return raw
  }
}

export async function setPreference(key, value) {
  const serialized =
    typeof value === 'string' ? value : JSON.stringify(value)
  await prefSet(key, serialized)
}
