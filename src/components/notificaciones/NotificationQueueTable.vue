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
      <DataTable
        :value="filteredItems"
        :loading="loading"
        v-model:selection="selectionModel"
        :selection-mode="tipo !== 'Pedido' ? 'multiple' : undefined"
        dataKey="id"
        paginator
        :rows="10"
        :rowsPerPageOptions="[10, 25, 50]"
        responsiveLayout="scroll"
        stripedRows
        removableSort
        class="p-datatable-sm notif-datatable"
        :globalFilterFields="globalFields"
        v-model:filters="tableFilters"
      >
        <template #header>
          <div class="table-toolbar">
            <span class="table-toolbar__title">
              {{ filteredItems.length }} de {{ items.length }} registro(s)
            </span>
            <span class="p-input-icon-left search-box">
              <i class="pi pi-search" />
              <InputText v-model="globalSearch" placeholder="Búsqueda rápida..." />
            </span>
          </div>
        </template>

        <template #empty>
          <div class="empty-queue">
            <i class="pi pi-inbox" />
            <p>No hay notificaciones en cola</p>
            <small v-if="hasActiveFilters">Probá limpiar los filtros</small>
            <small v-else>Usá «Sincronizar cola» o esperá al proceso automático</small>
          </div>
        </template>

        <Column v-if="tipo !== 'Pedido'" selectionMode="multiple" headerStyle="width: 3rem" />

        <Column field="cliente" header="Cliente" sortable style="min-width: 140px" />
        <Column v-if="tipo === 'Vencimiento'" field="numeroSocio" header="N° Socio" sortable style="min-width: 90px" />
        <Column field="telefono" header="Teléfono" style="min-width: 120px">
          <template #body="{ data }">
            <span v-if="data.telefono">{{ data.telefono }}</span>
            <Tag v-else value="Sin teléfono" severity="warning" />
          </template>
        </Column>

        <Column v-if="tipo === 'Vencimiento'" field="fechaVencimiento" header="Vencimiento" sortable />
        <Column v-if="tipo === 'Vencimiento'" field="monto" header="Monto" sortable>
          <template #body="{ data }">
            <span class="monto-cell">${{ formatMonto(data.monto) }}</span>
          </template>
        </Column>
        <Column v-if="tipo === 'Vencimiento'" field="subTipo" header="Recordatorio">
          <template #body="{ data }">
            <Tag :value="subTipoVencLabel(data.subTipo)" severity="info" />
          </template>
        </Column>

        <Column v-if="tipo === 'Reserva'" field="fechaReserva" header="Fecha" sortable />
        <Column v-if="tipo === 'Reserva'" field="horaReserva" header="Hora" sortable />
        <Column v-if="tipo === 'Reserva'" field="estadoReserva" header="Reserva">
          <template #body="{ data }">
            <Tag :value="data.estadoReserva" severity="success" />
          </template>
        </Column>

        <Column v-if="pedidoMode" field="numeroPedido" header="N° Pedido" sortable />
        <Column v-if="pedidoMode" field="estadoAnterior" header="Antes" />
        <Column v-if="pedidoMode" field="estadoNuevo" header="Nuevo" />
        <Column v-if="pedidoMode" field="fechaCambio" header="Cambio" sortable />

        <Column field="estadoEnvio" header="Envío" sortable>
          <template #body="{ data }">
            <Tag :value="estadoEnvioLabel(data.estadoEnvio)" :severity="estadoSeverity(data.estadoEnvio)" />
          </template>
        </Column>
        <Column field="fechaUltimoEnvio" header="Último" sortable>
          <template #body="{ data }">
            {{ data.fechaUltimoEnvio || '—' }}
          </template>
        </Column>

        <Column header="Acciones" style="min-width: 11rem">
          <template #body="{ data }">
            <div class="action-btns">
              <Button
                v-if="data.puedeWhatsApp"
                icon="pi pi-whatsapp"
                rounded
                severity="success"
                v-tooltip.top="'Abrir WhatsApp'"
                @click="$emit('whatsapp', mapRow(data))"
              />
              <Button
                v-else
                icon="pi pi-whatsapp"
                rounded
                severity="secondary"
                disabled
                v-tooltip.top="data.telefonoError || 'Sin teléfono válido'"
              />
              <Button
                icon="pi pi-play"
                rounded
                text
                severity="info"
                v-tooltip.top="'Simular'"
                @click="$emit('simular', mapRow(data))"
              />
              <Button
                icon="pi pi-replay"
                rounded
                text
                v-tooltip.top="'Reintentar'"
                @click="$emit('reintentar', mapRow(data))"
              />
            </div>
          </template>
        </Column>
      </DataTable>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { FilterMatchMode } from 'primevue/api'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import Dropdown from 'primevue/dropdown'
import Calendar from 'primevue/calendar'
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

const tableFilters = ref({
  global: { value: null, matchMode: FilterMatchMode.CONTAINS }
})

const globalSearch = ref('')
let globalSearchTimer
watch(globalSearch, (value) => {
  clearTimeout(globalSearchTimer)
  globalSearchTimer = setTimeout(() => {
    tableFilters.value.global.value = value || null
  }, 300)
})

const hasActiveFilters = computed(() => {
  const f = localFilters.value
  return Boolean(
    (f.cliente && f.cliente.trim()) ||
    f.fecha ||
    f.estado
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

const globalFields = computed(() => {
  if (props.tipo === 'Vencimiento') return ['cliente', 'numeroSocio', 'telefono', 'fechaVencimiento']
  if (props.tipo === 'Reserva') return ['cliente', 'telefono', 'horaReserva', 'fechaReserva']
  return ['cliente', 'numeroPedido', 'estadoNuevo', 'estadoAnterior']
})

function clearFilters() {
  localFilters.value = { cliente: '', fecha: null, estado: null }
  globalSearch.value = ''
  tableFilters.value.global.value = null
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
