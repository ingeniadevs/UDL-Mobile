<template>
  <div class="min-h-screen flex flex-column layout-dark">
    <!-- Mobile Sidebar (overlay animado, solo mobile) -->
    <Sidebar v-model:visible="mobileSidebarVisible" class="sidebar-dark w-18rem">
      <template #header>
        <div class="flex align-items-center gap-2">
          <img src="/images/logo-udl.png" alt="UDL" class="sidebar-logo" />
          <span class="font-bold text-xl text-white">UDL</span>
        </div>
      </template>
      <Menu :model="menuItems" class="w-full border-none menu-dark" />
    </Sidebar>

    <!-- Top Bar -->
    <div class="topbar px-4 py-3 flex align-items-center justify-content-between">
      <div class="flex align-items-center gap-3">
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
        <span class="text-xl font-semibold topbar-title">UDL - Panel de Administración</span>
      </div>      <div class="flex align-items-center gap-3">
        <span class="topbar-username">{{ authStore.user?.nombre }}</span>
        <Tag 
          :value="authStore.user?.rol === 'master' ? 'Master' : 'Admin'" 
          :severity="authStore.user?.rol === 'master' ? 'danger' : 'info'"
          class="text-xs"
        />
        <Avatar :label="avatarLabel" shape="circle" class="avatar-red" />
        <Button 
          :icon="isDark ? 'pi pi-sun' : 'pi pi-moon'" 
          text 
          rounded 
          @click="toggleTheme"
          v-tooltip.bottom="isDark ? 'Modo claro' : 'Modo oscuro'"
          class="btn-menu"
        />        <Button 
          icon="pi pi-sign-out" 
          text 
          rounded 
          severity="danger"
          @click="handleLogout"
          v-tooltip.bottom="'Cerrar sesión'"
          class="btn-logout"
        />
        <Button
          icon="pi pi-lock"
          text
          rounded
          @click="showChangePasswordDialog = true"
          v-tooltip.bottom="'Cambiar contraseña'"
          class="btn-menu"
        />
      </div>
    </div>

    <!-- Change Password Dialog -->
    <Dialog
      v-model:visible="showChangePasswordDialog"
      :header="adminPwPaso === 1 ? 'Cambiar Contraseña' : 'Ingresá el código'"
      :modal="true"
      :style="{ width: '420px' }"
      @hide="resetAdminPwForm"
    >
      <!-- Paso 1: enviar código -->
      <div v-if="adminPwPaso === 1" class="flex flex-column gap-3 pt-2">
        <p class="text-gray-400 text-sm m-0">
          Te enviaremos un código de verificación a <strong>{{ authStore.user?.email }}</strong> para confirmar el cambio de contraseña.
        </p>
        <Message v-if="adminPwApiError" severity="error" :closable="false">{{ adminPwApiError }}</Message>
      </div>

      <!-- Paso 2: código + nueva contraseña -->
      <div v-else class="flex flex-column gap-3 pt-2">
        <Message severity="success" :closable="false">
          ✅ Código enviado a <strong>{{ authStore.user?.email }}</strong>. Revisá tu bandeja (y la carpeta spam).
        </Message>
        <div>
          <label class="block text-gray-300 font-medium mb-2">Código de verificación *</label>
          <InputText v-model="adminPwForm.codigo" class="w-full" placeholder="Ej: A3B7K2" :class="{ 'p-invalid': adminPwErrors.codigo }" />
          <small v-if="adminPwErrors.codigo" class="p-error">{{ adminPwErrors.codigo }}</small>
        </div>
        <div>
          <label class="block text-gray-300 font-medium mb-2">Nueva contraseña *</label>
          <Password v-model="adminPwForm.nueva" class="w-full" inputClass="w-full" toggleMask weakLabel="Débil" mediumLabel="Media" strongLabel="Fuerte" :class="{ 'p-invalid': adminPwErrors.nueva }" />
          <small v-if="adminPwErrors.nueva" class="p-error">{{ adminPwErrors.nueva }}</small>
        </div>
        <div>
          <label class="block text-gray-300 font-medium mb-2">Confirmar nueva contraseña *</label>
          <Password v-model="adminPwForm.confirmar" class="w-full" inputClass="w-full" :feedback="false" toggleMask :class="{ 'p-invalid': adminPwErrors.confirmar }" />
          <small v-if="adminPwErrors.confirmar" class="p-error">{{ adminPwErrors.confirmar }}</small>
        </div>
        <Message v-if="adminPwApiError" severity="error" :closable="false">{{ adminPwApiError }}</Message>
      </div>

      <template #footer>
        <Button label="Cancelar" text @click="showChangePasswordDialog = false" />
        <Button
          v-if="adminPwPaso === 1"
          label="Enviar código"
          icon="pi pi-envelope"
          :loading="savingAdminPw"
          @click="solicitarCodigoAdminPw"
        />
        <Button
          v-else
          label="Cambiar Contraseña"
          icon="pi pi-lock"
          :loading="savingAdminPw"
          @click="changeAdminPassword"
        />
      </template>
    </Dialog>

    <!-- Main Content -->
    <div class="flex flex-1">
      <!-- Desktop Sidebar -->
      <div
        class="hidden lg:flex flex-column sidebar-desktop"
        :class="{ 'sidebar-collapsed': !desktopSidebarVisible && !hoverExpanded }"
        @mouseenter="hoverExpanded = true"
        @mouseleave="hoverExpanded = false"
      >
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
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useTheme } from '@/composables/useTheme'
import { useToast } from 'primevue/usetoast'
import { authService } from '@/services'
import Sidebar from 'primevue/sidebar'
import Menu from 'primevue/menu'
import Button from 'primevue/button'
import Avatar from 'primevue/avatar'
import Tag from 'primevue/tag'
import Dialog from 'primevue/dialog'
import InputText from 'primevue/inputtext'
import Password from 'primevue/password'
import Message from 'primevue/message'
import { Capacitor } from '@capacitor/core'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()
const { isDark, toggleTheme } = useTheme()
const toast = useToast()

const mobileSidebarVisible = ref(false)
const desktopSidebarVisible = ref(true)
const hoverExpanded = ref(false)

function handleResize() {
  desktopSidebarVisible.value = window.innerWidth >= 1280
}

onMounted(() => {
  if (Capacitor.isNativePlatform()) {
    desktopSidebarVisible.value = false
  } else {
    handleResize()
    window.addEventListener('resize', handleResize)
  }
})

onUnmounted(() => {
  if (!Capacitor.isNativePlatform()) {
    window.removeEventListener('resize', handleResize)
  }
})

// Auto-colapsar al navegar
watch(() => route.path, () => {
  desktopSidebarVisible.value = false
})

// Change password
const showChangePasswordDialog = ref(false)
const savingAdminPw = ref(false)
const adminPwPaso = ref(1)
const adminPwForm = ref({ codigo: '', nueva: '', confirmar: '' })
const adminPwErrors = ref({})
const adminPwApiError = ref('')

function resetAdminPwForm() {
  adminPwPaso.value = 1
  adminPwForm.value = { codigo: '', nueva: '', confirmar: '' }
  adminPwErrors.value = {}
  adminPwApiError.value = ''
}

async function solicitarCodigoAdminPw() {
  adminPwApiError.value = ''
  savingAdminPw.value = true
  try {
    const response = await authService.solicitarCambioPassword()
    if (response?.emailEnviado === false) {
      adminPwApiError.value = response.message || 'No se pudo enviar el email.'
    } else {
      adminPwPaso.value = 2
    }
  } catch (error) {
    adminPwApiError.value = error?.response?.data?.message || 'No se pudo enviar el código. Intentá de nuevo.'
  } finally {
    savingAdminPw.value = false
  }
}

async function changeAdminPassword() {
  adminPwErrors.value = {}
  adminPwApiError.value = ''
  if (!adminPwForm.value.codigo) adminPwErrors.value.codigo = 'El código es requerido'
  if (!adminPwForm.value.nueva) adminPwErrors.value.nueva = 'Requerido'
  if (adminPwForm.value.nueva && adminPwForm.value.nueva.length < 6) adminPwErrors.value.nueva = 'Mínimo 6 caracteres'
  if (adminPwForm.value.nueva !== adminPwForm.value.confirmar) adminPwErrors.value.confirmar = 'Las contraseñas no coinciden'
  if (Object.keys(adminPwErrors.value).length) return
  savingAdminPw.value = true
  try {
    await authService.cambiarPassword(adminPwForm.value.codigo, adminPwForm.value.nueva)
    showChangePasswordDialog.value = false
    resetAdminPwForm()
    toast.add({ severity: 'success', summary: 'Éxito', detail: 'Contraseña cambiada correctamente', life: 3000 })
  } catch (error) {
    adminPwApiError.value = error?.response?.data?.message || 'No se pudo cambiar la contraseña'
  } finally {
    savingAdminPw.value = false
  }
}

const avatarLabel = computed(() => {
  return authStore.user?.nombre?.charAt(0).toUpperCase() || 'A'
})

const menuItems = computed(() => {
  const isMaster = authStore.user?.rol === 'master'
  const hp = (seccion) => isMaster || authStore.hasPermiso(seccion)
  const hasAnyPermiso = isMaster || (authStore.user?.permisos?.length > 0)
  const result = []

  // --- Principal --- siempre visible para cualquier admin
  const principal = [
    { label: 'Inicio', icon: 'pi pi-home', command: () => router.push('/admin/inicio') }
  ]
  // Dashboard solo si tiene al menos un permiso (o es master)
  if (hasAnyPermiso) {
    principal.push({ label: 'Dashboard', icon: 'pi pi-chart-bar', command: () => router.push('/admin/dashboard') })
  }
  result.push({ label: 'Principal', items: principal })// --- Gestión ---
  const gestion = []
  if (hp('socios'))      gestion.push({ label: 'Socios',      icon: 'pi pi-users',         command: () => router.push('/admin/socios') })
  if (hp('disciplinas')) gestion.push({ label: 'Disciplinas', icon: 'pi pi-bookmark',       command: () => router.push('/admin/disciplinas') })
  if (hp('pagos'))       gestion.push({ label: 'Pago de Cuotas', icon: 'pi pi-dollar',      command: () => router.push('/admin/pagos') })
  if (hp('productos'))   gestion.push({ label: 'Productos',   icon: 'pi pi-shopping-bag',   command: () => router.push('/admin/productos') })
  if (hp('pedidos'))     gestion.push({ label: 'Pedidos',     icon: 'pi pi-shopping-cart',  command: () => router.push('/admin/pedidos') })
  if (hp('empleados'))   gestion.push({ label: 'Empleados',   icon: 'pi pi-id-card',        command: () => router.push('/admin/empleados') })
  if (isMaster)          gestion.push({ label: 'Planes de Membresía', icon: 'pi pi-credit-card', command: () => router.push('/admin/planes-membresia') })
  if (gestion.length) result.push({ label: 'Gestión', items: gestion })

  // --- Reservas ---
  const reservas = []
  if (hp('espacios')) reservas.push({ label: 'Espacios', icon: 'pi pi-building',  command: () => router.push('/admin/espacios') })
  if (hp('reservas')) reservas.push({ label: 'Reservas', icon: 'pi pi-calendar',  command: () => router.push('/admin/reservas') })
  if (reservas.length) result.push({ label: 'Reservas', items: reservas })
  // --- Finanzas ---
  const finanzas = []
  if (hp('movimientos')) finanzas.push({ label: 'Ingresos & Egresos', icon: 'pi pi-chart-bar', command: () => router.push('/admin/movimientos') })
  if (hp('eventos'))     finanzas.push({ label: 'Eventos',            icon: 'pi pi-star',       command: () => router.push('/admin/eventos') })
  if (finanzas.length) result.push({ label: 'Finanzas', items: finanzas })

  // --- Inventario ---
  const inventario = []
  if (hp('inventario') || isMaster) inventario.push({ label: 'Inventario', icon: 'pi pi-box', command: () => router.push('/admin/inventario') })
  if (inventario.length) result.push({ label: 'Inventario', items: inventario })

  // --- Sistema (solo master) ---
  if (isMaster) {
    result.push({
      label: 'Sistema',
      items: [
        { label: 'Administradores', icon: 'pi pi-shield', command: () => router.push('/admin/administradores') }
      ]
    })
  }

  return result
})

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

.topbar-title {
  color: var(--text-color);
}

.topbar-username {
  color: var(--text-color-secondary);
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

:deep(.sidebar-dark) {
  background: var(--surface-card) !important;
  border-right: 1px solid var(--surface-border) !important;
}

:deep(.menu-dark) {
  background: transparent !important;
}


</style>
