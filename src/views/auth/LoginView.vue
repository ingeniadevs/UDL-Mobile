<template>
  <div class="login-screen auth-screen min-h-screen flex flex-column align-items-center justify-content-center">
    <div class="login-bg-glow login-bg-glow--1" aria-hidden="true" />
    <div class="login-bg-glow login-bg-glow--2" aria-hidden="true" />

    <div class="login-card w-full lg:w-4">
      <!-- Marca Ingenia Club -->
      <div class="login-brand text-center">
        <div class="app-icon-wrap">
          <IngeniaClubIcon size="xl" />
        </div>
        <h1 class="app-title">{{ app.name }}</h1>
        <p class="app-tagline">{{ app.tagline }}</p>
      </div>

      <!-- Club activo (plantilla UDL por defecto) -->
      <div class="club-context">
        <div class="club-context__logo">
          <img v-if="!clubLogoFailed" :src="club.logo" :alt="club.logoAlt" @error="onClubLogoError" />
          <span v-else class="club-context__fallback">{{ club.shortName }}</span>
        </div>
        <div class="club-context__info">
          <span class="club-context__label">Club conectado</span>
          <span class="club-context__name">{{ club.name }}</span>
        </div>
      </div>

      <div v-if="showBiometricUnlock" class="mb-4">
        <Button
          :label="`Desbloquear con ${biometricLabel}`"
          :icon="biometricIcon"
          class="w-full p-button-sm btn-ingenia"
          :loading="biometricLoading"
          @click="handleBiometricUnlock"
        />
        <div class="divider my-4 flex align-items-center gap-2">
          <div class="divider-line flex-1"></div>
          <span class="login-muted text-sm">o ingresá con contraseña</span>
          <div class="divider-line flex-1"></div>
        </div>
      </div>

      <form @submit.prevent="handleLogin">
        <div class="mb-4">
          <label for="identificador" class="login-label block font-medium mb-2">Usuario</label>
          <InputText
            id="identificador"
            v-model="identificador"
            type="text"
            class="w-full login-input"
            placeholder="Ingresá tu usuario o email"
            autocomplete="username"
            :class="{ 'p-invalid': errors.identificador }"
          />
          <small v-if="errors.identificador" class="p-error">{{ errors.identificador }}</small>
        </div>

        <div class="mb-4">
          <label for="password" class="login-label block font-medium mb-2">Contraseña</label>
          <Password
            id="password"
            v-model="password"
            class="w-full"
            input-class="w-full login-input"
            :feedback="false"
            toggle-mask
            :class="{ 'p-invalid': errors.password }"
          />
          <small v-if="errors.password" class="p-error">{{ errors.password }}</small>

          <div v-if="esEmail" class="mt-2 text-right">
            <a href="#" @click.prevent="mostrarRecuperacion = true" class="login-link text-sm">
              ¿Olvidaste tu contraseña?
            </a>
          </div>
        </div>

        <Message v-if="errorMessage" severity="error" :closable="false" class="mb-4" />

        <Button
          type="submit"
          label="Ingresar"
          icon="pi pi-sign-in"
          class="w-full btn-ingenia p-button-sm"
          :loading="loading"
        />
      </form>

      <div class="divider my-4 flex align-items-center gap-2">
        <div class="divider-line flex-1"></div>
        <span class="login-muted text-sm">¿Sos nuevo?</span>
        <div class="divider-line flex-1"></div>
      </div>

      <Button
        label="Quiero ser Socio"
        icon="pi pi-user-plus"
        outlined
        class="w-full btn-registro p-button-sm"
        @click="mostrarRegistro = true"
      />
    </div>

    <footer class="login-footer">
      <a :href="app.companyUrl" target="_blank" rel="noopener noreferrer" class="login-footer__link">
        <span class="login-footer__icon" aria-hidden="true">
          <IngeniaClubIcon size="sm" />
        </span>
        <span>{{ app.companyName }}</span>
      </a>
      <span class="login-footer__sep">·</span>
      <a :href="app.instagram" target="_blank" rel="noopener noreferrer" class="login-footer__link">
        <i class="pi pi-instagram"></i>
        <span>@ingenia.labs</span>
      </a>
    </footer>
  </div>
  <!-- ===== DIALOG REGISTRO - PASO 1: DATOS PERSONALES ===== -->
  <Dialog
    v-model:visible="mostrarRegistro"
    :header="pasoRegistro === 1 ? 'Registrarme como Socio' : 'Seleccioná tu Método de Pago'"
    :modal="true"
    :style="{ width: '520px' }"
    :breakpoints="{ '640px': '95vw' }"
    class="dialog-dark"
    @hide="resetRegistro"
    :closable="!regLoading"
  >
    <!-- PASO 1: Datos personales y plan -->
    <div v-if="pasoRegistro === 1" class="flex flex-column gap-3">
      <div class="flex gap-3">
        <div class="flex-1">
          <label class="block text-gray-300 font-medium mb-1">Nombre *</label>
          <InputText v-model="reg.nombre" class="w-full" placeholder="Juan" :class="{ 'p-invalid': regErrors.nombre }" />
          <small v-if="regErrors.nombre" class="p-error">{{ regErrors.nombre }}</small>
        </div>
        <div class="flex-1">
          <label class="block text-gray-300 font-medium mb-1">Apellido *</label>
          <InputText v-model="reg.apellido" class="w-full" placeholder="Pérez" :class="{ 'p-invalid': regErrors.apellido }" />
          <small v-if="regErrors.apellido" class="p-error">{{ regErrors.apellido }}</small>
        </div>
      </div>

      <div>
        <label class="block text-gray-300 font-medium mb-1">Email *</label>
        <InputText v-model="reg.email" type="email" class="w-full" placeholder="tucorreo@ejemplo.com" :class="{ 'p-invalid': regErrors.email }" />
        <small v-if="regErrors.email" class="p-error">{{ regErrors.email }}</small>
      </div>

      <div>
        <label class="block text-gray-300 font-medium mb-1">Teléfono *</label>
        <InputText v-model="reg.telefono" class="w-full" placeholder="3516000000" :class="{ 'p-invalid': regErrors.telefono }" />
        <small v-if="regErrors.telefono" class="p-error">{{ regErrors.telefono }}</small>
      </div>

      <div>
        <label class="block text-gray-300 font-medium mb-1">DNI *</label>
        <InputText v-model="reg.dni" class="w-full" placeholder="12345678" :class="{ 'p-invalid': regErrors.dni }" />
        <small v-if="regErrors.dni" class="p-error">{{ regErrors.dni }}</small>
      </div>

      <div>
        <label class="block text-gray-300 font-medium mb-1">Dirección</label>
        <InputText v-model="reg.direccion" class="w-full" placeholder="Tu dirección" />
      </div>

      <div>
        <label class="block text-gray-300 font-medium mb-1">Plan de Membresía *</label>
        <Dropdown
          v-model="reg.planMembresiaId"
          :options="planesDisponibles"
          option-label="nombre"
          option-value="id"
          placeholder="Seleccioná un plan"
          class="w-full"
          :class="{ 'p-invalid': regErrors.planMembresiaId }"
          :loading="loadingPlanes"
        >
          <template #value="slotProps">
            <div v-if="slotProps.value" class="flex align-items-center">
              <span>{{ getPlanNombre(slotProps.value) }}</span>
              <span class="ml-auto font-bold text-primary-400">${{ getPlanPrecio(slotProps.value) }}</span>
            </div>
            <span v-else>{{ slotProps.placeholder }}</span>
          </template>
          <template #option="slotProps">
            <div class="flex align-items-center justify-content-between w-full">
              <div>
                <div class="font-medium">{{ slotProps.option.nombre }}</div>
                <div class="text-sm text-gray-400">{{ slotProps.option.descripcion }}</div>
              </div>
              <div class="font-bold text-primary-400">${{ slotProps.option.precio }}</div>
            </div>
          </template>
        </Dropdown>
        <small v-if="regErrors.planMembresiaId" class="p-error">{{ regErrors.planMembresiaId }}</small>
      </div>

      <div>
        <label class="block text-gray-300 font-medium mb-1">Contraseña *</label>
        <Password v-model="reg.password" class="w-full" input-class="w-full" toggle-mask prompt-label="Ingresá una contraseña" weak-label="Débil" medium-label="Media" strong-label="Fuerte" :class="{ 'p-invalid': regErrors.password }" />
        <small v-if="regErrors.password" class="p-error">{{ regErrors.password }}</small>
      </div>

      <div>
        <label class="block text-gray-300 font-medium mb-1">Confirmar contraseña *</label>
        <Password v-model="reg.confirmarPassword" class="w-full" input-class="w-full" :feedback="false" toggle-mask :class="{ 'p-invalid': regErrors.confirmarPassword }" />
        <small v-if="regErrors.confirmarPassword" class="p-error">{{ regErrors.confirmarPassword }}</small>
      </div>

      <Message v-if="regError" severity="error" :closable="false">{{ regError }}</Message>
    </div>

    <!-- PASO 2: Método de pago -->
    <div v-if="pasoRegistro === 2" class="flex flex-column gap-4">
      <div class="text-center mb-2">
        <p class="text-gray-400">Seleccioná cómo querés realizar el pago de tu primera cuota</p>
        <div class="plan-seleccionado mt-3 p-3 border-round" style="background: var(--surface-overlay); border: 1px solid var(--primary-color);">
          <div class="font-medium text-lg">{{ getPlanNombre(reg.planMembresiaId) }}</div>
          <div class="text-2xl font-bold text-primary-400 mt-1">${{ getPlanPrecio(reg.planMembresiaId) }}</div>
        </div>
      </div>

      <!-- Opciones de pago -->
      <div class="flex flex-column gap-3">
        <div 
          class="metodo-pago-card p-4 border-round cursor-pointer transition-all"
          :class="{ 'selected': reg.metodoPago === 'MercadoPago' }"
          @click="reg.metodoPago = 'MercadoPago'"
        >
          <div class="flex align-items-center gap-3">
            <i class="pi pi-credit-card text-3xl" style="color: #00B1EA;"></i>
            <div class="flex-1">
              <div class="font-bold text-lg">MercadoPago</div>
              <div class="text-sm text-gray-400">Pago rápido y seguro con tarjeta</div>
            </div>
            <i v-if="reg.metodoPago === 'MercadoPago'" class="pi pi-check-circle text-primary-400 text-2xl"></i>
          </div>
        </div>

        <div 
          class="metodo-pago-card p-4 border-round cursor-pointer transition-all"
          :class="{ 'selected': reg.metodoPago === 'Transferencia' }"
          @click="reg.metodoPago = 'Transferencia'"
        >
          <div class="flex align-items-center gap-3">
            <i class="pi pi-building text-3xl text-primary-400"></i>
            <div class="flex-1">
              <div class="font-bold text-lg">Transferencia Bancaria</div>
              <div class="text-sm text-gray-400">Transferencia o depósito directo</div>
            </div>
            <i v-if="reg.metodoPago === 'Transferencia'" class="pi pi-check-circle text-primary-400 text-2xl"></i>
          </div>
        </div>
      </div>

      <Message v-if="regError" severity="error" :closable="false">{{ regError }}</Message>
      <Message v-if="regExito" severity="success" :closable="false">{{ regExito }}</Message>
    </div>

    <template #footer>
      <div class="flex justify-content-between w-full">
        <Button 
          v-if="pasoRegistro === 2" 
          label="Anterior" 
          icon="pi pi-arrow-left" 
          text 
          class="text-gray-400" 
          @click="pasoRegistro = 1"
          :disabled="regLoading"
        />
        <div v-else></div>
        
        <div class="flex gap-2">
          <Button 
            label="Cancelar" 
            icon="pi pi-times" 
            text 
            class="text-gray-400" 
            @click="mostrarRegistro = false"
            :disabled="regLoading"
          />
          <Button 
            v-if="pasoRegistro === 1"
            label="Siguiente" 
            icon="pi pi-arrow-right" 
            icon-pos="right"
            @click="avanzarPaso2" 
          />
          <Button 
            v-else
            label="Confirmar Registro" 
            icon="pi pi-check" 
            :loading="regLoading" 
            @click="handleRegistro"
            :disabled="!reg.metodoPago"
          />
        </div>
      </div>
    </template>
  </Dialog>

  <!-- ===== DIALOG DATOS TRANSFERENCIA ===== -->
  <Dialog
    v-model:visible="mostrarDatosTransferencia"
    header="Datos para Transferencia Bancaria"
    :modal="true"
    :style="{ width: '500px' }"
    :breakpoints="{ '640px': '95vw' }"
    class="dialog-dark"
  >
    <div class="flex flex-column gap-4">
      <Message severity="info" :closable="false">
        Tu registro fue creado exitosamente. Realizá la transferencia con los siguientes datos:
      </Message>

      <div class="datos-bancarios p-4 border-round" style="background: var(--surface-overlay); border: 1px solid var(--surface-border);">
        <div class="grid">
          <div class="col-12 mb-3">
            <div class="text-sm text-gray-400 mb-1">Banco</div>
            <div class="font-medium text-lg">{{ datosBancarios.banco }}</div>
          </div>
          <div class="col-6 mb-3">
            <div class="text-sm text-gray-400 mb-1">CBU</div>
            <div class="font-medium flex align-items-center gap-2">
              {{ datosBancarios.cbu }}
              <i class="pi pi-copy cursor-pointer text-primary-400" @click="copiarTexto(datosBancarios.cbu)" title="Copiar"></i>
            </div>
          </div>
          <div class="col-6 mb-3">
            <div class="text-sm text-gray-400 mb-1">Alias</div>
            <div class="font-medium flex align-items-center gap-2">
              {{ datosBancarios.alias }}
              <i class="pi pi-copy cursor-pointer text-primary-400" @click="copiarTexto(datosBancarios.alias)" title="Copiar"></i>
            </div>
          </div>          <div class="col-12 mb-3">
            <div class="text-sm text-gray-400 mb-1">Titular</div>
            <div class="font-medium">{{ datosBancarios.titular }}</div>
          </div>
          <div class="col-6">
            <div class="text-sm text-gray-400 mb-1">Monto a Transferir</div>
            <div class="text-2xl font-bold text-primary-400">${{ datosBancarios.monto }}</div>
          </div>
          <div class="col-6" v-if="datosBancarios.referencia">
            <div class="text-sm text-gray-400 mb-1">Referencia / N° Socio</div>
            <div class="font-medium flex align-items-center gap-2">
              {{ datosBancarios.referencia }}
              <i class="pi pi-copy cursor-pointer text-primary-400" @click="copiarTexto(datosBancarios.referencia)" title="Copiar"></i>
            </div>
          </div>
        </div>
      </div>

      <Message severity="warn" :closable="false">
        Una vez realizada la transferencia, tu cuenta será activada en un plazo de 24-48hs. Te notificaremos por email.
      </Message>
    </div>

    <template #footer>
      <Button label="Entendido" icon="pi pi-check" @click="cerrarDatosTransferencia" autofocus />
    </template>
  </Dialog>

  <!-- ===== DIALOG RECUPERAR CONTRASEÑA ===== -->
  <Dialog
    v-model:visible="mostrarRecuperacion"
    :header="pasoRecuperacion === 1 ? 'Recuperar Contraseña' : 'Nueva Contraseña'"
    :modal="true"
    :style="{ width: '450px' }"
    :breakpoints="{ '640px': '95vw' }"
    class="dialog-dark"
    @hide="resetRecuperacion"
  >
    <!-- PASO 1: Ingresar email -->
    <div v-if="pasoRecuperacion === 1" class="flex flex-column gap-3">
      <p class="text-gray-400 text-sm">
        Ingresá tu email y recibirás un código para restablecer tu contraseña.
      </p>
      <div>
        <label class="block text-gray-300 font-medium mb-2">Email *</label>
        <InputText
          v-model="recuperacion.email"
          type="email"
          class="w-full"
          placeholder="tucorreo@ejemplo.com"
          :class="{ 'p-invalid': recuperacionErrors.email }"
          @keyup.enter="handleSolicitarRecuperacion"
        />
        <small v-if="recuperacionErrors.email" class="p-error">{{ recuperacionErrors.email }}</small>
      </div>
      <Message v-if="recuperacionError" severity="error" :closable="false">{{ recuperacionError }}</Message>
    </div>    <!-- PASO 2: Ingresar token + nueva contraseña -->
    <div v-if="pasoRecuperacion === 2" class="flex flex-column gap-3">
      <Message severity="success" :closable="false">
        ✅ Te enviamos un código de 6 caracteres a <strong>{{ recuperacion.email }}</strong>. Revisá tu bandeja de entrada (y la carpeta spam).
      </Message>
      <div>
        <label class="block text-gray-300 font-medium mb-2">Código de recuperación *</label>
        <InputText
          v-model="recuperacion.token"
          class="w-full"
          placeholder="Pegá el código aquí"
          :class="{ 'p-invalid': recuperacionErrors.token }"
        />
        <small v-if="recuperacionErrors.token" class="p-error">{{ recuperacionErrors.token }}</small>
      </div>
      <div>
        <label class="block text-gray-300 font-medium mb-2">Nueva contraseña *</label>
        <Password
          v-model="recuperacion.nuevaPassword"
          class="w-full"
          input-class="w-full"
          toggle-mask
          :feedback="true"
          prompt-label="Ingresá una contraseña"
          weak-label="Débil" medium-label="Media" strong-label="Fuerte"
          :class="{ 'p-invalid': recuperacionErrors.nuevaPassword }"
        />
        <small v-if="recuperacionErrors.nuevaPassword" class="p-error">{{ recuperacionErrors.nuevaPassword }}</small>
      </div>
      <div>
        <label class="block text-gray-300 font-medium mb-2">Confirmar contraseña *</label>
        <Password
          v-model="recuperacion.confirmarPassword"
          class="w-full"
          input-class="w-full"
          :feedback="false"
          toggle-mask
          :class="{ 'p-invalid': recuperacionErrors.confirmarPassword }"
        />
        <small v-if="recuperacionErrors.confirmarPassword" class="p-error">{{ recuperacionErrors.confirmarPassword }}</small>
      </div>
      <Message v-if="recuperacionError" severity="error" :closable="false">{{ recuperacionError }}</Message>
      <Message v-if="recuperacionExito" severity="success" :closable="false">{{ recuperacionExito }}</Message>
    </div>

    <template #footer>
      <div class="flex justify-content-between w-full">
        <Button
          v-if="pasoRecuperacion === 2"
          label="Anterior"
          icon="pi pi-arrow-left"
          text
          class="text-gray-400"
          @click="pasoRecuperacion = 1"
          :disabled="recuperacionLoading"
        />
        <div v-else></div>
        <div class="flex gap-2">
          <Button label="Cancelar" icon="pi pi-times" text class="text-gray-400" @click="mostrarRecuperacion = false" />
          <Button
            v-if="pasoRecuperacion === 1"
            label="Continuar"
            icon="pi pi-arrow-right"
            icon-pos="right"
            :loading="recuperacionLoading"
            @click="handleSolicitarRecuperacion"
          />
          <Button
            v-else
            label="Cambiar Contraseña"
            icon="pi pi-check"
            :loading="recuperacionLoading"
            @click="handleResetearPassword"
            :disabled="!!recuperacionExito"
          />
        </div>
      </div>
    </template>
  </Dialog>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useClubBranding } from '@/composables/useClubBranding'
import { useAppBranding } from '@/composables/useAppBranding'
import IngeniaClubIcon from '@/components/brand/IngeniaClubIcon.vue'
import { authService } from '@/services'
import { Capacitor } from '@capacitor/core'
import {
  isBiometricAvailable,
  isBiometricEnabled,
  enableBiometric,
  authenticateWithBiometric,
  getBiometricLabel
} from '@/platform/biometric'
import { planesService } from '@/services/planesService'
import { useToast } from 'primevue/usetoast'
import InputText from 'primevue/inputtext'
import Password from 'primevue/password'
import Button from 'primevue/button'
import Message from 'primevue/message'
import Dialog from 'primevue/dialog'
import Dropdown from 'primevue/dropdown'
import { openMercadoPagoCheckout } from '@/platform/mercadopago'
import { copyToClipboard } from '@/platform/clipboard'

const router = useRouter()
const authStore = useAuthStore()
const toast = useToast()
const { branding: club } = useClubBranding()
const { app } = useAppBranding()

const clubLogoFailed = ref(false)
function onClubLogoError(e) {
  clubLogoFailed.value = true
  e.target.style.display = 'none'
}

const showBiometricUnlock = ref(false)
const biometricLoading = ref(false)
const biometricLabel = ref('Biometría')
const biometricIcon = computed(() =>
  biometricLabel.value.includes('Face') ? 'pi pi-id-card' : 'pi pi-fingerprint'
)

// ── LOGIN ────────────────────────────────────────────────
const identificador = ref('')
const password = ref('')
const loading = ref(false)
const errorMessage = ref('')
const errors = ref({})

const esEmail = computed(() => identificador.value.includes('@'))

function validate() {
  errors.value = {}
  if (!identificador.value.trim()) errors.value.identificador = 'Ingresá tu usuario'
  if (!password.value) errors.value.password = 'La contraseña es requerida'
  return Object.keys(errors.value).length === 0
}

async function handleLogin() {
  if (!validate()) return
  loading.value = true
  errorMessage.value = ''
  try {
    await authStore.login(identificador.value.trim(), password.value)
    await maybeOfferBiometric()
    router.push(authStore.isAdmin ? '/admin/inicio' : '/socio/inicio')
  } catch (error) {
    errorMessage.value = error.response?.data?.message || 'Credenciales inválidas'
  } finally {
    loading.value = false
  }
}

async function maybeOfferBiometric() {
  if (!Capacitor.isNativePlatform()) return
  const { available, biometryType } = await isBiometricAvailable()
  if (!available || (await isBiometricEnabled())) return

  biometricLabel.value = getBiometricLabel(biometryType)
  const result = await authenticateWithBiometric(
    `¿Activar ${biometricLabel.value} para ingresar más rápido?`
  )
  if (result.success) {
    await enableBiometric(authStore.user?.id)
    toast.add({
      severity: 'success',
      summary: `${biometricLabel.value} activado`,
      detail: 'Podrás desbloquear la app con biometría',
      life: 4000
    })
  }
}

async function handleBiometricUnlock() {
  biometricLoading.value = true
  errorMessage.value = ''
  try {
    const ok = await authStore.unlockWithBiometric()
    if (!ok) {
      errorMessage.value = 'No se pudo verificar la biometría'
      return
    }
    router.push(authStore.isAdmin ? '/admin/inicio' : '/socio/inicio')
  } finally {
    biometricLoading.value = false
  }
}

// ── REGISTRO ─────────────────────────────────────────────
const mostrarRegistro = ref(false)
const pasoRegistro = ref(1)
const regLoading = ref(false)
const regError = ref('')
const regExito = ref('')
const regErrors = ref({})
const loadingPlanes = ref(false)
const planesDisponibles = ref([])

const reg = ref({
  nombre: '',
  apellido: '',
  email: '',
  telefono: '',
  dni: '',
  direccion: '',
  planMembresiaId: null,
  password: '',
  confirmarPassword: '',
  metodoPago: null
})

// Cargar planes al montar el componente
onMounted(async () => {
  await cargarPlanes()

  if (Capacitor.isNativePlatform() && authStore.isAuthenticated && !authStore.sessionUnlocked) {
    const { available, biometryType } = await isBiometricAvailable()
    if (available && (await isBiometricEnabled())) {
      biometricLabel.value = getBiometricLabel(biometryType)
      showBiometricUnlock.value = true
    }
  }
})

async function cargarPlanes() {
  try {
    loadingPlanes.value = true
    const response = await planesService.getAll(true) // Solo planes activos
    planesDisponibles.value = response
  } catch (error) {
    console.error('Error al cargar planes:', error)
  } finally {
    loadingPlanes.value = false
  }
}

function getPlanNombre(planId) {
  const plan = planesDisponibles.value.find(p => p.id === planId)
  return plan ? plan.nombre : ''
}

function getPlanPrecio(planId) {
  const plan = planesDisponibles.value.find(p => p.id === planId)
  return plan ? plan.precio : 0
}

function resetRegistro() {
  pasoRegistro.value = 1
  reg.value = { 
    nombre: '', 
    apellido: '', 
    email: '', 
    telefono: '', 
    dni: '', 
    direccion: '',
    planMembresiaId: null,
    password: '', 
    confirmarPassword: '',
    metodoPago: null
  }
  regErrors.value = {}
  regError.value = ''
  regExito.value = ''
}

function validateRegistroPaso1() {
  regErrors.value = {}
  if (!reg.value.nombre.trim()) regErrors.value.nombre = 'El nombre es requerido'
  if (!reg.value.apellido.trim()) regErrors.value.apellido = 'El apellido es requerido'
  if (!reg.value.email.trim()) regErrors.value.email = 'El email es requerido'
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(reg.value.email)) regErrors.value.email = 'Email inválido'
  if (!reg.value.telefono.trim()) regErrors.value.telefono = 'El teléfono es requerido'
  if (!reg.value.dni.trim()) regErrors.value.dni = 'El DNI es requerido'
  if (!reg.value.planMembresiaId) regErrors.value.planMembresiaId = 'Seleccioná un plan de membresía'
  if (!reg.value.password) regErrors.value.password = 'La contraseña es requerida'
  else if (reg.value.password.length < 6) regErrors.value.password = 'Mínimo 6 caracteres'
  if (!reg.value.confirmarPassword) regErrors.value.confirmarPassword = 'Confirmá tu contraseña'
  else if (reg.value.password !== reg.value.confirmarPassword) regErrors.value.confirmarPassword = 'Las contraseñas no coinciden'
  return Object.keys(regErrors.value).length === 0
}

function avanzarPaso2() {
  if (!validateRegistroPaso1()) return
  pasoRegistro.value = 2
}

async function handleRegistro() {
  if (!reg.value.metodoPago) {
    regError.value = 'Seleccioná un método de pago'
    return
  }

  regLoading.value = true
  regError.value = ''
  regExito.value = ''
  
  try {
    const payload = {
      nombre: reg.value.nombre.trim(),
      apellido: reg.value.apellido.trim(),
      email: reg.value.email.trim(),
      telefono: reg.value.telefono.trim(),
      dni: reg.value.dni.trim(),
      direccion: reg.value.direccion.trim() || undefined,
      planMembresiaId: reg.value.planMembresiaId,
      password: reg.value.password,
      metodoPago: reg.value.metodoPago
    }

    const response = await authService.registerWithPayment(payload)
    if (reg.value.metodoPago === 'MercadoPago') {
      // Redirigir a MercadoPago — backend devuelve mercadoPagoUrl
      const mpUrl = response.mercadoPagoUrl || response.urlPago
      if (mpUrl) {
        regExito.value = 'Abriendo MercadoPago...'
        await openMercadoPagoCheckout(mpUrl)
      } else {
        // Si no hay URL, mostrar como transferencia de fallback
        regError.value = 'MercadoPago no disponible. Por favor seleccioná Transferencia.'
      }
    } else if (reg.value.metodoPago === 'Transferencia') {
      // Mostrar datos bancarios — backend devuelve datosTransferencia (CBU, Alias, Titular, Monto, Referencia)
      const dt = response.datosTransferencia || response.datosBancarios || {}
      datosBancarios.value = {
        banco: dt.banco || 'Banco de la Nación Argentina',
        cbu: dt.cbu || dt.CBU || '',
        alias: dt.alias || dt.Alias || '',
        titular: dt.titular || dt.Titular || '',
        monto: dt.monto || dt.Monto || getPlanPrecio(reg.value.planMembresiaId),
        referencia: dt.referencia || dt.Referencia || ''
      }
      mostrarDatosTransferencia.value = true
      mostrarRegistro.value = false
      resetRegistro()
    }
  } catch (error) {
    regError.value = error.response?.data?.message || 'Error al registrarse. Intentá de nuevo.'
  } finally {
    regLoading.value = false
  }
}

// ── DATOS TRANSFERENCIA ─────────────────────
const mostrarDatosTransferencia = ref(false)
const datosBancarios = ref({
  banco: '',
  cbu: '',
  alias: '',
  titular: '',
  monto: 0,
  referencia: ''
})

function cerrarDatosTransferencia() {
  mostrarDatosTransferencia.value = false
  datosBancarios.value = { banco: '', cbu: '', alias: '', titular: '', monto: 0, referencia: '' }
}

async function copiarTexto(texto) {
  const ok = await copyToClipboard(texto)
  if (ok) {
    toast.add({
      severity: 'success',
      summary: 'Copiado',
      detail: 'Texto copiado al portapapeles',
      life: 2000
    })
  } else {
    toast.add({
      severity: 'warn',
      summary: 'No se pudo copiar',
      detail: 'Copiá el texto manualmente',
      life: 3000
    })
  }
}

// ── RECUPERAR CONTRASEÑA ─────────────────────
const mostrarRecuperacion = ref(false)
const pasoRecuperacion = ref(1)
const recuperacionLoading = ref(false)
const recuperacionError = ref('')
const recuperacionExito = ref('')
const recuperacionErrors = ref({})

const recuperacion = ref({
  email: '',
  token: '',
  nuevaPassword: '',
  confirmarPassword: ''
})

function resetRecuperacion() {
  pasoRecuperacion.value = 1
  recuperacion.value = { email: '', token: '', nuevaPassword: '', confirmarPassword: '' }
  recuperacionErrors.value = {}
  recuperacionError.value = ''
  recuperacionExito.value = ''
}

function validateEmail() {
  recuperacionErrors.value = {}
  if (!recuperacion.value.email.trim()) {
    recuperacionErrors.value.email = 'El email es requerido'
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(recuperacion.value.email)) {
    recuperacionErrors.value.email = 'Email inválido'
  }
  return Object.keys(recuperacionErrors.value).length === 0
}

function validateReseteo() {
  recuperacionErrors.value = {}
  if (!recuperacion.value.token.trim()) recuperacionErrors.value.token = 'El código es requerido'
  if (!recuperacion.value.nuevaPassword) recuperacionErrors.value.nuevaPassword = 'La contraseña es requerida'
  else if (recuperacion.value.nuevaPassword.length < 6) recuperacionErrors.value.nuevaPassword = 'Mínimo 6 caracteres'
  if (!recuperacion.value.confirmarPassword) recuperacionErrors.value.confirmarPassword = 'Confirmá tu contraseña'
  else if (recuperacion.value.nuevaPassword !== recuperacion.value.confirmarPassword) recuperacionErrors.value.confirmarPassword = 'Las contraseñas no coinciden'
  return Object.keys(recuperacionErrors.value).length === 0
}

async function handleSolicitarRecuperacion() {
  if (!validateEmail()) return
  recuperacionLoading.value = true
  recuperacionError.value = ''
  try {
    const response = await authService.solicitarRecuperacion(recuperacion.value.email.trim())
    if (response?.emailEnviado === false) {
      recuperacionError.value = response.message || 'No se pudo enviar el email. Contactá al administrador.'
      return
    }
    pasoRecuperacion.value = 2
  } catch (error) {
    recuperacionError.value = error.response?.data?.message || 'No se encontró una cuenta con ese email.'
  } finally {
    recuperacionLoading.value = false
  }
}

async function handleResetearPassword() {
  if (!validateReseteo()) return
  recuperacionLoading.value = true
  recuperacionError.value = ''
  recuperacionExito.value = ''
  try {
    await authService.resetearPassword(recuperacion.value.token.trim(), recuperacion.value.nuevaPassword)
    recuperacionExito.value = '¡Contraseña actualizada! Ya podés iniciar sesión.'
    setTimeout(() => {
      mostrarRecuperacion.value = false
      resetRecuperacion()
    }, 2500)
  } catch (error) {
    recuperacionError.value = error.response?.data?.message || 'Código inválido o expirado. Solicitá uno nuevo.'
  } finally {
    recuperacionLoading.value = false
  }
}
</script>

<style scoped>
.login-screen {
  position: relative;
  overflow: hidden;
  background: #08060d;
  background: linear-gradient(165deg, #08060d 0%, #120a24 45%, #0a1628 100%);
  padding: 1.5rem 1rem 3rem;
  --primary-color: #863bff;
  --primary-color-text: #ffffff;
  --udl-red: #863bff;
}

.login-bg-glow {
  position: absolute;
  border-radius: 50%;
  pointer-events: none;
  filter: blur(80px);
}

.login-bg-glow--1 {
  width: 280px;
  height: 280px;
  top: -80px;
  right: -60px;
  background: rgba(134, 59, 255, 0.28);
}

.login-bg-glow--2 {
  width: 220px;
  height: 220px;
  bottom: 10%;
  left: -70px;
  background: rgba(71, 191, 255, 0.15);
}

.login-card {
  position: relative;
  z-index: 1;
  max-width: 420px;
  padding: 1.75rem 1.5rem;
  background: rgba(18, 14, 32, 0.85);
  border: 1px solid rgba(134, 59, 255, 0.2);
  border-radius: 20px;
  box-shadow:
    0 25px 50px -12px rgba(0, 0, 0, 0.5),
    0 0 0 1px rgba(255, 255, 255, 0.04) inset;
  backdrop-filter: blur(12px);
}

.login-brand {
  margin-bottom: 1.5rem;
}

.app-icon-wrap {
  width: auto;
  max-width: 220px;
  margin: 0 auto 1rem;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0.65rem 0.85rem;
  border-radius: 16px;
  background: #ffffff;
  border: 1px solid rgba(134, 59, 255, 0.15);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.25);
}

.app-title {
  margin: 0 0 0.35rem;
  font-size: 1.65rem;
  font-weight: 700;
  letter-spacing: -0.02em;
  color: #f8f7ff;
}

.app-tagline {
  margin: 0;
  font-size: 0.85rem;
  color: rgba(237, 230, 255, 0.65);
  line-height: 1.4;
}

.club-context {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  margin-bottom: 1.5rem;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.08);
}

.club-context__logo {
  width: 44px;
  height: 44px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.06);
  overflow: hidden;
}

.club-context__logo img {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.club-context__fallback {
  font-size: 0.75rem;
  font-weight: 700;
  color: #c4b5fd;
}

.club-context__info {
  display: flex;
  flex-direction: column;
  gap: 0.1rem;
  min-width: 0;
}

.club-context__label {
  font-size: 0.68rem;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: rgba(237, 230, 255, 0.45);
}

.club-context__name {
  font-size: 0.9rem;
  font-weight: 600;
  color: #ede6ff;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.login-label {
  color: rgba(237, 230, 255, 0.8);
  font-size: 0.85rem;
}

.login-muted {
  color: rgba(237, 230, 255, 0.45);
}

.login-link {
  color: #a78bfa;
  text-decoration: none;
}

.login-link:hover {
  color: #c4b5fd;
}

:deep(.login-input) {
  background: rgba(8, 6, 13, 0.6) !important;
  border-color: rgba(134, 59, 255, 0.25) !important;
  color: #f8f7ff !important;
}

:deep(.login-input:focus) {
  border-color: #863bff !important;
  box-shadow: 0 0 0 2px rgba(134, 59, 255, 0.2) !important;
}

.login-screen :deep(.btn-ingenia.p-button) {
  background: linear-gradient(135deg, #863bff 0%, #6d28d9 100%) !important;
  border: 1px solid #863bff !important;
  color: #fff !important;
}

.login-screen :deep(.btn-ingenia.p-button:enabled:hover),
.login-screen :deep(.btn-ingenia.p-button:enabled:active) {
  background: linear-gradient(135deg, #9d5cff 0%, #7c3aed 100%) !important;
  border-color: #9d5cff !important;
}

.login-screen :deep(.btn-ingenia.p-button .p-button-label),
.login-screen :deep(.btn-ingenia.p-button .p-button-icon) {
  color: #fff !important;
}

.divider-line {
  height: 1px;
  background: rgba(134, 59, 255, 0.15);
}

.btn-registro {
  border-color: rgba(134, 59, 255, 0.5) !important;
  color: #c4b5fd !important;
  background: transparent !important;
}

.btn-registro:hover {
  background: rgba(134, 59, 255, 0.12) !important;
  border-color: #863bff !important;
}

.login-footer {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 2;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  padding-bottom: calc(0.5rem + var(--safe-bottom, 0px));
  font-size: 0.72rem;
  color: rgba(237, 230, 255, 0.4);
}

.login-footer__link {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  color: inherit;
  text-decoration: none;
  transition: color 0.15s;
}

.login-footer__link:hover {
  color: #a78bfa;
}

.login-footer__icon {
  display: inline-flex;
  width: 14px;
  height: 14px;
  opacity: 0.7;
}

.login-footer__icon :deep(.ingenia-club-icon) {
  height: 14px;
  width: auto;
  max-width: 42px;
}

.login-footer__sep {
  opacity: 0.35;
}

/* Métodos de pago */
.metodo-pago-card {
  background: var(--surface-overlay);
  border: 2px solid var(--surface-border);
  transition: all 0.3s ease;
}

.metodo-pago-card:hover {
  border-color: var(--primary-color);
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
}

.metodo-pago-card.selected {
  border-color: var(--primary-color);
  background: rgba(var(--primary-400-rgb), 0.1);
}

/* Dialog */
:deep(.dialog-dark .p-dialog) {
  background: var(--surface-card);
  border: 1px solid var(--surface-border);
  border-radius: 12px;
}

:deep(.dialog-dark .p-dialog-header) {
  background: var(--surface-card);
  color: var(--text-color);
  border-bottom: 1px solid var(--surface-border);
  border-radius: 12px 12px 0 0;
}

:deep(.dialog-dark .p-dialog-content) {
  background: var(--surface-card);
  color: var(--text-color);
  padding: 1.5rem;
}

:deep(.dialog-dark .p-dialog-footer) {
  background: var(--surface-card);
  border-top: 1px solid var(--surface-border);
  border-radius: 0 0 12px 12px;
}

:deep(.dialog-dark .p-dialog-header-close) {
  color: var(--text-color-secondary) !important;
}

/* Dropdown personalizado */
:deep(.p-dropdown-panel) {
  background: var(--surface-overlay);
}

:deep(.p-dropdown-item) {
  padding: 0.75rem 1rem !important;
}
</style>
