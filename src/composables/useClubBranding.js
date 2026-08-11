import { ref, computed, watch } from 'vue'
import { getClubPreset, getDefaultClubId } from '@/config/clubs'

const clubId = ref(getDefaultClubId())
const remoteBranding = ref(null)
const loaded = ref(false)

function applyCssVariables(branding) {
  const root = document.documentElement
  root.style.setProperty('--udl-red', branding.primaryColor)
  root.style.setProperty('--udl-red-dark', branding.primaryDark)
  root.style.setProperty('--primary-color', branding.primaryColor)
  root.dataset.clubId = branding.id
}

/**
 * Hidrata branding desde API cuando esté disponible.
 * Endpoint futuro: GET /api/club/branding?tenant={id}
 */
export async function hydrateClubBranding() {
  const preset = getClubPreset(clubId.value)
  applyCssVariables(preset)

  const apiUrl = import.meta.env.VITE_API_URL
  if (!apiUrl) {
    loaded.value = true
    return preset
  }

  try {
    const res = await fetch(`${apiUrl}/club/branding?tenant=${clubId.value}`)
    if (res.ok) {
      const data = await res.json()
      remoteBranding.value = { ...preset, ...data }
      applyCssVariables(remoteBranding.value)
    }
  } catch {
    /* backend aún no expone branding */
  }

  loaded.value = true
  return remoteBranding.value || preset
}

const branding = computed(() => {
  if (remoteBranding.value) return remoteBranding.value
  return getClubPreset(clubId.value)
})

watch(branding, (b) => applyCssVariables(b), { immediate: true })

export function useClubBranding() {
  function setClubId(id) {
    clubId.value = id || getDefaultClubId()
    remoteBranding.value = null
    applyCssVariables(getClubPreset(clubId.value))
  }

  return {
    clubId,
    branding,
    loaded,
    setClubId,
    logoUrl: computed(() => branding.value.logo),
    clubName: computed(() => branding.value.name),
    shortName: computed(() => branding.value.shortName)
  }
}
