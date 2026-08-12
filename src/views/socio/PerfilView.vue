<template>
  <div>
    <PageHeader title="Mi Perfil" />

    <div v-if="loading" class="flex justify-content-center p-5">
      <ProgressSpinner />
    </div>

    <div v-else class="grid">      <!-- Profile Card -->
      <div class="col-12 lg:col-4">
        <div class="card">
          <div class="flex flex-column align-items-center text-center">
            <div class="profile-photo-container mb-3" @click="showPhotoDialog = true">
              <img 
                v-if="socio.foto" 
                :src="socio.foto" 
                alt="Foto de perfil"
                class="profile-photo"
              />
              <Avatar 
                v-else
                :label="socio.nombre?.charAt(0).toUpperCase()" 
                size="xlarge" 
                shape="circle" 
                class="avatar-red"
                style="width: 6rem; height: 6rem; font-size: 2rem"
              />
              <div class="photo-overlay">
                <i class="pi pi-camera"></i>
              </div>
            </div>            <h2 class="text-2xl font-bold mb-1" style="color: var(--text-color)">{{ socio.nombre }} {{ socio.apellido }}</h2>
            <span class="text-gray-400 mb-2">{{ socio.email }}</span>
            <Tag severity="info" :value="'Socio #' + socio.numeroSocio" />
          </div>          <!-- FASE 7.2: Botón para editar perfil -->
          <Divider />
          <Button 
            v-if="!modoEdicion"
            label="Editar Perfil" 
            icon="pi pi-pencil" 
            class="w-full mb-2"
            @click="habilitarEdicion" 
          />
          <Button
            v-if="!modoEdicion"
            label="Cambiar Contraseña"
            icon="pi pi-lock"
            outlined
            severity="secondary"
            class="w-full"
            @click="showPasswordDialog = true"
          />
          <div v-if="modoEdicion" class="flex gap-2">
            <Button 
              label="Cancelar" 
              icon="pi pi-times" 
              outlined
              class="flex-1"
              @click="cancelarEdicion" 
            />
            <Button 
              label="Guardar Cambios" 
              icon="pi pi-check" 
              class="flex-1"
              @click="guardarCambios"
              :loading="savingProfile"
            />
          </div>
        </div>
      </div>

      <!-- Info Card -->
      <div class="col-12 lg:col-8">
        <div class="card">
          <h3 class="text-xl font-semibold mb-4" style="color: var(--text-color)">Información Personal</h3>
            <div class="grid">
            <div class="col-12 md:col-6 mb-4">
              <label class="block text-gray-400 mb-2">Nombre Completo</label>
              <div class="font-medium" style="color: var(--text-color)">{{ socio.nombre }} {{ socio.apellido }}</div>
            </div>
            <div class="col-12 md:col-6 mb-4">
              <label class="block text-gray-400 mb-2">Número de Socio</label>
              <div class="font-medium" style="color: var(--text-color)">{{ socio.numeroSocio }}</div>
            </div>
            <div class="col-12 md:col-6 mb-4">
              <label class="block text-gray-400 mb-2">Email</label>
              <div class="font-medium" style="color: var(--text-color)">{{ socio.email }}</div>
            </div>
            <div class="col-12 md:col-6 mb-4">
              <label class="block text-gray-400 mb-2">Teléfono</label>
              <div v-if="modoEdicion" class="flex align-items-center gap-1">
                <span class="px-2 py-2 border-round text-color-secondary border-1 surface-border surface-ground" style="font-size:1rem;line-height:1.5;">+549</span>
                <InputText
                  v-model="telefonoArea"
                  class=""
                  style="width:70px"
                  placeholder="3533"
                  maxlength="4"
                />
                <InputText
                  v-model="telefonoNumero"
                  style="width:110px"
                  placeholder="680908"
                  maxlength="8"
                />
              </div>
              <div v-else class="font-medium" style="color: var(--text-color)">{{ formatTelefonoDisplay(socio.telefono) || 'No registrado' }}</div>
            </div>
            <div class="col-12 mb-4" v-if="modoEdicion">
              <label class="block text-gray-400 mb-2">Dirección</label>
              <InputText 
                v-model="socioEditado.direccion" 
                class="w-full"
              />
            </div>
            <div class="col-12 md:col-6 mb-4">
              <label class="block text-gray-400 mb-2">Miembro desde</label>
              <div class="font-medium" style="color: var(--text-color)">{{ formatDate(socio.createdAt) }}</div>
            </div>
          </div>

          <Divider />

          <h3 class="text-xl font-semibold mb-4" style="color: var(--text-color)">Mis Inscripciones</h3>
          
          <div v-if="inscripcionesActivas.length === 0" class="text-center text-gray-400 py-3">
            No tienes inscripciones activas
          </div>
          <div v-else class="flex flex-wrap gap-3">
            <div v-for="insc in inscripcionesActivas" :key="insc.id" 
                 class="inscription-item flex align-items-center gap-2 p-3 border-round">
              <i class="pi pi-bookmark text-red-400"></i>
              <span class="font-medium" style="color: var(--text-color)">{{ insc.disciplinaNombre }}</span>
              <Tag :severity="insc.activa ? 'success' : 'danger'" size="small" 
                   :value="insc.activa ? 'Activa' : 'Inactiva'" />
            </div>
          </div>

          <!-- Grupo Familiar -->
          <template v-if="socio.tipoSocio === 'Titular' && socio.adherentes && socio.adherentes.length > 0">
            <Divider />            <h3 class="text-xl font-semibold mb-4" style="color: var(--text-color)">
              <i class="pi pi-users mr-2"></i>Mi Grupo Familiar
            </h3>
            <div class="flex flex-column gap-3">
              <div v-for="adh in socio.adherentes" :key="adh.id"
                   class="inscription-item flex align-items-center justify-content-between p-3 border-round">
                <div class="flex align-items-center gap-3">
                  <Avatar :label="adh.nombre?.charAt(0).toUpperCase()" shape="circle" class="avatar-red" />
                  <div>
                    <div class="font-medium" style="color: var(--text-color)">{{ adh.nombre }} {{ adh.apellido }}</div>
                    <div class="text-gray-400 text-sm">{{ adh.email }}</div>
                  </div>
                </div>
                <div class="flex gap-2">
                  <Tag :severity="adh.activo ? 'success' : 'danger'" size="small"
                       :value="adh.activo ? 'Activo' : 'Inactivo'" />
                  <Tag v-if="adh.pagaCuotaElAdherente" value="Paga propia" severity="info" size="small" />
                  <Tag v-else value="Cuota titular" severity="secondary" size="small" />
                </div>
              </div>
            </div>
          </template>

          <!-- Si es Adherente, mostrar info del titular -->
          <template v-if="socio.tipoSocio === 'Adherente' && socio.titularNombreCompleto">
            <Divider />            <h3 class="text-xl font-semibold mb-4" style="color: var(--text-color)">
              <i class="pi pi-user mr-2"></i>Mi Titular
            </h3>
            <div class="inscription-item flex align-items-center justify-content-between p-3 border-round">
              <div class="flex align-items-center gap-3">
                <Avatar :label="socio.titularNombreCompleto?.charAt(0).toUpperCase()" shape="circle" class="avatar-red" />
                <span class="font-medium" style="color: var(--text-color)">{{ socio.titularNombreCompleto }}</span>
              </div>
              <div class="flex gap-2">
                <Tag :severity="socio.pagaCuotaElAdherente ? 'success' : 'info'" size="small"
                     :value="socio.pagaCuotaElAdherente ? 'Pago propio' : 'Paga el titular'" />
              </div>
            </div>
          </template>
        </div>
      </div>
    </div><!-- Photo Upload Dialog -->
    <Dialog 
      v-model:visible="showPhotoDialog" 
      header="Cambiar Foto de Perfil" 
      :modal="true"
      :style="{ width: '400px' }"
    >
      <div class="pt-3">
        <ImageUpload v-model="newPhoto" placeholder="Subir foto de perfil" />
      </div>
      <template #footer>
        <Button label="Cancelar" icon="pi pi-times" text @click="showPhotoDialog = false" />
        <Button label="Guardar" icon="pi pi-check" @click="savePhoto" :loading="savingPhoto" />
      </template>
    </Dialog>

    <!-- Dialog Cambiar Contraseña -->
    <Dialog
      v-model:visible="showPasswordDialog"
      :header="pwPaso === 1 ? 'Cambiar Contraseña' : 'Ingresá el código'"
      :modal="true"
      :style="{ width: '420px' }"
      @hide="resetPasswordForm"
    >
      <!-- Paso 1: enviar código -->
      <div v-if="pwPaso === 1" class="flex flex-column gap-3 pt-2">
        <p class="text-gray-400 text-sm m-0">
          Te enviaremos un código de verificación a <strong>{{ authStore.user?.email }}</strong> para confirmar el cambio de contraseña.
        </p>
        <Message v-if="pwError" severity="error" :closable="false">{{ pwError }}</Message>
        <Message v-if="pwEmailOk" severity="success" :closable="false">{{ pwEmailOk }}</Message>
      </div>

      <!-- Paso 2: código + nueva contraseña -->
      <div v-else class="flex flex-column gap-3 pt-2">
        <Message severity="success" :closable="false">
          ✅ Código enviado a <strong>{{ authStore.user?.email }}</strong>. Revisá tu bandeja (y la carpeta spam).
        </Message>
        <div>
          <label class="block text-gray-300 font-medium mb-2">Código de verificación *</label>
          <InputText
            v-model="pwForm.codigo"
            class="w-full"
            placeholder="Ej: A3B7K2"
            :class="{ 'p-invalid': pwErrors.codigo }"
          />
          <small v-if="pwErrors.codigo" class="p-error">{{ pwErrors.codigo }}</small>
        </div>
        <div>
          <label class="block text-gray-300 font-medium mb-2">Nueva contraseña *</label>
          <Password
            v-model="pwForm.nueva"
            class="w-full"
            inputClass="w-full"
            toggleMask
            promptLabel="Ingresá una contraseña"
            weakLabel="Débil"
            mediumLabel="Media"
            strongLabel="Fuerte"
            :class="{ 'p-invalid': pwErrors.nueva }"
          />
          <small v-if="pwErrors.nueva" class="p-error">{{ pwErrors.nueva }}</small>
        </div>
        <div>
          <label class="block text-gray-300 font-medium mb-2">Confirmar nueva contraseña *</label>
          <Password
            v-model="pwForm.confirmar"
            class="w-full"
            inputClass="w-full"
            :feedback="false"
            toggleMask
            :class="{ 'p-invalid': pwErrors.confirmar }"
          />
          <small v-if="pwErrors.confirmar" class="p-error">{{ pwErrors.confirmar }}</small>
        </div>
        <Message v-if="pwError" severity="error" :closable="false">{{ pwError }}</Message>
      </div>

      <template #footer>
        <Button label="Cancelar" text @click="showPasswordDialog = false" />
        <Button
          v-if="pwPaso === 1"
          label="Enviar código"
          icon="pi pi-envelope"
          :loading="savingPassword"
          @click="solicitarCodigoCambio"
        />
        <Button
          v-else
          label="Cambiar Contraseña"
          icon="pi pi-lock"
          :loading="savingPassword"
          @click="cambiarPassword"
        />
      </template>
    </Dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch, nextTick } from 'vue'
import { useToast } from 'primevue/usetoast'
import { useAuthStore } from '@/stores/auth'
import { sociosService, authService, uploadService } from '@/services'
import { planesService } from '@/services/planesService'
import PageHeader from '@/components/mobile/PageHeader.vue'
import Avatar from 'primevue/avatar'
import InputSwitch from 'primevue/inputswitch'
import Tag from 'primevue/tag'
import Divider from 'primevue/divider'
import ProgressSpinner from 'primevue/progressspinner'
import Dialog from 'primevue/dialog'
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import Password from 'primevue/password'
import Message from 'primevue/message'
import ImageUpload from '@/components/shared/ImageUpload.vue'
import { parseTelefonoAR, formatTelefonoStorageAR, formatTelefonoDisplay } from '@/utils/phone'

const toast = useToast()
const authStore = useAuthStore()

const socio = ref({})
const socioEditado = ref({})
const planPrecioMensual = ref(0)
const recibeNotificacionesWhatsApp = ref(true)
const savingNotificaciones = ref(false)
const skipNotifWatch = ref(true)

const inscripcionesActivas = computed(() =>
  (socio.value.inscripciones || []).filter((i) => i.activa !== false)
)

const disciplinasActivas = computed(() =>
  inscripcionesActivas.value
)

const disciplinasIncluidas = computed(() =>
  inscripcionesActivas.value.filter(i => i.tipoFacturacion === 'IncluidaEnCuotaSocial')
)

const disciplinasApartadas = computed(() =>
  inscripcionesActivas.value.filter(i => i.tipoFacturacion === 'PagoApartado')
)

const cuotaBase = computed(() => {
  if (planPrecioMensual.value > 0) return planPrecioMensual.value
  if (socio.value.cuotaBaseMensual != null) return socio.value.cuotaBaseMensual
  return socio.value.cuotaSocio || 0
})

const cuotaAPagarClub = computed(() => {
  if (socio.value.cuotaTotalMensual != null) return socio.value.cuotaTotalMensual
  const disciplinasInc = disciplinasIncluidas.value.reduce((sum, i) => sum + (i.cuotaMensual || 0), 0)
  return cuotaBase.value + disciplinasInc
})

// Split phone input
const telefonoArea = ref('')
const telefonoNumero = ref('')

watch([telefonoArea, telefonoNumero], () => {
  const formatted = formatTelefonoStorageAR(telefonoArea.value, telefonoNumero.value)
  if (formatted) socioEditado.value.telefono = formatted
})
const loading = ref(true)
const showPhotoDialog = ref(false)
const newPhoto = ref('')
const savingPhoto = ref(false)
const modoEdicion = ref(false)
const savingProfile = ref(false)

// Password change
const showPasswordDialog = ref(false)
const savingPassword = ref(false)
const pwPaso = ref(1)
const pwForm = ref({ codigo: '', nueva: '', confirmar: '' })
const pwErrors = ref({})
const pwError = ref('')
const pwEmailOk = ref('')

function resetPasswordForm() {
  pwPaso.value = 1
  pwForm.value = { codigo: '', nueva: '', confirmar: '' }
  pwErrors.value = {}
  pwError.value = ''
  pwEmailOk.value = ''
}

async function solicitarCodigoCambio() {
  pwError.value = ''
  pwEmailOk.value = ''
  savingPassword.value = true
  try {
    const response = await authService.solicitarCambioPassword()
    if (response?.emailEnviado === false) {
      pwError.value = response.message || 'No se pudo enviar el email.'
    } else {
      pwPaso.value = 2
    }
  } catch (error) {
    pwError.value = error?.response?.data?.message || 'No se pudo enviar el código. Intentá de nuevo.'
  } finally {
    savingPassword.value = false
  }
}

async function cambiarPassword() {
  pwErrors.value = {}
  pwError.value = ''
  if (!pwForm.value.codigo) pwErrors.value.codigo = 'El código es requerido'
  if (!pwForm.value.nueva) pwErrors.value.nueva = 'Requerido'
  if (pwForm.value.nueva && pwForm.value.nueva.length < 6) pwErrors.value.nueva = 'Mínimo 6 caracteres'
  if (pwForm.value.nueva !== pwForm.value.confirmar) pwErrors.value.confirmar = 'Las contraseñas no coinciden'
  if (Object.keys(pwErrors.value).length) return

  savingPassword.value = true
  try {
    await authService.cambiarPassword(pwForm.value.codigo, pwForm.value.nueva)
    showPasswordDialog.value = false
    resetPasswordForm()
    toast.add({ severity: 'success', summary: 'Éxito', detail: 'Contraseña cambiada correctamente', life: 3000 })
  } catch (error) {
    pwError.value = error?.response?.data?.message || 'No se pudo cambiar la contraseña'
  } finally {
    savingPassword.value = false
  }
}

function formatDate(date) {
  if (!date) return '-'
  return new Date(date).toLocaleDateString('es-ES', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  })
}

async function loadProfile() {
  loading.value = true
  try {
    socio.value = await sociosService.getById(authStore.user.id)
    newPhoto.value = socio.value.foto || ''
    skipNotifWatch.value = true
    recibeNotificacionesWhatsApp.value = socio.value.recibeNotificacionesWhatsApp ?? true
    await nextTick()
    skipNotifWatch.value = false

    planPrecioMensual.value = 0
    if (socio.value.planMembresiaId) {
      try {
        const plan = await planesService.getById(socio.value.planMembresiaId)
        planPrecioMensual.value = plan.precioMensual || 0
      } catch {
        planPrecioMensual.value = 0
      }
    }
  } catch (error) {
    console.error('Error loading profile:', error)
    toast.add({ severity: 'error', summary: 'Error', detail: 'No se pudo cargar el perfil', life: 3000 })
  } finally {
    loading.value = false
  }
}

async function guardarNotificacionesWhatsApp(valor) {
  const anterior = socio.value.recibeNotificacionesWhatsApp ?? true
  savingNotificaciones.value = true
  try {
    await sociosService.updatePerfil({ recibeNotificacionesWhatsApp: valor })
    socio.value.recibeNotificacionesWhatsApp = valor
    toast.add({
      severity: 'success',
      summary: valor ? 'Notificaciones activadas' : 'Notificaciones desactivadas',
      detail: valor
        ? 'Volverás a recibir avisos por WhatsApp.'
        : 'No recibirás más mensajes automáticos del club.',
      life: 3500
    })
  } catch (error) {
    recibeNotificacionesWhatsApp.value = anterior
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: error.response?.data?.message || 'No se pudo actualizar la preferencia',
      life: 3000
    })
  } finally {
    savingNotificaciones.value = false
  }
}

async function savePhoto() {
  savingPhoto.value = true
  try {
    // Borrar foto anterior de R2 si existe y es diferente a la nueva
    const fotoAnterior = socio.value.foto
    if (fotoAnterior && fotoAnterior !== newPhoto.value) {
      uploadService.deleteImage(fotoAnterior).catch(() => {}) // silencioso si falla
    }
    await sociosService.updatePerfil({ foto: newPhoto.value })
    socio.value.foto = newPhoto.value
    authStore.updateFoto(newPhoto.value)
    showPhotoDialog.value = false
    toast.add({ severity: 'success', summary: 'Éxito', detail: 'Foto actualizada', life: 3000 })
  } catch (error) {
    toast.add({ severity: 'error', summary: 'Error', detail: 'No se pudo actualizar la foto', life: 3000 })
  } finally {
    savingPhoto.value = false
  }
}

// FASE 7.2: Funciones de edición de perfil
function habilitarEdicion() {
  modoEdicion.value = true
  const parsed = parseTelefonoAR(socio.value.telefono)
  telefonoArea.value = parsed.area
  telefonoNumero.value = parsed.numero
  socioEditado.value = {
    telefono: socio.value.telefono || '',
    direccion: socio.value.direccion || '',
    foto: socio.value.foto || ''
  }
}

function cancelarEdicion() {
  modoEdicion.value = false
  socioEditado.value = {}
}

async function guardarCambios() {
  savingProfile.value = true
  try {
    await sociosService.updatePerfil(socioEditado.value)
    
    // Actualizar los datos locales
    socio.value.telefono = socioEditado.value.telefono
    socio.value.direccion = socioEditado.value.direccion
    if (socioEditado.value.foto) {
      socio.value.foto = socioEditado.value.foto
    }
    
    modoEdicion.value = false
    toast.add({ 
      severity: 'success', 
      summary: 'Éxito', 
      detail: 'Perfil actualizado correctamente', 
      life: 3000 
    })
  } catch (error) {
    console.error('Error updating profile:', error)
    toast.add({ 
      severity: 'error', 
      summary: 'Error', 
      detail: 'No se pudo actualizar el perfil', 
      life: 3000 
    })
  } finally {
    savingProfile.value = false
  }
}

watch(recibeNotificacionesWhatsApp, (valor) => {
  if (skipNotifWatch.value || savingNotificaciones.value) return
  guardarNotificacionesWhatsApp(valor)
})

onMounted(() => {
  loadProfile()
})
</script>

<style scoped>
.cuota-resumen {
  background: var(--surface-hover);
  border: 1px solid var(--surface-border);
}

.cuota-resumen__total {
  font-size: 2rem;
  font-weight: 700;
  color: var(--primary-color);
}

.notif-wa {
  background: var(--surface-ground);
  border: 1px solid var(--surface-border);
}

.profile-photo-container {
  position: relative;
  width: 6rem;
  height: 6rem;
  border-radius: 50%;
  overflow: hidden;
  cursor: pointer;
}

.profile-photo {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.photo-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.2s ease;
}

.photo-overlay i {
  color: white;
  font-size: 1.5rem;
}

.profile-photo-container:hover .photo-overlay {
  opacity: 1;
}

.inscription-item {
  background: var(--surface-card);
  border: 1px solid var(--surface-border);
}

.avatar-red {
  background-color: #dc2626 !important;
}
</style>
