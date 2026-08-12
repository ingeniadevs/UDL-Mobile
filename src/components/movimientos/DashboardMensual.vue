<template>
  <div class="dashboard-mensual">
    <!-- Header con período -->
    <div class="flex justify-content-between align-items-center mb-4">
      <h2 class="text-2xl font-bold m-0">Dashboard Mensual</h2>
      <div class="flex gap-2">
        <Calendar 
          v-model="fechaSeleccionada" 
          view="month" 
          dateFormat="mm/yy"
          :showIcon="true"
          iconDisplay="input"
          @date-select="cambiarPeriodo"
          placeholder="Mes/Año"
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
      <p class="mt-3 text-gray-500">Cargando dashboard...</p>
    </div>

    <!-- Error state -->
    <div v-else-if="error" class="text-center py-8">
      <i class="pi pi-exclamation-triangle text-4xl text-red-500 mb-3"></i>
      <p class="text-red-500 mb-4">{{ error }}</p>
      <Button label="Reintentar" @click="cargarDatos" />
    </div>

    <!-- Dashboard content -->
    <div v-else-if="dashboard">
      <!-- Tarjetas resumen -->
      <div class="grid mb-4">
        <div class="col-12 md:col-3">
          <div class="stat-card">
            <div class="flex align-items-center gap-3">
              <div class="stat-icon bg-green">
                <i class="pi pi-arrow-down text-xl"></i>
              </div>
              <div>
                <p class="stat-label m-0 mb-1">Total Ingresos</p>
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
                <i class="pi pi-arrow-up text-xl"></i>
              </div>
              <div>
                <p class="stat-label m-0 mb-1">Total Egresos</p>
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
                <p class="stat-label m-0 mb-1">Saldo Neto</p>
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
                <i class="pi pi-list text-xl"></i>
              </div>
              <div>
                <p class="stat-label m-0 mb-1">Período</p>
                <p class="stat-value text-2xl font-bold m-0">
                  {{ dashboard.nombreMes }} {{ dashboard.anio }}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Gráficos -->
      <div class="grid">        <!-- Gráfico ingresos por categoría -->
        <div class="col-12 lg:col-6">
          <div class="card">
            <h3>Ingresos por Categoría</h3>
            <Chart 
              v-if="dashboard.ingresosPorCategoria && dashboard.ingresosPorCategoria.length > 0"
              :key="`ing-${refreshKey}-${dashboard.totalIngresos}`"
              type="doughnut" 
              :data="chartDataIngresosCategoria" 
              :options="chartOptionsCategorias"
              style="height: 300px"
            />
            <div v-else class="text-center py-4 text-gray-500">
              No hay datos de ingresos para mostrar
            </div>
          </div>
        </div>

        <!-- Gráfico egresos por categoría -->
        <div class="col-12 lg:col-6">
          <div class="card">
            <h3>Egresos por Categoría</h3>
            <Chart 
              v-if="dashboard.egresosPorCategoria && dashboard.egresosPorCategoria.length > 0"
              :key="`egr-${refreshKey}-${dashboard.totalEgresos}`"
              type="doughnut" 
              :data="chartDataEgresosCategoria" 
              :options="chartOptionsCategorias"
              style="height: 300px"
            />
            <div v-else class="text-center py-4 text-gray-500">
              No hay datos de egresos para mostrar
            </div>
          </div>
        </div>        <!-- Gráfico evolución diaria -->
        <div class="col-12">
          <div class="card">
            <h3>Evolución Diaria</h3>
            <Chart 
              v-if="dashboard.evolucionDiaria && dashboard.evolucionDiaria.length > 0"
              :key="`evo-${refreshKey}-${dashboard.saldo}`"
              type="line" 
              :data="chartDataDiario" 
              :options="chartOptionsDiario"
              style="height: 300px"
            />
            <div v-else class="text-center py-4 text-gray-500">
              No hay datos para mostrar
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
import Tag from 'primevue/tag'

const props = defineProps({
  refreshKey: { type: Number, default: 0 }
})
const loading = ref(false)
const error = ref(null)
const dashboard = ref(null)
const fechaSeleccionada = ref(new Date())

// Cargar datos del dashboard
const cargarDatos = async () => {
  try {
    loading.value = true
    error.value = null
    dashboard.value = null

    const anio = fechaSeleccionada.value.getFullYear()
    const mes = fechaSeleccionada.value.getMonth() + 1

    dashboard.value = await movimientosService.getDashboardMensual(anio, mes)
  } catch (err) {
    console.error('Error cargando dashboard:', err)
    error.value = 'Error al cargar los datos del dashboard'
  } finally {
    loading.value = false
  }
}

// Cambiar período
const cambiarPeriodo = () => {
  cargarDatos()
}

// Formatear fecha
const formatFecha = (fecha) => {
  return new Date(fecha).toLocaleDateString('es-AR')
}

// Colores para gráficos de categorías
const coloresIngresos = ['#10B981','#34D399','#6EE7B7','#059669','#047857','#065F46','#6366F1','#8B5CF6','#EC4899','#06B6D4']
const coloresEgresos  = ['#EF4444','#F87171','#FCA5A5','#DC2626','#B91C1C','#991B1B','#F59E0B','#F97316','#06B6D4','#8B5CF6']

// Data para gráfico ingresos por categoría
const chartDataIngresosCategoria = computed(() => {
  const items = dashboard.value?.ingresosPorCategoria ?? []
  return {
    labels: items.map(i => i.categoriaLabel || i.categoria),
    datasets: [{
      data: items.map(i => i.monto),
      backgroundColor: coloresIngresos.slice(0, items.length),
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
      backgroundColor: coloresEgresos.slice(0, items.length),
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
        label: (ctx) => `${ctx.label}: $${ctx.parsed.toLocaleString('es-AR')}`
      }
    }
  }
}

// Data para gráfico diario — evolucionDiaria: [{dia, ingresos, egresos}]
const chartDataDiario = computed(() => {
  const items = dashboard.value?.evolucionDiaria ?? []
  return {
    labels: items.map(i => `Día ${i.dia}`),
    datasets: [
      {
        label: 'Ingresos',
        data: items.map(i => i.ingresos),
        borderColor: '#10B981',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        tension: 0.4,
        fill: true
      },
      {
        label: 'Egresos',
        data: items.map(i => i.egresos),
        borderColor: '#EF4444',
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        tension: 0.4,
        fill: true
      }
    ]
  }
})

// Opciones para gráfico diario
const chartOptionsDiario = {
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

onMounted(() => {
  cargarDatos()
})

watch(() => props.refreshKey, () => {
  cargarDatos()
})
</script>

<style scoped>
.dashboard-mensual {
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
