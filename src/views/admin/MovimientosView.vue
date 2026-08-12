<template>
  <div class="movimientos-view">
    <PageHeader title="Ingresos & Egresos">
      <template #actions>
        <Button
          label="Nuevo Movimiento"
          icon="pi pi-plus"
          size="small"
          @click="abrirFormulario"
        />
      </template>
    </PageHeader>

    <!-- Tabs principales -->
    <TabView v-model:activeIndex="activeTabIndex" class="custom-tabview" @tab-change="onTabChange">
      <!-- Tab 1: Lista de Movimientos -->
      <TabPanel header="Movimientos" leftIcon="pi pi-list">
        <div class="movimientos-panel">
          <!-- Tarjetas resumen -->
          <div class="grid mb-4">
            <div class="col-6 md:col-3">
              <div class="stat-card">
                <div class="stat-icon bg-green"><i class="pi pi-arrow-down"></i></div>
                <div class="stat-content">
                  <span class="stat-value">${{ resumen.totalIngresos?.toLocaleString('es-AR') ?? '0' }}</span>
                  <span class="stat-label">Total Ingresos</span>
                </div>
              </div>
            </div>
            <div class="col-6 md:col-3">
              <div class="stat-card">
                <div class="stat-icon bg-red"><i class="pi pi-arrow-up"></i></div>
                <div class="stat-content">
                  <span class="stat-value">${{ resumen.totalEgresos?.toLocaleString('es-AR') ?? '0' }}</span>
                  <span class="stat-label">Total Egresos</span>
                </div>
              </div>
            </div>
            <div class="col-6 md:col-3">
              <div class="stat-card">
                <div class="stat-icon" :class="saldo >= 0 ? 'bg-blue' : 'bg-orange'"><i class="pi pi-wallet"></i></div>
                <div class="stat-content">
                  <span class="stat-value" :class="saldo >= 0 ? 'text-green-400' : 'text-red-400'">
                    {{ saldo >= 0 ? '+' : '' }}${{ saldo.toLocaleString('es-AR') }}
                  </span>
                  <span class="stat-label">Saldo del Período</span>
                </div>
              </div>
            </div>
            <div class="col-6 md:col-3">
              <div class="stat-card">
                <div class="stat-icon bg-purple"><i class="pi pi-list"></i></div>
                <div class="stat-content">
                  <span class="stat-value">{{ movimientosFiltrados.length }}</span>
                  <span class="stat-label">Movimientos</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Filtros -->
          <div class="card mb-4">
            <div class="grid">
              <div class="col-12 md:col-3">
                <label class="block text-sm font-medium mb-2">Desde</label>
                <Calendar 
                  v-model="filtros.fechaDesde" 
                  dateFormat="dd/mm/yy"
                  :showIcon="true"
                  placeholder="Fecha desde"
                  @date-select="aplicarFiltros"
                />
              </div>
              
              <div class="col-12 md:col-3">
                <label class="block text-sm font-medium mb-2">Hasta</label>
                <Calendar 
                  v-model="filtros.fechaHasta" 
                  dateFormat="dd/mm/yy"
                  :showIcon="true"
                  placeholder="Fecha hasta"
                  @date-select="aplicarFiltros"
                />
              </div>

              <div class="col-12 md:col-3">
                <label class="block text-sm font-medium mb-2">Tipo</label>
                <Dropdown 
                  v-model="filtros.tipo" 
                  :options="tiposMovimiento"
                  optionLabel="label"
                  optionValue="value"
                  placeholder="Todos los tipos"
                  :showClear="true"
                  @change="aplicarFiltros"
                />
              </div>

              <div class="col-12 md:col-3">
                <label class="block text-sm font-medium mb-2">Categoría</label>
                <Dropdown 
                  v-model="filtros.categoria" 
                  :options="categorias"
                  optionLabel="label"
                  optionValue="value"
                  placeholder="Todas las categorías"
                  :showClear="true"
                  class="w-full"
                  @change="aplicarFiltros"
                />
              </div>
              <div class="col-12 md:col-12">
                <label class="block text-sm font-medium mb-2">Buscar</label>
                <span class="p-input-icon-left w-full">
                  <i class="pi pi-search" />
                  <InputText v-model="busqueda" placeholder="Buscar por concepto, categoría, pagador..." class="w-full" @input="aplicarFiltros" />
                </span>
              </div>
            </div>
          </div>

          <!-- Lista de movimientos -->
          <div class="card">
            <div class="flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
              <h3 class="m-0">Listado de Movimientos</h3>
              <Button icon="pi pi-refresh" text rounded size="small" @click="cargarMovimientos" :loading="loading" v-tooltip="'Actualizar datos'" />
            </div>

            <div v-if="loading" class="flex justify-content-center py-4">
              <i class="pi pi-spin pi-spinner text-2xl"></i>
            </div>
            <div v-else-if="movimientosFiltrados.length === 0" class="text-center text-gray-400 py-4">
              No hay movimientos para mostrar
            </div>
            <template v-else>
              <div class="mobile-card-list">
                <MobileRecordCard
                  v-for="item in paginatedMovimientos"
                  :key="item.id"
                  :title="item.concepto"
                  :subtitle="formatFecha(item.fecha)"
                >
                  <template #tags>
                    <Tag
                      :severity="item.tipo === 'ingreso' ? 'success' : 'danger'"
                      :value="item.tipo === 'ingreso' ? 'Ingreso' : 'Egreso'"
                      :icon="item.tipo === 'ingreso' ? 'pi pi-arrow-down' : 'pi pi-arrow-up'"
                    />
                  </template>
                  <template #body>
                    <div class="record-card__row">
                      <span class="record-card__label">Categoría</span>
                      <span class="record-card__value">{{ item.categoria }}</span>
                    </div>
                    <div v-if="item.pagadorNombre" class="record-card__row">
                      <span class="record-card__label">Pagador</span>
                      <span class="record-card__value">
                        {{ item.pagadorNombre }}
                        <span v-if="item.pagadorDni" class="text-gray-500 text-xs block">DNI {{ item.pagadorDni }}</span>
                      </span>
                    </div>
                    <div v-if="item.empleadoNombre" class="record-card__row">
                      <span class="record-card__label">Empleado</span>
                      <span class="record-card__value">{{ item.empleadoNombre }}</span>
                    </div>
                    <div v-if="item.usuarioRegistro" class="record-card__row">
                      <span class="record-card__label">Usuario</span>
                      <span class="record-card__value">{{ item.usuarioRegistro }}</span>
                    </div>
                    <div class="record-card__row">
                      <span class="record-card__label">Monto</span>
                      <span
                        class="record-card__value font-bold"
                        :class="item.tipo === 'ingreso' ? 'text-green-400' : 'text-red-400'"
                      >
                        {{ item.tipo === 'ingreso' ? '+' : '-' }}${{ item.monto.toLocaleString('es-AR') }}
                      </span>
                    </div>
                  </template>
                  <template #actions>
                    <Button icon="pi pi-pencil" text rounded size="small" @click="editarMovimiento(item)" v-tooltip="'Editar'" />
                    <Button icon="pi pi-trash" text rounded size="small" severity="danger" @click="confirmarEliminar(item)" v-tooltip="'Eliminar'" />
                  </template>
                </MobileRecordCard>
              </div>
              <MobilePaginator v-model:page="movimientosPage" :rows="10" :total="movimientosFiltrados.length" />
            </template>
          </div>
        </div>
      </TabPanel>

      <!-- Tab 2: Dashboard Mensual -->
      <TabPanel header="Dashboard Mensual" leftIcon="pi pi-chart-line">
        <DashboardMensual :key="`dash-m-${movimientosVersion}`" :refresh-key="movimientosVersion" />
      </TabPanel>

      <!-- Tab 3: Dashboard Anual -->
      <TabPanel header="Dashboard Anual" leftIcon="pi pi-chart-bar">
        <DashboardAnual :key="`dash-a-${movimientosVersion}`" :refresh-key="movimientosVersion" />
      </TabPanel>

      <!-- Tab 4: Reportes -->
      <TabPanel header="Reportes" leftIcon="pi pi-file-pdf">
        <ReporteMovimientos :key="`rep-${movimientosVersion}`" :refresh-key="movimientosVersion" />
      </TabPanel>

      <!-- Tab 5: Balances anuales -->
      <TabPanel header="Balances anuales" leftIcon="pi pi-file">
        <div class="tab-panel-content">
          <BalanceAnualUpload :key="`bal-${balancesVersion}`" scope="Club" :refresh-key="balancesVersion" />
        </div>
      </TabPanel>

      <!-- Tab 6: Distribución disciplinas -->
      <TabPanel header="Distribución disciplinas" leftIcon="pi pi-sitemap">
        <ReporteDistribucionDisciplinas />
      </TabPanel>
    </TabView>

    <!-- Dialog para crear/editar movimientos -->
    <MovimientoFormDialog
      v-model:visible="mostrarFormulario"
      :movimiento="movimientoEditando"
      @saved="onMovimientoGuardado"
    />

    <!-- Dialog de confirmación para eliminar -->
    <Dialog 
      v-model:visible="mostrarConfirmacionEliminar" 
      :modal="true" 
      header="Confirmar eliminación"
      :style="{ width: '450px' }"
    >
      <div class="confirmation-content">
        <i class="pi pi-exclamation-triangle mr-3" style="font-size: 2rem; color: #f59e0b"></i>
        <span>
          ¿Estás seguro de que deseas eliminar este movimiento? 
          <br><strong>Esta acción no se puede deshacer.</strong>
        </span>
      </div>
      <template #footer>
        <Button 
          label="Cancelar" 
          icon="pi pi-times" 
          @click="mostrarConfirmacionEliminar = false" 
          text 
        />
        <Button 
          label="Eliminar" 
          icon="pi pi-check" 
          severity="danger"
          @click="eliminarMovimiento" 
          :loading="eliminando"
        />
      </template>
    </Dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { movimientosService } from '@/services'
import { useToast } from 'primevue/usetoast'
import { useMobilePagination } from '@/composables/useMobilePagination'
import PageHeader from '@/components/mobile/PageHeader.vue'
import MobileRecordCard from '@/components/mobile/MobileRecordCard.vue'
import MobilePaginator from '@/components/mobile/MobilePaginator.vue'
import TabView from 'primevue/tabview'
import TabPanel from 'primevue/tabpanel'
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import Calendar from 'primevue/calendar'
import Dropdown from 'primevue/dropdown'
import Dialog from 'primevue/dialog'
import Tag from 'primevue/tag'
import DashboardMensual from '@/components/movimientos/DashboardMensual.vue'
import DashboardAnual from '@/components/movimientos/DashboardAnual.vue'
import ReporteMovimientos from '@/components/movimientos/ReporteMovimientos.vue'
import BalanceAnualUpload from '@/components/contabilidad/BalanceAnualUpload.vue'
import ReporteDistribucionDisciplinas from '@/components/contabilidad/ReporteDistribucionDisciplinas.vue'
import MovimientoFormDialog from '@/components/movimientos/MovimientoFormDialog.vue'

const toast = useToast()

// Estado
const loading = ref(false)
const eliminando = ref(false)
const movimientos = ref([])
const activeTabIndex = ref(0)
const busqueda = ref('')

// Formulario y dialogs
const mostrarFormulario = ref(false)
const mostrarConfirmacionEliminar = ref(false)
const movimientoEditando = ref(null)
const movimientoAEliminar = ref(null)
const movimientosVersion = ref(0)
const balancesVersion = ref(0)

// Filtros
const filtros = ref({
  fechaDesde: null,
  fechaHasta: null,
  tipo: null,
  categoria: null
})

// Opciones para filtros
const tiposMovimiento = [
  { label: 'Ingreso', value: 'ingreso' },
  { label: 'Egreso', value: 'egreso' }
]

const categorias = [
  // Ingresos
  { label: 'Cuota de socios',      value: 'cuota_socios' },
  { label: 'Factura / Cobro',      value: 'factura_cobro' },
  { label: 'Donación',             value: 'donacion' },
  { label: 'Evento / Torneo',      value: 'evento' },
  { label: 'Venta de productos',   value: 'venta_productos' },
  { label: 'Alquiler de espacios', value: 'alquiler_espacios' },
  { label: 'Subsidio / Ayuda',     value: 'subsidio' },
  { label: 'Otro ingreso',         value: 'otro_ingreso' },
  // Egresos
  { label: 'Sueldos / Honorarios', value: 'sueldos' },
  { label: 'Factura de servicios', value: 'factura_servicio' },
  { label: 'Compra de productos',  value: 'compra_productos' },
  { label: 'Mantenimiento',        value: 'mantenimiento' },
  { label: 'Evento / Torneo',      value: 'evento_egreso' },
  { label: 'Impuestos / Tasas',    value: 'impuestos' },
  { label: 'Otro egreso',          value: 'otro_egreso' },
]

// Computed
const movimientosFiltrados = computed(() => {
  let resultado = movimientos.value

  // Filtro por búsqueda
  if (busqueda.value) {
    const termino = busqueda.value.toLowerCase()
    resultado = resultado.filter(mov => 
      mov.concepto.toLowerCase().includes(termino) ||
      mov.categoria.toLowerCase().includes(termino) ||
      mov.pagadorNombre?.toLowerCase().includes(termino) ||
      mov.pagadorDni?.toLowerCase().includes(termino) ||
      mov.descripcion?.toLowerCase().includes(termino) ||
      mov.empleadoNombre?.toLowerCase().includes(termino) ||
      mov.usuarioRegistro?.toLowerCase().includes(termino)
    )
  }

  // Filtro por fechas (comparar solo parte de fecha, sin hora UTC)
  if (filtros.value.fechaDesde) {
    const desdeStr = filtros.value.fechaDesde.toISOString().substring(0, 10)
    resultado = resultado.filter(mov => 
      (typeof mov.fecha === 'string' ? mov.fecha.substring(0, 10) : mov.fecha.toISOString().substring(0, 10)) >= desdeStr
    )
  }
  if (filtros.value.fechaHasta) {
    const hastaStr = filtros.value.fechaHasta.toISOString().substring(0, 10)
    resultado = resultado.filter(mov => 
      (typeof mov.fecha === 'string' ? mov.fecha.substring(0, 10) : mov.fecha.toISOString().substring(0, 10)) <= hastaStr
    )
  }

  // Filtro por tipo
  if (filtros.value.tipo) {
    resultado = resultado.filter(mov => mov.tipo === filtros.value.tipo)
  }

  // Filtro por categoría
  if (filtros.value.categoria) {
    resultado = resultado.filter(mov => mov.categoria === filtros.value.categoria)
  }

  // Ordenar: por fecha desc, luego por createdAt desc (para que ingresos manuales no queden al fondo)
  return [...resultado].sort((a, b) => {
    const fechaA = (a.fecha || '').substring(0, 10)
    const fechaB = (b.fecha || '').substring(0, 10)
    if (fechaA !== fechaB) return fechaA > fechaB ? -1 : 1
    const caA = a.createdAt || ''
    const caB = b.createdAt || ''
    return caA > caB ? -1 : 1
  })
})

const resumen = computed(() => {
  const ingresos = movimientosFiltrados.value
    .filter(m => m.tipo === 'ingreso')
    .reduce((sum, m) => sum + m.monto, 0)
  
  const egresos = movimientosFiltrados.value
    .filter(m => m.tipo === 'egreso')
    .reduce((sum, m) => sum + m.monto, 0)
  
  return {
    totalIngresos: ingresos,
    totalEgresos: egresos
  }
})

const saldo = computed(() => resumen.value.totalIngresos - resumen.value.totalEgresos)

const { page: movimientosPage, paginated: paginatedMovimientos } = useMobilePagination(
  movimientosFiltrados,
  10,
  [busqueda, () => filtros.value.fechaDesde, () => filtros.value.fechaHasta, () => filtros.value.tipo, () => filtros.value.categoria]
)

const notificarCambioMovimientos = () => {
  movimientosVersion.value++
}

const onTabChange = (event) => {
  if (event.index === 4) {
    balancesVersion.value++
  }
}

// Métodos
const cargarMovimientos = async () => {
  try {
    loading.value = true
    movimientos.value = await movimientosService.getAll()
  } catch (error) {
    console.error('Error cargando movimientos:', error)
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'No se pudieron cargar los movimientos',
      life: 3000
    })
  } finally {
    loading.value = false
  }
}

const aplicarFiltros = () => {
  // Los filtros se aplican automáticamente a través de computed
}

const formatFecha = (fecha) => {
  if (!fecha) return '—'
  // Usar solo la parte de la fecha (YYYY-MM-DD) para evitar el desfase por zona horaria
  const datePart = typeof fecha === 'string' ? fecha.substring(0, 10) : fecha.toISOString().substring(0, 10)
  const [y, m, d] = datePart.split('-')
  return `${d}/${m}/${y}`
}

const abrirFormulario = () => {
  movimientoEditando.value = null
  mostrarFormulario.value = true
}

const editarMovimiento = (movimiento) => {
  movimientoEditando.value = movimiento
  mostrarFormulario.value = true
}

const confirmarEliminar = (movimiento) => {
  movimientoAEliminar.value = movimiento
  mostrarConfirmacionEliminar.value = true
}

const eliminarMovimiento = async () => {
  try {
    eliminando.value = true
    await movimientosService.delete(movimientoAEliminar.value.id)
    
    toast.add({
      severity: 'success',
      summary: 'Éxito',
      detail: 'Movimiento eliminado correctamente',
      life: 3000
    })
    
    mostrarConfirmacionEliminar.value = false
    await cargarMovimientos()
    notificarCambioMovimientos()
  } catch (error) {
    console.error('Error eliminando movimiento:', error)
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'No se pudo eliminar el movimiento',
      life: 3000
    })
  } finally {
    eliminando.value = false
  }
}

const onMovimientoGuardado = async () => {
  await cargarMovimientos()
  notificarCambioMovimientos()
  toast.add({
    severity: 'success',
    summary: 'Éxito',
    detail: movimientoEditando.value ? 'Movimiento actualizado' : 'Movimiento creado',
    life: 3000
  })
}

onMounted(() => {
  cargarMovimientos()
})
</script>

<style scoped>
.movimientos-view {
  padding: 1rem;
}

.tab-panel-content {
  padding: 0.5rem 0;
}

.page-title {
  color: var(--text-color);
}

.card {
  background: var(--surface-card);
  border-radius: 8px;
  padding: 1.5rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  margin-bottom: 1rem;
}

.stat-card {
  display: flex;
  align-items: center;
  gap: 1rem;
  background: var(--surface-card);
  border: 1px solid var(--surface-border);
  border-radius: 12px;
  padding: 1.25rem;
}

.stat-content {
  display: flex;
  flex-direction: column;
}

.stat-label {
  font-size: 0.85rem;
  color: var(--text-color-secondary);
}

.stat-value {
  font-size: 1.6rem;
  font-weight: 700;
  color: var(--text-color);
  line-height: 1.2;
}

.stat-icon {
  width: 50px;
  height: 50px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  flex-shrink: 0;
}

.stat-icon i { font-size: 1.4rem; }

.stat-icon.bg-green {
  background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);
}

.stat-icon.bg-red {
  background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%);
}

.stat-icon.bg-blue {
  background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
}

.stat-icon.bg-orange {
  background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
}

.stat-icon.bg-purple {
  background: linear-gradient(135deg, #a855f7 0%, #7c3aed 100%);
}

.custom-tabview {
  background: var(--surface-card);
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.movimientos-panel {
  padding: 1rem;
}

.confirmation-content {
  display: flex;
  align-items: center;
  margin: 1rem 0;
}

:deep(.p-tabview-nav) {
  background: var(--surface-card);
  border-bottom: 1px solid var(--surface-border);
}

:deep(.p-tabview-nav li .p-tabview-nav-link) {
  border: none !important;
  color: var(--text-color-secondary);
  background: transparent;
}

:deep(.p-tabview-nav li.p-highlight .p-tabview-nav-link) {
  background: transparent;
  color: var(--primary-color);
  border-bottom: 2px solid var(--primary-color) !important;
}

:deep(.p-tabview-panels) {
  padding: 0;
}

:deep(.p-datatable-striped .p-datatable-tbody > tr:nth-child(odd)) {
  background: var(--surface-hover);
}

:deep(.p-datatable-striped .p-datatable-tbody > tr:hover) {
  background: var(--surface-ground);
}
</style>
