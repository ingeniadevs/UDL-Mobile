<template>
  <div>
    <PageHeader title="Gestión de Pedidos">
      <template #actions>
        <Button label="Nuevo Pedido" icon="pi pi-plus" size="small" @click="openManualDialog" />
      </template>
    </PageHeader>

    <!-- Stat cards -->
    <div class="grid mb-4">
      <div class="col-6 md:col-3">
        <div class="stat-card stat-total">
          <div class="stat-icon"><i class="pi pi-shopping-cart"></i></div>
          <div class="stat-content">
            <span class="stat-value">{{ filteredPedidos.length }}</span>
            <span class="stat-label">Total Pedidos</span>
          </div>
        </div>
      </div>
      <div class="col-6 md:col-3">
        <div class="stat-card stat-warning">
          <div class="stat-icon"><i class="pi pi-clock"></i></div>
          <div class="stat-content">
            <span class="stat-value">{{ filteredPedidos.filter(p => p.estado === 'Pendiente').length }}</span>
            <span class="stat-label">Pendientes</span>
          </div>
        </div>
      </div>
      <div class="col-6 md:col-3">
        <div class="stat-card stat-info">
          <div class="stat-icon"><i class="pi pi-spin pi-cog"></i></div>
          <div class="stat-content">
            <span class="stat-value">{{ filteredPedidos.filter(p => ['Confirmado','EnPreparacion','Enviado'].includes(p.estado)).length }}</span>
            <span class="stat-label">En Proceso</span>
          </div>
        </div>
      </div>
      <div class="col-6 md:col-3">
        <div class="stat-card stat-success">
          <div class="stat-icon"><i class="pi pi-check-circle"></i></div>
          <div class="stat-content">
            <span class="stat-value">{{ filteredPedidos.filter(p => p.estado === 'Entregado').length }}</span>
            <span class="stat-label">Entregados</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Filtros -->
    <div class="card mb-4">
      <div class="flex flex-wrap align-items-center gap-3">
        <span class="p-input-icon-left">
          <i class="pi pi-search" />
          <InputText v-model="searchTerm" placeholder="Buscar por socio..." />
        </span>
        <Dropdown 
          v-model="selectedEstado" 
          :options="estadosOptions" 
          optionLabel="label"
          optionValue="value"
          placeholder="Todos los estados"
          showClear
        />
        <Dropdown 
          v-model="selectedEstadoPago" 
          :options="estadosPagoOptions" 
          optionLabel="label"
          optionValue="value"
          placeholder="Estado de pago"
          showClear
        />
      </div>
    </div>

    <div v-if="loading" class="flex justify-content-center py-5">
      <ProgressSpinner />
    </div>
    <template v-else>
      <div v-if="errorMessage" class="card text-center py-6">
        <i class="pi pi-exclamation-triangle text-4xl text-red-400 mb-3"></i>
        <p class="text-red-400 mb-3">{{ errorMessage }}</p>
        <Button label="Reintentar" icon="pi pi-refresh" @click="loadPedidos" />
      </div>
      <div v-else-if="filteredPedidos.length === 0" class="card text-center py-6">
        <i class="pi pi-shopping-cart text-4xl text-gray-400 mb-3"></i>
        <p class="text-gray-400">No hay pedidos para mostrar</p>
      </div>
      <div v-else class="mobile-card-list">
        <MobileRecordCard
          v-for="pedido in paginatedPedidos"
          :key="pedido.id"
          :title="pedido.nombreSocio"
          :subtitle="`Socio #${pedido.numeroSocio}`"
          @click="viewPedido(pedido)"
        >
          <template #leading>
            <Avatar :label="pedido.nombreSocio?.charAt(0)" shape="circle" class="avatar-red" size="small" />
          </template>
          <template #tags>
            <Tag :severity="getEstadoSeverity(pedido.estado)" :value="pedido.estado" />
            <Tag :severity="getEstadoPagoSeverity(pedido.estadoPago)" :value="pedido.estadoPago" />
          </template>
          <template #body>
            <div v-for="item in pedido.items" :key="item.id" class="text-xs mb-1">
              <span class="text-red-400 font-bold">{{ item.cantidad }}x</span>
              {{ item.nombreProducto }}
              <span v-if="item.talla" class="text-color-secondary">({{ item.talla }})</span>
            </div>
            <div class="record-card__row mt-2">
              <span class="record-card__label">Total</span>
              <span class="record-card__value font-bold text-red-400">${{ pedido.total.toLocaleString() }}</span>
            </div>
            <div v-if="pedido.metodoPago" class="record-card__row">
              <span class="record-card__label">Método</span>
              <span class="record-card__value">{{ pedido.metodoPago }}</span>
            </div>
            <div class="record-card__row">
              <span class="record-card__label">Fecha</span>
              <span class="record-card__value">{{ formatDate(pedido.fechaPedido) }}</span>
            </div>
          </template>
          <template #actions>
            <Button icon="pi pi-eye" text rounded size="small" @click="viewPedido(pedido)" v-tooltip.top="'Ver detalle'" />
            <Button icon="pi pi-pencil" text rounded size="small" severity="success" @click="editPedido(pedido)" v-tooltip.top="'Actualizar estado'" />
          </template>
        </MobileRecordCard>
      </div>
      <MobilePaginator v-model:page="pedidosPage" :rows="10" :total="filteredPedidos.length" />
    </template>

    <!-- Manual Order Dialog -->
    <Dialog
      v-model:visible="manualDialog"
      header="Nuevo Pedido Manual (Venta en Local)"
      :modal="true"
      :style="{ width: '700px' }"
    >
      <div class="flex flex-column gap-4 pt-3">
        <!-- Cliente -->
        <div class="grid">
          <div class="col-12">
            <label class="font-medium text-gray-300 block mb-2">Cliente *</label>
            <div class="flex gap-2">
              <div class="flex-1">
                <InputText
                  v-model="manualForm.nombreCliente"
                  placeholder="Nombre del cliente"
                  class="w-full"
                />
              </div>
              <div class="flex-1">
                <Dropdown
                  v-model="manualForm.socioSeleccionado"
                  :options="sociosLista"
                  optionLabel="label"
                  placeholder="Vincular a socio (opcional)"
                  showClear
                  filter
                  class="w-full"
                  @change="onSocioSelect"
                />
              </div>
            </div>
          </div>
        </div>

        <!-- Productos -->
        <div>
          <div class="flex align-items-center justify-content-between mb-2">
            <label class="font-medium text-gray-300 m-0">Productos *</label>
            <Button
              label="Agregar producto"
              icon="pi pi-plus"
              class="p-button-outlined p-button-sm p-button-secondary"
              @click="addManualItem"
            />
          </div>

          <Message
            v-if="manualProductsError"
            severity="error"
            :closable="false"
            class="mb-2"
          >
            {{ manualProductsError }}
          </Message>

          <div
            v-for="(item, index) in manualForm.items"
            :key="item._key"
            class="manual-item-row flex flex-column gap-2 mb-3 p-3 border-1 surface-border border-round"
          >
            <div class="flex align-items-center justify-content-between">
              <span class="text-sm font-medium text-color-secondary">Producto #{{ index + 1 }}</span>
              <Button
                v-if="manualForm.items.length > 1"
                icon="pi pi-trash"
                class="p-button-rounded p-button-danger p-button-text p-button-sm"
                v-tooltip.top="'Quitar producto'"
                @click="removeManualItem(index)"
              />
            </div>

            <div class="flex gap-2 align-items-start flex-wrap">
              <div class="flex-1" style="min-width: 200px">
                <Dropdown
                  v-model="item.productoId"
                  :options="productosActivos"
                  optionLabel="nombre"
                  optionValue="id"
                  placeholder="Seleccionar producto"
                  filter
                  class="w-full"
                  :class="{ 'p-invalid': manualShowErrors && !item.productoId }"
                  @update:modelValue="(val) => onProductoSelect(item, val)"
                />
                <small v-if="item.stock != null" class="text-color-secondary block mt-1">
                  Stock disponible{{ item.talla ? ` (talle ${item.talla})` : '' }}: {{ item.stock }}
                </small>
              </div>

              <InputNumber
                v-model="item.cantidad"
                :min="1"
                :max="item.stock || undefined"
                showButtons
                buttonLayout="horizontal"
                :inputStyle="{ width: '50px' }"
                incrementButtonIcon="pi pi-plus"
                decrementButtonIcon="pi pi-minus"
                :class="{ 'p-invalid': manualShowErrors && item.productoId && (!item.cantidad || item.cantidad < 1) }"
              />

              <Dropdown
                v-if="item.tallas && item.tallas.length > 0"
                v-model="item.talla"
                :options="item.tallas.map(t => ({ label: item.stocksPorTalla?.length ? `${t} (${item.stocksPorTalla.find(s => s.talla === t)?.cantidad ?? '?'})` : t, value: t }))"
                optionLabel="label"
                optionValue="value"
                placeholder="Talla"
                style="width: 130px"
                @update:modelValue="(talla) => { const st = item.stocksPorTalla?.find(s => s.talla === talla); if (st) { item.stock = st.cantidad; if (item.cantidad > item.stock) item.cantidad = item.stock || 1 } }"
              />

              <!-- Precio: editable si no hay socio vinculado -->
              <div class="flex flex-column align-items-end" style="min-width: 130px">
                <template v-if="!manualForm.socioSeleccionado">
                  <InputNumber
                    v-model="item.precio"
                    mode="currency"
                    currency="ARS"
                    locale="es-AR"
                    :min="0"
                    :inputStyle="{ width: '120px', textAlign: 'right' }"
                    v-tooltip.top="'Precio no-socio'"
                  />
                  <small class="text-orange-400" style="font-size:0.7rem">No socio</small>
                </template>
                <span v-else class="font-bold text-red-400 pt-2">
                  ${{ itemSubtotal(item).toLocaleString() }}
                </span>
              </div>
            </div>
          </div>

          <div class="text-right mt-2">
            <span class="text-sm text-color-secondary mr-2">
              {{ manualValidItems.length }} producto(s)
            </span>
            <span class="text-2xl font-bold text-red-400">Total: ${{ manualTotal.toLocaleString() }}</span>
          </div>
        </div>

        <!-- Pago -->
        <div class="grid">
          <div class="col-6 field">
            <label class="font-medium text-gray-300 block mb-2">Método de pago *</label>
            <Dropdown
              v-model="manualForm.metodoPago"
              :options="metodosPago"
              placeholder="Seleccionar método"
              class="w-full"
            />
          </div>
          <div class="col-6 field">
            <label class="font-medium text-gray-300 block mb-2">Estado del pago</label>
            <Dropdown
              v-model="manualForm.estadoPago"
              :options="estadosPagoManual"
              optionLabel="label"
              optionValue="value"
              class="w-full"
            />
          </div>
        </div>

        <Message v-if="manualForm.estadoPago === 'Pagado'" severity="success" :closable="false">
          <i class="pi pi-check-circle mr-2"></i>
          Se registrará un <strong>ingreso de ${{ manualTotal.toLocaleString() }}</strong> en movimientos contables.
        </Message>
        <Message v-else severity="warn" :closable="false">
          <i class="pi pi-clock mr-2"></i>
          El pago quedará <strong>pendiente</strong>. El ingreso se registrará cuando se confirme el cobro.
        </Message>

        <!-- Observaciones -->
        <div class="field">
          <label class="font-medium text-gray-300 block mb-2">Observaciones</label>
          <Textarea v-model="manualForm.observaciones" rows="2" class="w-full" placeholder="Notas adicionales..." />
        </div>
      </div>

      <template #footer>
        <Button label="Cancelar" icon="pi pi-times" text @click="manualDialog = false" />
        <Button
          label="Cargar Pedido"
          icon="pi pi-shopping-cart"
          @click="saveManual"
          :loading="savingManual"
          :disabled="!canSubmitManual"
        />
      </template>
    </Dialog>

    <!-- Detail Dialog -->
    <Dialog 
      v-model:visible="detailDialog" 
      header="Detalle del Pedido" 
      :modal="true"
      :style="{ width: '600px' }"
    >
      <div v-if="selectedPedido" class="pedido-detail">
        <div class="detail-section">
          <h4 class="detail-title">Información del Socio</h4>
          <div class="grid">
            <div class="col-6">
              <label>Nombre:</label>
              <p>{{ selectedPedido.nombreSocio }}</p>
            </div>
            <div class="col-6">
              <label>N° Socio:</label>
              <p>{{ selectedPedido.numeroSocio }}</p>
            </div>
            <div class="col-6">
              <label>Email:</label>
              <p>{{ selectedPedido.emailSocio }}</p>
            </div>
            <div class="col-6">
              <label>Teléfono:</label>
              <p>{{ selectedPedido.telefono || 'No registrado' }}</p>
            </div>
          </div>
        </div>

        <Divider />

        <div class="detail-section">
          <h4 class="detail-title">Productos</h4>
          <DataTable :value="selectedPedido.items" class="p-datatable-sm">
            <Column field="nombreProducto" header="Producto" />
            <Column field="talla" header="Talla" />
            <Column field="cantidad" header="Cant." style="width: 60px" />
            <Column header="Precio" style="width: 100px">
              <template #body="{ data }">
                ${{ data.precio.toLocaleString() }}
              </template>
            </Column>
            <Column header="Subtotal" style="width: 100px">
              <template #body="{ data }">
                ${{ data.subtotal.toLocaleString() }}
              </template>
            </Column>
          </DataTable>
          <div class="text-right mt-3">
            <span class="text-xl font-bold text-primary">Total: ${{ selectedPedido.total.toLocaleString() }}</span>
          </div>
        </div>

        <Divider />

        <div class="detail-section">
          <h4 class="detail-title">Estado del Pedido</h4>
          <div class="grid">
            <div class="col-6">
              <label>Estado:</label>
              <Tag :severity="getEstadoSeverity(selectedPedido.estado)" :value="selectedPedido.estado" />
            </div>
            <div class="col-6">
              <label>Pago:</label>
              <Tag :severity="getEstadoPagoSeverity(selectedPedido.estadoPago)" :value="selectedPedido.estadoPago" />
            </div>
            <div class="col-6">
              <label>Método de pago:</label>
              <p>{{ selectedPedido.metodoPago || 'No especificado' }}</p>
            </div>
            <div class="col-6">
              <label>Fecha Pedido:</label>
              <p>{{ formatDate(selectedPedido.fechaPedido) }}</p>
            </div>
            <div class="col-6">
              <label>Fecha Entrega:</label>
              <p>{{ selectedPedido.fechaEntrega ? formatDate(selectedPedido.fechaEntrega) : 'Sin definir' }}</p>
            </div>
          </div>
        </div>

        <div v-if="selectedPedido.observaciones" class="detail-section mt-3">
          <h4 class="detail-title">Observaciones</h4>
          <p class="text-gray-300">{{ selectedPedido.observaciones }}</p>
        </div>
      </div>
    </Dialog>

    <!-- Edit Estado Dialog -->
    <Dialog 
      v-model:visible="editDialog" 
      header="Actualizar Estado del Pedido" 
      :modal="true"
      :style="{ width: '450px' }"
    >
      <div v-if="selectedPedido" class="flex flex-column gap-4 pt-3">
        <div class="field">
          <label class="font-medium text-gray-300">Estado del Pedido *</label>
          <Dropdown 
            v-model="editForm.estado" 
            :options="estadosOptions" 
            optionLabel="label"
            optionValue="value"
            class="w-full"
          />
        </div>

        <div class="field">
          <label class="font-medium text-gray-300">Estado del Pago</label>
          <Dropdown 
            v-model="editForm.estadoPago" 
            :options="estadosPagoOptions" 
            optionLabel="label"
            optionValue="value"
            class="w-full"
          />
        </div>

        <div class="field">
          <label class="font-medium text-gray-300">Método de Pago</label>
          <Dropdown 
            v-model="editForm.metodoPago" 
            :options="metodosPago" 
            placeholder="Seleccionar método"
            class="w-full"
          />
        </div>

        <div class="field">
          <label class="font-medium text-gray-300">Fecha de Entrega</label>
          <Calendar 
            v-model="editForm.fechaEntrega" 
            dateFormat="dd/mm/yy"
            class="w-full"
            showIcon
          />
        </div>

        <div class="field">
          <label class="font-medium text-gray-300">Observaciones</label>
          <Textarea v-model="editForm.observaciones" rows="3" class="w-full" />
        </div>

        <Message v-if="editForm.estado === 'Confirmado' && selectedPedido.estado === 'Pendiente'" severity="warn" :closable="false">
          <i class="pi pi-exclamation-triangle mr-2"></i>
          Al confirmar el pedido se descontará el stock de los productos.
        </Message>
      </div>

      <template #footer>
        <Button label="Cancelar" icon="pi pi-times" text @click="editDialog = false" />
        <Button label="Guardar" icon="pi pi-check" @click="saveEstado" :loading="saving" />
      </template>
    </Dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useToast } from 'primevue/usetoast'
import { pedidosService, productosService, sociosService } from '@/services'
import { useMobilePagination } from '@/composables/useMobilePagination'
import PageHeader from '@/components/mobile/PageHeader.vue'
import MobileRecordCard from '@/components/mobile/MobileRecordCard.vue'
import MobilePaginator from '@/components/mobile/MobilePaginator.vue'
import InputText from 'primevue/inputtext'
import InputNumber from 'primevue/inputnumber'
import Dropdown from 'primevue/dropdown'
import Button from 'primevue/button'
import Tag from 'primevue/tag'
import Avatar from 'primevue/avatar'
import Dialog from 'primevue/dialog'
import Divider from 'primevue/divider'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Calendar from 'primevue/calendar'
import Textarea from 'primevue/textarea'
import Message from 'primevue/message'
import ProgressSpinner from 'primevue/progressspinner'

const toast = useToast()

const pedidos = ref([])
const loading = ref(false)
const errorMessage = ref('')
const searchTerm = ref('')
const selectedEstado = ref(null)
const selectedEstadoPago = ref(null)
const detailDialog = ref(false)
const editDialog = ref(false)
const selectedPedido = ref(null)
const saving = ref(false)

const editForm = ref({
  estado: '',
  estadoPago: '',
  metodoPago: '',
  fechaEntrega: null,
  observaciones: ''
})

const estadosOptions = [
  { label: 'Pendiente', value: 'Pendiente' },
  { label: 'Confirmado', value: 'Confirmado' },
  { label: 'En Preparación', value: 'EnPreparacion' },
  { label: 'Enviado', value: 'Enviado' },
  { label: 'Entregado', value: 'Entregado' },
  { label: 'Cancelado', value: 'Cancelado' }
]

const estadosPagoOptions = [
  { label: 'Pendiente', value: 'Pendiente' },
  { label: 'Pagado', value: 'Pagado' },
  { label: 'Vencido', value: 'Vencido' },
  { label: 'Cancelado', value: 'Cancelado' }
]

const estadosPagoManual = [
  { label: 'Pendiente (cobrar después)', value: 'Pendiente' },
  { label: 'Pagado (cobrado ahora)', value: 'Pagado' }
]

const metodosPago = ['Efectivo', 'Transferencia', 'MercadoPago']

// ── Manual order ──────────────────────────────────────────────────────────────
const manualDialog = ref(false)
const savingManual = ref(false)
const manualShowErrors = ref(false)
const manualProductsError = ref('')
const productos = ref([])
const socios = ref([])

let manualItemKey = 0
function newManualItem() {
  return {
    _key: ++manualItemKey,
    productoId: null,
    cantidad: 1,
    talla: null,
    tallas: [],
    precio: 0,
    stock: null,
    stocksPorTalla: []
  }
}

const productosActivos = computed(() => productos.value.filter(p => p.activo))
const sociosLista = computed(() =>
  socios.value.map(s => ({
    label: `${s.nombre} ${s.apellido} — #${s.numeroSocio}`,
    value: s.id,
    nombre: `${s.nombre} ${s.apellido}`.trim(),
    id: s.id
  }))
)

const defaultManualForm = () => ({
  nombreCliente: '',
  socioSeleccionado: null,
  metodoPago: 'Efectivo',
  estadoPago: 'Pagado',
  observaciones: '',
  items: [newManualItem()]
})

const manualForm = ref(defaultManualForm())

const manualValidItems = computed(() =>
  manualForm.value.items.filter(i => i.productoId && i.cantidad > 0)
)

const manualTotal = computed(() =>
  manualValidItems.value.reduce((sum, i) => sum + itemSubtotal(i), 0)
)

const canSubmitManual = computed(() =>
  manualForm.value.nombreCliente.trim().length > 0 &&
  !!manualForm.value.metodoPago &&
  manualValidItems.value.length > 0
)

function itemSubtotal(item) {
  return (item.precio || 0) * (item.cantidad || 1)
}

function openManualDialog() {
  manualForm.value = defaultManualForm()
  manualShowErrors.value = false
  manualProductsError.value = ''
  manualDialog.value = true
  if (productos.value.length === 0) loadProductos()
  if (socios.value.length === 0) loadSocios()
}

async function loadProductos() {
  try {
    const result = await productosService.getAll()
    productos.value = result || []
  } catch { /* silent */ }
}

async function loadSocios() {
  try {
    const result = await sociosService.getAll()
    socios.value = result || []
  } catch { /* silent */ }
}

function onSocioSelect(e) {
  const selected = e?.value ?? e
  const socioId = selected?.id ?? selected?.value
  const s = socios.value.find(x => x.id === socioId)
  if (s) manualForm.value.nombreCliente = `${s.nombre} ${s.apellido}`.trim()
}

function onProductoSelect(item, productoId) {
  item.productoId = productoId
  const prod = productos.value.find(p => p.id === productoId)
  if (prod) {
    item.precio = prod.precio
    item.stock = prod.stockTotal ?? prod.stock
    item.tallas = prod.tallas ? prod.tallas.split(',').map(t => t.trim()).filter(Boolean) : []
    item.talla = item.tallas.length > 0 ? item.tallas[0] : null
    item.stocksPorTalla = []
    if (item.cantidad > item.stock) item.cantidad = item.stock || 1

    // Cargar stocks por talla si tiene tallas
    if (item.tallas.length > 0) {
      productosService.getStocks(productoId)
        .then(stocks => {
          item.stocksPorTalla = stocks
          // Actualizar stock para la talla inicial
          if (item.talla) {
            const st = stocks.find(s => s.talla === item.talla)
            if (st) item.stock = st.cantidad
          }
          if (item.cantidad > item.stock) item.cantidad = item.stock || 1
        })
        .catch(() => {})
    }
  } else {
    item.precio = 0
    item.stock = null
    item.tallas = []
    item.talla = null
    item.stocksPorTalla = []
  }
  manualProductsError.value = ''
}

function addManualItem() {
  manualForm.value.items.push(newManualItem())
}

function removeManualItem(index) {
  if (manualForm.value.items.length > 1) {
    manualForm.value.items.splice(index, 1)
    manualProductsError.value = ''
  }
}

function validateManualProducts() {
  manualShowErrors.value = true
  manualProductsError.value = ''

  const validItems = manualValidItems.value
  if (validItems.length === 0) {
    manualProductsError.value = 'Debés asignar al menos un producto al pedido'
    return null
  }

  for (const item of validItems) {
    const prod = productos.value.find(p => p.id === item.productoId)
    const stock = prod ? (prod.stockTotal ?? prod.stock) : item.stock
    if (stock != null && item.cantidad > stock) {
      manualProductsError.value = `Stock insuficiente para "${prod?.nombre || 'producto'}". Disponible: ${stock}`
      return null
    }
  }

  return validItems
}

async function saveManual() {
  manualShowErrors.value = true

  if (!manualForm.value.nombreCliente.trim()) {
    toast.add({ severity: 'warn', summary: 'Atención', detail: 'Ingresá el nombre del cliente', life: 3000 })
    return
  }
  if (!manualForm.value.metodoPago) {
    toast.add({ severity: 'warn', summary: 'Atención', detail: 'Seleccioná un método de pago', life: 3000 })
    return
  }

  const validItems = validateManualProducts()
  if (!validItems) {
    toast.add({
      severity: 'warn',
      summary: 'Atención',
      detail: manualProductsError.value || 'Agregá al menos un producto',
      life: 4000
    })
    return
  }

  savingManual.value = true
  try {
    await pedidosService.createManual({
      nombreCliente: manualForm.value.nombreCliente.trim(),
      socioId: manualForm.value.socioSeleccionado?.id
        ?? manualForm.value.socioSeleccionado?.value
        ?? null,
      metodoPago: manualForm.value.metodoPago,
      estadoPago: manualForm.value.estadoPago,
      observaciones: manualForm.value.observaciones || null,
      items: validItems.map(i => ({
        productoId: i.productoId,
        cantidad: i.cantidad,
        talla: i.talla || null,
        // Enviar precio override solo cuando no hay socio vinculado
        precioOverride: !manualForm.value.socioSeleccionado && i.precio > 0 ? i.precio : null
      }))
    })

    const detail = manualForm.value.estadoPago === 'Pagado'
      ? `Pedido cargado y movimiento de ingreso registrado por $${manualTotal.value.toLocaleString()}`
      : 'Pedido cargado como pendiente de cobro'

    toast.add({ severity: 'success', summary: 'Pedido cargado', detail, life: 4000 })
    manualDialog.value = false
    await loadPedidos()
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: error.response?.data?.message || 'No se pudo cargar el pedido',
      life: 4000
    })
  } finally {
    savingManual.value = false
  }
}
// ─────────────────────────────────────────────────────────────────────────────

const filteredPedidos = computed(() => {
  return pedidos.value.filter(p => {
    if (searchTerm.value) {
      const search = searchTerm.value.toLowerCase()
      if (!p.nombreSocio.toLowerCase().includes(search) && 
          !p.numeroSocio.toLowerCase().includes(search)) {
        return false
      }
    }
    if (selectedEstado.value && p.estado !== selectedEstado.value) return false
    if (selectedEstadoPago.value && p.estadoPago !== selectedEstadoPago.value) return false
    return true
  })
})

const { page: pedidosPage, paginated: paginatedPedidos } = useMobilePagination(
  filteredPedidos,
  10,
  [searchTerm, selectedEstado, selectedEstadoPago]
)

function getEstadoSeverity(estado) {
  const map = {
    'Pendiente': 'warning',
    'Confirmado': 'info',
    'EnPreparacion': 'info',
    'Enviado': 'info',
    'Entregado': 'success',
    'Cancelado': 'danger'
  }
  return map[estado] || 'secondary'
}

function getEstadoPagoSeverity(estado) {
  const map = {
    'Pendiente': 'warning',
    'Pagado': 'success',
    'Vencido': 'danger',
    'Cancelado': 'danger'
  }
  return map[estado] || 'secondary'
}

function formatDate(date) {
  if (!date) return '-'
  return new Date(date).toLocaleDateString('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

async function loadPedidos() {
  loading.value = true
  errorMessage.value = ''
  try {
    const result = await pedidosService.getAll()
    pedidos.value = result || []
  } catch (error) {
    console.error('Error al cargar pedidos:', error)
    errorMessage.value = error.response?.data?.message || error.message || 'No se pudieron cargar los pedidos'
    toast.add({ 
      severity: 'error', 
      summary: 'Error', 
      detail: errorMessage.value, 
      life: 5000 
    })
  } finally {
    loading.value = false
  }
}

function viewPedido(pedido) {
  selectedPedido.value = pedido
  detailDialog.value = true
}

function editPedido(pedido) {
  selectedPedido.value = pedido
  editForm.value = {
    estado: pedido.estado,
    estadoPago: pedido.estadoPago,
    metodoPago: pedido.metodoPago || '',
    fechaEntrega: pedido.fechaEntrega ? new Date(pedido.fechaEntrega) : null,
    observaciones: pedido.observaciones || ''
  }
  editDialog.value = true
}

async function saveEstado() {
  saving.value = true
  try {
    await pedidosService.updateEstado(selectedPedido.value.id, {
      estado: editForm.value.estado,
      estadoPago: editForm.value.estadoPago || null,
      metodoPago: editForm.value.metodoPago || null,
      fechaEntrega: editForm.value.fechaEntrega?.toISOString() || null,
      observaciones: editForm.value.observaciones || null
    })
    
    toast.add({ severity: 'success', summary: 'Éxito', detail: 'Estado actualizado correctamente', life: 3000 })
    editDialog.value = false
    await loadPedidos()
  } catch (error) {
    toast.add({ 
      severity: 'error', 
      summary: 'Error', 
      detail: error.response?.data?.message || 'No se pudo actualizar el estado', 
      life: 3000 
    })
  } finally {
    saving.value = false
  }
}

onMounted(() => {
  loadPedidos()
})
</script>

<style scoped>
.stat-card {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1.25rem;
  border-radius: 12px;
  background: var(--surface-card);
  border: 1px solid var(--surface-border);
}
.stat-icon {
  width: 50px;
  height: 50px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.stat-icon i { font-size: 1.5rem; color: white; }
.stat-total .stat-icon   { background: linear-gradient(135deg, #6366f1, #8b5cf6); }
.stat-success .stat-icon { background: linear-gradient(135deg, #22c55e, #16a34a); }
.stat-warning .stat-icon { background: linear-gradient(135deg, #f59e0b, #d97706); }
.stat-info .stat-icon    { background: linear-gradient(135deg, #3b82f6, #2563eb); }
.stat-content { display: flex; flex-direction: column; }
.stat-value { font-size: 1.75rem; font-weight: 700; color: var(--text-color); }
.stat-label { font-size: 0.85rem; color: var(--text-color-secondary); }
.stat-amount { font-size: 0.75rem; color: var(--text-color-secondary); margin-top: 0.25rem; }

.avatar-red {
  background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%);
  color: white;
}

.detail-section {
  margin-bottom: 1rem;
}

.detail-title {
  color: #dc2626;
  font-size: 1rem;
  font-weight: 600;
  margin: 0 0 1rem 0;
}

.detail-section label {
  color: var(--text-color-secondary);
  font-size: 0.8rem;
  display: block;
  margin-bottom: 4px;
}

.detail-section p {
  color: var(--text-color);
  margin: 0;
}
</style>
