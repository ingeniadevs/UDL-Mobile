import { getPreference, setPreference } from '@/platform/storage'

/**
 * Sustituto de localStorage para datos no sensibles (carrito, banners, tema).
 */
export function useAppStorage(key, defaultValue = null) {
  async function load() {
    return getPreference(key, defaultValue)
  }

  async function save(value) {
    await setPreference(key, value)
  }

  return { load, save }
}
