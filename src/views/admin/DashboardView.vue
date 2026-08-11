<template>
  <div>
    <div class="flex justify-content-between align-items-center mb-4">
      <h1 class="text-3xl font-bold page-title m-0">Dashboard Financiero</h1>
    </div>
    
    <!-- Stats Cards -->
    <div class="grid">
      <div class="col-12 md:col-6 lg:col-3">
        <div class="stat-card">
          <div class="flex align-items-center justify-content-between">
            <div>
              <span class="block stat-label font-medium mb-2">Total Socios</span>
              <div class="stat-value font-bold text-3xl">{{ stats.totalSocios }}</div>
            </div>
            <div class="stat-icon bg-blue">
              <i class="pi pi-users text-2xl"></i>
            </div>
          </div>
          <div class="flex justify-content-between mt-2">
            <span class="text-green-400 font-medium text-sm">{{ stats.sociosActivos }} activos</span>
            <span v-if="stats.sociosPendientesAprobacion > 0" class="text-yellow-400 font-medium text-sm">
              {{ stats.sociosPendientesAprobacion }} pendientes
            </span>
          </div>
        </div>
      </div>      <div class="col-12 md:col-6 lg:col-3">
        <div class="stat-card">
          <div class="flex align-items-center justify-content-between">
            <div>
              <span class="block stat-label font-medium mb-2">Ingresos del Mes</span>
              <div class="stat-value font-bold text-3xl">${{ formatNumber(stats.totalIngresos) }}</div>
            </div>
            <div class="stat-icon bg-green">
              <i class="pi pi-dollar text-2xl"></i>
            </div>
          </div>
          <div class="flex justify-content-between mt-2">
            <span class="text-green-400 font-medium text-sm">Balance: ${{ formatNumber(stats.balanceNeto) }}</span>
            <span class="text-blue-400 font-medium text-sm">Cuota: ${{ stats.valorCuotaSocioPromedio?.toFixed(0) }}</span>
          </div>
        </div>
      </div>

      <div class="col-12 md:col-6 lg:col-3">
        <div class="stat-card">
          <div class="flex align-items-center justify-content-between">
            <div>
              <span class="block stat-label font-medium mb-2">Pagos Pendientes</span>
              <div class="stat-value font-bold text-3xl">{{ stats.cantidadPagosPendientes }}</div>
            </div>
            <div class="stat-icon bg-yellow">
              <i class="pi pi-clock text-2xl"></i>
            </div>
          </div>
          <span class="text-yellow-400 font-medium text-sm">${{ stats.pagosPendientes?.toLocaleString() }}</span>
        </div>
      </div>

      <div class="col-12 md:col-6 lg:col-3">
        <div class="stat-card">
          <div class="flex align-items-center justify-content-between">
            <div>
              <span class="block stat-label font-medium mb-2">Disciplinas</span>
              <div class="stat-value font-bold text-3xl">{{ stats.totalDisciplinas }}</div>
            </div>
            <div class="stat-icon bg-red">
              <i class="pi pi-bookmark text-2xl"></i>
            </div>
          </div>
          <span class="stat-label font-medium text-sm">{{ stats.inscripcionesActivas }} inscripciones</span>
        </div>
      </div>
    </div>    <!-- Desglose de Ingresos -->
    <div class="grid mt-4">
      <div class="col-12 lg:col-8">
        <div class="card">
          <h3 class="text-xl font-semibold mb-4 card-title">Ingresos por Categoría</h3>
          <div class="grid">
            <div class="col-12 md:col-6">
              <div class="ingreso-item">
                <div class="flex align-items-center justify-content-between mb-2">
                  <span class="font-medium">💰 Cuotas Sociales</span>
                  <span class="text-green-400 font-bold">${{ stats.ingresosCuotasSociales?.toLocaleString() }}</span>
                </div>
                <ProgressBar :value="getPercentage(stats.ingresosCuotasSociales)" :showValue="false" class="progress-custom" />
              </div>
            </div>
            <div class="col-12 md:col-6">
              <div class="ingreso-item">
                <div class="flex align-items-center justify-content-between mb-2">
                  <span class="font-medium">🏃 Disciplinas</span>
                  <span class="text-green-400 font-bold">${{ stats.ingresosDisciplinas?.toLocaleString() }}</span>
                </div>
                <ProgressBar :value="getPercentage(stats.ingresosDisciplinas)" :showValue="false" class="progress-custom" />
              </div>
            </div>
            <div class="col-12 md:col-6">
              <div class="ingreso-item">
                <div class="flex align-items-center justify-content-between mb-2">
                  <span class="font-medium">📅 Reservas</span>
                  <span class="text-green-400 font-bold">${{ stats.ingresosReservas?.toLocaleString() }}</span>
                </div>
                <div class="flex justify-content-between text-xs text-gray-400 mb-1">
                  <span>{{ stats.reservasDelMes || 0 }} reservas</span>
                  <span v-if="stats.cantidadReservasPendientes > 0" class="text-yellow-400">
                    {{ stats.cantidadReservasPendientes }} pendientes
                  </span>
                </div>
                <ProgressBar :value="getPercentage(stats.ingresosReservas)" :showValue="false" class="progress-custom" />
              </div>
            </div>
            <div class="col-12 md:col-6">
              <div class="ingreso-item">
                <div class="flex align-items-center justify-content-between mb-2">
                  <span class="font-medium">🎉 Eventos</span>
                  <span class="text-green-400 font-bold">${{ stats.ingresosEventos?.toLocaleString() }}</span>
                </div>
                <ProgressBar :value="getPercentage(stats.ingresosEventos)" :showValue="false" class="progress-custom" />
              </div>
            </div>
            <div class="col-12 md:col-6">
              <div class="ingreso-item">
                <div class="flex align-items-center justify-content-between mb-2">
                  <span class="font-medium">🛒 Pedidos</span>
                  <span class="text-green-400 font-bold">${{ stats.ingresosPedidos?.toLocaleString() }}</span>
                </div>
                <div class="flex justify-content-between text-xs text-gray-400 mb-1">
                  <span>{{ stats.pedidosDelMes || 0 }} pedidos</span>
                </div>
                <ProgressBar :value="getPercentage(stats.ingresosPedidos)" :showValue="false" class="progress-custom" />
              </div>
            </div>
            <div class="col-12 md:col-6">
              <div class="ingreso-item">
                <div class="flex align-items-center justify-content-between mb-2">
                  <span class="font-medium">➕ Otros</span>
                  <span class="text-green-400 font-bold">${{ stats.ingresosOtros?.toLocaleString() }}</span>
                </div>
                <ProgressBar :value="getPercentage(stats.ingresosOtros)" :showValue="false" class="progress-custom" />
              </div>
            </div>
          </div>
        </div>
      </div>      <div class="col-12 lg:col-4">
        <div class="card">
          <h3 class="text-xl font-semibold mb-4 card-title">Resumen</h3>
          <div class="flex flex-column gap-3">
            <div class="resumen-item">
              <i class="pi pi-arrow-up text-green-400"></i>
              <div class="ml-3 flex-1">
                <div class="text-sm text-gray-400">Total Ingresos</div>
                <div class="font-bold text-lg">${{ stats.totalIngresos?.toLocaleString() }}</div>
              </div>
            </div>
            <div class="resumen-item">
              <i class="pi pi-arrow-down text-red-400"></i>
              <div class="ml-3 flex-1">
                <div class="text-sm text-gray-400">Total Egresos</div>
                <div class="font-bold text-lg">${{ stats.totalEgresos?.toLocaleString() }}</div>
                <div class="text-xs text-gray-500 mt-1">
                  Eventos: ${{ stats.egresosEventos?.toLocaleString() }} • 
                  Sueldos: ${{ stats.egresosSueldos?.toLocaleString() }}
                </div>
              </div>
            </div>
            <Divider />
            <div class="resumen-item">
              <i class="pi pi-wallet text-blue-400"></i>
              <div class="ml-3 flex-1">
                <div class="text-sm text-gray-400">Balance Neto</div>
                <div class="font-bold text-xl" :class="stats.balanceNeto >= 0 ? 'text-green-400' : 'text-red-400'">
                  ${{ stats.balanceNeto?.toLocaleString() }}
                </div>
              </div>
            </div>
            <Divider />
            <div class="resumen-item bg-blue-900 bg-opacity-20">
              <i class="pi pi-star-fill text-yellow-400"></i>
              <div class="ml-3 flex-1">
                <div class="text-sm text-gray-400">Cuota Socio Promedio</div>
                <div class="font-bold text-lg text-blue-400">
                  ${{ stats.valorCuotaSocioPromedio?.toFixed(2) }}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Recent Activity -->
    <div class="grid mt-4">
      <div class="col-12 lg:col-6">
        <div class="card">
          <h3 class="text-xl font-semibold mb-4 card-title">Últimos Pagos</h3>
          <div class="mobile-card-list">
            <MobileRecordCard
              v-for="pago in stats.ultimosPagos"
              :key="pago.id || `${pago.socioNombre}-${pago.concepto}`"
              :title="pago.socioNombre"
              :subtitle="pago.concepto"
            >
              <template #tags>
                <Tag severity="success" value="Pagado" icon="pi pi-check" />
              </template>
              <template #body>
                <div class="record-card__row">
                  <span class="record-card__label">Monto</span>
                  <span class="record-card__value">${{ pago.monto?.toLocaleString() }}</span>
                </div>
              </template>
            </MobileRecordCard>
            <div v-if="!stats.ultimosPagos?.length" class="text-center text-color-secondary py-3">Sin pagos recientes</div>
          </div>
        </div>
      </div>

      <div class="col-12 lg:col-6">
        <div class="card">
          <h3 class="text-xl font-semibold mb-4 card-title">Pagos Pendientes</h3>
          <div class="mobile-card-list">
            <MobileRecordCard
              v-for="pago in stats.pagosPendientesDetalle"
              :key="pago.id || `${pago.socioNombre}-${pago.concepto}`"
              :title="pago.socioNombre"
              :subtitle="pago.concepto"
            >
              <template #body>
                <div class="record-card__row">
                  <span class="record-card__label">Monto</span>
                  <span class="record-card__value">${{ pago.monto?.toLocaleString() }}</span>
                </div>
                <div class="record-card__row">
                  <span class="record-card__label">Vencimiento</span>
                  <span class="record-card__value" :class="isVencido(pago.fecha) ? 'text-red-400' : ''">{{ formatFecha(pago.fecha) }}</span>
                </div>
              </template>
            </MobileRecordCard>
            <div v-if="!stats.pagosPendientesDetalle?.length" class="text-center text-color-secondary py-3">Sin pagos pendientes</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { estadisticasService } from '@/services'
import { useAuthStore } from '@/stores/auth'
import { useToast } from 'primevue/usetoast'
import Tag from 'primevue/tag'
import MobileRecordCard from '@/components/mobile/MobileRecordCard.vue'
import ProgressBar from 'primevue/progressbar'
import Divider from 'primevue/divider'

const authStore = useAuthStore()
const { hasPermiso } = authStore
const toast = useToast()

const stats = ref({
  totalSocios: 0,
  sociosActivos: 0,
  sociosPendientesAprobacion: 0,
  totalDisciplinas: 0,
  inscripcionesActivas: 0,
  cantidadPagosPendientes: 0,
  pagosPendientes: 0,
  cantidadReservasPendientes: 0,
  reservasPendientes: 0,
  ingresosCuotasSociales: 0,
  ingresosDisciplinas: 0,
  ingresosReservas: 0,
  ingresosEventos: 0,
  ingresosPedidos: 0,
  ingresosOtros: 0,
  totalIngresos: 0,
  totalEgresos: 0,
  egresosEventos: 0,
  egresosSueldos: 0,
  balanceNeto: 0,
  ultimosPagos: [],
  pagosPendientesDetalle: [],
  reservasDelMes: 0,
  eventosActivos: 0,
  pedidosDelMes: 0,
  empleadosActivos: 0,
  valorCuotaSocioPromedio: 0
})

function formatNumber(num) {
  if (!num) return '0'
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M'
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'k'
  }
  return num.toLocaleString()
}

function getPercentage(value) {
  if (!stats.value.totalIngresos || !value) return 0
  return Math.round((value / stats.value.totalIngresos) * 100)
}

function isVencido(fecha) {
  return new Date(fecha) < new Date()
}

function formatFecha(fecha) {
  if (!fecha) return '-'
  return new Date(fecha).toLocaleDateString('es-AR', { 
    day: '2-digit', 
    month: '2-digit', 
    year: 'numeric' 
  })
}

async function loadData() {
  try {
    const data = await estadisticasService.getFinancieras()
    stats.value = data
  } catch (error) {
    console.error('Error loading dashboard data:', error)
    toast.add({ 
      severity: 'error', 
      summary: 'Error', 
      detail: 'No se pudieron cargar las estadísticas', 
      life: 3000 
    })
  }
}

onMounted(() => {
  loadData()
})
</script>

<style scoped>
.page-title {
  color: var(--text-color);
}

.card-title {
  color: var(--text-color);
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
}

.stat-icon.bg-blue {
  background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
}

.stat-icon.bg-red {
  background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%);
}

.stat-icon.bg-yellow {
  background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
}

.stat-icon.bg-green {
  background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);
}

.ingreso-item {
  padding: 1rem;
  background: var(--surface-ground);
  border-radius: 8px;
}

.progress-custom :deep(.p-progressbar) {
  height: 8px;
  background: var(--surface-border);
}

.progress-custom :deep(.p-progressbar-value) {
  background: linear-gradient(90deg, #22c55e 0%, #16a34a 100%);
}

.resumen-item {
  display: flex;
  align-items: center;
  padding: 0.75rem;
  background: var(--surface-ground);
  border-radius: 8px;
}

.resumen-item.bg-blue-900 {
  background: rgba(37, 99, 235, 0.1);
  border: 1px solid rgba(59, 130, 246, 0.3);
}

.resumen-item i {
  font-size: 1.5rem;
}
</style>
