<template>
  <div class="movimientos-view">
    <!-- Header -->
    <div class="flex justify-content-between align-items-center mb-4">
      <h1 class="text-3xl font-bold page-title m-0">Ingresos & Egresos</h1>
      <Button 
        label="Nuevo Movimiento" 
        icon="pi pi-plus" 
        @click="abrirFormulario" 
      />
    </div>

    <!-- Tabs principales -->
    <TabView v-model:activeIndex="activeTabIndex" class="custom-tabview">
      <!-- Tab 1: Lista de Movimientos -->
      <TabPanel header="Movimientos" leftIcon="pi pi-list">
        <div class="movimientos-panel">
          <!-- Tarjetas resumen -->
          <div class="grid mb-4">
            <div class="col-12 md:col-3">
              <div class="stat-card">
                <div class="flex align-items-center justify-content-between">
                  <div>
                    <span class="block stat-label font-medium mb-2">Total Ingresos</span>
                    <div class="stat-value font-bold text-3xl">${{ resumen.totalIngresos?.toLocaleString('es-AR') ?? '0' }}</div>
                  </div>
                  <div class="stat-icon bg-green">
                    <i class="pi pi-arrow-down text-2xl"></i>
                  </div>
                </div>
              </div>
            </div>
            
            <div class="col-12 md:col-3">
              <div class="stat-card">
                <div class="flex align-items-center justify-content-between">
                  <div>
                    <span class="block stat-label font-medium mb-2">Total Egresos</span>
                    <div class="stat-value font-bold text-3xl">${{ resumen.totalEgresos?.toLocaleString('es-AR') ?? '0' }}</div>
                  </div>
                  <div class="stat-icon bg-red">
                    <i class="pi pi-arrow-up text-2xl"></i>
                  </div>
                </div>
              </div>
            </div>

            <div class="col-12 md:col-3">
              <div class="stat-card">
                <div class="flex align-items-center justify-content-between">
                  <div>
                    <span class="block stat-label font-medium mb-2">Saldo del Período</span>
                    <div class="font-bold text-3xl" :class="saldo >= 0 ? 'text-green-400' : 'text-red-400'">
                      {{ saldo >= 0 ? '+' : '' }}${{ saldo.toLocaleString('es-AR') }}
                    </div>
                  </div>
                  <div class="stat-icon" :class="saldo >= 0 ? 'bg-blue' : 'bg-orange'">
                    <i class="pi pi-wallet text-2xl"></i>
                  </div>
                </div>
              </div>
            </div>

            <div class="col-12 md:col-3">
              <div class="stat-card">
                <div class="flex align-items-center justify-content-between">
                  <div>
                    <span class="block stat-label font-medium mb-2">Total Movimientos</span>
                    <div class="stat-value font-bold text-3xl">{{ movimientosFiltrados.length }}</div>
                  </div>
                  <div class="stat-icon bg-purple">
                    <i class="pi pi-list text-2xl"></i>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Filtros -->
          <div class="card mb-4">
            <h3 class="mb-3">Filtros</h3>
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
                <label class="block text-sm font-medium mb-2">Categoría</label>                <Dropdown 
                  v-model="filtros.categoria" 
                  :options="categorias"
                  optionLabel="label"
                  optionValue="value"
                  placeholder="Todas las categorías"
                  :showClear="true"
                  @change="aplicarFiltros"
                />
              </div>
            </div>
          </div>

          <!-- Tabla de movimientos -->
          <div class="card">
            <DataTable 
              :value="movimientosFiltrados" 
              :loading="loading"
              :paginator="true"
              :rows="15"
              :rowsPerPageOptions="[10, 15, 25]"
              dataKey="id"
              responsiveLayout="scroll"
              :sortField="'fecha'"
              :sortOrder="-1"
              class="p-datatable-striped"
            >
              <template #header>
                <div class="flex justify-content-between align-items-center">
                  <span class="p-input-icon-left">
                    <i class="pi pi-search" />
                    <InputText v-model="busqueda" placeholder="Buscar..." @input="aplicarFiltros" />
                  </span>
                  <Button 
                    icon="pi pi-refresh" 
                    @click="cargarMovimientos" 
                    :loading="loading"
                    outlined
                    v-tooltip="'Actualizar datos'"
                  />
                </div>
              </template>

              <Column field="fecha" header="Fecha" sortable>
                <template #body="slotProps">
                  {{ formatFecha(slotProps.data.fecha) }}
                </template>
              </Column>
              
              <Column field="tipo" header="Tipo" sortable>
                <template #body="slotProps">
                  <Tag 
                    :severity="slotProps.data.tipo === 'ingreso' ? 'success' : 'danger'"
                    :value="slotProps.data.tipo === 'ingreso' ? 'Ingreso' : 'Egreso'"
                    :icon="slotProps.data.tipo === 'ingreso' ? 'pi pi-arrow-down' : 'pi pi-arrow-up'"
                  />
                </template>
              </Column>
              
              <Column field="categoria" header="Categoría" sortable />
              <Column field="concepto" header="Concepto" sortable />
              
              <Column field="empleadoNombre" header="Empleado" sortable>
                <template #body="slotProps">
                  <span v-if="slotProps.data.empleadoNombre" class="flex align-items-center gap-2">
                    <i class="pi pi-user text-sm text-gray-400"></i>
                    {{ slotProps.data.empleadoNombre }}
                  </span>
                  <span v-else class="text-gray-400">-</span>
                </template>
              </Column>

              <Column field="usuarioRegistro" header="Registrado por" sortable>
                <template #body="slotProps">
                  <span v-if="slotProps.data.usuarioRegistro" class="flex align-items-center gap-2">
                    <i class="pi pi-id-card text-sm text-gray-400"></i>
                    {{ slotProps.data.usuarioRegistro }}
                  </span>
                  <span v-else class="text-gray-400">-</span>
                </template>
              </Column>
              
              <Column field="monto" header="Monto" sortable>
                <template #body="slotProps">
                  <span class="font-bold" :class="slotProps.data.tipo === 'ingreso' ? 'text-green-600' : 'text-red-600'">
                    {{ slotProps.data.tipo === 'ingreso' ? '+' : '-' }}${{ slotProps.data.monto.toLocaleString('es-AR') }}
                  </span>
                </template>
              </Column>
              
              <Column header="Acciones">
                <template #body="slotProps">
                  <div class="flex gap-2">
                    <Button 
                      icon="pi pi-pencil" 
                      size="small"
                      text
                      rounded
                      @click="editarMovimiento(slotProps.data)"
                      v-tooltip="'Editar'"
                    />
                    <Button 
                      icon="pi pi-trash" 
                      size="small"
                      text
                      rounded
                      severity="danger"
                      @click="confirmarEliminar(slotProps.data)"
                      v-tooltip="'Eliminar'"
                    />
                  </div>
                </template>
              </Column>
            </DataTable>
          </div>
        </div>
      </TabPanel>

      <!-- Tab 2: Dashboard Mensual -->
      <TabPanel header="Dashboard Mensual" leftIcon="pi pi-chart-line">
        <DashboardMensual />
      </TabPanel>

      <!-- Tab 3: Dashboard Anual -->
      <TabPanel header="Dashboard Anual" leftIcon="pi pi-chart-bar">
        <DashboardAnual />
      </TabPanel>

      <!-- Tab 4: Reportes -->
      <TabPanel header="Reportes" leftIcon="pi pi-file-pdf">
        <ReporteMovimientos />
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
import TabView from 'primevue/tabview'
import TabPanel from 'primevue/tabpanel'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import Calendar from 'primevue/calendar'
import Dropdown from 'primevue/dropdown'
import Dialog from 'primevue/dialog'
import Tag from 'primevue/tag'
import DashboardMensual from '@/components/movimientos/DashboardMensual.vue'
import DashboardAnual from '@/components/movimientos/DashboardAnual.vue'
import ReporteMovimientos from '@/components/movimientos/ReporteMovimientos.vue'
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
      mov.descripcion?.toLowerCase().includes(termino) ||
      mov.empleadoNombre?.toLowerCase().includes(termino) ||
      mov.usuarioRegistro?.toLowerCase().includes(termino)
    )
  }

  // Filtro por fechas
  if (filtros.value.fechaDesde) {
    resultado = resultado.filter(mov => 
      new Date(mov.fecha) >= filtros.value.fechaDesde
    )
  }
  if (filtros.value.fechaHasta) {
    resultado = resultado.filter(mov => 
      new Date(mov.fecha) <= filtros.value.fechaHasta
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

  return resultado
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
  return new Date(fecha).toLocaleDateString('es-AR')
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
    cargarMovimientos()
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

const onMovimientoGuardado = () => {
  cargarMovimientos()
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
  background: var(--surface-card);
  border: 1px solid var(--surface-border);
  border-radius: 12px;
  padding: 1.5rem;
}

.stat-label {
  color: var(--text-color-secondary);
}

.stat-value {
  color: var(--text-color);
}

.stat-icon {
  width: 3rem;
  height: 3rem;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  flex-shrink: 0;
}

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
