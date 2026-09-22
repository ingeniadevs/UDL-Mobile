<template>
  <div class="platform-theme login-page min-h-screen flex align-items-center justify-content-center p-4">
    <div class="login-panel w-full">
      <div class="mb-5">
        <div class="eyebrow mb-2">IngeniaLabs</div>
        <h1 class="m-0 text-3xl font-bold">
          <span class="il-gradient-text">Consola</span>
          <span class="text-white"> de clubes</span>
        </h1>
        <p class="mt-2 mb-0 login-muted">
          Administración de tenants, dominios, branding y secretos.
        </p>
      </div>

      <form class="flex flex-column gap-3" @submit.prevent="submit">
        <div>
          <label class="block text-sm login-muted mb-2">Email</label>
          <InputText v-model="email" type="email" class="w-full" autocomplete="username" />
        </div>
        <div>
          <label class="block text-sm login-muted mb-2">Contraseña</label>
          <Password
            v-model="password"
            class="w-full"
            input-class="w-full"
            :feedback="false"
            toggle-mask
            autocomplete="current-password"
          />
        </div>
        <Message v-if="error" severity="error" :closable="false">{{ error }}</Message>
        <Button type="submit" label="Ingresar" icon="pi pi-sign-in" :loading="loading" class="w-full login-cta" />
      </form>

      <a
        class="site-link mt-4 block text-center text-sm"
        href="https://www.ingenialabs.ar/"
        target="_blank"
        rel="noopener noreferrer"
      >
        ingenialabs.ar
      </a>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { usePlatformAuthStore } from '@/stores/platformAuth'
import InputText from 'primevue/inputtext'
import Password from 'primevue/password'
import Button from 'primevue/button'
import Message from 'primevue/message'
import '@/assets/platform-theme.css'

const router = useRouter()
const auth = usePlatformAuthStore()

const email = ref('')
const password = ref('')
const loading = ref(false)
const error = ref('')

async function submit() {
  error.value = ''
  loading.value = true
  try {
    await auth.login(email.value.trim(), password.value)
    await router.replace('/platform/tenants')
  } catch (e) {
    error.value = e.response?.data?.message || 'No se pudo iniciar sesión'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.login-page {
  background: var(--il-aurora);
}

.login-panel {
  max-width: 420px;
  padding: 2rem;
  border-radius: 1.25rem;
  border: 1px solid var(--il-border);
  background: var(--il-surface);
  box-shadow: 0 30px 80px rgba(0, 0, 0, 0.45);
}

.eyebrow {
  color: #fb923c;
  font-size: 0.75rem;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  font-weight: 700;
}

.login-muted {
  color: var(--il-muted);
}

.login-cta {
  background: var(--il-gradient) !important;
  border: none !important;
}

.site-link {
  color: #94a3b8;
  text-decoration: none;
}

.site-link:hover {
  color: #c4b5fd;
}
</style>
