<template>
  <div class="dashboard-anual">
    <!-- Header con año -->
    <div class="flex justify-content-between align-items-center mb-4">
      <h2 class="text-2xl font-bold m-0">Dashboard Anual</h2>
      <div class="flex gap-2">
        <Calendar 
          v-model="anioSeleccionado" 
          view="year" 
          dateFormat="yy"
          :showIcon="true"
          iconDisplay="input"
          @date-select="cambiarAnio"
          placeholder="Año"
        />
        <Button 
          icon="pi pi-refresh" 
          @click="cargarDatos" 
          :loading="loading"
          outlined
          v-tooltip="'Actualizar datos'"
        />
      </div>
    </div>

    <!-- Loading state -->
    <div v-if="loading" class="text-center py-8">
      <ProgressSpinner />
      <p class="mt-3 text-gray-500">Cargando dashboard anual...</p>
    </div>

    <!-- Error state -->
    <div v-else-if="error" class="text-center py-8">
      <i class="pi pi-exclamation-triangle text-4xl text-red-500 mb-3"></i>
      <p class="text-red-500 mb-4">{{ error }}</p>
      <Button label="Reintentar" @click="cargarDatos" />
    </div>

    <!-- Dashboard content -->
    <div v-else-if="dashboard">
      <!-- Tarjetas resumen anuales -->
      <div class="grid mb-4">
        <div class="col-12 md:col-3">
          <div class="stat-card">
            <div class="flex align-items-center gap-3">
              <div class="stat-icon bg-green">
                <i class="pi pi-trending-up text-xl"></i>
              </div>
              <div>
                <p class="stat-label m-0 mb-1">Ingresos {{ anio }}</p>
                <p class="stat-value text-2xl font-bold m-0">
                  ${{ dashboard.totalIngresos.toLocaleString('es-AR') }}
                </p>
              </div>
            </div>
          </div>
        </div>
        
        <div class="col-12 md:col-3">
          <div class="stat-card">
            <div class="flex align-items-center gap-3">
              <div class="stat-icon bg-red">
                <i class="pi pi-trending-down text-xl"></i>
              </div>
              <div>
                <p class="stat-label m-0 mb-1">Egresos {{ anio }}</p>
                <p class="stat-value text-2xl font-bold m-0">
                  ${{ dashboard.totalEgresos.toLocaleString('es-AR') }}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div class="col-12 md:col-3">
          <div class="stat-card">
            <div class="flex align-items-center gap-3">
              <div class="stat-icon" :class="dashboard.saldo >= 0 ? 'bg-blue' : 'bg-orange'">
                <i class="pi pi-wallet text-xl"></i>
              </div>
              <div>
                <p class="stat-label m-0 mb-1">Resultado</p>
                <p class="stat-value text-2xl font-bold m-0" :style="{ color: dashboard.saldo >= 0 ? '#22c55e' : '#f97316' }">
                  {{ dashboard.saldo >= 0 ? '+' : '' }}${{ dashboard.saldo.toLocaleString('es-AR') }}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div class="col-12 md:col-3">
          <div class="stat-card">
            <div class="flex align-items-center gap-3">
              <div class="stat-icon bg-purple">
                <i class="pi pi-calendar text-xl"></i>
              </div>
              <div>
                <p class="stat-label m-0 mb-1">Promedio Mensual Ingresos</p>
                <p class="stat-value text-2xl font-bold m-0">
                  ${{ dashboard.promedioIngresosMensual.toLocaleString('es-AR') }}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Gráficos anuales -->
      <div class="grid">
        <!-- Gráfico de evolución mensual -->
        <div class="col-12">
          <div class="card">
            <h3>Evolución Mensual {{ anio }}</h3>            <Chart 
              v-if="dashboard.evolucionMensual && dashboard.evolucionMensual.length > 0"
              type="bar" 
              :data="chartDataMensual" 
              :options="chartOptionsMensual"
              style="height: 400px"
            />
            <div v-else class="text-center py-4 text-gray-500">
              No hay datos para mostrar
            </div>
          </div>
        </div>        <!-- Gráfico ingresos por categoría anual -->
        <div class="col-12 lg:col-6">
          <div class="card">
            <h3>Ingresos por Categoría</h3>
            <Chart 
              v-if="dashboard.ingresosPorCategoria && dashboard.ingresosPorCategoria.length > 0"
              type="pie" 
              :data="chartDataIngresosCategoria" 
              :options="chartOptionsCategorias"
              style="height: 350px"
            />
            <div v-else class="text-center py-4 text-gray-500">
              No hay datos para mostrar
            </div>
          </div>
        </div>

        <!-- Gráfico egresos por categoría anual -->
        <div class="col-12 lg:col-6">
          <div class="card">
            <h3>Egresos por Categoría</h3>
            <Chart 
              v-if="dashboard.egresosPorCategoria && dashboard.egresosPorCategoria.length > 0"
              type="pie" 
              :data="chartDataEgresosCategoria" 
              :options="chartOptionsCategorias"
              style="height: 350px"
            />
            <div v-else class="text-center py-4 text-gray-500">
              No hay datos para mostrar
            </div>
          </div>
        </div>        <!-- Tabla resumen por mes — evolucionMensual: [{mes, nombreMes, ingresos, egresos, saldo}] -->
        <div class="col-12 lg:col-6">
          <div class="card">
            <h3>Resumen Mensual</h3>
            <DataTable 
              :value="dashboard.evolucionMensual" 
              :paginator="false"
              responsiveLayout="scroll"
              size="small"
            >
              <Column field="nombreMes" header="Mes" />
              <Column field="ingresos" header="Ingresos">
                <template #body="slotProps">
                  <span class="text-green-600">
                    ${{ slotProps.data.ingresos.toLocaleString('es-AR') }}
                  </span>
                </template>
              </Column>
              <Column field="egresos" header="Egresos">
                <template #body="slotProps">
                  <span class="text-red-600">
                    ${{ slotProps.data.egresos.toLocaleString('es-AR') }}
                  </span>
                </template>
              </Column>
              <Column field="saldo" header="Saldo">
                <template #body="slotProps">
                  <span :class="slotProps.data.saldo >= 0 ? 'text-green-600' : 'text-red-600'">
                    {{ slotProps.data.saldo >= 0 ? '+' : '' }}${{ slotProps.data.saldo.toLocaleString('es-AR') }}
                  </span>
                </template>
              </Column>
            </DataTable>
          </div>
        </div>

        <!-- Mejor mes del año -->
        <div class="col-12" v-if="dashboard.mejorMesNombre">
          <div class="card" style="border: 1px solid #ca8a04; background: transparent;">
            <h3><i class="pi pi-star text-yellow-500 mr-2"></i>Mejor Mes del Año</h3>
            <div class="flex align-items-center gap-4">
              <div class="text-center">
                <p class="text-3xl font-bold text-yellow-400 m-0">{{ dashboard.mejorMesNombre }}</p>
                <p class="text-gray-400 mt-1">Mes con mayores ingresos</p>
              </div>
              <div class="text-center" v-if="dashboard.evolucionMensual && dashboard.evolucionMensual[dashboard.mejorMesIdx - 1]">
                <p class="text-2xl font-bold text-green-400 m-0">
                  ${{ dashboard.evolucionMensual[dashboard.mejorMesIdx - 1].ingresos.toLocaleString('es-AR') }}
                </p>
                <p class="text-gray-400 mt-1">Ingresos del mes</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, watch } from 'vue'
import { movimientosService } from '@/services'
import Calendar from 'primevue/calendar'
import Button from 'primevue/button'
import ProgressSpinner from 'primevue/progressspinner'
import Chart from 'primevue/chart'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'

const props = defineProps({
  refreshKey: { type: Number, default: 0 }
})

// Estado
const loading = ref(false)
const error = ref(null)
const dashboard = ref(null)
const anioSeleccionado = ref(new Date())

// Computed
const anio = computed(() => anioSeleccionado.value.getFullYear())

// Cargar datos del dashboard
const cargarDatos = async () => {
  try {
    loading.value = true
    error.value = null
    dashboard.value = null

    dashboard.value = await movimientosService.getDashboardAnual(anio.value)
  } catch (err) {
    console.error('Error cargando dashboard anual:', err)
    error.value = 'Error al cargar los datos del dashboard anual'
  } finally {
    loading.value = false
  }
}

// Cambiar año
const cambiarAnio = () => {
  cargarDatos()
}

// Colores para gráficos
const coloresGrafico = [
  '#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6', 
  '#EC4899', '#06B6D4', '#84CC16', '#F97316', '#6366F1'
]

// Data para gráfico mensual — evolucionMensual: [{mes, nombreMes, ingresos, egresos, saldo}]
const chartDataMensual = computed(() => {
  if (!dashboard.value?.evolucionMensual) return {}

  return {
    labels: dashboard.value.evolucionMensual.map(i => i.nombreMes),
    datasets: [
      {
        label: 'Ingresos',
        data: dashboard.value.evolucionMensual.map(i => i.ingresos),
        backgroundColor: 'rgba(16, 185, 129, 0.8)',
        borderColor: '#10B981',
        borderWidth: 2
      },
      {
        label: 'Egresos',
        data: dashboard.value.evolucionMensual.map(i => i.egresos),
        backgroundColor: 'rgba(239, 68, 68, 0.8)',
        borderColor: '#EF4444',
        borderWidth: 2
      }
    ]
  }
})

// Opciones para gráfico mensual
const chartOptionsMensual = {
  responsive: true,
  maintainAspectRatio: false,
  scales: {
    y: {
      beginAtZero: true,
      ticks: {
        color: '#9ca3af',
        callback: function(value) {
          return '$' + value.toLocaleString('es-AR')
        }
      },
      grid: { color: 'rgba(156, 163, 175, 0.15)' }
    },
    x: {
      ticks: { color: '#9ca3af' },
      grid: { color: 'rgba(156, 163, 175, 0.15)' }
    }
  },
  plugins: {
    legend: {
      position: 'top',
      labels: { color: '#9ca3af' }
    },
    tooltip: {
      callbacks: {
        label: function(context) {
          return context.dataset.label + ': $' + context.parsed.y.toLocaleString('es-AR')
        }
      }
    }
  }
}

// Data para gráfico ingresos por categoría
const chartDataIngresosCategoria = computed(() => {
  const items = dashboard.value?.ingresosPorCategoria ?? []
  return {
    labels: items.map(i => i.categoriaLabel || i.categoria),
    datasets: [{
      data: items.map(i => i.monto),
      backgroundColor: coloresGrafico.slice(0, items.length),
      borderWidth: 2,
      borderColor: '#ffffff'
    }]
  }
})

// Data para gráfico egresos por categoría
const chartDataEgresosCategoria = computed(() => {
  const items = dashboard.value?.egresosPorCategoria ?? []
  return {
    labels: items.map(i => i.categoriaLabel || i.categoria),
    datasets: [{
      data: items.map(i => i.monto),
      backgroundColor: coloresGrafico.slice(0, items.length).reverse(),
      borderWidth: 2,
      borderColor: '#ffffff'
    }]
  }
})

// Opciones para gráfico de categorías
const chartOptionsCategorias = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'bottom',
      labels: { color: '#9ca3af' }
    },
    tooltip: {
      callbacks: {
        label: function(context) {
          return context.label + ': $' + context.parsed.toLocaleString('es-AR')
        }
      }
    }
  }
}

onMounted(() => {
  cargarDatos()
})

watch(() => props.refreshKey, () => {
  cargarDatos()
})
</script>

<style scoped>
.dashboard-anual {
  padding: 1rem;
}

.card {
  background: var(--surface-card);
  border: 1px solid var(--surface-border);
  border-radius: 12px;
  padding: 1.5rem;
  margin-bottom: 1rem;
}

.stat-card {
  background: var(--surface-card);
  border: 1px solid var(--surface-border);
  border-radius: 12px;
  padding: 1.5rem;
  margin-bottom: 1rem;
}

.stat-label {
  color: var(--text-color-secondary);
  font-size: 0.875rem;
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

.stat-icon.bg-green { background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%); }
.stat-icon.bg-red { background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%); }
.stat-icon.bg-blue { background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%); }
.stat-icon.bg-orange { background: linear-gradient(135deg, #f97316 0%, #ea580c 100%); }
.stat-icon.bg-purple { background: linear-gradient(135deg, #a855f7 0%, #7c3aed 100%); }

.border-radius {
  border-radius: 8px;
}
</style>
