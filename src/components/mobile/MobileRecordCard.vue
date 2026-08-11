<template>
  <div class="record-card card" @click="$emit('click', $event)">
    <div class="record-card__header">
      <div class="record-card__leading">
        <slot name="leading" />
        <div v-if="title || subtitle" class="record-card__titles">
          <span v-if="title" class="record-card__title">{{ title }}</span>
          <span v-if="subtitle" class="record-card__subtitle">{{ subtitle }}</span>
        </div>
      </div>
      <div v-if="$slots.tags" class="record-card__tags">
        <slot name="tags" />
      </div>
    </div>

    <div v-if="$slots.body" class="record-card__body">
      <slot name="body" />
    </div>

    <div v-if="$slots.actions" class="record-card__actions" @click.stop>
      <slot name="actions" />
    </div>
  </div>
</template>

<script setup>
defineEmits(['click'])

defineProps({
  title: { type: String, default: '' },
  subtitle: { type: String, default: '' }
})
</script>

<style scoped>
.record-card {
  padding: 0.875rem 1rem;
  border-radius: 12px;
  transition: border-color 0.15s ease;
}

.record-card__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 0.75rem;
}

.record-card__leading {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  min-width: 0;
  flex: 1;
}

.record-card__titles {
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
  min-width: 0;
}

.record-card__title {
  font-weight: 600;
  font-size: 0.95rem;
  color: var(--text-color);
  word-break: break-word;
}

.record-card__subtitle {
  font-size: 0.78rem;
  color: var(--text-color-secondary);
}

.record-card__tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.35rem;
  justify-content: flex-end;
  flex-shrink: 0;
}

.record-card__body {
  margin-top: 0.75rem;
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.record-card__row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.82rem;
}

.record-card__label {
  color: var(--text-color-secondary);
}

.record-card__value {
  color: var(--text-color);
  font-weight: 500;
  text-align: right;
}

.record-card__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.35rem;
  margin-top: 0.75rem;
  padding-top: 0.75rem;
  border-top: 1px solid var(--surface-border);
}
</style>
