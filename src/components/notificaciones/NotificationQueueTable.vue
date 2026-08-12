<template>
  <div class="queue-table">
    <div class="card filters-card mb-3">
      <div class="grid align-items-end">
        <div class="col-12 md:col-4">
          <label class="field-label">Cliente</label>
          <InputText
            v-model="localFilters.cliente"
            placeholder="Nombre o N° socio"
            class="w-full"
          />
        </div>
        <div v-if="tipo !== 'Pedido'" class="col-12 md:col-3">
          <label class="field-label">Fecha</label>
          <Calendar
            v-model="localFilters.fecha"
            dateFormat="dd/mm/yy"
            showIcon
            showButtonBar
            class="w-full"
          />
        </div>
        <div class="col-12 md:col-3">
          <label class="field-label">Estado envío</label>
          <Dropdown
            v-model="localFilters.estado"
            :options="estadoOptions"
            optionLabel="label"
            optionValue="value"
            showClear
            placeholder="Todos"
            class="w-full"
          />
        </div>
        <div class="col-12 md:col-2 flex gap-2">
          <Button
            v-if="hasActiveFilters"
            label="Limpiar"
            icon="pi pi-filter-slash"
            severity="secondary"
            outlined
            class="flex-1"
            @click="clearFilters"
          />
          <Button
            v-if="tipo !== 'Pedido'"
            icon="pi pi-send"
            outlined
            v-tooltip.top="'Simular envío masivo'"
            :disabled="!selected?.length"
            @click="$emit('masivo')"
          />
        </div>
      </div>
    </div>

    <div class="card table-card">
      <div class="table-toolbar mb-3">
        <span class="table-toolbar__title">
          {{ filteredItems.length }} de {{ items.length }} registro(s)
        </span>
        <span class="p-input-icon-left search-box">
          <i class="pi pi-search" />
          <InputText v-model="globalSearch" placeholder="Búsqueda rápida..." />
        </span>
      </div>

      <div v-if="loading" class="flex justify-content-center py-5">
        <i class="pi pi-spin pi-spinner text-2xl text-gray-400"></i>
      </div>
      <div v-else-if="filteredItems.length === 0" class="empty-queue">
        <i class="pi pi-inbox" />
        <p>No hay notificaciones en cola</p>
        <small v-if="hasActiveFilters">Probá limpiar los filtros</small>
        <small v-else>Usá «Sincronizar cola» o esperá al proceso automático</small>
      </div>
      <template v-else>
        <div class="mobile-card-list">
          <MobileRecordCard
            v-for="item in paginatedItems"
            :key="item.id"
            :title="item.cliente"
            :subtitle="item.telefono || 'Sin teléfono'"
          >
            <template v-if="tipo !== 'Pedido'" #leading>
              <Checkbox
                :modelValue="isSelected(item)"
                :binary="true"
                @update:modelValue="toggleSelected(item, $event)"
              />
            </template>
            <template #tags>
              <Tag :value="estadoEnvioLabel(item.estadoEnvio)" :severity="estadoSeverity(item.estadoEnvio)" />
              <Tag v-if="!item.telefono" value="Sin teléfono" severity="warning" />
            </template>
            <template #body>
              <div v-if="tipo === 'Vencimiento'" class="record-card__row">
                <span class="record-card__label">N° Socio</span>
                <span class="record-card__value">{{ item.numeroSocio || '—' }}</span>
              </div>
              <div v-if="tipo === 'Vencimiento'" class="record-card__row">
                <span class="record-card__label">Vencimiento</span>
                <span class="record-card__value">{{ item.fechaVencimiento || '—' }}</span>
              </div>
              <div v-if="tipo === 'Vencimiento'" class="record-card__row">
                <span class="record-card__label">Monto</span>
                <span class="record-card__value monto-cell">${{ formatMonto(item.monto) }}</span>
              </div>
              <div v-if="tipo === 'Vencimiento'" class="record-card__row">
                <span class="record-card__label">Recordatorio</span>
                <Tag :value="subTipoVencLabel(item.subTipo)" severity="info" />
              </div>
              <div v-if="tipo === 'Reserva'" class="record-card__row">
                <span class="record-card__label">Fecha</span>
                <span class="record-card__value">{{ item.fechaReserva || '—' }}</span>
              </div>
              <div v-if="tipo === 'Reserva'" class="record-card__row">
                <span class="record-card__label">Hora</span>
                <span class="record-card__value">{{ item.horaReserva || '—' }}</span>
              </div>
              <div v-if="tipo === 'Reserva'" class="record-card__row">
                <span class="record-card__label">Reserva</span>
                <Tag :value="item.estadoReserva" severity="success" />
              </div>
              <div v-if="pedidoMode" class="record-card__row">
                <span class="record-card__label">N° Pedido</span>
                <span class="record-card__value">{{ item.numeroPedido || '—' }}</span>
              </div>
              <div v-if="pedidoMode" class="record-card__row">
                <span class="record-card__label">Cambio</span>
                <span class="record-card__value">{{ item.estadoAnterior }} → {{ item.estadoNuevo }}</span>
              </div>
              <div v-if="pedidoMode" class="record-card__row">
                <span class="record-card__label">Fecha</span>
                <span class="record-card__value">{{ item.fechaCambio || '—' }}</span>
              </div>
              <div class="record-card__row">
                <span class="record-card__label">Último envío</span>
                <span class="record-card__value">{{ item.fechaUltimoEnvio || '—' }}</span>
              </div>
            </template>
            <template #actions>
              <Button
                v-if="item.puedeWhatsApp"
                icon="pi pi-whatsapp"
                rounded
                severity="success"
                size="small"
                v-tooltip.top="'Abrir WhatsApp'"
                @click="$emit('whatsapp', mapRow(item))"
              />
              <Button
                v-else
                icon="pi pi-whatsapp"
                rounded
                severity="secondary"
                size="small"
                disabled
                v-tooltip.top="item.telefonoError || 'Sin teléfono válido'"
              />
              <Button
                icon="pi pi-play"
                rounded
                text
                severity="info"
                size="small"
                v-tooltip.top="'Simular'"
                @click="$emit('simular', mapRow(item))"
              />
              <Button
                icon="pi pi-replay"
                rounded
                text
                size="small"
                v-tooltip.top="'Reintentar'"
                @click="$emit('reintentar', mapRow(item))"
              />
            </template>
          </MobileRecordCard>
        </div>
        <MobilePaginator v-model:page="queuePage" :rows="10" :total="filteredItems.length" />
      </template>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useMobilePagination } from '@/composables/useMobilePagination'
import MobileRecordCard from '@/components/mobile/MobileRecordCard.vue'
import MobilePaginator from '@/components/mobile/MobilePaginator.vue'
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import Dropdown from 'primevue/dropdown'
import Calendar from 'primevue/calendar'
import Checkbox from 'primevue/checkbox'
import Tag from 'primevue/tag'

const props = defineProps({
  tipo: { type: String, required: true },
  items: { type: Array, default: () => [] },
  loading: { type: Boolean, default: false },
  estadoOptions: { type: Array, default: () => [] },
  selected: { type: Array, default: () => [] },
  pedidoMode: { type: Boolean, default: false }
})

const emit = defineEmits(['update:selected', 'whatsapp', 'simular', 'reintentar', 'masivo'])

const localFilters = ref({
  cliente: '',
  fecha: null,
  estado: null
})

const selectionModel = computed({
  get: () => props.selected,
  set: (v) => emit('update:selected', v)
})

const globalSearch = ref('')

const hasActiveFilters = computed(() => {
  const f = localFilters.value
  return Boolean(
    (f.cliente && f.cliente.trim()) ||
    f.fecha ||
    f.estado ||
    (globalSearch.value && globalSearch.value.trim())
  )
})

function parseItemDate(str) {
  if (!str) return null
  const m = String(str).trim().match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/)
  if (m) return new Date(Number(m[3]), Number(m[2]) - 1, Number(m[1]))
  const d = new Date(str)
  return Number.isNaN(d.getTime()) ? null : d
}

function isSameCalendarDay(a, b) {
  if (!a || !b) return false
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  )
}

const filteredItems = computed(() => {
  let rows = props.items || []
  const q = (localFilters.value.cliente || '').trim().toLowerCase()
  const globalQ = (globalSearch.value || '').trim().toLowerCase()

  if (q) {
    rows = rows.filter((r) => {
      const hay = [
        r.cliente,
        r.numeroSocio,
        r.numeroPedido,
        r.telefono
      ]
        .filter(Boolean)
        .map((s) => String(s).toLowerCase())
      return hay.some((s) => s.includes(q))
    })
  }

  if (globalQ) {
    rows = rows.filter((r) => {
      const hay = [
        r.cliente,
        r.numeroSocio,
        r.numeroPedido,
        r.telefono,
        r.fechaVencimiento,
        r.fechaReserva,
        r.horaReserva,
        r.estadoNuevo,
        r.estadoAnterior
      ]
        .filter(Boolean)
        .map((s) => String(s).toLowerCase())
      return hay.some((s) => s.includes(globalQ))
    })
  }

  if (localFilters.value.estado) {
    rows = rows.filter((r) => r.estadoEnvio === localFilters.value.estado)
  }

  if (localFilters.value.fecha && props.tipo !== 'Pedido') {
    const filterDay = localFilters.value.fecha
    rows = rows.filter((r) => {
      const raw = props.tipo === 'Vencimiento' ? r.fechaVencimiento : r.fechaReserva
      const itemDay = parseItemDate(raw)
      return itemDay && isSameCalendarDay(itemDay, filterDay)
    })
  }

  return rows
})

const { page: queuePage, paginated: paginatedItems } = useMobilePagination(
  filteredItems,
  10,
  [() => localFilters.value.cliente, () => localFilters.value.fecha, () => localFilters.value.estado, globalSearch]
)

function isSelected(item) {
  return (selectionModel.value || []).some((s) => s.id === item.id)
}

function toggleSelected(item, checked) {
  const current = selectionModel.value || []
  if (checked) {
    if (!isSelected(item)) selectionModel.value = [...current, item]
  } else {
    selectionModel.value = current.filter((s) => s.id !== item.id)
  }
}

function clearFilters() {
  localFilters.value = { cliente: '', fecha: null, estado: null }
  globalSearch.value = ''
}

function mapRow(data) {
  return {
    id: data.id,
    tipo: data.tipo,
    referenciaId: data.referenciaId,
    subTipo: data.subTipo,
    socioId: data.socioId,
    cliente: data.cliente,
    telefono: data.telefono,
    puedeWhatsApp: data.puedeWhatsApp,
    telefonoError: data.telefonoError
  }
}

function formatMonto(m) {
  if (m == null) return '0,00'
  return Number(m).toLocaleString('es-AR', { minimumFractionDigits: 2 })
}

function subTipoVencLabel(s) {
  return {
    Antes3Dias: '3 días antes',
    DiaVencimiento: 'Día del vencimiento',
    PosteriorVencimiento: 'Posterior'
  }[s] || s
}

function estadoEnvioLabel(e) {
  const labels = {
    Programado: 'En cola',
    WhatsAppAbierto: 'WhatsApp abierto'
  }
  return labels[e] || e
}

function estadoSeverity(e) {
  const map = {
    Pendiente: 'warn',
    Programado: 'info',
    Simulado: 'secondary',
    WhatsAppAbierto: 'success',
    Fallido: 'danger',
    Omitido: 'secondary'
  }
  return map[e] || 'info'
}
</script>

<style scoped>
.field-label {
  display: block;
  font-size: 0.8rem;
  font-weight: 500;
  color: var(--text-color-secondary);
  margin-bottom: 0.35rem;
}

.table-toolbar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  width: 100%;
}

.table-toolbar__title {
  font-size: 0.875rem;
  color: var(--text-color-secondary);
}

.search-box {
  min-width: 220px;
}

.search-box .p-inputtext {
  width: 100%;
  padding-left: 2.5rem;
}

.monto-cell {
  font-weight: 600;
  color: #4ade80;
}

.action-btns {
  display: flex;
  gap: 0.25rem;
  flex-wrap: nowrap;
}

.empty-queue {
  text-align: center;
  padding: 2.5rem 1rem;
  color: var(--text-color-secondary);
}

.empty-queue i {
  font-size: 2.5rem;
  opacity: 0.4;
  margin-bottom: 0.75rem;
  display: block;
}

.empty-queue p {
  margin: 0 0 0.25rem;
  font-weight: 500;
  color: var(--text-color);
}
</style>
