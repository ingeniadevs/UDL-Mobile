<template>
  <div class="templates-panel">
    <div class="templates-panel__intro mb-3">
      <Message severity="info" :closable="false">
        Personalizá los mensajes de WhatsApp. Usá llaves como <code>{Nombre}</code> para datos dinámicos.
        Los cambios aplican a nuevos envíos y a la cola al sincronizar.
      </Message>
    </div>

    <div v-if="loading" class="loading-wrap">
      <ProgressSpinner style="width: 40px; height: 40px" />
      <span>Cargando plantillas…</span>
    </div>

    <div v-else class="grid">
      <!-- Selector -->
      <div class="col-12 lg:col-4">
        <div
          v-for="tipo in tiposOrden"
          :key="tipo"
          class="tpl-card"
          :class="{ 'tpl-card--active': tipoActivo === tipo, [`tpl-card--${PLANTILLA_META[tipo].color}`]: true }"
          @click="seleccionar(tipo)"
        >
          <div class="tpl-card__head">
            <i :class="['pi', PLANTILLA_META[tipo].icon, 'tpl-card__icon']" />
            <div class="flex-1">
              <span class="tpl-card__title">{{ PLANTILLA_META[tipo].label }}</span>
              <span class="tpl-card__desc">{{ PLANTILLA_META[tipo].description }}</span>
            </div>
            <Tag
              :value="drafts[tipo]?.activo !== false ? 'Activa' : 'Inactiva'"
              :severity="drafts[tipo]?.activo !== false ? 'success' : 'secondary'"
            />
          </div>
          <p class="tpl-card__preview">{{ previewCorta(drafts[tipo]?.contenido) }}</p>
          <Tag v-if="isDirty(tipo)" value="Sin guardar" severity="warning" class="mt-2" />
        </div>
      </div>

      <!-- Editor -->
      <div class="col-12 lg:col-8">
        <div v-if="draftActual" class="editor-card">
          <div class="editor-card__header">
            <div>
              <h3 class="m-0">{{ PLANTILLA_META[tipoActivo].label }}</h3>
              <span class="editor-card__sub">Editá el texto del mensaje</span>
            </div>
            <div class="flex align-items-center gap-3">
              <label class="flex align-items-center gap-2 cursor-pointer">
                <InputSwitch v-model="draftActual.activo" />
                <span class="text-sm">Plantilla activa</span>
              </label>
            </div>
          </div>

          <Divider />

          <div class="grid">
            <div class="col-12 md:col-7">
              <label class="field-label">Mensaje</label>
              <Textarea
                ref="textareaRef"
                v-model="draftActual.contenido"
                rows="10"
                class="w-full editor-textarea"
                autoResize
                placeholder="Escribí el mensaje…"
              />
              <div class="editor-actions mt-2">
                <Button
                  label="Restaurar predeterminada"
                  icon="pi pi-refresh"
                  text
                  size="small"
                  @click="restaurarDefault"
                />
              </div>
            </div>

            <div class="col-12 md:col-5">
              <label class="field-label">Insertar variable</label>
              <div class="var-chips">
                <Button
                  v-for="v in variablesActuales"
                  :key="v"
                  :label="'{' + v + '}'"
                  size="small"
                  outlined
                  class="var-chip"
                  v-tooltip.top="'Insertar en el cursor'"
                  @click="insertarVariable(v)"
                />
              </div>
              <label class="field-label mt-3">Todas las variables</label>
              <ul class="var-list">
                <li v-for="v in TODAS_VARIABLES" :key="v">
                  <code>{{ '{' + v + '}' }}</code>
                </li>
              </ul>
            </div>
          </div>

          <Divider />

          <div class="preview-block">
            <div class="flex align-items-center justify-content-between mb-2">
              <label class="field-label m-0">Vista previa (datos de ejemplo)</label>
              <i class="pi pi-whatsapp text-green-400 text-xl" />
            </div>
            <div class="preview-bubble">
              <pre class="preview-bubble__text">{{ previewCompleta }}</pre>
            </div>
          </div>

          <div class="editor-footer">
            <Button
              label="Descartar cambios"
              icon="pi pi-times"
              text
              :disabled="!isDirty(tipoActivo)"
              @click="descartar"
            />
            <Button
              label="Guardar esta plantilla"
              icon="pi pi-save"
              :loading="saving === tipoActivo"
              :disabled="!isDirty(tipoActivo)"
              @click="guardarUna"
            />
            <Button
              label="Guardar todas"
              icon="pi pi-check-circle"
              outlined
              :loading="savingAll"
              :disabled="!hayAlgunCambio"
              @click="guardarTodas"
            />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch, nextTick } from 'vue'
import { useToast } from 'primevue/usetoast'
import { useConfirm } from 'primevue/useconfirm'
import Button from 'primevue/button'
import Textarea from 'primevue/textarea'
import InputSwitch from 'primevue/inputswitch'
import Tag from 'primevue/tag'
import Divider from 'primevue/divider'
import Message from 'primevue/message'
import ProgressSpinner from 'primevue/progressspinner'
import { notificacionesService } from '@/services/notificacionesService'
import {
  PLANTILLA_DEFAULTS,
  PLANTILLA_META,
  renderPlantillaPreview
} from '@/utils/notificationTemplates'

const props = defineProps({
  active: { type: Boolean, default: true }
})

const emit = defineEmits(['saved'])

const toast = useToast()
const confirm = useConfirm()

const TODAS_VARIABLES = [
  'Nombre', 'Apellido', 'NumeroSocio', 'FechaVencimiento', 'Monto',
  'NumeroPedido', 'Estado', 'Fecha', 'Hora', 'Espacio'
]

const tiposOrden = ['Vencimiento', 'Reserva', 'Pedido']
const tipoActivo = ref('Vencimiento')
const loading = ref(true)
const saving = ref(null)
const savingAll = ref(false)
const textareaRef = ref(null)

/** @type {import('vue').Ref<Record<string, { tipo: string, contenido: string, activo: boolean }>>} */
const drafts = ref({})
/** @type {import('vue').Ref<Record<string, { tipo: string, contenido: string, activo: boolean }>>} */
const saved = ref({})

const draftActual = computed(() => drafts.value[tipoActivo.value])

const variablesActuales = computed(() => PLANTILLA_META[tipoActivo.value]?.variables || [])

const previewCompleta = computed(() =>
  renderPlantillaPreview(draftActual.value?.contenido || '')
)

const hayAlgunCambio = computed(() => tiposOrden.some((t) => isDirty(t)))

let loadedOnce = false

watch(
  () => props.active,
  (isActive) => {
    if (isActive && !loadedOnce) cargar()
  }
)

onMounted(() => {
  if (props.active) cargar()
})

function clonePlantilla(p) {
  return { tipo: p.tipo, contenido: p.contenido || '', activo: p.activo !== false }
}

function isDirty(tipo) {
  const d = drafts.value[tipo]
  const s = saved.value[tipo]
  if (!d || !s) return false
  return d.contenido !== s.contenido || d.activo !== s.activo
}

async function cargar() {
  loading.value = true
  try {
    const list = await notificacionesService.getPlantillas()
    const map = {}
    for (const t of tiposOrden) {
      const found = list.find((p) => p.tipo === t) || {
        tipo: t,
        contenido: PLANTILLA_DEFAULTS[t],
        activo: true
      }
      map[t] = clonePlantilla(found)
    }
    drafts.value = JSON.parse(JSON.stringify(map))
    saved.value = JSON.parse(JSON.stringify(map))
    loadedOnce = true
  } catch {
    toast.add({ severity: 'error', summary: 'No se pudieron cargar las plantillas', life: 3000 })
  } finally {
    loading.value = false
  }
}

function seleccionar(tipo) {
  tipoActivo.value = tipo
}

function previewCorta(texto) {
  if (!texto) return 'Sin contenido'
  const line = texto.replace(/\s+/g, ' ').trim()
  return line.length > 72 ? line.slice(0, 72) + '…' : line
}

function insertarVariable(nombre) {
  const token = `{${nombre}}`
  const d = draftActual.value
  if (!d) return
  const el = textareaRef.value?.$el?.querySelector('textarea')
  if (el && typeof el.selectionStart === 'number') {
    const start = el.selectionStart
    const end = el.selectionEnd
    const text = d.contenido || ''
    d.contenido = text.slice(0, start) + token + text.slice(end)
    nextTick(() => {
      el.focus()
      const pos = start + token.length
      el.setSelectionRange(pos, pos)
    })
  } else {
    d.contenido = (d.contenido || '') + token
  }
}

function restaurarDefault() {
  confirm.require({
    message: '¿Restaurar el texto predeterminado de esta plantilla?',
    header: 'Restaurar',
    icon: 'pi pi-question-circle',
    accept: () => {
      const d = draftActual.value
      if (d) d.contenido = PLANTILLA_DEFAULTS[tipoActivo.value]
    }
  })
}

function descartar() {
  const t = tipoActivo.value
  if (saved.value[t]) {
    drafts.value[t] = JSON.parse(JSON.stringify(saved.value[t]))
  }
}

async function guardarUna() {
  const t = tipoActivo.value
  const d = drafts.value[t]
  if (!d) return
  saving.value = t
  try {
    await notificacionesService.updatePlantilla(t, {
      contenido: d.contenido,
      activo: d.activo
    })
    saved.value[t] = JSON.parse(JSON.stringify(d))
    toast.add({ severity: 'success', summary: 'Plantilla guardada', life: 2500 })
    emit('saved')
  } catch {
    toast.add({ severity: 'error', summary: 'Error al guardar', life: 3000 })
  } finally {
    saving.value = null
  }
}

async function guardarTodas() {
  savingAll.value = true
  try {
    for (const t of tiposOrden) {
      if (!isDirty(t)) continue
      const d = drafts.value[t]
      await notificacionesService.updatePlantilla(t, {
        contenido: d.contenido,
        activo: d.activo
      })
      saved.value[t] = JSON.parse(JSON.stringify(d))
    }
    toast.add({ severity: 'success', summary: 'Todas las plantillas guardadas', life: 2500 })
    emit('saved')
  } catch {
    toast.add({ severity: 'error', summary: 'Error al guardar plantillas', life: 3000 })
  } finally {
    savingAll.value = false
  }
}
</script>

<style scoped>
.templates-panel__intro :deep(code) {
  background: rgba(0, 0, 0, 0.2);
  padding: 0.1rem 0.35rem;
  border-radius: 4px;
  font-size: 0.85em;
}

.loading-wrap {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  padding: 3rem;
  color: var(--text-color-secondary);
}

.tpl-card {
  padding: 1rem;
  border-radius: 10px;
  border: 2px solid var(--surface-border);
  background: var(--surface-ground);
  margin-bottom: 0.75rem;
  cursor: pointer;
  transition: border-color 0.15s, box-shadow 0.15s;
}

.tpl-card:hover {
  border-color: var(--primary-color);
}

.tpl-card--active {
  border-color: var(--primary-color);
  box-shadow: 0 0 0 1px var(--primary-color);
}

.tpl-card--venc.tpl-card--active { border-color: #fbbf24; box-shadow: 0 0 0 1px #fbbf24; }
.tpl-card--res.tpl-card--active { border-color: #60a5fa; box-shadow: 0 0 0 1px #60a5fa; }
.tpl-card--ped.tpl-card--active { border-color: #4ade80; box-shadow: 0 0 0 1px #4ade80; }

.tpl-card__head {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
}

.tpl-card__icon {
  font-size: 1.35rem;
  margin-top: 0.15rem;
}

.tpl-card--venc .tpl-card__icon { color: #fbbf24; }
.tpl-card--res .tpl-card__icon { color: #60a5fa; }
.tpl-card--ped .tpl-card__icon { color: #4ade80; }

.tpl-card__title {
  display: block;
  font-weight: 600;
  color: var(--text-color);
}

.tpl-card__desc {
  display: block;
  font-size: 0.75rem;
  color: var(--text-color-secondary);
  margin-top: 0.15rem;
}

.tpl-card__preview {
  margin: 0.75rem 0 0;
  font-size: 0.8rem;
  color: var(--text-color-secondary);
  line-height: 1.4;
}

.editor-card {
  background: var(--surface-ground);
  border: 1px solid var(--surface-border);
  border-radius: 10px;
  padding: 1.25rem;
  min-height: 100%;
}

.editor-card__header {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
}

.editor-card__sub {
  font-size: 0.85rem;
  color: var(--text-color-secondary);
}

.field-label {
  display: block;
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--text-color-secondary);
  margin-bottom: 0.5rem;
  text-transform: uppercase;
  letter-spacing: 0.03em;
}

.editor-textarea :deep(textarea) {
  font-family: inherit;
  line-height: 1.5;
}

.var-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 0.35rem;
}

.var-chip {
  font-family: ui-monospace, monospace;
  font-size: 0.8rem;
}

.var-list {
  margin: 0;
  padding-left: 0;
  list-style: none;
  font-size: 0.8rem;
  color: var(--text-color-secondary);
  display: flex;
  flex-wrap: wrap;
  gap: 0.35rem 0.75rem;
}

.var-list code {
  background: var(--surface-card);
  padding: 0.15rem 0.4rem;
  border-radius: 4px;
  color: var(--text-color);
}

.preview-bubble {
  background: #0b141a;
  border-radius: 12px 12px 12px 4px;
  padding: 1rem 1.1rem;
  max-width: 100%;
  border: 1px solid #1f2c34;
}

.preview-bubble__text {
  margin: 0;
  white-space: pre-wrap;
  word-break: break-word;
  font-family: inherit;
  font-size: 0.9rem;
  line-height: 1.45;
  color: #e9edef;
}

.editor-footer {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  justify-content: flex-end;
  margin-top: 1rem;
  padding-top: 0.5rem;
}
</style>
