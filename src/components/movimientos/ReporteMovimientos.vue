<template>
  <div class="reporte-movimientos">
    <!-- Header -->
    <div class="flex justify-content-between align-items-center mb-4">
      <h2 class="text-2xl font-bold m-0">Reportes de Movimientos</h2>
      <Button 
        label="Generar Reporte" 
        icon="pi pi-file-pdf" 
        @click="generarReporte"
        :loading="loading"
        :disabled="!puedeGenerarReporte"
      />
    </div>

    <!-- Formulario de filtros -->
    <div class="card mb-4">
      <h3 class="mb-3">Filtros del Reporte</h3>
      <div class="grid">
        <!-- Rango de fechas -->
        <div class="col-12 md:col-6">
          <label class="block text-sm font-medium mb-2">Desde</label>
          <Calendar 
            v-model="filtros.fechaDesde" 
            dateFormat="dd/mm/yy"
            :showIcon="true"
            iconDisplay="input"
            placeholder="Fecha desde"
            :maxDate="filtros.fechaHasta"
          />
        </div>
        
        <div class="col-12 md:col-6">
          <label class="block text-sm font-medium mb-2">Hasta</label>
          <Calendar 
            v-model="filtros.fechaHasta" 
            dateFormat="dd/mm/yy"
            :showIcon="true"
            iconDisplay="input"
            placeholder="Fecha hasta"
            :minDate="filtros.fechaDesde"
            :maxDate="new Date()"
          />
        </div>

        <!-- Tipo de movimiento -->
        <div class="col-12 md:col-6">
          <label class="block text-sm font-medium mb-2">Tipo de Movimiento</label>
          <Dropdown 
            v-model="filtros.tipo" 
            :options="tiposMovimiento"
            optionLabel="label"
            optionValue="value"
            placeholder="Todos los tipos"
            :showClear="true"
          />
        </div>

        <!-- Categoría -->
        <div class="col-12 md:col-6">
          <label class="block text-sm font-medium mb-2">Categoría</label>
          <Dropdown 
            v-model="filtros.categoria" 
            :options="categorias"
            optionLabel="label"
            optionValue="value"
            placeholder="Todas las categorías"
            :showClear="true"
            :loading="loadingCategorias"
          />
        </div>

        <!-- Botones de fechas rápidas -->
        <div class="col-12">
          <label class="block text-sm font-medium mb-2">Períodos Rápidos</label>
          <div class="flex gap-2 flex-wrap">
            <Button 
              label="Este mes" 
              size="small" 
              outlined 
              @click="seleccionarEsteMes"
            />
            <Button 
              label="Mes anterior" 
              size="small" 
              outlined 
              @click="seleccionarMesAnterior"
            />
            <Button 
              label="Últimos 3 meses" 
              size="small" 
              outlined 
              @click="seleccionarUltimosTresMeses"
            />
            <Button 
              label="Este año" 
              size="small" 
              outlined 
              @click="seleccionarEsteAnio"
            />
            <Button 
              label="Año anterior" 
              size="small" 
              outlined 
              @click="seleccionarAnioAnterior"
            />
          </div>
        </div>
      </div>
    </div>

    <!-- Vista previa del reporte -->
    <div v-if="reporte" class="card">
      <div class="flex justify-content-between align-items-center mb-3">
        <h3>Vista Previa del Reporte</h3>
        <div class="flex gap-2">
          <Button 
            label="Imprimir" 
            icon="pi pi-print" 
            @click="imprimirReporte"
            outlined
          />
          <Button 
            label="Descargar PDF" 
            icon="pi pi-download" 
            @click="descargarPDF"
            outlined
          />
        </div>
      </div>

      <!-- Información del reporte -->
      <div class="grid mb-4" id="reporte-contenido">
        <div class="col-12">
          <div class="text-center mb-4">
            <h2 class="m-0">Club Socios UDL</h2>
            <h3 class="m-0 text-gray-600">Reporte de Movimientos</h3>
            <p class="m-0 text-sm text-gray-500">
              Período: {{ formatFecha(filtros.fechaDesde) }} - {{ formatFecha(filtros.fechaHasta) }}
            </p>
            <p class="m-0 text-sm text-gray-500">
              Generado el: {{ new Date().toLocaleString('es-AR') }}
            </p>
          </div>
        </div>

        <!-- Resumen ejecutivo -->
        <div class="col-12">
          <h4 class="text-primary">Resumen Ejecutivo</h4>
          <div class="grid">
            <div class="col-12 md:col-3">
              <div class="bg-green-50 p-3 border-round">
                <h5 class="text-green-700 m-0">Total Ingresos</h5>
                <p class="text-2xl font-bold text-green-800 m-0">
                  ${{ resumenReporte.totalIngresos.toLocaleString('es-AR') }}
                </p>
              </div>
            </div>
            <div class="col-12 md:col-3">
              <div class="bg-red-50 p-3 border-round">
                <h5 class="text-red-700 m-0">Total Egresos</h5>
                <p class="text-2xl font-bold text-red-800 m-0">
                  ${{ resumenReporte.totalEgresos.toLocaleString('es-AR') }}
                </p>
              </div>
            </div>
            <div class="col-12 md:col-3">
              <div class="p-3 border-round" :class="resumenReporte.saldoNeto >= 0 ? 'bg-blue-50' : 'bg-orange-50'">
                <h5 class="m-0" :class="resumenReporte.saldoNeto >= 0 ? 'text-blue-700' : 'text-orange-700'">
                  Saldo Neto
                </h5>
                <p class="text-2xl font-bold m-0" :class="resumenReporte.saldoNeto >= 0 ? 'text-blue-800' : 'text-orange-800'">
                  {{ resumenReporte.saldoNeto >= 0 ? '+' : '' }}${{ resumenReporte.saldoNeto.toLocaleString('es-AR') }}
                </p>
              </div>
            </div>
            <div class="col-12 md:col-3">
              <div class="bg-purple-50 p-3 border-round">
                <h5 class="text-purple-700 m-0">Cant. Movimientos</h5>
                <p class="text-2xl font-bold text-purple-800 m-0">
                  {{ movimientosReporte.length }}
                </p>
              </div>
            </div>
          </div>
        </div>

        <!-- Detalle de movimientos -->
        <div class="col-12">
          <h4 class="text-primary">Detalle de Movimientos</h4>
          <DataTable 
            :value="movimientosReporte" 
            :paginator="true"
            :rows="10"
            :rowsPerPageOptions="[10, 25, 50]"
            responsiveLayout="scroll"
            class="p-datatable-sm"
            :exportable="true"
            :sortField="'fecha'"
            :sortOrder="-1"
          >
            <Column field="fecha" header="Fecha" sortable>
              <template #body="slotProps">
                {{ formatFecha(slotProps.data.fecha) }}
              </template>
            </Column>
            <Column field="tipo" header="Tipo" sortable>
              <template #body="slotProps">
                <Tag 
                  :severity="slotProps.data.tipo === 'ingreso' ? 'success' : 'danger'"
                  :value="slotProps.data.tipo === 'ingreso' ? 'Ingreso' : 'Egreso'"
                />
              </template>
            </Column>
            <Column field="categoria" header="Categoría" sortable />
            <Column field="concepto" header="Concepto" sortable />
            <Column field="descripcion" header="Descripción" />
            <Column field="empleadoNombre" header="Empleado">
              <template #body="slotProps">
                <span v-if="slotProps.data.empleadoNombre">{{ slotProps.data.empleadoNombre }}</span>
                <span v-else class="text-gray-400">-</span>
              </template>
            </Column>
            <Column field="monto" header="Monto" sortable>
              <template #body="slotProps">
                <span :class="slotProps.data.tipo === 'ingreso' ? 'text-green-600 font-bold' : 'text-red-600 font-bold'">
                  {{ slotProps.data.tipo === 'ingreso' ? '+' : '-' }}${{ slotProps.data.monto.toLocaleString('es-AR') }}
                </span>
              </template>
            </Column>
          </DataTable>
        </div>

        <!-- Gráfico de resumen -->
        <div class="col-12" v-if="movimientosReporte.length > 0">
          <h4 class="text-primary">Distribución por Categorías</h4>
          <Chart 
            type="doughnut" 
            :data="chartDataReporte" 
            :options="chartOptionsReporte"
            style="max-height: 300px"
          />
        </div>
      </div>
    </div>

    <!-- Estado sin datos -->
    <div v-else-if="!loading && filtros.fechaDesde && filtros.fechaHasta" class="card text-center">
      <i class="pi pi-info-circle text-4xl text-blue-500 mb-3"></i>
      <p class="text-gray-600">Selecciona las fechas y haz clic en "Generar Reporte" para ver los datos.</p>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useToast } from 'primevue/usetoast'
import { movimientosService } from '@/services'
import Calendar from 'primevue/calendar'
import Button from 'primevue/button'
import Dropdown from 'primevue/dropdown'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Tag from 'primevue/tag'
import Chart from 'primevue/chart'
import { Capacitor } from '@capacitor/core'
import { savePdfDocument, printHtmlContent } from '@/platform/files'

// Estado
const toast = useToast()
const loading = ref(false)
const loadingCategorias = ref(false)
const reporte = ref(null)
const categorias = ref([])

// Filtros
const filtros = ref({
  fechaDesde: null,
  fechaHasta: null,
  tipo: null,
  categoria: null
})

// Opciones para dropdowns
const tiposMovimiento = [
  { label: 'Ingreso', value: 'ingreso' },
  { label: 'Egreso', value: 'egreso' }
]

// Computed
const puedeGenerarReporte = computed(() => {
  return filtros.value.fechaDesde && filtros.value.fechaHasta
})

const movimientosReporte = computed(() => reporte.value?.movimientos ?? [])

const resumenReporte = computed(() => {
  const r = reporte.value
  if (!r) {
    return { totalIngresos: 0, totalEgresos: 0, saldoNeto: 0 }
  }
  return {
    totalIngresos: r.resumen?.totalIngresos ?? r.totalIngresos ?? 0,
    totalEgresos: r.resumen?.totalEgresos ?? r.totalEgresos ?? 0,
    saldoNeto: r.resumen?.saldoNeto ?? r.saldo ?? 0
  }
})

// Generar reporte
const generarReporte = async () => {
  try {
    loading.value = true
    
    const params = {
      fechaDesde: filtros.value.fechaDesde.toISOString().split('T')[0],
      fechaHasta: filtros.value.fechaHasta.toISOString().split('T')[0],
      tipo: filtros.value.tipo || undefined,
      categoria: filtros.value.categoria || undefined
    }
    
    reporte.value = await movimientosService.getReporte(
      params.fechaDesde,
      params.fechaHasta,
      params.tipo,
      params.categoria
    )

    if (!reporte.value?.movimientos) {
      reporte.value = { ...reporte.value, movimientos: [] }
    }
  } catch (error) {
    console.error('Error generando reporte:', error)
    reporte.value = null
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: error.response?.data?.message || 'No se pudo generar el reporte',
      life: 4000
    })
  } finally {
    loading.value = false
  }
}

// Cargar categorías
const cargarCategorias = async () => {
  try {
    loadingCategorias.value = true    // Aquí podrías llamar a un endpoint para obtener las categorías
    // Por ahora uso categorías hardcodeadas
    categorias.value = [
      // Ingresos
      { label: 'Cuota de socios',      value: 'cuota_socios' },
      { label: 'Factura / Cobro',      value: 'factura_cobro' },
      { label: 'Donación',             value: 'donacion' },
      { label: 'Evento / Torneo',      value: 'evento' },
      { label: 'Venta de productos',   value: 'venta_productos' },
      { label: 'Alquiler de espacios', value: 'alquiler_espacios' },
      { label: 'Subsidio / Ayuda',     value: 'subsidio' },
      { label: 'Otro ingreso',         value: 'otro_ingreso' },
      // Egresos
      { label: 'Sueldos / Honorarios', value: 'sueldos' },
      { label: 'Factura de servicios', value: 'factura_servicio' },
      { label: 'Compra de productos',  value: 'compra_productos' },
      { label: 'Mantenimiento',        value: 'mantenimiento' },
      { label: 'Evento / Torneo',      value: 'evento_egreso' },
      { label: 'Impuestos / Tasas',    value: 'impuestos' },
      { label: 'Otro egreso',          value: 'otro_egreso' },
    ]
  } catch (error) {
    console.error('Error cargando categorías:', error)
  } finally {
    loadingCategorias.value = false
  }
}

// Funciones para selección rápida de fechas
const seleccionarEsteMes = () => {
  const hoy = new Date()
  filtros.value.fechaDesde = new Date(hoy.getFullYear(), hoy.getMonth(), 1)
  filtros.value.fechaHasta = hoy
}

const seleccionarMesAnterior = () => {
  const hoy = new Date()
  filtros.value.fechaDesde = new Date(hoy.getFullYear(), hoy.getMonth() - 1, 1)
  filtros.value.fechaHasta = new Date(hoy.getFullYear(), hoy.getMonth(), 0)
}

const seleccionarUltimosTresMeses = () => {
  const hoy = new Date()
  filtros.value.fechaDesde = new Date(hoy.getFullYear(), hoy.getMonth() - 2, 1)
  filtros.value.fechaHasta = hoy
}

const seleccionarEsteAnio = () => {
  const hoy = new Date()
  filtros.value.fechaDesde = new Date(hoy.getFullYear(), 0, 1)
  filtros.value.fechaHasta = hoy
}

const seleccionarAnioAnterior = () => {
  const hoy = new Date()
  filtros.value.fechaDesde = new Date(hoy.getFullYear() - 1, 0, 1)
  filtros.value.fechaHasta = new Date(hoy.getFullYear() - 1, 11, 31)
}

// Formatear fecha
const formatFecha = (fecha) => {
  if (!fecha) return ''
  return new Date(fecha).toLocaleDateString('es-AR')
}

const imprimirReporte = () => {
  const contenido = document.getElementById('reporte-contenido')
  if (!contenido) return

  if (Capacitor.isNativePlatform()) {
    toast.add({
      severity: 'info',
      summary: 'Impresión',
      detail: 'En móvil usá "Descargar PDF" y compartí el archivo',
      life: 4000
    })
    return
  }

  const html = `
    <html><head><title>Reporte de Movimientos</title>
    <style>
      body { font-family: Arial, sans-serif; margin: 20px; }
      table { width: 100%; border-collapse: collapse; margin-top: 20px; }
      th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
      th { background-color: #f2f2f2; }
    </style></head><body>${contenido.innerHTML}</body></html>
  `
  printHtmlContent(html)
}

// Descargar PDF
const descargarPDF = async () => {
  try {
    const { default: html2canvas } = await import('html2canvas')
    const { jsPDF } = await import('jspdf')
    
    const elemento = document.getElementById('reporte-contenido')
    if (elemento) {
      const canvas = await html2canvas(elemento, { scale: 2 })
      const imgData = canvas.toDataURL('image/png')
      
      const pdf = new jsPDF('p', 'mm', 'a4')
      const imgWidth = 210
      const pageHeight = 295
      const imgHeight = (canvas.height * imgWidth) / canvas.width
      let heightLeft = imgHeight
      
      let position = 0
      
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight)
      heightLeft -= pageHeight
      
      while (heightLeft >= 0) {
        position = heightLeft - imgHeight
        pdf.addPage()
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight)
        heightLeft -= pageHeight
      }
      
      const fechaDesde = formatFecha(filtros.value.fechaDesde).replace(/\//g, '-')
      const fechaHasta = formatFecha(filtros.value.fechaHasta).replace(/\//g, '-')
      const nombreArchivo = `reporte-movimientos-${fechaDesde}-${fechaHasta}.pdf`
      
      await savePdfDocument(pdf, nombreArchivo)
    }
  } catch (error) {
    console.error('Error generando PDF:', error)
  }
}

// Data para gráfico del reporte
const chartDataReporte = computed(() => {
  if (!movimientosReporte.value.length) return {}
  
  // Agrupar por categoría
  const categoriaMap = {}
  movimientosReporte.value.forEach(mov => {
    if (!categoriaMap[mov.categoria]) {
      categoriaMap[mov.categoria] = 0
    }
    categoriaMap[mov.categoria] += mov.monto
  })
  
  const labels = Object.keys(categoriaMap)
  const data = Object.values(categoriaMap)
  
  return {
    labels,
    datasets: [{
      data,
      backgroundColor: [
        '#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6', 
        '#EC4899', '#06B6D4', '#84CC16', '#F97316', '#6366F1'
      ].slice(0, labels.length),
      borderWidth: 2,
      borderColor: '#ffffff'
    }]
  }
})

// Opciones para gráfico del reporte
const chartOptionsReporte = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'bottom'
    },
    tooltip: {
      callbacks: {
        label: function(context) {
          return context.label + ': $' + context.parsed.toLocaleString('es-AR')
        }
      }
    }
  }
}

onMounted(() => {
  cargarCategorias()
  seleccionarEsteMes() // Seleccionar este mes por defecto
})
</script>

<style scoped>
.reporte-movimientos {
  padding: 1rem;
}

.card {
  background: var(--surface-card);
  border: 1px solid var(--surface-border);
  border-radius: 12px;
  padding: 1.5rem;
  margin-bottom: 1rem;
}

#reporte-contenido {
  background: var(--surface-card);
}

@media print {
  .reporte-movimientos {
    padding: 0;
  }
  
  .card {
    box-shadow: none;
    border: none;
    margin: 0;
    padding: 0;
  }
}
</style>
