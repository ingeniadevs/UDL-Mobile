/**
 * Plantillas de club (multitenant).
 * En la app compartida Ingenia Club no hay club por defecto:
 * el tenant se resuelve después del login comunitario.
 * VITE_CLUB_ID fuerza un build white-label (un solo club).
 */
export const CLUB_PRESETS = {
  udl: {
    id: 'udl',
    slug: 'udl',
    name: 'Unión Deportiva Laspiur',
    shortName: 'UDL',
    portalTitle: 'Mi Portal',
    adminTitle: 'Panel de Administración',
    logo: '/images/logo-udl.png',
    logoAlt: 'UDL',
    primaryColor: '#dc2626',
    primaryDark: '#991b1b',
    appScheme: 'udlclub',
    welcomeText: 'Tu club deportivo'
  }
}

export function getWhiteLabelClubId() {
  const id = import.meta.env.VITE_CLUB_ID
  return id && String(id).trim() ? String(id).trim() : null
}

export function getClubPreset(clubId) {
  if (!clubId) return null
  return CLUB_PRESETS[clubId] || null
}

/** @deprecated Usar getWhiteLabelClubId(). Null = login comunitario. */
export function getDefaultClubId() {
  return getWhiteLabelClubId()
}
