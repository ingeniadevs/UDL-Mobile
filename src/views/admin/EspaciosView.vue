<template>
  <div>
    <div class="flex align-items-center justify-content-between mb-4">
      <h1 class="text-3xl font-bold m-0" style="color: var(--text-color)">Espacios</h1>
      <Button label="Nuevo Espacio" icon="pi pi-plus" @click="openNew" />
    </div>

    <!-- Filtros y Búsqueda -->
    <div class="card mb-4">
      <div class="flex flex-wrap align-items-center gap-3">
        <span class="p-input-icon-left">
          <i class="pi pi-search" />
          <InputText v-model="searchTerm" placeholder="Buscar espacios..." />
        </span>
        <Dropdown 
          v-model="selectedTipo" 
          :options="tiposEspacio" 
          placeholder="Todos los tipos"
          showClear
        />
        <Dropdown 
          v-model="selectedStatus" 
          :options="estadoOptions" 
          optionLabel="label"
          optionValue="value"
          placeholder="Todos los estados"
          showClear
        />
        <div class="flex align-items-center gap-2 ml-auto">
          <span class="text-gray-400 text-sm">{{ filteredEspacios.length }} espacios</span>
        </div>
      </div>
    </div>

    <!-- Espacios Grid -->
    <div v-if="loading" class="flex justify-content-center p-5">
      <ProgressSpinner />
    </div>

    <div v-else-if="filteredEspacios.length === 0" class="card text-center py-6">
      <i class="pi pi-building text-4xl text-gray-400 mb-3"></i>
      <p class="text-gray-400 mb-3">No se encontraron espacios</p>
      <Button label="Crear primer espacio" icon="pi pi-plus" @click="openNew" />
    </div>

    <div v-else class="grid">
      <div v-for="esp in filteredEspacios" :key="esp.id" class="col-12 sm:col-6 lg:col-4 xl:col-3">
        <div class="espacio-card h-full flex flex-column" :class="{ 'inactive': !esp.activo }">
          <!-- Espacio Image -->
          <div class="espacio-image-container relative">
            <img 
              v-if="esp.imagen" 
              :src="esp.imagen" 
              :alt="esp.nombre"
              class="espacio-image"
            />
            <div v-else class="espacio-placeholder">
              <i class="pi pi-building"></i>
            </div>
            
            <!-- Badges -->
            <div class="espacio-badges">
              <Tag v-if="esp.requiereAprobacion" severity="warning" value="⚡ Requiere Aprobación" />
              <Tag v-if="!esp.activo" severity="danger" value="Inactivo" />
            </div>

            <!-- Quick Actions Overlay -->
            <div class="espacio-actions-overlay">
              <Button 
                icon="pi pi-pencil" 
                class="p-button-rounded p-button-success"
                @click="editEspacio(esp)"
                v-tooltip.top="'Editar'"
              />
              <Button 
                icon="pi pi-trash" 
                class="p-button-rounded p-button-danger"
                @click="confirmDelete(esp)"
                v-tooltip.top="'Eliminar'"
              />
            </div>
          </div>

          <!-- Espacio Info -->
          <div class="espacio-body flex-1 flex flex-column">            <div class="flex align-items-center justify-content-between mb-2">
              <div class="flex align-items-center gap-2 flex-wrap">
                <Tag :severity="getTipoSeverity(esp.tipo)" :value="esp.tipo" />
                <Tag v-if="esp.deporte" severity="contrast" :value="deporteLabel(esp.deporte)" />
              </div>
              <Tag 
                :severity="esp.activo ? 'success' : 'danger'"
                :value="esp.activo ? 'Activo' : 'Inactivo'"
              />
            </div>
            
            <h4 class="espacio-title">{{ esp.nombre }}</h4>
            <p class="espacio-description flex-1">{{ esp.descripcion || 'Sin descripción' }}</p>
            
            <div class="espacio-details mb-2">
              <div class="detail-item">
                <i class="pi pi-clock"></i>
                <span>{{ esp.horaApertura }} - {{ esp.horaCierre }}</span>
              </div>
              <div class="detail-item">
                <i class="pi pi-stopwatch"></i>
                <span>{{ esp.duracionTurno }} min/turno</span>
              </div>
              <div v-if="esp.capacidad" class="detail-item">
                <i class="pi pi-users"></i>
                <span>{{ esp.capacidad }} personas</span>
              </div>
            </div>            <!-- Price -->
            <div class="espacio-price">
              <template v-if="esp.tipoReserva === 'PorTurno'">
                <span v-if="esp.precioTurnoManana" class="text-sm block">☀️ Mañana: ${{ esp.precioTurnoManana?.toLocaleString() }}</span>
                <span v-if="esp.precioTurnoNoche" class="text-sm block">🌙 Noche: ${{ esp.precioTurnoNoche?.toLocaleString() }}</span>
                <span v-if="esp.precioTodoDia" class="text-sm block">📅 Todo el día: ${{ esp.precioTodoDia?.toLocaleString() }}</span>
              </template>
              <template v-else>
                ${{ esp.precioPorHora?.toLocaleString() }}/hora
              </template>            </div>

            <!-- Admins asignados -->
            <div v-if="esp.adminsAsignados?.length" class="espacio-admins mt-2">
              <i class="pi pi-user-edit text-xs mr-1 text-gray-400"></i>
              <span v-for="(a, idx) in esp.adminsAsignados" :key="a.id">
                <Tag severity="secondary" :value="a.nombre" class="text-xs mr-1" />
              </span>
            </div>
          </div>

          <!-- Card Footer Actions -->
          <div class="espacio-footer">
            <Button 
              label="Editar" 
              icon="pi pi-pencil" 
              class="p-button-sm p-button-outlined flex-1"
              @click="editEspacio(esp)"
            />
            <Button 
              :icon="esp.activo ? 'pi pi-eye-slash' : 'pi pi-eye'" 
              class="p-button-sm p-button-outlined"
              :class="esp.activo ? 'p-button-warning' : 'p-button-success'"
              @click="toggleActivo(esp)"
              v-tooltip.top="esp.activo ? 'Desactivar' : 'Activar'"
            />
          </div>
        </div>
      </div>
    </div>

    <!-- Create/Edit Dialog -->
    <Dialog 
      v-model:visible="espacioDialog" 
      :header="isEditing ? 'Editar Espacio' : 'Nuevo Espacio'" 
      :modal="true"
      :draggable="false"
      :style="{ width: '600px', maxWidth: '95vw' }"
      :breakpoints="{ '640px': '95vw' }"
      :contentStyle="{ overflowX: 'hidden' }"
    >
      <div class="flex flex-column gap-4 pt-3">        <div class="grid">
          <div class="col-12 md:col-6">
            <label for="nombre" class="font-medium text-gray-300">Nombre *</label>
            <InputText id="nombre" v-model="espacio.nombre" class="w-full mt-2" :class="{ 'p-invalid': submitted && !espacio.nombre }" />
            <small v-if="submitted && !espacio.nombre" class="p-error">El nombre es requerido</small>
          </div>
          <div class="col-12 md:col-6">
            <label for="tipo" class="font-medium text-gray-300">Tipo *</label>
            <Dropdown 
              id="tipo"
              v-model="espacio.tipo" 
              :options="tiposEspacio" 
              placeholder="Seleccione un tipo"
              class="w-full mt-2"
              :class="{ 'p-invalid': submitted && !espacio.tipo }"
            />
            <small v-if="submitted && !espacio.tipo" class="p-error">El tipo es requerido</small>
          </div>
          <div class="col-12 md:col-6">
            <label class="font-medium text-gray-300">Deporte / Disciplina</label>
            <Dropdown
              v-model="espacio.deporte"
              :options="deportesOpciones"
              optionLabel="label"
              optionValue="value"
              placeholder="Seleccionar deporte..."
              class="w-full mt-2"
              showClear
            />
            <small class="text-gray-400">Usado para asignar encargados por deporte</small>
          </div>
        </div>

        <div class="field">
          <label for="descripcion" class="font-medium text-gray-300">Descripción</label>
          <Textarea id="descripcion" v-model="espacio.descripcion" rows="2" class="w-full mt-2" />
        </div>

        <div class="field">
          <label class="font-medium text-gray-300 mb-2 block">Imagen del Espacio</label>
          <ImageUpload v-model="espacio.imagen" placeholder="Subir imagen del espacio" />
        </div>        <!-- Tipo de reserva -->
        <div class="field">
          <label class="font-medium text-gray-300 block mb-2">Tipo de Reserva *</label>
          <div class="flex gap-4">
            <div
              class="tipo-reserva-card flex-1 p-3 border-round cursor-pointer"
              :class="{ 'selected': espacio.tipoReserva !== 'PorTurno' }"
              @click="espacio.tipoReserva = 'PorHora'"
            >
              <i class="pi pi-stopwatch text-2xl mb-2 block"></i>
              <div class="font-bold">Por Hora</div>
              <small class="text-gray-400">Canchas / espacios horarios</small>
            </div>
            <div
              class="tipo-reserva-card flex-1 p-3 border-round cursor-pointer"
              :class="{ 'selected': espacio.tipoReserva === 'PorTurno' }"
              @click="espacio.tipoReserva = 'PorTurno'"
            >
              <i class="pi pi-building text-2xl mb-2 block"></i>
              <div class="font-bold">Por Turno</div>
              <small class="text-gray-400">Salones (Mañana / Noche / Todo el día)</small>
            </div>
          </div>
        </div>

        <!-- Precio por hora (solo PorHora) -->
        <div v-if="espacio.tipoReserva !== 'PorTurno'" class="grid" style="margin: 0">
          <div class="col-12 md:col-6" style="min-width:0">
            <label for="precio" class="font-medium text-gray-300">Precio por Hora *</label>
            <InputNumber id="precio" v-model="espacio.precioPorHora" mode="currency" currency="ARS" locale="es-AR" class="w-full mt-2" inputClass="w-full" />
          </div>
          <div class="col-12 md:col-6" style="min-width:0">
            <label for="capacidad" class="font-medium text-gray-300">Capacidad</label>
            <InputNumber id="capacidad" v-model="espacio.capacidad" class="w-full mt-2" inputClass="w-full" />
          </div>
        </div>

        <!-- Precios por turno (solo PorTurno - salones) -->
        <div v-if="espacio.tipoReserva === 'PorTurno'" class="field">
          <label class="font-medium text-gray-300 block mb-2">Precios por Turno</label>
          <div class="grid" style="margin: 0">
            <div class="col-12 md:col-4" style="min-width:0">
              <label class="text-gray-400 text-sm block mb-1">☀️ Turno Mañana (08:00 - 13:00)</label>
              <InputNumber v-model="espacio.precioTurnoManana" mode="currency" currency="ARS" locale="es-AR" class="w-full" inputClass="w-full" />
            </div>
            <div class="col-12 md:col-4" style="min-width:0">
              <label class="text-gray-400 text-sm block mb-1">🌙 Turno Noche (19:00 - 23:59)</label>
              <InputNumber v-model="espacio.precioTurnoNoche" mode="currency" currency="ARS" locale="es-AR" class="w-full" inputClass="w-full" />
            </div>
            <div class="col-12 md:col-4" style="min-width:0">
              <label class="text-gray-400 text-sm block mb-1">📅 Todo el Día (08:00 - 23:59)</label>
              <InputNumber v-model="espacio.precioTodoDia" mode="currency" currency="ARS" locale="es-AR" class="w-full" inputClass="w-full" />
            </div>
          </div>
          <div class="mt-2">
            <label for="capacidad2" class="font-medium text-gray-300">Capacidad</label>
            <InputNumber id="capacidad2" v-model="espacio.capacidad" class="w-full mt-2" />
          </div>
        </div>

        <!-- Horarios (solo PorHora) -->
        <div v-if="espacio.tipoReserva !== 'PorTurno'" class="grid" style="margin: 0">
          <div class="col-12 md:col-4" style="min-width:0">
            <label for="horaApertura" class="font-medium text-gray-300">Hora Apertura</label>
            <InputText id="horaApertura" v-model="espacio.horaApertura" class="w-full mt-2" placeholder="08:00" />
          </div>
          <div class="col-12 md:col-4" style="min-width:0">
            <label for="horaCierre" class="font-medium text-gray-300">Hora Cierre</label>
            <InputText id="horaCierre" v-model="espacio.horaCierre" class="w-full mt-2" placeholder="22:00" />
          </div>
          <div class="col-12 md:col-4" style="min-width:0">
            <label for="duracion" class="font-medium text-gray-300">Duración Turno (min)</label>
            <InputNumber id="duracion" v-model="espacio.duracionTurno" class="w-full mt-2" inputClass="w-full" :min="15" :step="15" />
          </div>
        </div>        <div class="grid">
          <div class="col-12 md:col-6" v-if="isEditing">
            <label for="activo" class="font-medium text-gray-300">Estado</label>
            <div class="flex align-items-center gap-2 mt-2">
              <InputSwitch id="activo" v-model="espacio.activo" />
              <span class="text-gray-300">{{ espacio.activo ? 'Activo' : 'Inactivo' }}</span>
            </div>
          </div>
          <div class="col-12 md:col-6">
            <label for="aprobacion" class="font-medium text-gray-300">Requiere Aprobación</label>
            <div class="flex align-items-center gap-2 mt-2">
              <InputSwitch id="aprobacion" v-model="espacio.requiereAprobacion" />
              <span class="text-gray-300">{{ espacio.requiereAprobacion ? 'Sí' : 'No' }}</span>
            </div>
          </div>
        </div>

        <!-- Admins asignados -->
        <div class="field">
          <label class="font-medium text-gray-300 block mb-2">
            <i class="pi pi-users mr-2"></i>Admins asignados a este espacio
          </label>
          <small class="text-gray-400 block mb-2">Solo estos admins podrán ver las reservas de este espacio. Los <strong>master</strong> siempre tienen acceso total.</small>
          <MultiSelect
            v-model="espacio.adminsAsignadosIds"
            :options="adminsDisponibles"
            optionLabel="label"
            optionValue="value"
            placeholder="Seleccionar admins..."
            class="w-full"
            display="chip"
            :filter="true"
            filterPlaceholder="Buscar admin..."
          />
        </div>
      </div>

      <template #footer>
        <Button label="Cancelar" icon="pi pi-times" text @click="hideDialog" />
        <Button label="Guardar" icon="pi pi-check" @click="saveEspacio" :loading="saving" />
      </template>
    </Dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useToast } from 'primevue/usetoast'
import { useConfirm } from 'primevue/useconfirm'
import { espaciosService, adminsService } from '@/services'
import Button from 'primevue/button'
import Dialog from 'primevue/dialog'
import InputText from 'primevue/inputtext'
import InputNumber from 'primevue/inputnumber'
import InputSwitch from 'primevue/inputswitch'
import Textarea from 'primevue/textarea'
import Dropdown from 'primevue/dropdown'
import MultiSelect from 'primevue/multiselect'
import Tag from 'primevue/tag'
import ProgressSpinner from 'primevue/progressspinner'
import ImageUpload from '@/components/shared/ImageUpload.vue'

const toast = useToast()
const confirm = useConfirm()

const espacios = ref([])
const adminsDisponibles = ref([])
const loading = ref(false)
const espacioDialog = ref(false)
const submitted = ref(false)
const saving = ref(false)
const isEditing = ref(false)

// Filters
const searchTerm = ref('')
const selectedTipo = ref(null)
const selectedStatus = ref(null)

const estadoOptions = ref([
  { label: 'Activos', value: true },
  { label: 'Inactivos', value: false }
])

const tiposEspacio = ref([
  'Cancha de Pádel',
  'Cancha de Tenis',
  'Cancha de Fútbol',
  'Cancha de Básquet',
  'Piscina',
  'Gimnasio',
  'Salón de Eventos',
  'Quincho',
  'Otro'
])

const deportesOpciones = [
  { label: '🎾 Pádel',      value: 'padel' },
  { label: '⚽ Fútbol',     value: 'futbol' },
  { label: '🎾 Tenis',      value: 'tenis' },
  { label: '🏀 Básquet',    value: 'basquet' },
  { label: '🏊 Natación',   value: 'natacion' },
  { label: '💪 Gimnasio',   value: 'gimnasio' },
  { label: '🎪 Salón',      value: 'salon' },
  { label: '❓ Otro',       value: 'otro' },
]

const deporteLabels = { padel: '🎾 Pádel', futbol: '⚽ Fútbol', tenis: '🎾 Tenis', basquet: '🏀 Básquet', natacion: '🏊 Natación', gimnasio: '💪 Gimnasio', salon: '🎪 Salón', otro: '❓ Otro' }
function deporteLabel(d) { return deporteLabels[d] || d }

const espacio = ref({})

const filteredEspacios = computed(() => {
  let result = espacios.value

  if (searchTerm.value) {
    const term = searchTerm.value.toLowerCase()
    result = result.filter(e => 
      e.nombre?.toLowerCase().includes(term) ||
      e.descripcion?.toLowerCase().includes(term)
    )
  }

  if (selectedTipo.value) {
    result = result.filter(e => e.tipo === selectedTipo.value)
  }

  if (selectedStatus.value !== null) {
    result = result.filter(e => e.activo === selectedStatus.value)
  }

  return result
})

function getTipoSeverity(tipo) {
  const severities = {
    'Cancha de Pádel': 'info',
    'Cancha de Tenis': 'success',
    'Cancha de Fútbol': 'warning',
    'Cancha de Básquet': 'contrast',
    'Piscina': 'info',
    'Gimnasio': 'secondary',
    'Salón de Eventos': 'contrast',
    'Quincho': 'warning'
  }
  return severities[tipo] || 'secondary'
}

async function loadEspacios() {
  loading.value = true
  try {
    espacios.value = await espaciosService.getAll()
  } catch (error) {
    toast.add({ severity: 'error', summary: 'Error', detail: 'No se pudieron cargar los espacios', life: 3000 })
  } finally {
    loading.value = false
  }
}

async function loadAdmins() {
  try {
    const admins = await adminsService.getAll()
    adminsDisponibles.value = admins
      .filter(a => a.rol === 'admin' && a.activo)
      .map(a => ({ label: `${a.nombre} (${a.email})`, value: a.id }))
  } catch (e) {
    // silencioso
  }
}

function openNew() {
  espacio.value = { 
    precioPorHora: 0,
    tipoReserva: 'PorHora',
    precioTurnoManana: 0,
    precioTurnoTarde: 0,
    precioTurnoNoche: 0,
    precioTodoDia: 0,
    activo: true, 
    requiereAprobacion: false,
    horaApertura: '08:00',
    horaCierre: '22:00',
    duracionTurno: 60,
    imagen: null,
    adminsAsignadosIds: []
  }
  submitted.value = false
  isEditing.value = false
  espacioDialog.value = true
}

function editEspacio(data) {
  espacio.value = { 
    ...data,
    adminsAsignadosIds: data.adminsAsignados?.map(a => a.id) ?? []
  }
  isEditing.value = true
  submitted.value = false
  espacioDialog.value = true
}

function hideDialog() {
  espacioDialog.value = false
  submitted.value = false
}

async function saveEspacio() {
  submitted.value = true

  if (!espacio.value.nombre || !espacio.value.tipo) {
    return
  }
  saving.value = true
  try {    const payload = {
      nombre: espacio.value.nombre,
      tipo: espacio.value.tipo,
      deporte: espacio.value.deporte || null,
      descripcion: espacio.value.descripcion,
      capacidad: espacio.value.capacidad,
      precioPorHora: espacio.value.precioPorHora || 0,
      horaApertura: espacio.value.horaApertura || '08:00',
      horaCierre: espacio.value.horaCierre || '22:00',
      duracionTurno: espacio.value.duracionTurno || 60,
      tipoReserva: espacio.value.tipoReserva || 'PorHora',
      precioTurnoManana: espacio.value.precioTurnoManana || 0,
      precioTurnoTarde: espacio.value.precioTurnoTarde || 0,
      precioTurnoNoche: espacio.value.precioTurnoNoche || 0,
      precioTodoDia: espacio.value.precioTodoDia || 0,      requiereAprobacion: espacio.value.requiereAprobacion,
      imagen: espacio.value.imagen,
      adminsAsignadosIds: espacio.value.adminsAsignadosIds || []
    }
    if (isEditing.value) {
      await espaciosService.update(espacio.value.id, { ...payload, activo: espacio.value.activo })
      toast.add({ severity: 'success', summary: 'Éxito', detail: 'Espacio actualizado', life: 3000 })
    } else {
      await espaciosService.create(payload)
      toast.add({ severity: 'success', summary: 'Éxito', detail: 'Espacio creado', life: 3000 })
    }
    hideDialog()
    await loadEspacios()
  } catch (error) {
    toast.add({ 
      severity: 'error', 
      summary: 'Error', 
      detail: error.response?.data?.message || 'Error al guardar el espacio', 
      life: 3000 
    })
  } finally {
    saving.value = false
  }
}

async function toggleActivo(esp) {
  try {    await espaciosService.update(esp.id, {
      ...esp,
      deporte: esp.deporte || null,
      activo: !esp.activo,
      adminsAsignadosIds: esp.adminsAsignados?.map(a => a.id) ?? []
    })
    toast.add({ 
      severity: 'success', 
      summary: 'Éxito', 
      detail: `Espacio ${esp.activo ? 'desactivado' : 'activado'}`, 
      life: 3000 
    })
    await loadEspacios()
  } catch (error) {
    toast.add({ severity: 'error', summary: 'Error', detail: 'No se pudo cambiar el estado', life: 3000 })
  }
}

function confirmDelete(data) {
  confirm.require({
    message: `¿Está seguro de eliminar el espacio "${data.nombre}"?`,
    header: 'Confirmar eliminación',
    icon: 'pi pi-exclamation-triangle',
    acceptClass: 'p-button-danger',
    accept: async () => {
      try {
        await espaciosService.delete(data.id)
        toast.add({ severity: 'success', summary: 'Éxito', detail: 'Espacio eliminado', life: 3000 })
        await loadEspacios()
      } catch (error) {
        toast.add({ severity: 'error', summary: 'Error', detail: 'No se pudo eliminar el espacio', life: 3000 })
      }
    }
  })
}

onMounted(() => {
  loadEspacios()
  loadAdmins()
})
</script>

<style scoped>
.espacio-card {
  background: var(--surface-card);
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
  border: 1px solid var(--surface-border);
  transition: all 0.3s ease;
}

.espacio-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.18);
  border-color: var(--primary-color);
}

.espacio-card.inactive {
  opacity: 0.7;
}

.espacio-image-container {
  height: 180px;
  overflow: hidden;
  position: relative;
}

.espacio-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.3s ease;
}

.espacio-card:hover .espacio-image {
  transform: scale(1.05);
}

.espacio-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--surface-hover);
}

.espacio-placeholder i {
  font-size: 3rem;
  color: var(--text-color-secondary);
  opacity: 0.4;
}

.espacio-badges {
  position: absolute;
  top: 10px;
  left: 10px;
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.espacio-actions-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.55);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  opacity: 0;
  transition: opacity 0.3s ease;
}

.espacio-card:hover .espacio-actions-overlay {
  opacity: 1;
}

.espacio-body {
  padding: 1rem;
}

.espacio-title {
  font-size: 1.1rem;
  font-weight: 600;
  color: var(--text-color);
  margin: 0.5rem 0;
  line-height: 1.3;
}

.espacio-description {
  font-size: 0.85rem;
  color: var(--text-color-secondary);
  margin: 0;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.espacio-details {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-top: 0.75rem;
}

.detail-item {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.75rem;
  color: var(--text-color-secondary);
  background: var(--surface-hover);
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
}

.detail-item i {
  font-size: 0.7rem;
}

.espacio-price {
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--primary-color);
  margin-top: 0.5rem;
}

.espacio-footer {
  display: flex;
  gap: 0.5rem;
  padding: 1rem;
  border-top: 1px solid var(--surface-border);
}

.tipo-reserva-card {
  background: var(--surface-overlay);
  border: 2px solid var(--surface-border);
  text-align: center;
  transition: all 0.2s ease;
}
.tipo-reserva-card:hover {
  border-color: var(--primary-color);
}
.tipo-reserva-card.selected {
  border-color: var(--primary-color);
  background: var(--surface-hover);
}
</style>
