<template>
  <div class="disciplina-contabilidad-view">
    <BlockUI :blocked="blockUi" fullScreen />
    <PageHeader
      title="Contabilidad por Disciplina"
      subtitle="Libro independiente de ingresos y egresos por disciplina."
    >
      <template #actions>
        <Button label="Nuevo Movimiento" icon="pi pi-plus" size="small" @click="abrirFormulario" :disabled="!disciplinaSeleccionada" />
      </template>
    </PageHeader>

    <div class="card mb-4">
      <label class="block text-sm font-medium mb-2">Disciplina</label>
      <Dropdown
        v-model="disciplinaSeleccionada"
        :options="disciplinas"
        optionLabel="nombre"
        optionValue="id"
        placeholder="Seleccionar disciplina..."
        class="w-full md:w-30rem"
        filter
        :loading="loadingDisciplinas"
        :disabled="!isMaster && disciplinas.length === 1"
        @change="cargarDatos"
      />
    </div>

    <template v-if="disciplinaSeleccionada">
      <div class="grid mb-4">
        <div class="col-12 md:col-3">
          <div class="stat-card">
            <span class="block stat-label mb-2">Saldo acumulado</span>
            <div class="font-bold text-3xl" :class="saldoAcumulado >= 0 ? 'text-green-400' : 'text-red-400'">
              {{ saldoAcumulado >= 0 ? '+' : '' }}{{ formatCompactMoney(saldoAcumulado) }}
            </div>
          </div>
        </div>
        <div class="col-12 md:col-3">
          <div class="stat-card">
            <span class="block stat-label mb-2">Total Ingresos</span>
            <div class="stat-value text-green-400 font-bold text-3xl">{{ formatCompactMoney(resumen.totalIngresos) }}</div>
          </div>
        </div>
        <div class="col-12 md:col-3">
          <div class="stat-card">
            <span class="block stat-label mb-2">Total Egresos</span>
            <div class="stat-value text-red-400 font-bold text-3xl">{{ formatCompactMoney(resumen.totalEgresos) }}</div>
          </div>
        </div>
        <div class="col-12 md:col-3">
          <div class="stat-card">
            <span class="block stat-label mb-2">Saldo del período</span>
            <div class="font-bold text-3xl" :class="saldo >= 0 ? 'text-green-400' : 'text-red-400'">
              {{ saldo >= 0 ? '+' : '' }}{{ formatCompactMoney(saldo) }}
            </div>
          </div>
        </div>
      </div>

      <TabView>
        <TabPanel header="Movimientos" leftIcon="pi pi-list">
          <div class="card mb-4">
            <div class="grid align-items-end mobile-filters-grid">
              <div class="col-12 md:col-3">
                <label class="block text-sm mb-2">Desde</label>
                <Calendar v-model="filtros.fechaDesde" dateFormat="dd/mm/yy" showIcon class="w-full" />
              </div>
              <div class="col-12 md:col-3">
                <label class="block text-sm mb-2">Hasta</label>
                <Calendar v-model="filtros.fechaHasta" dateFormat="dd/mm/yy" showIcon class="w-full" />
              </div>
              <div class="col-12 md:col-3">
                <label class="block text-sm mb-2">Tipo</label>
                <Dropdown v-model="filtros.tipo" :options="tiposMovimiento" optionLabel="label" optionValue="value" placeholder="Todos" showClear class="w-full" />
              </div>
              <div class="col-12 md:col-3">
                <Button label="Limpiar filtros" icon="pi pi-filter-slash" outlined severity="secondary" class="w-full" size="small" @click="limpiarFiltros" />
              </div>
            </div>
          </div>

          <div class="card">
            <div v-if="loading" class="flex justify-content-center py-5">
              <i class="pi pi-spin pi-spinner text-2xl text-gray-400"></i>
            </div>
            <div v-else-if="movimientosFiltrados.length === 0" class="text-center py-5 text-gray-400">
              No hay movimientos para esta disciplina
            </div>
            <template v-else>
              <div class="mobile-card-list">
                <MobileRecordCard
                  v-for="mov in paginatedMovimientos"
                  :key="mov.id"
                  :title="mov.concepto"
                  :subtitle="formatFecha(mov.fecha)"
                >
                  <template #tags>
                    <Tag :severity="mov.tipo === 'ingreso' ? 'success' : 'danger'" :value="mov.tipo === 'ingreso' ? 'Ingreso' : 'Egreso'" />
                  </template>
                  <template #body>
                    <div class="record-card__row">
                      <span class="record-card__label">Socio</span>
                      <span class="record-card__value">{{ mov.socioNombre || '-' }}</span>
                    </div>
                    <div class="record-card__row">
                      <span class="record-card__label">Monto</span>
                      <span class="record-card__value font-bold" :class="mov.tipo === 'ingreso' ? 'text-green-400' : 'text-red-400'">
                        {{ mov.tipo === 'ingreso' ? '+' : '-' }}${{ mov.monto?.toLocaleString('es-AR') }}
                      </span>
                    </div>
                    <div class="record-card__row">
                      <span class="record-card__label">Origen</span>
                      <Tag v-if="mov.origenAutomatico" severity="info" value="Pago auto" class="text-xs" />
                      <span v-else class="text-gray-500 text-sm">Manual</span>
                    </div>
                  </template>
                  <template v-if="!mov.origenAutomatico" #actions>
                    <Button icon="pi pi-pencil" text rounded size="small" @click="editarMovimiento(mov)" />
                    <Button icon="pi pi-trash" text rounded size="small" severity="danger" @click="confirmarEliminar(mov)" />
                  </template>
                </MobileRecordCard>
              </div>
              <MobilePaginator v-model:page="movimientosPage" :rows="10" :total="movimientosFiltrados.length" />
            </template>
          </div>
        </TabPanel>
        <TabPanel header="Balances anuales" leftIcon="pi pi-file">
          <div class="mt-2">
            <BalanceAnualUpload scope="Disciplina" :disciplina-id="disciplinaSeleccionada" />
          </div>
        </TabPanel>
        <TabPanel header="Reportes" leftIcon="pi pi-chart-bar">
          <div class="reportes-tab">
            <!-- Reporte Mensual -->
            <div class="card reporte-card">
              <div class="reporte-card__header">
                <h3 class="reporte-card__title">Reporte Mensual</h3>
                <Button
                  v-if="reporteMensualData"
                  label="Imprimir"
                  icon="pi pi-print"
                  outlined
                  size="small"
                  @click="imprimirReporte(reporteMensualData, 'mensual')"
                />
              </div>
              <div class="reporte-filters">
                <div class="reporte-field">
                  <label>Mes</label>
                  <Dropdown v-model="reporteMes" :options="mesesOpciones" optionLabel="label" optionValue="value" class="w-full" />
                </div>
                <div class="reporte-field">
                  <label>Año</label>
                  <InputNumber v-model="reporteAnioMensual" :useGrouping="false" :min="2020" :max="2099" class="w-full" inputClass="w-full" />
                </div>
                <Button
                  label="Generar"
                  icon="pi pi-refresh"
                  class="w-full"
                  size="small"
                  :loading="loadingReporteMensual"
                  @click="generarReporteMensual"
                />
              </div>
              <div v-if="reporteMensualData" class="reporte-result">
                <div class="reporte-stats">
                  <div class="stat-card">
                    <span class="stat-label">Ingresos</span>
                    <span class="stat-value text-green-400">{{ formatCompactMoney(reporteMensualData.resumen.totalIngresos) }}</span>
                  </div>
                  <div class="stat-card">
                    <span class="stat-label">Egresos</span>
                    <span class="stat-value text-red-400">{{ formatCompactMoney(reporteMensualData.resumen.totalEgresos) }}</span>
                  </div>
                  <div class="stat-card reporte-stats__saldo">
                    <span class="stat-label">Saldo</span>
                    <span class="stat-value" :class="reporteMensualData.resumen.saldo >= 0 ? 'text-green-400' : 'text-red-400'">
                      {{ formatCompactMoney(reporteMensualData.resumen.saldo) }}
                    </span>
                  </div>
                </div>
                <div v-if="!reporteMensualData.movimientos?.length" class="text-center py-3 text-gray-400 text-sm">
                  Sin movimientos en el período
                </div>
                <div v-else class="mobile-card-list">
                  <MobileRecordCard
                    v-for="(mov, idx) in reporteMensualData.movimientos"
                    :key="`m-${idx}-${mov.id || mov.fecha}`"
                    :title="mov.concepto"
                    :subtitle="formatFecha(mov.fecha)"
                  >
                    <template #tags>
                      <Tag :value="mov.tipo" :severity="mov.tipo === 'ingreso' ? 'success' : 'danger'" />
                    </template>
                    <template #body>
                      <div class="record-card__row">
                        <span class="record-card__label">Monto</span>
                        <span class="record-card__value font-bold" :class="mov.tipo === 'ingreso' ? 'text-green-400' : 'text-red-400'">
                          {{ mov.tipo === 'ingreso' ? '+' : '-' }}{{ formatCompactMoney(mov.monto) }}
                        </span>
                      </div>
                    </template>
                  </MobileRecordCard>
                </div>
              </div>
            </div>

            <!-- Reporte Anual -->
            <div class="card reporte-card">
              <div class="reporte-card__header">
                <h3 class="reporte-card__title">Reporte Anual</h3>
                <Button
                  v-if="reporteAnualData"
                  label="Imprimir"
                  icon="pi pi-print"
                  outlined
                  size="small"
                  @click="imprimirReporte(reporteAnualData, 'anual')"
                />
              </div>
              <div class="reporte-filters">
                <div class="reporte-field">
                  <label>Año</label>
                  <InputNumber v-model="reporteAnioAnual" :useGrouping="false" :min="2020" :max="2099" class="w-full" inputClass="w-full" />
                </div>
                <Button
                  label="Generar"
                  icon="pi pi-refresh"
                  class="w-full"
                  size="small"
                  :loading="loadingReporteAnual"
                  @click="generarReporteAnual"
                />
              </div>
              <div v-if="reporteAnualData" class="reporte-result">
                <div class="reporte-stats">
                  <div class="stat-card">
                    <span class="stat-label">Ingresos</span>
                    <span class="stat-value text-green-400">{{ formatCompactMoney(reporteAnualData.resumen.totalIngresos) }}</span>
                  </div>
                  <div class="stat-card">
                    <span class="stat-label">Egresos</span>
                    <span class="stat-value text-red-400">{{ formatCompactMoney(reporteAnualData.resumen.totalEgresos) }}</span>
                  </div>
                  <div class="stat-card reporte-stats__saldo">
                    <span class="stat-label">Saldo</span>
                    <span class="stat-value" :class="reporteAnualData.resumen.saldo >= 0 ? 'text-green-400' : 'text-red-400'">
                      {{ formatCompactMoney(reporteAnualData.resumen.saldo) }}
                    </span>
                  </div>
                </div>
                <div v-if="!reporteAnualData.movimientos?.length" class="text-center py-3 text-gray-400 text-sm">
                  Sin movimientos en el período
                </div>
                <div v-else class="mobile-card-list">
                  <MobileRecordCard
                    v-for="(mov, idx) in reporteAnualData.movimientos"
                    :key="`a-${idx}-${mov.id || mov.fecha}`"
                    :title="mov.concepto"
                    :subtitle="formatFecha(mov.fecha)"
                  >
                    <template #tags>
                      <Tag :value="mov.tipo" :severity="mov.tipo === 'ingreso' ? 'success' : 'danger'" />
                    </template>
                    <template #body>
                      <div class="record-card__row">
                        <span class="record-card__label">Monto</span>
                        <span class="record-card__value font-bold" :class="mov.tipo === 'ingreso' ? 'text-green-400' : 'text-red-400'">
                          {{ mov.tipo === 'ingreso' ? '+' : '-' }}{{ formatCompactMoney(mov.monto) }}
                        </span>
                      </div>
                    </template>
                  </MobileRecordCard>
                </div>
              </div>
            </div>
          </div>
        </TabPanel>
      </TabView>
    </template>

    <div v-else class="card text-center py-6 text-gray-400">
      <i class="pi pi-bookmark text-5xl mb-3 block"></i>
      Seleccioná una disciplina para ver su contabilidad
    </div>

    <Dialog v-model:visible="mostrarFormulario" :header="movimientoEditando ? 'Editar Movimiento' : 'Nuevo Movimiento'" modal :style="{ width: '560px' }">
      <form @submit.prevent="guardarMovimiento" class="flex flex-column gap-3 pt-2">
        <div class="flex gap-2">
          <Button
            type="button"
            label="Ingreso"
            icon="pi pi-arrow-up"
            class="flex-1"
            :outlined="form.tipo !== 'ingreso'"
            severity="success"
            @click="form.tipo = 'ingreso'"
          />
          <Button
            type="button"
            label="Egreso"
            icon="pi pi-arrow-down"
            class="flex-1"
            :outlined="form.tipo !== 'egreso'"
            severity="danger"
            @click="form.tipo = 'egreso'"
          />
        </div>
        <InputText v-model="form.concepto" placeholder="Concepto *" class="w-full" />
        <Textarea v-model="form.descripcion" rows="2" placeholder="Descripción (opcional)" class="w-full" autoResize />
        <div class="flex gap-3">
          <InputNumber v-model="form.monto" mode="currency" currency="ARS" locale="es-AR" class="flex-1" placeholder="Monto" />
          <Calendar v-model="form.fecha" dateFormat="dd/mm/yy" showIcon class="flex-1" :maxDate="new Date()" />
        </div>
        <InputText v-model="form.comprobante" placeholder="Comprobante (opcional)" class="w-full" />
        <Message v-if="formError" severity="error" :closable="false">{{ formError }}</Message>
      </form>
      <template #footer>
        <Button label="Cancelar" text @click="mostrarFormulario = false" />
        <Button label="Guardar" icon="pi pi-check" @click="guardarMovimiento" :loading="guardando" />
      </template>
    </Dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useToast } from 'primevue/usetoast'
import { useConfirm } from 'primevue/useconfirm'
import { useAuthStore } from '@/stores/auth'
import { disciplinasService, disciplinaContabilidadService } from '@/services'
import BalanceAnualUpload from '@/components/contabilidad/BalanceAnualUpload.vue'
import { useMobilePagination } from '@/composables/useMobilePagination'
import PageHeader from '@/components/mobile/PageHeader.vue'
import MobileRecordCard from '@/components/mobile/MobileRecordCard.vue'
import MobilePaginator from '@/components/mobile/MobilePaginator.vue'
import Button from 'primevue/button'
import Dropdown from 'primevue/dropdown'
import Tag from 'primevue/tag'
import Calendar from 'primevue/calendar'
import Dialog from 'primevue/dialog'
import InputText from 'primevue/inputtext'
import InputNumber from 'primevue/inputnumber'
import Textarea from 'primevue/textarea'
import SelectButton from 'primevue/selectbutton'
import Message from 'primevue/message'
import TabView from 'primevue/tabview'
import TabPanel from 'primevue/tabpanel'
import BlockUI from 'primevue/blockui'
import { formatCompactMoney } from '@/utils/formatMoney'

const route = useRoute()
const toast = useToast()
const confirm = useConfirm()
const authStore = useAuthStore()
const isMaster = computed(() => authStore.user?.rol === 'master')

const disciplinas = ref([])
const disciplinaSeleccionada = ref(null)
const movimientos = ref([])
const resumen = ref({ totalIngresos: 0, totalEgresos: 0, saldo: 0 })
const saldoAcumulado = ref(0)
const loading = ref(false)
const loadingDisciplinas = ref(false)
const filtros = ref({ fechaDesde: null, fechaHasta: null, tipo: null })

const mostrarFormulario = ref(false)
const movimientoEditando = ref(null)
const guardando = ref(false)
const formError = ref(null)
const form = ref({})

const tiposMovimiento = [
  { label: 'Ingresos', value: 'ingreso' },
  { label: 'Egresos', value: 'egreso' }
]
const tiposForm = tiposMovimiento

// --- Reportes ---
const hoy = new Date()
const reporteMes = ref(hoy.getMonth() + 1)
const reporteAnioMensual = ref(hoy.getFullYear())
const reporteAnioAnual = ref(hoy.getFullYear())
const loadingReporteMensual = ref(false)
const loadingReporteAnual = ref(false)
const reporteMensualData = ref(null)
const reporteAnualData = ref(null)

const blockUi = computed(() =>
  loading.value ||
  loadingDisciplinas.value ||
  guardando.value ||
  loadingReporteMensual.value ||
  loadingReporteAnual.value
)

const mesesOpciones = [
  { label: 'Enero', value: 1 }, { label: 'Febrero', value: 2 }, { label: 'Marzo', value: 3 },
  { label: 'Abril', value: 4 }, { label: 'Mayo', value: 5 }, { label: 'Junio', value: 6 },
  { label: 'Julio', value: 7 }, { label: 'Agosto', value: 8 }, { label: 'Septiembre', value: 9 },
  { label: 'Octubre', value: 10 }, { label: 'Noviembre', value: 11 }, { label: 'Diciembre', value: 12 }
]

const categorias = [
  { label: 'Cuota de socio', value: 'cuota_socio', tipo: 'ingreso' },
  { label: 'Donación', value: 'donacion', tipo: 'ingreso' },
  { label: 'Otro ingreso', value: 'otro_ingreso', tipo: 'ingreso' },
  { label: 'Honorarios / Instructor', value: 'honorarios', tipo: 'egreso' },
  { label: 'Insumos deportivos', value: 'insumos', tipo: 'egreso' },
  { label: 'Equipamiento', value: 'equipamiento', tipo: 'egreso' },
  { label: 'Mantenimiento', value: 'mantenimiento', tipo: 'egreso' },
  { label: 'Otro egreso', value: 'otro_egreso', tipo: 'egreso' }
]

const categoriasFiltradas = computed(() => categorias.filter(c => c.tipo === form.value.tipo))

const movimientosFiltrados = computed(() => {
  let r = movimientos.value
  if (filtros.value.fechaDesde) r = r.filter(m => new Date(m.fecha) >= filtros.value.fechaDesde)
  if (filtros.value.fechaHasta) r = r.filter(m => new Date(m.fecha) <= filtros.value.fechaHasta)
  if (filtros.value.tipo) r = r.filter(m => m.tipo === filtros.value.tipo)
  return r
})

const { page: movimientosPage, paginated: paginatedMovimientos } = useMobilePagination(
  movimientosFiltrados,
  10,
  [() => filtros.value.fechaDesde, () => filtros.value.fechaHasta, () => filtros.value.tipo]
)

const saldo = computed(() => (resumen.value.totalIngresos ?? 0) - (resumen.value.totalEgresos ?? 0))

function formatFecha(fecha) {
  return new Date(fecha).toLocaleDateString('es-AR')
}

async function loadDisciplinas() {
  loadingDisciplinas.value = true
  try {
    const todas = await disciplinasService.getAll()
    if (isMaster.value) {
      disciplinas.value = todas
    } else {
      // Solo mostrar las disciplinas asignadas al admin
      const userId = authStore.user?.id
      disciplinas.value = todas.filter(d =>
        d.adminsAsignados?.some(a => a.adminId === userId)
      )
    }
    // Si viene por query param y el admin tiene acceso, preseleccionar
    if (route.query.disciplinaId) {
      const tieneAcceso = disciplinas.value.some(d => d.id === route.query.disciplinaId)
      if (tieneAcceso) {
        disciplinaSeleccionada.value = route.query.disciplinaId
        await cargarDatos()
      }
    }
    // Si solo hay una disciplina disponible, seleccionarla automáticamente
    if (!disciplinaSeleccionada.value && disciplinas.value.length === 1) {
      disciplinaSeleccionada.value = disciplinas.value[0].id
      await cargarDatos()
    }
  } finally {
    loadingDisciplinas.value = false
  }
}

async function cargarDatos() {
  if (!disciplinaSeleccionada.value) return
  loading.value = true
  try {
    const [movs, res, saldoData] = await Promise.all([
      disciplinaContabilidadService.getMovimientos(disciplinaSeleccionada.value),
      disciplinaContabilidadService.getResumen(disciplinaSeleccionada.value),
      disciplinaContabilidadService.getSaldo(disciplinaSeleccionada.value)
    ])
    movimientos.value = movs
    resumen.value = res
    saldoAcumulado.value = saldoData.saldoAcumulado ?? 0
  } catch {
    toast.add({ severity: 'error', summary: 'Error', detail: 'No se pudo cargar la contabilidad', life: 3000 })
  } finally {
    loading.value = false
  }
}

function limpiarFiltros() {
  filtros.value = { fechaDesde: null, fechaHasta: null, tipo: null }
}

function abrirFormulario() {
  movimientoEditando.value = null
  form.value = { tipo: 'egreso', concepto: '', descripcion: '', monto: 0, fecha: new Date(), comprobante: '' }
  formError.value = null
  mostrarFormulario.value = true
}

function editarMovimiento(m) {
  movimientoEditando.value = m
  form.value = {
    tipo: m.tipo,
    concepto: m.concepto,
    descripcion: m.descripcion || '',
    monto: m.monto,
    fecha: new Date(m.fecha),
    comprobante: m.comprobante || ''
  }
  formError.value = null
  mostrarFormulario.value = true
}

async function guardarMovimiento() {
  if (!form.value.concepto?.trim() || !form.value.monto || !form.value.fecha) {
    formError.value = 'Completá concepto, monto y fecha'
    return
  }
  guardando.value = true
  formError.value = null
  const payload = {
    tipo: form.value.tipo,
    categoria: null,
    concepto: form.value.concepto.trim(),
    descripcion: form.value.descripcion?.trim() || null,
    monto: form.value.monto,
    fecha: form.value.fecha,
    comprobante: form.value.comprobante?.trim() || null,
    metodoPago: null
  }
  try {
    if (movimientoEditando.value) {
      await disciplinaContabilidadService.update(disciplinaSeleccionada.value, movimientoEditando.value.id, payload)
    } else {
      await disciplinaContabilidadService.create(disciplinaSeleccionada.value, payload)
    }
    mostrarFormulario.value = false
    toast.add({ severity: 'success', summary: 'Guardado', life: 3000 })
    await cargarDatos()
  } catch (error) {
    formError.value = error.response?.data?.message || 'Error al guardar'
  } finally {
    guardando.value = false
  }
}

function confirmarEliminar(m) {
  confirm.require({
    message: `¿Eliminar "${m.concepto}"?`,
    header: 'Confirmar',
    icon: 'pi pi-exclamation-triangle',
    acceptClass: 'p-button-danger',
    accept: async () => {
      try {
        await disciplinaContabilidadService.delete(disciplinaSeleccionada.value, m.id)
        toast.add({ severity: 'success', summary: 'Eliminado', life: 3000 })
        await cargarDatos()
      } catch (error) {
        toast.add({ severity: 'error', summary: 'Error', detail: error.response?.data?.message || 'No se pudo eliminar', life: 4000 })
      }
    }
  })
}

onMounted(loadDisciplinas)

async function generarReporteMensual() {
  if (!disciplinaSeleccionada.value) return
  loadingReporteMensual.value = true
  try {
    const anio = reporteAnioMensual.value
    const mes = reporteMes.value
    const fechaDesde = new Date(anio, mes - 1, 1).toISOString()
    const fechaHasta = new Date(anio, mes, 0, 23, 59, 59).toISOString()
    const [movimientos, resumen] = await Promise.all([
      disciplinaContabilidadService.getMovimientos(disciplinaSeleccionada.value, { fechaDesde, fechaHasta }),
      disciplinaContabilidadService.getResumen(disciplinaSeleccionada.value, { fechaDesde, fechaHasta })
    ])
    reporteMensualData.value = { movimientos, resumen }
  } catch {
    toast.add({ severity: 'error', summary: 'Error', detail: 'No se pudo generar el reporte', life: 3000 })
  } finally {
    loadingReporteMensual.value = false
  }
}

async function generarReporteAnual() {
  if (!disciplinaSeleccionada.value) return
  loadingReporteAnual.value = true
  try {
    const anio = reporteAnioAnual.value
    const fechaDesde = new Date(anio, 0, 1).toISOString()
    const fechaHasta = new Date(anio, 11, 31, 23, 59, 59).toISOString()
    const [movimientos, resumen] = await Promise.all([
      disciplinaContabilidadService.getMovimientos(disciplinaSeleccionada.value, { fechaDesde, fechaHasta }),
      disciplinaContabilidadService.getResumen(disciplinaSeleccionada.value, { fechaDesde, fechaHasta })
    ])
    reporteAnualData.value = { movimientos, resumen }
  } catch {
    toast.add({ severity: 'error', summary: 'Error', detail: 'No se pudo generar el reporte', life: 3000 })
  } finally {
    loadingReporteAnual.value = false
  }
}

function imprimirReporte(data, tipo) {
  const nombreMes = tipo === 'mensual'
    ? mesesOpciones.find(m => m.value === reporteMes.value)?.label + ' ' + reporteAnioMensual.value
    : 'Año ' + reporteAnioAnual.value

  const filas = data.movimientos.map(m => `
    <tr>
      <td>${formatFecha(m.fecha)}</td>
      <td>${m.concepto || ''}</td>
      <td style="color:${m.tipo === 'ingreso' ? 'green' : 'red'}">${m.tipo}</td>
      <td style="text-align:right">$${m.monto?.toLocaleString('es-AR')}</td>
    </tr>`).join('')

  const html = `
    <html><head><title>Reporte ${nombreMes}</title>
    <style>body{font-family:sans-serif;padding:20px}table{width:100%;border-collapse:collapse}
    th,td{border:1px solid #ccc;padding:6px 10px;font-size:13px}th{background:#f0f0f0}
    h2{margin-bottom:4px}.resumen{display:flex;gap:20px;margin:12px 0}
    .r{background:#f9f9f9;padding:8px 16px;border-radius:6px}</style></head>
    <body>
    <h2>Contabilidad por Disciplina — ${nombreMes}</h2>
    <div class="resumen">
      <div class="r">Ingresos: <b style="color:green">$${data.resumen.totalIngresos?.toLocaleString('es-AR')}</b></div>
      <div class="r">Egresos: <b style="color:red">$${data.resumen.totalEgresos?.toLocaleString('es-AR')}</b></div>
      <div class="r">Saldo: <b>$${data.resumen.saldo?.toLocaleString('es-AR')}</b></div>
    </div>
    <table><thead><tr><th>Fecha</th><th>Concepto</th><th>Tipo</th><th>Monto</th></tr></thead>
    <tbody>${filas}</tbody></table>
    </body></html>`

  const w = window.open('', '_blank')
  w.document.write(html)
  w.document.close()
  w.print()
}
</script>

<style scoped>
.disciplina-contabilidad-view { padding: 0; }
.page-title { color: var(--text-color); }
.stat-card, .card {
  background: var(--surface-card);
  border: 1px solid var(--surface-border);
  border-radius: 12px;
  padding: 1rem;
}
.stat-label { color: var(--text-color-secondary); }

.reportes-tab {
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
  margin-top: 0.5rem;
}

.reporte-card__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  margin-bottom: 0.75rem;
}

.reporte-card__title {
  margin: 0;
  font-size: 1rem;
  font-weight: 700;
  color: var(--text-color);
}

.reporte-filters {
  display: flex;
  flex-direction: column;
  gap: 0.65rem;
}

.reporte-field label {
  display: block;
  font-size: 0.75rem;
  color: var(--text-color-secondary);
  margin-bottom: 0.25rem;
}

.reporte-result {
  margin-top: 0.85rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.reporte-stats {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.5rem;
}

.reporte-stats .stat-card {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
  padding: 0.7rem 0.75rem;
  min-width: 0;
}

.reporte-stats__saldo {
  grid-column: 1 / -1;
}

.reporte-stats .stat-value {
  font-size: 1.05rem !important;
  font-weight: 700;
}
</style>
