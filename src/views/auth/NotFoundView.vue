<template>  <div class="not-found-page min-h-screen flex align-items-center justify-content-center">
    <div class="text-center">
      <img :src="clubLogo" :alt="clubLogoAlt" style="width: 120px; margin-bottom: 2rem" @error="onClubLogoError" />
      <div class="text-6xl text-primary mb-4">404</div>
      <h1 class="page-title text-3xl mb-3">Página no encontrada</h1>
      <p class="text-gray-400 mb-5">La página que buscas no existe.</p>
      <Button label="Volver al inicio" icon="pi pi-home" @click="goHome" />
    </div>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'
import { useClubBranding, hydrateClubBranding } from '@/composables/useClubBranding'
import { onMounted } from 'vue'
import Button from 'primevue/button'

const router = useRouter()
const { logoUrl, logoAlt, onClubLogoError } = useClubBranding()
const clubLogo = logoUrl
const clubLogoAlt = logoAlt

onMounted(() => {
  hydrateClubBranding()
})

function goHome() {
  router.push('/login')
}
</script>

<style scoped>
.not-found-page {
  background: var(--surface-ground);
  color: var(--text-color);
}

.page-title {
  color: var(--text-color);
}
</style>
