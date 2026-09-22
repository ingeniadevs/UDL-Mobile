import { ref, computed, watch } from 'vue'
import { getClubPreset } from '@/config/clubs'
import { APP_BRANDING } from '@/config/app'
import { DEFAULT_CLUB_LOGO } from '@/config/tenancy'
import { resolveAssetUrl } from '@/utils/assetUrl'
import { useTenantStore } from '@/stores/tenant'

const clubId = ref(null)
const remoteBranding = ref(null)
const loaded = ref(false)

const communityBranding = {
  id: null,
  slug: null,
  name: '',
  shortName: '',
  logo: DEFAULT_CLUB_LOGO,
  logoAlt: '',
  primaryColor: APP_BRANDING.primaryColor,
  primaryDark: APP_BRANDING.primaryDark,
  welcomeText: APP_BRANDING.tagline
}

function applyCssVariables(branding) {
  const root = document.documentElement
  root.style.setProperty('--udl-red', branding.primaryColor)
  root.style.setProperty('--udl-red-dark', branding.primaryDark)
  root.style.setProperty('--primary-color', branding.primaryColor)
  if (branding.id) root.dataset.clubId = branding.id
  else delete root.dataset.clubId
}

function applyCommunityTheme() {
  applyCssVariables(communityBranding)
}

function resolveLogo(branding) {
  const raw = branding?.logo || branding?.logoUrl || ''
  return resolveAssetUrl(raw) || DEFAULT_CLUB_LOGO
}

/**
 * Hidrata branding desde API cuando el tenant ya está resuelto.
 * GET /api/clubs/branding?tenant={id}
 */
export async function hydrateClubBranding() {
  if (!clubId.value) {
    remoteBranding.value = null
    applyCommunityTheme()
    loaded.value = true
    return null
  }

  const preset = getClubPreset(clubId.value)
  if (preset) applyCssVariables(preset)

  const apiUrl = import.meta.env.VITE_API_URL
  if (!apiUrl) {
    loaded.value = true
    return preset || communityBranding
  }

  try {
    const res = await fetch(`${apiUrl}/clubs/branding?tenant=${clubId.value}`)
    if (res.ok) {
      const data = await res.json()
      const logo = (data.logoUrl || data.logo || preset?.logo || '').trim()
      remoteBranding.value = {
        ...(preset || {}),
        ...data,
        logo: logo || DEFAULT_CLUB_LOGO
      }
      applyCssVariables(remoteBranding.value)
    }
  } catch {
    /* backend aún no expone branding */
  }

  loaded.value = true
  return remoteBranding.value || preset || communityBranding
}

const branding = computed(() => {
  if (remoteBranding.value) return remoteBranding.value
  let tenantClub = null
  try {
    tenantClub = useTenantStore().club
  } catch {
    tenantClub = null
  }
  if (tenantClub?.id) {
    const preset = getClubPreset(tenantClub.id) || getClubPreset(tenantClub.slug) || {}
    return { ...communityBranding, ...preset, ...tenantClub }
  }
  if (!clubId.value) return communityBranding
  return getClubPreset(clubId.value) || communityBranding
})

watch(branding, (b) => applyCssVariables(b), { immediate: true })

/** Handler @error en `<img>` de logos de club. */
export function onClubLogoError(event) {
  const img = event?.target
  if (!img || img.dataset.defaultLogoApplied === '1') return
  img.dataset.defaultLogoApplied = '1'
  img.src = DEFAULT_CLUB_LOGO
}

export function useClubBranding() {
  function setClubId(id) {
    clubId.value = id || null
    remoteBranding.value = null
    if (!clubId.value) {
      applyCommunityTheme()
      return
    }
    const preset = getClubPreset(clubId.value)
    if (preset) applyCssVariables(preset)
  }

  return {
    clubId,
    branding,
    loaded,
    setClubId,
    logoUrl: computed(() => resolveLogo(branding.value)),
    clubName: computed(() => branding.value.name),
    shortName: computed(() => branding.value.shortName),
    onClubLogoError
  }
}
