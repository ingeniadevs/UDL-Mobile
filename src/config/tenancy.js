import { getClubPreset } from '@/config/clubs'

export const TENANT_HEADER = 'X-Tenant-Id'
export const TENANT_STORAGE_KEY = 'ingenia_tenant'

export function normalizeClub(raw) {
  if (!raw) return null
  const id = raw.id || raw.slug
  const slug = raw.slug || raw.id
  const preset = getClubPreset(id) || getClubPreset(slug) || {}
  return {
    id,
    slug,
    name: raw.name || preset.name || slug,
    shortName: raw.shortName || preset.shortName || (raw.name || slug || '').slice(0, 4).toUpperCase(),
    logo: raw.logoUrl || raw.logo || preset.logo || '/images/logo-udl.png',
    logoAlt: raw.shortName || raw.name || preset.logoAlt || slug,
    primaryColor: raw.primaryColor || preset.primaryColor || '#dc2626',
    primaryDark: raw.primaryDark || preset.primaryDark || '#991b1b',
    tagline: raw.tagline || preset.welcomeText || '',
    rol: raw.rol || null
  }
}

export function normalizeClubsFromLogin(data) {
  if (Array.isArray(data?.clubs) && data.clubs.length) {
    return data.clubs.map(normalizeClub).filter(Boolean)
  }
  if (data?.club) {
    const club = normalizeClub(data.club)
    return club ? [club] : []
  }
  return []
}
