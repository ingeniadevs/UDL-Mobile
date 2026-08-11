<template>
  <div class="min-h-screen flex flex-column layout-dark">    <!-- Top Bar -->
    <div class="topbar px-4 py-3 flex align-items-center justify-content-between">      <div class="flex align-items-center gap-3">
        <!-- Boton mobile: abre el drawer overlay -->
        <Button 
          icon="pi pi-bars" 
          text 
          rounded 
          @click="mobileSidebarVisible = true"
          class="lg:hidden btn-menu"
        />
        <!-- Boton desktop: toggle del sidebar estatico -->
        <Button 
          icon="pi pi-bars" 
          text 
          rounded 
          @click="desktopSidebarVisible = !desktopSidebarVisible"
          class="hidden lg:flex btn-menu"
        />
        <IngeniaClubIcon size="sm" class="topbar-app-icon" />
        <span class="text-xl font-semibold topbar-title">{{ app.name }}</span>
      </div>
        <div class="flex align-items-center gap-2">
        <Button 
          :icon="isDark ? 'pi pi-sun' : 'pi pi-moon'" 
          text 
          rounded 
          @click="toggleTheme"
          v-tooltip.bottom="isDark ? 'Modo claro' : 'Modo oscuro'"
          class="btn-menu"
        />
        <Button 
          icon="pi pi-sign-out" 
          text 
          rounded 
          severity="danger"
          @click="handleLogout"
          v-tooltip.bottom="'Cerrar sesión'"
          class="btn-logout"
        />
      </div>
    </div>    <!-- Mobile Sidebar (overlay animado, solo mobile) -->
    <Sidebar v-model:visible="mobileSidebarVisible" class="sidebar-dark w-18rem">
      <template #header>
        <div class="flex align-items-center gap-2">
          <img :src="branding.logo" :alt="branding.logoAlt" class="sidebar-logo" />
          <span class="font-bold text-xl sidebar-title">{{ branding.shortName }}</span>
        </div>
      </template>
      <div class="sidebar-user">
        <Avatar
          :image="authStore.user?.foto || undefined"
          :label="authStore.user?.foto ? undefined : avatarLabel"
          shape="circle"
          class="avatar-red"
          size="large"
        />
        <div class="sidebar-user__info">
          <div class="sidebar-user__name">{{ authStore.user?.nombre }}</div>
          <div class="sidebar-user__email">{{ authStore.user?.email }}</div>
        </div>
      </div>
      <Menu :model="menuItems" class="w-full border-none menu-dark" />
    </Sidebar>

    <!-- Main Content with Desktop Sidebar -->
    <div class="flex flex-1">
      <!-- Desktop Sidebar -->
      <div
        class="hidden lg:flex flex-column sidebar-desktop"
        :class="{ 'sidebar-collapsed': !desktopSidebarVisible && !hoverExpanded }"
        @mouseenter="hoverExpanded = true"
        @mouseleave="hoverExpanded = false"
      >
        <div v-if="desktopSidebarVisible || hoverExpanded" class="sidebar-user px-3">
          <Avatar
            :image="authStore.user?.foto || undefined"
            :label="authStore.user?.foto ? undefined : avatarLabel"
            shape="circle"
            class="avatar-red"
          />
          <div class="sidebar-user__info">
            <div class="sidebar-user__name">{{ authStore.user?.nombre }}</div>
            <div class="sidebar-user__email">{{ authStore.user?.email }}</div>
          </div>
        </div>
        <template v-for="group in menuItems" :key="group.label">
          <div v-if="group.label && (desktopSidebarVisible || hoverExpanded)" class="nav-group-label">{{ group.label }}</div>
          <button
            v-for="item in group.items"
            :key="item.label"
            class="nav-item"
            @click="item.command()"
            v-tooltip.right="!desktopSidebarVisible && !hoverExpanded ? item.label : undefined"
          >
            <i :class="item.icon" class="nav-icon"></i>
            <span class="nav-label">{{ item.label }}</span>
          </button>
        </template>
      </div>

      <!-- Content -->
      <div class="flex-1 p-4 overflow-auto content-area">
        <router-view />
      </div>
    </div>
  </div>

  <!-- Ingenia Labs -->
  <div class="ingenia-promo">
    <span>Desarrollado por</span>
    <a href="https://ingenialabs.ar/" target="_blank" rel="noopener noreferrer" class="ingenia-link">
      <strong>Ingenia Labs</strong>
    </a>
    <span class="ingenia-sep">&bull;</span>
    <a href="https://www.instagram.com/ingenia.labs/" target="_blank" rel="noopener noreferrer" class="ingenia-ig">
      <i class="pi pi-instagram"></i>
      <span>@ingenia.labs</span>
    </a>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useTheme } from '@/composables/useTheme'
import { useClubBranding } from '@/composables/useClubBranding'
import { useAppBranding } from '@/composables/useAppBranding'
import IngeniaClubIcon from '@/components/brand/IngeniaClubIcon.vue'
import { setSidebarCloseHandler } from '@/platform/navigation'
import Sidebar from 'primevue/sidebar'
import Menu from 'primevue/menu'
import Button from 'primevue/button'
import Avatar from 'primevue/avatar'
import { Capacitor } from '@capacitor/core'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()
const { isDark, toggleTheme } = useTheme()
const { branding } = useClubBranding()
const { app } = useAppBranding()

const mobileSidebarVisible = ref(false)
const desktopSidebarVisible = ref(true)
const hoverExpanded = ref(false)

function handleResize() {
  desktopSidebarVisible.value = window.innerWidth >= 1280
}

onMounted(() => {
  setSidebarCloseHandler(() => {
    if (mobileSidebarVisible.value) {
      mobileSidebarVisible.value = false
      return true
    }
    return false
  })
  if (Capacitor.isNativePlatform()) {
    desktopSidebarVisible.value = false
  } else {
    handleResize()
    window.addEventListener('resize', handleResize)
  }
})

onUnmounted(() => {
  setSidebarCloseHandler(null)
  if (!Capacitor.isNativePlatform()) {
    window.removeEventListener('resize', handleResize)
  }
})

// Auto-colapsar al navegar
watch(() => route.path, () => {
  desktopSidebarVisible.value = false
})

const avatarLabel = computed(() => {
  return authStore.user?.nombre?.charAt(0).toUpperCase() || 'S'
})

const menuItems = ref([
  {
    label: 'Mi Espacio',
    items: [
      {
        label: 'Inicio',
        icon: 'pi pi-home',
        command: () => { router.push('/socio/inicio'); mobileSidebarVisible.value = false }
      },
      {
        label: 'Dashboard',
        icon: 'pi pi-chart-bar',
        command: () => { router.push('/socio/dashboard'); mobileSidebarVisible.value = false }
      },      {
        label: 'Mi Perfil',
        icon: 'pi pi-user',
        command: () => { router.push('/socio/perfil'); mobileSidebarVisible.value = false }
      },
      {
        label: 'Carnet Digital',
        icon: 'pi pi-id-card',
        command: () => { router.push('/socio/carnet'); mobileSidebarVisible.value = false }
      },
      {
        label: 'Mi Plan',
        icon: 'pi pi-bookmark',
        command: () => { router.push('/socio/mi-plan'); mobileSidebarVisible.value = false }
      },
      {
        label: 'Mis Pagos',
        icon: 'pi pi-dollar',
        command: () => { router.push('/socio/pagos'); mobileSidebarVisible.value = false }
      },{
        label: 'Tienda',
        icon: 'pi pi-shopping-cart',
        command: () => { router.push('/socio/tienda'); mobileSidebarVisible.value = false }
      },
      {
        label: 'Mis Pedidos',
        icon: 'pi pi-shopping-bag',
        command: () => { router.push('/socio/pedidos'); mobileSidebarVisible.value = false }
      },
      {
        label: 'Disciplinas',
        icon: 'pi pi-users',
        command: () => { router.push('/socio/disciplinas'); mobileSidebarVisible.value = false }
      },
      {
        label: 'Reservar Espacio',
        icon: 'pi pi-calendar-plus',
        command: () => { router.push('/socio/reservas'); mobileSidebarVisible.value = false }
      }
    ]
  }
])

function handleLogout() {
  authStore.logout()
  router.push('/login')
}
</script>

<style scoped>
.layout-dark {
  background: var(--surface-ground);
}

.topbar {
  background: var(--surface-card);
  border-bottom: 1px solid var(--surface-border);
}

.sidebar-desktop {
  background: var(--surface-card);
  border-right: 1px solid var(--surface-border);
  min-height: 100%;
  width: 220px;
  min-width: 220px;
  flex-shrink: 0;
  overflow: hidden;
  transition: width 0.25s cubic-bezier(0.4, 0, 0.2, 1),
              min-width 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  padding: 0.5rem 0;
  gap: 2px;
}

.sidebar-desktop.sidebar-collapsed {
  width: 56px;
  min-width: 56px;
}

.nav-group-label {
  font-size: 0.7rem;
  font-weight: 600;
  color: var(--text-color-secondary);
  opacity: 0.6;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  padding: 0.75rem 1rem 0.25rem;
  white-space: nowrap;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.65rem 1rem;
  margin: 2px 8px;
  border-radius: 8px;
  cursor: pointer;
  border: none;
  background: transparent;
  width: calc(100% - 16px);
  color: var(--text-color-secondary);
  transition: background 0.18s, color 0.18s;
  text-align: left;
  white-space: nowrap;
}

.nav-item:hover {
  background: rgba(220, 38, 38, 0.1);
  color: #dc2626;
}

.nav-icon {
  color: #dc2626;
  font-size: 1rem;
  flex-shrink: 0;
  width: 1rem;
}

.nav-label {
  font-size: 0.875rem;
  color: inherit;
}

.sidebar-collapsed .nav-item {
  justify-content: center;
  padding: 0.65rem 0;
  margin: 2px 4px;
  width: calc(100% - 8px);
}

.sidebar-collapsed .nav-label {
  display: none;
}

.content-area {
  background: var(--surface-ground);
}

.topbar-title {
  color: var(--text-color);
}

.topbar-username {
  color: var(--text-color-secondary);
}

.sidebar-title {
  color: var(--text-color);
}

.logo-mini {
  width: 36px;
  height: 36px;
  background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%);
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
}

.avatar-red {
  background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%) !important;
  color: white !important;
}

.avatar-red:has(img) {
  background: transparent !important;
}

.btn-menu {
  color: var(--text-color-secondary) !important;
}

.btn-menu:hover {
  background: rgba(220, 38, 38, 0.1) !important;
  color: #dc2626 !important;
}

.btn-logout:hover {
  background: rgba(239, 68, 68, 0.1) !important;
}

.sidebar-logo {
  width: 40px;
  height: 40px;
  object-fit: contain;
}

.topbar-app-icon {
  height: 28px;
  width: auto;
  max-width: 84px;
  object-fit: contain;
  flex-shrink: 0;
}

.topbar-logo {
  width: 36px;
  height: 36px;
  object-fit: contain;
}

:deep(.sidebar-dark) {
  background: var(--surface-card) !important;
  border-right: 1px solid var(--surface-border) !important;
}

:deep(.menu-dark) {
  background: transparent !important;
}

/* Ingenia Labs promo */
.ingenia-promo {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.4rem;
  font-size: 0.7rem;
  color: var(--text-color-secondary);
  opacity: 0.4;
  padding: 0.35rem 0;
  background: transparent;
  pointer-events: auto;
  z-index: 10;
  transition: opacity 0.2s ease;
}

.ingenia-promo:hover {
  opacity: 0.7;
}

.ingenia-link,
.ingenia-ig {
  display: inline-flex;
  align-items: center;
  gap: 0.2rem;
  color: inherit;
  text-decoration: none;
  transition: color 0.15s;
}

.ingenia-link:hover {
  color: #dc2626;
}

.ingenia-ig:hover {
  color: #e1306c;
}

.ingenia-sep {
  opacity: 0.5;
  user-select: none;
}


</style>
