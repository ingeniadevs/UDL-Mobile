<template>
  <div class="inicio-container">
    <div class="inicio-content">
      <div class="logo-wrapper">
        <img :src="clubLogo" :alt="clubLogoAlt" class="club-logo" />
      </div>
      <h1 class="club-nombre">{{ clubName }}</h1>
      <p class="bienvenida">
        ¡Hola, <span class="nombre-socio">{{ authStore.user?.nombre }}</span>!
      </p>
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
      <div v-for="tile in ALL_TILES" :key="tile.id" class="config-item">
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
import { useClubBranding } from '@/composables/useClubBranding'
import { resolveAssetUrl } from '@/utils/assetUrl'
import Button from 'primevue/button'
import Dialog from 'primevue/dialog'
import Checkbox from 'primevue/checkbox'

const router = useRouter()
const authStore = useAuthStore()
const { branding, clubName } = useClubBranding()
const clubLogo = computed(() => resolveAssetUrl(branding.value.logo))
const clubLogoAlt = computed(() => branding.value.logoAlt || branding.value.shortName || 'Club')

const ALL_TILES = [
  { id: 'dashboard',   label: 'Dashboard',        icono: 'pi-chart-bar',     ruta: '/socio/dashboard' },
  { id: 'perfil',      label: 'Mi Perfil',        icono: 'pi-user',          ruta: '/socio/perfil' },
  { id: 'carnet',      label: 'Carnet Digital',   icono: 'pi-id-card',       ruta: '/socio/carnet' },
  { id: 'mi-plan',     label: 'Mi Plan',          icono: 'pi-bookmark',      ruta: '/socio/mi-plan' },
  { id: 'pagos',       label: 'Mis Pagos',        icono: 'pi-dollar',        ruta: '/socio/pagos' },
  { id: 'tienda',      label: 'Tienda',           icono: 'pi-shopping-cart', ruta: '/socio/tienda' },
  { id: 'pedidos',     label: 'Mis Pedidos',      icono: 'pi-shopping-bag',  ruta: '/socio/pedidos' },
  { id: 'disciplinas', label: 'Disciplinas',      icono: 'pi-users',         ruta: '/socio/disciplinas' },
  { id: 'reservas',    label: 'Reservar Espacio', icono: 'pi-calendar-plus', ruta: '/socio/reservas' },
]

const storageKey = `inicio_tiles_socio_${authStore.user?.id}`

const loadSavedIds = () => {
  try {
    const raw = localStorage.getItem(storageKey)
    if (raw) return JSON.parse(raw)
  } catch {}
  return null
}

const savedIds = ref(loadSavedIds())

const visibleTiles = computed(() => {
  if (!savedIds.value) return ALL_TILES
  return ALL_TILES.filter(t => savedIds.value.includes(t.id))
})

const configVisible = ref(false)
const draftIds = ref([])

const openConfig = () => {
  draftIds.value = savedIds.value ? [...savedIds.value] : ALL_TILES.map(t => t.id)
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
  min-height: 0;
  height: auto;
  display: flex;
  align-items: flex-start;
  justify-content: flex-start;
  padding: 0;
  overflow: visible;
}

.inicio-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  width: 100%;
  max-width: none;
}

.logo-wrapper {
  width: 88px;
  height: 88px;
  margin-bottom: 0.25rem;
  filter: drop-shadow(0 4px 12px rgba(220, 38, 38, 0.3));
}

.club-logo { width: 100%; height: 100%; object-fit: contain; }

.club-nombre {
  font-size: 1.15rem;
  font-weight: 700;
  color: var(--text-color);
  margin: 0 0 0.15rem;
  line-height: 1.25;
}

.bienvenida {
  font-size: 0.85rem;
  color: var(--text-color-secondary);
  margin: 0 0 0.65rem;
}

.nombre-socio { color: #dc2626; font-weight: 600; }

.accesos-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  margin-bottom: 0.4rem;
}

.accesos-titulo {
  font-size: 0.7rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--text-color-secondary);
}

.accesos-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.4rem;
  width: 100%;
}

.acceso-card {
  background: var(--surface-card);
  border: 1px solid var(--surface-border);
  border-radius: 10px;
  padding: 0.65rem 0.3rem;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.3rem;
  transition: all 0.18s ease;
  min-height: 4.25rem;
}

.acceso-card:hover {
  border-color: #dc2626;
  background: rgba(220, 38, 38, 0.06);
  transform: translateY(-1px);
}

.acceso-icon { font-size: 1.05rem; color: #dc2626; }

.acceso-label {
  font-size: 0.68rem;
  font-weight: 500;
  color: var(--text-color);
  line-height: 1.15;
}

.acceso-vacio {
  grid-column: 1 / -1;
  color: var(--text-color-secondary);
  font-size: 0.85rem;
  padding: 0.75rem;
}

.config-hint { color: var(--text-color-secondary); font-size: 0.875rem; margin: 0 0 1rem; }
.config-list { display: flex; flex-direction: column; gap: 0.75rem; }
.config-item { display: flex; align-items: center; gap: 0.75rem; }
.config-label { display: flex; align-items: center; gap: 0.5rem; cursor: pointer; font-size: 0.95rem; color: var(--text-color); }

@media (max-width: 420px) {
  .accesos-grid { grid-template-columns: repeat(2, 1fr); }
}

@media (min-width: 701px) {
  .logo-wrapper { width: 120px; height: 120px; }
  .club-nombre { font-size: 1.45rem; }
  .acceso-label { font-size: 0.75rem; }
}
</style>


