export const ADMIN_PANEL_ROLES = ['master', 'admin', 'moderador']
export const SOCIO_ROLES = ['socio']

export function isValidRole(rol) {
  return ADMIN_PANEL_ROLES.includes(rol) || SOCIO_ROLES.includes(rol)
}

export function isAdminPanelRole(rol) {
  return ADMIN_PANEL_ROLES.includes(rol)
}

export function isSocioRole(rol) {
  return SOCIO_ROLES.includes(rol)
}

export function homeRouteForRole(rol) {
  if (isAdminPanelRole(rol)) return '/admin/inicio'
  if (isSocioRole(rol)) return '/socio/inicio'
  return '/login'
}
