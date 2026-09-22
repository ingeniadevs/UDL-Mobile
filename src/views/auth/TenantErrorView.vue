<template>
  <div class="tenant-error-page min-h-screen flex align-items-center justify-content-center p-4">
    <div class="tenant-error-card text-center p-5 w-full lg:w-5">
      <div class="icon-wrap mb-4">
        <i :class="iconClass" />
      </div>
      <h1 class="page-title text-3xl font-bold mb-3">{{ title }}</h1>
      <p class="text-gray-400 mb-2">{{ message }}</p>
      <p v-if="hostname" class="host-label text-sm text-gray-500 mb-5">
        Host: <code>{{ hostname }}</code>
      </p>
      <p v-else class="mb-5" />

      <div class="flex flex-column gap-2 align-items-center">
        <a
          v-if="supportUrl"
          :href="supportUrl"
          target="_blank"
          rel="noopener noreferrer"
          class="support-link"
        >
          Contactar soporte
        </a>
        <span class="text-xs text-gray-500">Desarrollado por Ingenia Labs</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()

const reason = computed(() => route.query.reason || 'unknown')
const hostname = computed(() => window.location.hostname)

const isInactive = computed(() => reason.value === 'inactive')

const title = computed(() =>
  isInactive.value ? 'Club no disponible' : 'Sitio no reconocido'
)

const message = computed(() =>
  isInactive.value
    ? 'Este club existe pero no está activo en este momento. Contactá a la administración del club.'
    : 'No encontramos un club asociado a esta dirección web. Verificá la URL o contactá a tu club.'
)

const iconClass = computed(() =>
  isInactive.value ? 'pi pi-ban text-5xl text-orange-400' : 'pi pi-question-circle text-5xl text-primary'
)

const supportUrl = 'https://ingenialabs.ar/'
</script>

<style scoped>
.tenant-error-page {
  background: linear-gradient(135deg, var(--surface-ground) 0%, var(--surface-overlay) 50%, var(--surface-ground) 100%);
}

.tenant-error-card {
  background: var(--surface-card);
  border: 1px solid var(--surface-border);
  border-radius: 16px;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
  max-width: 520px;
}

.page-title {
  color: var(--text-color);
}

.icon-wrap {
  width: 88px;
  height: 88px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: var(--highlight-bg);
}

.host-label code {
  color: var(--text-color-secondary);
  background: var(--surface-overlay);
  padding: 0.15rem 0.4rem;
  border-radius: 4px;
}

.support-link {
  color: var(--primary-color);
  text-decoration: none;
  font-weight: 500;
}

.support-link:hover {
  text-decoration: underline;
}
</style>
