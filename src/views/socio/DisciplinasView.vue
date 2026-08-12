<template>
  <div>
    <PageHeader title="Disciplinas" />

    <!-- Mis Inscripciones -->
    <div class="mb-4">
      <h2 class="text-xl font-semibold page-title mb-3">Mis Inscripciones Activas</h2>
      <div v-if="misInscripciones.length === 0" class="card text-center py-4">
        <i class="pi pi-info-circle text-3xl text-gray-400 mb-2"></i>
        <p class="text-gray-400 m-0">No estás inscrito en ninguna disciplina</p>
      </div>
      <div v-else class="grid">
        <div v-for="inscripcion in misInscripciones" :key="inscripcion.id" class="col-12 md:col-6 lg:col-4">
          <div class="card inscripcion-card">            <div class="flex justify-content-between align-items-start mb-3">
              <h3 class="text-lg font-semibold m-0" style="color: var(--text-color)">{{ inscripcion.disciplinaNombre }}</h3>
              <Tag severity="success" value="Activa" />
            </div>            <div class="flex justify-content-between align-items-center mb-3">
              <span style="color: var(--text-color-secondary)">Cuota:</span>
              <span class="font-semibold" style="color: var(--text-color)">${{ inscripcion.cuotaMensual?.toLocaleString() }}</span>
            </div>
            <div class="mb-3">
              <Tag
                v-if="inscripcion.tipoFacturacion === 'PagoApartado'"
                severity="warning"
                value="Pago en efectivo en subcomisión"
                class="text-xs"
              />
              <Tag
                v-else
                severity="info"
                value="Incluida en cuota social"
                class="text-xs"
              />
            </div>
            <div class="flex justify-content-between align-items-center mb-3">
              <span style="color: var(--text-color-secondary)">Desde:</span>
              <span style="color: var(--text-color)">{{ formatDate(inscripcion.fechaInicio) }}</span>
            </div>

          </div>
        </div>
      </div>
    </div>

    <!-- Disciplinas Disponibles -->
    <div>
      <h2 class="text-xl font-semibold page-title mb-3">Disciplinas Disponibles</h2>
      <div v-if="loading" class="flex justify-content-center p-5">
        <ProgressSpinner />
      </div>
      <div v-else-if="disciplinasDisponibles.length === 0" class="card text-center py-4">
        <i class="pi pi-check-circle text-3xl text-green-400 mb-2"></i>
        <p class="text-gray-400 m-0">Ya estás inscrito en todas las disciplinas disponibles</p>
      </div>
      <div v-else class="grid">
        <div v-for="disciplina in disciplinasDisponibles" :key="disciplina.id" class="col-12 md:col-6 lg:col-4">
          <div class="card disciplina-card">          <h3 class="text-lg font-semibold mb-2" style="color: var(--text-color)">{{ disciplina.nombre }}</h3>
            <p class="mb-3" style="min-height: 40px; color: var(--text-color-secondary)">{{ disciplina.descripcion || 'Sin descripción' }}</p>
            <div class="flex justify-content-between align-items-center mb-3">
              <span style="color: var(--text-color-secondary)">Cuota Mensual:</span>
              <span class="text-xl font-bold text-primary">${{ disciplina.cuotaMensual?.toLocaleString() }}</span>
            </div>            <div v-if="disciplina.empleadoNombre" class="flex align-items-center gap-2 mb-3">
              <i class="pi pi-user" style="color: var(--text-color-secondary)"></i>
              <span style="color: var(--text-color-secondary)">{{ disciplina.empleadoNombre }}</span>
            </div>
            <Button 
              label="Inscribirme" 
              icon="pi pi-plus" 
              class="w-full"
              @click="inscribirse(disciplina)"
              :loading="inscribiendo === disciplina.id"
            />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useToast } from 'primevue/usetoast'
import { useConfirm } from 'primevue/useconfirm'
import { disciplinasService, inscripcionesService, sociosService } from '@/services'
import { useAuthStore } from '@/stores/auth'
import PageHeader from '@/components/mobile/PageHeader.vue'
import Button from 'primevue/button'
import Tag from 'primevue/tag'
import ProgressSpinner from 'primevue/progressspinner'

const toast = useToast()
const confirm = useConfirm()
const authStore = useAuthStore()

const disciplinas = ref([])
const misInscripciones = ref([])
const loading = ref(false)
const inscribiendo = ref(null)
const cancelando = ref(null)
const cuotaAPagarClub = ref(0)
const cuotaBase = ref(0)

const disciplinasIncluidas = computed(() =>
  misInscripciones.value.filter(i => i.activa && i.tipoFacturacion === 'IncluidaEnCuotaSocial')
)
const disciplinasApartadas = computed(() =>
  misInscripciones.value.filter(i => i.activa && i.tipoFacturacion === 'PagoApartado')
)
const totalApartadas = computed(() =>
  disciplinasApartadas.value.reduce((sum, d) => sum + (d.cuotaMensual || 0), 0)
)

const disciplinasDisponibles = computed(() => {
  const inscritas = misInscripciones.value
    .filter(i => i.activa)
    .map(i => i.disciplinaId)
  return disciplinas.value.filter(d => d.activa && !inscritas.includes(d.id))
})

function formatDate(date) {
  if (!date) return '-'
  return new Date(date).toLocaleDateString('es-ES')
}

async function loadData() {
  loading.value = true
  try {
    const [disciplinasData, inscripcionesData, socioData] = await Promise.all([
      disciplinasService.getAll(),
      inscripcionesService.getMisInscripciones(),
      sociosService.getById(authStore.user.id)
    ])
    disciplinas.value = disciplinasData
    misInscripciones.value = inscripcionesData.filter(i => i.activa)
    cuotaBase.value = socioData.planMembresia?.precioMensual ?? socioData.cuotaSocio ?? 0
    const disciplinasIncluidasTotal = inscripcionesData
      .filter(i => i.activa && i.tipoFacturacion === 'IncluidaEnCuotaSocial')
      .reduce((sum, d) => sum + (d.cuotaMensual || 0), 0)
    cuotaAPagarClub.value = cuotaBase.value + disciplinasIncluidasTotal
  } catch (error) {
    toast.add({ severity: 'error', summary: 'Error', detail: 'No se pudieron cargar los datos', life: 3000 })
  } finally {
    loading.value = false
  }
}

async function inscribirse(disciplina) {
  inscribiendo.value = disciplina.id
  try {
    await inscripcionesService.inscribirse(disciplina.id)
    toast.add({ 
      severity: 'success', 
      summary: '¡Inscripción exitosa!', 
      detail: `Te has inscrito a ${disciplina.nombre}. Tu cuota se ha actualizado.`, 
      life: 4000 
    })
    await loadData()
  } catch (error) {
    toast.add({ 
      severity: 'error', 
      summary: 'Error', 
      detail: error.response?.data?.message || 'No se pudo completar la inscripción', 
      life: 3000 
    })
  } finally {
    inscribiendo.value = null
  }
}

function confirmCancelar(inscripcion) {
  confirm.require({
    message: `¿Estás seguro de cancelar tu inscripción a ${inscripcion.disciplinaNombre}? Tu cuota mensual se reducirá en $${inscripcion.cuotaMensual?.toLocaleString()}.`,
    header: 'Confirmar cancelación',
    icon: 'pi pi-exclamation-triangle',
    acceptClass: 'p-button-danger',
    accept: async () => {
      await cancelarInscripcion(inscripcion)
    }
  })
}

async function cancelarInscripcion(inscripcion) {
  cancelando.value = inscripcion.disciplinaId
  try {
    await inscripcionesService.cancelar(inscripcion.disciplinaId)
    toast.add({ 
      severity: 'success', 
      summary: 'Inscripción cancelada', 
      detail: `Has cancelado tu inscripción a ${inscripcion.disciplinaNombre}`, 
      life: 3000 
    })
    await loadData()
  } catch (error) {
    toast.add({ 
      severity: 'error', 
      summary: 'Error', 
      detail: error.response?.data?.message || 'No se pudo cancelar la inscripción', 
      life: 3000 
    })
  } finally {
    cancelando.value = null
  }
}

onMounted(() => {
  loadData()
})
</script>

<style scoped>
.stat-icon {
  width: 3rem;
  height: 3rem;
  border-radius: 10px;
  background: rgba(220, 38, 38, 0.2);
  color: #dc2626;
  display: flex;
  align-items: center;
  justify-content: center;
}

.inscripcion-card {
  border-left: 3px solid #22c55e;
}

.cuota-desglose {
  border-top: 1px solid var(--surface-border);
  padding-top: 0.75rem;
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.cuota-desglose-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.cuota-desglose-total {
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-top: 1px solid var(--surface-border);
  padding-top: 0.4rem;
  margin-top: 0.2rem;
}

.disciplina-card {
  transition: all 0.3s ease;
  border: 1px solid var(--surface-border);
}

.disciplina-card:hover {
  border-color: #dc2626;
  transform: translateY(-2px);
}

.text-primary {
  color: #dc2626 !important;
}
</style>
