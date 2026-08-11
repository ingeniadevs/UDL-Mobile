<template>
  <img
    :src="ingeniaLogo"
    :alt="ariaLabel"
    class="ingenia-club-icon"
    :class="sizeClass"
  />
</template>

<script setup>
import { computed } from 'vue'
import ingeniaLogo from '@/assets/ingenia.jpeg'

const props = defineProps({
  size: {
    type: String,
    default: 'md',
    validator: (value) => ['sm', 'md', 'lg', 'xl'].includes(value)
  },
  ariaLabel: {
    type: String,
    default: 'Ingenia Club'
  }
})

const sizeClass = computed(() => `ingenia-club-icon--${props.size}`)
</script>

<style scoped>
.ingenia-club-icon {
  display: block;
  flex-shrink: 0;
  object-fit: contain;
}

.ingenia-club-icon--sm {
  height: 24px;
  width: auto;
  max-width: 72px;
}

.ingenia-club-icon--md {
  height: 36px;
  width: auto;
  max-width: 108px;
}

.ingenia-club-icon--lg {
  height: 72px;
  width: auto;
  max-width: 180px;
}

.ingenia-club-icon--xl {
  height: 96px;
  width: auto;
  max-width: 220px;
}
</style>
