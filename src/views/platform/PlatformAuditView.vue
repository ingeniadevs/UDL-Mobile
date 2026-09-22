<template>
  <div>
    <div class="mb-4">
      <h1 class="m-0 text-2xl text-white">Auditoría</h1>
      <p class="mt-1 mb-0 text-gray-400">Últimas acciones de platform admin.</p>
    </div>

    <Message v-if="error" severity="error" :closable="false" class="mb-3">{{ error }}</Message>
    <DataTable :value="rows" :loading="loading" stripedRows class="platform-table" responsiveLayout="scroll">
      <Column field="occurredAt" header="Cuando">
        <template #body="{ data }">
          {{ formatDate(data.occurredAt) }}
        </template>
      </Column>
      <Column field="platformAdminEmail" header="Quién" />
      <Column field="action" header="Acción" />
      <Column field="entityType" header="Entidad" />
      <Column field="targetClubId" header="Club" />
      <Column field="details" header="Detalle" />
    </DataTable>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import { platformService } from '@/services/platform'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Message from 'primevue/message'

const rows = ref([])
const loading = ref(true)
const error = ref('')

function formatDate(value) {
  if (!value) return ''
  return new Date(value).toLocaleString('es-AR')
}

onMounted(async () => {
  try {
    rows.value = await platformService.listAudit(100)
  } catch (e) {
    error.value = e.response?.data?.message || 'No se pudo cargar la auditoría'
  } finally {
    loading.value = false
  }
})
</script>

<style scoped>
:deep(.platform-table) {
  background: rgba(10, 15, 30, 0.78);
  border: 1px solid rgba(30, 41, 59, 0.9);
  border-radius: 1rem;
  overflow: hidden;
}
</style>
