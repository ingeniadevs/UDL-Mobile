import { Capacitor } from '@capacitor/core'
import { BiometricAuth } from '@aparajita/capacitor-biometric-auth'
import { getPreference, setPreference } from './storage'

const BIOMETRIC_ENABLED_KEY = 'udl_biometric_enabled'
const BIOMETRIC_USER_KEY = 'udl_biometric_user'

/**
 * Importante: no guardar/await/truthy-check el proxy de Capacitor.
 * El proxy es Thenable (trampa en `.then`) y genera:
 * "BiometricAuthNative.then() is not implemented on android".
 * Llamar métodos del plugin solo en plataforma nativa.
 */

export async function isBiometricAvailable() {
  if (!Capacitor.isNativePlatform()) {
    return { available: false, biometryType: null }
  }

  try {
    const result = await BiometricAuth.checkBiometry()
    return {
      available: !!result.isAvailable,
      biometryType: result.biometryType || null
    }
  } catch (err) {
    console.warn('[Biometric] checkBiometry failed', err?.message || err)
    return { available: false, biometryType: null }
  }
}

export function getBiometricLabel(biometryType) {
  const t = String(biometryType ?? '').toLowerCase()
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
  if (!Capacitor.isNativePlatform()) {
    return { success: false, error: 'no_plugin' }
  }

  try {
    const { available } = await isBiometricAvailable()
    if (!available) return { success: false, error: 'unavailable' }

    await BiometricAuth.authenticate({
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
