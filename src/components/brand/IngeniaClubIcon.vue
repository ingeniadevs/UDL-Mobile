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
import ingeniaLogo from '@/assets/foco-ingenia.png'

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
  background: transparent;
}

.ingenia-club-icon--sm {
  height: 28px;
  width: auto;
}

.ingenia-club-icon--md {
  height: 40px;
  width: auto;
}

.ingenia-club-icon--lg {
  height: 72px;
  width: auto;
}

.ingenia-club-icon--xl {
  height: 120px;
  width: auto;
}
</style>
