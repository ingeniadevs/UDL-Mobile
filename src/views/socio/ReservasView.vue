<template>
  <div>
    <PageHeader title="Reservar Espacio" />

    <!-- Selección de Espacio con Imágenes -->
    <div class="grid mb-4">
      <div v-for="espacio in espacios" :key="espacio.id" class="col-12 md:col-6 lg:col-4">
        <div 
          class="espacio-card cursor-pointer h-full transition-all transition-duration-200"
          :class="{ 'selected': selectedEspacio?.id === espacio.id }"
          @click="selectEspacio(espacio)"
        >
          <!-- Imagen del espacio -->
          <div class="espacio-image-wrapper">
            <img 
              v-if="espacio.imagen" 
              :src="espacio.imagen" 
              :alt="espacio.nombre"
              class="espacio-image"
            />
            <div v-else class="espacio-placeholder">
              <i class="pi pi-building"></i>
            </div>
            
            <!-- Badge de selección -->
            <div v-if="selectedEspacio?.id === espacio.id" class="selected-badge">
              <i class="pi pi-check"></i> Seleccionado
            </div>

            <!-- Badge de aprobación -->
            <div v-if="espacio.requiereAprobacion" class="approval-badge">
              <i class="pi pi-info-circle"></i> Requiere aprobación
            </div>
          </div>

          <!-- Info del espacio -->
          <div class="espacio-info">
            <div class="flex justify-content-between align-items-start mb-2">
              <div>
                <h3 class="espacio-name">{{ espacio.nombre }}</h3>
                <Tag :value="espacio.tipo" :severity="getTipoSeverity(espacio.tipo)" class="mt-1" />
              </div>
              <div class="text-right">
                <template v-if="espacio.tipoReserva === 'PorTurno'">
                  <div class="espacio-price">
                    ${{ Math.min(...[espacio.precioTurnoManana, espacio.precioTurnoNoche, espacio.precioTodoDia].filter(p => p > 0)).toLocaleString() }}
                  </div>
                  <small class="text-gray-400">desde / turno</small>
                </template>
                <template v-else>
                  <div class="espacio-price">${{ espacio.precioPorHora?.toLocaleString() }}</div>
                  <small class="text-gray-400">precio / hora</small>
                </template>
              </div>
            </div>
            
            <p class="espacio-description">{{ espacio.descripcion || 'Sin descripción' }}</p>
            
            <div class="espacio-details">
              <div class="detail-item">
                <i class="pi pi-clock"></i>
                <span>{{ espacio.horaApertura }} - {{ espacio.horaCierre }}</span>
              </div>
              <div class="detail-item" v-if="espacio.duracionTurno">
                <i class="pi pi-stopwatch"></i>
                <span>{{ espacio.duracionTurno }} min/turno</span>
              </div>
              <div class="detail-item" v-if="espacio.capacidad">
                <i class="pi pi-users"></i>
                <span>{{ espacio.capacidad }} personas</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Panel de Reserva -->
    <div v-if="selectedEspacio" class="card reserva-panel">
      <div class="reserva-header">
        <div class="flex align-items-center gap-3">
          <div class="header-image">
            <img 
              v-if="selectedEspacio.imagen" 
              :src="selectedEspacio.imagen" 
              :alt="selectedEspacio.nombre"
            />
            <div v-else class="header-placeholder">
              <i class="pi pi-building"></i>
            </div>
          </div>
          <div>
            <h2 class="text-xl font-bold m-0" style="color: var(--text-color)">{{ selectedEspacio.nombre }}</h2>
            <Tag :value="selectedEspacio.tipo" :severity="getTipoSeverity(selectedEspacio.tipo)" class="mt-1" />
          </div>
        </div>
      </div>

      <div class="grid mt-4">
        <div class="col-12 md:col-4">
          <label class="font-medium text-gray-300 block mb-2">Selecciona una fecha</label>
          <Calendar 
            v-model="selectedDate" 
            dateFormat="dd/mm/yy" 
            class="w-full" 
            :minDate="new Date()"
            showIcon
            inline
          />
        </div>

        <div class="col-12 md:col-8">
          <label class="font-medium text-gray-300 block mb-2">Turnos disponibles</label>
          
          <div v-if="loadingTurnos" class="flex justify-content-center py-4">
            <ProgressSpinner style="width: 50px; height: 50px" />
          </div>
          
          <div v-else-if="turnos.length === 0 && selectedDate" class="text-center py-4 text-gray-400">
            <i class="pi pi-calendar-times text-4xl mb-2"></i>
            <p>No hay turnos disponibles para esta fecha</p>
          </div>

          <div v-else-if="!selectedDate" class="text-center py-4 text-gray-400">
            <i class="pi pi-calendar text-4xl mb-2"></i>
            <p>Selecciona una fecha para ver los turnos disponibles</p>
          </div>
            <div v-else class="turnos-grid">
            <!-- Salón: tarjetas de turno con etiqueta y precio -->
            <template v-if="selectedEspacio?.tipoReserva === 'PorTurno'">
              <div
                v-for="turno in turnos"
                :key="turno.horaInicio"
                class="turno-salon-card p-3 border-round cursor-pointer mb-2"
                :class="{
                  'selected': selectedTurno?.horaInicio === turno.horaInicio && selectedTurno?.horaFin === turno.horaFin,
                  'disabled-turno': !turno.disponible
                }"
                @click="turno.disponible && selectTurno(turno)"
              >
                <div class="flex justify-content-between align-items-center">
                  <div>
                    <div class="font-bold" style="color: var(--text-color)">{{ turno.etiqueta }}</div>
                    <small class="text-gray-400">{{ turno.horaInicio }} – {{ turno.horaFin }}</small>
                  </div>
                  <div class="text-right">
                    <div v-if="turno.precio" class="font-bold text-primary-400 text-lg">${{ turno.precio.toLocaleString() }}</div>
                    <Tag v-if="!turno.disponible" severity="danger" value="Ocupado" size="small" />
                    <i v-else-if="selectedTurno?.horaInicio === turno.horaInicio && selectedTurno?.horaFin === turno.horaFin" class="pi pi-check-circle text-primary-400 text-xl"></i>
                  </div>
                </div>
              </div>
            </template>
            <!-- Cancha: botones por hora -->
            <template v-else>
              <div v-for="turno in turnos" :key="turno.horaInicio" class="turno-item">
                <Button 
                  :label="turno.horaInicio + ' - ' + turno.horaFin"
                  :severity="getTurnoSeverity(turno)"
                  :outlined="selectedTurno?.horaInicio !== turno.horaInicio"
                  :disabled="!turno.disponible"
                  class="w-full"
                  @click="selectTurno(turno)"
                />
              </div>
            </template>
          </div>

          <!-- Resumen de reserva -->
          <div v-if="selectedTurno" class="resumen-reserva mt-4">
            <h3 class="text-lg font-bold mb-3" style="color: var(--text-color)">
              <i class="pi pi-bookmark mr-2"></i>Resumen de tu reserva
            </h3>
            
            <div class="grid">
              <div class="col-6">
                <div class="resumen-item">
                  <span class="label">Espacio</span>
                  <span class="value">{{ selectedEspacio.nombre }}</span>
                </div>
              </div>
              <div class="col-6">
                <div class="resumen-item">
                  <span class="label">Fecha</span>
                  <span class="value">{{ formatDate(selectedDate) }}</span>
                </div>
              </div>              <div class="col-6">
                <div class="resumen-item">
                  <span class="label">Horario</span>
                  <span class="value">
                    <template v-if="selectedEspacio?.tipoReserva === 'PorTurno'">
                      {{ selectedTurno.etiqueta }} ({{ selectedTurno.horaInicio }} - {{ selectedTurno.horaFin }})
                    </template>
                    <template v-else>
                      {{ selectedTurno.horaInicio }} - {{ selectedTurno.horaFin }}
                    </template>
                  </span>
                </div>
              </div>
              <div class="col-6">
                <div class="resumen-item">
                  <span class="label">Total a pagar</span>
                  <span class="value price">${{ calcularPrecio().toLocaleString() }}</span>
                </div>
              </div>
            </div>

            <div class="mt-3">
              <label class="font-medium text-gray-300 block mb-2">Observaciones (opcional)</label>
              <Textarea v-model="observaciones" rows="2" class="w-full" placeholder="Alguna nota adicional..." />
            </div>

            <div class="mt-4">
              <Button 
                label="Confirmar Reserva" 
                icon="pi pi-check" 
                class="w-full confirmar-btn" 
                size="large"
                @click="crearReserva"
                :loading="creatingReserva"
              />
              <small v-if="selectedEspacio.requiereAprobacion" class="approval-notice">
                <i class="pi pi-info-circle mr-1"></i>
                Esta reserva requiere aprobación del administrador
              </small>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Mis Reservas con Pagos -->
    <div class="card mt-4">
      <div class="flex align-items-center justify-content-between mb-4">        <h2 class="text-xl font-bold m-0" style="color: var(--text-color)">
          <i class="pi pi-calendar mr-2"></i>Mis Reservas
        </h2>
        <div class="flex gap-2">
          <Button 
            v-if="reservasSeleccionadas.length > 0"
            :label="`Pagar ${reservasSeleccionadas.length} reserva(s) - $${totalSeleccionado.toLocaleString()}`"
            icon="pi pi-wallet" 
            @click="abrirModalPago"
            severity="success"
          />
          <Button icon="pi pi-refresh" text rounded @click="loadMisReservas" v-tooltip.left="'Actualizar'" />
        </div>
      </div>

      <div v-if="loadingReservas" class="flex justify-content-center py-5">
        <ProgressSpinner />
      </div>
      <template v-else>
        <div v-if="misReservas.length === 0" class="text-center py-4 text-gray-400">
          <i class="pi pi-calendar-times text-4xl mb-2 block"></i>
          No tienes reservas registradas
        </div>
        <div v-else class="mobile-card-list">
          <MobileRecordCard
            v-for="item in paginatedReservas"
            :key="item.id"
            :title="item.espacioNombre"
            :subtitle="`${formatDateShort(item.fecha)} · ${item.horaInicio} - ${item.horaFin}`"
          >
            <template #leading>
              <div class="reserva-espacio-image">
                <img v-if="item.espacioImagen" :src="item.espacioImagen" :alt="item.espacioNombre" />
                <div v-else class="reserva-espacio-placeholder"><i class="pi pi-building"></i></div>
              </div>
            </template>
            <template #tags>
              <Tag :severity="getEstadoSeverity(item.estado)" :value="item.estado" />
            </template>
            <template #body>
              <Tag :value="item.espacioTipo" :severity="getTipoSeverity(item.espacioTipo)" size="small" class="mb-2" />
              <div class="record-card__row">
                <span class="record-card__label">Monto</span>
                <span class="record-card__value font-bold text-primary">${{ item.monto?.toLocaleString() }}</span>
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
              <Button
                v-if="item.estadoPago === 'pendiente' && item.estado?.toLowerCase() === 'confirmada'"
                icon="pi pi-wallet"
                text
                rounded
                size="small"
                severity="success"
                @click="pagarReservaIndividual(item)"
                v-tooltip.top="'Pagar'"
              />
              <Button
                v-if="canCancel(item)"
                icon="pi pi-times"
                text
                rounded
                size="small"
                severity="danger"
                @click="cancelarReserva(item)"
                v-tooltip.top="'Cancelar reserva'"
              />
            </template>
          </MobileRecordCard>
        </div>
        <MobilePaginator v-model:page="reservasPage" :rows="5" :total="misReservas.length" />
      </template>
    </div>

    <!-- Modal de Pago -->
    <Dialog 
      v-model:visible="pagoDialog" 
      header="Pagar Reservas" 
      :modal="true"
      :style="{ width: '500px' }"
    >
      <div class="flex flex-column gap-4 pt-3">
        <div class="surface-ground border-round p-3">
          <div class="flex justify-content-between align-items-center mb-2">
            <span class="text-gray-300">Reservas seleccionadas:</span>
            <span class="font-bold" style="color: var(--text-color)">{{ reservasAPagar.length }}</span>
          </div>
          <div class="flex justify-content-between align-items-center">
            <span class="text-gray-300">Total a pagar:</span>
            <span class="text-2xl font-bold text-primary">${{ totalAPagar.toLocaleString() }}</span>
          </div>
        </div>

        <Divider />        <div class="field">
          <label class="font-medium text-gray-300 block mb-3">
            <i class="pi pi-credit-card mr-2"></i>Selecciona el método de pago
          </label>

          <div class="payment-options">
            <div
              class="payment-option"
              :class="{ 'selected': metodoPagoSeleccionado === 'Efectivo' }"
              @click="metodoPagoSeleccionado = 'Efectivo'"
            >
              <div class="payment-icon">
                <i class="pi pi-wallet"></i>
              </div>
              <div class="payment-info">
                <span class="payment-title">Pago en Efectivo</span>
                <span class="payment-desc">Acércate al club para abonar tu reserva</span>
              </div>
              <i v-if="metodoPagoSeleccionado === 'Efectivo'" class="pi pi-check-circle text-green-400"></i>
            </div>

            <div
              class="payment-option"
              :class="{ 'selected': metodoPagoSeleccionado === 'Transferencia' }"
              @click="metodoPagoSeleccionado = 'Transferencia'"
            >
              <div class="payment-icon" style="background: #1a56db22; color: #60a5fa">
                <i class="pi pi-dollar"></i>
              </div>
              <div class="payment-info">
                <span class="payment-title">Transferencia Bancaria</span>
                <span class="payment-desc">Transferí y enviá el comprobante por WhatsApp</span>
              </div>
              <i v-if="metodoPagoSeleccionado === 'Transferencia'" class="pi pi-check-circle text-green-400"></i>
            </div>

            <div
              class="payment-option"
              :class="{ 'selected': metodoPagoSeleccionado === 'MercadoPago' }"
              @click="metodoPagoSeleccionado = 'MercadoPago'"
            >
              <div class="payment-icon mp-icon">
                <i class="pi pi-credit-card"></i>
              </div>
              <div class="payment-info">
                <span class="payment-title">MercadoPago</span>
                <span class="payment-desc">Tarjeta de débito, crédito o dinero en cuenta</span>
              </div>
              <i v-if="metodoPagoSeleccionado === 'MercadoPago'" class="pi pi-check-circle text-green-400"></i>
            </div>
          </div>
        </div>

        <Message v-if="metodoPagoSeleccionado === 'Efectivo'" severity="info" :closable="false">
          <small>Deberás acercarte al club para realizar el pago. La reserva quedará pendiente de confirmación.</small>
        </Message>

        <div v-if="metodoPagoSeleccionado === 'Transferencia'" class="transferencia-info">
          <div class="transferencia-dato">
            <span class="transferencia-label">CBU</span>
            <span class="transferencia-valor">0110332640033213198558</span>
          </div>
          <div class="transferencia-dato">
            <span class="transferencia-label">ALIAS</span>
            <span class="transferencia-valor">UDL.NACION</span>
          </div>
          <div class="transferencia-dato">
            <span class="transferencia-label">CUIT</span>
            <span class="transferencia-valor">30-70706271-8</span>
          </div>
          <div class="transferencia-dato">
            <span class="transferencia-label">Titular</span>
            <span class="transferencia-valor">Unión Deportiva Laspiur</span>
          </div>
          <Divider class="my-2" />
          <div class="flex align-items-start gap-2" style="color: #f59e0b">
            <i class="pi pi-whatsapp mt-1" style="font-size: 1.1rem"></i>
            <small>
              Una vez realizada la transferencia, enviá el comprobante al WhatsApp
              <strong>+54 9 3533 68-0908</strong> indicando tu nombre y la fecha de la reserva.
              La reserva quedará pendiente hasta confirmar la acreditación.
            </small>
          </div>
        </div>
      </div>

      <template #footer>
        <Button label="Cancelar" icon="pi pi-times" text @click="pagoDialog = false" />
        <Button 
          :label="metodoPagoSeleccionado === 'MercadoPago' ? 'Pagar con MercadoPago' : metodoPagoSeleccionado === 'Transferencia' ? 'Ya transferí, avisar por WhatsApp' : 'Solicitar pago en efectivo'" 
          :icon="metodoPagoSeleccionado === 'MercadoPago' ? 'pi pi-credit-card' : metodoPagoSeleccionado === 'Transferencia' ? 'pi pi-whatsapp' : 'pi pi-money-bill'" 
          @click="procesarPago"
          :loading="procesandoPago"
          :disabled="!metodoPagoSeleccionado"
        />
      </template>
    </Dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useToast } from 'primevue/usetoast'
import { useConfirm } from 'primevue/useconfirm'
import { reservasService, espaciosService } from '@/services'
import {
  formatCalendarDateFromApi,
  formatDateOnlyForApi,
  isSameLocalCalendarDay,
  startOfTodayLocal
} from '@/utils/reservationDates'
import { useMobilePagination } from '@/composables/useMobilePagination'
import PageHeader from '@/components/mobile/PageHeader.vue'
import MobileRecordCard from '@/components/mobile/MobileRecordCard.vue'
import MobilePaginator from '@/components/mobile/MobilePaginator.vue'
import Button from 'primevue/button'
import Calendar from 'primevue/calendar'
import Textarea from 'primevue/textarea'
import Tag from 'primevue/tag'
import ProgressSpinner from 'primevue/progressspinner'
import Dialog from 'primevue/dialog'
import Divider from 'primevue/divider'
import Message from 'primevue/message'
import { openMercadoPagoCheckout } from '@/platform/mercadopago'

const toast = useToast()
const confirm = useConfirm()

const espacios = ref([])
const selectedEspacio = ref(null)
const selectedDate = ref(null)
const selectedTurno = ref(null)
const turnos = ref([])
const observaciones = ref('')
const misReservas = ref([])
const reservasSeleccionadas = ref([])
const { page: reservasPage, paginated: paginatedReservas } = useMobilePagination(misReservas, 5)

const loadingTurnos = ref(false)
const loadingReservas = ref(false)
const creatingReserva = ref(false)

// Pago
const pagoDialog = ref(false)
const metodoPagoSeleccionado = ref(null)
const procesandoPago = ref(false)
const reservasAPagar = ref([])

const totalSeleccionado = computed(() => {
  return reservasSeleccionadas.value.reduce((sum, r) => sum + (r.monto || 0), 0)
})

const totalAPagar = computed(() => {
  return reservasAPagar.value.reduce((sum, r) => sum + (r.monto || 0), 0)
})

function canSelect({ data }) {
  return data.estadoPago === 'pendiente' && data.estado !== 'cancelada'
}

function getTipoSeverity(tipo) {
  const severities = {
    'Cancha de Pádel': 'info',
    'Cancha de Tenis': 'success',
    'Cancha de Fútbol': 'warning',
    'Cancha de Básquet': 'contrast',
    'Piscina': 'info',
    'Gimnasio': 'secondary',
    'Salón de Eventos': 'contrast',
    'Quincho': 'warning'
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
  if (selectedTurno.value?.horaInicio === turno.horaInicio) return 'success'
  return 'primary'
}

function formatDate(date) {
  return new Date(date).toLocaleDateString('es-AR', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

function formatDateShort(date) {
  return formatCalendarDateFromApi(date)
}

function canCancel(reserva) {
  return (reserva.estado === 'pendiente' || reserva.estado === 'confirmada') && reserva.estadoPago !== 'pagado'
}

async function loadEspacios() {
  try {
    espacios.value = await espaciosService.getAll(true)
  } catch (error) {
    toast.add({ severity: 'error', summary: 'Error', detail: 'No se pudieron cargar los espacios', life: 3000 })
  }
}

async function loadMisReservas() {
  loadingReservas.value = true
  try {
    misReservas.value = await reservasService.getMisReservas()
    reservasSeleccionadas.value = []
  } catch (error) {
    toast.add({ severity: 'error', summary: 'Error', detail: 'No se pudieron cargar tus reservas', life: 3000 })
  } finally {
    loadingReservas.value = false
  }
}

function selectEspacio(espacio) {
  selectedEspacio.value = espacio
  selectedDate.value = startOfTodayLocal()
  selectedTurno.value = null
  turnos.value = []
  observaciones.value = ''
}

async function loadTurnos() {
  if (!selectedEspacio.value || !selectedDate.value) {
    turnos.value = []
    return
  }
  
  loadingTurnos.value = true
  selectedTurno.value = null
  
  try {
    const fecha = formatDateOnlyForApi(selectedDate.value)
    turnos.value = await espaciosService.getTurnosDisponibles(selectedEspacio.value.id, fecha)
  } catch (error) {
    const detalle = error.response?.data?.message || 'No se pudieron cargar los turnos'
    toast.add({ severity: 'error', summary: 'Error al cargar turnos', detail: detalle, life: 6000 })
  } finally {
    loadingTurnos.value = false
  }
}

function selectTurno(turno) {
  if (!turno.disponible) return
  selectedTurno.value = turno
}

function calcularPrecio() {
  if (!selectedEspacio.value || !selectedTurno.value) return 0
  
  // Salón: usar precio del turno seleccionado
  if (selectedEspacio.value.tipoReserva === 'PorTurno') {
    return selectedTurno.value.precio || 0
  }

  // Cancha: precio fijo por reserva
  return selectedEspacio.value.precioPorHora || 0
}

async function crearReserva() {
  if (!selectedEspacio.value || !selectedDate.value || !selectedTurno.value) {
    toast.add({ severity: 'warn', summary: 'Atención', detail: 'Completa todos los campos', life: 3000 })
    return
  }

  creatingReserva.value = true
  try {
    await reservasService.create({
      espacioId: selectedEspacio.value.id,
      fecha: formatDateOnlyForApi(selectedDate.value),
      horaInicio: selectedTurno.value.horaInicio,
      horaFin: selectedTurno.value.horaFin,
      turno: selectedTurno.value.tipo ?? null,
      observaciones: observaciones.value
    })

    const mensaje = selectedEspacio.value.requiereAprobacion 
      ? 'Reserva solicitada. Pendiente de aprobación.'
      : 'Reserva confirmada exitosamente'

    toast.add({ 
      severity: 'success', 
      summary: 'Éxito', 
      detail: mensaje, 
      life: 5000 
    })

    selectedTurno.value = null
    observaciones.value = ''
    await loadTurnos()
    await loadMisReservas()
  } catch (error) {
    toast.add({ 
      severity: 'error', 
      summary: 'Error', 
      detail: error.response?.data?.message || 'Error al crear la reserva', 
      life: 3000 
    })
  } finally {
    creatingReserva.value = false
  }
}

async function cancelarReserva(reserva) {
  confirm.require({
    message: '¿Estás seguro de cancelar esta reserva?',
    header: 'Confirmar cancelación',
    icon: 'pi pi-exclamation-triangle',
    acceptClass: 'p-button-danger',
    accept: async () => {
      try {
        await reservasService.cancelar(reserva.id)
        toast.add({ severity: 'success', summary: 'Éxito', detail: 'Reserva cancelada', life: 3000 })
        await loadMisReservas()
        if (selectedEspacio.value?.id === reserva.espacioId && selectedDate.value) {
          if (isSameLocalCalendarDay(reserva.fecha, selectedDate.value)) {
            await loadTurnos()
          }
        }
      } catch (error) {
        toast.add({ 
          severity: 'error', 
          summary: 'Error', 
          detail: error.response?.data?.message || 'No se pudo cancelar la reserva', 
          life: 3000 
        })
      }
    }
  })
}

// Funciones de pago
function abrirModalPago() {
  reservasAPagar.value = reservasSeleccionadas.value.filter(r => r.estadoPago === 'pendiente')
  if (reservasAPagar.value.length === 0) return
  metodoPagoSeleccionado.value = null
  pagoDialog.value = true
}

function pagarReservaIndividual(reserva) {
  reservasAPagar.value = [reserva]
  metodoPagoSeleccionado.value = null
  pagoDialog.value = true
}

async function procesarPago() {
  if (!metodoPagoSeleccionado.value) {
    toast.add({ severity: 'warn', summary: 'Atención', detail: 'Selecciona un método de pago', life: 3000 })
    return
  }

  procesandoPago.value = true
  try {
    const reservaIds = reservasAPagar.value.map(r => r.id)

    if (metodoPagoSeleccionado.value === 'MercadoPago') {
      const response = reservaIds.length === 1
        ? await reservasService.initMercadoPago(reservaIds[0])
        : await reservasService.initMercadoPagoMultiple(reservaIds)
      await openMercadoPagoCheckout(response.initPoint || response.sandboxInitPoint)
    } else {
      // Pago en efectivo o transferencia
      await reservasService.solicitarPagoEfectivo(reservaIds, metodoPagoSeleccionado.value)

      const esTransferencia = metodoPagoSeleccionado.value === 'Transferencia'
      toast.add({ 
        severity: 'success', 
        summary: esTransferencia ? 'Transferencia registrada' : 'Solicitud enviada', 
        detail: esTransferencia
          ? 'Enviá el comprobante al +54 9 3533 68-0908 indicando tu nombre y fecha de reserva. Tu reserva quedará pendiente hasta confirmar la acreditación.'
          : 'Acércate al club para completar el pago en efectivo', 
        life: 8000 
      })
      pagoDialog.value = false
      await loadMisReservas()
    }
  } catch (error) {
    toast.add({ 
      severity: 'error', 
      summary: 'Error', 
      detail: error.response?.data?.message || 'Error al procesar el pago', 
      life: 3000 
    })
  } finally {
    procesandoPago.value = false
  }
}

watch(selectedDate, (fecha) => {
  if (!selectedEspacio.value) return
  if (!fecha) {
    turnos.value = []
    return
  }
  loadTurnos()
})

onMounted(async () => {
  await loadEspacios()
  await loadMisReservas()
  
  // Verificar si volvemos de MercadoPago
  const urlParams = new URLSearchParams(window.location.search)
  const status = urlParams.get('status')
  if (status === 'success') {
    toast.add({ severity: 'success', summary: 'Pago exitoso', detail: 'Tu pago fue procesado correctamente', life: 5000 })
    window.history.replaceState({}, document.title, window.location.pathname)
  } else if (status === 'failure') {
    toast.add({ severity: 'error', summary: 'Pago fallido', detail: 'El pago no pudo ser procesado', life: 5000 })
    window.history.replaceState({}, document.title, window.location.pathname)
  }
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

/* Espacio Card Styles */
.espacio-card {
  background: var(--surface-card);
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
  border: 2px solid var(--surface-border);
  transition: all 0.3s ease;
}

.espacio-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 40px rgba(220, 38, 38, 0.15);
  border-color: rgba(220, 38, 38, 0.4);
}

.espacio-card.selected {
  border-color: #dc2626;
  box-shadow: 0 0 20px rgba(220, 38, 38, 0.3);
}

.espacio-image-wrapper {
  height: 160px;
  position: relative;
  overflow: hidden;
}

.espacio-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.3s ease;
}

.espacio-card:hover .espacio-image {
  transform: scale(1.05);
}

.espacio-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--surface-ground);
}

.espacio-placeholder i {
  font-size: 3rem;
  color: var(--text-color-secondary);
  opacity: 0.5;
}

.selected-badge {
  position: absolute;
  top: 10px;
  right: 10px;
  background: #dc2626;
  color: white;
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  font-size: 0.75rem;
  font-weight: 600;
}

.approval-badge {
  position: absolute;
  bottom: 10px;
  left: 10px;
  background: rgba(245, 158, 11, 0.9);
  color: white;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.7rem;
}

.espacio-info {
  padding: 1rem;
}

.espacio-name {
  font-size: 1.1rem;
  font-weight: 700;
  color: var(--text-color);
  margin: 0;
}

.espacio-price {
  font-size: 1.5rem;
  font-weight: 700;
  color: #dc2626;
}

.espacio-description {
  font-size: 0.85rem;
  color: var(--text-color-secondary);
  margin: 0.5rem 0;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.espacio-details {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-top: 0.75rem;
}

.detail-item {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.75rem;
  color: var(--text-color-secondary);
  background: var(--surface-hover);
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
}

.detail-item i {
  font-size: 0.7rem;
}

/* Reserva Panel */
.reserva-panel {
  border: 1px solid rgba(220, 38, 38, 0.3);
}

.reserva-header {
  padding-bottom: 1rem;
  border-bottom: 1px solid var(--surface-border);
}

.header-image {
  width: 60px;
  height: 60px;
  border-radius: 12px;
  overflow: hidden;
}

.header-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.header-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--surface-ground);
}

.header-placeholder i {
  font-size: 1.5rem;
  color: var(--text-color-secondary);
  opacity: 0.5;
}

/* Turnos Grid */
.turnos-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: 0.5rem;
}

/* When showing salon turnos, each card should be full-width — achieved via template wrapper */
.turnos-grid .turno-salon-card {
  grid-column: 1 / -1;
}

.turno-item {
  width: 100%;
}

/* Resumen Reserva */
.resumen-reserva {
  background: var(--surface-hover);
  border: 1px solid var(--surface-border);
  border-radius: 12px;
  padding: 1.5rem;
}

.resumen-item {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.resumen-item .label {
  font-size: 0.75rem;
  color: var(--text-color-secondary);
  text-transform: uppercase;
}

.resumen-item .value {
  font-size: 1rem;
  font-weight: 600;
  color: var(--text-color);
}

.resumen-item .value.price {
  font-size: 1.5rem;
  color: #dc2626;
}

.confirmar-btn {
  background: #dc2626 !important;
  border-color: #dc2626 !important;
  color: #fff !important;
}

.confirmar-btn:hover {
  background: #991b1b !important;
  border-color: #991b1b !important;
}

.approval-notice {
  display: block;
  margin-top: 0.75rem;
  color: #f59e0b;
  text-align: center;
}

/* Reservas Table */
.reserva-espacio-image {
  width: 40px;
  height: 40px;
  border-radius: 8px;
  overflow: hidden;
  flex-shrink: 0;
}

.reserva-espacio-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.reserva-espacio-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--surface-ground);
}

.reserva-espacio-placeholder i {
  font-size: 1rem;
  color: var(--text-color-secondary);
  opacity: 0.5;
}

/* Método de pago cards */
.payment-options {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.payment-option {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px;
  background: var(--surface-card);
  border: 2px solid var(--surface-border);
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.payment-option:hover {
  border-color: var(--surface-400, #6b7280);
  background: var(--surface-hover);
}

.payment-option.selected {
  border-color: #dc2626;
  background: rgba(220, 38, 38, 0.1);
}

.payment-icon {
  width: 48px;
  height: 48px;
  background: var(--surface-hover);
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #22c55e;
  font-size: 1.25rem;
  flex-shrink: 0;
}

.payment-icon.mp-icon {
  background: #009ee3;
  color: white;
}

.payment-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.payment-title {
  color: var(--text-color);
  font-weight: 600;
  font-size: 1rem;
}

.payment-desc {
  color: var(--text-color-secondary);
  font-size: 0.85rem;
}

.transferencia-info {
  background: var(--surface-ground);
  border: 1px solid #1d4ed855;
  border-radius: 10px;
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
}

.transferencia-dato {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
}

.transferencia-label {
  color: var(--text-color-secondary);
  font-size: 0.85rem;
  min-width: 60px;
}

.transferencia-valor {
  font-family: monospace;
  font-size: 0.95rem;
  font-weight: 600;
  color: var(--text-color);
  letter-spacing: 0.5px;
}

/* Turno Salon Cards */
.turno-salon-card {
  background: var(--surface-card);
  border: 2px solid var(--surface-border);
  border-radius: 12px;
  transition: all 0.2s ease;
  color: var(--text-color);
}

.turno-salon-card:hover:not(.disabled-turno) {
  border-color: #dc2626;
  background: rgba(220, 38, 38, 0.07);
  transform: translateY(-1px);
  cursor: pointer;
}

.turno-salon-card.selected {
  border-color: #dc2626;
  background: rgba(220, 38, 38, 0.15);
  box-shadow: 0 0 14px rgba(220, 38, 38, 0.3);
}

.turno-salon-card.disabled-turno {
  opacity: 0.4;
  cursor: not-allowed;
}
</style>
