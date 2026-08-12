<template>
  <div class="balance-anual-upload">
    <div class="card">
      <div class="flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
        <div>
          <h3 class="m-0 text-xl">Balances anuales</h3>
          <p class="text-gray-400 text-sm mt-1 mb-0">
            Cargá el balance en PDF, Excel, Word o imagen. Los archivos se almacenan en la nube.
          </p>
        </div>
        <Button label="Cargar balance" icon="pi pi-upload" size="small" @click="abrirUpload" />
      </div>

      <div v-if="loading" class="flex justify-content-center py-4">
        <i class="pi pi-spin pi-spinner text-2xl text-gray-400"></i>
      </div>
      <div v-else-if="balances.length === 0" class="text-center py-4 text-gray-400">
        No hay balances anuales cargados
      </div>
      <div v-else class="mobile-card-list">
        <MobileRecordCard
          v-for="item in balances"
          :key="item.id"
          :title="`Balance ${item.anio}`"
          :subtitle="item.nombreArchivo"
        >
          <template #body>
            <div v-if="item.descripcion" class="record-card__row">
              <span class="record-card__label">Descripción</span>
              <span class="record-card__value">{{ item.descripcion }}</span>
            </div>
            <div class="record-card__row">
              <span class="record-card__label">Cargado por</span>
              <span class="record-card__value">{{ item.usuarioNombre || '—' }}</span>
            </div>
            <div class="record-card__row">
              <span class="record-card__label">Fecha</span>
              <span class="record-card__value">{{ formatFecha(item.fechaCarga) }}</span>
            </div>
          </template>
          <template #actions>
            <Button
              icon="pi pi-eye"
              text
              rounded
              size="small"
              v-tooltip.top="'Ver archivo'"
              :disabled="!getDownloadUrl(item)"
              @click="verArchivo(item)"
            />
            <Button
              icon="pi pi-download"
              text
              rounded
              size="small"
              v-tooltip.top="'Descargar'"
              :disabled="!getDownloadUrl(item)"
              @click="descargar(item)"
            />
            <Button
              icon="pi pi-trash"
              text
              rounded
              size="small"
              severity="danger"
              v-tooltip.top="'Eliminar'"
              @click="eliminar(item)"
            />
          </template>
        </MobileRecordCard>
      </div>
    </div>

    <Dialog v-model:visible="mostrarUpload" header="Cargar balance anual" modal :style="{ width: '520px' }" @hide="resetUpload">
      <div class="flex flex-column gap-3 pt-2">
        <div>
          <label class="block text-sm mb-2">Año *</label>
          <InputNumber v-model="form.anio" :min="2000" :max="2100" class="w-full" :useGrouping="false" />
        </div>
        <div>
          <label class="block text-sm mb-2">Descripción</label>
          <InputText v-model="form.descripcion" class="w-full" placeholder="Opcional" />
        </div>
        <div>
          <label class="block text-sm mb-2">Archivo *</label>
          <FileUpload
            mode="basic"
            name="archivo"
            chooseLabel="Seleccionar archivo"
            :auto="false"
            customUpload
            :maxFileSize="20971520"
            accept=".pdf,.xlsx,.xls,.docx,.doc,.jpg,.jpeg,.png,.webp"
            invalidFileSizeMessage="El archivo no puede superar 20 MB"
            invalidFileTypeMessage="Formato no permitido"
            @select="onFileSelect"
            @clear="onFileClear"
            class="w-full"
          />
          <small class="text-gray-400 block mt-2">PDF, Excel, Word o imagen — máximo 20 MB</small>
        </div>
        <Message v-if="error" severity="error" :closable="false">{{ error }}</Message>
      </div>
      <template #footer>
        <Button label="Cancelar" text @click="mostrarUpload = false" />
        <Button label="Subir" icon="pi pi-upload" @click="subir" :loading="subiendo" :disabled="!archivo" />
      </template>
    </Dialog>

    <ConfirmDialog />
  </div>
</template>

<script setup>
import { ref, watch, onMounted } from 'vue'
import { useToast } from 'primevue/usetoast'
import { useConfirm } from 'primevue/useconfirm'
import { balancesAnualesService } from '@/services'
import MobileRecordCard from '@/components/mobile/MobileRecordCard.vue'
import Button from 'primevue/button'
import Dialog from 'primevue/dialog'
import InputNumber from 'primevue/inputnumber'
import InputText from 'primevue/inputtext'
import Message from 'primevue/message'
import FileUpload from 'primevue/fileupload'
import ConfirmDialog from 'primevue/confirmdialog'

const props = defineProps({
  scope: { type: String, required: true },
  disciplinaId: { type: String, default: null },
  refreshKey: { type: Number, default: 0 }
})

const toast = useToast()
const confirm = useConfirm()

const balances = ref([])
const loading = ref(false)
const mostrarUpload = ref(false)
const subiendo = ref(false)
const error = ref(null)
const archivo = ref(null)
const form = ref({ anio: new Date().getFullYear(), descripcion: '' })

function getDownloadUrl(data) {
  return data?.downloadUrl || data?.DownloadUrl || null
}

function formatFecha(f) {
  return new Date(f).toLocaleDateString('es-AR')
}

function onFileSelect(event) {
  archivo.value = event.files?.[0] || null
}

function onFileClear() {
  archivo.value = null
}

function abrirUpload() {
  error.value = null
  mostrarUpload.value = true
}

function resetUpload() {
  archivo.value = null
  error.value = null
  form.value = { anio: new Date().getFullYear(), descripcion: '' }
}

function verArchivo(data) {
  const url = getDownloadUrl(data)
  if (!url) {
    toast.add({ severity: 'warn', summary: 'Atención', detail: 'No hay URL de archivo disponible', life: 3000 })
    return
  }
  window.open(url, '_blank', 'noopener,noreferrer')
}

function descargar(data) {
  const url = getDownloadUrl(data)
  if (!url) return
  const link = document.createElement('a')
  link.href = url
  link.download = data.nombreArchivo || `balance-${data.anio}`
  link.target = '_blank'
  link.rel = 'noopener noreferrer'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

async function cargar() {
  loading.value = true
  try {
    balances.value = await balancesAnualesService.getAll({
      scope: props.scope,
      disciplinaId: props.disciplinaId || undefined
    })
  } catch {
    toast.add({ severity: 'error', summary: 'Error', detail: 'No se pudieron cargar los balances', life: 3000 })
  } finally {
    loading.value = false
  }
}

async function subir() {
  if (!archivo.value || !form.value.anio) {
    error.value = 'Seleccioná el año y un archivo'
    return
  }
  subiendo.value = true
  error.value = null
  try {
    const fd = new FormData()
    fd.append('scope', props.scope)
    if (props.disciplinaId) fd.append('disciplinaId', props.disciplinaId)
    fd.append('anio', form.value.anio)
    if (form.value.descripcion) fd.append('descripcion', form.value.descripcion)
    fd.append('archivo', archivo.value)
    await balancesAnualesService.upload(fd)
    mostrarUpload.value = false
    resetUpload()
    toast.add({ severity: 'success', summary: 'Balance cargado', life: 3000 })
    await cargar()
  } catch (e) {
    error.value = e.response?.data?.message || 'Error al subir el archivo'
  } finally {
    subiendo.value = false
  }
}

function eliminar(data) {
  confirm.require({
    message: `¿Eliminar el balance del año ${data.anio}?`,
    header: 'Confirmar eliminación',
    icon: 'pi pi-exclamation-triangle',
    acceptClass: 'p-button-danger',
    accept: async () => {
      try {
        await balancesAnualesService.delete(data.id)
        toast.add({ severity: 'success', summary: 'Eliminado', life: 3000 })
        await cargar()
      } catch {
        toast.add({ severity: 'error', summary: 'Error', detail: 'No se pudo eliminar', life: 3000 })
      }
    }
  })
}

watch(() => [props.scope, props.disciplinaId], cargar)
watch(() => props.refreshKey, () => {
  cargar()
})

onMounted(cargar)

defineExpose({ cargar })
</script>

<style scoped>
.balance-anual-upload .card {
  background: var(--surface-card);
  border: 1px solid var(--surface-border);
  border-radius: 12px;
  padding: 1.25rem;
}

:deep(.p-fileupload-basic) {
  width: 100%;
}

:deep(.p-fileupload-basic .p-button) {
  width: 100%;
  justify-content: center;
}
</style>
