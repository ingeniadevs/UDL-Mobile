<template>
  <div>
    <PageHeader title="Detalle del Socio" show-back @back="goBack" />

    <div v-if="loading" class="flex justify-content-center p-5">
      <ProgressSpinner />
    </div>

    <div v-else-if="socio" class="grid">
      <!-- Info Card -->
      <div class="col-12 lg:col-4">
        <div class="card">
          <div class="flex flex-column align-items-center text-center">
            <Avatar 
              :label="socio.nombre?.charAt(0).toUpperCase()" 
              size="xlarge" 
              shape="circle" 
              class="avatar-red mb-3"
              style="width: 6rem; height: 6rem; font-size: 2rem"
            />            <h2 class="text-2xl font-bold mb-1" style="color: var(--text-color)">{{ socio.nombre }}</h2>
            <span class="mb-3" style="color: var(--text-color-secondary)">{{ socio.email }}</span>
            <Tag :severity="socio.activo ? 'success' : 'danger'" 
                 :value="socio.activo ? 'Activo' : 'Inactivo'" 
                 class="mb-3" />
          </div>
            <Divider />
          
          <div class="flex flex-column gap-3">            <div class="flex justify-content-between">
              <span style="color: var(--text-color-secondary)">Número de Socio</span>
              <span class="font-medium" style="color: var(--text-color)">{{ socio.numeroSocio }}</span>
            </div>
            <div class="flex justify-content-between">
              <span style="color: var(--text-color-secondary)">Teléfono</span>
              <span class="font-medium" style="color: var(--text-color)">{{ socio.telefono || '-' }}</span>
            </div>
            <div class="flex justify-content-between">
              <span style="color: var(--text-color-secondary)">Fecha de Alta</span>
              <span class="font-medium" style="color: var(--text-color)">{{ formatDate(socio.createdAt) }}</span>
            </div>
          </div>

          <Divider />

          <!-- Desglose de Cuotas -->
          <div class="desglose-cuotas">
            <h4 class="text-sm font-semibold mb-3" style="color: var(--text-color)">💰 Desglose de Cuotas Mensuales</h4>
            <div class="flex flex-column gap-2">
              <div class="cuota-item">
                <div class="flex justify-content-between align-items-center">
                  <span class="text-sm" style="color: var(--text-color-secondary)">Cuota Social</span>
                  <span class="font-bold text-green-400">${{ socio.cuotaSocio?.toLocaleString() || '0' }}</span>
                </div>
              </div>              <div v-if="socio.inscripciones && socio.inscripciones.filter(i => i.activa).length > 0">
                <div v-for="inscripcion in socio.inscripciones.filter(i => i.activa)" 
                     :key="inscripcion.id" 
                     class="cuota-item">
                  <div class="flex justify-content-between align-items-center">
                    <span class="text-sm" style="color: var(--text-color-secondary)">
                      🏃 {{ inscripcion.disciplinaNombre }}
                    </span>
                    <span class="font-bold text-blue-400">${{ inscripcion.cuotaMensual?.toLocaleString() || '0' }}</span>
                  </div>
                </div>
              </div>
              <Divider class="my-2" />
              <div class="flex justify-content-between align-items-center">
                <span class="font-semibold" style="color: var(--text-color)">Total Mensual</span>
                <span class="font-bold text-xl" style="color: var(--primary-color)">${{ calcularTotalCuotas() }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Tabs -->
      <div class="col-12 lg:col-8">
        <TabView>
          <!-- Pagos -->
          <TabPanel header="Pagos">
            <div v-if="!socio.pagos?.length" class="text-center text-gray-400 py-4">
              No hay pagos registrados
            </div>
            <div v-else class="mobile-card-list">
              <MobileRecordCard
                v-for="pago in socio.pagos"
                :key="pago.id"
                :title="pago.concepto"
                :subtitle="`Vence: ${formatDate(pago.fechaVencimiento)}`"
              >
                <template #tags>
                  <Tag :severity="getEstadoSeverity(pago.estado)" :value="pago.estado" />
                </template>
                <template #body>
                  <div class="record-card__row">
                    <span class="record-card__label">Monto</span>
                    <span class="record-card__value font-bold text-primary">${{ pago.monto?.toLocaleString() }}</span>
                  </div>
                </template>
              </MobileRecordCard>
            </div>
          </TabPanel>

          <!-- Inscripciones -->
          <TabPanel header="Inscripciones">
            <div v-if="!socio.inscripciones?.length" class="text-center text-gray-400 py-4">
              No hay inscripciones registradas
            </div>
            <div v-else class="mobile-card-list">
              <MobileRecordCard
                v-for="inscripcion in socio.inscripciones"
                :key="inscripcion.id"
                :title="inscripcion.disciplinaNombre"
                :subtitle="`Desde ${formatDate(inscripcion.fechaInicio)}`"
              >
                <template #tags>
                  <Tag
                    :severity="inscripcion.activa ? 'success' : 'danger'"
                    :value="inscripcion.activa ? 'Activa' : 'Inactiva'"
                  />
                </template>
                <template #body>
                  <div class="record-card__row">
                    <span class="record-card__label">Cuota mensual</span>
                    <span class="record-card__value">${{ inscripcion.cuotaMensual?.toLocaleString() || '0' }}</span>
                  </div>
                  <div v-if="inscripcion.fechaFin" class="record-card__row">
                    <span class="record-card__label">Fecha fin</span>
                    <span class="record-card__value">{{ formatDate(inscripcion.fechaFin) }}</span>
                  </div>
                </template>
              </MobileRecordCard>
            </div>
          </TabPanel>

          <!-- FASE 6: Grupo Familiar -->
          <TabPanel header="Grupo Familiar">
            <div v-if="socio.tipoSocio === 'Titular'">
              <div class="flex justify-content-between align-items-center mb-3">
                <h4 class="m-0" style="color: var(--text-color)">
                  Adherentes ({{ socio.adherentes?.length || 0 }})
                </h4>
              </div>
              
              <div v-if="socio.adherentes && socio.adherentes.length > 0" class="mobile-card-list">
                <MobileRecordCard
                  v-for="adherente in socio.adherentes"
                  :key="adherente.id"
                  :title="adherente.nombreCompleto"
                  :subtitle="adherente.telefono || 'Sin teléfono'"
                >
                  <template #tags>
                    <Tag
                      :severity="adherente.activo ? 'success' : 'danger'"
                      :value="adherente.activo ? 'Activo' : 'Inactivo'"
                    />
                  </template>
                  <template #body>
                    <div class="record-card__row">
                      <span class="record-card__label">Cuota</span>
                      <span class="record-card__value">${{ adherente.cuotaSocio?.toLocaleString() }}</span>
                    </div>
                    <div class="record-card__row">
                      <span class="record-card__label">Pago</span>
                      <span class="record-card__value">
                        <Tag
                          v-if="adherente.pagaCuotaElAdherente"
                          value="Paga propia"
                          severity="success"
                          class="text-xs"
                        />
                        <Tag v-else value="Paga titular" severity="info" class="text-xs" />
                      </span>
                    </div>
                  </template>
                  <template #actions>
                    <Button
                      icon="pi pi-eye"
                      label="Ver"
                      text
                      size="small"
                      @click="router.push(`/admin/socios/${adherente.id}`)"
                    />
                  </template>
                </MobileRecordCard>
              </div>
              
              <div v-else class="text-center py-4" style="color: var(--text-color-secondary)">
                <i class="pi pi-users text-4xl mb-2"></i>
                <p>Este titular no tiene adherentes asociados</p>
              </div>
            </div>
            
            <div v-else-if="socio.tipoSocio === 'Adherente'">
              <div class="card bg-surface-ground p-4">
                <h4 class="mb-3" style="color: var(--text-color)">Información del Titular</h4>
                <div class="flex flex-column gap-2">
                  <div class="flex justify-content-between">
                    <span style="color: var(--text-color-secondary)">Titular:</span>
                    <strong style="color: var(--text-color)">{{ socio.titularNombreCompleto }}</strong>
                  </div>
                  <div class="flex justify-content-between">
                    <span style="color: var(--text-color-secondary)">Pago de cuota:</span>
                    <Tag :severity="socio.pagaCuotaElAdherente ? 'success' : 'info'"
                         :value="socio.pagaCuotaElAdherente ? 'Paga su propia cuota' : 'Paga el titular'" />
                  </div>
                  <div class="flex justify-content-between">
                    <span style="color: var(--text-color-secondary)">Pago de disciplinas:</span>
                    <Tag :severity="socio.pagaDisciplinasElAdherente ? 'success' : 'info'"
                         :value="socio.pagaDisciplinasElAdherente ? 'Paga sus disciplinas' : 'Paga el titular'" />
                  </div>
                </div>
                <Button 
                  label="Ver Titular" 
                  icon="pi pi-user"
                  class="mt-3 w-full p-button-sm"
                  @click="viewTitular" 
                  v-if="socio.titularId"
                />
              </div>
            </div>
            
            <div v-else class="text-center py-4" style="color: var(--text-color-secondary)">
              <i class="pi pi-info-circle text-4xl mb-2"></i>
              <p>Socio sin grupo familiar</p>
            </div>
          </TabPanel>
        </TabView>
      </div>
    </div>

    <div v-else class="card">
      <p class="text-center text-gray-400">Socio no encontrado</p>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { sociosService } from '@/services'
import Button from 'primevue/button'
import Avatar from 'primevue/avatar'
import Tag from 'primevue/tag'
import Divider from 'primevue/divider'
import TabView from 'primevue/tabview'
import TabPanel from 'primevue/tabpanel'
import ProgressSpinner from 'primevue/progressspinner'
import PageHeader from '@/components/mobile/PageHeader.vue'
import MobileRecordCard from '@/components/mobile/MobileRecordCard.vue'

const route = useRoute()
const router = useRouter()

const socio = ref(null)
const loading = ref(true)

function goBack() {
  router.back()
}

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

function calcularTotalCuotas() {
  if (!socio.value) return '0'
  
  let total = socio.value.cuotaSocio || 0
  
  if (socio.value.inscripciones) {
    const inscripcionesActivas = socio.value.inscripciones.filter(i => i.activa)
    inscripcionesActivas.forEach(inscripcion => {
      total += inscripcion.cuotaMensual || 0
    })
  }
  
  return total.toLocaleString()
}

function viewTitular() {
  if (socio.value?.titularId) {
    router.push(`/admin/socios/${socio.value.titularId}`)
  }
}

async function loadSocio() {
  loading.value = true
  try {
    socio.value = await sociosService.getById(route.params.id)
  } catch (error) {
    console.error('Error loading socio:', error)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadSocio()
})
</script>

<style scoped>
.avatar-red {
  background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%) !important;
  color: white !important;
}

.btn-back {
  color: var(--text-color-secondary) !important;
}

.btn-back:hover {
  background: rgba(220, 38, 38, 0.1) !important;
  color: #dc2626 !important;
}

.desglose-cuotas {
  background: var(--surface-ground);
  padding: 1rem;
  border-radius: 8px;
}

.cuota-item {
  padding: 0.5rem;
  background: var(--surface-card);
  border-radius: 6px;
  border-left: 3px solid var(--primary-color);
}
</style>
