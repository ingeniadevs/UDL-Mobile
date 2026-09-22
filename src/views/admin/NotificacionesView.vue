<template>
  <div class="notificaciones-view">
    <div class="page-header mb-4">
      <div>
        <h1 class="text-3xl font-bold m-0 page-title">
          <i class="pi pi-file-edit mr-2" />Plantillas de Notificaciones
        </h1>
        <p class="page-subtitle m-0 mt-2">
          Personalizá los mensajes que se envían por WhatsApp
        </p>
      </div>
    </div>

    <div class="card">
      <NotificationTemplatesPanel :active="true" />
    </div>
  </div>
</template>

<script setup>
import NotificationTemplatesPanel from '@/components/notificaciones/NotificationTemplatesPanel.vue'
</script>

<style scoped>
.page-header {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
}

.page-subtitle {
  font-size: 0.9rem;
  color: var(--text-color-secondary);
}
</style>