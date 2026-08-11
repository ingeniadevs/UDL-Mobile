import { createRouter, createWebHistory } from 'vue-router'
import { Capacitor } from '@capacitor/core'
import { useAuthStore } from '@/stores/auth'
import { isBiometricEnabled } from '@/platform/biometric'

const enableAdmin = import.meta.env.VITE_ENABLE_ADMIN === 'true'

const routes = [
  {
    path: '/',
    redirect: '/login'
  },
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/auth/LoginView.vue')
  },
  {
    path: '/reset-password',
    name: 'ResetPassword',
    component: () => import('@/views/auth/ResetPasswordView.vue')
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

  if (to.name === 'Login' && authStore.isAuthenticated) {
    const needsBiometric =
      Capacitor.isNativePlatform() &&
      !authStore.sessionUnlocked &&
      (await isBiometricEnabled())
    if (needsBiometric) {
      next()
      return
    }
    if (authStore.user?.rol === 'admin' || authStore.user?.rol === 'master') {
      next(enableAdmin ? '/admin/inicio' : '/socio/inicio')
    } else {
      next('/socio/inicio')
    }
    return
  }

  if (to.name === 'AdminDashboard') {
    const isMaster = authStore.user?.rol === 'master'
    const hasAnyPermiso = isMaster || (authStore.user?.permisos?.length > 0)
    if (!hasAnyPermiso) {
      next('/admin/inicio')
      return
    }
  }

  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    next('/login')
  } else if (
    to.meta.requiresAuth &&
    authStore.isAuthenticated &&
    Capacitor.isNativePlatform() &&
    !authStore.sessionUnlocked &&
    (await isBiometricEnabled())
  ) {
    next('/login')
  } else if (to.meta.role) {
    const userRole = authStore.user?.rol
    const hasAccess =
      userRole === to.meta.role ||
      (to.meta.role === 'admin' && userRole === 'master')
    if (!hasAccess) {
      if (userRole === 'admin' || userRole === 'master') {
        next(enableAdmin ? '/admin/inicio' : '/login')
      } else if (userRole === 'socio') next('/socio/inicio')
      else next('/login')
    } else {
      next()
    }
  } else {
    next()
  }
})

export default router
