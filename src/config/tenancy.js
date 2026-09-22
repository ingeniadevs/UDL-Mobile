import { getClubPreset } from '@/config/clubs'

export const TENANT_HEADER = 'X-Tenant-Id'
export const TENANT_STORAGE_KEY = 'ingenia_tenant'

/** Logo cuando el club no tiene icono (public/images/default.png). */
export const DEFAULT_CLUB_LOGO = '/images/default.png'

/** Fallback de marca cuando el club no trae color (community / sin API). */
export const DEFAULT_CLUB_PRIMARY = '#64748b'
export const DEFAULT_CLUB_PRIMARY_DARK = '#475569'

export function normalizeClub(raw) {
  if (!raw) return null
  const id = raw.id || raw.slug
  const slug = raw.slug || raw.id
  const preset = getClubPreset(id) || getClubPreset(slug) || {}
  const logo = (raw.logoUrl || raw.logo || preset.logo || '').trim()
  return {
    id,
    slug,
    name: raw.name || preset.name || slug,
    shortName: raw.shortName || preset.shortName || (raw.name || slug || '').slice(0, 4).toUpperCase(),
    logo: logo || DEFAULT_CLUB_LOGO,
    logoAlt: raw.shortName || raw.name || preset.logoAlt || slug,
    primaryColor: raw.primaryColor || preset.primaryColor || DEFAULT_CLUB_PRIMARY,
    primaryDark: raw.primaryDark || preset.primaryDark || DEFAULT_CLUB_PRIMARY_DARK,
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
