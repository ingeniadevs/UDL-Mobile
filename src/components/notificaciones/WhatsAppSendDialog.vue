<template>
  <Dialog
    v-model:visible="visible"
    header="Enviar por WhatsApp"
    modal
    class="wa-dialog"
    :style="{ width: 'min(520px, 95vw)' }"
    @hide="onHide"
  >
    <div class="wa-dialog__body">
      <div class="info-row">
        <span class="info-row__label">Cliente</span>
        <span class="info-row__value">{{ clienteNombre }}</span>
      </div>
      <div class="info-row">
        <span class="info-row__label">Teléfono</span>
        <span class="info-row__value" :class="{ 'text-green-400': telefono }">{{ telefono || '—' }}</span>
      </div>
      <Message v-if="telefonoError" severity="warn" :closable="false">
        {{ telefonoError }}
      </Message>
      <div class="info-row">
        <span class="info-row__label">Tipo</span>
        <Tag :value="tipoLabel" severity="info" />
      </div>
      <div class="field-block">
        <label class="field-label">Mensaje editable</label>
        <Textarea v-model="mensajeLocal" rows="8" class="w-full" autoResize />
        <small class="field-hint">
          Variables: {Nombre}, {Apellido}, {NumeroSocio}, {FechaVencimiento}, {Monto}, {NumeroPedido}, {Estado}, {Fecha}, {Hora}, {Espacio}
        </small>
      </div>
      <Message severity="info" :closable="false" class="wa-hint">
        Los envíos se abren en la pestaña <strong>UDL WhatsApp</strong> (siempre la misma).
        Si ya tenés WhatsApp Web en otra pestaña, usá <strong>Copiar mensaje</strong> y pegá con Ctrl+V ahí.
      </Message>
    </div>
    <template #footer>
      <Button label="Cancelar" text @click="visible = false" />
      <Button
        label="Copiar mensaje"
        icon="pi pi-copy"
        severity="secondary"
        outlined
        :disabled="!mensajeLocal.trim()"
        @click="copiar"
      />
      <Button
        label="Abrir WhatsApp"
        icon="pi pi-whatsapp"
        severity="success"
        :disabled="!puedeAbrir"
        :loading="abriendo"
        @click="confirmar"
      />
    </template>
  </Dialog>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useToast } from 'primevue/usetoast'
import { validarTelefonoAR, openWhatsApp, copyWhatsAppMessage } from '@/utils/phone'
import Dialog from 'primevue/dialog'
import Button from 'primevue/button'
import Textarea from 'primevue/textarea'
import Tag from 'primevue/tag'
import Message from 'primevue/message'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  clienteNombre: { type: String, default: '' },
  telefono: { type: String, default: '' },
  tipo: { type: String, default: '' },
  mensaje: { type: String, default: '' },
  telefonoValido: { type: Boolean, default: true },
  telefonoError: { type: String, default: null }
})

const emit = defineEmits(['update:modelValue', 'confirmado'])
const toast = useToast()

const visible = computed({
  get: () => props.modelValue,
  set: (v) => emit('update:modelValue', v)
})

const mensajeLocal = ref('')
const abriendo = ref(false)

const tipoLabel = computed(() => ({
  Vencimiento: 'Vencimiento de pago',
  Reserva: 'Reserva próxima',
  Pedido: 'Estado de pedido'
}[props.tipo] || props.tipo))

const validacionLocal = computed(() => validarTelefonoAR(props.telefono))

const puedeAbrir = computed(() =>
  props.telefonoValido !== false &&
  validacionLocal.value.valido &&
  mensajeLocal.value.trim().length > 0
)

watch(() => props.modelValue, (open) => {
  if (open) mensajeLocal.value = props.mensaje || ''
})

watch(() => props.mensaje, (m) => {
  if (props.modelValue) mensajeLocal.value = m || ''
})

function onHide() {
  abriendo.value = false
}

async function copiar() {
  const ok = await copyWhatsAppMessage(mensajeLocal.value)
  toast.add({
    severity: ok ? 'success' : 'warn',
    summary: ok ? 'Copiado' : 'No se pudo copiar',
    detail: ok
      ? 'Pegá el mensaje en tu pestaña de WhatsApp Web (Ctrl+V).'
      : 'Copiá el texto manualmente desde el cuadro de mensaje.',
    life: 4000
  })
}

async function confirmar() {
  if (!puedeAbrir.value) return
  abriendo.value = true
  try {
    const ok = openWhatsApp(props.telefono, mensajeLocal.value)
    if (ok) emit('confirmado', { mensaje: mensajeLocal.value })
    visible.value = false
  } finally {
    abriendo.value = false
  }
}
</script>

<style scoped>
.wa-dialog__body {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding-top: 0.25rem;
}

.info-row {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
}

.info-row__label {
  font-size: 0.75rem;
  color: var(--text-color-secondary);
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.info-row__value {
  font-weight: 600;
  color: var(--text-color);
}

.field-label {
  display: block;
  font-weight: 500;
  margin-bottom: 0.5rem;
  color: var(--text-color);
}

.field-hint {
  display: block;
  margin-top: 0.5rem;
  font-size: 0.75rem;
  color: var(--text-color-secondary);
}

.wa-hint :deep(.p-message-text) {
  font-size: 0.8rem;
  line-height: 1.45;
}
</style>
