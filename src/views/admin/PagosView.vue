<template>  <div>
    <PageHeader title="Pago de Cuotas">
      <template #actions>
        <Button label="Nuevo Pago en Efectivo" icon="pi pi-money-bill" severity="success" size="small" @click="openNewPagoEfectivo" />
        <Button label="Nuevo Pago" icon="pi pi-plus" size="small" @click="openNew" />
      </template>
    </PageHeader>

    <!-- Pagos esperando confirmación de efectivo -->
    <div v-if="pagosPendientesConfirmacion.length > 0" class="mb-4">
      <div class="card" style="border: 2px solid #f59e0b; background: var(--surface-overlay);">
        <div class="flex align-items-center justify-content-between mb-3">
          <div class="flex align-items-center gap-2">
            <i class="pi pi-clock text-2xl text-yellow-400"></i>
            <h3 class="text-xl font-bold text-yellow-400 m-0">Pagos esperando confirmación de efectivo</h3>
            <Tag :value="pagosPendientesConfirmacion.length.toString()" severity="warning" />
          </div>
          <Button 
            v-if="selectedPendingPagos.length > 0"
            :label="`Confirmar seleccionados (${selectedPendingPagos.length})`" 
            icon="pi pi-check" 
            severity="success"
            @click="confirmarMultiplesEfectivo"
            :loading="confirmandoMultiple"
          />
        </div>
        <div class="mobile-card-list">
          <MobileRecordCard
            v-for="item in pagosPendientesConfirmacion"
            :key="item.id"
            :title="item.socioNombre"
            :subtitle="item.concepto"
          >
            <template #tags>
              <Tag :severity="item.estado === 'vencido' ? 'danger' : 'warning'" :value="item.estado === 'vencido' ? 'Vencido' : 'Pendiente'" />
            </template>
            <template #body>
              <div class="record-card__row">
                <span class="record-card__label">Monto</span>
                <span class="record-card__value text-green-400 font-bold">${{ item.monto?.toLocaleString() }}</span>
              </div>
              <div class="record-card__row">
                <span class="record-card__label">Vencimiento</span>
                <span class="record-card__value">{{ formatDate(item.fechaVencimiento) }}</span>
              </div>
            </template>
            <template #actions>
              <Checkbox
                :modelValue="selectedPendingPagos.some(p => p.id === item.id)"
                :binary="true"
                @update:modelValue="val => togglePendingPago(item, val)"
              />
              <Button icon="pi pi-check" label="Confirmar" size="small" severity="success" @click="confirmarPagoEfectivoSingle(item)" :loading="procesandoPago === item.id" />
            </template>
          </MobileRecordCard>
        </div>
        <div v-if="selectedPendingPagos.length > 0" class="mt-3 p-3 border-round" style="background: rgba(245, 158, 11, 0.1)">
          <div class="flex justify-content-between align-items-center">
            <span class="text-gray-300">{{ selectedPendingPagos.length }} pago(s) seleccionado(s)</span>
            <span class="text-xl font-bold text-yellow-400">Total: ${{ totalSeleccionadoPendientes.toLocaleString() }}</span>
          </div>
        </div>
      </div>
    </div>    <!-- Stats Mejorados -->
    <div class="grid mb-4">
      <div class="col-12 md:col-3">
        <div class="stat-card-green">
          <div class="flex align-items-center gap-3">
            <div class="stat-icon-green">
              <i class="pi pi-check-circle text-2xl"></i>
            </div>
            <div>              <span class="block text-gray-400">Cuotas Pagadas</span>
              <span class="text-xl font-bold" style="color: var(--text-color)">{{ estadisticas.cantidadPagadas }}</span>
              <span class="block text-sm text-green-400">${{ estadisticas.totalPagado.toLocaleString() }}</span>
            </div>
          </div>
        </div>
      </div>
      <div class="col-12 md:col-3">
        <div class="stat-card-yellow">
          <div class="flex align-items-center gap-3">
            <div class="stat-icon-yellow">
              <i class="pi pi-clock text-2xl"></i>
            </div>
            <div>              <span class="block text-gray-400">Cuotas Pendientes</span>
              <span class="text-xl font-bold" style="color: var(--text-color)">{{ estadisticas.cantidadPendientes }}</span>
              <span class="block text-sm text-yellow-400">${{ estadisticas.totalPendiente.toLocaleString() }}</span>
            </div>
          </div>
        </div>
      </div>
      <div class="col-12 md:col-3">
        <div class="stat-card-red">
          <div class="flex align-items-center gap-3">
            <div class="stat-icon-red">
              <i class="pi pi-exclamation-circle text-2xl"></i>
            </div>
            <div>              <span class="block text-gray-400">Cuotas Vencidas</span>
              <span class="text-xl font-bold" style="color: var(--text-color)">{{ estadisticas.cantidadVencidas }}</span>
              <span class="block text-sm text-red-400">${{ estadisticas.totalVencido.toLocaleString() }}</span>
            </div>
          </div>
        </div>
      </div>
      <div class="col-12 md:col-3">
        <div class="stat-card-blue">
          <div class="flex align-items-center gap-3">
            <div class="stat-icon-blue">
              <i class="pi pi-building text-2xl"></i>
            </div>
            <div>              <span class="block text-gray-400">Pago por Mutual</span>
              <span class="text-xl font-bold" style="color: var(--text-color)">{{ estadisticas.cantidadMutual }}</span>
              <span class="block text-sm text-blue-400">${{ estadisticas.totalMutual.toLocaleString() }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="card mb-3">
      <div class="flex flex-column gap-3">
        <span class="p-input-icon-left w-full">
          <i class="pi pi-search" />
          <InputText v-model="searchTerm" placeholder="Buscar..." class="w-full" />
        </span>
        <div class="flex flex-wrap gap-2">
          <Dropdown v-model="socioFilter" :options="socios" optionLabel="nombre" optionValue="id" placeholder="Filtrar por socio" class="w-full" showClear filter />
          <Dropdown v-model="estadoFilter" :options="estadoOptions" optionLabel="label" optionValue="value" placeholder="Filtrar por estado" class="w-full" showClear />
        </div>
      </div>
    </div>

    <div v-if="loading" class="flex justify-content-center py-5">
      <ProgressSpinner />
    </div>
    <template v-else>
      <div v-if="pagosFiltrados.length === 0" class="card text-center py-5 text-color-secondary">
        No hay pagos para mostrar
      </div>
      <div v-else class="mobile-card-list">
        <MobileRecordCard
          v-for="item in paginatedPagos"
          :key="item.id"
          :title="item.socioNombre"
          :subtitle="item.concepto"
        >
          <template #tags>
            <Tag :severity="getEstadoSeverity(item.estado)" :value="item.estado" />
          </template>
          <template #body>
            <div class="record-card__row">
              <span class="record-card__label">Monto</span>
              <span class="record-card__value">${{ item.monto?.toLocaleString() }}</span>
            </div>
            <div class="record-card__row">
              <span class="record-card__label">Vencimiento</span>
              <span class="record-card__value">{{ formatDate(item.fechaVencimiento) }}</span>
            </div>
            <div class="record-card__row">
              <span class="record-card__label">Fecha pago</span>
              <span class="record-card__value">{{ item.fechaPago ? formatDate(item.fechaPago) : '—' }}</span>
            </div>
            <div v-if="item.metodoPago" class="mt-1">
              <Tag v-if="item.metodoPago === 'efectivo'" severity="info" value="Efectivo" />
              <Tag v-else-if="item.metodoPago === 'mercadopago'" severity="warning" value="MercadoPago" />
              <Tag v-else-if="item.metodoPago === 'mutual'" severity="success" icon="pi pi-building" value="Mutual" />
            </div>
          </template>
          <template #actions>
            <Button v-if="item.metodoPago === 'mutual'" icon="pi pi-file-pdf" label="Cupón" text rounded size="small" severity="help" @click="generarCupon(item)" v-tooltip.top="'Generar cupón de mutual'" />
            <Button v-if="item.estado === 'pendiente' || item.estado === 'vencido'" icon="pi pi-money-bill" text rounded size="small" severity="success" @click="confirmarPagoEfectivo(item)" v-tooltip.top="'Cobrar en efectivo'" :loading="procesandoPago === item.id" />
            <Button icon="pi pi-pencil" text rounded size="small" severity="info" @click="editPago(item)" v-tooltip.top="'Editar'" />
            <Button icon="pi pi-trash" text rounded size="small" severity="danger" @click="confirmDelete(item)" v-tooltip.top="'Eliminar'" />
          </template>
        </MobileRecordCard>
      </div>
      <MobilePaginator v-model:page="currentPage" :rows="10" :total="pagosFiltrados.length" />
    </template>    <!-- Create/Edit Dialog -->
    <Dialog 
      v-model:visible="pagoDialog" 
      :header="isEditing ? 'Editar Pago' : 'Nuevo Pago'" 
      :modal="true"
      :style="{ width: '560px' }"
    >
      <div class="flex flex-column gap-4 pt-3">        <div class="field" v-if="!isEditing">
          <label class="font-medium text-gray-300">Socio *</label>
          <!-- Socio seleccionado: chip con botón para cambiar -->
          <div v-if="pago.socioId" class="socio-seleccionado mb-2">
            <div class="flex align-items-center justify-content-between p-2 border-round" style="background: var(--surface-hover); border: 1px solid var(--primary-color);">
              <div class="flex align-items-center gap-2">
                <i class="pi pi-user text-primary-400"></i>
                <div>
                  <div class="font-semibold" style="color: var(--text-color)">{{ socios.find(s => s.id === pago.socioId)?.nombre }}</div>
                  <div class="text-xs text-gray-400">{{ socios.find(s => s.id === pago.socioId)?.email }}</div>
                </div>
              </div>
              <Button icon="pi pi-times" text rounded size="small" severity="secondary" @click="pago.socioId = null; socioSearch = ''" v-tooltip="'Cambiar socio'" />
            </div>
          </div>
          <!-- Selección de socio -->
          <div v-else>
            <span class="p-input-icon-left w-full mb-2">
              <i class="pi pi-search" />
              <InputText v-model="socioSearch" placeholder="Buscar socio por nombre o email..." class="w-full" />
            </span>
            <div
              class="mobile-card-list socio-selector-list"
              :class="{ 'p-invalid': submitted && !pago.socioId }"
            >
              <MobileRecordCard
                v-for="s in sociosFiltrados.slice(0, 8)"
                :key="s.id"
                :title="s.nombre"
                :subtitle="s.email"
                @click="onSocioSelect({ data: s })"
              >
                <template #tags>
                  <Tag :value="s.numeroSocio?.toString() || '-'" severity="info" />
                </template>
              </MobileRecordCard>
            </div>
            <p v-if="sociosFiltrados.length > 8" class="text-xs text-gray-400 mt-2 mb-0">
              Mostrando 8 de {{ sociosFiltrados.length }}. Refiná la búsqueda para ver más.
            </p>
          </div>
          <small v-if="submitted && !pago.socioId" class="p-error">Debe seleccionar un socio</small>
        </div>
        
        <div class="field">
          <label for="concepto" class="font-medium text-gray-300">Concepto *</label>
          <InputText id="concepto" v-model="pago.concepto" class="w-full" :class="{ 'p-invalid': submitted && !pago.concepto }" />
          <small v-if="submitted && !pago.concepto" class="p-error">El concepto es requerido</small>
        </div>        <div class="field">
          <label for="monto" class="font-medium text-gray-300">Monto *</label>
          <InputNumber id="monto" v-model="pago.monto" mode="currency" currency="ARS" locale="es-AR" class="w-full" />
        </div>

        <div class="field">
          <label for="vencimiento" class="font-medium text-gray-300">Fecha de Vencimiento *</label>
          <Calendar id="vencimiento" v-model="pago.fechaVencimiento" dateFormat="dd/mm/yy" class="w-full" showIcon />
        </div>

        <!-- Método de Pago -->
        <div class="field" v-if="!isEditing">
          <label class="font-medium text-gray-300 mb-2 block">Método de Pago</label>
          <div class="flex flex-column gap-2">
            <div class="flex align-items-center">
              <RadioButton v-model="pago.metodoPago" inputId="metodo-pendiente" value="pendiente" />
              <label for="metodo-pendiente" class="ml-2">Pendiente (sin método)</label>
            </div>
            <div class="flex align-items-center">
              <RadioButton v-model="pago.metodoPago" inputId="metodo-efectivo" value="efectivo" />
              <label for="metodo-efectivo" class="ml-2">Efectivo</label>
            </div>
            <div class="flex align-items-center">
              <RadioButton v-model="pago.metodoPago" inputId="metodo-mutual" value="mutual" />
              <label for="metodo-mutual" class="ml-2">Mutual</label>
            </div>
            <div class="flex align-items-center">
              <RadioButton v-model="pago.metodoPago" inputId="metodo-mercadopago" value="mercadopago" />
              <label for="metodo-mercadopago" class="ml-2">MercadoPago</label>
            </div>
          </div>
          <small class="text-gray-400 block mt-2">
            <i class="pi pi-info-circle"></i> 
            Si selecciona "Efectivo", el pago se marcará como pagado inmediatamente.
          </small>
        </div>

        <div class="field" v-if="isEditing">
          <label for="estado" class="font-medium text-gray-300">Estado</label>
          <Dropdown 
            id="estado"
            v-model="pago.estado" 
            :options="estadoOptions" 
            optionLabel="label" 
            optionValue="value"
            class="w-full"
          />
        </div>
      </div>

      <template #footer>
        <Button label="Cancelar" icon="pi pi-times" text @click="hideDialog" />
        <Button label="Guardar" icon="pi pi-check" @click="savePago" :loading="saving" />
      </template>
    </Dialog>    <!-- Generar Cupón Mutual Dialog -->
    <Dialog 
      v-model:visible="cuponDialog" 
      header="Cupón de Pago - Mutual" 
      :modal="true"
      :style="{ width: '600px' }"
    >
      <div v-if="cuponData" class="cupon-container p-4" ref="cuponRef">
        <!-- Encabezado -->
        <div class="text-center mb-4">
          <img src="/images/logo-udl.png" alt="UDL" style="width: 80px; margin: 0 auto;" />
          <h2 class="text-2xl font-bold mt-2 mb-0">UNIÓN DEPORTIVA LASPIUR</h2>
          <p class="text-gray-400 text-sm">Cupón de Pago - Mutual</p>
        </div>

        <!-- Datos del Socio -->
        <div class="grid mb-3">
          <div class="col-6">
            <div class="cupon-field">
              <label>Socio:</label>
              <span>{{ cuponData.socioNombre }}</span>
            </div>
          </div>
          <div class="col-6">
            <div class="cupon-field">
              <label>N° Socio:</label>
              <span>{{ cuponData.numeroSocio }}</span>
            </div>
          </div>
          <div class="col-6">
            <div class="cupon-field">
              <label>Concepto:</label>
              <span>{{ cuponData.concepto }}</span>
            </div>
          </div>
          <div class="col-6">
            <div class="cupon-field">
              <label>Vencimiento:</label>
              <span>{{ formatDate(cuponData.fechaVencimiento) }}</span>
            </div>
          </div>
        </div>

        <!-- Monto Destacado -->
        <div class="cupon-monto text-center p-4 mb-3">
          <span class="block text-gray-400 text-sm mb-1">MONTO A PAGAR</span>
          <span class="text-4xl font-bold text-primary-400">${{ cuponData.monto?.toLocaleString() }}</span>
        </div>

        <!-- Fecha de Emisión -->
        <div class="text-center text-gray-500 text-sm">
          <p class="mb-1">Fecha de Emisión: {{ new Date().toLocaleDateString('es-ES') }}</p>
          <p class="mb-0">Este cupón es válido únicamente para pago por mutual</p>
        </div>
      </div>

      <template #footer>
        <Button label="Cerrar" icon="pi pi-times" text @click="cuponDialog = false" />
        <Button label="Descargar PDF" icon="pi pi-file-pdf" severity="help" @click="descargarCupon" />
        <Button label="Imprimir" icon="pi pi-print" @click="imprimirCupon" />
      </template>
    </Dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useToast } from 'primevue/usetoast'
import { useConfirm } from 'primevue/useconfirm'
import { pagosService, sociosService } from '@/services'
import html2canvas from 'html2canvas'
import { Capacitor } from '@capacitor/core'
import { shareDataUrl } from '@/platform/files'
import Button from 'primevue/button'
import Checkbox from 'primevue/checkbox'
import ProgressSpinner from 'primevue/progressspinner'
import PageHeader from '@/components/mobile/PageHeader.vue'
import MobileRecordCard from '@/components/mobile/MobileRecordCard.vue'
import MobilePaginator from '@/components/mobile/MobilePaginator.vue'
import Dialog from 'primevue/dialog'
import InputText from 'primevue/inputtext'
import InputNumber from 'primevue/inputnumber'
import Dropdown from 'primevue/dropdown'
import Calendar from 'primevue/calendar'
import Tag from 'primevue/tag'
import RadioButton from 'primevue/radiobutton'

const toast = useToast()
const confirm = useConfirm()

const pagos = ref([])
const allPagos = ref([])
const socios = ref([])
const loading = ref(false)
const pagoDialog = ref(false)
const submitted = ref(false)
const saving = ref(false)
const isEditing = ref(false)
const estadoFilter = ref(null)
const socioFilter = ref(null)

const searchTerm = ref('')
const currentPage = ref(1)

const pagosFiltrados = computed(() => {
  let list = pagos.value
  if (searchTerm.value.trim()) {
    const q = searchTerm.value.toLowerCase()
    list = list.filter(p =>
      p.socioNombre?.toLowerCase().includes(q) ||
      p.concepto?.toLowerCase().includes(q)
    )
  }
  return list
})

const paginatedPagos = computed(() => {
  const start = (currentPage.value - 1) * 10
  return pagosFiltrados.value.slice(start, start + 10)
})

watch([searchTerm, estadoFilter, socioFilter], () => { currentPage.value = 1 })

function togglePendingPago(item, selected) {
  if (selected) {
    if (!selectedPendingPagos.value.some(p => p.id === item.id)) {
      selectedPendingPagos.value = [...selectedPendingPagos.value, item]
    }
  } else {
    selectedPendingPagos.value = selectedPendingPagos.value.filter(p => p.id !== item.id)
  }
}

// Pago en efectivo
const procesandoPago = ref(null)
const selectedPendingPagos = ref([])
const confirmandoMultiple = ref(false)

// Cupón de Mutual
const cuponDialog = ref(false)
const cuponData = ref(null)
const cuponRef = ref(null)

// Selector de socio en grilla
const socioSearch = ref('')
const sociosFiltrados = computed(() => {
  if (!socioSearch.value.trim()) return socios.value
  const q = socioSearch.value.toLowerCase()
  return socios.value.filter(s =>
    s.nombre?.toLowerCase().includes(q) ||
    s.email?.toLowerCase().includes(q) ||
    s.numeroSocio?.toString().includes(q)
  )
})

function onSocioSelect(event) {
  pago.value.socioId = event.data.id
  socioSearch.value = ''
}

const estadoOptions = [
  { label: 'Pendiente', value: 'pendiente' },
  { label: 'Pagado', value: 'pagado' },
  { label: 'Vencido', value: 'vencido' }
]

// Estadísticas mejoradas
const estadisticas = computed(() => {
  const stats = {
    cantidadPagadas: 0,
    cantidadPendientes: 0,
    cantidadVencidas: 0,
    cantidadMutual: 0,
    totalPagado: 0,
    totalPendiente: 0,
    totalVencido: 0,
    totalMutual: 0
  }
  
  allPagos.value.forEach(p => {
    const estado = p.estado?.toLowerCase()
    
    if (estado === 'pagado') {
      stats.cantidadPagadas++
      stats.totalPagado += p.monto || 0
    } else if (estado === 'pendiente') {
      stats.cantidadPendientes++
      stats.totalPendiente += p.monto || 0
    } else if (estado === 'vencido') {
      stats.cantidadVencidas++
      stats.totalVencido += p.monto || 0
    }
    
    // Contar pagos por mutual
    if (p.metodoPago === 'mutual') {
      stats.cantidadMutual++
      stats.totalMutual += p.monto || 0
    }
  })
  
  return stats
})

const totales = computed(() => {
  const result = { pagado: 0, pendiente: 0, vencido: 0 }
  allPagos.value.forEach(p => {
    const estado = p.estado?.toLowerCase()
    if (estado === 'pagado') result.pagado += p.monto
    else if (estado === 'pendiente') result.pendiente += p.monto
    else if (estado === 'vencido') result.vencido += p.monto
  })
  return result
})

const pagosPendientesConfirmacion = computed(() => {
  return allPagos.value.filter(p => p.pendienteConfirmacionEfectivo === true)
})

const totalSeleccionadoPendientes = computed(() => {
  return selectedPendingPagos.value.reduce((sum, p) => sum + (p.monto || 0), 0)
})

watch(estadoFilter, (val) => {
  applyFilters()
})

watch(socioFilter, (val) => {
  loadData()
})

function applyFilters() {
  let filtered = [...allPagos.value]
  
  if (estadoFilter.value) {
    filtered = filtered.filter(p => p.estado === estadoFilter.value)
  }
  
  pagos.value = filtered
}

function formatDate(date) {
  if (!date) return '-'
  return new Date(date).toLocaleDateString('es-ES')
}

function getEstadoSeverity(estado) {
  switch (estado?.toLowerCase()) {
    case 'pagado': return 'success'
    case 'pendiente': return 'warning'
    case 'vencido': return 'danger'
    default: return 'info'
  }
}

async function loadData() {
  loading.value = true
  try {
    const [pagosData, sociosData] = await Promise.all([
      pagosService.getAll(socioFilter.value),
      sociosService.getAll()
    ])
    allPagos.value = pagosData
    applyFilters()
    socios.value = sociosData
  } catch (error) {
    toast.add({ severity: 'error', summary: 'Error', detail: 'No se pudieron cargar los datos', life: 3000 })
  } finally {
    loading.value = false
  }
}

function openNew() {
  pago.value = { 
    monto: 0, 
    fechaVencimiento: new Date(),
    metodoPago: 'pendiente'
  }
  submitted.value = false
  isEditing.value = false
  socioSearch.value = ''
  pagoDialog.value = true
}

// Nueva función: Abrir dialog de pago en efectivo directo
function openNewPagoEfectivo() {
  pago.value = { 
    monto: 0, 
    fechaVencimiento: new Date(),
    metodoPago: 'efectivo'
  }
  submitted.value = false
  isEditing.value = false
  socioSearch.value = ''
  pagoDialog.value = true
}

function editPago(data) {
  pago.value = { 
    ...data,
    fechaVencimiento: new Date(data.fechaVencimiento)
  }
  isEditing.value = true
  submitted.value = false
  pagoDialog.value = true
}

function hideDialog() {
  pagoDialog.value = false
  submitted.value = false
}

async function savePago() {
  submitted.value = true

  if (!pago.value.concepto || !pago.value.monto) {
    return
  }

  if (!isEditing.value && !pago.value.socioId) {
    return
  }

  saving.value = true
  try {
    if (isEditing.value) {
      await pagosService.update(pago.value.id, {
        concepto: pago.value.concepto,
        monto: pago.value.monto,
        fechaVencimiento: pago.value.fechaVencimiento,
        estado: pago.value.estado
      })
      toast.add({ severity: 'success', summary: 'Éxito', detail: 'Pago actualizado', life: 3000 })
    } else {
      const pagoData = {
        socioId: pago.value.socioId,
        concepto: pago.value.concepto,
        monto: pago.value.monto,
        fechaVencimiento: pago.value.fechaVencimiento,
        metodoPago: pago.value.metodoPago || 'pendiente'
      }
      
      // Si es pago en efectivo, marcar como pagado inmediatamente
      if (pago.value.metodoPago === 'efectivo') {
        pagoData.estado = 'pagado'
        pagoData.fechaPago = new Date()
      }
      
      await pagosService.create(pagoData)
      
      if (pago.value.metodoPago === 'efectivo') {
        toast.add({ severity: 'success', summary: 'Pago registrado', detail: 'Pago en efectivo confirmado', life: 3000 })
      } else {
        toast.add({ severity: 'success', summary: 'Éxito', detail: 'Pago creado', life: 3000 })
      }
    }
    hideDialog()
    await loadData()
  } catch (error) {
    toast.add({ 
      severity: 'error', 
      summary: 'Error', 
      detail: error.response?.data?.message || 'Error al guardar el pago', 
      life: 3000 
    })
  } finally {
    saving.value = false
  }
}

function confirmDelete(data) {
  confirm.require({
    message: `¿Está seguro de eliminar el pago "${data.concepto}"?`,
    header: 'Confirmar eliminación',
    icon: 'pi pi-exclamation-triangle',
    acceptClass: 'p-button-danger',
    accept: async () => {
      try {
        await pagosService.delete(data.id)
        toast.add({ severity: 'success', summary: 'Éxito', detail: 'Pago eliminado', life: 3000 })
        await loadData()
      } catch (error) {
        toast.add({ severity: 'error', summary: 'Error', detail: 'No se pudo eliminar el pago', life: 3000 })
      }
    }
  })
}

function confirmarPagoEfectivo(data) {
  confirm.require({
    message: `¿Registrar pago en efectivo de $${data.monto?.toLocaleString()} por "${data.concepto}"?`,
    header: 'Confirmar pago en efectivo',
    icon: 'pi pi-money-bill',
    acceptClass: 'p-button-success',
    acceptLabel: 'Sí, cobrar',
    rejectLabel: 'Cancelar',
    accept: async () => {
      procesandoPago.value = data.id
      try {
        await pagosService.registrarPagoEfectivo(data.id)
        toast.add({ 
          severity: 'success', 
          summary: 'Pago registrado', 
          detail: `Se registró el pago en efectivo de $${data.monto?.toLocaleString()}`, 
          life: 3000 
        })
        await loadData()
      } catch (error) {
        toast.add({ 
          severity: 'error', 
          summary: 'Error', 
          detail: error.response?.data?.message || 'No se pudo registrar el pago', 
          life: 3000 
        })
      } finally {
        procesandoPago.value = null
      }
    }
  })
}

async function confirmarPagoEfectivoSingle(data) {
  procesandoPago.value = data.id
  try {
    await pagosService.confirmarPagosEfectivo([data.id])
    toast.add({ 
      severity: 'success', 
      summary: 'Pago confirmado', 
      detail: `Se confirmó el pago en efectivo de $${data.monto?.toLocaleString()}`, 
      life: 3000 
    })
    await loadData()
    selectedPendingPagos.value = []
  } catch (error) {
    toast.add({ 
      severity: 'error', 
      summary: 'Error', 
      detail: error.response?.data?.message || 'No se pudo confirmar el pago', 
      life: 3000 
    })
  } finally {
    procesandoPago.value = null
  }
}

async function confirmarMultiplesEfectivo() {
  if (selectedPendingPagos.value.length === 0) return
  
  confirmandoMultiple.value = true
  try {
    const pagoIds = selectedPendingPagos.value.map(p => p.id)
    const response = await pagosService.confirmarPagosEfectivo(pagoIds)
    toast.add({ 
      severity: 'success', 
      summary: 'Pagos confirmados', 
      detail: response.message || `Se confirmaron ${pagoIds.length} pago(s) en efectivo`, 
      life: 3000 
    })
    selectedPendingPagos.value = []
    await loadData()
  } catch (error) {
    toast.add({ 
      severity: 'error', 
      summary: 'Error', 
      detail: error.response?.data?.message || 'No se pudieron confirmar los pagos', 
      life: 3000 
    })
  } finally {
    confirmandoMultiple.value = false
  }
}

function openGenerarCuota() {
  cuotaData.value = {
    socioId: null,
    mes: new Date().getMonth() + 1,
    año: new Date().getFullYear(),
    fechaVencimiento: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 10)
  }
  cuotaTotal.value = null
  generarCuotaDialog.value = true
}

async function loadCuotaTotal() {
  if (!cuotaData.value.socioId) {
    cuotaTotal.value = null
    return
  }
  
  try {
    cuotaTotal.value = await pagosService.getCuotaTotal(cuotaData.value.socioId)
  } catch (error) {
    console.error('Error loading cuota total:', error)
    cuotaTotal.value = null
  }
}

async function generarCuota() {
  if (!cuotaData.value.socioId || !cuotaTotal.value) return
  
  generandoCuota.value = true
  try {
    await pagosService.generarCuotaMensual(cuotaData.value.socioId, {
      mes: cuotaData.value.mes,
      anio: cuotaData.value.año,
      fechaVencimiento: cuotaData.value.fechaVencimiento
    })
    toast.add({ 
      severity: 'success', 
      summary: 'Éxito', 
      detail: `Cuota generada por $${cuotaTotal.value.cuotaTotal.toLocaleString()}`, 
      life: 3000 
    })
    generarCuotaDialog.value = false
    await loadData()
  } catch (error) {
    toast.add({ 
      severity: 'error', 
      summary: 'Error', 
      detail: error.response?.data?.message || 'Error al generar la cuota', 
      life: 3000 
    })
  } finally {
    generandoCuota.value = false  }
}

// Funciones de cupón de mutual
function generarCupon(data) {
  cuponData.value = {
    socioNombre: data.socioNombre,
    numeroSocio: data.numeroSocio || 'N/A',
    concepto: data.concepto,
    monto: data.monto,
    fechaVencimiento: data.fechaVencimiento
  }
  cuponDialog.value = true
}

async function descargarCupon() {
  try {
    const element = cuponRef.value
    const canvas = await html2canvas(element, {
      backgroundColor: '#1a1a1a',
      scale: 2
    })
    
    await shareDataUrl(
      canvas.toDataURL('image/png'),
      `cupon-mutual-${cuponData.value.numeroSocio}.png`
    )
    
    toast.add({ 
      severity: 'success', 
      summary: 'Descargado', 
      detail: 'Cupón descargado correctamente', 
      life: 2000 
    })
  } catch (error) {
    console.error('Error al descargar cupón:', error)
    toast.add({ 
      severity: 'error', 
      summary: 'Error', 
      detail: 'No se pudo descargar el cupón', 
      life: 3000 
    })
  }
}

function imprimirCupon() {
  if (Capacitor.isNativePlatform()) {
    toast.add({
      severity: 'info',
      summary: 'Impresión',
      detail: 'Descargá el cupón y compartilo desde la app',
      life: 4000
    })
    return
  }
  window.print()
}

onMounted(() => {
  loadData()
})
</script>

<style scoped>
.stat-card-green,
.stat-card-yellow,
.stat-card-red,
.stat-card-blue {
  background: var(--surface-card);
  border: 1px solid var(--surface-border);
  border-radius: 12px;
  padding: 1.25rem;
}

.stat-card-green {
  border-left: 3px solid #22c55e;
}

.stat-card-yellow {
  border-left: 3px solid #f59e0b;
}

.stat-card-red {
  border-left: 3px solid #ef4444;
}

.stat-card-blue {
  border-left: 3px solid #3b82f6;
}

.stat-icon-green,
.stat-icon-yellow,
.stat-icon-red,
.stat-icon-blue {
  width: 2.5rem;
  height: 2.5rem;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.stat-icon-green {
  background: rgba(34, 197, 94, 0.2);
  color: #22c55e;
}

.stat-icon-yellow {
  background: rgba(245, 158, 11, 0.2);
  color: #f59e0b;
}

.stat-icon-red {
  background: rgba(239, 68, 68, 0.2);
  color: #ef4444;
}

.stat-icon-blue {
  background: rgba(59, 130, 246, 0.2);
  color: #3b82f6;
}

/* Estilos para cupón */
.cupon-container {
  background: var(--surface-ground);
  border: 2px solid var(--primary-color);
  border-radius: 12px;
}

.cupon-field {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.cupon-field label {
  font-size: 0.75rem;
  color: var(--text-color-secondary);
  text-transform: uppercase;
  font-weight: 600;
}

.cupon-field span {
  font-size: 1rem;
  color: var(--text-color);
  font-weight: 500;
}

.cupon-monto {
  background: rgba(var(--primary-400-rgb), 0.1);
  border: 2px dashed var(--primary-color);
  border-radius: 8px;
}

@media print {
  body * {
    visibility: hidden;
  }
  .cupon-container, .cupon-container * {
    visibility: visible;
  }
  .cupon-container {
    position: absolute;
    left: 0;
    top: 0;
    width: 100%;
  }
}

/* Grilla selector de socios */
.socio-selector-table :deep(.p-datatable-tbody > tr) {
  cursor: pointer;
}
.socio-selector-table :deep(.p-datatable-tbody > tr:hover > td) {
  background: var(--surface-hover) !important;
}
.socio-selector-table :deep(.p-datatable-header) {
  display: none;
}
.socio-selector-table.p-invalid :deep(.p-datatable-wrapper) {
  border: 1px solid var(--red-500);
  border-radius: 6px;
}
</style>
