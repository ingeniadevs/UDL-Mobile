<template>
  <div>
    <div class="flex flex-column md:flex-row md:align-items-center justify-content-between gap-3 mb-4">
      <div>
        <h1 class="m-0 text-2xl text-white">Tenants</h1>
        <p class="mt-1 mb-0 text-gray-400">Alta y configuración de clubes multi-tenant.</p>
      </div>
      <Button label="Nuevo tenant" icon="pi pi-plus" @click="$router.push('/platform/tenants/new')" />
    </div>

    <Message v-if="error" severity="error" :closable="false" class="mb-3">{{ error }}</Message>

    <div v-if="loading" class="text-gray-400">Cargando…</div>

    <div v-else class="tenant-grid">
      <button
        v-for="club in clubs"
        :key="club.id"
        type="button"
        class="tenant-card text-left"
        @click="$router.push(`/platform/tenants/${club.id}`)"
      >
          <div class="flex align-items-start justify-content-between gap-2 mb-3">
          <div class="flex align-items-center gap-3">
            <img
              :src="clubLogoSrc(club)"
              alt=""
              class="tenant-logo"
              @error="onClubLogoError"
            />
            <div>
              <div class="font-semibold text-white text-lg">{{ club.name }}</div>
              <div class="text-sm text-gray-400">{{ club.slug }}</div>
            </div>
          </div>
          <Tag :value="club.activo === false ? 'Inactivo' : 'Activo'" :severity="club.activo === false ? 'danger' : 'success'" />
        </div>
        <div class="text-sm text-gray-400">{{ club.tagline || 'Sin tagline' }}</div>
        <div class="mt-3 text-xs accent-count">
          {{ domainCount(club.id) }} dominio(s)
        </div>
      </button>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { platformService } from '@/services/platform'
import { DEFAULT_CLUB_LOGO } from '@/config/tenancy'
import { resolveAssetUrl } from '@/utils/assetUrl'
import { onClubLogoError } from '@/composables/useClubBranding'
import Button from 'primevue/button'
import Message from 'primevue/message'
import Tag from 'primevue/tag'

const clubs = ref([])
const domains = ref([])
const loading = ref(true)
const error = ref('')

const domainByClub = computed(() => {
  const map = {}
  for (const d of domains.value) {
    map[d.clubId] = (map[d.clubId] || 0) + 1
  }
  return map
})

function domainCount(clubId) {
  return domainByClub.value[clubId] || 0
}

function clubLogoSrc(club) {
  const raw = (club?.logoUrl || club?.logo || '').trim()
  return resolveAssetUrl(raw) || DEFAULT_CLUB_LOGO
}

onMounted(async () => {
  try {
    ;[clubs.value, domains.value] = await Promise.all([
      platformService.listClubs(),
      platformService.listDomains()
    ])
  } catch (e) {
    error.value = e.response?.data?.message || 'No se pudieron cargar los tenants'
  } finally {
    loading.value = false
  }
})
</script>

<style scoped>
.tenant-grid {
  display: grid;
  gap: 1rem;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
}

.tenant-card {
  border: 1px solid rgba(30, 41, 59, 0.9);
  background: rgba(10, 15, 30, 0.78);
  border-radius: 1rem;
  padding: 1.1rem;
  cursor: pointer;
  transition: border-color 0.15s ease, transform 0.15s ease;
}

.tenant-card:hover {
  border-color: rgba(124, 58, 237, 0.55);
  transform: translateY(-2px);
}

.tenant-logo {
  width: 2.5rem;
  height: 2.5rem;
  border-radius: 0.75rem;
  object-fit: contain;
  background: rgba(15, 23, 42, 0.9);
  flex-shrink: 0;
}

.accent-count {
  color: #c4b5fd;
}
</style>
