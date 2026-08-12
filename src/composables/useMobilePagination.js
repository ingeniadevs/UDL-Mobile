import { ref, computed, watch } from 'vue'

/**
 * Paginación simple para listas mobile (cards).
 * Resetea a página 1 cuando cambian los filtros.
 */
export function useMobilePagination(source, rows = 10, resetDeps = []) {
  const page = ref(1)

  const total = computed(() => source.value?.length ?? 0)

  const paginated = computed(() => {
    const list = source.value || []
    const start = (page.value - 1) * rows
    return list.slice(start, start + rows)
  })

  if (resetDeps.length) {
    watch(resetDeps, () => {
      page.value = 1
    })
  }

  return { page, rows, total, paginated }
}
