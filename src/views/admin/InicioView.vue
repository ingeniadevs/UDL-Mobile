<template>
  <div class="inicio-container">
    <div class="inicio-content">
      <div class="logo-wrapper">
        <img src="/images/logo-udl.png" alt="Club UDL" class="club-logo" />
      </div>
      <h1 class="club-nombre">Club Unión Deportiva Laspiur</h1>
      <p class="bienvenida">Bienvenido, <span class="nombre-admin">{{ authStore.user?.nombre }}</span></p>
      <Tag
        :value="authStore.user?.rol === 'master' ? 'Master' : 'Administrador'"
        :severity="authStore.user?.rol === 'master' ? 'danger' : 'info'"
        class="tag-rol"
      />
      <div class="accesos-header">
        <span class="accesos-titulo">Accesos rápidos</span>
        <Button icon="pi pi-sliders-h" text rounded size="small" v-tooltip.top="'Personalizar'" @click="openConfig" />
      </div>
      <div class="accesos-grid">
        <div v-for="tile in visibleTiles" :key="tile.id"
          class="acceso-card"
          @click="router.push(tile.ruta)"
        >
          <i :class="['pi', tile.icono, 'acceso-icon']"></i>
          <span class="acceso-label">{{ tile.label }}</span>
        </div>
        <div v-if="visibleTiles.length === 0" class="acceso-vacio">
          <i class="pi pi-info-circle"></i> No hay secciones seleccionadas
        </div>
      </div>
    </div>
  </div>

  <Dialog v-model:visible="configVisible" header="Personalizar inicio" modal :style="{ width: '340px' }">
    <p class="config-hint">Seleccioná las secciones que querés ver</p>
    <div class="config-list">
      <div v-for="tile in allAvailableTiles" :key="tile.id" class="config-item">
        <Checkbox v-model="draftIds" :value="tile.id" :inputId="'cfg_' + tile.id" />
        <label :for="'cfg_' + tile.id" class="config-label">
          <i :class="['pi', tile.icono]"></i>
          {{ tile.label }}
        </label>
      </div>
    </div>
    <template #footer>
      <Button label="Cancelar" text @click="configVisible = false" />
      <Button label="Guardar" @click="saveConfig" />
    </template>
  </Dialog>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import Tag from 'primevue/tag'
import Button from 'primevue/button'
import Dialog from 'primevue/dialog'
import Checkbox from 'primevue/checkbox'

const router = useRouter()
const authStore = useAuthStore()

const isMaster = computed(() => authStore.user?.rol === 'master')
const hp = (s) => isMaster.value || authStore.hasPermiso(s)

const allAvailableTiles = computed(() => {
  const items = []
  if (hp('dashboard')) items.push({ id: 'dashboard', label: 'Dashboard', icono: 'pi-chart-bar', ruta: '/admin/dashboard' })
  if (hp('socios'))      items.push({ id: 'socios',          label: 'Socios',             icono: 'pi-users',         ruta: '/admin/socios' })
  if (hp('disciplinas')) items.push({ id: 'disciplinas',     label: 'Disciplinas',        icono: 'pi-bookmark',      ruta: '/admin/disciplinas' })
  if (hp('pagos'))       items.push({ id: 'pagos',           label: 'Pago de Cuotas',     icono: 'pi-dollar',        ruta: '/admin/pagos' })
  if (hp('productos'))   items.push({ id: 'productos',       label: 'Productos',          icono: 'pi-shopping-bag',  ruta: '/admin/productos' })
  if (hp('pedidos'))     items.push({ id: 'pedidos',         label: 'Pedidos',            icono: 'pi-shopping-cart', ruta: '/admin/pedidos' })
  if (hp('empleados'))   items.push({ id: 'empleados',       label: 'Empleados',          icono: 'pi-id-card',       ruta: '/admin/empleados' })
  if (hp('notificaciones')) items.push({ id: 'notificaciones', label: 'Envío de Notificaciones', icono: 'pi-send', ruta: '/admin/notificaciones' })
  if (isMaster.value)    items.push({ id: 'planes',          label: 'Planes Membresía',    icono: 'pi-credit-card',   ruta: '/admin/planes-membresia' })
  if (hp('espacios'))    items.push({ id: 'espacios',        label: 'Espacios',           icono: 'pi-building',      ruta: '/admin/espacios' })
  if (hp('reservas'))      items.push({ id: 'reservas',        label: 'Reservas',                    icono: 'pi-calendar',      ruta: '/admin/reservas' })
  if (hp('movimientos'))   items.push({ id: 'movimientos',     label: 'Ingresos & Egresos',          icono: 'pi-chart-line',    ruta: '/admin/movimientos' })
  if (hp('contabilidad'))  items.push({ id: 'contabilidad',    label: 'Contabilidad por Disciplina', icono: 'pi-calculator',    ruta: '/admin/contabilidad-disciplinas' })
  if (hp('eventos'))       items.push({ id: 'eventos',         label: 'Eventos',                     icono: 'pi-star',          ruta: '/admin/eventos' })
  if (hp('inventario') || isMaster.value) items.push({ id: 'inventario', label: 'Inventario', icono: 'pi-box', ruta: '/admin/inventario' })
  if (hp('planes-membresia') || isMaster.value) items.push({ id: 'planes-membresia', label: 'Planes de Membresía', icono: 'pi-credit-card', ruta: '/admin/planes-membresia' })
  if (isMaster.value)      items.push({ id: 'administradores', label: 'Administradores',             icono: 'pi-shield',        ruta: '/admin/administradores' })
  return items
})

const storageKey = `inicio_tiles_admin_${authStore.user?.id}`

const loadSavedIds = () => {
  try {
    const raw = localStorage.getItem(storageKey)
    if (raw) return JSON.parse(raw)
  } catch {}
  return null
}

const savedIds = ref(loadSavedIds())

const visibleTiles = computed(() => {
  if (!savedIds.value) return allAvailableTiles.value
  return allAvailableTiles.value.filter(t => savedIds.value.includes(t.id))
})

const configVisible = ref(false)
const draftIds = ref([])

const openConfig = () => {
  draftIds.value = savedIds.value ? [...savedIds.value] : allAvailableTiles.value.map(t => t.id)
  configVisible.value = true
}

const saveConfig = () => {
  savedIds.value = [...draftIds.value]
  localStorage.setItem(storageKey, JSON.stringify(savedIds.value))
  configVisible.value = false
}
</script>

<style scoped>
.inicio-container {
  height: calc(100vh - 64px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem 2rem;
  overflow-y: auto;
}

.inicio-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  width: 100%;
  max-width: 860px;
}

.logo-wrapper {
  width: 210px;
  height: 210px;
  margin-bottom: 0.6rem;
  filter: drop-shadow(0 6px 20px rgba(220, 38, 38, 0.35));
}

.club-logo { width: 100%; height: 100%; object-fit: contain; }

.club-nombre {
  font-size: 1.75rem;
  font-weight: 700;
  color: var(--text-color);
  margin: 0 0 0.2rem;
}

.bienvenida {
  font-size: 0.95rem;
  color: var(--text-color-secondary);
  margin: 0 0 0.6rem;
}

.nombre-admin { color: #dc2626; font-weight: 600; }

.tag-rol { margin-bottom: 1rem; }

.accesos-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  margin-bottom: 0.5rem;
}

.accesos-titulo {
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--text-color-secondary);
}

.accesos-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 0.45rem;
  width: 100%;
}

.acceso-card {
  background: var(--surface-card);
  border: 1px solid var(--surface-border);
  border-radius: 10px;
  padding: 0.75rem 0.4rem;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.35rem;
  transition: all 0.18s ease;
}

.acceso-card:hover {
  border-color: #dc2626;
  background: rgba(220, 38, 38, 0.06);
  transform: translateY(-2px);
}

.acceso-icon { font-size: 1.2rem; color: #dc2626; }

.acceso-label {
  font-size: 0.72rem;
  font-weight: 500;
  color: var(--text-color);
  line-height: 1.2;
  text-align: center;
}

.acceso-vacio {
  grid-column: 1 / -1;
  color: var(--text-color-secondary);
  font-size: 0.9rem;
  padding: 1rem;
}

.config-hint { color: var(--text-color-secondary); font-size: 0.875rem; margin: 0 0 1rem; }
.config-list { display: flex; flex-direction: column; gap: 0.75rem; }
.config-item { display: flex; align-items: center; gap: 0.75rem; }
.config-label { display: flex; align-items: center; gap: 0.5rem; cursor: pointer; font-size: 0.95rem; color: var(--text-color); }

@media (max-width: 700px) {
  .accesos-grid { grid-template-columns: repeat(3, 1fr); }
  .logo-wrapper { width: 150px; height: 150px; }
  .club-nombre { font-size: 1.35rem; }
}
</style>
