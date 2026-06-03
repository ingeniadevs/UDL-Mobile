/**
 * Resuelve URLs de assets del backend (/uploads) cuando la API es remota (Railway).
 */
export function getApiOrigin() {
  const apiUrl = (import.meta.env.VITE_API_URL || '').trim()
  if (!apiUrl) return ''
  return apiUrl.replace(/\/api\/?$/i, '')
}

export function resolveAssetUrl(path) {
  if (!path) return ''
  if (path.startsWith('http://') || path.startsWith('https://')) return path
  if (path.startsWith('data:') || path.startsWith('blob:')) return path

  const origin = getApiOrigin()
  if (path.startsWith('/')) {
    return origin ? `${origin}${path}` : path
  }
  return path
}
