<template>
  <div>
    <div class="flex align-items-center gap-2 mb-4">
      <Button icon="pi pi-arrow-left" text rounded @click="$router.push('/platform/tenants')" />
      <div>
        <h1 class="m-0 text-2xl text-white">{{ isNew ? 'Nuevo tenant' : clubForm.name || clubId }}</h1>
        <p class="mt-1 mb-0 text-gray-400">
          {{ isNew ? 'Alta completa: identidad, dominio, settings y secretos.' : 'Edición del tenant' }}
        </p>
      </div>
    </div>

    <Message v-if="pageError" severity="error" :closable="false" class="mb-3">{{ pageError }}</Message>
    <Message v-if="success" severity="success" :closable="true" class="mb-3" @close="success = ''">{{ success }}</Message>

    <TabView v-model:activeIndex="tab">
      <TabPanel header="Identidad">
        <div class="panel-card">
          <div class="form-grid">
            <div>
              <label>Slug / código *</label>
              <InputText v-model="clubForm.slug" :disabled="!isNew" class="w-full" placeholder="ej: river" />
              <small class="hint">Se usa como id y en hosts tipo river.localhost</small>
            </div>
            <div>
              <label>Nombre corto *</label>
              <InputText v-model="clubForm.shortName" class="w-full" maxlength="12" />
            </div>
            <div class="full">
              <label>Nombre comercial *</label>
              <InputText v-model="clubForm.name" class="w-full" />
            </div>
            <div class="full">
              <label>Tagline</label>
              <InputText v-model="clubForm.tagline" class="w-full" />
            </div>
            <div class="full">
              <label>URL del logo / ícono</label>
              <InputText v-model="clubForm.logoUrl" class="w-full" placeholder="https://… o /images/logo.png" />
            </div>
            <div>
              <label>Color primario</label>
              <div class="flex gap-2 align-items-center">
                <input v-model="clubForm.primaryColor" type="color" class="color-input" />
                <InputText v-model="clubForm.primaryColor" class="w-full" />
              </div>
            </div>
            <div>
              <label>Color oscuro</label>
              <div class="flex gap-2 align-items-center">
                <input v-model="clubForm.primaryDark" type="color" class="color-input" />
                <InputText v-model="clubForm.primaryDark" class="w-full" />
              </div>
            </div>
            <div v-if="!isNew" class="full flex align-items-center gap-2">
              <InputSwitch v-model="clubForm.activo" />
              <span>Tenant activo</span>
            </div>
          </div>

          <div class="preview mt-4" :style="{ '--preview': clubForm.primaryColor }">
            <img :src="previewLogoUrl" alt="" class="preview-logo" @error="onLogoError" />
            <div>
              <div class="font-bold text-white">{{ clubForm.name || 'Nombre del club' }}</div>
              <div class="text-sm text-gray-400">{{ clubForm.tagline || 'Tagline' }}</div>
            </div>
          </div>

          <div class="mt-4 flex gap-2">
            <Button
              :label="isNew ? 'Crear tenant' : 'Guardar identidad'"
              icon="pi pi-save"
              :loading="savingIdentity"
              @click="saveIdentity"
            />
          </div>
        </div>
      </TabPanel>

      <TabPanel header="Dominios" :disabled="isNew && !createdId">
        <div class="panel-card">
          <div class="form-grid mb-3">
            <div class="full">
              <label>Host</label>
              <InputText v-model="newDomain" class="w-full" :placeholder="`${clubForm.slug || 'club'}.localhost`" />
              <small class="hint">Ej: {{ clubForm.slug || 'club' }}.localhost · {{ clubForm.slug || 'club' }}.ingenialabs.ar</small>
            </div>
          </div>
          <Button label="Agregar dominio" icon="pi pi-plus" class="mb-4" :loading="savingDomain" @click="addDomain" />

          <div v-if="!clubDomains.length" class="text-gray-400">Sin dominios todavía.</div>
          <div v-else class="flex flex-column gap-2">
            <div v-for="d in clubDomains" :key="d.id" class="domain-row">
              <div>
                <div class="text-white font-medium">{{ d.host }}</div>
                <Tag :value="d.activo ? 'Activo' : 'Off'" :severity="d.activo ? 'success' : 'secondary'" class="mt-1" />
              </div>
              <div class="flex gap-1">
                <Button
                  :icon="d.activo ? 'pi pi-eye-slash' : 'pi pi-eye'"
                  text
                  rounded
                  @click="toggleDomain(d)"
                />
                <Button icon="pi pi-trash" text rounded severity="danger" @click="removeDomain(d)" />
              </div>
            </div>
          </div>
        </div>
      </TabPanel>

      <TabPanel header="Settings" :disabled="isNew && !createdId">
        <div class="panel-card">
          <div class="form-grid">
            <div class="full">
              <label>Nombre comercial</label>
              <InputText v-model="settings.commercialName" class="w-full" />
            </div>
            <div class="full">
              <label>Dirección</label>
              <InputText v-model="settings.address" class="w-full" />
            </div>
            <div>
              <label>Teléfono</label>
              <InputText v-model="settings.phone" class="w-full" />
            </div>
            <div>
              <label>Email público</label>
              <InputText v-model="settings.publicEmail" class="w-full" />
            </div>
            <div>
              <label>CBU</label>
              <InputText v-model="settings.cbu" class="w-full" />
            </div>
            <div>
              <label>Alias CBU</label>
              <InputText v-model="settings.cbuAlias" class="w-full" />
            </div>
          </div>
          <Button label="Guardar settings" icon="pi pi-save" class="mt-4" :loading="savingSettings" @click="saveSettings" />
        </div>
      </TabPanel>

      <TabPanel header="Secrets" :disabled="isNew && !createdId">
        <div class="panel-card">
          <p class="text-gray-400 mt-0 mb-4">
            Solo se envían los campos que completes. Los valores existentes se muestran enmascarados.
          </p>
          <div v-for="group in secretGroups" :key="group.name" class="mb-4">
            <h3 class="text-white text-lg mt-0 mb-3">{{ group.name }}</h3>
            <div class="form-grid">
              <div v-for="item in group.items" :key="item.key" class="full">
                <label>
                  {{ item.label }}
                  <Tag
                    v-if="item.configured"
                    value="Configurado"
                    severity="success"
                    class="ml-2"
                  />
                </label>
                <Password
                  v-if="isSensitive(item.key)"
                  v-model="secretDrafts[item.key]"
                  class="w-full"
                  input-class="w-full"
                  :feedback="false"
                  toggle-mask
                  :placeholder="item.configured ? item.hint || '••••' : ''"
                />
                <InputText
                  v-else
                  v-model="secretDrafts[item.key]"
                  class="w-full"
                  :placeholder="item.configured ? item.hint || 'ya configurado' : ''"
                />
              </div>
            </div>
          </div>
          <Button label="Guardar secrets" icon="pi pi-lock" :loading="savingSecrets" @click="saveSecrets" />
        </div>
      </TabPanel>
    </TabView>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { platformService } from '@/services/platform'
import { DEFAULT_CLUB_LOGO } from '@/config/tenancy'
import { resolveAssetUrl } from '@/utils/assetUrl'
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import InputSwitch from 'primevue/inputswitch'
import Password from 'primevue/password'
import Message from 'primevue/message'
import TabView from 'primevue/tabview'
import TabPanel from 'primevue/tabpanel'
import Tag from 'primevue/tag'

const route = useRoute()
const router = useRouter()

const isNew = computed(() => route.params.id === 'new')
const clubId = computed(() => (isNew.value ? createdId.value : route.params.id))
const createdId = ref('')

const tab = ref(0)
const pageError = ref('')
const success = ref('')
const savingIdentity = ref(false)
const savingDomain = ref(false)
const savingSettings = ref(false)
const savingSecrets = ref(false)

const clubForm = reactive({
  slug: '',
  name: '',
  shortName: '',
  tagline: '',
  logoUrl: '',
  primaryColor: '#7c3aed',
  primaryDark: '#5b21b6',
  activo: true
})

const settings = reactive({
  clubId: '',
  commercialName: '',
  address: '',
  phone: '',
  publicEmail: '',
  cbu: '',
  cbuAlias: ''
})

const domains = ref([])
const secrets = ref([])
const secretDrafts = reactive({})
const newDomain = ref('')

const clubDomains = computed(() =>
  domains.value.filter((d) => d.clubId === clubId.value)
)

const secretGroups = computed(() => {
  const groups = {}
  for (const s of secrets.value) {
    if (!groups[s.group]) groups[s.group] = []
    groups[s.group].push(s)
  }
  return Object.entries(groups).map(([name, items]) => ({ name, items }))
})

function isSensitive(key) {
  return /password|token|access/i.test(key)
}

const previewLogoUrl = computed(() => {
  const raw = (clubForm.logoUrl || '').trim()
  return resolveAssetUrl(raw) || DEFAULT_CLUB_LOGO
})

function onLogoError(e) {
  const img = e.target
  if (!img || img.dataset.defaultLogoApplied === '1') return
  img.dataset.defaultLogoApplied = '1'
  img.src = DEFAULT_CLUB_LOGO
}

async function load() {
  pageError.value = ''
  if (isNew.value) return
  try {
    const clubs = await platformService.listClubs()
    const club = clubs.find((c) => c.id === route.params.id || c.slug === route.params.id)
    if (!club) {
      pageError.value = 'Tenant no encontrado'
      return
    }
            Object.assign(clubForm, {
      slug: club.slug,
      name: club.name,
      shortName: club.shortName,
      tagline: club.tagline || '',
      logoUrl: club.logoUrl || '',
      primaryColor: club.primaryColor || '#7c3aed',
      primaryDark: club.primaryDark || '#5b21b6',
      activo: club.activo !== false
    })
    domains.value = await platformService.listDomains()
    try {
      const s = await platformService.getSettings(club.id)
      Object.assign(settings, s)
    } catch {
      settings.clubId = club.id
      settings.commercialName = club.name
    }
    secrets.value = await platformService.listSecrets(club.id)
    for (const s of secrets.value) secretDrafts[s.key] = ''
  } catch (e) {
    pageError.value = e.response?.data?.message || 'Error al cargar el tenant'
  }
}

async function saveIdentity() {
  pageError.value = ''
  success.value = ''
  if (!clubForm.slug?.trim() || !clubForm.name?.trim() || !clubForm.shortName?.trim()) {
    pageError.value = 'Slug, nombre y nombre corto son obligatorios'
    return
  }
  savingIdentity.value = true
  try {
    if (isNew.value && !createdId.value) {
      const created = await platformService.createClub({
        slug: clubForm.slug.trim().toLowerCase(),
        name: clubForm.name.trim(),
        shortName: clubForm.shortName.trim(),
        logoUrl: clubForm.logoUrl || null,
        primaryColor: clubForm.primaryColor,
        primaryDark: clubForm.primaryDark,
        tagline: clubForm.tagline || null
      })
      createdId.value = created.id
      settings.clubId = created.id
      settings.commercialName = created.name
      newDomain.value = `${created.slug}.localhost`
      secrets.value = await platformService.listSecrets(created.id)
      for (const s of secrets.value) secretDrafts[s.key] = ''
      success.value = 'Tenant creado. Continuá con dominios, settings y secrets.'
      tab.value = 1
      await router.replace(`/platform/tenants/${created.id}`)
    } else {
      const id = clubId.value
      await platformService.updateClub(id, {
        name: clubForm.name.trim(),
        shortName: clubForm.shortName.trim(),
        logoUrl: clubForm.logoUrl || null,
        primaryColor: clubForm.primaryColor,
        primaryDark: clubForm.primaryDark,
        tagline: clubForm.tagline || null,
        activo: clubForm.activo
      })
      success.value = 'Identidad actualizada'
    }
  } catch (e) {
    pageError.value = e.response?.data?.message || 'No se pudo guardar la identidad'
  } finally {
    savingIdentity.value = false
  }
}

async function addDomain() {
  pageError.value = ''
  success.value = ''
  const host = newDomain.value.trim().toLowerCase()
  if (!host || !clubId.value) return
  savingDomain.value = true
  try {
    await platformService.createDomain({ host, clubId: clubId.value, activo: true })
    domains.value = await platformService.listDomains()
    newDomain.value = ''
    success.value = 'Dominio agregado'
  } catch (e) {
    pageError.value = e.response?.data?.message || 'No se pudo agregar el dominio'
  } finally {
    savingDomain.value = false
  }
}

async function toggleDomain(d) {
  try {
    await platformService.updateDomain(d.id, { activo: !d.activo })
    domains.value = await platformService.listDomains()
  } catch (e) {
    pageError.value = e.response?.data?.message || 'No se pudo actualizar el dominio'
  }
}

async function removeDomain(d) {
  try {
    await platformService.deleteDomain(d.id)
    domains.value = await platformService.listDomains()
  } catch (e) {
    pageError.value = e.response?.data?.message || 'No se pudo eliminar el dominio'
  }
}

async function saveSettings() {
  pageError.value = ''
  success.value = ''
  savingSettings.value = true
  try {
    await platformService.upsertSettings(clubId.value, {
      clubId: clubId.value,
      commercialName: settings.commercialName || clubForm.name,
      address: settings.address || null,
      phone: settings.phone || null,
      publicEmail: settings.publicEmail || null,
      cbu: settings.cbu || null,
      cbuAlias: settings.cbuAlias || null
    })
    success.value = 'Settings guardados'
  } catch (e) {
    pageError.value = e.response?.data?.message || 'No se pudieron guardar los settings'
  } finally {
    savingSettings.value = false
  }
}

async function saveSecrets() {
  pageError.value = ''
  success.value = ''
  const payload = {}
  for (const [key, value] of Object.entries(secretDrafts)) {
    if (value != null && String(value).trim() !== '') {
      payload[key] = String(value)
    }
  }
  if (!Object.keys(payload).length) {
    pageError.value = 'Completá al menos un secreto para guardar'
    return
  }
  savingSecrets.value = true
  try {
    await platformService.upsertSecrets(clubId.value, payload)
    secrets.value = await platformService.listSecrets(clubId.value)
    for (const s of secrets.value) secretDrafts[s.key] = ''
    success.value = 'Secrets actualizados'
  } catch (e) {
    pageError.value = e.response?.data?.message || 'No se pudieron guardar los secrets'
  } finally {
    savingSecrets.value = false
  }
}

onMounted(load)
watch(() => route.params.id, () => {
  createdId.value = ''
  load()
})
</script>

<style scoped>
.panel-card {
  border: 1px solid rgba(30, 41, 59, 0.9);
  background: rgba(10, 15, 30, 0.78);
  border-radius: 1rem;
  padding: 1.25rem;
}

.form-grid {
  display: grid;
  gap: 1rem;
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.form-grid .full {
  grid-column: 1 / -1;
}

label {
  display: block;
  margin-bottom: 0.4rem;
  color: #cbd5e1;
  font-size: 0.875rem;
  font-weight: 500;
}

.hint {
  display: block;
  margin-top: 0.35rem;
  color: #64748b;
  font-size: 0.75rem;
}

.color-input {
  width: 2.5rem;
  height: 2.5rem;
  border: none;
  background: transparent;
  padding: 0;
}

.preview {
  display: flex;
  align-items: center;
  gap: 0.85rem;
  padding: 1rem;
  border-radius: 0.85rem;
  border-left: 4px solid var(--preview, #7c3aed);
  background: rgba(2, 6, 23, 0.45);
}

.preview-logo {
  width: 2.75rem;
  height: 2.75rem;
  object-fit: contain;
  border-radius: 0.5rem;
  background: #fff;
}

.domain-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 0.85rem 1rem;
  border-radius: 0.75rem;
  border: 1px solid rgba(148, 163, 184, 0.12);
  background: rgba(2, 6, 23, 0.35);
}

@media (max-width: 768px) {
  .form-grid {
    grid-template-columns: 1fr;
  }
}
</style>
