<template>
  <div>
    <h1 class="text-3xl font-bold page-title mb-4">¡Bienvenido a UDL, {{ authStore.user?.nombre }}!</h1>
    
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
            <div v-if="stats.disciplinasActivas > 0" class="cuota-row">
              <span class="text-xs" style="color: var(--text-color-secondary)">{{ stats.disciplinasActivas }} Disciplina(s)</span>
              <span class="font-bold text-blue-400">${{ stats.cuotaDisciplinas?.toLocaleString() || '0' }}</span>
            </div>
            <div v-else class="cuota-row">
              <span class="text-xs" style="color: var(--text-color-secondary)">Disciplinas</span>
              <span class="font-bold text-gray-500">$0</span>
            </div>
          </div>
          
          <Divider class="my-2" />
          
          <!-- Total -->
          <div class="flex justify-content-between align-items-center">
            <span class="font-bold text-lg" style="color: var(--text-color)">Total</span>
            <span class="font-bold text-3xl" style="color: var(--primary-color)">${{ stats.cuotaMensual?.toLocaleString() }}</span>
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
          <DataTable :value="proximosPagos" :rows="5" class="p-datatable-sm">
            <template #empty>
              <div class="text-center text-gray-400 py-3">No hay pagos pendientes</div>
            </template>
            <Column field="concepto" header="Concepto"></Column>
            <Column header="Monto">
              <template #body="slotProps">
                ${{ slotProps.data.monto?.toLocaleString() }}
              </template>
            </Column>
            <Column header="Vencimiento">
              <template #body="slotProps">
                {{ formatDate(slotProps.data.fechaVencimiento) }}
              </template>
            </Column>
            <Column header="Estado">
              <template #body="slotProps">
                <Tag :severity="getEstadoSeverity(slotProps.data.estado)" 
                     :value="slotProps.data.estado" />
              </template>
            </Column>
          </DataTable>
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
              <Tag :severity="disc.activa ? 'success' : 'danger'" :value="disc.activa ? 'Activa' : 'Inactiva'" />
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { sociosService } from '@/services'
import { planesService } from '@/services/planesService'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
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
  cuotaDisciplinas: 0
})

const proximosPagos = ref([])
const disciplinas = ref([])

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
    
    // Calcular cuota total (base + disciplinas)
    const cuotaDisciplinas = disciplinas.value
      .filter(d => d.activa)
      .reduce((sum, d) => sum + (d.cuotaMensual || 0), 0)
    
    stats.value.cuotaDisciplinas = cuotaDisciplinas
    stats.value.cuotaMensual = cuotaBase + cuotaDisciplinas
    
    // Pagos pendientes
    const pendientes = (socioData.pagos || []).filter(p => 
      p.estado?.toLowerCase() === 'pendiente' || p.estado?.toLowerCase() === 'vencido'
    )
    stats.value.pagosPendientes = pendientes.length
    stats.value.montoPendiente = pendientes.reduce((sum, p) => sum + p.monto, 0)
    
    proximosPagos.value = pendientes.slice(0, 5)
  } catch (error) {
    console.error('Error loading dashboard:', error)
  }
}

onMounted(() => {
  loadData()
})
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
