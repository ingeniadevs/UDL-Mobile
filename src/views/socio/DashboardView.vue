<template>
  <div>
    <PageHeader :title="`¡Bienvenido, ${authStore.user?.nombre}!`" />
    
    <!-- Quick Stats -->
    <div class="grid">
      <div class="col-12 md:col-6 lg:col-4">
        <div class="stat-card">
          <div class="flex align-items-center justify-content-between">          <div>
              <span class="block text-sm mb-2" style="color: var(--text-color-secondary)">Pagos Pendientes</span>
              <div class="font-bold text-3xl" style="color: var(--text-color)">{{ stats.pagosPendientes }}</div>
            </div>
            <div class="stat-icon bg-yellow">
              <i class="pi pi-clock text-2xl"></i>
            </div>
          </div>
          <span class="text-yellow-400 font-medium text-sm">${{ stats.montoPendiente?.toLocaleString() }} pendiente</span>
        </div>
      </div>

      <div class="col-12 md:col-6 lg:col-4">
        <div class="stat-card">
          <div class="flex align-items-center justify-content-between">          <div>
              <span class="block text-sm mb-2" style="color: var(--text-color-secondary)">Disciplinas Activas</span>
              <div class="font-bold text-3xl" style="color: var(--text-color)">{{ stats.disciplinasActivas }}</div>
            </div>
            <div class="stat-icon bg-red">
              <i class="pi pi-bookmark text-2xl"></i>
            </div>
          </div>
          <span class="text-gray-400 font-medium text-sm">Inscripciones</span>
        </div>
      </div>      <div class="col-12 md:col-6 lg:col-4">
        <div class="stat-card cuota-desglose-card">
          <div class="flex align-items-center justify-content-between mb-3">
            <span class="text-sm font-semibold" style="color: var(--text-color)">💰 Mi Cuota Mensual</span>
            <div class="stat-icon-small bg-green">
              <i class="pi pi-dollar"></i>
            </div>
          </div>
            <!-- Desglose -->
          <div class="cuota-items mb-3">
            <div class="cuota-row">
              <span class="text-xs" style="color: var(--text-color-secondary)">Plan de Membresía</span>
              <span class="font-bold text-green-400">${{ stats.cuotaBase?.toLocaleString() || '0' }}</span>
            </div>
          </div>
          
          <Divider class="my-2" />
          
          <!-- Total -->
          <div class="flex justify-content-between align-items-center">
            <span class="font-bold text-sm" style="color: var(--text-color)">Total mensual</span>
            <span class="font-bold text-xl" style="color: var(--primary-color)">${{ stats.cuotaBase?.toLocaleString() }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Recent Payments -->
    <div class="grid mt-4">
      <div class="col-12 lg:col-6">
        <div class="card">          <div class="flex align-items-center justify-content-between mb-4">
            <h3 class="text-xl font-semibold m-0" style="color: var(--text-color)">Próximos Vencimientos</h3>
            <Button label="Ver todos" text size="small" @click="goToPagos" />
          </div>
          <div class="mobile-card-list">
            <MobileRecordCard
              v-for="pago in proximosPagos"
              :key="pago.id"
              :title="pago.concepto"
              :subtitle="formatDate(pago.fechaVencimiento)"
            >
              <template #tags>
                <Tag :severity="getEstadoSeverity(pago.estado)" :value="pago.estado" />
              </template>
              <template #body>
                <div class="record-card__row">
                  <span class="record-card__label">Monto</span>
                  <span class="record-card__value">${{ pago.monto?.toLocaleString() }}</span>
                </div>
              </template>
            </MobileRecordCard>
            <div v-if="proximosPagos.length === 0" class="text-center text-gray-400 py-3">No hay pagos pendientes</div>
          </div>
        </div>
      </div>

      <div class="col-12 lg:col-6">
        <div class="card">          <div class="flex align-items-center justify-content-between mb-4">
            <h3 class="text-xl font-semibold m-0" style="color: var(--text-color)">Mis Disciplinas</h3>
          </div>
          <div v-if="disciplinas.length === 0" class="text-center text-gray-400 py-4">
            No estás inscrito en ninguna disciplina
          </div>
          <div v-else class="flex flex-column gap-3">
            <div v-for="disc in disciplinas" :key="disc.id" class="discipline-item flex align-items-center justify-content-between p-3 border-round">
              <div class="flex align-items-center gap-3">
                <div class="discipline-icon flex align-items-center justify-content-center border-circle">
                  <i class="pi pi-bookmark text-white"></i>
                </div>              <div>
                  <span class="font-medium" style="color: var(--text-color)">{{ disc.disciplinaNombre }}</span>
                  <div class="text-sm" style="color: var(--text-color-secondary)">Desde {{ formatDate(disc.fechaInicio) }}</div>
                </div>
              </div>
              <div class="flex flex-column align-items-end gap-1">
                <Tag :severity="disc.activa ? 'success' : 'danger'" :value="disc.activa ? 'Activa' : 'Inactiva'" />
                <span v-if="disc.cuotaMensual > 0" class="text-sm font-bold text-orange-400">${{ disc.cuotaMensual?.toLocaleString() }}/mes</span>
                <span v-else class="text-xs text-gray-500">Sin cuota</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Historial de Pagos -->
    <div class="grid mt-4">
      <div class="col-12">
        <div class="card">
          <div class="flex align-items-center justify-content-between mb-4">
            <h3 class="text-xl font-semibold m-0" style="color: var(--text-color)">
              <i class="pi pi-history mr-2"></i>Historial de Pagos
            </h3>
            <Button label="Ver todos" text size="small" @click="goToPagos" />
          </div>

          <!-- Filtros rápidos -->
          <div class="flex gap-2 mb-3 flex-wrap">
            <Button
              v-for="f in filtrosHistorial"
              :key="f.value"
              :label="f.label"
              :outlined="filtroHistorial !== f.value"
              size="small"
              @click="filtroHistorial = f.value"
            />
          </div>

          <div v-if="historialFiltrado.length === 0" class="text-center text-gray-400 py-3">
            Sin pagos en el historial
          </div>
          <template v-else>
            <div class="mobile-card-list">
              <MobileRecordCard
                v-for="pago in paginatedHistorial"
                :key="pago.id"
                :title="pago.concepto"
                :subtitle="formatDate(pago.fechaPago || pago.fechaCreacion)"
              >
                <template #tags>
                  <Tag :severity="getEstadoSeverity(pago.estado)" :value="pago.estado" />
                </template>
                <template #body>
                  <div v-if="pago.tipo" class="record-card__row">
                    <span class="record-card__label">Tipo</span>
                    <span class="record-card__value">{{ pago.tipo }}</span>
                  </div>
                  <div class="record-card__row">
                    <span class="record-card__label">Monto</span>
                    <span class="record-card__value">${{ pago.monto?.toLocaleString('es-AR') }}</span>
                  </div>
                  <div class="record-card__row">
                    <span class="record-card__label">Método</span>
                    <span class="record-card__value">{{ pago.metodoPago || '-' }}</span>
                  </div>
                </template>
              </MobileRecordCard>
            </div>
            <MobilePaginator v-model:page="historialPage" :rows="8" :total="historialFiltrado.length" />
          </template>
        </div>
      </div>
    </div>

    <!-- Reservas próximas -->
    <div class="grid mt-4">
      <div class="col-12">
        <div class="card">
          <div class="flex align-items-center justify-content-between mb-4">
            <h3 class="text-xl font-semibold m-0" style="color: var(--text-color)">
              <i class="pi pi-calendar mr-2"></i>Mis Próximas Reservas
            </h3>
            <Button label="Ver todas" text size="small" @click="router.push('/socio/reservas')" />
          </div>

          <div v-if="loadingReservas" class="flex justify-content-center py-4">
            <i class="pi pi-spin pi-spinner text-2xl text-gray-400"></i>
          </div>

          <div v-else-if="proximasReservas.length === 0" class="text-center text-gray-400 py-4">
            <i class="pi pi-calendar-times text-3xl mb-2 block"></i>
            No tenés reservas próximas
          </div>

          <div v-else class="mobile-card-list">
            <MobileRecordCard
              v-for="r in proximasReservas"
              :key="r.id"
              :title="r.espacioNombre"
              :subtitle="`${formatDateReserva(r.fecha)} · ${r.horaInicio} – ${r.horaFin}`"
            >
              <template #tags>
                <Tag :severity="getEstadoReservaSeverity(r.estado)" :value="r.estado" size="small" />
              </template>
              <template #body>
                <div class="record-card__row">
                  <span class="record-card__label">Monto</span>
                  <span class="record-card__value">${{ r.monto?.toLocaleString() }}</span>
                </div>
                <div v-if="r.estadoPago" class="record-card__row">
                  <span class="record-card__label">Pago</span>
                  <Tag :severity="r.estadoPago === 'pagado' ? 'success' : 'warning'" :value="r.estadoPago" size="small" />
                </div>
              </template>
            </MobileRecordCard>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { sociosService, reservasService, pedidosService } from '@/services'
import { planesService } from '@/services/planesService'
import { useMobilePagination } from '@/composables/useMobilePagination'
import PageHeader from '@/components/mobile/PageHeader.vue'
import MobileRecordCard from '@/components/mobile/MobileRecordCard.vue'
import MobilePaginator from '@/components/mobile/MobilePaginator.vue'
import Tag from 'primevue/tag'
import Button from 'primevue/button'
import Divider from 'primevue/divider'

const router = useRouter()
const authStore = useAuthStore()

const stats = ref({
  pagosPendientes: 0,
  montoPendiente: 0,
  disciplinasActivas: 0,
  cuotaMensual: 0,
  cuotaBase: 0,
  cuotaDisciplinasIncluidas: 0,
  cuotaDisciplinasApartadas: 0
})

const proximosPagos = ref([])
const disciplinas = ref([])
const proximasReservas = ref([])
const loadingReservas = ref(false)
const historialPagos = ref([])
const filtroHistorial = ref('todos')
const filtrosHistorial = [
  { label: 'Todos', value: 'todos' },
  { label: 'Cuotas', value: 'cuota' },
  { label: 'Reservas', value: 'reserva' },
  { label: 'Disciplinas', value: 'disciplina' },
  { label: 'Tienda', value: 'tienda' },
  { label: 'Pendientes', value: 'pendiente' },
  { label: 'Pagados', value: 'pagado' }
]

const historialFiltrado = computed(() => {
  if (filtroHistorial.value === 'todos') return historialPagos.value
  if (filtroHistorial.value === 'pagado') return historialPagos.value.filter(p => p.estado?.toLowerCase() === 'pagado')
  if (filtroHistorial.value === 'pendiente') return historialPagos.value.filter(p => ['pendiente','vencido'].includes(p.estado?.toLowerCase()))
  return historialPagos.value.filter(p => p.tipo?.toLowerCase().includes(filtroHistorial.value))
})

const { page: historialPage, paginated: paginatedHistorial } = useMobilePagination(
  historialFiltrado,
  8,
  [filtroHistorial]
)

function formatDate(date) {
  if (!date) return '-'
  return new Date(date).toLocaleDateString('es-ES')
}

function getEstadoSeverity(estado) {
  switch (estado?.toLowerCase()) {
    case 'pagado': return 'success'
    case 'pendiente': return 'warning'
    case 'vencido': return 'danger'
    default: return 'info'
  }
}

function goToPagos() {
  router.push('/socio/pagos')
}

function formatDateReserva(fecha) {
  if (!fecha) return '-'
  // fecha puede ser 'YYYY-MM-DD' o ISO string
  const datePart = typeof fecha === 'string' ? fecha.substring(0, 10) : fecha.toISOString().substring(0, 10)
  const [y, m, d] = datePart.split('-')
  return `${d}/${m}/${y}`
}

function getEstadoReservaSeverity(estado) {
  switch (estado?.toLowerCase()) {
    case 'confirmada': return 'success'
    case 'pendiente': return 'warning'
    case 'cancelada': return 'danger'
    default: return 'info'
  }
}

async function loadData() {
  try {
    const socioData = await sociosService.getById(authStore.user.id)
    
    // Obtener precio del plan de membresía
    let cuotaBase = 0
    if (socioData.planMembresiaId) {
      try {
        const planData = await planesService.getById(socioData.planMembresiaId)
        cuotaBase = planData.precioMensual || 0
      } catch {
        cuotaBase = 0
      }
    }
    stats.value.cuotaBase = cuotaBase
    
    // Cargar disciplinas
    disciplinas.value = socioData.inscripciones || []
    stats.value.disciplinasActivas = disciplinas.value.filter(d => d.activa).length

    const activas = disciplinas.value.filter(d => d.activa)
    stats.value.cuotaDisciplinasIncluidas = activas
      .filter(d => d.tipoFacturacion === 'IncluidaEnCuotaSocial')
      .reduce((sum, d) => sum + (d.cuotaMensual || 0), 0)
    stats.value.cuotaDisciplinasApartadas = activas
      .filter(d => d.tipoFacturacion === 'PagoApartado')
      .reduce((sum, d) => sum + (d.cuotaMensual || 0), 0)

    stats.value.cuotaMensual = stats.value.cuotaBase + stats.value.cuotaDisciplinasIncluidas
    
    // Pagos pendientes
    const todosLosPagos = (socioData.pagos || [])
    const pendientes = todosLosPagos.filter(p =>
      p.estado?.toLowerCase() === 'pendiente' || p.estado?.toLowerCase() === 'vencido'
    )
    stats.value.pagosPendientes = pendientes.length
    stats.value.montoPendiente = pendientes.reduce((sum, p) => sum + p.monto, 0)
    proximosPagos.value = pendientes.slice(0, 5)

    // Historial completo con tipo inferido
    const pagosHistorial = todosLosPagos
      .map(p => ({
        ...p,
        tipo: p.subcomisionId ? 'Disciplina' : p.concepto?.toLowerCase().includes('reserva') ? 'Reserva' : 'Cuota Social',
        fechaCreacion: p.createdAt || p.fechaPago
      }))

    // Incluir reservas pagadas (efectivo/aprobadas por admin) que no tengan pago asociado
    let reservasHistorial = []
    try {
      const misReservas = await reservasService.getMisReservas()
      reservasHistorial = misReservas
        .filter(r => r.estadoPago?.toLowerCase() === 'pagado' && r.monto > 0)
        .map(r => ({
          id: `reserva-${r.id}`,
          concepto: `Reserva — ${r.espacioNombre || r.espacio?.nombre || 'Espacio'}`,
          tipo: 'Reserva',
          estado: 'Pagado',
          monto: r.monto,
          fechaPago: r.fechaPago || r.fecha,
          fechaCreacion: r.fechaPago || r.fecha || r.createdAt,
          metodoPago: r.metodoPago
        }))
    } catch { /* silencioso */ }

    historialPagos.value = [...pagosHistorial, ...reservasHistorial]
      .sort((a, b) => new Date(b.fechaCreacion || 0) - new Date(a.fechaCreacion || 0))

    // Incluir pedidos de tienda pagados
    try {
      const misPedidos = await pedidosService.getMisPedidos()
      const pedidosHistorial = misPedidos
        .map(p => ({
          id: `pedido-${p.id}`,
          concepto: `Tienda — Pedido #${p.id?.slice(-6).toUpperCase()}`,
          tipo: 'Tienda',
          estado: p.estadoPago || p.estado || 'Pendiente',
          monto: p.total,
          fechaPago: p.estadoPago?.toLowerCase() === 'pagado' ? p.fechaPedido : null,
          fechaCreacion: p.fechaPedido,
          metodoPago: p.metodoPago
        }))
      historialPagos.value = [...historialPagos.value, ...pedidosHistorial]
        .sort((a, b) => new Date(b.fechaCreacion || 0) - new Date(a.fechaCreacion || 0))
    } catch { /* silencioso */ }
  } catch (error) {
    console.error('Error loading dashboard:', error)
  }
}

onMounted(() => {
  loadData()
  loadReservas()
})

async function loadReservas() {
  loadingReservas.value = true
  try {
    const todas = await reservasService.getMisReservas()
    const hoy = new Date().toISOString().substring(0, 10)
    proximasReservas.value = todas
      .filter(r => {
        const fecha = typeof r.fecha === 'string' ? r.fecha.substring(0, 10) : r.fecha
        return fecha >= hoy && r.estado?.toLowerCase() !== 'cancelada'
      })
      .sort((a, b) => a.fecha.localeCompare(b.fecha))
      .slice(0, 6)
  } catch (e) {
    console.error('Error cargando reservas:', e)
  } finally {
    loadingReservas.value = false
  }
}
</script>

<style scoped>
.stat-card {
  background: var(--surface-card);
  border: 1px solid var(--surface-border);
  border-radius: 12px;
  padding: 1.5rem;
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

.stat-icon.bg-red {
  background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%);
}

.stat-icon.bg-yellow {
  background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
}

.stat-icon.bg-green {
  background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);
}

.stat-icon-small {
  width: 2.5rem;
  height: 2.5rem;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
}

.stat-icon-small.bg-green {
  background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);
}

.cuota-desglose-card {
  border-left: 4px solid #22c55e;
  background: linear-gradient(135deg, rgba(34, 197, 94, 0.05) 0%, transparent 100%);
}

.cuota-items {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.cuota-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.6rem 0.8rem;
  background: var(--surface-card);
  border-radius: 8px;
  border: 1px solid var(--surface-border);
}

.discipline-item {
  background: var(--surface-hover);
  border: 1px solid var(--surface-border);
}

.discipline-icon {
  width: 2.5rem;
  height: 2.5rem;
  background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%);
}
</style>
