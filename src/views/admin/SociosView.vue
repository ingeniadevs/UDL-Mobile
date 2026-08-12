<template>
  <div>
    <PageHeader title="Socios">
      <template #actions>
        <Button label="Nuevo Socio" icon="pi pi-plus" size="small" @click="openNew" />
      </template>
    </PageHeader>

    <!-- Stat cards -->
    <div class="grid mb-4">
      <div class="col-6 md:col-3">
        <div class="stat-card stat-total">
          <div class="stat-icon"><i class="pi pi-users"></i></div>
          <div class="stat-content">
            <span class="stat-value">{{ socios.length }}</span>
            <span class="stat-label">Total Socios</span>
          </div>
        </div>
      </div>
      <div class="col-6 md:col-3">
        <div class="stat-card stat-success">
          <div class="stat-icon"><i class="pi pi-check-circle"></i></div>
          <div class="stat-content">
            <span class="stat-value">{{ sociosActivos }}</span>
            <span class="stat-label">Activos</span>
          </div>
        </div>
      </div>
      <div class="col-6 md:col-3">
        <div class="stat-card stat-warning">
          <div class="stat-icon"><i class="pi pi-ban"></i></div>
          <div class="stat-content">
            <span class="stat-value">{{ sociosInactivos }}</span>
            <span class="stat-label">Inactivos</span>
            <Button v-if="sociosInactivos > 0" label="Ver" size="small" text @click="filtroEstado = 'inactivos'" />
          </div>
        </div>
      </div>
      <div class="col-6 md:col-3">
        <div class="stat-card stat-mutual">
          <div class="stat-icon"><i class="pi pi-building"></i></div>
          <div class="stat-content">
            <span class="stat-value">{{ socios.filter(s => s.pagaPorMutual).length }}</span>
            <span class="stat-label">Cobro Mutual</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Filtros -->
    <div class="card mb-4">
      <div class="flex flex-wrap align-items-center gap-3">
        <span class="p-input-icon-left flex-1" style="min-width: 200px">
          <i class="pi pi-search" />
          <InputText v-model="filters['global'].value" placeholder="Buscar por nombre, email o número..." class="w-full" />
        </span>
        <div class="flex gap-2 flex-wrap">
          <Button :label="`Todos (${socios.length})`" :outlined="filtroEstado !== 'todos'" size="small" @click="filtroEstado = 'todos'" />
          <Button :label="`Inactivos (${sociosInactivos})`" :outlined="filtroEstado !== 'inactivos'" :severity="sociosInactivos > 0 ? 'warning' : undefined" size="small" @click="filtroEstado = 'inactivos'" />
          <Button :label="`Activos (${sociosActivos})`" :outlined="filtroEstado !== 'activos'" severity="success" size="small" @click="filtroEstado = 'activos'" />
        </div>
      </div>
    </div>

    <div v-if="loading" class="flex justify-content-center py-5">
      <ProgressSpinner />
    </div>
    <template v-else>
      <div v-if="sociosParaMostrar.length === 0" class="card text-center py-5 text-gray-400">
        <i class="pi pi-users text-4xl text-gray-600 mb-3 block"></i>
        <p class="mb-3">No se encontraron socios</p>
        <Button label="Nuevo Socio" icon="pi pi-plus" size="small" @click="openNew" />
      </div>
      <div v-else class="mobile-card-list">
        <MobileRecordCard
          v-for="item in paginatedSocios"
          :key="item.id"
          :title="`${item.nombre} ${item.apellido}`"
          :subtitle="`#${item.numeroSocio} · ${item.email}`"
          @click="viewSocio(item)"
        >
          <template #leading>
            <Avatar :label="(item.nombre?.charAt(0) + (item.apellido?.charAt(0) || '')).toUpperCase()" shape="circle" class="avatar-red" />
          </template>
          <template #tags>
            <Tag :severity="item.activo ? 'success' : 'danger'" :value="item.activo ? 'Activo' : 'Inactivo'" />
            <Tag v-if="item.pagaPorMutual" value="Mutual" severity="warning" v-tooltip.top="'Cobra por mutual — cuota no se genera automáticamente'" />
          </template>
          <template #body>
            <div class="record-card__row">
              <span class="record-card__label">Teléfono</span>
              <span class="record-card__value">{{ item.telefono || '—' }}</span>
            </div>
            <div class="record-card__row">
              <span class="record-card__label">Cuota</span>
              <span class="record-card__value text-green-400">${{ item.cuotaSocio?.toLocaleString() }}</span>
            </div>
            <div class="record-card__row">
              <span class="record-card__label">Plan</span>
              <span class="record-card__value">{{ item.planNombre || 'Sin plan' }}</span>
            </div>
            <div class="record-card__row">
              <span class="record-card__label">Tipo</span>
              <span class="record-card__value">
                <Tag v-if="item.tipoSocio === 'Adherente'" value="Adherente" severity="info"
                  v-tooltip.top="item.titularNombreCompleto ? `Adherente de: ${item.titularNombreCompleto}` : 'Adherente'" />
                <Tag v-else :value="item.cantidadAdherentes > 0 ? `Titular (${item.cantidadAdherentes})` : 'Titular'" severity="success"
                  v-tooltip.top="item.cantidadAdherentes > 0 ? `Titular con ${item.cantidadAdherentes} adherente(s)` : 'Titular'" />
              </span>
            </div>
            <div v-if="item.disciplinasActivas?.length" class="flex flex-wrap gap-1 mt-1">
              <Tag v-for="d in item.disciplinasActivas" :key="d" :value="d" severity="secondary" style="font-size: 0.7rem" />
            </div>
            <div v-else class="text-xs text-gray-600">Sin disciplinas</div>
          </template>
          <template #actions>
            <Button v-if="!item.activo" icon="pi pi-check-circle" text rounded size="small" severity="success" @click="aprobarSocio(item)" v-tooltip.top="'Activar socio'" />
            <Button icon="pi pi-eye" text rounded size="small" @click="viewSocio(item)" v-tooltip.top="'Ver detalle'" />
            <Button icon="pi pi-pencil" text rounded size="small" severity="info" @click="editSocio(item)" v-tooltip.top="'Editar'" />
            <Button v-if="item.activo" icon="pi pi-ban" text rounded size="small" severity="danger" @click="confirmDesactivar(item)" v-tooltip.top="'Desactivar'" />
            <Button icon="pi pi-key" text rounded size="small" severity="warning" @click="openResetPassword(item)" v-tooltip.top="'Resetear Contraseña'" />
            <Button icon="pi pi-whatsapp" text rounded size="small" severity="success" @click="openWaDialog(item)" v-tooltip.top="'Enviar WhatsApp'" />
          </template>
        </MobileRecordCard>
      </div>
      <MobilePaginator v-model:page="sociosPage" :rows="10" :total="sociosParaMostrar.length" />
    </template>

    <!-- Create/Edit Dialog -->
    <Dialog 
      v-model:visible="socioDialog" 
      :header="isEditing ? 'Editar Socio' : 'Nuevo Socio'" 
      :modal="true"
      :style="{ width: '500px' }"
    >      <div class="flex flex-column gap-4 pt-3">
        <Message v-if="saving" severity="info" :closable="false">
          <span class="flex align-items-center gap-2">
            <i class="pi pi-spin pi-spinner"></i>
            Guardando socio...
          </span>
        </Message>
        <Message v-if="saveError" severity="error" :closable="false">{{ saveError }}</Message>
        <Message v-if="hasFormErrors" severity="warn" :closable="false">
          Revisá los campos marcados antes de continuar.
        </Message>

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
            :class="{ 'p-invalid': !!formErrors.planMembresiaId }"
            @change="onPlanChange"
          >
            <template #option="slotProps">
              <div class="flex justify-content-between align-items-center w-full">
                <span>{{ slotProps.option.nombre }}</span>
                <Tag :value="slotProps.option.tipoPlan" severity="info" class="text-xs" />
                <span class="text-red-400 font-bold">${{ slotProps.option.precioMensual.toLocaleString() }}</span>
              </div>
            </template>
          </Dropdown>          <small v-if="formErrors.planMembresiaId" class="p-error">{{ formErrors.planMembresiaId }}</small>          <small v-if="selectedPlan" class="text-gray-400 block mt-1">
            {{ selectedPlan.descripcion }} - ${{ selectedPlan.precioMensual.toLocaleString() }}/mes
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
              <RadioButton
                v-model="socio.tipoSocio"
                inputId="adherente"
                value="Adherente"
                :disabled="adherenteDisabled"
              />
              <label for="adherente" class="ml-2" :class="{ 'text-gray-500': adherenteDisabled }">Adherente</label>
            </div>
          </div>
          <small v-show="adherenteDisabled" class="text-gray-400 block mt-2">
            <i class="pi pi-info-circle"></i> El plan individual no permite socios adherentes.
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
            :class="{ 'p-invalid': !!formErrors.titularId }"
            :filter="true"
          >
            <template #option="slotProps">
              <div>
                <div>{{ slotProps.option.nombreCompleto }}</div>
                <small class="text-gray-400">{{ slotProps.option.numeroSocio }} - {{ slotProps.option.planNombre }}</small>
              </div>
            </template>          </Dropdown>          <small v-if="formErrors.titularId" class="p-error">
            {{ formErrors.titularId }}
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

        <!-- Cobro por Mutual -->
        <div class="field">
          <label class="font-medium text-gray-300 mb-2 block">Método de cobro de cuota</label>
          <div class="flex align-items-center gap-2">
            <InputSwitch v-model="socio.pagaPorMutual" inputId="pagaPorMutual" />
            <div>
              <label for="pagaPorMutual" class="block" :class="socio.pagaPorMutual ? 'text-white font-medium' : 'text-gray-400'">
                Cobra por Mutual
              </label>
              <small class="text-gray-500 block">
                {{ socio.pagaPorMutual ? 'La cuota NO se genera automáticamente — el admin la registra vía Cobro Mutual.' : 'La cuota se genera automáticamente cada mes.' }}
              </small>
            </div>
          </div>
        </div>

        <div class="field">
          <label for="nombre" class="font-medium text-gray-300">Nombre *</label>
          <InputText id="nombre" v-model="socio.nombre" class="w-full" :class="{ 'p-invalid': !!formErrors.nombre }" />
          <small v-if="formErrors.nombre" class="p-error">{{ formErrors.nombre }}</small>
        </div>
        
        <div class="field">
          <label for="apellido" class="font-medium text-gray-300">Apellido *</label>
          <InputText id="apellido" v-model="socio.apellido" class="w-full" :class="{ 'p-invalid': !!formErrors.apellido }" />
          <small v-if="formErrors.apellido" class="p-error">{{ formErrors.apellido }}</small>
        </div>

        <div class="field">
          <label for="email" class="font-medium text-gray-300">Email *</label>
          <InputText id="email" v-model="socio.email" type="email" class="w-full" :class="{ 'p-invalid': !!formErrors.email }" />
          <small v-if="formErrors.email" class="p-error">{{ formErrors.email }}</small>
        </div>

        <div class="field" v-if="isEditing">
          <label for="numeroSocio" class="font-medium text-gray-300">Número de Socio</label>
          <InputText id="numeroSocio" v-model="socio.numeroSocio" class="w-full" disabled />
        </div>

        <div class="field" v-if="!isEditing">
          <label for="password" class="font-medium text-gray-300">Contraseña *</label>
          <Password id="password" v-model="socioPassword" class="w-full" input-class="w-full" toggle-mask />
          <small v-if="formErrors.password" class="p-error">{{ formErrors.password }}</small>
        </div>        <div class="field">
          <label for="telefono" class="font-medium text-gray-300">Teléfono</label>
          <div class="flex align-items-center gap-1">
            <span class="px-2 py-2 border-round text-color-secondary border-1 surface-border surface-ground" style="font-size:1rem;line-height:1.5;">+549</span>
            <InputText
              v-model="telefonoAreaAdmin"
              style="width:70px"
              placeholder="3533"
              maxlength="4"
            />
            <InputText
              v-model="telefonoNumeroAdmin"
              style="width:110px"
              placeholder="680908"
              maxlength="8"
            />
          </div>
          <small class="text-gray-400 block mt-1">Se guarda como +549 para WhatsApp y notificaciones.</small>
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
            <span v-if="obtenerCategoria(socio.fechaNacimiento)">
              · Categoría: {{ obtenerCategoria(socio.fechaNacimiento) }}
            </span>
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
          — <span class="text-green-400">{{ formatTelefonoDisplay(waSocio?.telefono) || 'Sin teléfono' }}</span>
        </p>
        <div>
          <label class="block text-gray-300 font-medium mb-2">Mensaje</label>
          <Textarea v-model="waMensaje" rows="5" class="w-full" autoResize />
        </div>
      </div>
      <template #footer>
        <Button label="Cancelar" text @click="waDialog = false" />
        <Button
          label="WhatsApp Web"
          icon="pi pi-whatsapp"
          severity="success"
          outlined
          @click="abrirWaWeb"
          :disabled="!waSocio?.telefono"
        />

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
import { useMobilePagination } from '@/composables/useMobilePagination'
import PageHeader from '@/components/mobile/PageHeader.vue'
import MobileRecordCard from '@/components/mobile/MobileRecordCard.vue'
import MobilePaginator from '@/components/mobile/MobilePaginator.vue'
import { FilterMatchMode } from 'primevue/api'
import Button from 'primevue/button'
import Dialog from 'primevue/dialog'
import InputText from 'primevue/inputtext'
import InputNumber from 'primevue/inputnumber'
import InputSwitch from 'primevue/inputswitch'
import Password from 'primevue/password'
import Tag from 'primevue/tag'
import Avatar from 'primevue/avatar'
import Dropdown from 'primevue/dropdown'
import RadioButton from 'primevue/radiobutton'
import Checkbox from 'primevue/checkbox'
import Calendar from 'primevue/calendar'
import MultiSelect from 'primevue/multiselect'
import Message from 'primevue/message'
import Textarea from 'primevue/textarea'
import ProgressSpinner from 'primevue/progressspinner'
import ImageUpload from '@/components/shared/ImageUpload.vue'
import {
  toLocalCalendarDate,
  normalizeReservaFechaForApi,
  calcularEdadDesdeFechaNacimiento,
  obtenerCategoriaDesdeFechaNacimiento
} from '@/utils/reservationDates'
import { parseTelefonoAR, formatTelefonoStorageAR, formatTelefonoDisplay, openWhatsApp, validarTelefonoAR } from '@/utils/phone'

const router = useRouter()
const toast = useToast()
const confirm = useConfirm()

const socios = ref([])
const planesMembresia = ref([])
const disciplinasDisponibles = ref([])
const loading = ref(false)
const socioDialog = ref(false)
const formErrors = ref({})
const saveError = ref('')
const saving = ref(false)
const isEditing = ref(false)
const socioPassword = ref('')

const hasFormErrors = computed(() => Object.keys(formErrors.value).length > 0)

const socio = ref({
  tipoSocio: 'Titular',
  pagaCuotaElAdherente: false,
  pagaDisciplinasElAdherente: true,
  pagaPorMutual: false,
  // Campos para tracking de cambios
  planMembresiaIdOriginal: null,
  tipoSocioOriginal: null,
  titularIdOriginal: null
})

function clearFormErrors() {
  formErrors.value = {}
  saveError.value = ''
}

function clearFieldError(key) {
  if (!formErrors.value[key]) return
  const next = { ...formErrors.value }
  delete next[key]
  formErrors.value = next
}

function validateForm() {
  const errors = {}

  if (!socio.value.nombre?.trim()) errors.nombre = 'El nombre es requerido'
  if (!socio.value.apellido?.trim()) errors.apellido = 'El apellido es requerido'
  if (!socio.value.email?.trim()) errors.email = 'El email es requerido'

  if (!isEditing.value) {
    if (!socioPassword.value) errors.password = 'La contraseña es requerida'
    if (!socio.value.planMembresiaId) errors.planMembresiaId = 'El plan es requerido'
  }

  if (socio.value.tipoSocio === 'Adherente' && !socio.value.titularId) {
    errors.titularId = 'Debe seleccionar un titular'
  }

  formErrors.value = errors
  return Object.keys(errors).length === 0
}

watch(() => socio.value.nombre, () => clearFieldError('nombre'))
watch(() => socio.value.apellido, () => clearFieldError('apellido'))
watch(() => socio.value.email, () => clearFieldError('email'))
watch(() => socio.value.planMembresiaId, () => clearFieldError('planMembresiaId'))
watch(() => socio.value.titularId, () => clearFieldError('titularId'))
watch(() => socio.value.tipoSocio, () => clearFieldError('titularId'))
watch(socioPassword, () => clearFieldError('password'))

// Split phone input
const telefonoAreaAdmin = ref('')
const telefonoNumeroAdmin = ref('')

watch([telefonoAreaAdmin, telefonoNumeroAdmin], () => {
  const formatted = formatTelefonoStorageAR(telefonoAreaAdmin.value, telefonoNumeroAdmin.value)
  if (formatted) socio.value.telefono = formatted
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

function abrirWaWeb() {
  if (!waSocio.value?.telefono || !waMensaje.value.trim()) return
  const { valido, error } = validarTelefonoAR(waSocio.value.telefono)
  if (!valido) {
    toast.add({ severity: 'warn', summary: 'Teléfono inválido', detail: error, life: 4000 })
    return
  }
  if (!openWhatsApp(waSocio.value.telefono, waMensaje.value)) {
    toast.add({ severity: 'error', summary: 'Error', detail: 'No se pudo abrir WhatsApp Web', life: 3000 })
  }
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

const hasAdherentes = ref(false)

const filters = ref({
  global: { value: null, matchMode: FilterMatchMode.CONTAINS }
})

// Computed: Contadores de socios
const sociosInactivos = computed(() => socios.value.filter(s => !s.activo).length)
const sociosActivos = computed(() => socios.value.filter(s => s.activo).length)

// Computed: Socios filtrados según el estado seleccionado
const sociosFiltrados = computed(() => {
  if (filtroEstado.value === 'inactivos') {
    return socios.value.filter(s => !s.activo)
  } else if (filtroEstado.value === 'activos') {
    return socios.value.filter(s => s.activo)
  }
  return socios.value
})

const sociosParaMostrar = computed(() => {
  const search = (filters.value['global']?.value || '').toLowerCase()
  const base = sociosFiltrados.value
  if (!search) return base
  return base.filter(s =>
    s.nombre?.toLowerCase().includes(search) ||
    s.apellido?.toLowerCase().includes(search) ||
    s.email?.toLowerCase().includes(search) ||
    String(s.numeroSocio).includes(search)
  )
})

const { page: sociosPage, paginated: paginatedSocios } = useMobilePagination(
  sociosParaMostrar,
  10,
  [() => filters.value.global?.value, filtroEstado]
)

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

const adherenteDisabled = computed(() => selectedPlan.value?.tipoPlan === 'Individual')

// Función para calcular la edad desde la fecha de nacimiento
function calcularEdad(fechaNacimiento) {
  return calcularEdadDesdeFechaNacimiento(fechaNacimiento)
}

function obtenerCategoria(fechaNacimiento) {
  return obtenerCategoriaDesdeFechaNacimiento(fechaNacimiento)
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
  if (selectedPlan.value) {
    socio.value.cuotaSocio = selectedPlan.value.precioMensual
    if (selectedPlan.value.tipoPlan === 'Individual' && socio.value.tipoSocio === 'Adherente') {
      socio.value.tipoSocio = 'Titular'
      socio.value.titularId = null
    }
  }
}

function openNew() {
  socio.value = { 
    cuotaSocio: 0, 
    activo: true,
    tipoSocio: 'Titular',
    disciplinaIds: [], // FASE 2: Inicializar array de disciplinas
    pagaCuotaElAdherente: false,
    pagaDisciplinasElAdherente: true,
    pagaPorMutual: false,
    recibeNotificacionesWhatsApp: true,
    planMembresiaIdOriginal: null,
    tipoSocioOriginal: null,
    titularIdOriginal: null
  }
  hasAdherentes.value = false
  clearFormErrors()
  socioPassword.value = ''
  isEditing.value = false
  telefonoAreaAdmin.value = ''
  telefonoNumeroAdmin.value = ''
  socioDialog.value = true
}

function editSocio(data) {
  socio.value = { 
    ...data,
    fechaNacimiento: toLocalCalendarDate(data.fechaNacimiento),
    // Guardar valores originales para tracking de cambios
    planMembresiaIdOriginal: data.planMembresiaId,
    tipoSocioOriginal: data.tipoSocio || 'Titular',
    titularIdOriginal: data.titularId,
    // Asegurar valores por defecto
    tipoSocio: data.tipoSocio || 'Titular',
    pagaCuotaElAdherente: data.pagaCuotaElAdherente ?? false,
    pagaDisciplinasElAdherente: data.pagaDisciplinasElAdherente ?? true,
    pagaPorMutual: data.pagaPorMutual ?? false,
    recibeNotificacionesWhatsApp: data.recibeNotificacionesWhatsApp ?? true
  }
  
  // Verificar si el socio tiene adherentes (si es Titular)
  if (data.tipoSocio === 'Titular') {
    hasAdherentes.value = socios.value.some(s => s.titularId === data.id)
    } else {
    hasAdherentes.value = false
  }
  
  isEditing.value = true
  clearFormErrors()
  socioPassword.value = ''
  const parsed = parseTelefonoAR(data.telefono)
  telefonoAreaAdmin.value = parsed.area
  telefonoNumeroAdmin.value = parsed.numero
  socioDialog.value = true
}

function viewSocio(data) {
  router.push(`/admin/socios/${data.id}`)
}

function hideDialog() {
  socioDialog.value = false
  clearFormErrors()
  socioPassword.value = ''
}

async function saveSocio() {
  saveError.value = ''

  if (!validateForm()) return

  if (isEditing.value) {
    if (hasAdherentes.value && socio.value.tipoSocio === 'Adherente') {
      saveError.value = 'Este socio tiene adherentes asociados. No puede cambiarse a adherente.'
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
        fechaNacimiento: normalizeReservaFechaForApi(socio.value.fechaNacimiento),
        cuotaSocio: socio.value.cuotaSocio || 0,
        foto: socio.value.foto,
        activo: socio.value.activo,
        // Incluir campos de plan y adherente
        planMembresiaId: socio.value.planMembresiaId,
        tipoSocio: socio.value.tipoSocio,
        titularId: socio.value.tipoSocio === 'Adherente' ? socio.value.titularId : null,
        pagaCuotaElAdherente: socio.value.tipoSocio === 'Adherente' ? socio.value.pagaCuotaElAdherente : false,
        pagaDisciplinasElAdherente: socio.value.tipoSocio === 'Adherente' ? socio.value.pagaDisciplinasElAdherente : false,
        recibeNotificacionesWhatsApp: socio.value.recibeNotificacionesWhatsApp ?? true,
        pagaPorMutual: socio.value.pagaPorMutual ?? false
      }
      
      await sociosService.update(socio.value.id, updateData)
      toast.add({ severity: 'success', summary: 'Éxito', detail: 'Socio actualizado', life: 3000 })    } else {
      await sociosService.create({
        nombre: socio.value.nombre,
        apellido: socio.value.apellido,
        email: socio.value.email,
        password: socioPassword.value,
        telefono: socio.value.telefono || '',
        dni: socio.value.dni || '',
        direccion: socio.value.direccion || '',
        fechaNacimiento: normalizeReservaFechaForApi(socio.value.fechaNacimiento),
        cuotaSocio: socio.value.cuotaSocio || 0,
        foto: socio.value.foto,
        planMembresiaId: socio.value.planMembresiaId,
        tipoSocio: socio.value.tipoSocio,
        titularId: socio.value.tipoSocio === 'Adherente' ? socio.value.titularId : null,
        pagaCuotaElAdherente: socio.value.tipoSocio === 'Adherente' ? socio.value.pagaCuotaElAdherente : false,
        pagaDisciplinasElAdherente: socio.value.tipoSocio === 'Adherente' ? socio.value.pagaDisciplinasElAdherente : false,
        recibeNotificacionesWhatsApp: socio.value.recibeNotificacionesWhatsApp ?? true,
        pagaPorMutual: socio.value.pagaPorMutual ?? false
      })
      toast.add({ severity: 'success', summary: 'Éxito', detail: 'Socio creado', life: 3000 })
    }
    hideDialog()
    await loadSocios()
  } catch (error) {
    saveError.value = error.response?.data?.message || 'Error al guardar el socio'
    toast.add({ 
      severity: 'error', 
      summary: 'Error', 
      detail: saveError.value, 
      life: 3000 
    })
  } finally {
    saving.value = false
  }
}

function confirmDesactivar(data) {
  confirm.require({
    message: `¿Desactivar a ${data.nombre} ${data.apellido}? El socio no podrá iniciar sesión pero sus datos se conservarán.`,
    header: 'Desactivar socio',
    icon: 'pi pi-ban',
    acceptLabel: 'Desactivar',
    rejectLabel: 'Cancelar',
    acceptClass: 'p-button-danger',
    accept: async () => {
      try {
        await sociosService.update(data.id, { ...data, activo: false })
        toast.add({ severity: 'success', summary: 'Socio desactivado', detail: `${data.nombre} ${data.apellido} fue desactivado`, life: 3000 })
        await loadSocios()
      } catch (error) {
        toast.add({ severity: 'error', summary: 'Error', detail: 'No se pudo desactivar el socio', life: 3000 })
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
          summary: 'Socio Activado', 
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
.stat-card {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1.25rem;
  border-radius: 12px;
  background: var(--surface-card);
  border: 1px solid var(--surface-border);
}

.stat-icon {
  width: 50px;
  height: 50px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.stat-icon i { font-size: 1.5rem; color: white; }

.stat-total .stat-icon   { background: linear-gradient(135deg, #6366f1, #8b5cf6); }
.stat-success .stat-icon { background: linear-gradient(135deg, #22c55e, #16a34a); }
.stat-warning .stat-icon { background: linear-gradient(135deg, #f59e0b, #d97706); }
.stat-mutual .stat-icon  { background: linear-gradient(135deg, #3b82f6, #2563eb); }

.stat-content { display: flex; flex-direction: column; }
.stat-value { font-size: 1.75rem; font-weight: 700; color: var(--text-color); }
.stat-label { font-size: 0.85rem; color: var(--text-color-secondary); }

.avatar-red {
  background-color: #dc2626 !important;
  color: white !important;
}
</style>
