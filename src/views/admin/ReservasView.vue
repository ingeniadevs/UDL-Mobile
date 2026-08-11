<template>
  <div>
    <PageHeader title="Reservas">
      <template #actions>
        <Button label="Informe Mensual" icon="pi pi-chart-bar" severity="secondary" size="small" @click="openInformeDialog" />
        <Button label="Nueva Reserva" icon="pi pi-plus" size="small" @click="openNew" />
      </template>
    </PageHeader><!-- Resumen de Pagos -->
    <div class="grid mb-4">
      <div class="col-12 md:col-2">
        <div class="stat-card stat-total">
          <div class="stat-icon">
            <i class="pi pi-calendar"></i>
          </div>
          <div class="stat-content">
            <span class="stat-value">{{ resumenPagos?.totalReservas || 0 }}</span>
            <span class="stat-label">Total Reservas</span>
          </div>
        </div>      </div>
      <div class="col-12 md:col-2">
        <div class="stat-card stat-success">
          <div class="stat-icon">
            <i class="pi pi-check-circle"></i>
          </div>
          <div class="stat-content">
            <span class="stat-value">{{ resumenPagos?.reservasPagadas || 0 }}</span>
            <span class="stat-label">Pagadas</span>
            <small class="stat-amount">${{ (resumenPagos?.montoTotalPagado || 0).toLocaleString() }}</small>
          </div>
        </div>      </div>
      <div class="col-12 md:col-2">
        <div class="stat-card stat-warning">
          <div class="stat-icon">
            <i class="pi pi-clock"></i>
          </div>
          <div class="stat-content">
            <span class="stat-value">{{ resumenPagos?.reservasPendientes || 0 }}</span>
            <span class="stat-label">Pendientes</span>
            <small class="stat-amount">${{ (resumenPagos?.montoTotalPendiente || 0).toLocaleString() }}</small>
          </div>
        </div>
      </div>      <div class="col-12 md:col-3">
        <div class="stat-card stat-efectivo">
          <div class="stat-icon">
            <i class="pi pi-money-bill"></i>
          </div>
          <div class="stat-content">
            <span class="stat-value">{{ reservasPendientesEfectivo.length }}</span>
            <span class="stat-label">Efectivo Pendiente</span>
            <Button 
              v-if="reservasPendientesEfectivo.length > 0"
              label="Ver" 
              size="small" 
              text 
              @click="mostrarPendientesEfectivo"
            />
          </div>
        </div>
      </div>
      <div class="col-12 md:col-3">
        <div class="stat-card stat-aprobacion">
          <div class="stat-icon">
            <i class="pi pi-shield"></i>
          </div>
          <div class="stat-content">
            <span class="stat-value">{{ reservasPendientesAprobacion.length }}</span>
            <span class="stat-label">Pendientes Aprobación</span>
            <Button 
              v-if="reservasPendientesAprobacion.length > 0"
              label="Ver" 
              size="small" 
              text 
              @click="filtros.estado = 'pendiente'; loadReservas()"
            />
          </div>
        </div>
      </div>
    </div><!-- Filtros -->
    <div class="card mb-4">
      <div class="grid">
        <div class="col-12 md:col-2">
          <label class="font-medium text-gray-300 block mb-2">Socio</label>
          <Dropdown 
            v-model="filtros.socioId" 
            :options="socios" 
            optionLabel="nombre" 
            optionValue="id"
            placeholder="Todos"
            class="w-full"
            showClear
            filter
            @change="loadReservas"
          />
        </div>        <div class="col-12 md:col-2">
          <label class="font-medium text-gray-300 block mb-2">Espacio</label>
          <Dropdown 
            v-model="filtros.espacioId" 
            :options="espaciosFiltroOpciones" 
            optionLabel="nombre" 
            optionValue="id"
            placeholder="Todos"
            class="w-full"
            showClear
            :disabled="espacioForzado"
            @change="loadReservas"
          />
          <small v-if="espacioForzado" class="text-orange-400"><i class="pi pi-lock mr-1"></i>Tu espacio asignado</small>
        </div>
        <div class="col-12 md:col-2">
          <label class="font-medium text-gray-300 block mb-2">Estado</label>
          <Dropdown 
            v-model="filtros.estado" 
            :options="estadosReserva" 
            optionLabel="label" 
            optionValue="value"
            placeholder="Todos"
            class="w-full"
            showClear
            @change="loadReservas"
          />
        </div>
        <div class="col-12 md:col-2">
          <label class="font-medium text-gray-300 block mb-2">Estado Pago</label>
          <Dropdown 
            v-model="filtros.estadoPago" 
            :options="estadosPago" 
            optionLabel="label" 
            optionValue="value"
            placeholder="Todos"
            class="w-full"
            showClear
            @change="loadReservas"
          />
        </div>
        <div class="col-12 md:col-2">
          <label class="font-medium text-gray-300 block mb-2">Desde</label>
          <Calendar v-model="filtros.fechaDesde" dateFormat="dd/mm/yy" class="w-full" showIcon @date-select="loadReservas" />
        </div>
        <div class="col-12 md:col-2">
          <label class="font-medium text-gray-300 block mb-2">Hasta</label>
          <Calendar v-model="filtros.fechaHasta" dateFormat="dd/mm/yy" class="w-full" showIcon @date-select="loadReservas" />
        </div>
      </div>
    </div>

    <div class="card">
      <div class="flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
        <h3 class="m-0">Listado de Reservas</h3>
        <Button
          v-if="reservasSeleccionadas.length > 0"
          :label="`Confirmar pago efectivo (${reservasSeleccionadas.length})`"
          icon="pi pi-check"
          severity="success"
          size="small"
          @click="confirmarPagosEfectivoMultiple"
          :loading="confirmandoPagos"
        />
      </div>

      <div v-if="loading" class="flex justify-content-center py-5">
        <ProgressSpinner />
      </div>
      <template v-else>
        <div v-if="reservas.length === 0" class="text-center py-4 text-gray-400">
          No hay reservas para mostrar
        </div>
        <div v-else class="mobile-card-list">
          <MobileRecordCard
            v-for="item in paginatedReservas"
            :key="item.id"
            :title="item.espacioNombre"
            :subtitle="`${item.socioNombre} · ${formatDate(item.fecha)}`"
          >
            <template #leading>
              <Tag :value="item.espacioTipo" :severity="getTipoSeverity(item.espacioTipo)" size="small" />
            </template>
            <template #tags>
              <Tag :severity="getEstadoSeverity(item.estado)" :value="item.estado" />
            </template>
            <template #body>
              <div class="record-card__row">
                <span class="record-card__label">Horario</span>
                <span class="record-card__value">{{ item.horaInicio }} - {{ item.horaFin }}</span>
              </div>
              <div class="record-card__row">
                <span class="record-card__label">Monto</span>
                <span class="record-card__value font-bold">${{ item.monto?.toLocaleString() }}</span>
              </div>
              <div class="pago-cell">
                <span class="pago-status" :class="`pago-${item.estadoPago?.toLowerCase()}`">
                  <i class="pago-dot"></i>{{ item.estadoPago }}
                </span>
                <span v-if="item.metodoPago" class="pago-metodo">
                  <i :class="getMetodoPagoIcon(item.metodoPago)" class="mr-1"></i>{{ item.metodoPago }}
                </span>
              </div>
            </template>
            <template #actions>
              <Checkbox
                v-if="canSelectForPayment(item)"
                :modelValue="reservasSeleccionadas.some(r => r.id === item.id)"
                :binary="true"
                @update:modelValue="val => toggleReservaSeleccion(item, val)"
              />
              <Button v-if="item.estado === 'pendiente'" icon="pi pi-thumbs-up" text rounded size="small" severity="success" @click="aprobarReserva(item)" v-tooltip.top="'Aprobar reserva'" />
              <Button v-if="item.estado === 'pendiente'" icon="pi pi-thumbs-down" text rounded size="small" severity="danger" @click="openRechazo(item)" v-tooltip.top="'Rechazar reserva'" />
              <Button v-if="item.estado === 'confirmada'" icon="pi pi-check" text rounded size="small" severity="success" @click="confirmarReserva(item)" v-tooltip.top="'Confirmar'" />
              <Button v-if="item.estadoPago === 'pendiente' && item.metodoPago === 'efectivo'" icon="pi pi-money-bill" text rounded size="small" severity="success" @click="confirmarPagoEfectivo(item)" v-tooltip.top="'Confirmar pago efectivo'" />
              <Button v-if="item.estado !== 'cancelada' && item.estado !== 'completada'" icon="pi pi-times" text rounded size="small" severity="warning" @click="cancelarReserva(item)" v-tooltip.top="'Cancelar'" />
              <Button v-if="item.estado === 'confirmada'" icon="pi pi-flag" text rounded size="small" severity="info" @click="completarReserva(item)" v-tooltip.top="'Completar'" />
              <Button icon="pi pi-trash" text rounded size="small" severity="danger" @click="confirmDelete(item)" v-tooltip.top="'Eliminar'" />
            </template>
          </MobileRecordCard>
        </div>
        <MobilePaginator v-model:page="currentPage" :rows="10" :total="reservas.length" />
      </template>
    </div>

    <!-- Dialog de Reservas Pendientes de Efectivo -->
    <Dialog 
      v-model:visible="pendientesEfectivoDialog" 
      header="Reservas Pendientes de Pago en Efectivo" 
      :modal="true"
      :style="{ width: '700px' }"
    >
      <DataTable 
        :value="reservasPendientesEfectivo" 
        v-model:selection="reservasParaConfirmar"
        dataKey="id"
        responsiveLayout="scroll"
      >
        <Column selectionMode="multiple" headerStyle="width: 3rem"></Column>
        <Column field="socioNombre" header="Socio"></Column>
        <Column field="espacioNombre" header="Espacio"></Column>
        <Column header="Fecha">
          <template #body="slotProps">
            {{ formatDate(slotProps.data.fecha) }}
          </template>
        </Column>
        <Column header="Monto">
          <template #body="slotProps">
            ${{ slotProps.data.monto?.toLocaleString() }}
          </template>
        </Column>
      </DataTable>

      <template #footer>
        <Button label="Cancelar" icon="pi pi-times" text @click="pendientesEfectivoDialog = false" />
        <Button 
          :label="`Confirmar pagos (${reservasParaConfirmar.length})`" 
          icon="pi pi-check" 
          @click="confirmarPagosSeleccionados"
          :loading="confirmandoPagos"
          :disabled="reservasParaConfirmar.length === 0"
        />
      </template>
    </Dialog>

    <!-- Dialog Rechazo de Reserva -->
    <Dialog 
      v-model:visible="rechazoDialog" 
      header="Rechazar Reserva" 
      :modal="true"
      :style="{ width: '450px' }"
    >
      <div class="flex flex-column gap-3 pt-2">
        <p class="text-gray-300 m-0">
          Rechazando reserva de <strong>{{ reservaEnProceso?.socioNombre }}</strong> para el 
          <strong>{{ reservaEnProceso ? formatDate(reservaEnProceso.fecha) : '' }}</strong>
          en <strong>{{ reservaEnProceso?.espacioNombre }}</strong>.
        </p>        <div class="field">
          <label class="font-medium text-gray-300 mb-2 block">Motivo de rechazo *</label>
          <Textarea 
            v-model="motivoRechazo" 
            rows="3" 
            class="w-full" 
            placeholder="Explique el motivo del rechazo..."
            :class="{ 'p-invalid': rechazoSubmitted && !motivoRechazo }"
          />
          <small v-if="rechazoSubmitted && !motivoRechazo" class="p-error">El motivo es requerido</small>
        </div>
      </div>
      <template #footer>
        <Button label="Cancelar" icon="pi pi-times" text @click="rechazoDialog = false" />
        <Button 
          label="Rechazar" 
          icon="pi pi-thumbs-down" 
          severity="danger"
          @click="doRechazar" 
          :loading="procesandoAprobacion"
        />
      </template>
    </Dialog><!-- Dialog Informe Mensual -->
    <Dialog
      v-model:visible="informeDialog"
      header="Informe Mensual de Reservas"
      :modal="true"
      :style="{ width: '950px' }"
    >
      <div class="flex flex-column gap-4">
        <div class="grid align-items-end">
          <div class="col-12 md:col-3">
            <label class="font-medium text-gray-300 block mb-2">Mes</label>
            <Dropdown v-model="informeFiltros.mes" :options="mesesOptions" optionLabel="label" optionValue="value" class="w-full" />
          </div>
          <div class="col-12 md:col-2">
            <label class="font-medium text-gray-300 block mb-2">Año</label>
            <Dropdown v-model="informeFiltros.anio" :options="aniosOptions" class="w-full" />
          </div>          <div class="col-12 md:col-4">
            <label class="font-medium text-gray-300 block mb-2">Espacio (opcional)</label>
            <Dropdown
              v-model="informeFiltros.espacioId"
              :options="espaciosFiltroOpciones"
              optionLabel="nombre"
              optionValue="id"
              placeholder="Todos los espacios"
              class="w-full"
              showClear
              :disabled="espacioForzado && misEspacios.length === 1"
            />
            <small v-if="espacioForzado" class="text-orange-400"><i class="pi pi-lock mr-1"></i>Tus espacios asignados</small>
          </div>
          <div class="col-12 md:col-3">
            <Button label="Generar informe" icon="pi pi-search" class="w-full" @click="generarInforme" :loading="loadingInforme" />
          </div>
        </div>

        <div v-if="informe">
          <div class="grid mb-3">
            <div class="col-6 md:col-2">
              <div class="surface-ground border-round p-3 text-center">
                <div class="text-2xl font-bold">{{ informe.totalReservas }}</div>
                <div class="text-sm text-color-secondary">Total</div>
              </div>
            </div>
            <div class="col-6 md:col-2">
              <div class="surface-ground border-round p-3 text-center">
                <div class="text-2xl font-bold text-green-400">{{ informe.reservasAprobadas }}</div>
                <div class="text-sm text-color-secondary">Aprobadas</div>
              </div>
            </div>
            <div class="col-6 md:col-2">
              <div class="surface-ground border-round p-3 text-center">
                <div class="text-2xl font-bold text-red-400">{{ informe.reservasRechazadas }}</div>
                <div class="text-sm text-color-secondary">Rechazadas</div>
              </div>
            </div>
            <div class="col-6 md:col-2">
              <div class="surface-ground border-round p-3 text-center">
                <div class="text-2xl font-bold text-yellow-400">{{ informe.reservasPendientes }}</div>
                <div class="text-sm text-color-secondary">Pendientes</div>
              </div>
            </div>
            <div class="col-6 md:col-2">
              <div class="surface-ground border-round p-3 text-center">
                <div class="text-xl font-bold">${{ (informe.montoTotal || 0).toLocaleString() }}</div>
                <div class="text-sm text-color-secondary">Monto Total</div>
              </div>
            </div>
            <div class="col-6 md:col-2">
              <div class="surface-ground border-round p-3 text-center">
                <div class="text-xl font-bold text-green-400">${{ (informe.montoRecaudado || 0).toLocaleString() }}</div>
                <div class="text-sm text-color-secondary">Cobrado</div>
              </div>
            </div>
          </div>

          <DataTable :value="informe.reservas" :paginator="true" :rows="10" responsiveLayout="scroll" class="p-datatable-sm">
            <Column header="Socio" sortable>
              <template #body="slotProps">
                {{ slotProps.data.socioNombre || (slotProps.data.nombreCliente + ' ' + slotProps.data.apellidoCliente) }}
              </template>
            </Column>
            <Column field="espacioNombre" header="Espacio" sortable />
            <Column header="Fecha" sortable>
              <template #body="slotProps">{{ formatDate(slotProps.data.fecha) }}</template>
            </Column>
            <Column header="Horario">
              <template #body="slotProps">{{ slotProps.data.horaInicio }} - {{ slotProps.data.horaFin }}</template>
            </Column>
            <Column header="Monto">
              <template #body="slotProps"><span class="font-bold">${{ (slotProps.data.monto || 0).toLocaleString() }}</span></template>
            </Column>
            <Column header="Estado">
              <template #body="slotProps">
                <Tag :severity="getEstadoSeverity(slotProps.data.estado)" :value="slotProps.data.estado" />
              </template>
            </Column>
            <Column header="Pago">
              <template #body="slotProps">
                <Tag :severity="getEstadoPagoSeverity(slotProps.data.estadoPago)" :value="slotProps.data.estadoPago" />
              </template>
            </Column>
          </DataTable>
        </div>

        <div v-else-if="!loadingInforme" class="text-center py-5 text-color-secondary">
          <i class="pi pi-chart-bar text-4xl mb-3 block"></i>
          Seleccioná mes, año y presioná <strong>Generar informe</strong> para ver los datos.
        </div>
      </div>      <template #footer>
        <Button label="Cerrar" icon="pi pi-times" text @click="informeDialog = false" />
        <Button v-if="informe" label="Exportar CSV" icon="pi pi-file" severity="secondary" @click="exportarCSV" />
        <Button v-if="informe" label="Exportar PDF" icon="pi pi-file-pdf" severity="danger" @click="exportarPDF" />
      </template>
    </Dialog>

    <!-- Create Dialog -->
    <Dialog 
      v-model:visible="reservaDialog" 
      header="Nueva Reserva" 
      :modal="true"
      :style="{ width: '550px' }"
    >
      <div class="flex flex-column gap-4 pt-3">
        <div class="field">
          <label for="socio" class="font-medium text-gray-300">Socio *</label>
          <Dropdown 
            id="socio"
            v-model="reserva.socioId" 
            :options="socios" 
            optionLabel="nombre" 
            optionValue="id"
            placeholder="Seleccione un socio"
            class="w-full mt-2"
            filter
            :class="{ 'p-invalid': submitted && !reserva.socioId }"
          />
          <small v-if="submitted && !reserva.socioId" class="p-error">El socio es requerido</small>
        </div>

        <div class="field">
          <label for="espacio" class="font-medium text-gray-300">Espacio *</label>
          <Dropdown 
            id="espacio"
            v-model="reserva.espacioId" 
            :options="espaciosActivos" 
            optionLabel="nombre" 
            optionValue="id"
            placeholder="Seleccione un espacio"
            class="w-full mt-2"
            :class="{ 'p-invalid': submitted && !reserva.espacioId }"
            @change="onEspacioChange"
          />
          <small v-if="submitted && !reserva.espacioId" class="p-error">El espacio es requerido</small>
        </div>

        <div class="field">
          <label for="fecha" class="font-medium text-gray-300">Fecha *</label>
          <Calendar 
            id="fecha"
            v-model="reserva.fecha" 
            dateFormat="dd/mm/yy" 
            class="w-full mt-2" 
            :minDate="new Date()"
            showIcon
            :class="{ 'p-invalid': submitted && !reserva.fecha }"
            @date-select="loadTurnos"
          />
          <small v-if="submitted && !reserva.fecha" class="p-error">La fecha es requerida</small>
        </div>        <div class="field" v-if="turnos.length > 0">
          <label class="font-medium text-gray-300">Turno Disponible *</label>
          <!-- Salón: mostrar tarjetas de turno con etiqueta y precio -->
          <div v-if="espacioSeleccionado?.tipoReserva === 'PorTurno'" class="flex flex-column gap-2 mt-2">
            <div
              v-for="turno in turnos"
              :key="turno.horaInicio"
              class="turno-salon-card p-3 border-round cursor-pointer"
              :class="{ 
                'selected': reserva.horaInicio === turno.horaInicio,
                'disabled': !turno.disponible
              }"
              @click="turno.disponible && selectTurno(turno)"
            >
              <div class="flex justify-content-between align-items-center">
                <div>
                  <div class="font-bold">{{ turno.etiqueta }}</div>
                  <small class="text-gray-400">{{ turno.horaInicio }} - {{ turno.horaFin }}</small>
                </div>
                <div class="text-right">
                  <div v-if="turno.precio" class="font-bold text-primary">${{ turno.precio.toLocaleString() }}</div>
                  <Tag v-if="!turno.disponible" severity="danger" value="Ocupado" size="small" />
                  <i v-else-if="reserva.horaInicio === turno.horaInicio" class="pi pi-check-circle text-primary text-xl"></i>
                </div>
              </div>
            </div>
          </div>
          <!-- Cancha: botones por hora -->
          <div v-else class="grid mt-2">
            <div v-for="turno in turnos" :key="turno.horaInicio" class="col-4 md:col-3">
              <Button 
                :label="turno.horaInicio"
                :severity="getTurnoSeverity(turno)"
                :outlined="reserva.horaInicio !== turno.horaInicio"
                :disabled="!turno.disponible"
                class="w-full"
                @click="selectTurno(turno)"
              />
            </div>
          </div>
          <small v-if="submitted && !reserva.horaInicio" class="p-error">Seleccione un turno</small>
        </div>

        <div class="field" v-if="espacioSeleccionado && reserva.horaInicio">
          <div class="surface-ground border-round p-3">
            <div class="flex justify-content-between align-items-center">
              <span class="text-gray-300">Precio estimado:</span>
              <span class="text-xl font-bold text-primary">${{ calcularPrecio().toLocaleString() }}</span>
            </div>
          </div>
        </div>

        <div class="field">
          <label for="observaciones" class="font-medium text-gray-300">Observaciones</label>
          <Textarea id="observaciones" v-model="reserva.observaciones" rows="2" class="w-full mt-2" />
        </div>
      </div>

      <template #footer>
        <Button label="Cancelar" icon="pi pi-times" text @click="hideDialog" />
        <Button label="Crear Reserva" icon="pi pi-check" @click="saveReserva" :loading="saving" />
      </template>
    </Dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, nextTick } from 'vue'
import { useToast } from 'primevue/usetoast'
import { useConfirm } from 'primevue/useconfirm'
import { useAuthStore } from '@/stores/auth'
import { reservasService, espaciosService, sociosService } from '@/services'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { openWhatsApp } from '@/platform/external'
import { savePdfDocument, downloadTextFile } from '@/platform/files'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Button from 'primevue/button'
import Checkbox from 'primevue/checkbox'
import ProgressSpinner from 'primevue/progressspinner'
import PageHeader from '@/components/mobile/PageHeader.vue'
import MobileRecordCard from '@/components/mobile/MobileRecordCard.vue'
import MobilePaginator from '@/components/mobile/MobilePaginator.vue'
import Dialog from 'primevue/dialog'
import Dropdown from 'primevue/dropdown'
import Calendar from 'primevue/calendar'
import Textarea from 'primevue/textarea'
import Tag from 'primevue/tag'

const toast = useToast()
const confirm = useConfirm()
const authStore = useAuthStore()

const reservas = ref([])
const espacios = ref([])
const socios = ref([])
const turnos = ref([])
const loading = ref(false)
const reservaDialog = ref(false)
const submitted = ref(false)
const saving = ref(false)
const resumenPagos = ref(null)
const reservasSeleccionadas = ref([])
const confirmandoPagos = ref(false)
const currentPage = ref(1)

const paginatedReservas = computed(() => {
  const start = (currentPage.value - 1) * 10
  return reservas.value.slice(start, start + 10)
})

function toggleReservaSeleccion(item, selected) {
  if (selected) {
    if (!reservasSeleccionadas.value.some(r => r.id === item.id)) {
      reservasSeleccionadas.value = [...reservasSeleccionadas.value, item]
    }
  } else {
    reservasSeleccionadas.value = reservasSeleccionadas.value.filter(r => r.id !== item.id)
  }
}

// Espacio forzado para admins no-master
const espacioForzado = ref(false)

// Dialog de pendientes efectivo
const pendientesEfectivoDialog = ref(false)
const reservasParaConfirmar = ref([])

// Aprobación de reservas
const rechazoDialog = ref(false)
const motivoRechazo = ref('')
const rechazoSubmitted = ref(false)
const procesandoAprobacion = ref(false)
const reservaEnProceso = ref(null)

// Dialog confirmación WhatsApp

// Informe mensual
const informeDialog = ref(false)
const loadingInforme = ref(false)
const informe = ref(null)
const informeFiltros = ref({
  mes: new Date().getMonth() + 1,
  anio: new Date().getFullYear(),
  espacioId: null
})
const mesesOptions = [
  { label: 'Enero', value: 1 }, { label: 'Febrero', value: 2 }, { label: 'Marzo', value: 3 },
  { label: 'Abril', value: 4 }, { label: 'Mayo', value: 5 }, { label: 'Junio', value: 6 },
  { label: 'Julio', value: 7 }, { label: 'Agosto', value: 8 }, { label: 'Septiembre', value: 9 },
  { label: 'Octubre', value: 10 }, { label: 'Noviembre', value: 11 }, { label: 'Diciembre', value: 12 }
]
const aniosOptions = computed(() => {
  const y = new Date().getFullYear()
  return [y - 2, y - 1, y, y + 1]
})

const filtros = ref({
  socioId: null,
  espacioId: null,
  estado: null,
  estadoPago: null,
  fechaDesde: null,
  fechaHasta: null
})

const estadosReserva = ref([
  { label: 'Pendiente', value: 'pendiente' },
  { label: 'Confirmada', value: 'confirmada' },
  { label: 'Cancelada', value: 'cancelada' },
  { label: 'Completada', value: 'completada' }
])

const estadosPago = ref([
  { label: 'Pendiente', value: 'pendiente' },
  { label: 'Pagado', value: 'pagado' },
  { label: 'Vencido', value: 'vencido' },
  { label: 'Cancelado', value: 'cancelado' }
])

const reserva = ref({})

const espaciosActivos = computed(() => espacios.value.filter(e => e.activo))

const misEspacios = computed(() => {
  const user = authStore.user
  if (!user || user.rol === 'master') return []

  // Espacios asignados directamente (N:M)
  const porAsignacion = espacios.value.filter(e =>
    e.adminsAsignados?.some(a => a.adminId === user.id)
  )

  // Espacios por deporte asignado al admin
  const porDeporte = user.deporte
    ? espacios.value.filter(e => e.deporte === user.deporte)
    : []

  // Unión sin duplicados
  const ids = new Set([...porAsignacion.map(e => e.id), ...porDeporte.map(e => e.id)])
  return espacios.value.filter(e => ids.has(e.id))
})

const espaciosFiltroOpciones = computed(() =>
  espacioForzado.value ? misEspacios.value : espacios.value
)

const espacioSeleccionado = computed(() => 
  espacios.value.find(e => e.id === reserva.value.espacioId)
)

const reservasPendientesEfectivo = computed(() => 
  reservas.value.filter(r => r.estadoPago === 'pendiente' && r.metodoPago === 'efectivo')
)

const reservasPendientesAprobacion = computed(() =>
  reservas.value.filter(r => r.estado === 'pendiente')
)

function canSelectForPayment(data) {
  return data.estadoPago === 'pendiente' && data.metodoPago === 'efectivo'
}

function getTipoSeverity(tipo) {
  const severities = {
    'Cancha de Pádel': 'info',
    'Cancha de Tenis': 'success',
    'Cancha de Fútbol': 'warning',
    'Piscina': 'info'
  }
  return severities[tipo] || 'secondary'
}

function getEstadoSeverity(estado) {
  const severities = {
    'pendiente': 'warning',
    'confirmada': 'success',
    'cancelada': 'danger',
    'completada': 'info'
  }
  return severities[estado] || 'secondary'
}

function getEstadoPagoSeverity(estado) {
  const severities = {
    'pendiente': 'warning',
    'pagado': 'success',
    'vencido': 'danger',
    'cancelado': 'secondary'
  }
  return severities[estado] || 'secondary'
}

function getMetodoPagoIcon(metodo) {
  return metodo === 'mercadoPago' ? 'pi pi-credit-card' : 'pi pi-money-bill'
}

function getTurnoSeverity(turno) {
  if (!turno.disponible) return 'secondary'
  if (reserva.value.horaInicio === turno.horaInicio) return 'success'
  return 'primary'
}

function formatDate(date) {
  return new Date(date).toLocaleDateString('es-AR')
}

function formatDateForApi(date) {
  if (!date) return null
  const d = new Date(date)
  return d.toISOString().split('T')[0]
}

async function loadReservas() {
  loading.value = true
  try {
    const params = {}
    if (filtros.value.socioId) params.socioId = filtros.value.socioId
    if (filtros.value.espacioId) params.espacioId = filtros.value.espacioId
    if (filtros.value.estado) params.estado = filtros.value.estado
    if (filtros.value.estadoPago) params.estadoPago = filtros.value.estadoPago
    if (filtros.value.fechaDesde) params.fechaDesde = formatDateForApi(filtros.value.fechaDesde)
    if (filtros.value.fechaHasta) params.fechaHasta = formatDateForApi(filtros.value.fechaHasta)
    
    reservas.value = await reservasService.getAll(params)
    reservasSeleccionadas.value = []
  } catch (error) {
    toast.add({ severity: 'error', summary: 'Error', detail: 'No se pudieron cargar las reservas', life: 3000 })
  } finally {
    loading.value = false
  }
}

async function loadResumenPagos() {
  try {
    resumenPagos.value = await reservasService.getResumenPagos()
  } catch (error) {
    console.error('Error loading resumen:', error)
  }
}

async function loadEspacios() {
  try {
    espacios.value = await espaciosService.getAll()
  } catch (error) {
    console.error('Error loading espacios:', error)
  }
}

async function loadSocios() {
  try {
    socios.value = await sociosService.getAll()
  } catch (error) {
    console.error('Error loading socios:', error)
  }
}

async function loadTurnos() {
  if (!reserva.value.espacioId || !reserva.value.fecha) {
    turnos.value = []
    return
  }
  
  try {
    const fecha = formatDateForApi(reserva.value.fecha)
    turnos.value = await espaciosService.getTurnosDisponibles(reserva.value.espacioId, fecha)
    reserva.value.horaInicio = null
    reserva.value.horaFin = null
  } catch (error) {
    toast.add({ severity: 'error', summary: 'Error', detail: 'No se pudieron cargar los turnos', life: 3000 })
  }
}

function onEspacioChange() {
  turnos.value = []
  reserva.value.horaInicio = null
  reserva.value.horaFin = null
  if (reserva.value.fecha) {
    loadTurnos()
  }
}

function selectTurno(turno) {
  if (!turno.disponible) return
  reserva.value.horaInicio = turno.horaInicio
  reserva.value.horaFin = turno.horaFin
}

function calcularPrecio() {
  if (!espacioSeleccionado.value || !reserva.value.horaInicio || !reserva.value.horaFin) return 0
  
  // Salón: usar precio del turno seleccionado
  if (espacioSeleccionado.value.tipoReserva === 'PorTurno') {
    const turnoSel = turnos.value.find(t => t.horaInicio === reserva.value.horaInicio)
    return turnoSel?.precio || 0
  }

  // Cancha: precio fijo por reserva
  return espacioSeleccionado.value.precioPorHora || 0
}

function openNew() {
  reserva.value = {}
  turnos.value = []
  submitted.value = false
  reservaDialog.value = true
}

function hideDialog() {
  reservaDialog.value = false
  submitted.value = false
}

async function saveReserva() {
  submitted.value = true

  if (!reserva.value.socioId || !reserva.value.espacioId || !reserva.value.fecha || !reserva.value.horaInicio) {
    return
  }

  saving.value = true
  try {
    await reservasService.createAdmin({
      socioId: reserva.value.socioId,
      espacioId: reserva.value.espacioId,
      fecha: formatDateForApi(reserva.value.fecha),
      horaInicio: reserva.value.horaInicio,
      horaFin: reserva.value.horaFin,
      observaciones: reserva.value.observaciones
    })
    toast.add({ severity: 'success', summary: 'Éxito', detail: 'Reserva creada', life: 3000 })
    hideDialog()
    await loadReservas()
    await loadResumenPagos()
  } catch (error) {
    toast.add({ 
      severity: 'error', 
      summary: 'Error', 
      detail: error.response?.data?.message || 'Error al crear la reserva', 
      life: 3000 
    })
  } finally {
    saving.value = false
  }
}

async function confirmarReserva(data) {
  try {
    await reservasService.updateEstado(data.id, { estado: 'confirmada' })
    toast.add({ severity: 'success', summary: 'Éxito', detail: 'Reserva confirmada', life: 3000 })
    await loadReservas()
    await loadResumenPagos()
  } catch (error) {
    toast.add({ severity: 'error', summary: 'Error', detail: 'No se pudo confirmar la reserva', life: 3000 })
  }
}

async function cancelarReserva(data) {
  confirm.require({
    message: '¿Está seguro de cancelar esta reserva?',
    header: 'Confirmar cancelación',
    icon: 'pi pi-exclamation-triangle',
    acceptClass: 'p-button-warning',    accept: async () => {
      try {
        await reservasService.updateEstado(data.id, { estado: 'cancelada', observaciones: 'Cancelada por administrador' })
        toast.add({ severity: 'success', summary: 'Éxito', detail: 'Reserva cancelada', life: 3000 })
        await loadReservas()
        await loadResumenPagos()
      } catch (error) {
        toast.add({ severity: 'error', summary: 'Error', detail: 'No se pudo cancelar la reserva', life: 3000 })
      }
    }
  })
}

async function completarReserva(data) {
  try {
    await reservasService.updateEstado(data.id, { estado: 'completada' })
    toast.add({ severity: 'success', summary: 'Éxito', detail: 'Reserva completada', life: 3000 })
    await loadReservas()
  } catch (error) {
    toast.add({ severity: 'error', summary: 'Error', detail: 'No se pudo completar la reserva', life: 3000 })
  }
}

function confirmDelete(data) {
  confirm.require({
    message: '¿Está seguro de eliminar esta reserva?',
    header: 'Confirmar eliminación',
    icon: 'pi pi-exclamation-triangle',
    acceptClass: 'p-button-danger',
    accept: async () => {
      try {
        await reservasService.delete(data.id)
        toast.add({ severity: 'success', summary: 'Éxito', detail: 'Reserva eliminada', life: 3000 })
        await loadReservas()
        await loadResumenPagos()
      } catch (error) {
        toast.add({ severity: 'error', summary: 'Error', detail: 'No se pudo eliminar la reserva', life: 3000 })
      }
    }
  })
}

// Funciones de pago
function mostrarPendientesEfectivo() {
  reservasParaConfirmar.value = []
  pendientesEfectivoDialog.value = true
}

async function confirmarPagoEfectivo(data) {
  confirm.require({
    message: `¿Confirmar el pago en efectivo de $${data.monto?.toLocaleString()} de ${data.socioNombre}?`,
    header: 'Confirmar pago',
    icon: 'pi pi-money-bill',
    acceptClass: 'p-button-success',
    accept: async () => {
      try {
        await reservasService.confirmarPagoEfectivo([data.id])
        toast.add({ severity: 'success', summary: 'Éxito', detail: 'Pago confirmado', life: 3000 })
        await loadReservas()
        await loadResumenPagos()
      } catch (error) {
        toast.add({ severity: 'error', summary: 'Error', detail: 'No se pudo confirmar el pago', life: 3000 })
      }
    }
  })
}

async function confirmarPagosSeleccionados() {
  if (reservasParaConfirmar.value.length === 0) return

  confirmandoPagos.value = true
  try {
    const ids = reservasParaConfirmar.value.map(r => r.id)
    await reservasService.confirmarPagoEfectivo(ids)
    toast.add({ 
      severity: 'success', 
      summary: 'Éxito', 
      detail: `${ids.length} pagos confirmados`, 
      life: 3000 
    })
    pendientesEfectivoDialog.value = false
    await loadReservas()
    await loadResumenPagos()
  } catch (error) {
    toast.add({ severity: 'error', summary: 'Error', detail: 'No se pudieron confirmar los pagos', life: 3000 })
  } finally {
    confirmandoPagos.value = false
  }
}

async function confirmarPagosEfectivoMultiple() {
  if (reservasSeleccionadas.value.length === 0) return

  confirmandoPagos.value = true
  try {
    const ids = reservasSeleccionadas.value.map(r => r.id)
    await reservasService.confirmarPagoEfectivo(ids)
    toast.add({ 
      severity: 'success', 
      summary: 'Éxito', 
      detail: `${ids.length} pagos confirmados`, 
      life: 3000 
    })
    await loadReservas()
    await loadResumenPagos()
  } catch (error) {
    toast.add({ severity: 'error', summary: 'Error', detail: 'No se pudieron confirmar los pagos', life: 3000 })
  } finally {
    confirmandoPagos.value = false
  }
}

async function aprobarReserva(data) {
  procesandoAprobacion.value = true
  const nombre = data.socioNombre || data.nombreCliente || 'socio'
  try {
    await reservasService.aprobar(data.id, true, '')
    toast.add({ severity: 'success', summary: 'Aprobada', detail: `Reserva de ${nombre} aprobada`, life: 3000 })
    await loadReservas()
    await loadResumenPagos()
  } catch (error) {
    toast.add({ severity: 'error', summary: 'Error', detail: 'No se pudo aprobar la reserva', life: 3000 })
  } finally {
    procesandoAprobacion.value = false
  }
}

function openRechazo(data) {
  reservaEnProceso.value = data
  motivoRechazo.value = ''
  rechazoSubmitted.value = false
  rechazoDialog.value = true
}

async function doRechazar() {
  rechazoSubmitted.value = true
  if (!motivoRechazo.value) return

  procesandoAprobacion.value = true
  const data = reservaEnProceso.value
  const motivo = motivoRechazo.value
  try {
    await reservasService.aprobar(data.id, false, motivo)
    toast.add({ severity: 'info', summary: 'Rechazada', detail: 'Reserva rechazada correctamente', life: 3000 })
    rechazoDialog.value = false
    await loadReservas()
    await loadResumenPagos()
  } catch (error) {
    toast.add({ severity: 'error', summary: 'Error', detail: 'No se pudo rechazar la reserva', life: 3000 })
  } finally {
    procesandoAprobacion.value = false
  }
}

// Abre WhatsApp con el número y mensaje
function openWA(telefono, texto) {
  if (!telefono) return
  const num = normalizarTelefonoAR(String(telefono))
  if (!num) return
  openWhatsApp(num, texto)
}

/**
 * Normaliza un número de teléfono argentino al formato internacional para wa.me.
 * Reglas:
 *  - Celulares: 549 + código de área (sin 0) + número (sin 15)
 *  - Fijos/business: 54 + código de área (sin 0) + número
 * Ejemplos:
 *  "03533-15-680908" → "5493533680908"
 *  "3533-680908"    → "543533680908"
 *  "+543533680908"  → "543533680908"
 *  "543533680908"   → "543533680908"  (ya internacional)
 */
function normalizarTelefonoAR(telefono) {
  // Dejar solo dígitos
  let num = telefono.replace(/\D/g, '')
  if (!num) return ''

  // Ya tiene código de país completo (54...)
  if (num.startsWith('54')) return num

  // Quitar 0 inicial del código de área
  if (num.startsWith('0')) num = num.slice(1)

  // Detectar 15 de celular: el 15 aparece después del código de área (2-4 dígitos)
  // Los códigos de área en AR tienen entre 2 y 4 dígitos; el número local tiene 6-8 dígitos
  // Formato con 15: AAAA15NNNNNN (10 dígitos aprox)
  const match15 = num.match(/^(\d{2,4})15(\d{6,8})$/)
  if (match15) {
    // Celular con 15: 549 + área + número
    return '549' + match15[1] + match15[2]
  }

  // Sin 15: asumir fijo/business o celular ya sin 15
  // 10 dígitos = área(3-4) + número(6-7) → fijo
  return '54' + num
}

// ── Informe Mensual ────────────────────────────────────────────────────────────
function openInformeDialog() {
  informe.value = null
  if (espacioForzado.value) informeFiltros.value.espacioId = filtros.value.espacioId
  informeDialog.value = true
}

async function generarInforme() {
  loadingInforme.value = true
  try {
    informe.value = await reservasService.getInforme(
      informeFiltros.value.mes,
      informeFiltros.value.anio,
      informeFiltros.value.espacioId || null
    )
  } catch (error) {
    toast.add({ severity: 'error', summary: 'Error', detail: 'No se pudo generar el informe', life: 3000 })
  } finally {
    loadingInforme.value = false
  }
}

function exportarCSV() {
  if (!informe.value) return
  const nombreMes = mesesOptions.find(m => m.value === informeFiltros.value.mes)?.label || informeFiltros.value.mes
  const header = ['Socio', 'Email', 'Espacio', 'Fecha', 'Hora Inicio', 'Hora Fin', 'Monto', 'Estado', 'Estado Pago', 'Método Pago']
  const rows = informe.value.reservas.map(r => [
    r.socioNombre || `${r.nombreCliente || ''} ${r.apellidoCliente || ''}`.trim(),
    r.socioEmail || r.emailCliente || '',
    r.espacioNombre,
    formatDate(r.fecha),
    r.horaInicio,
    r.horaFin,
    r.monto,
    r.estado,
    r.estadoPago,
    r.metodoPago || ''
  ])
  const csv = [header, ...rows].map(row => row.map(v => `"${v}"`).join(',')).join('\n')
  downloadTextFile(
    '\uFEFF' + csv,
    `informe-reservas-${nombreMes}-${informeFiltros.value.anio}.csv`
  )
}

function exportarPDF() {
  if (!informe.value) return
  const nombreMes = mesesOptions.find(m => m.value === informeFiltros.value.mes)?.label || informeFiltros.value.mes
  const anio = informeFiltros.value.anio
  const espacioLabel = informeFiltros.value.espacioId
    ? (espaciosFiltroOpciones.value.find(e => e.id === informeFiltros.value.espacioId)?.nombre || 'Todos')
    : 'Todos los espacios'

  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' })

  // ── Encabezado ──────────────────────────────────────────────────
  doc.setFillColor(30, 30, 46)
  doc.rect(0, 0, 297, 28, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(18)
  doc.setFont('helvetica', 'bold')
  doc.text('Informe Mensual de Reservas', 14, 11)
  doc.setFontSize(11)
  doc.setFont('helvetica', 'normal')
  doc.text(`Período: ${nombreMes} ${anio}   |   Espacio: ${espacioLabel}`, 14, 20)
  doc.setFontSize(9)
  doc.text(`Generado: ${new Date().toLocaleDateString('es-AR')}`, 257, 20, { align: 'right' })

  // ── Resumen ──────────────────────────────────────────────────────
  doc.setTextColor(30, 30, 46)
  doc.setFontSize(10)
  doc.setFont('helvetica', 'bold')
  const resumenY = 35
  const stats = [
    ['Total', informe.value.totalReservas],
    ['Aprobadas', informe.value.reservasAprobadas],
    ['Rechazadas', informe.value.reservasRechazadas],
    ['Pendientes', informe.value.reservasPendientes],
    ['Monto Total', `$${(informe.value.montoTotal || 0).toLocaleString('es-AR')}`],
    ['Cobrado', `$${(informe.value.montoRecaudado || 0).toLocaleString('es-AR')}`],
  ]
  const boxW = 44, boxH = 14, gap = 4, startX = 14
  stats.forEach(([label, val], i) => {
    const x = startX + i * (boxW + gap)
    doc.setFillColor(245, 245, 250)
    doc.roundedRect(x, resumenY, boxW, boxH, 2, 2, 'F')
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(13)
    doc.setTextColor(30, 30, 46)
    doc.text(String(val), x + boxW / 2, resumenY + 8, { align: 'center' })
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8)
    doc.setTextColor(100, 100, 120)
    doc.text(label, x + boxW / 2, resumenY + 12.5, { align: 'center' })
  })

  // ── Tabla de reservas ────────────────────────────────────────────
  const rows = informe.value.reservas.map((r, i) => [
    i + 1,
    r.socioNombre || `${r.nombreCliente || ''} ${r.apellidoCliente || ''}`.trim(),
    r.socioEmail || r.emailCliente || '-',
    r.espacioNombre,
    formatDate(r.fecha),
    `${r.horaInicio} - ${r.horaFin}`,
    `$${(r.monto || 0).toLocaleString('es-AR')}`,
    r.estado,
    r.estadoPago,
    r.metodoPago || '-',
  ])

  autoTable(doc, {
    startY: resumenY + boxH + 8,
    head: [['#', 'Socio', 'Email', 'Espacio', 'Fecha', 'Horario', 'Monto', 'Estado', 'Pago', 'Método']],
    body: rows,
    theme: 'grid',
    headStyles: { fillColor: [30, 30, 46], textColor: 255, fontStyle: 'bold', fontSize: 9 },
    bodyStyles: { fontSize: 8, textColor: [30, 30, 46] },
    alternateRowStyles: { fillColor: [248, 248, 252] },
    columnStyles: {
      0: { halign: 'center', cellWidth: 8 },
      6: { halign: 'right', fontStyle: 'bold' },
      7: { halign: 'center' },
      8: { halign: 'center' },
      9: { halign: 'center' },
    },
    didDrawCell(data) {
      if (data.section === 'body' && data.column.index === 7) {
        const val = String(data.cell.raw).toLowerCase()
        if (val === 'confirmada') doc.setTextColor(34, 197, 94)
        else if (val === 'cancelada') doc.setTextColor(239, 68, 68)
        else if (val === 'pendiente') doc.setTextColor(234, 179, 8)
        else doc.setTextColor(30, 30, 46)
        doc.setFontSize(8)
        doc.text(String(data.cell.raw), data.cell.x + data.cell.width / 2, data.cell.y + data.cell.height / 2 + 1, { align: 'center' })
      }
    },
    margin: { left: 14, right: 14 },
  })

  // ── Pie de página ────────────────────────────────────────────────
  const pageCount = doc.getNumberOfPages()
  for (let p = 1; p <= pageCount; p++) {
    doc.setPage(p)
    doc.setFontSize(8)
    doc.setTextColor(150)
    doc.text(`Página ${p} de ${pageCount}`, 148, 205, { align: 'center' })
  }

  savePdfDocument(doc, `informe-reservas-${nombreMes}-${anio}.pdf`)
}

// ── Space filter for non-master admins ────────────────────────────────────────
function aplicarFiltroEspacio() {
  const user = authStore.user
  if (!user || user.rol === 'master') return

  // Buscar los espacios asignados a este admin via N:M (adminsAsignados en cada espacio)
  const misEspacios = espacios.value.filter(e =>
    e.adminsAsignados?.some(a => a.adminId === user.id)
  )

  if (misEspacios.length === 0) return

  if (misEspacios.length === 1) {
    filtros.value.espacioId = misEspacios[0].id
  }
  espacioForzado.value = true
}

onMounted(async () => {
  await Promise.all([loadEspacios(), loadSocios(), loadResumenPagos()])
  aplicarFiltroEspacio()
  await loadReservas()
})
</script>

<style scoped>
/* Pago cell */
.pago-cell { display: flex; flex-direction: column; gap: 3px; }
.pago-status { display: flex; align-items: center; gap: 5px; font-size: 0.82rem; font-weight: 600; }
.pago-dot { width: 7px; height: 7px; border-radius: 50%; flex-shrink: 0; background: currentColor; }
.pago-pendiente { color: #f59e0b; }
.pago-pagado { color: #22c55e; }
.pago-vencido { color: #ef4444; }
.pago-cancelado { color: var(--text-color-secondary); }
.pago-metodo { font-size: 0.72rem; color: var(--text-color-secondary); }
.pago-fecha { font-size: 0.7rem; color: var(--text-color-secondary); opacity: 0.7; }

/* Stat cards */
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
}

.stat-icon i {
  font-size: 1.5rem;
  color: white;
}

.stat-total .stat-icon { background: linear-gradient(135deg, #6366f1, #8b5cf6); }
.stat-success .stat-icon { background: linear-gradient(135deg, #22c55e, #16a34a); }
.stat-warning .stat-icon { background: linear-gradient(135deg, #f59e0b, #d97706); }
.stat-efectivo .stat-icon { background: linear-gradient(135deg, #3b82f6, #2563eb); }
.stat-aprobacion .stat-icon { background: linear-gradient(135deg, #ec4899, #be185d); }

.stat-content {
  display: flex;
  flex-direction: column;
}

.stat-value {
  font-size: 1.75rem;
  font-weight: 700;
  color: var(--text-color);
}

.stat-label {
  font-size: 0.85rem;
  color: var(--text-color-secondary);
}

.stat-amount {
  font-size: 0.75rem;
  color: var(--text-color-secondary);
  margin-top: 0.25rem;
}

/* Turno Salon Cards */
.turno-salon-card {
  background: var(--surface-card);
  border: 2px solid var(--surface-border);
  border-radius: 10px;
  transition: all 0.2s ease;
  color: var(--text-color);
}

.turno-salon-card:hover:not(.disabled) {
  border-color: #dc2626;
  background: rgba(220, 38, 38, 0.07);
  transform: translateY(-1px);
}

.turno-salon-card.selected {
  border-color: #dc2626;
  background: rgba(220, 38, 38, 0.15);
  box-shadow: 0 0 12px rgba(220, 38, 38, 0.3);
}

.turno-salon-card.disabled {
  opacity: 0.45;
  cursor: not-allowed;
}
</style>
