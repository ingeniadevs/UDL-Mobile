import { ref, computed, watch } from 'vue'
import { getClubPreset } from '@/config/clubs'
import { useTenantStore } from '@/stores/tenant'

/**
 * Datos bancarios públicos del tenant.
 *
 * Orden de resolución:
 * 1. GET /api/clubs/settings?tenant={id} (Fase 4 backend — preferido)
 * 2. GET /api/clubs/branding?tenant={id} si incluye cbu/alias/titular
 * 3. Preset local en config/clubs.js (white-label / fallback UDL)
 *
 * Depende de TenantSettings en backend; hasta entonces el preset mantiene UDL prod.
 */
const settingsByTenant = ref({})
const loadingTenants = new Set()

function normalizeSettings(raw, preset) {
  const bank = preset?.bankTransfer || {}
  const source = raw || {}
  return {
    cbu: source.cbu || source.Cbu || bank.cbu || '',
    alias: source.alias || source.cbuAlias || source.CbuAlias || bank.alias || '',
    cuit: source.cuit || source.Cuit || bank.cuit || '',
    titular:
      source.titular ||
      source.accountHolder ||
      source.commercialName ||
      source.CommercialName ||
      source.name ||
      bank.titular ||
      preset?.name ||
      '',
    whatsapp: source.whatsapp || source.phone || source.Phone || bank.whatsapp || '',
    phone: source.phone || source.Phone || bank.phone || ''
  }
}

export async function fetchTenantSettings(tenantId) {
  const preset = getClubPreset(tenantId)
  if (!tenantId) return normalizeSettings({}, preset)

  try {
    const { default: api } = await import('@/services/api')
    const { data } = await api.get('/clubs/settings', { params: { tenant: tenantId } })
    if (data) return normalizeSettings(data, preset)
  } catch (error) {
    if (error.response?.status !== 404) {
      /* endpoint aún no desplegado */
    }
  }

  try {
    const { default: api } = await import('@/services/api')
    const { data } = await api.get('/clubs/branding', { params: { tenant: tenantId } })
    if (data?.cbu || data?.alias || data?.Cbu || data?.CbuAlias) {
      return normalizeSettings(data, preset)
    }
  } catch {
    /* branding sin datos bancarios */
  }

  return normalizeSettings({}, preset)
}

export function useTenantSettings() {
  const tenantStore = useTenantStore()
  const tenantId = computed(() => tenantStore.clubId)

  const settings = computed(() => {
    const id = tenantId.value
    if (!id) return normalizeSettings({}, null)
    if (settingsByTenant.value[id]) return settingsByTenant.value[id]
    return normalizeSettings({}, getClubPreset(id))
  })

  async function load(force = false) {
    const id = tenantId.value
    if (!id) return settings.value
    if (!force && settingsByTenant.value[id]) return settingsByTenant.value[id]
    if (loadingTenants.has(id)) return settings.value

    loadingTenants.add(id)
    try {
      settingsByTenant.value[id] = await fetchTenantSettings(id)
    } finally {
      loadingTenants.delete(id)
    }
    return settingsByTenant.value[id]
  }

  watch(tenantId, (id) => {
    if (id) load(true)
  }, { immediate: true })

  return {
    settings,
    bankTransfer: settings,
    load
  }
}
