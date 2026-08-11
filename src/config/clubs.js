/**
 * Plantillas de club (multitenant).
 * UDL es el club por defecto mientras avanzamos con ese cliente.
 */
export const CLUB_PRESETS = {
  udl: {
    id: 'udl',
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

const DEFAULT_CLUB_ID = import.meta.env.VITE_CLUB_ID || 'udl'

export function getClubPreset(clubId = DEFAULT_CLUB_ID) {
  return CLUB_PRESETS[clubId] || CLUB_PRESETS.udl
}

export function getDefaultClubId() {
  return DEFAULT_CLUB_ID
}
