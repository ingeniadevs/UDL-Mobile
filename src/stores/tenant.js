import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { getClubPreset, getWhiteLabelClubId } from '@/config/clubs'
import { normalizeClub, normalizeClubsFromLogin } from '@/config/tenancy'
import { getTenantJson, setTenantJson } from '@/platform/storage'

export const useTenantStore = defineStore('tenant', () => {
  const club = ref(null)
  const memberships = ref([])
  const hydrated = ref(false)

  const isWhiteLabel = computed(() => !!getWhiteLabelClubId())
  const hasTenant = computed(() => !!club.value?.id)
  const clubId = computed(() => club.value?.id || club.value?.slug || null)
  const clubSlug = computed(() => club.value?.slug || club.value?.id || null)

  async function persist() {
    await setTenantJson(club.value ? JSON.stringify(club.value) : null)
  }

  async function hydrate() {
    const whiteLabelId = getWhiteLabelClubId()
    if (whiteLabelId) {
      club.value = normalizeClub(getClubPreset(whiteLabelId) || { id: whiteLabelId, slug: whiteLabelId })
      await persist()
      hydrated.value = true
      return
    }

    const stored = await getTenantJson()
    if (stored) {
      try {
        club.value = normalizeClub(JSON.parse(stored))
      } catch {
        club.value = null
      }
    }
    hydrated.value = true
  }

  async function selectClub(nextClub) {
    const normalized = normalizeClub(nextClub)
    club.value = normalized
    await persist()
    return normalized
  }

  async function applyFromLogin(data) {
    const clubs = normalizeClubsFromLogin(data)
    memberships.value = clubs

    if (isWhiteLabel.value) {
      const forced = getWhiteLabelClubId()
      const match = clubs.find((c) => c.id === forced || c.slug === forced)
      if (!match) {
        club.value = normalizeClub(getClubPreset(forced) || { id: forced, slug: forced })
        await persist()
        const err = new Error(
          `Tu cuenta no tiene acceso a este club (${forced}). Usá una cuenta con membresía activa.`
        )
        err.code = 'WHITELABEL_NO_MEMBERSHIP'
        throw err
      }
      await selectClub(match)
      return memberships.value
    }

    if (clubs.length === 1) {
      await selectClub(clubs[0])
    } else {
      club.value = null
      await persist()
    }

    return memberships.value
  }

  async function fetchCatalogFallback() {
    try {
      const { default: api } = await import('@/services/api')
      const { data } = await api.get('/clubs')
      const list = Array.isArray(data) ? data.map(normalizeClub).filter(Boolean) : []
      if (list.length) return list
    } catch {
      /* backend viejo o sin catálogo */
    }
    const whiteLabelId = getWhiteLabelClubId()
    if (whiteLabelId) {
      const preset = getClubPreset(whiteLabelId)
      return preset ? [normalizeClub(preset)] : []
    }
    return []
  }

  async function clear() {
    if (isWhiteLabel.value) return
    club.value = null
    memberships.value = []
    await persist()
  }

  return {
    club,
    memberships,
    hydrated,
    isWhiteLabel,
    hasTenant,
    clubId,
    clubSlug,
    hydrate,
    selectClub,
    applyFromLogin,
    fetchCatalogFallback,
    clear
  }
})
