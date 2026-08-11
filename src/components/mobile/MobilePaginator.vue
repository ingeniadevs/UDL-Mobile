<template>
  <div v-if="total > 0" class="mobile-paginator flex align-items-center justify-content-between gap-2 mt-3">
    <Button
      icon="pi pi-chevron-left"
      text
      rounded
      size="small"
      :disabled="page <= 1"
      @click="$emit('update:page', page - 1)"
    />
    <span class="text-sm text-color-secondary">
      {{ start }}–{{ end }} de {{ total }}
    </span>
    <Button
      icon="pi pi-chevron-right"
      text
      rounded
      size="small"
      :disabled="page >= totalPages"
      @click="$emit('update:page', page + 1)"
    />
  </div>
</template>

<script setup>
import { computed } from 'vue'
import Button from 'primevue/button'

const props = defineProps({
  page: { type: Number, default: 1 },
  rows: { type: Number, default: 10 },
  total: { type: Number, default: 0 }
})

defineEmits(['update:page'])

const totalPages = computed(() => Math.max(1, Math.ceil(props.total / props.rows)))
const start = computed(() => (props.page - 1) * props.rows + 1)
const end = computed(() => Math.min(props.page * props.rows, props.total))
</script>
