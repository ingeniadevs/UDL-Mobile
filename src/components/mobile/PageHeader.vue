<template>
  <div class="page-header" :class="{ 'page-header--with-back': showBack }">
    <div class="page-header__main">
      <Button
        v-if="showBack"
        icon="pi pi-arrow-left"
        text
        rounded
        size="small"
        class="page-header__back"
        aria-label="Volver"
        @click="$emit('back')"
      />
      <div class="page-header__titles">
        <h1 class="page-header__title">{{ title }}</h1>
        <p v-if="subtitle" class="page-header__subtitle">{{ subtitle }}</p>
      </div>
    </div>
    <div v-if="$slots.actions || $slots.default" class="page-header__actions">
      <slot name="actions" />
      <slot />
    </div>
  </div>
</template>

<script setup>
import Button from 'primevue/button'

defineProps({
  title: { type: String, required: true },
  subtitle: { type: String, default: '' },
  showBack: { type: Boolean, default: false }
})

defineEmits(['back'])
</script>

<style scoped>
.page-header {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  margin-bottom: 1rem;
}

.page-header__main {
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
  min-width: 0;
}

.page-header__back {
  flex-shrink: 0;
  margin-top: 0.15rem;
}

.page-header__titles {
  min-width: 0;
  flex: 1;
}

.page-header__title {
  margin: 0;
  font-size: 1.35rem;
  font-weight: 700;
  line-height: 1.25;
  color: var(--text-color);
}

.page-header__subtitle {
  margin: 0.25rem 0 0;
  font-size: 0.8rem;
  color: var(--text-color-secondary);
}

.page-header__actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.5rem;
}

@media (min-width: 640px) {
  .page-header {
    flex-direction: row;
    align-items: flex-start;
    justify-content: space-between;
    gap: 1rem;
  }

  .page-header__title {
    font-size: 1.5rem;
  }

  .page-header__actions {
    flex-shrink: 0;
    justify-content: flex-end;
  }
}
</style>
