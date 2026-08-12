import { createRouter, createWebHistory } from 'vue-router'
import { Capacitor } from '@capacitor/core'
import { useAuthStore } from '@/stores/auth'
import { isBiometricEnabled } from '@/platform/biometric'
import {
  homeRouteForRole,
  isAdminPanelRole,
  isSocioRole
} from '@/utils/authRoles'

const enableAdmin = import.meta.env.VITE_ENABLE_ADMIN === 'true'

const routes = [
  {
    path: '/',
    redirect: '/login'
  },
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/auth/LoginView.vue'),
    meta: { public: true }
  },
  {
    path: '/reset-password',
    name: 'ResetPassword',
    component: () => import('@/views/auth/ResetPasswordView.vue'),
    meta: { public: true }
  },
  {
    path: '/admin/login',
    redirect: '/login'
  },
  ...(enableAdmin
    ? [
        {
          path: '/admin',
          component: () => import('@/layouts/AdminLayout.vue'),
          meta: { requiresAuth: true, role: 'admin' },
          children: [
            { path: '', redirect: '/admin/inicio' },
            {
              path: 'inicio',
              name: 'AdminInicio',
              component: () => import('@/views/admin/InicioView.vue')
            },
            {
              path: 'dashboard',
              name: 'AdminDashboard',
              component: () => import('@/views/admin/DashboardView.vue')
            },
            {
              path: 'socios',
              name: 'Socios',
              component: () => import('@/views/admin/SociosView.vue')
            },
            {
              path: 'socios/:id',
              name: 'SocioDetail',
              component: () => import('@/views/admin/SocioDetailView.vue')
            },
            {
              path: 'disciplinas',
              name: 'Disciplinas',
              component: () => import('@/views/admin/DisciplinasView.vue')
            },
            {
              path: 'pagos',
              name: 'Pagos',
              component: () => import('@/views/admin/PagosView.vue')
            },
            {
              path: 'productos',
              name: 'Productos',
              component: () => import('@/views/admin/ProductosView.vue')
            },
            {
              path: 'pedidos',
              name: 'Pedidos',
              component: () => import('@/views/admin/PedidosView.vue')
            },
            {
              path: 'notificaciones',
              name: 'Notificaciones',
              component: () => import('@/views/admin/NotificacionesView.vue')
            },
            {
              path: 'empleados',
              name: 'Empleados',
              component: () => import('@/views/admin/EmpleadosView.vue')
            },
            {
              path: 'espacios',
              name: 'Espacios',
              component: () => import('@/views/admin/EspaciosView.vue')
            },
            {
              path: 'reservas',
              name: 'Reservas',
              component: () => import('@/views/admin/ReservasView.vue')
            },
            {
              path: 'movimientos',
              name: 'Movimientos',
              component: () => import('@/views/admin/MovimientosView.vue')
            },
            {
              path: 'contabilidad-disciplinas',
              name: 'DisciplinaContabilidad',
              component: () => import('@/views/admin/DisciplinaContabilidadView.vue')
            },
            {
              path: 'eventos',
              name: 'Eventos',
              component: () => import('@/views/admin/EventosView.vue')
            },
            {
              path: 'planes-membresia',
              name: 'PlanesMembresia',
              component: () => import('@/views/admin/PlanesMembresia.vue')
            },
            {
              path: 'inventario',
              name: 'Inventario',
              component: () => import('@/views/admin/InventarioView.vue')
            },
            {
              path: 'administradores',
              name: 'Administradores',
              component: () => import('@/views/admin/AdministradoresView.vue'),
              meta: { requiresAuth: true, role: 'master' }
            }
          ]
        }
      ]
    : []),
  {
    path: '/socio',
    component: () => import('@/layouts/SocioLayout.vue'),
    meta: { requiresAuth: true, role: 'socio' },
    children: [
      { path: '', redirect: '/socio/inicio' },
      {
        path: 'inicio',
        name: 'SocioInicio',
        component: () => import('@/views/socio/InicioView.vue')
      },
      {
        path: 'dashboard',
        name: 'SocioDashboard',
        component: () => import('@/views/socio/DashboardView.vue')
      },
      {
        path: 'pagos',
        name: 'MisPagos',
        component: () => import('@/views/socio/MisPagosView.vue')
      },
      {
        path: 'perfil',
        name: 'MiPerfil',
        component: () => import('@/views/socio/PerfilView.vue')
      },
      {
        path: 'mi-plan',
        name: 'MiPlan',
        component: () => import('@/views/socio/MiPlanView.vue')
      },
      {
        path: 'tienda',
        name: 'Tienda',
        component: () => import('@/views/socio/TiendaView.vue')
      },
      {
        path: 'pedidos',
        name: 'MisPedidos',
        component: () => import('@/views/socio/MisPedidosView.vue')
      },
      {
        path: 'disciplinas',
        name: 'MisDisciplinas',
        component: () => import('@/views/socio/DisciplinasView.vue')
      },
      {
        path: 'reservas',
        name: 'MisReservas',
        component: () => import('@/views/socio/ReservasView.vue')
      },
      {
        path: 'carnet',
        name: 'CarnetDigital',
        component: () => import('@/views/socio/CarnetDigitalView.vue')
      }
    ]
  },
  {
    path: '/verificar/:id',
    name: 'VerificarSocio',
    component: () => import('@/views/public/VerificarSocioView.vue'),
    meta: { public: true }
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: () => import('@/views/auth/NotFoundView.vue')
  }
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes
})

router.beforeEach(async (to, from, next) => {
  const authStore = useAuthStore()
  if (!authStore.hydrated) {
    await authStore.hydrate()
  }

  if (!enableAdmin && to.path.startsWith('/admin')) {
    next('/socio/inicio')
    return
  }

  if (authStore.isAuthenticated && !authStore.hasValidSession()) {
    await authStore.logout()
    if (to.meta.public) {
      next()
    } else {
      next('/login')
    }
    return
  }

  if (to.meta.public && to.name === 'Login' && authStore.hasValidSession()) {
    const needsBiometric =
      Capacitor.isNativePlatform() &&
      !authStore.sessionUnlocked &&
      (await isBiometricEnabled())
    if (needsBiometric) {
      next()
      return
    }
    const home = homeRouteForRole(authStore.user.rol)
    if (home.startsWith('/admin') && !enableAdmin) {
      next('/socio/inicio')
    } else {
      next(home)
    }
    return
  }

  if (to.name === 'AdminDashboard') {
    const isMaster = authStore.user?.rol === 'master'
    const hasDashboard = authStore.hasPermiso?.('dashboard')
    if (!isMaster && !hasDashboard) {
      next('/admin/inicio')
      return
    }
  }

  if (to.meta.requiresAuth && !authStore.hasValidSession()) {
    next('/login')
  } else if (
    to.meta.requiresAuth &&
    authStore.hasValidSession() &&
    Capacitor.isNativePlatform() &&
    !authStore.sessionUnlocked &&
    (await isBiometricEnabled())
  ) {
    next('/login')
  } else if (to.meta.role) {
    const userRole = authStore.user?.rol
    const hasAccess =
      userRole === to.meta.role ||
      (to.meta.role === 'admin' && isAdminPanelRole(userRole)) ||
      (to.meta.role === 'master' && userRole === 'master')

    if (!hasAccess) {
      if (isAdminPanelRole(userRole)) {
        next(enableAdmin ? '/admin/inicio' : '/login')
      } else if (isSocioRole(userRole)) next('/socio/inicio')
      else next('/login')
    } else {
      next()
    }
  } else {
    next()
  }
})

export default router
