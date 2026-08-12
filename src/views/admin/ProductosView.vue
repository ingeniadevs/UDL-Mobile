<template>
  <div>
    <PageHeader title="Productos">
      <template #actions>
        <Button label="Reporte de Stock" icon="pi pi-chart-bar" outlined size="small" @click="abrirReporteStock" />
        <Button label="Nuevo Producto" icon="pi pi-plus" size="small" @click="openNew" />
      </template>
    </PageHeader>

    <!-- Stat cards -->
    <div class="grid mb-4">
      <div class="col-6 md:col-3">
        <div class="stat-card stat-total">
          <div class="stat-icon"><i class="pi pi-box"></i></div>
          <div class="stat-content">
            <span class="stat-value">{{ productos.length }}</span>
            <span class="stat-label">Total Productos</span>
          </div>
        </div>
      </div>
      <div class="col-6 md:col-3">
        <div class="stat-card stat-success">
          <div class="stat-icon"><i class="pi pi-check-circle"></i></div>
          <div class="stat-content">
            <span class="stat-value">{{ productos.filter(p => p.activo).length }}</span>
            <span class="stat-label">Activos</span>
          </div>
        </div>
      </div>
      <div class="col-6 md:col-3">
        <div class="stat-card stat-danger">
          <div class="stat-icon"><i class="pi pi-exclamation-circle"></i></div>
          <div class="stat-content">
            <span class="stat-value">{{ productos.filter(p => p.stock === 0 && p.activo).length }}</span>
            <span class="stat-label">Sin Stock</span>
          </div>
        </div>
      </div>
      <div class="col-6 md:col-3">
        <div class="stat-card stat-warning">
          <div class="stat-icon"><i class="pi pi-star"></i></div>
          <div class="stat-content">
            <span class="stat-value">{{ productos.filter(p => p.destacado).length }}</span>
            <span class="stat-label">Destacados</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Filtros y Búsqueda -->
    <div class="card mb-4">
      <div class="flex flex-wrap align-items-center gap-3">
        <span class="p-input-icon-left" style="min-width: 260px">
          <i class="pi pi-search" />
          <InputText v-model="searchTerm" placeholder="Buscar productos..." />
        </span>
        <Dropdown 
          v-model="selectedCategory" 
          :options="categorias" 
          placeholder="Todas las categorías"
          showClear
          style="min-width: 180px"
        />
        <Dropdown 
          v-model="selectedStatus" 
          :options="estadoOptions" 
          optionLabel="label"
          optionValue="value"
          placeholder="Todos los estados"
          showClear
          style="min-width: 160px"
        />
        <div class="flex align-items-center gap-2">
          <Checkbox v-model="soloDestacados" binary inputId="destacados" />
          <label for="destacados" class="text-gray-300">Solo destacados</label>
        </div>
      </div>
    </div>

    <!-- Products Grid -->
    <div v-if="loading" class="flex justify-content-center p-5">
      <ProgressSpinner />
    </div>

    <div v-else-if="filteredProducts.length === 0" class="card text-center py-6">
      <i class="pi pi-box text-4xl text-gray-400 mb-3"></i>
      <p class="text-gray-400 mb-3">No se encontraron productos</p>
      <Button label="Crear primer producto" icon="pi pi-plus" @click="openNew" />
    </div>

    <div v-else class="mobile-card-list">
      <MobileRecordCard
        v-for="prod in paginatedProductos"
        :key="prod.id"
        :title="prod.nombre"
        :subtitle="prod.descripcion || 'Sin descripción'"
        :class="{ 'product-card-inactive': !prod.activo }"
      >
        <template #leading>
          <div class="product-thumb">
            <img
              v-if="prod.imagenes?.length || prod.imagen"
              :src="prod.imagenes?.[0] ?? prod.imagen"
              :alt="prod.nombre"
            />
            <div v-else class="product-thumb-placeholder">
              <i class="pi pi-image"></i>
            </div>
            <span v-if="(prod.imagenes?.length || 0) > 1" class="product-thumb-count">
              {{ prod.imagenes.length }}
            </span>
          </div>
        </template>
        <template #tags>
          <Tag v-if="prod.destacado" severity="warning" value="★ Destacado" />
          <Tag v-if="!prod.activo" severity="danger" value="Inactivo" />
        </template>
        <template #body>
          <div class="record-card__row">
            <span class="record-card__label">Categoría</span>
            <Tag severity="secondary" :value="prod.categoria" />
          </div>
          <div class="record-card__row">
            <span class="record-card__label">Stock</span>
            <Tag
              :severity="prod.stock > 10 ? 'success' : prod.stock > 0 ? 'warning' : 'danger'"
              :value="String(prod.stock)"
            />
          </div>
          <div v-if="prod.tallas" class="record-card__row">
            <span class="record-card__label">Tallas</span>
            <span class="record-card__value">{{ prod.tallas }}</span>
          </div>
          <div v-if="prod.entregaDomicilio" class="record-card__row">
            <span class="record-card__label">Entrega</span>
            <span class="record-card__value">A domicilio</span>
          </div>
          <div class="record-card__row">
            <span class="record-card__label">Precio</span>
            <span class="record-card__value product-price-value">${{ prod.precio?.toLocaleString() }}</span>
          </div>
        </template>
        <template #actions>
          <Button
            label="Stock"
            icon="pi pi-chart-bar"
            class="p-button-sm p-button-outlined p-button-info"
            @click="openStockDialog(prod)"
            v-tooltip.top="'Gestionar stock por talle'"
          />
          <Button
            label="Editar"
            icon="pi pi-pencil"
            class="p-button-sm p-button-outlined"
            @click="editProducto(prod)"
          />
          <Button
            :icon="prod.activo ? 'pi pi-eye-slash' : 'pi pi-eye'"
            class="p-button-sm p-button-outlined"
            :class="prod.activo ? 'p-button-warning' : 'p-button-success'"
            @click="toggleActivo(prod)"
            v-tooltip.top="prod.activo ? 'Desactivar' : 'Activar'"
          />
          <Button
            icon="pi pi-trash"
            class="p-button-sm p-button-outlined p-button-danger"
            @click="confirmDelete(prod)"
            v-tooltip.top="'Eliminar'"
          />
        </template>
      </MobileRecordCard>
    </div>
    <MobilePaginator v-if="filteredProducts.length" v-model:page="productosPage" :rows="10" :total="filteredProducts.length" />

    <!-- Create/Edit Dialog -->
    <Dialog 
      v-model:visible="productoDialog" 
      :header="isEditing ? 'Editar Producto' : 'Nuevo Producto'" 
      :modal="true"
      :style="{ width: '550px' }"
    >
      <div class="flex flex-column gap-4 pt-3">
        <div class="field">
          <label for="nombre" class="font-medium text-gray-300">Nombre *</label>
          <InputText id="nombre" v-model="producto.nombre" class="w-full" :class="{ 'p-invalid': submitted && !producto.nombre }" />
          <small v-if="submitted && !producto.nombre" class="p-error">El nombre es requerido</small>
        </div>
        
        <div class="field">
          <label for="descripcion" class="font-medium text-gray-300">Descripción</label>
          <Textarea id="descripcion" v-model="producto.descripcion" rows="3" class="w-full" />
        </div>

        <div class="grid">
          <div class="col-6">
            <div class="field">
              <label for="precio" class="font-medium text-gray-300">Precio *</label>
              <InputNumber id="precio" v-model="producto.precio" mode="currency" currency="ARS" locale="es-AR" class="w-full" />
            </div>
          </div>
          <div class="col-6">
            <div class="field">
              <label for="stock" class="font-medium text-gray-300">Stock</label>
              <InputNumber id="stock" v-model="producto.stock" class="w-full" />
            </div>
          </div>
        </div>

        <div class="field">
          <label for="categoria" class="font-medium text-gray-300">Categoría *</label>
          <Dropdown 
            id="categoria"
            v-model="producto.categoria" 
            :options="categorias" 
            placeholder="Seleccione categoría"
            class="w-full"
            editable
          />
        </div>        <div class="field">
          <label for="tallas" class="font-medium text-gray-300">Tallas (separadas por coma)</label>
          <InputText id="tallas" v-model="producto.tallas" class="w-full" placeholder="S, M, L, XL" />
        </div>

        <div class="field">
          <label class="font-medium text-gray-300 mb-2 block">Imágenes del Producto <span class="text-gray-500 text-sm">(máx. 5)</span></label>
          <div class="flex flex-column gap-3">
            <div v-for="(img, idx) in producto.imagenes" :key="idx" class="flex align-items-start gap-2">
              <div class="flex-1">
                <ImageUpload
                  :modelValue="img"
                  @update:modelValue="v => producto.imagenes[idx] = v"
                  :placeholder="idx === 0 ? 'Imagen principal' : `Imagen ${idx + 1}`"
                />
              </div>
              <Button
                icon="pi pi-times"
                text rounded severity="danger" size="small"
                class="mt-2"
                v-tooltip.top="'Quitar'"
                @click="producto.imagenes.splice(idx, 1)"
              />
            </div>
            <Button
              v-if="producto.imagenes.length < 5"
              label="Agregar imagen" icon="pi pi-plus"
              text size="small" class="align-self-start"
              @click="producto.imagenes.push('')"
            />
          </div>
        </div>

        <div class="flex gap-4">
          <div class="field-checkbox">
            <Checkbox id="destacado" v-model="producto.destacado" binary />
            <label for="destacado" class="ml-2 text-gray-300">Destacado</label>
          </div>
          <div class="field-checkbox" v-if="isEditing">
            <Checkbox id="activo" v-model="producto.activo" binary />
            <label for="activo" class="ml-2 text-gray-300">Activo</label>
          </div>
          <div class="field-checkbox">
            <Checkbox id="entregaDomicilio" v-model="producto.entregaDomicilio" binary />
            <label for="entregaDomicilio" class="ml-2 text-gray-300">Permite entrega a domicilio</label>
          </div>
        </div>
      </div>      <template #footer>
        <Button label="Cancelar" icon="pi pi-times" text @click="hideDialog" />
        <Button label="Guardar" icon="pi pi-check" @click="saveProducto" :loading="saving" />
      </template>
    </Dialog>

    <!-- Stock Dialog -->
    <Dialog 
      v-model:visible="stockDialog" 
      header="Gestión de Stock por Talle" 
      :modal="true"
      :style="{ width: '700px' }"
    >
      <div v-if="selectedProducto" class="flex flex-column gap-3">
        <div class="flex align-items-center justify-content-between mb-3">
          <h4 class="m-0">{{ selectedProducto.nombre }}</h4>
          <Tag :value="`Stock Total: ${stockTotal}`" severity="info" />
        </div>

        <!-- Tabla de Stocks -->
        <DataTable 
          :value="stocksPorTalla" 
          editMode="cell" 
          @cell-edit-complete="onCellEditComplete"
          class="p-datatable-sm"
        >
          <Column field="talla" header="Talla" style="width: 30%">
            <template #body="{ data }">
              <Tag :value="data.talla" severity="secondary" />
            </template>
          </Column>
          
          <Column field="cantidad" header="Cantidad" style="width: 30%">
            <template #editor="{ data, field }">
              <InputNumber v-model="data[field]" :min="0" autofocus />
            </template>
            <template #body="{ data }">
              <div class="flex align-items-center gap-2">
                <i 
                  v-if="data.cantidad <= data.stockMinimo" 
                  class="pi pi-exclamation-triangle text-yellow-400"
                  v-tooltip="'Stock bajo'"
                ></i>
                <span :class="{ 'text-red-400 font-bold': data.cantidad === 0 }">
                  {{ data.cantidad }}
                </span>
              </div>
            </template>
          </Column>
          
          <Column field="stockMinimo" header="Stock Mínimo" style="width: 30%">
            <template #editor="{ data, field }">
              <InputNumber v-model="data[field]" :min="0" />
            </template>
          </Column>
          
          <Column style="width: 10%">
            <template #body="{ data }">
              <Button 
                icon="pi pi-trash" 
                class="p-button-rounded p-button-text p-button-danger p-button-sm"
                @click="confirmDeleteStock(data)"
                v-tooltip="'Eliminar talla'"
              />
            </template>
          </Column>
        </DataTable>

        <!-- Agregar nueva talla -->
        <div class="flex gap-2 mt-3">
          <InputText 
            v-model="nuevaTalla" 
            placeholder="Nueva talla (ej: XXL)" 
            class="flex-1"
            @keyup.enter="agregarTalla"
          />
          <Button 
            label="Agregar" 
            icon="pi pi-plus"
            @click="agregarTalla"
            :disabled="!nuevaTalla"
          />
        </div>

        <!-- Acciones rápidas -->
        <div class="flex gap-2 mt-2">
          <Button 
            label="Tallas Estándar" 
            icon="pi pi-list"
            class="p-button-sm p-button-outlined"
            @click="agregarTallasEstandar"
          />
          <Button 
            label="Resetear Todo" 
            icon="pi pi-refresh"
            class="p-button-sm p-button-outlined p-button-warning"
            @click="resetearStocks"
          />
        </div>
      </div>

      <template #footer>
        <Button label="Cancelar" icon="pi pi-times" text @click="stockDialog = false" />
        <Button label="Guardar Cambios" icon="pi pi-check" @click="saveStocks" :loading="savingStocks" />
      </template>
    </Dialog>

    <!-- Dialog Reporte de Stock -->
    <Dialog
      v-model:visible="reporteStockVisible"
      header="Reporte de Stock por Talle"
      :modal="true"
      :style="{ width: '90vw', maxWidth: '900px' }"
      :contentStyle="{ overflowX: 'auto' }"
    >
      <div class="flex justify-content-end mb-3">
        <Button label="Exportar Excel" icon="pi pi-file-excel" outlined @click="exportarReporteExcel" />
      </div>

      <div v-if="loadingReporte" class="flex justify-content-center py-4">
        <ProgressSpinner />
      </div>
      <div v-else class="mobile-card-list">
        <MobileRecordCard
          v-for="item in reporteStockData"
          :key="item.id || item.nombre"
          :title="item.nombre"
          :subtitle="item.categoria"
        >
          <template #tags>
            <Tag
              :severity="item.stockTotal > 10 ? 'success' : item.stockTotal > 0 ? 'warning' : 'danger'"
              :value="`Stock: ${item.stockTotal}`"
            />
          </template>
          <template #body>
            <div v-for="talle in tallesReporte" :key="talle" class="record-card__row">
              <span class="record-card__label">{{ talle }}</span>
              <span class="record-card__value" :class="(item.talles[talle] ?? 0) === 0 ? 'text-gray-400' : ''">
                {{ item.talles[talle] ?? 0 }}
              </span>
            </div>
          </template>
        </MobileRecordCard>
      </div>
    </Dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useToast } from 'primevue/usetoast'
import { useConfirm } from 'primevue/useconfirm'
import { productosService } from '@/services'
import { useMobilePagination } from '@/composables/useMobilePagination'
import PageHeader from '@/components/mobile/PageHeader.vue'
import MobileRecordCard from '@/components/mobile/MobileRecordCard.vue'
import MobilePaginator from '@/components/mobile/MobilePaginator.vue'
import Button from 'primevue/button'
import Dialog from 'primevue/dialog'
import InputText from 'primevue/inputtext'
import InputNumber from 'primevue/inputnumber'
import Dropdown from 'primevue/dropdown'
import Textarea from 'primevue/textarea'
import Checkbox from 'primevue/checkbox'
import Tag from 'primevue/tag'
import ProgressSpinner from 'primevue/progressspinner'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import ImageUpload from '@/components/shared/ImageUpload.vue'

const toast = useToast()
const confirm = useConfirm()

const productos = ref([])
const loading = ref(false)
const productoDialog = ref(false)
const submitted = ref(false)
const saving = ref(false)
const isEditing = ref(false)

// Stock management
const stockDialog = ref(false)
const selectedProducto = ref(null)
const stocksPorTalla = ref([])
const nuevaTalla = ref('')
const savingStocks = ref(false)

// Reporte de stock
const reporteStockVisible = ref(false)
const loadingReporte = ref(false)
const reporteStockData = ref([])
const tallesReporte = computed(() => {
  const set = new Set()
  reporteStockData.value.forEach(p => Object.keys(p.talles).forEach(t => set.add(t)))
  return Array.from(set).sort()
})

const producto = ref({})

// Filtros
const searchTerm = ref('')
const selectedCategory = ref(null)
const selectedStatus = ref(null)
const soloDestacados = ref(false)

const categorias = ['Indumentaria', 'Accesorios', 'Equipamiento', 'Merchandising', 'Otros']
const estadoOptions = [
  { label: 'Activos', value: true },
  { label: 'Inactivos', value: false }
]

const filteredProducts = computed(() => {
  return productos.value.filter(p => {
    if (searchTerm.value && !p.nombre.toLowerCase().includes(searchTerm.value.toLowerCase())) return false
    if (selectedCategory.value && p.categoria !== selectedCategory.value) return false
    if (selectedStatus.value !== null && p.activo !== selectedStatus.value) return false
    if (soloDestacados.value && !p.destacado) return false
    return true
  })
})

const { page: productosPage, paginated: paginatedProductos } = useMobilePagination(
  filteredProducts,
  10,
  [searchTerm, selectedCategory, selectedStatus, soloDestacados]
)

async function loadProductos() {
  loading.value = true
  try {
    productos.value = await productosService.getAll()
  } catch (error) {
    toast.add({ severity: 'error', summary: 'Error', detail: 'No se pudieron cargar los productos', life: 3000 })
  } finally {
    loading.value = false
  }
}

function openNew() {
  producto.value = { precio: 0, stock: 0, destacado: false, activo: true, entregaDomicilio: false, imagenes: [] }
  submitted.value = false
  isEditing.value = false
  productoDialog.value = true
}

function editProducto(data) {
  producto.value = { 
    ...data,
    imagenes: data.imagenes?.length ? [...data.imagenes] : (data.imagen ? [data.imagen] : [])
  }
  isEditing.value = true
  submitted.value = false
  productoDialog.value = true
}

function hideDialog() {
  productoDialog.value = false
  submitted.value = false
}

async function toggleActivo(prod) {
  try {
    await productosService.update(prod.id, {
      ...prod,
      activo: !prod.activo
    })
    prod.activo = !prod.activo
    toast.add({ 
      severity: 'success', 
      summary: 'Éxito', 
      detail: `Producto ${prod.activo ? 'activado' : 'desactivado'}`, 
      life: 3000 
    })
  } catch (error) {
    toast.add({ severity: 'error', summary: 'Error', detail: 'No se pudo actualizar el estado', life: 3000 })
  }
}

async function saveProducto() {
  submitted.value = true

  if (!producto.value.nombre || !producto.value.categoria) {
    return
  }

  saving.value = true
  try {
    if (isEditing.value) {
      await productosService.update(producto.value.id, {
        nombre: producto.value.nombre,
        descripcion: producto.value.descripcion,
        precio: producto.value.precio || 0,
        stock: producto.value.stock || 0,
        categoria: producto.value.categoria,
        imagenes: producto.value.imagenes?.filter(u => u) ?? [],
        tallas: producto.value.tallas,
        activo: producto.value.activo,
        destacado: producto.value.destacado,
        entregaDomicilio: producto.value.entregaDomicilio ?? false
      })
      toast.add({ severity: 'success', summary: 'Éxito', detail: 'Producto actualizado', life: 3000 })
    } else {
      await productosService.create({
        nombre: producto.value.nombre,
        descripcion: producto.value.descripcion,
        precio: producto.value.precio || 0,
        stock: producto.value.stock || 0,
        categoria: producto.value.categoria,
        imagenes: producto.value.imagenes?.filter(u => u) ?? [],
        tallas: producto.value.tallas,
        destacado: producto.value.destacado,
        entregaDomicilio: producto.value.entregaDomicilio ?? false
      })
      toast.add({ severity: 'success', summary: 'Éxito', detail: 'Producto creado', life: 3000 })
    }
    hideDialog()
    await loadProductos()
  } catch (error) {
    toast.add({ 
      severity: 'error', 
      summary: 'Error', 
      detail: error.response?.data?.message || 'Error al guardar el producto', 
      life: 3000 
    })
  } finally {
    saving.value = false
  }
}

function confirmDelete(data) {
  confirm.require({
    message: `¿Está seguro de eliminar el producto ${data.nombre}?`,
    header: 'Confirmar eliminación',
    icon: 'pi pi-exclamation-triangle',
    acceptClass: 'p-button-danger',
    accept: async () => {
      try {
        await productosService.delete(data.id)
        toast.add({ severity: 'success', summary: 'Éxito', detail: 'Producto eliminado', life: 3000 })
        await loadProductos()
      } catch (error) {
        toast.add({ severity: 'error', summary: 'Error', detail: 'No se pudo eliminar el producto', life: 3000 })
      }
    }
  })
}

// Stock management functions
const stockTotal = computed(() => {
  return stocksPorTalla.value.reduce((sum, s) => sum + s.cantidad, 0)
})

async function openStockDialog(producto) {
  selectedProducto.value = producto
  stockDialog.value = true
  await loadStocks(producto.id)
}

// Reporte de stock
async function abrirReporteStock() {
  reporteStockVisible.value = true
  loadingReporte.value = true
  try {
    const lista = await productosService.getAll()
    const rows = await Promise.all(
      lista.map(async (prod) => {
        let talles = {}
        try {
          const stocks = await productosService.getStocks(prod.id)
          stocks.forEach(s => { talles[s.talla] = s.cantidad })
        } catch { /* sin stocks detallados */ }
        return {
          nombre: prod.nombre,
          categoria: prod.categoria || '—',
          stockTotal: prod.stock ?? 0,
          talles
        }
      })
    )
    reporteStockData.value = rows
  } catch (error) {
    console.error('Error cargando reporte de stock:', error)
  } finally {
    loadingReporte.value = false
  }
}

async function exportarReporteExcel() {
  const { utils, writeFile } = await import('xlsx')

  const talles = Array.from(
    new Set(reporteStockData.value.flatMap(p => Object.keys(p.talles)))
  ).sort()

  const datos = reporteStockData.value.map(p => {
    const row = { Producto: p.nombre, Categoría: p.categoria, 'Stock Total': p.stockTotal }
    talles.forEach(t => { row[`Talle ${t}`] = p.talles[t] ?? 0 })
    return row
  })

  const ws = utils.json_to_sheet(datos)
  const wb = utils.book_new()
  utils.book_append_sheet(wb, ws, 'Stock')
  writeFile(wb, `reporte-stock-${new Date().toISOString().slice(0,10)}.xlsx`)
}

async function loadStocks(productoId) {
  try {
    const response = await productosService.getStocks(productoId)
    stocksPorTalla.value = response.map(s => ({ ...s })) // Clone para edición
    
    // Si no hay stocks, crear desde tallas existentes
    if (stocksPorTalla.value.length === 0 && selectedProducto.value.tallas) {
      const tallas = selectedProducto.value.tallas.split(',').map(t => t.trim())
      stocksPorTalla.value = tallas.map(talla => ({
        id: '',
        talla,
        cantidad: 0,
        stockMinimo: 5
      }))
    }
  } catch (error) {
    console.error('Error al cargar stocks:', error)
    toast.add({ severity: 'error', summary: 'Error', detail: 'No se pudo cargar el stock', life: 3000 })
  }
}

function agregarTalla() {
  if (!nuevaTalla.value.trim()) return
  
  const tallaExiste = stocksPorTalla.value.some(
    s => s.talla.toLowerCase() === nuevaTalla.value.trim().toLowerCase()
  )
  
  if (tallaExiste) {
    toast.add({ severity: 'warn', summary: 'Advertencia', detail: 'La talla ya existe', life: 3000 })
    return
  }
  
  stocksPorTalla.value.push({
    id: '',
    talla: nuevaTalla.value.trim().toUpperCase(),
    cantidad: 0,
    stockMinimo: 5
  })
  
  nuevaTalla.value = ''
}

function agregarTallasEstandar() {
  const tallasEstandar = ['XS', 'S', 'M', 'L', 'XL', 'XXL']
  
  tallasEstandar.forEach(talla => {
    const existe = stocksPorTalla.value.some(s => s.talla === talla)
    if (!existe) {
      stocksPorTalla.value.push({
        id: '',
        talla,
        cantidad: 0,
        stockMinimo: 5
      })
    }
  })
  
  toast.add({ severity: 'success', summary: 'Éxito', detail: 'Tallas estándar agregadas', life: 2000 })
}

function confirmDeleteStock(stock) {
  confirm.require({
    message: `¿Eliminar la talla ${stock.talla}?`,
    header: 'Confirmar eliminación',
    icon: 'pi pi-exclamation-triangle',
    acceptClass: 'p-button-danger',
    accept: () => {
      const index = stocksPorTalla.value.indexOf(stock)
      if (index > -1) {
        stocksPorTalla.value.splice(index, 1)
      }
    }
  })
}

function resetearStocks() {
  confirm.require({
    message: '¿Está seguro de resetear todos los stocks a 0?',
    header: 'Confirmar reset',
    icon: 'pi pi-exclamation-triangle',
    acceptClass: 'p-button-warning',
    accept: () => {
      stocksPorTalla.value.forEach(s => s.cantidad = 0)
    }
  })
}

function onCellEditComplete(event) {
  const { data, newValue, field } = event
  data[field] = newValue
}

async function saveStocks() {
  savingStocks.value = true
  try {
    // Convertir a formato esperado por el backend
    const stocksToSave = stocksPorTalla.value.map(s => ({
      talla: s.talla,
      cantidad: s.cantidad,
      stockMinimo: s.stockMinimo
    }))
    
    await productosService.updateStocks(selectedProducto.value.id, stocksToSave)
    toast.add({ severity: 'success', summary: 'Éxito', detail: 'Stocks actualizados', life: 3000 })
    stockDialog.value = false
    await loadProductos() // Recargar para actualizar stock total
  } catch (error) {
    toast.add({ 
      severity: 'error', 
      summary: 'Error', 
      detail: error.response?.data?.message || 'No se pudo actualizar el stock', 
      life: 3000 
    })
  } finally {
    savingStocks.value = false
  }
}

onMounted(() => {
  loadProductos()
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
.stat-danger .stat-icon  { background: linear-gradient(135deg, #ef4444, #dc2626); }
.stat-warning .stat-icon { background: linear-gradient(135deg, #f59e0b, #d97706); }
.stat-content { display: flex; flex-direction: column; }
.stat-value { font-size: 1.75rem; font-weight: 700; color: var(--text-color); }
.stat-label { font-size: 0.85rem; color: var(--text-color-secondary); }

.product-thumb {
  position: relative;
  width: 56px;
  height: 56px;
  border-radius: 10px;
  overflow: hidden;
  background: var(--surface-ground);
  flex-shrink: 0;
}

.product-thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.product-thumb-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.product-thumb-placeholder i {
  font-size: 1.25rem;
  color: #dc2626;
  opacity: 0.6;
}

.product-thumb-count {
  position: absolute;
  right: 2px;
  bottom: 2px;
  background: rgba(0, 0, 0, 0.7);
  color: #fff;
  font-size: 0.65rem;
  font-weight: 700;
  border-radius: 6px;
  padding: 0 4px;
  line-height: 1.4;
}

.product-card-inactive {
  opacity: 0.75;
}

.product-price-value {
  color: #dc2626;
  font-weight: 700;
}
</style>
