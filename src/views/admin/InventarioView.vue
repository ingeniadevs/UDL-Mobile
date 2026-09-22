<template>
  <div>
    <div class="flex align-items-center justify-content-between mb-4 flex-wrap gap-2">
      <h1 class="text-3xl font-bold m-0">Inventario</h1>
      <div class="flex gap-2">
        <Button label="Nueva Ubicación" icon="pi pi-map-marker" outlined size="small" @click="abrirNuevaUbicacion" />
        <Button label="Nuevo Artículo" icon="pi pi-plus" size="small" @click="abrirNuevoArticulo" />
      </div>
    </div>

    <!-- Stat cards -->
    <div class="grid mb-4">
      <div class="col-6 md:col-3">
        <div class="stat-card stat-total">
          <div class="stat-icon"><i class="pi pi-box"></i></div>
          <div class="stat-content">
            <span class="stat-value">{{ articulos.length }}</span>
            <span class="stat-label">Artículos</span>
          </div>
        </div>
      </div>
      <div class="col-6 md:col-3">
        <div class="stat-card stat-info">
          <div class="stat-icon"><i class="pi pi-map-marker"></i></div>
          <div class="stat-content">
            <span class="stat-value">{{ ubicaciones.length }}</span>
            <span class="stat-label">Ubicaciones</span>
          </div>
        </div>
      </div>
      <div class="col-6 md:col-3">
        <div class="stat-card stat-warning">
          <div class="stat-icon"><i class="pi pi-arrow-right-arrow-left"></i></div>
          <div class="stat-content">
            <span class="stat-value">{{ prestamosActivos.length }}</span>
            <span class="stat-label">En Préstamo</span>
          </div>
        </div>
      </div>
      <div class="col-6 md:col-3">
        <div class="stat-card stat-success">
          <div class="stat-icon"><i class="pi pi-chart-bar"></i></div>
          <div class="stat-content">
            <span class="stat-value">{{ articulos.reduce((s, a) => s + (a.stockActual || 0), 0) }}</span>
            <span class="stat-label">Stock Total</span>
          </div>
        </div>
      </div>
    </div>

    <TabView v-model:activeIndex="activeTab">
      <!-- ═══ DASHBOARD ═══ -->
      <TabPanel header="Préstamos Activos" leftIcon="pi pi-arrow-right-arrow-left">
        <div class="flex justify-content-end mb-3">
          <Button label="Registrar Préstamo" icon="pi pi-plus" size="small" @click="abrirNuevoPrestamo" />
        </div>
        <div v-if="loadingMovs" class="text-center py-4"><i class="pi pi-spin pi-spinner text-2xl" /></div>
        <div v-else-if="prestamosActivos.length === 0" class="text-center py-6 text-color-secondary">
          <i class="pi pi-check-circle text-4xl mb-3 block text-green-400"></i>
          No hay artículos en préstamo
        </div>
        <DataTable v-else :value="prestamosActivos" dataKey="id" stripedRows responsiveLayout="scroll" class="p-datatable-sm">
          <Column field="articuloNombre" header="Artículo" sortable />
          <Column header="Prestatario" style="min-width:160px">
            <template #body="{ data }">
              {{ data.nombrePrestatario || data.socioNombre || '—' }}
            </template>
          </Column>
          <Column field="cantidad" header="Cant." style="width:70px" />
          <Column header="Desde" style="width:140px">
            <template #body="{ data }">{{ formatDate(data.fechaMovimiento) }}</template>
          </Column>
          <Column header="Dev. esperada" style="width:140px">
            <template #body="{ data }">
              <span v-if="data.fechaDevolucionEsperada" :class="estaVencido(data.fechaDevolucionEsperada) ? 'text-red-400 font-bold' : ''">
                {{ formatDate(data.fechaDevolucionEsperada) }}
                <Tag v-if="estaVencido(data.fechaDevolucionEsperada)" value="Vencido" severity="danger" class="ml-1 text-xs" />
              </span>
              <span v-else class="text-color-secondary">Sin fecha</span>
            </template>
          </Column>
          <Column header="" style="width:100px">
            <template #body="{ data }">
              <Button label="Devolver" icon="pi pi-undo" size="small" severity="success" outlined @click="devolverPrestamo(data)" />
            </template>
          </Column>
          <template #empty><div class="text-center py-3 text-color-secondary">Sin préstamos activos</div></template>
        </DataTable>
      </TabPanel>

      <!-- ═══ POR UBICACIÓN ═══ -->
      <TabPanel header="Por Ubicación" leftIcon="pi pi-map-marker">
        <div v-if="loadingArticulos" class="text-center py-4"><i class="pi pi-spin pi-spinner text-2xl" /></div>
        <div v-else-if="ubicaciones.length === 0" class="text-center py-6 text-color-secondary">Sin ubicaciones registradas</div>
        <div v-else class="grid">
          <div v-for="ub in ubicaciones" :key="ub.id" class="col-12">
            <div class="ubicacion-card">
              <div class="ubicacion-card__header">
                <div class="flex align-items-center gap-3">
                  <i class="pi pi-map-marker text-xl text-primary"></i>
                  <div>
                    <span class="font-bold text-lg">{{ ub.nombre }}</span>
                    <Tag :value="tipoUbicacionLabel(ub.tipo)" severity="secondary" class="ml-2" />
                  </div>
                </div>
                <div class="flex align-items-center gap-2">
                  <Tag :value="`${articulosPorUbicacion(ub.id).length} artículos`" severity="info" />
                  <Button icon="pi pi-pencil" text rounded size="small" severity="info" @click="editarUbicacion(ub)" />
                  <Button icon="pi pi-trash" text rounded size="small" severity="danger" @click="confirmarEliminarUbicacion(ub)" />
                </div>
              </div>
              <DataTable v-if="articulosPorUbicacion(ub.id).length > 0"
                :value="articulosPorUbicacion(ub.id)" dataKey="id" class="p-datatable-sm mt-2" stripedRows>
                <Column field="codigo" header="Código" style="width:110px" />
                <Column field="nombre" header="Nombre" sortable />
                <Column field="categoria" header="Categoría" style="width:140px">
                  <template #body="{ data }"><Tag :value="categoriaLabel(data.categoria)" :severity="categoriaSeverity(data.categoria)" /></template>
                </Column>
                <Column header="Stock" style="width:120px">
                  <template #body="{ data }">
                    <span :class="data.stockActual === 0 ? 'text-red-400 font-bold' : ''">{{ data.stockActual }}</span>
                  </template>
                </Column>
                <Column header="" style="width:130px">
                  <template #body="{ data }">
                    <div class="flex gap-1">
                      <Button icon="pi pi-pencil" text rounded size="small" severity="info" @click="editarArticulo(data)" v-tooltip="'Editar'" />
                      <Button icon="pi pi-arrows-v" text rounded size="small" severity="success" @click="abrirMovimiento(data)" v-tooltip="'Movimiento'" />
                    </div>
                  </template>
                </Column>
              </DataTable>
              <div v-else class="text-color-secondary text-sm text-center py-2 mt-2">Sin artículos en esta ubicación</div>
            </div>
          </div>
        </div>
      </TabPanel>

      <!-- ═══ ARTÍCULOS ═══ -->
      <TabPanel header="Artículos" leftIcon="pi pi-box">
        <div class="flex gap-2 mb-3 flex-wrap">
          <InputText v-model="filtros.busqueda" placeholder="Buscar..." class="w-15rem" @input="buscarArticulos" />
          <Dropdown v-model="filtros.categoria" :options="categorias" optionLabel="label" optionValue="value" placeholder="Categoría" class="w-12rem" @change="buscarArticulos" showClear />
          <Dropdown v-model="filtros.ubicacionId" :options="ubicaciones" optionLabel="nombre" optionValue="id" placeholder="Ubicación" class="w-12rem" @change="buscarArticulos" showClear />
        </div>
        <DataTable :value="articulosFiltrados" :loading="loadingArticulos" paginator :rows="20"
          dataKey="id" stripedRows responsiveLayout="scroll" class="p-datatable-sm">
          <Column field="codigo" header="Código" sortable style="width:110px" />
          <Column field="nombre" header="Nombre" sortable />
          <Column field="categoria" header="Categoría" style="width:130px">
            <template #body="{ data }"><Tag :value="categoriaLabel(data.categoria)" :severity="categoriaSeverity(data.categoria)" /></template>
          </Column>
          <Column field="ubicacionNombre" header="Ubicación" style="width:140px" />
          <Column header="Stock" style="width:90px">
            <template #body="{ data }">
              <span :class="data.stockActual === 0 ? 'text-red-400 font-bold' : ''">{{ data.stockActual }}</span>
            </template>
          </Column>
          <Column header="Acciones" style="width:130px">
            <template #body="{ data }">
              <div class="flex gap-1">
                <Button icon="pi pi-pencil" text rounded size="small" severity="info" @click="editarArticulo(data)" v-tooltip="'Editar'" />
                <Button icon="pi pi-arrows-v" text rounded size="small" severity="success" @click="abrirMovimiento(data)" v-tooltip="'Registrar movimiento'" />
                <Button icon="pi pi-trash" text rounded size="small" severity="danger" @click="confirmarEliminar(data)" v-tooltip="'Eliminar'" />
              </div>
            </template>
          </Column>
          <template #empty><div class="text-center py-4 text-color-secondary">No se encontraron artículos</div></template>
        </DataTable>
      </TabPanel>

      <!-- ═══ MOVIMIENTOS ═══ -->
      <TabPanel header="Movimientos" leftIcon="pi pi-history">
        <div class="flex gap-2 mb-3 flex-wrap">
          <Dropdown v-model="filtrosMovs.tipo" :options="tiposMovimiento" optionLabel="label" optionValue="value" placeholder="Tipo" class="w-12rem" @change="cargarMovimientos" showClear />
          <Calendar v-model="filtrosMovs.desde" placeholder="Desde" dateFormat="dd/mm/yy" class="w-10rem" @date-select="cargarMovimientos" showButtonBar />
          <Calendar v-model="filtrosMovs.hasta" placeholder="Hasta" dateFormat="dd/mm/yy" class="w-10rem" @date-select="cargarMovimientos" showButtonBar />
          <Button icon="pi pi-refresh" text rounded @click="cargarMovimientos" v-tooltip="'Actualizar'" />
        </div>
        <DataTable :value="movimientos" :loading="loadingMovs" paginator :rows="20" dataKey="id" stripedRows responsiveLayout="scroll" class="p-datatable-sm">
          <Column header="Fecha" sortable style="width:150px">
            <template #body="{ data }">{{ formatDate(data.fechaMovimiento) }}</template>
          </Column>
          <Column header="Tipo" style="width:120px">
            <template #body="{ data }"><Tag :value="tipoMovLabel(data.tipo)" :severity="tipoMovSeverity(data.tipo)" /></template>
          </Column>
          <Column field="articuloNombre" header="Artículo" sortable />
          <Column field="cantidad" header="Cant." style="width:70px" />
          <Column header="Stock" style="width:130px">
            <template #body="{ data }">
              <span class="text-color-secondary">{{ data.stockAnterior }}</span>
              <i class="pi pi-arrow-right text-xs mx-1" />
              <span class="font-bold">{{ data.stockResultante }}</span>
            </template>
          </Column>
          <Column header="Prestatario / Motivo">
            <template #body="{ data }">
              <span v-if="data.nombrePrestatario" class="font-medium">{{ data.nombrePrestatario }}</span>
              <span v-else class="text-color-secondary">{{ data.motivo }}</span>
            </template>
          </Column>
          <Column header="Destino" style="width:130px">
            <template #body="{ data }">
              <span v-if="data.ubicacionDestinoNombre" class="text-sm">{{ data.ubicacionDestinoNombre }}</span>
              <span v-else class="text-color-secondary text-sm">—</span>
            </template>
          </Column>
          <template #empty><div class="text-center py-4 text-color-secondary">Sin movimientos</div></template>
        </DataTable>
      </TabPanel>
    </TabView>

    <!-- ══ DIALOG ARTÍCULO ══ -->
    <Dialog v-model:visible="dlgArticulo" :header="articuloEdit.id ? 'Editar Artículo' : 'Nuevo Artículo'"
      modal :style="{width:'600px'}" :draggable="false">
      <div class="grid pt-2">
        <div class="col-6 field"><label class="font-semibold">Código *</label>
          <InputText v-model="articuloEdit.codigo" class="w-full" :disabled="!!articuloEdit.id" /></div>
        <div class="col-6 field"><label class="font-semibold">Nombre *</label>
          <InputText v-model="articuloEdit.nombre" class="w-full" /></div>
        <div class="col-12 field"><label class="font-semibold">Descripción</label>
          <Textarea v-model="articuloEdit.descripcion" rows="2" class="w-full" autoResize /></div>
        <div class="col-6 field"><label class="font-semibold">Categoría *</label>
          <Dropdown v-model="articuloEdit.categoria" :options="categorias" optionLabel="label" optionValue="value" class="w-full" /></div>
        <div class="col-6 field"><label class="font-semibold">Ubicación *</label>
          <Dropdown v-model="articuloEdit.ubicacionId" :options="ubicaciones" optionLabel="nombre" optionValue="id" class="w-full" /></div>
        <div class="col-6 field"><label class="font-semibold">Stock Actual</label>
          <InputNumber v-model="articuloEdit.stockActual" class="w-full" :min="0" :disabled="!!articuloEdit.id" /></div>
        <div class="col-12 field"><label class="font-semibold">Observaciones</label>
          <Textarea v-model="articuloEdit.observaciones" rows="2" class="w-full" autoResize /></div>
        <div class="col-12 field flex align-items-center gap-2">
          <Checkbox v-model="articuloEdit.requiereMantenimiento" :binary="true" inputId="reqMant" />
          <label for="reqMant">Requiere mantenimiento periódico</label></div>
      </div>
      <template #footer>
        <Button label="Cancelar" text @click="dlgArticulo = false" />
        <Button :label="articuloEdit.id ? 'Guardar' : 'Crear'" :loading="guardando" @click="guardarArticulo" />
      </template>
    </Dialog>

    <!-- ══ DIALOG MOVIMIENTO ══ -->
    <Dialog v-model:visible="dlgMovimiento" header="Registrar Movimiento" modal :style="{width:'520px'}" :draggable="false">
      <div class="grid pt-2">
        <!-- Selector de tipo -->
        <div class="col-12 field">
          <label class="font-semibold">Tipo de movimiento *</label>
          <div class="flex flex-wrap gap-2 mt-1">
            <Button v-for="t in tiposMovimiento.filter(t => t.value !== 3)" :key="t.value"
              :label="t.label" :icon="tipoMovIcon(t.value)" size="small"
              :severity="movEdit.tipo === t.value ? undefined : 'secondary'"
              :outlined="movEdit.tipo !== t.value"
              @click="movEdit.tipo = t.value" />
          </div>
        </div>

        <!-- Devolución: seleccionar préstamo -->
        <template v-if="movEdit.tipo === 3">
          <div class="col-12 field">
            <label class="font-semibold">Préstamo a devolver *</label>
            <Dropdown v-model="movEdit.prestamoId" :options="prestamosActivos"
              optionLabel="articuloNombre" optionValue="id"
              placeholder="Seleccionar préstamo activo" class="w-full" filter>
              <template #option="{ option }">
                <div>
                  <span class="font-semibold">{{ option.articuloNombre }}</span>
                  <span class="text-color-secondary ml-2">— {{ option.nombrePrestatario || option.socioNombre }}</span>
                  <span class="text-xs text-color-secondary ml-2">({{ option.cantidad }} ud.)</span>
                </div>
              </template>
            </Dropdown>
          </div>
          <div class="col-6 field">
            <label class="font-semibold">Cantidad devuelta *</label>
            <InputNumber v-model="movEdit.cantidad" class="w-full" :min="1" />
          </div>
        </template>

        <!-- Otros tipos -->
        <template v-else>
          <div class="col-12 field">
            <label class="font-semibold">Artículo *</label>
            <Dropdown v-model="movEdit.articuloId" :options="articulos" optionLabel="nombre" optionValue="id"
              placeholder="Seleccionar artículo" class="w-full" filter
              :disabled="!!movEdit.articuloIdFijo" />
          </div>
          <div class="col-6 field">
            <label class="font-semibold">Cantidad *</label>
            <InputNumber v-model="movEdit.cantidad" class="w-full" :min="1" />
          </div>
          <!-- Préstamo: nombre libre -->
          <template v-if="movEdit.tipo === 2">
            <div class="col-6 field">
              <label class="font-semibold">Nombre del prestatario *</label>
              <InputText v-model="movEdit.nombrePrestatario" class="w-full" placeholder="Nombre y apellido" />
            </div>
            <div class="col-6 field">
              <label class="font-semibold">Devolución esperada</label>
              <Calendar v-model="movEdit.fechaDevolucionEsperada" dateFormat="dd/mm/yy" class="w-full" showButtonBar />
            </div>
          </template>
          <!-- Traslado: ubicación destino -->
          <div v-if="movEdit.tipo === 4" class="col-12 field">
            <label class="font-semibold">Ubicación destino *</label>
            <Dropdown v-model="movEdit.ubicacionDestinoId" :options="ubicaciones" optionLabel="nombre" optionValue="id"
              placeholder="Seleccionar ubicación" class="w-full" />
          </div>
          <!-- Entrada/Salida: motivo -->
          <div v-if="movEdit.tipo === 0 || movEdit.tipo === 1" class="col-12 field">
            <label class="font-semibold">Motivo</label>
            <InputText v-model="movEdit.motivo" class="w-full" :placeholder="movEdit.tipo === 0 ? 'Ej: Compra, Donación...' : 'Ej: Baja, Pérdida...'" />
          </div>
        </template>

        <div class="col-12 field">
          <label class="font-semibold">Observaciones</label>
          <Textarea v-model="movEdit.observaciones" rows="2" class="w-full" autoResize />
        </div>
      </div>
      <template #footer>
        <Button label="Cancelar" text @click="dlgMovimiento = false" />
        <Button label="Registrar" :loading="guardando" @click="guardarMovimiento" />
      </template>
    </Dialog>

    <!-- ══ DIALOG UBICACIÓN ══ -->
    <Dialog v-model:visible="dlgUbicacion" :header="ubicacionEdit.id ? 'Editar Ubicación' : 'Nueva Ubicación'"
      modal :style="{width:'440px'}" :draggable="false">
      <div class="grid pt-2">
        <div class="col-12 field"><label class="font-semibold">Nombre *</label>
          <InputText v-model="ubicacionEdit.nombre" class="w-full" /></div>
        <div class="col-12 field"><label class="font-semibold">Tipo *</label>
          <Dropdown v-model="ubicacionEdit.tipo" :options="tiposUbicacion" optionLabel="label" optionValue="value" class="w-full" /></div>
        <div class="col-12 field"><label class="font-semibold">Descripción</label>
          <Textarea v-model="ubicacionEdit.descripcion" rows="2" class="w-full" autoResize /></div>
      </div>
      <template #footer>
        <Button label="Cancelar" text @click="dlgUbicacion = false" />
        <Button :label="ubicacionEdit.id ? 'Guardar' : 'Crear'" :loading="guardando" @click="guardarUbicacion" />
      </template>
    </Dialog>

    <Toast />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useConfirm } from 'primevue/useconfirm'
import { useToast } from 'primevue/usetoast'
import * as inventarioService from '@/services/inventarioService'
import TabView from 'primevue/tabview'
import TabPanel from 'primevue/tabpanel'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import InputNumber from 'primevue/inputnumber'
import Textarea from 'primevue/textarea'
import Dropdown from 'primevue/dropdown'
import Calendar from 'primevue/calendar'
import Checkbox from 'primevue/checkbox'
import Tag from 'primevue/tag'
import Dialog from 'primevue/dialog'
import Toast from 'primevue/toast'

const confirm = useConfirm()
const toast = useToast()

const activeTab = ref(0)
const loadingArticulos = ref(false)
const loadingMovs = ref(false)
const guardando = ref(false)

const articulos = ref([])
const ubicaciones = ref([])
const movimientos = ref([])
const prestamosActivos = ref([])

const filtros = ref({ busqueda: '', categoria: null, ubicacionId: null })
const filtrosMovs = ref({ tipo: null, desde: null, hasta: null })

const dlgArticulo = ref(false)
const dlgMovimiento = ref(false)
const dlgUbicacion = ref(false)

function defaultArticulo() {
  return { id: null, codigo: '', nombre: '', descripcion: '', categoria: 0,
    marca: '', modelo: '', ubicacionId: null, stockActual: 0,
    stockMinimo: 0, stockMaximo: 100, unidadMedida: 'Unidad',
    valorCompra: null, valorActual: null, fechaVencimiento: null,
    estado: 0, condicion: 0, proveedor: '', observaciones: '',
    requiereMantenimiento: false, proximoMantenimiento: null }
}
function defaultMovimiento() {
  return { tipo: 0, articuloId: null, articuloIdFijo: false, cantidad: 1,
    motivo: '', observaciones: '', nombrePrestatario: '', fechaDevolucionEsperada: null,
    ubicacionDestinoId: null, prestamoId: null }
}
function defaultUbicacion() {
  return { id: null, nombre: '', descripcion: '', tipo: 0,
    direccionFisica: '', esDeposito: false, requiereAccesoEspecial: false, activa: true }
}

const articuloEdit = ref(defaultArticulo())
const movEdit = ref(defaultMovimiento())
const ubicacionEdit = ref(defaultUbicacion())

// ── Catalogs ──
const categorias = [
  { label: 'Material Deportivo', value: 0 },
  { label: 'Mobiliario', value: 1 },
  { label: 'Equip. Técnico', value: 2 },
  { label: 'Limpieza', value: 3 },
  { label: 'Seguridad', value: 4 },
  { label: 'Oficina', value: 5 },
  { label: 'Cocina', value: 6 },
  { label: 'Mantenimiento', value: 7 },
  { label: 'Material Médico', value: 8 },
  { label: 'Otros', value: 9 }
]
const tiposMovimiento = [
  { label: 'Entrada', value: 0 }, { label: 'Salida', value: 1 },
  { label: 'Préstamo', value: 2 }, { label: 'Devolución', value: 3 },
  { label: 'Traslado', value: 4 }
]
const tiposUbicacion = [
  { label: 'Depósito', value: 0 }, { label: 'Oficina', value: 1 },
  { label: 'Vestuario', value: 2 }, { label: 'Cancha', value: 3 },
  { label: 'Salón', value: 4 }, { label: 'Cocina', value: 5 },
  { label: 'Mantenimiento', value: 6 }, { label: 'Recepción', value: 8 },
  { label: 'Otro', value: 9 }
]

// ── Computed ──
const articulosFiltrados = computed(() => {
  return articulos.value.filter(a => {
    if (filtros.value.busqueda && !a.nombre?.toLowerCase().includes(filtros.value.busqueda.toLowerCase()) &&
        !a.codigo?.toLowerCase().includes(filtros.value.busqueda.toLowerCase())) return false
    if (filtros.value.categoria !== null && a.categoria !== filtros.value.categoria) return false
    if (filtros.value.ubicacionId && a.ubicacionId !== filtros.value.ubicacionId) return false
    return true
  })
})

const articulosPorUbicacion = (ubicacionId) =>
  articulos.value.filter(a => a.ubicacionId === ubicacionId)

// ── Formatters ──
const formatDate = (d) => d ? new Date(d).toLocaleDateString('es-AR', { day:'2-digit', month:'2-digit', year:'numeric' }) : '—'
const estaVencido = (fecha) => fecha && new Date(fecha) < new Date()

const categoriaLabel = (v) => categorias.find(c => c.value === v)?.label ?? v
const categoriaSeverity = (v) => ['info','success','secondary','warning','help','secondary','primary','secondary'][v] ?? 'secondary'
const tipoUbicacionLabel = (v) => tiposUbicacion.find(t => t.value === v)?.label ?? v
const tipoMovLabel = (v) => tiposMovimiento.find(t => t.value === v)?.label ?? v
const tipoMovIcon = (v) => (['pi pi-download','pi pi-upload','pi pi-arrow-right','pi pi-undo','pi pi-arrows-h'])[v] ?? 'pi pi-circle'
const tipoMovSeverity = (v) => (['success','danger','warning','info','secondary'])[v] ?? 'secondary'

// ── Data Loading ──
async function cargarArticulos() {
  loadingArticulos.value = true
  try {
    const res = await inventarioService.getArticulos({})
    articulos.value = res.items ?? res
  } finally { loadingArticulos.value = false }
}
async function cargarUbicaciones() {
  const res = await inventarioService.getUbicaciones({})
  ubicaciones.value = res.items ?? res
}
async function cargarMovimientos() {
  loadingMovs.value = true
  try {
    const params = {}
    if (filtrosMovs.value.tipo !== null) params.tipo = filtrosMovs.value.tipo
    if (filtrosMovs.value.desde) params.desde = filtrosMovs.value.desde.toISOString()
    if (filtrosMovs.value.hasta) params.hasta = filtrosMovs.value.hasta.toISOString()
    const res = await inventarioService.getMovimientos(params)
    movimientos.value = res.items ?? res
  } finally { loadingMovs.value = false }
}
async function cargarPrestamosActivos() {
  try {
    const res = await inventarioService.getMovimientos({ tipo: 3, tamanioPagina: 200 })
    const items = res.items ?? res
    prestamosActivos.value = items.filter(m => !m.devueltoEn)
  } catch { prestamosActivos.value = [] }
}

function buscarArticulos() { /* reactive via computed */ }

// ── Artículo CRUD ──
function abrirNuevoArticulo() { articuloEdit.value = defaultArticulo(); dlgArticulo.value = true }
function editarArticulo(art) { articuloEdit.value = { ...art }; dlgArticulo.value = true }
async function guardarArticulo() {
  if (!articuloEdit.value.nombre || !articuloEdit.value.codigo || !articuloEdit.value.ubicacionId) {
    toast.add({ severity: 'warn', summary: 'Completá los campos requeridos', life: 3000 }); return
  }
  guardando.value = true
  try {
    if (articuloEdit.value.id) await inventarioService.actualizarArticulo(articuloEdit.value.id, articuloEdit.value)
    else await inventarioService.crearArticulo(articuloEdit.value)
    toast.add({ severity: 'success', summary: articuloEdit.value.id ? 'Artículo actualizado' : 'Artículo creado', life: 3000 })
    dlgArticulo.value = false
    await Promise.all([cargarArticulos(), cargarPrestamosActivos()])
  } catch (e) {
    toast.add({ severity: 'error', summary: 'Error', detail: e.response?.data?.message ?? 'No se pudo guardar', life: 4000 })
  } finally { guardando.value = false }
}
function confirmarEliminar(art) {
  confirm.require({
    message: `¿Eliminar "${art.nombre}"?`, header: 'Confirmar', icon: 'pi pi-exclamation-triangle',
    acceptClass: 'p-button-danger', acceptLabel: 'Eliminar', rejectLabel: 'Cancelar',
    accept: async () => {
      try {
        await inventarioService.eliminarArticulo(art.id)
        toast.add({ severity: 'success', summary: 'Artículo eliminado', life: 3000 })
        await cargarArticulos()
      } catch (e) { toast.add({ severity: 'error', summary: 'Error', life: 3000 }) }
    }
  })
}

// ── Movimiento CRUD ──
function abrirMovimiento(art) {
  movEdit.value = { ...defaultMovimiento(), articuloId: art.id, articuloIdFijo: true }
  dlgMovimiento.value = true
}
function abrirNuevoPrestamo() {
  movEdit.value = { ...defaultMovimiento(), tipo: 2 }
  dlgMovimiento.value = true
}
async function guardarMovimiento() {
  guardando.value = true
  try {
    const m = movEdit.value
    if (m.tipo === 0) await inventarioService.registrarEntrada({ articuloId: m.articuloId, cantidad: m.cantidad, motivo: m.motivo || 'Entrada', observaciones: m.observaciones })
    else if (m.tipo === 1) await inventarioService.registrarSalida({ articuloId: m.articuloId, cantidad: m.cantidad, motivo: m.motivo || 'Salida', observaciones: m.observaciones })
    else if (m.tipo === 2) await inventarioService.registrarPrestamo({ articuloId: m.articuloId, cantidad: m.cantidad, nombrePrestatario: m.nombrePrestatario, observaciones: m.observaciones, fechaDevolucionEsperada: m.fechaDevolucionEsperada })
    else if (m.tipo === 3) await inventarioService.registrarDevolucion({ prestamoMovimientoId: m.prestamoId, cantidadDevuelta: m.cantidad, observaciones: m.observaciones })
    else if (m.tipo === 4) {
      const art = articulos.value.find(a => a.id === m.articuloId)
      await inventarioService.registrarTransferencia({ articuloId: m.articuloId, cantidad: m.cantidad, ubicacionOrigenId: art?.ubicacionId || '', ubicacionDestinoId: m.ubicacionDestinoId, motivo: m.motivo || 'Traslado', observaciones: m.observaciones })
    }
    toast.add({ severity: 'success', summary: 'Movimiento registrado', life: 3000 })
    dlgMovimiento.value = false
    await Promise.all([cargarArticulos(), cargarMovimientos(), cargarPrestamosActivos()])
  } catch (e) {
    toast.add({ severity: 'error', summary: 'Error', detail: e.response?.data?.message ?? 'No se pudo registrar', life: 4000 })
  } finally { guardando.value = false }
}
function devolverPrestamo(prestamo) {
  movEdit.value = { ...defaultMovimiento(), tipo: 3, prestamoId: prestamo.id, cantidad: prestamo.cantidad }
  dlgMovimiento.value = true
}

// ── Ubicación CRUD ──
function abrirNuevaUbicacion() { ubicacionEdit.value = defaultUbicacion(); dlgUbicacion.value = true }
function editarUbicacion(ub) { ubicacionEdit.value = { ...ub }; dlgUbicacion.value = true }
async function guardarUbicacion() {
  if (!ubicacionEdit.value.nombre) { toast.add({ severity: 'warn', summary: 'El nombre es requerido', life: 3000 }); return }
  guardando.value = true
  try {
    const payload = {
      id: ubicacionEdit.value.id,
      nombre: ubicacionEdit.value.nombre,
      descripcion: ubicacionEdit.value.descripcion || null,
      tipoUbicacion: ubicacionEdit.value.tipo,
      activa: ubicacionEdit.value.activa ?? true
    }
    if (ubicacionEdit.value.id) await inventarioService.actualizarUbicacion(ubicacionEdit.value.id, payload)
    else await inventarioService.crearUbicacion(payload)
    toast.add({ severity: 'success', summary: ubicacionEdit.value.id ? 'Ubicación actualizada' : 'Ubicación creada', life: 3000 })
    dlgUbicacion.value = false
    await cargarUbicaciones()
  } catch (e) {
    toast.add({ severity: 'error', summary: 'Error', detail: e.response?.data?.message ?? 'No se pudo guardar', life: 4000 })
  } finally { guardando.value = false }
}
function confirmarEliminarUbicacion(ub) {
  confirm.require({
    message: `¿Eliminar la ubicación "${ub.nombre}"?`, header: 'Confirmar', icon: 'pi pi-exclamation-triangle',
    acceptClass: 'p-button-danger', acceptLabel: 'Eliminar', rejectLabel: 'Cancelar',
    accept: async () => {
      try {
        await inventarioService.eliminarUbicacion(ub.id)
        toast.add({ severity: 'success', summary: 'Ubicación eliminada', life: 3000 })
        await cargarUbicaciones()
      } catch (e) { toast.add({ severity: 'error', summary: 'Error', detail: e.response?.data?.message ?? 'No se pudo eliminar', life: 3000 }) }
    }
  })
}

onMounted(() => Promise.all([cargarArticulos(), cargarUbicaciones(), cargarMovimientos(), cargarPrestamosActivos()]))
</script>

<style scoped>
.stat-card { display: flex; align-items: center; gap: 1rem; padding: 1.25rem; border-radius: 12px; background: var(--surface-card); border: 1px solid var(--surface-border); }
.stat-icon { width: 50px; height: 50px; border-radius: 12px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.stat-icon i { font-size: 1.5rem; color: white; }
.stat-total .stat-icon   { background: linear-gradient(135deg, #6366f1, #8b5cf6); }
.stat-success .stat-icon { background: linear-gradient(135deg, #22c55e, #16a34a); }
.stat-warning .stat-icon { background: linear-gradient(135deg, #f59e0b, #d97706); }
.stat-info .stat-icon    { background: linear-gradient(135deg, #3b82f6, #2563eb); }
.stat-content { display: flex; flex-direction: column; }
.stat-value { font-size: 1.75rem; font-weight: 700; color: var(--text-color); }
.stat-label { font-size: 0.85rem; color: var(--text-color-secondary); }

.ubicacion-card { background: var(--surface-card); border: 1px solid var(--surface-border); border-radius: 12px; padding: 1.25rem; margin-bottom: 0; }
.ubicacion-card__header { display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 0.5rem; }

.field { display: flex; flex-direction: column; gap: 0.3rem; }
</style>