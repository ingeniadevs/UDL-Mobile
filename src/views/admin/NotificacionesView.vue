<template>
  <div class="notificaciones-view">
    <PageHeader
      title="Plantillas de Notificaciones"
      subtitle="Personalizá los mensajes que se envían por WhatsApp"
    />

    <div class="card">
      <NotificationTemplatesPanel :active="true" />
    </div>
  </div>
</template>

<script setup>
import NotificationTemplatesPanel from '@/components/notificaciones/NotificationTemplatesPanel.vue'
import PageHeader from '@/components/mobile/PageHeader.vue'
</script>