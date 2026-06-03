<template>
  <div class="reset-container min-h-screen flex align-items-center justify-content-center">
    <div class="reset-card p-6 w-full lg:w-4">
      <div class="text-center mb-5">
        <div class="logo-container mb-4">
          <img src="/images/logo-udl.png" alt="UDL" class="logo-image" />
        </div>
        <div class="page-title text-3xl font-bold mb-2">Recuperar Contraseña</div>
        <span class="text-gray-400 font-medium">Ingresá tu nueva contraseña</span>
      </div>

      <form v-if="!exito" @submit.prevent="handleReset">
        <div class="mb-4">
          <label for="password" class="block text-gray-300 font-medium mb-2">Nueva Contraseña</label>
          <Password
            id="password"
            v-model="password"
            class="w-full"
            input-class="w-full"
            toggle-mask
            prompt-label="Ingresá una contraseña"
            weak-label="Débil"
            medium-label="Media"
            strong-label="Fuerte"
            :class="{ 'p-invalid': errors.password }"
          />
          <small v-if="errors.password" class="p-error">{{ errors.password }}</small>
        </div>

        <div class="mb-4">
          <label for="confirmPassword" class="block text-gray-300 font-medium mb-2">Confirmar Contraseña</label>
          <Password
            id="confirmPassword"
            v-model="confirmPassword"
            class="w-full"
            input-class="w-full"
            :feedback="false"
            toggle-mask
            :class="{ 'p-invalid': errors.confirmPassword }"
          />
          <small v-if="errors.confirmPassword" class="p-error">{{ errors.confirmPassword }}</small>
        </div>

        <Message v-if="errorMessage" severity="error" :closable="false" class="mb-4">
          {{ errorMessage }}
        </Message>

        <Button
          type="submit"
          label="Cambiar Contraseña"
          icon="pi pi-check"
          class="w-full mt-3"
          :loading="loading"
        />
      </form>

      <div v-else class="text-center">
        <Message severity="success" :closable="false" class="mb-4">
          {{ successMessage }}
        </Message>
        <Button
          label="Ir al Login"
          icon="pi pi-sign-in"
          class="mt-3"
          @click="$router.push('/login')"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { authService } from '@/services'
import Password from 'primevue/password'
import Button from 'primevue/button'
import Message from 'primevue/message'

const router = useRouter()
const route = useRoute()

const password = ref('')
const confirmPassword = ref('')
const loading = ref(false)
const errorMessage = ref('')
const errors = ref({})
const exito = ref(false)
const successMessage = ref('')
const token = ref('')

onMounted(() => {
  token.value = route.query.token || ''
  if (!token.value) {
    errorMessage.value = 'Token inválido. Solicitá nuevamente la recuperación de contraseña.'
  }
})

function validate() {
  errors.value = {}
  if (!password.value) {
    errors.value.password = 'La contraseña es requerida'
  } else if (password.value.length < 6) {
    errors.value.password = 'La contraseña debe tener al menos 6 caracteres'
  }
  if (!confirmPassword.value) {
    errors.value.confirmPassword = 'Confirmá tu contraseña'
  } else if (password.value !== confirmPassword.value) {
    errors.value.confirmPassword = 'Las contraseñas no coinciden'
  }
  return Object.keys(errors.value).length === 0
}

async function handleReset() {
  if (!validate()) return
  
  loading.value = true
  errorMessage.value = ''
  
  try {
    const response = await authService.resetearPassword(token.value, password.value)
    successMessage.value = response.message || 'Contraseña actualizada correctamente'
    exito.value = true
  } catch (error) {
    errorMessage.value = error.response?.data?.message || 'Error al cambiar la contraseña. El token puede haber expirado.'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.reset-container {
  background: linear-gradient(135deg, var(--surface-ground) 0%, var(--surface-overlay) 50%, var(--surface-ground) 100%);
}

.reset-card {
  background: var(--surface-card);
  border: 1px solid var(--surface-border);
  border-radius: 16px;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
}

.logo-container {
  width: 100px;
  height: 100px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto;
}

.logo-image {
  width: 100%;
  height: 100%;
  object-fit: contain;
}
</style>
