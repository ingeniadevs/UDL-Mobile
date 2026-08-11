<template>
  <div>
    <PageHeader title="Socios">
      <template #actions>
        <Tag v-if="sociosPendientes > 0" :value="`${sociosPendientes} pendiente${sociosPendientes > 1 ? 's' : ''}`" severity="warning" icon="pi pi-clock" />
        <Button label="Nuevo Socio" icon="pi pi-plus" size="small" @click="openNew" />
      </template>
    </PageHeader>

    <div class="card mb-3">
      <div class="flex flex-column gap-3">
        <span class="p-input-icon-left w-full">
          <i class="pi pi-search" />
          <InputText v-model="searchTerm" placeholder="Buscar..." class="w-full" />
        </span>
        <div class="flex flex-wrap gap-2">
          <Button :label="`Todos (${socios.length})`" :outlined="filtroEstado !== 'todos'" size="small" @click="filtroEstado = 'todos'" />
          <Button :label="`Pendientes (${sociosPendientes})`" :outlined="filtroEstado !== 'pendientes'" :severity="sociosPendientes > 0 ? 'warning' : undefined" size="small" @click="filtroEstado = 'pendientes'" />
          <Button :label="`Activos (${sociosActivos})`" :outlined="filtroEstado !== 'activos'" severity="success" size="small" @click="filtroEstado = 'activos'" />
        </div>
      </div>
    </div>

    <div v-if="loading" class="flex justify-content-center py-5">
      <ProgressSpinner />
    </div>
    <template v-else>
      <div v-if="sociosFiltrados.length === 0" class="card text-center py-5 text-color-secondary">
        No se encontraron socios
      </div>
      <div v-else class="mobile-card-list">
        <MobileRecordCard
          v-for="item in paginatedSocios"
          :key="item.id"
          :title="item.nombre"
          :subtitle="`#${item.numeroSocio} · ${item.email}`"
          @click="viewSocio(item)"
        >
          <template #leading>
            <Avatar :label="(item.nombre?.charAt(0) + (item.apellido?.charAt(0) || '')).toUpperCase()" shape="circle" class="avatar-red" />
          </template>
          <template #tags>
            <Tag :severity="item.activo ? 'success' : 'warning'" :value="item.activo ? 'Activo' : 'Pendiente'" :icon="item.activo ? 'pi pi-check' : 'pi pi-clock'" />
          </template>
          <template #body>
            <div class="record-card__row">
              <span class="record-card__label">Teléfono</span>
              <span class="record-card__value">{{ item.telefono || '—' }}</span>
            </div>
            <div class="record-card__row">
              <span class="record-card__label">Cuota</span>
              <span class="record-card__value">${{ item.cuotaSocio?.toLocaleString() }}</span>
            </div>
            <div v-if="item.disciplinasActivas?.length" class="flex flex-wrap gap-1 mt-1">
              <Tag v-for="d in item.disciplinasActivas" :key="d" :value="d" severity="secondary" style="font-size: 0.7rem" />
            </div>
            <div v-if="item.tipoSocio === 'Adherente' || item.cantidadAdherentes > 0" class="mt-1">
              <Tag v-if="item.tipoSocio === 'Adherente'" value="ADH" severity="info" icon="pi pi-user" />
              <Tag v-else-if="item.cantidadAdherentes > 0" :value="`T (${item.cantidadAdherentes})`" severity="success" icon="pi pi-users" />
            </div>
          </template>
          <template #actions>
            <Button v-if="!item.activo" icon="pi pi-check-circle" text rounded size="small" severity="success" @click="aprobarSocio(item)" v-tooltip.top="'Aprobar socio'" />
            <Button icon="pi pi-eye" text rounded size="small" @click="viewSocio(item)" v-tooltip.top="'Ver detalle'" />
            <Button icon="pi pi-pencil" text rounded size="small" severity="info" @click="editSocio(item)" v-tooltip.top="'Editar'" />
            <Button icon="pi pi-trash" text rounded size="small" severity="danger" @click="confirmDelete(item)" v-tooltip.top="'Eliminar'" />
            <Button icon="pi pi-key" text rounded size="small" severity="warning" @click="openResetPassword(item)" v-tooltip.top="'Resetear Contraseña'" />
            <Button icon="pi pi-whatsapp" text rounded size="small" severity="success" @click="openWaDialog(item)" v-tooltip.top="'Enviar WhatsApp'" />
          </template>
        </MobileRecordCard>
      </div>
      <MobilePaginator v-model:page="currentPage" :rows="10" :total="sociosFiltrados.length" />
    </template>

    <!-- Create/Edit Dialog -->
    <Dialog 
      v-model:visible="socioDialog" 
      :header="isEditing ? 'Editar Socio' : 'Nuevo Socio'" 
      :modal="true"
      :style="{ width: '500px' }"
    >      <div class="flex flex-column gap-4 pt-3">
        <!-- Plan de Membresía -->
        <div class="field">
          <label for="planMembresia" class="font-medium text-gray-300">
            Plan de Membresía {{ !isEditing ? '*' : '' }}
          </label>
          <Dropdown 
            id="planMembresia" 
            v-model="socio.planMembresiaId" 
            :options="planesMembresia"
            optionLabel="nombre"
            optionValue="id"
            placeholder="Seleccionar plan"
            class="w-full"
            :class="{ 'p-invalid': submitted && !isEditing && !socio.planMembresiaId }"
            @change="onPlanChange"
          >
            <template #option="slotProps">
              <div class="flex justify-content-between align-items-center w-full">
                <span>{{ slotProps.option.nombre }}</span>
                <Tag :value="slotProps.option.tipoPlan" severity="info" class="text-xs" />
                <span class="text-red-400 font-bold">${{ slotProps.option.precioMensual.toLocaleString() }}</span>
              </div>
            </template>
          </Dropdown>          <small v-if="submitted && !isEditing && !socio.planMembresiaId" class="p-error">El plan es requerido</small>          <small v-if="selectedPlan" class="text-gray-400 block mt-1">
            {{ selectedPlan.descripcion }} - ${{ selectedPlan.precioMensual.toLocaleString() }}/mes
          </small>
          <small v-show="isEditing && socio.planMembresiaIdOriginal === null" class="text-yellow-400 block mt-1">
            <i class="pi pi-info-circle"></i> Este socio no tiene plan asignado. Puede asignarlo ahora.
          </small>
        </div>        <!-- Tipo de Socio -->
        <div class="field">
          <label class="font-medium text-gray-300">Tipo de Socio {{ !isEditing ? '*' : '' }}</label>
          <div class="flex gap-3 mt-2">
            <div class="flex align-items-center">
              <RadioButton 
                v-model="socio.tipoSocio" 
                inputId="titular" 
                value="Titular"
                :disabled="titularDisabled"
              />
              <label for="titular" class="ml-2">Titular</label>
            </div>
            <div class="flex align-items-center">
              <RadioButton v-model="socio.tipoSocio" inputId="adherente" value="Adherente" />
              <label for="adherente" class="ml-2">Adherente</label>
            </div>
          </div>
          <small v-show="isEditing && socio.tipoSocioOriginal === 'Titular' && hasAdherentes" class="text-yellow-400 block mt-2">
            <i class="pi pi-exclamation-triangle"></i> Este titular tiene adherentes asociados. No puede cambiarse a adherente.
          </small>
          <small v-show="isEditing && socio.tipoSocioOriginal != socio.tipoSocio" class="text-yellow-400 block mt-2">
            <i class="pi pi-info-circle"></i> Está cambiando el tipo de socio.
          </small>
        </div>

        <!-- Selección de Titular (solo si es Adherente) -->
        <div class="field" v-if="socio.tipoSocio === 'Adherente'">
          <label for="titular" class="font-medium text-gray-300">Socio Titular {{ !isEditing ? '*' : '' }}</label>
          <Dropdown 
            id="titular" 
            v-model="socio.titularId" 
            :options="sociosTitularesDisponibles"
            optionLabel="nombreCompleto"
            optionValue="id"
            placeholder="Seleccionar titular"
            class="w-full"
            :class="{ 'p-invalid': submitted && socio.tipoSocio === 'Adherente' && !socio.titularId }"
            :filter="true"
          >
            <template #option="slotProps">
              <div>
                <div>{{ slotProps.option.nombreCompleto }}</div>
                <small class="text-gray-400">{{ slotProps.option.numeroSocio }} - {{ slotProps.option.planNombre }}</small>
              </div>
            </template>          </Dropdown>          <small v-if="submitted && socio.tipoSocio === 'Adherente' && !socio.titularId" class="p-error">
            Debe seleccionar un titular
          </small>
          <small v-show="isEditing && socio.titularIdOriginal && socio.titularId != socio.titularIdOriginal" class="text-yellow-400 block mt-1">
            <i class="pi pi-info-circle"></i> Está cambiando el titular de este adherente.
          </small>
        </div>

        <!-- Configuración de Pagos (solo para Adherentes) -->
        <div v-if="socio.tipoSocio === 'Adherente'" class="field">
          <label class="font-medium text-gray-300 mb-2 block">¿Quién paga?</label>
          <div class="flex flex-column gap-2">
            <div class="flex align-items-center">
              <Checkbox v-model="socio.pagaCuotaElAdherente" :binary="true" inputId="pagaCuota" />
              <label for="pagaCuota" class="ml-2">El adherente paga su propia cuota</label>
            </div>
            <div class="flex align-items-center">
              <Checkbox v-model="socio.pagaDisciplinasElAdherente" :binary="true" inputId="pagaDisciplinas" />
              <label for="pagaDisciplinas" class="ml-2">El adherente paga sus disciplinas</label>
            </div>
          </div>
        </div>

        <div class="field">
          <label class="font-medium text-gray-300 mb-2 block">Notificaciones WhatsApp</label>
          <div class="flex align-items-center gap-3">
            <InputSwitch v-model="socio.recibeNotificacionesWhatsApp" />
            <span class="text-sm">{{ socio.recibeNotificacionesWhatsApp ? '✅ Activadas' : '🔕 Desactivadas' }}</span>
          </div>
        </div>

        <div class="field">
          <label for="nombre" class="font-medium text-gray-300">Nombre *</label>
          <InputText id="nombre" v-model="socio.nombre" class="w-full" :class="{ 'p-invalid': submitted && !socio.nombre }" />
          <small v-if="submitted && !socio.nombre" class="p-error">El nombre es requerido</small>
        </div>
        
        <div class="field">
          <label for="apellido" class="font-medium text-gray-300">Apellido *</label>
          <InputText id="apellido" v-model="socio.apellido" class="w-full" :class="{ 'p-invalid': submitted && !socio.apellido }" />
          <small v-if="submitted && !socio.apellido" class="p-error">El apellido es requerido</small>
        </div>

        <div class="field">
          <label for="email" class="font-medium text-gray-300">Email *</label>
          <InputText id="email" v-model="socio.email" type="email" class="w-full" :class="{ 'p-invalid': submitted && !socio.email }" />
          <small v-if="submitted && !socio.email" class="p-error">El email es requerido</small>
        </div>

        <div class="field" v-if="isEditing">
          <label for="numeroSocio" class="font-medium text-gray-300">Número de Socio</label>
          <InputText id="numeroSocio" v-model="socio.numeroSocio" class="w-full" disabled />
        </div>

        <div class="field" v-if="!isEditing">
          <label for="password" class="font-medium text-gray-300">Contraseña *</label>
          <Password id="password" v-model="socio.password" class="w-full" input-class="w-full" toggle-mask />
          <small v-if="submitted && !isEditing && !socio.password" class="p-error">La contraseña es requerida</small>
        </div>        <div class="field">
          <label for="telefono" class="font-medium text-gray-300">Teléfono</label>
          <div class="flex align-items-center gap-1">
            <span class="px-2 py-2 border-round text-color-secondary border-1 surface-border surface-ground" style="font-size:1rem;line-height:1.5;">0</span>
            <InputText
              v-model="telefonoAreaAdmin"
              style="width:70px"
              placeholder="3533"
              maxlength="4"
            />
            <span class="px-2 py-2 border-round text-color-secondary border-1 surface-border surface-ground" style="font-size:1rem;line-height:1.5;">-15-</span>
            <InputText
              v-model="telefonoNumeroAdmin"
              style="width:110px"
              placeholder="680908"
              maxlength="8"
            />
          </div>
        </div>

        <div class="field">
          <label for="dni" class="font-medium text-gray-300">DNI</label>
          <InputText id="dni" v-model="socio.dni" class="w-full" />
        </div>

        <div class="field">
          <label for="fechaNacimiento" class="font-medium text-gray-300">Fecha de Nacimiento</label>
          <Calendar 
            id="fechaNacimiento" 
            v-model="socio.fechaNacimiento" 
            dateFormat="dd/mm/yy"
            :maxDate="new Date()"
            showIcon
            class="w-full"
            placeholder="Seleccionar fecha"
          />
          <small v-if="socio.fechaNacimiento" class="text-gray-400 block mt-1">
            <i class="pi pi-calendar mr-1"></i>
            Edad: {{ calcularEdad(socio.fechaNacimiento) }} años 
            ({{ calcularEdad(socio.fechaNacimiento) >= 18 ? 'Mayor' : 'Menor' }})
          </small>
        </div>

        <div class="field">
          <label for="direccion" class="font-medium text-gray-300">Dirección</label>
          <InputText id="direccion" v-model="socio.direccion" class="w-full" />
        </div>        <div class="field">
          <label for="cuota" class="font-medium text-gray-300">Cuota Mensual</label>
          <InputNumber id="cuota" v-model="socio.cuotaSocio" mode="currency" currency="ARS" locale="es-AR" class="w-full" />
        </div>

        <!-- FASE 2: Selector de disciplinas al crear socio -->
        <div class="field" v-if="!isEditing">
          <label for="disciplinas" class="font-medium text-gray-300">Disciplinas (opcional)</label>
          <MultiSelect 
            id="disciplinas"
            v-model="socio.disciplinaIds" 
            :options="disciplinasDisponibles"
            optionLabel="nombre"
            optionValue="id"
            placeholder="Seleccionar disciplinas"
            class="w-full"
            display="chip"
          >
            <template #option="slotProps">
              <div class="flex justify-content-between align-items-center w-full">
                <span>{{ slotProps.option.nombre }}</span>
                <span class="text-green-400">${{ slotProps.option.cuotaMensual?.toLocaleString() }}/mes</span>
              </div>
            </template>
          </MultiSelect>
          <small class="text-gray-400 block mt-1">
            <i class="pi pi-info-circle"></i> Puedes inscribir al socio en disciplinas al momento de crearlo
          </small>
        </div>

        <div class="field">
          <label class="font-medium text-gray-300 mb-2 block">Foto del Socio</label>
          <ImageUpload v-model="socio.foto" placeholder="Subir foto del socio" />
        </div><div class="field" v-if="isEditing">
          <label for="activo" class="font-medium text-gray-300">Estado de Aprobación</label>
          <div class="flex align-items-center gap-2 mt-2">
            <InputSwitch id="activo" v-model="socio.activo" />
            <span class="text-gray-300">{{ socio.activo ? 'Aprobado y Activo' : 'Pendiente de Aprobación' }}</span>
          </div>
          <small v-if="!socio.activo" class="text-yellow-400 block mt-1">
            <i class="pi pi-exclamation-triangle"></i> Este socio no podrá iniciar sesión hasta que sea aprobado
          </small>
        </div>
      </div>

      <template #footer>
        <Button label="Cancelar" icon="pi pi-times" text @click="hideDialog" />
        <Button label="Guardar" icon="pi pi-check" @click="saveSocio" :loading="saving" />      </template>
    </Dialog>

    <!-- Reset Password Dialog -->
    <Dialog
      v-model:visible="resetPasswordDialog"
      header="Resetear Contraseña"
      :modal="true"
      :style="{ width: '400px' }"
      @hide="resetPwForm"
    >
      <div class="flex flex-column gap-3 pt-2">
        <p class="text-gray-300 m-0">
          Resetear contraseña para: <strong style="color: var(--text-color)">{{ resetPwSocio?.nombre }} {{ resetPwSocio?.apellido }}</strong>
        </p>
        <div>
          <label class="block text-gray-300 font-medium mb-2">Nueva contraseña *</label>
          <Password
            v-model="resetPwNueva"
            class="w-full"
            inputClass="w-full"
            toggleMask
            promptLabel="Ingresá una contraseña"
            weakLabel="Débil"
            mediumLabel="Media"
            strongLabel="Fuerte"
            :class="{ 'p-invalid': resetPwError }"
          />
          <small v-if="resetPwError" class="p-error">{{ resetPwError }}</small>
        </div>
        <Message v-if="resetPwApiError" severity="error" :closable="false">{{ resetPwApiError }}</Message>
      </div>
      <template #footer>
        <Button label="Cancelar" text @click="resetPasswordDialog = false" />
        <Button label="Resetear Contraseña" icon="pi pi-key" severity="warning" :loading="savingResetPw" @click="doResetPassword" />
      </template>
    </Dialog>

    <!-- Dialog: Enviar WhatsApp manual -->
    <Dialog
      v-model:visible="waDialog"
      header="Enviar WhatsApp"
      :modal="true"
      :style="{ width: '480px' }"
    >
      <div class="flex flex-column gap-3 pt-2">
        <p class="text-gray-300 m-0">
          Destinatario: <strong style="color: var(--text-color)">{{ waSocio?.nombre }} {{ waSocio?.apellido }}</strong>
          — <span class="text-green-400">{{ waSocio?.telefono || 'Sin teléfono' }}</span>
        </p>
        <div>
          <label class="block text-gray-300 font-medium mb-2">Mensaje</label>
          <Textarea v-model="waMensaje" rows="5" class="w-full" autoResize />
        </div>
      </div>
      <template #footer>
        <Button label="Cancelar" text @click="waDialog = false" />
        <Button label="Enviar" icon="pi pi-send" severity="success" :loading="waEnviando" @click="enviarWA" />
      </template>
    </Dialog>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useToast } from 'primevue/usetoast'
import { useConfirm } from 'primevue/useconfirm'
import { sociosService, disciplinasService, authService } from '@/services'
import { planesService } from '@/services/planesService'
import Button from 'primevue/button'
import Avatar from 'primevue/avatar'
import ProgressSpinner from 'primevue/progressspinner'
import PageHeader from '@/components/mobile/PageHeader.vue'
import MobileRecordCard from '@/components/mobile/MobileRecordCard.vue'
import MobilePaginator from '@/components/mobile/MobilePaginator.vue'
import Dialog from 'primevue/dialog'
import InputText from 'primevue/inputtext'
import InputNumber from 'primevue/inputnumber'
import InputSwitch from 'primevue/inputswitch'
import Password from 'primevue/password'
import Tag from 'primevue/tag'
import Dropdown from 'primevue/dropdown'
import RadioButton from 'primevue/radiobutton'
import Checkbox from 'primevue/checkbox'
import Calendar from 'primevue/calendar'
import MultiSelect from 'primevue/multiselect'
import Message from 'primevue/message'
import Textarea from 'primevue/textarea'
import ImageUpload from '@/components/shared/ImageUpload.vue'

const router = useRouter()
const toast = useToast()
const confirm = useConfirm()

const socios = ref([])
const planesMembresia = ref([])
const disciplinasDisponibles = ref([])
const loading = ref(false)
const socioDialog = ref(false)
const submitted = ref(false)
const saving = ref(false)
const isEditing = ref(false)

// Split phone input
const telefonoAreaAdmin = ref('')
const telefonoNumeroAdmin = ref('')

function parseTelefonoAdmin(tel) {
  if (!tel) return { area: '', numero: '' }
  let num = tel.replace(/\D/g, '')
  if (num.startsWith('549')) num = num.slice(3)
  else if (num.startsWith('54')) num = num.slice(2)
  if (num.startsWith('0')) num = num.slice(1)
  const m = num.match(/^(\d{2,4})15(\d{6,8})$/) || num.match(/^(\d{2,4})(\d{6,8})$/)
  if (m) return { area: m[1], numero: m[2] }
  return { area: '', numero: num }
}

watch([telefonoAreaAdmin, telefonoNumeroAdmin], () => {
  socio.value.telefono = `0${telefonoAreaAdmin.value}-15-${telefonoNumeroAdmin.value}`
})
const filtroEstado = ref('todos')

// Reset password
const resetPasswordDialog = ref(false)
const resetPwSocio = ref(null)
const resetPwNueva = ref('')
const resetPwError = ref('')
const resetPwApiError = ref('')
const savingResetPw = ref(false)

function openResetPassword(data) {
  resetPwSocio.value = data
  resetPwNueva.value = ''
  resetPwError.value = ''
  resetPwApiError.value = ''
  resetPasswordDialog.value = true
}

function resetPwForm() {
  resetPwNueva.value = ''
  resetPwError.value = ''
  resetPwApiError.value = ''
}

async function doResetPassword() {
  resetPwError.value = ''
  resetPwApiError.value = ''
  if (!resetPwNueva.value) { resetPwError.value = 'Requerido'; return }
  if (resetPwNueva.value.length < 6) { resetPwError.value = 'Mínimo 6 caracteres'; return }
  savingResetPw.value = true
  try {
    await authService.adminResetPasswordSocio(resetPwSocio.value.id, resetPwNueva.value)
    resetPasswordDialog.value = false
    resetPwForm()
    toast.add({ severity: 'success', summary: 'Éxito', detail: 'Contraseña reseteada correctamente', life: 3000 })
  } catch (error) {
    resetPwApiError.value = error?.response?.data?.message || 'No se pudo resetear la contraseña'
  } finally {
    savingResetPw.value = false
  }
}

// WhatsApp manual
const waDialog = ref(false)
const waSocio = ref(null)
const waMensaje = ref('')
const waEnviando = ref(false)

function openWaDialog(data) {
  waSocio.value = data
  waMensaje.value = `Hola ${data.nombre}, te contactamos desde el Club. ¿En qué podemos ayudarte?`
  waDialog.value = true
}

async function enviarWA() {
  if (!waMensaje.value.trim()) return
  waEnviando.value = true
  try {
    await sociosService.enviarWhatsApp(waSocio.value.id, waMensaje.value)
    toast.add({ severity: 'success', summary: 'Enviado', detail: 'Mensaje enviado por WhatsApp', life: 3000 })
    waDialog.value = false
  } catch (error) {
    const msg = error?.response?.data?.message || 'No se pudo enviar el mensaje'
    toast.add({ severity: 'error', summary: 'Error', detail: msg, life: 3000 })
  } finally {
    waEnviando.value = false
  }
}
const socio = ref({
  tipoSocio: 'Titular',
  pagaCuotaElAdherente: true,
  pagaDisciplinasElAdherente: true,
  // Campos para tracking de cambios
  planMembresiaIdOriginal: null,
  tipoSocioOriginal: null,
  titularIdOriginal: null
})

const hasAdherentes = ref(false)

const searchTerm = ref('')
const currentPage = ref(1)

// Computed: Contadores de socios
const sociosPendientes = computed(() => socios.value.filter(s => !s.activo).length)
const sociosActivos = computed(() => socios.value.filter(s => s.activo).length)

// Computed: Socios filtrados según el estado seleccionado
const sociosFiltrados = computed(() => {
  let list = socios.value
  if (filtroEstado.value === 'pendientes') {
    list = list.filter(s => !s.activo)
  } else if (filtroEstado.value === 'activos') {
    list = list.filter(s => s.activo)
  }
  if (searchTerm.value.trim()) {
    const q = searchTerm.value.toLowerCase()
    list = list.filter(s =>
      s.nombre?.toLowerCase().includes(q) ||
      s.email?.toLowerCase().includes(q) ||
      s.numeroSocio?.toString().includes(q)
    )
  }
  return list
})

const paginatedSocios = computed(() => {
  const start = (currentPage.value - 1) * 10
  return sociosFiltrados.value.slice(start, start + 10)
})

watch([filtroEstado, searchTerm], () => { currentPage.value = 1 })

// Computed: Plan seleccionado
const selectedPlan = computed(() => {
  if (!socio.value.planMembresiaId) return null
  return planesMembresia.value.find(p => p.id === socio.value.planMembresiaId)
})

// Computed: Socios titulares disponibles (excluye el socio actual si está editando)
const sociosTitularesDisponibles = computed(() => {
  return socios.value
    .filter(s => 
      s.tipoSocio === 'Titular' && 
      s.activo && 
      (!isEditing.value || s.id !== socio.value.id) // Excluir el socio actual
    )
    .map(s => ({
      ...s,
      nombreCompleto: `${s.nombre} ${s.apellido}`,
      planNombre: s.planMembresia?.nombre || 'Sin plan'
    }))
})

// Computed: Socios titulares (sin excluir el actual, para crear)
const sociosTitulares = computed(() => {
  return socios.value
    .filter(s => s.tipoSocio === 'Titular' && s.activo)
    .map(s => ({
      ...s,
      nombreCompleto: `${s.nombre} ${s.apellido}`,
      planNombre: s.planMembresia?.nombre || 'Sin plan'
    }))
})

// Computed: Para evitar errores en v-if complejos
const titularDisabled = computed(() => {
  return isEditing.value && socio.value.tipoSocioOriginal === 'Titular' && hasAdherentes.value
})

// Función para calcular la edad desde la fecha de nacimiento
function calcularEdad(fechaNacimiento) {
  if (!fechaNacimiento) return 0
  const hoy = new Date()
  const nacimiento = new Date(fechaNacimiento)
  let edad = hoy.getFullYear() - nacimiento.getFullYear()
  const mes = hoy.getMonth() - nacimiento.getMonth()
  if (mes < 0 || (mes === 0 && hoy.getDate() < nacimiento.getDate())) {
    edad--
  }
  return edad
}

async function loadSocios() {
  loading.value = true
  try {
    socios.value = await sociosService.getAll()
  } catch (error) {
    toast.add({ severity: 'error', summary: 'Error', detail: 'No se pudieron cargar los socios', life: 3000 })
  } finally {
    loading.value = false
  }
}

async function loadPlanes() {
  try {
    planesMembresia.value = await planesService.getAll(true) // Solo planes activos
  } catch (error) {
    console.error('Error cargando planes:', error)
  }
}

async function loadDisciplinas() {
  try {
    disciplinasDisponibles.value = await disciplinasService.getAll()
  } catch (error) {
    console.error('Error cargando disciplinas:', error)
  }
}

function onPlanChange() {
  // Actualizar la cuota del socio según el plan seleccionado
  if (selectedPlan.value) {
    socio.value.cuotaSocio = selectedPlan.value.precioMensual
  }
}

function openNew() {
  socio.value = { 
    cuotaSocio: 0, 
    activo: true,
    tipoSocio: 'Titular',
    disciplinaIds: [], // FASE 2: Inicializar array de disciplinas
    pagaCuotaElAdherente: true,
    pagaDisciplinasElAdherente: true,
    recibeNotificacionesWhatsApp: true,
    planMembresiaIdOriginal: null,
    tipoSocioOriginal: null,
    titularIdOriginal: null
  }
  hasAdherentes.value = false
  submitted.value = false
  isEditing.value = false
  telefonoAreaAdmin.value = ''
  telefonoNumeroAdmin.value = ''
  socioDialog.value = true
}

function editSocio(data) {
  socio.value = { 
    ...data,
    // Guardar valores originales para tracking de cambios
    planMembresiaIdOriginal: data.planMembresiaId,
    tipoSocioOriginal: data.tipoSocio || 'Titular',
    titularIdOriginal: data.titularId,
    // Asegurar valores por defecto
    tipoSocio: data.tipoSocio || 'Titular',
    pagaCuotaElAdherente: data.pagaCuotaElAdherente ?? true,
    pagaDisciplinasElAdherente: data.pagaDisciplinasElAdherente ?? true,
    recibeNotificacionesWhatsApp: data.recibeNotificacionesWhatsApp ?? true
  }
  
  // Verificar si el socio tiene adherentes (si es Titular)
  if (data.tipoSocio === 'Titular') {
    hasAdherentes.value = socios.value.some(s => s.titularId === data.id)
    } else {
    hasAdherentes.value = false
  }
  
  isEditing.value = true
  submitted.value = false
  const parsed = parseTelefonoAdmin(data.telefono)
  telefonoAreaAdmin.value = parsed.area
  telefonoNumeroAdmin.value = parsed.numero
  socioDialog.value = true
}

function viewSocio(data) {
  router.push(`/admin/socios/${data.id}`)
}

function hideDialog() {
  socioDialog.value = false
  submitted.value = false
}

async function saveSocio() {
  submitted.value = true

  // Validaciones
  if (!socio.value.nombre || !socio.value.apellido || !socio.value.email) {
    return
  }

  if (!isEditing.value) {
    if (!socio.value.password) return
    if (!socio.value.planMembresiaId) return
    if (socio.value.tipoSocio === 'Adherente' && !socio.value.titularId) return
  } else {
    // Validaciones al editar
    if (socio.value.tipoSocio === 'Adherente' && !socio.value.titularId) {
      toast.add({ 
        severity: 'warn', 
        summary: 'Validación', 
        detail: 'Debe seleccionar un titular para el adherente', 
        life: 3000 
      })
      return
    }
    // No permitir cambiar a Adherente si tiene adherentes propios
    if (hasAdherentes.value && socio.value.tipoSocio === 'Adherente') {
      toast.add({ 
        severity: 'error', 
        summary: 'Error', 
        detail: 'Este socio tiene adherentes asociados. No puede cambiarse a adherente.', 
        life: 3000 
      })
      return
    }
  }
  saving.value = true
  try {
    if (isEditing.value) {
      const updateData = {
        nombre: socio.value.nombre,
        apellido: socio.value.apellido,
        email: socio.value.email,
        telefono: socio.value.telefono || '',
        dni: socio.value.dni || '',
        direccion: socio.value.direccion || '',
        fechaNacimiento: socio.value.fechaNacimiento || null,
        cuotaSocio: socio.value.cuotaSocio || 0,
        foto: socio.value.foto,
        activo: socio.value.activo,
        // Incluir campos de plan y adherente
        planMembresiaId: socio.value.planMembresiaId,
        tipoSocio: socio.value.tipoSocio,
        titularId: socio.value.tipoSocio === 'Adherente' ? socio.value.titularId : null,
        pagaCuotaElAdherente: socio.value.tipoSocio === 'Adherente' ? socio.value.pagaCuotaElAdherente : false,
        pagaDisciplinasElAdherente: socio.value.tipoSocio === 'Adherente' ? socio.value.pagaDisciplinasElAdherente : false,
        recibeNotificacionesWhatsApp: socio.value.recibeNotificacionesWhatsApp ?? true
      }
      
      await sociosService.update(socio.value.id, updateData)
      toast.add({ severity: 'success', summary: 'Éxito', detail: 'Socio actualizado', life: 3000 })    } else {
      await sociosService.create({
        nombre: socio.value.nombre,
        apellido: socio.value.apellido,
        email: socio.value.email,
        password: socio.value.password,
        telefono: socio.value.telefono || '',
        dni: socio.value.dni || '',
        direccion: socio.value.direccion || '',
        fechaNacimiento: socio.value.fechaNacimiento || null,
        cuotaSocio: socio.value.cuotaSocio || 0,
        foto: socio.value.foto,
        planMembresiaId: socio.value.planMembresiaId,
        tipoSocio: socio.value.tipoSocio,
        titularId: socio.value.tipoSocio === 'Adherente' ? socio.value.titularId : null,
        pagaCuotaElAdherente: socio.value.tipoSocio === 'Adherente' ? socio.value.pagaCuotaElAdherente : false,
        pagaDisciplinasElAdherente: socio.value.tipoSocio === 'Adherente' ? socio.value.pagaDisciplinasElAdherente : false
      })
      toast.add({ severity: 'success', summary: 'Éxito', detail: 'Socio creado', life: 3000 })
    }
    hideDialog()
    await loadSocios()
  } catch (error) {
    toast.add({ 
      severity: 'error', 
      summary: 'Error', 
      detail: error.response?.data?.message || 'Error al guardar el socio', 
      life: 3000 
    })
  } finally {
    saving.value = false
  }
}

function confirmDelete(data) {
  confirm.require({
    message: `¿Está seguro de eliminar al socio ${data.nombre}?`,
    header: 'Confirmar eliminación',
    icon: 'pi pi-exclamation-triangle',
    acceptClass: 'p-button-danger',
    accept: async () => {
      try {
        await sociosService.delete(data.id)
        toast.add({ severity: 'success', summary: 'Éxito', detail: 'Socio eliminado', life: 3000 })
        await loadSocios()
      } catch (error) {
        toast.add({ severity: 'error', summary: 'Error', detail: 'No se pudo eliminar el socio', life: 3000 })
      }
    }
  })
}

async function aprobarSocio(data) {
  confirm.require({
    message: `¿Confirmar aprobación del socio ${data.nombre} ${data.apellido}?`,
    header: 'Aprobar Socio',
    icon: 'pi pi-check-circle',
    acceptLabel: 'Aprobar',
    rejectLabel: 'Cancelar',
    acceptClass: 'p-button-success',
    accept: async () => {
      try {
        await sociosService.update(data.id, { ...data, activo: true })
        toast.add({ 
          severity: 'success', 
          summary: 'Socio Aprobado', 
          detail: `${data.nombre} ${data.apellido} puede iniciar sesión`, 
          life: 3000 
        })
        await loadSocios()
      } catch (error) {
        toast.add({ 
          severity: 'error', 
          summary: 'Error', 
          detail: 'No se pudo aprobar el socio', 
          life: 3000 
        })
      }
    }
  })
}

onMounted(() => {
  loadSocios()
  loadPlanes()
  loadDisciplinas() // FASE 2: Cargar disciplinas disponibles
})
</script>

<style scoped>
.avatar-red {
  background-color: #dc2626 !important;
  color: white !important;
}
</style>
