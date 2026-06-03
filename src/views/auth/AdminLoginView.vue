<template>
  <div class="login-container min-h-screen flex align-items-center justify-content-center">
    <div class="login-card p-6 w-full lg:w-4">
      <div class="text-center mb-5">
        <div class="logo-container mb-4">
          <img src="/images/logo-udl.png" alt="UDL" class="logo-image" />
        </div>
        <div class="text-white text-3xl font-bold mb-2">UDL Admin</div>
        <span class="text-gray-400 font-medium">Panel de Administración</span>
      </div>      <form @submit.prevent="handleLogin">
        <div class="mb-4">
          <label for="identificador" class="block text-gray-300 font-medium mb-2">Usuario o Email</label>
          <InputText 
            id="identificador" 
            v-model="identificador" 
            type="text" 
            class="w-full" 
            placeholder="admin o admin@udl.com"
            :class="{ 'p-invalid': errors.identificador }"
            autocomplete="username"
          />
          <small v-if="errors.identificador" class="p-error">{{ errors.identificador }}</small>
        </div>

        <div class="mb-4">
          <label for="password" class="block text-gray-300 font-medium mb-2">Contraseña</label>
          <Password 
            id="password" 
            v-model="password" 
            class="w-full" 
            input-class="w-full"
            :feedback="false"
            toggle-mask
            :class="{ 'p-invalid': errors.password }"
          />
          <small v-if="errors.password" class="p-error">{{ errors.password }}</small>
        </div>

        <Message v-if="errorMessage" severity="error" :closable="false" class="mb-4">
          {{ errorMessage }}
        </Message>

        <Button 
          type="submit" 
          label="Ingresar al Panel" 
          icon="pi pi-shield" 
          class="w-full mt-3" 
          :loading="loading"
        />
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import InputText from 'primevue/inputtext'
import Password from 'primevue/password'
import Button from 'primevue/button'
import Message from 'primevue/message'

const router = useRouter()
const authStore = useAuthStore()

const identificador = ref('')
const password = ref('')
const loading = ref(false)
const errorMessage = ref('')
const errors = ref({})

function validate() {
  errors.value = {}
  if (!identificador.value) {
    errors.value.identificador = 'El usuario o email es requerido'
  }
  if (!password.value) {
    errors.value.password = 'La contraseña es requerida'
  }
  return Object.keys(errors.value).length === 0
}

async function handleLogin() {
  if (!validate()) return

  loading.value = true
  errorMessage.value = ''

  try {
    // Login unificado: acepta alias (ej: "admin", "fulbo") o email
    await authStore.login(identificador.value, password.value)
    router.push('/admin/inicio')
  } catch (error) {
    errorMessage.value = error.response?.data?.message || 'Credenciales inválidas'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.login-container {
  background: linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 50%, #0a0a0a 100%);
}

.login-card {
  background: #171717;
  border: 1px solid #2a2a2a;
  border-radius: 16px;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
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
