<template>
  <div class="reporte-distribucion">
    <div class="card mb-4">
      <div class="grid align-items-end">
        <div class="col-12 md:col-3">
          <label class="block text-sm mb-2">Desde</label>
          <Calendar v-model="filtros.fechaDesde" dateFormat="dd/mm/yy" showIcon class="w-full" />
        </div>
        <div class="col-12 md:col-3">
          <label class="block text-sm mb-2">Hasta</label>
          <Calendar v-model="filtros.fechaHasta" dateFormat="dd/mm/yy" showIcon class="w-full" />
        </div>
        <div class="col-12 md:col-3">
          <Button label="Actualizar" icon="pi pi-refresh" class="w-full" @click="cargar" :loading="loading" />
        </div>
        <div class="col-12 md:col-3">
          <Button label="Exportar PDF" icon="pi pi-file-pdf" outlined class="w-full" @click="exportarPdf" :disabled="!reportes.length" />
        </div>
      </div>
    </div>

    <div v-if="loading" class="text-center py-5"><ProgressSpinner /></div>
    <div v-else-if="reportes.length === 0" class="text-center py-5 text-gray-400">Sin datos en el período</div>
    <div v-else class="flex flex-column gap-4">
      <div v-for="rep in reportes" :key="rep.disciplinaId" class="card">
        <div class="flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
          <div>
            <h3 class="m-0">{{ rep.disciplinaNombre }}</h3>
            <small class="text-gray-400" v-if="rep.subcomisionNombre">Subcomisión: {{ rep.subcomisionNombre }}</small>
          </div>
          <div class="text-right">
            <div class="text-green-400 font-bold text-2xl">${{ rep.totalRecaudado?.toLocaleString('es-AR') }}</div>
            <small class="text-gray-400">{{ rep.cantidadSocios }} socios · {{ rep.cantidadCobros }} cobros</small>
          </div>
        </div>
        <div class="mobile-card-list">
          <MobileRecordCard
            v-for="(row, idx) in detallePaginado(rep)"
            :key="`${rep.disciplinaId}-${idx}`"
            :title="row.socioNombre"
            :subtitle="formatFecha(row.fecha)"
          >
            <template #body>
              <div class="record-card__row">
                <span class="record-card__label">Concepto</span>
                <span class="record-card__value">{{ row.concepto }}</span>
              </div>
              <div class="record-card__row">
                <span class="record-card__label">Monto</span>
                <span class="record-card__value">${{ row.monto?.toLocaleString('es-AR') }}</span>
              </div>
            </template>
          </MobileRecordCard>
        </div>
        <MobilePaginator
          v-if="(rep.detalle?.length || 0) > 10"
          :page="detallePage(rep.disciplinaId)"
          :rows="10"
          :total="rep.detalle?.length || 0"
          @update:page="(p) => setDetallePage(rep.disciplinaId, p)"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { reportesService } from '@/services'
import MobileRecordCard from '@/components/mobile/MobileRecordCard.vue'
import MobilePaginator from '@/components/mobile/MobilePaginator.vue'
import Button from 'primevue/button'
import Calendar from 'primevue/calendar'
import ProgressSpinner from 'primevue/progressspinner'

const props = defineProps({
  disciplinaId: { type: String, default: null }
})

const reportes = ref([])
const loading = ref(false)
const filtros = ref({ fechaDesde: null, fechaHasta: null })
const detallePages = ref({})

function detallePage(id) {
  return detallePages.value[id] || 1
}

function setDetallePage(id, page) {
  detallePages.value = { ...detallePages.value, [id]: page }
}

function detallePaginado(rep) {
  const page = detallePage(rep.disciplinaId)
  const start = (page - 1) * 10
  return (rep.detalle || []).slice(start, start + 10)
}

function formatFecha(f) {
  return new Date(f).toLocaleDateString('es-AR')
}

async function cargar() {
  loading.value = true
  try {
    const params = {}
    if (filtros.value.fechaDesde) params.fechaDesde = filtros.value.fechaDesde.toISOString()
    if (filtros.value.fechaHasta) params.fechaHasta = filtros.value.fechaHasta.toISOString()
    if (props.disciplinaId) params.disciplinaId = props.disciplinaId
    reportes.value = await reportesService.getDistribucionDisciplinas(params)
    detallePages.value = {}
  } finally {
    loading.value = false
  }
}

async function exportarPdf() {
  const { jsPDF } = await import('jspdf')
  const autoTable = (await import('jspdf-autotable')).default
  const doc = new jsPDF()
  doc.setFontSize(14)
  doc.text('Reporte de distribución por disciplina', 14, 18)
  let y = 28
  for (const rep of reportes.value) {
    doc.setFontSize(11)
    doc.text(`${rep.disciplinaNombre} — $${rep.totalRecaudado?.toLocaleString('es-AR')}`, 14, y)
    y += 6
    autoTable(doc, {
      startY: y,
      head: [['Fecha', 'Socio', 'Concepto', 'Monto']],
      body: rep.detalle.map(d => [
        formatFecha(d.fecha),
        d.socioNombre,
        d.concepto,
        `$${d.monto?.toLocaleString('es-AR')}`
      ]),
      margin: { left: 14, right: 14 }
    })
    y = doc.lastAutoTable.finalY + 12
    if (y > 260) { doc.addPage(); y = 20 }
  }
  doc.save('distribucion-disciplinas.pdf')
}

onMounted(cargar)
</script>

<style scoped>
.card {
  background: var(--surface-card);
  border: 1px solid var(--surface-border);
  border-radius: 8px;
  padding: 1.25rem;
}
</style>
