import { Capacitor } from '@capacitor/core'
import { App } from '@capacitor/app'

let sidebarCloseHandler = null
let dialogCloseHandler = null

export function setSidebarCloseHandler(handler) {
  sidebarCloseHandler = handler
}

export function setDialogCloseHandler(handler) {
  dialogCloseHandler = handler
}

function homePathForRoute(path) {
  if (path.startsWith('/admin')) return '/admin/inicio'
  if (path.startsWith('/socio')) return '/socio/inicio'
  return '/login'
}

function navigateHomeOrMinimize(router) {
  const path = router.currentRoute.value?.path || ''
  const home = homePathForRoute(path)
  if (path === home || path === '/login') {
    if (Capacitor.isNativePlatform()) App.minimizeApp()
    return
  }
  router.replace(home)
}

function setupEdgeSwipeHome(router) {
  document.documentElement.style.overscrollBehavior = 'none'
  document.body.style.overscrollBehavior = 'none'

  let touchStartX = 0
  let touchStartY = 0
  let fromLeftEdge = false

  document.addEventListener(
    'touchstart',
    (e) => {
      touchStartX = e.touches[0].clientX
      touchStartY = e.touches[0].clientY
      fromLeftEdge = touchStartX < 28
    },
    { passive: true }
  )

  document.addEventListener(
    'touchmove',
    (e) => {
      const touch = e.touches[0]
      const dx = touch.clientX - touchStartX
      const dy = touch.clientY - touchStartY
      if (Math.abs(dx) < Math.abs(dy)) return

      const fromRightEdge = touchStartX > window.innerWidth - 24
      // Evita gesto nativo del sistema; el back lo manejamos nosotros
      if ((fromLeftEdge && dx > 10) || (fromRightEdge && dx < -10)) {
        e.preventDefault()
      }
    },
    { passive: false }
  )

  document.addEventListener(
    'touchend',
    (e) => {
      if (!fromLeftEdge) return
      fromLeftEdge = false
      const touch = e.changedTouches[0]
      const dx = touch.clientX - touchStartX
      const dy = touch.clientY - touchStartY
      if (dx > 70 && Math.abs(dy) < 55) {
        if (dialogCloseHandler?.()) return
        if (sidebarCloseHandler?.()) return
        navigateHomeOrMinimize(router)
      }
    },
    { passive: true }
  )
}

export function initNavigationGuards(router) {
  setupEdgeSwipeHome(router)

  if (!Capacitor.isNativePlatform()) return

  App.addListener('backButton', () => {
    if (dialogCloseHandler?.()) return
    if (sidebarCloseHandler?.()) return
    navigateHomeOrMinimize(router)
  })
}
