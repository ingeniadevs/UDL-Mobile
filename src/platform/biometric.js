import { Capacitor } from '@capacitor/core'
import { getPreference, setPreference } from './storage'

const BIOMETRIC_ENABLED_KEY = 'udl_biometric_enabled'
const BIOMETRIC_USER_KEY = 'udl_biometric_user'

let NativeBiometric = null

async function loadPlugin() {
  if (!Capacitor.isNativePlatform() || NativeBiometric !== null) return NativeBiometric
  try {
    const mod = await import('@aparajita/capacitor-biometric-auth')
    NativeBiometric = mod.BiometricAuth
  } catch {
    NativeBiometric = false
  }
  return NativeBiometric
}

export async function isBiometricAvailable() {
  const plugin = await loadPlugin()
  if (!plugin) return { available: false, biometryType: null }

  try {
    const result = await plugin.checkBiometry()
    return {
      available: result.isAvailable,
      biometryType: result.biometryType || null
    }
  } catch {
    return { available: false, biometryType: null }
  }
}

export function getBiometricLabel(biometryType) {
  const t = (biometryType || '').toLowerCase()
  if (t.includes('face')) return 'Face ID'
  if (t.includes('touch') || t.includes('finger')) return 'Huella digital'
  if (t.includes('iris')) return 'Iris'
  return 'Biometría'
}

export async function isBiometricEnabled() {
  return (await getPreference(BIOMETRIC_ENABLED_KEY, false)) === true
}

export async function getBiometricUserId() {
  return await getPreference(BIOMETRIC_USER_KEY, null)
}

export async function enableBiometric(userId) {
  await setPreference(BIOMETRIC_ENABLED_KEY, true)
  if (userId) await setPreference(BIOMETRIC_USER_KEY, userId)
}

export async function disableBiometric() {
  await setPreference(BIOMETRIC_ENABLED_KEY, false)
  await setPreference(BIOMETRIC_USER_KEY, null)
}

export async function authenticateWithBiometric(reason) {
  const plugin = await loadPlugin()
  if (!plugin) return { success: false, error: 'no_plugin' }

  try {
    await plugin.authenticate({
      reason: reason || 'Desbloqueá la app para continuar',
      cancelTitle: 'Cancelar',
      allowDeviceCredential: true
    })
    return { success: true }
  } catch (err) {
    return {
      success: false,
      error: err?.message || 'auth_failed'
    }
  }
}
