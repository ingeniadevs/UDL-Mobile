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

function blockSwipeNavigation() {
  document.documentElement.style.overscrollBehavior = 'none'
  document.body.style.overscrollBehavior = 'none'

  let touchStartX = 0
  let touchStartY = 0

  document.addEventListener(
    'touchstart',
    (e) => {
      touchStartX = e.touches[0].clientX
      touchStartY = e.touches[0].clientY
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

      const fromLeftEdge = touchStartX < 24
      const fromRightEdge = touchStartX > window.innerWidth - 24

      if ((fromLeftEdge && dx > 10) || (fromRightEdge && dx < -10)) {
        e.preventDefault()
      }
    },
    { passive: false }
  )
}

export function initNavigationGuards(router) {
  blockSwipeNavigation()

  if (!Capacitor.isNativePlatform()) return

  App.addListener('backButton', ({ canGoBack }) => {
    if (dialogCloseHandler?.()) return
    if (sidebarCloseHandler?.()) return

    if (canGoBack && window.history.length > 1) {
      router.back()
    } else {
      App.minimizeApp()
    }
  })
}
