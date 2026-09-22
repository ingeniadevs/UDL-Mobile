import { ref, computed, watch } from 'vue'
import { useTenantStore } from '@/stores/tenant'

const settingsByTenant = ref({})
const loadingTenants = new Set()

function normalizeSettings(raw) {
  const source = raw || {}
  return {
    cbu: source.cbu || source.Cbu || '',
    alias: source.alias || source.cbuAlias || source.CbuAlias || '',
    cuit: source.cuit || source.Cuit || '',
    titular:
      source.titular ||
      source.accountHolder ||
      source.commercialName ||
      source.CommercialName ||
      source.name ||
      '',
    whatsapp: source.whatsapp || source.phone || source.Phone || '',
    phone: source.phone || source.Phone || '',
    address: source.address || source.Address || ''
  }
}

export async function fetchTenantSettings(tenantId) {
  if (!tenantId) return normalizeSettings({})

  try {
    const { default: api } = await import('@/services/api')
    const { data } = await api.get('/clubs/settings', { params: { tenant: tenantId } })
    if (data) return normalizeSettings(data)
  } catch (error) {
    if (error.response?.status !== 404) {
      /* endpoint no disponible */
    }
  }

  try {
    const { default: api } = await import('@/services/api')
    const { data } = await api.get('/clubs/branding', { params: { tenant: tenantId } })
    if (data?.cbu || data?.alias || data?.Cbu || data?.CbuAlias) {
      return normalizeSettings(data)
    }
  } catch {
    /* branding sin datos bancarios */
  }

  return normalizeSettings({})
}

export function useTenantSettings() {
  const tenantStore = useTenantStore()
  const tenantId = computed(() => tenantStore.clubId)

  const settings = computed(() => {
    const id = tenantId.value
    const clubName = tenantStore.club?.name || ''
    if (!id) return normalizeSettings({})
    const raw = settingsByTenant.value[id]
      ? { ...settingsByTenant.value[id] }
      : normalizeSettings({})
    if (!raw.titular && clubName) raw.titular = clubName
    return raw
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
