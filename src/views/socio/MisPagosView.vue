<template>
  <div>
    <PageHeader title="Mis Pagos">
      <template #actions>
        <Button
          icon="pi pi-shopping-cart"
          :badge="cartItemsCount > 0 ? cartItemsCount.toString() : null"
          badgeClass="p-badge-danger"
          class="p-button-rounded cart-btn"
          size="small"
          @click="showCart = true"
          v-tooltip.left="'Ver carrito de pagos'"
        />
      </template>
    </PageHeader>

    <!-- Stats -->
    <div class="grid mb-4">
      <div class="col-12 md:col-4">
        <div class="stat-card-green">
          <div class="flex align-items-center gap-3">
            <div class="stat-icon-green">
              <i class="pi pi-check-circle text-2xl"></i>
            </div>
            <div>
              <span class="block text-gray-400">Pagados</span>
              <span class="text-xl font-bold" style="color: var(--text-color)">{{ pagosGrouped.pagados.length }}</span>
            </div>
          </div>
        </div>
      </div>
      <div class="col-12 md:col-4">
        <div class="stat-card-yellow">
          <div class="flex align-items-center gap-3">
            <div class="stat-icon-yellow">
              <i class="pi pi-clock text-2xl"></i>
            </div>
            <div>
              <span class="block text-gray-400">Pendientes</span>
              <span class="text-xl font-bold" style="color: var(--text-color)">{{ pagosGrouped.pendientes.length }}</span>
            </div>
          </div>
        </div>
      </div>
      <div class="col-12 md:col-4">
        <div class="stat-card-red">
          <div class="flex align-items-center gap-3">
            <div class="stat-icon-red">
              <i class="pi pi-exclamation-circle text-2xl"></i>
            </div>
            <div>
              <span class="block text-gray-400">Vencidos</span>
              <span class="text-xl font-bold" style="color: var(--text-color)">{{ pagosGrouped.vencidos.length }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Pagos Pendientes y Vencidos - Grid de cards -->
    <div v-if="loading" class="flex justify-content-center p-5">
      <ProgressSpinner />
    </div>

    <div v-else>
      <!-- Pagos pendientes de confirmación -->
      <div v-if="pagosGrouped.pendientesConfirmacion.length > 0" class="mb-4">
        <h3 class="text-xl text-yellow-400 mb-3">
          <i class="pi pi-clock mr-2"></i>Esperando confirmación
        </h3>
        <div class="grid">
          <div v-for="pago in pagosGrouped.pendientesConfirmacion" :key="pago.id" class="col-12 sm:col-6 lg:col-4">
            <div class="pago-card pending-confirmation">
              <div class="pago-header">
                <Tag severity="info" value="Esperando confirmación" icon="pi pi-hourglass" />
              </div>
              <div class="pago-content">
                <h4 class="pago-concepto">{{ pago.concepto }}</h4>
                <p class="pago-vencimiento">
                  <i class="pi pi-calendar mr-1"></i>
                  Vence: {{ formatDate(pago.fechaVencimiento) }}
                </p>
              </div>
              <div class="pago-footer">
                <span class="pago-monto">${{ pago.monto?.toLocaleString() }}</span>
                <span class="text-gray-500 text-sm">Pendiente admin</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Pagos para pagar -->
      <div v-if="pagosDisponiblesPagar.length > 0" class="mb-4">        <h3 class="text-xl mb-3" style="color: var(--text-color)">
          <i class="pi pi-credit-card mr-2"></i>Pagos a realizar
        </h3>
        <div class="grid">
          <div v-for="pago in pagosDisponiblesPagar" :key="pago.id" class="col-12 sm:col-6 lg:col-4">
            <div 
              class="pago-card" 
              :class="{ 'selected': isInCart(pago), 'vencido': pago.estado === 'vencido' }"
              @click="toggleCart(pago)"
            >
              <div class="pago-header">
                <Tag 
                  :severity="pago.estado === 'vencido' ? 'danger' : 'warning'" 
                  :value="pago.estado === 'vencido' ? 'Vencido' : 'Pendiente'"
                />
                <i 
                  v-if="isInCart(pago)" 
                  class="pi pi-check-circle text-green-400 text-xl"
                ></i>
              </div>
              <div class="pago-content">
                <h4 class="pago-concepto">{{ pago.concepto }}</h4>
                <p class="pago-vencimiento">
                  <i class="pi pi-calendar mr-1"></i>
                  Vence: {{ formatDate(pago.fechaVencimiento) }}
                </p>
              </div>
              <div class="pago-footer">
                <span class="pago-monto">${{ pago.monto?.toLocaleString() }}</span>
                <Button 
                  :icon="isInCart(pago) ? 'pi pi-check' : 'pi pi-plus'"
                  :class="['p-button-rounded', isInCart(pago) ? 'p-button-success' : 'p-button-outlined']"
                  @click.stop="toggleCart(pago)"
                  v-tooltip.top="isInCart(pago) ? 'Quitar del carrito' : 'Agregar al carrito'"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Sin pagos pendientes -->
      <div v-if="pagosDisponiblesPagar.length === 0 && pagosGrouped.pendientesConfirmacion.length === 0" class="empty-state">
        <i class="pi pi-check-circle"></i>
        <h3>¡Estás al día!</h3>
        <p>No tienes pagos pendientes</p>
      </div>

      <!-- Pagos realizados -->
      <div v-if="pagosGrouped.pagados.length > 0" class="mt-5">        <h3 class="text-xl mb-3" style="color: var(--text-color)">
          <i class="pi pi-check-circle mr-2 text-green-400"></i>Historial de pagos
        </h3>
        <div class="mobile-card-list">
          <MobileRecordCard
            v-for="pago in paginatedPagados"
            :key="pago.id"
            :title="pago.concepto"
            :subtitle="formatDate(pago.fechaPago)"
          >
            <template #tags>
              <Tag severity="success" value="Pagado" />
            </template>
            <template #body>
              <div class="record-card__row">
                <span class="record-card__label">Monto</span>
                <span class="record-card__value">${{ pago.monto?.toLocaleString() }}</span>
              </div>
              <div class="record-card__row">
                <span class="record-card__label">Método</span>
                <Tag
                  :severity="pago.metodoPago?.toLowerCase() === 'efectivo' ? 'info' : pago.metodoPago?.toLowerCase() === 'mutual' ? 'warning' : 'success'"
                  :value="pago.metodoPago || '-'"
                  :icon="pago.metodoPago?.toLowerCase() === 'efectivo' ? 'pi pi-wallet' : pago.metodoPago?.toLowerCase() === 'mutual' ? 'pi pi-dollar' : 'pi pi-credit-card'"
                />
              </div>
            </template>
          </MobileRecordCard>
        </div>
        <MobilePaginator v-model:page="pagadosPage" :rows="10" :total="pagosGrouped.pagados.length" />
      </div>
    </div>

    <!-- Shopping Cart Sidebar -->
    <Sidebar v-model:visible="showCart" position="right" :style="{ width: '400px' }" class="cart-sidebar">
      <template #header>
        <div class="flex align-items-center gap-2">
          <i class="pi pi-shopping-cart text-xl text-primary"></i>
          <span class="font-bold text-lg">Carrito de Pagos</span>
        </div>
      </template>

      <div v-if="cart.length === 0" class="cart-empty">
        <i class="pi pi-shopping-cart"></i>
        <p>Tu carrito está vacío</p>
        <p class="text-gray-500 text-sm">Selecciona los pagos que deseas realizar</p>
        <Button label="Ver pagos pendientes" icon="pi pi-arrow-left" @click="showCart = false" />
      </div>

      <div v-else class="cart-content">
        <div class="cart-items">
          <div v-for="item in cart" :key="item.id" class="cart-item">
            <div class="cart-item-icon">
              <i class="pi pi-file-edit"></i>
            </div>
            <div class="cart-item-info flex-1">
              <h5 class="cart-item-name">{{ item.concepto }}</h5>
              <p class="cart-item-details">
                <Tag 
                  :severity="item.estado === 'vencido' ? 'danger' : 'warning'" 
                  :value="item.estado === 'vencido' ? 'Vencido' : 'Pendiente'"
                  class="text-xs"
                />
              </p>
              <span class="cart-item-price">${{ item.monto?.toLocaleString() }}</span>
            </div>
            <Button 
              icon="pi pi-trash" 
              class="p-button-rounded p-button-text p-button-danger p-button-sm"
              @click="removeFromCart(item)"
            />
          </div>
        </div>

        <Divider />

        <div class="cart-summary">
          <div class="flex justify-content-between mb-3">
            <span class="text-gray-400">Total ({{ cartItemsCount }} pago{{ cartItemsCount > 1 ? 's' : '' }})</span>            <span class="font-semibold" style="color: var(--text-color)">${{ cartTotal.toLocaleString() }}</span>
          </div>
          <Divider />
          <div class="flex justify-content-between mb-4">
            <span class="text-xl font-bold" style="color: var(--text-color)">Total a pagar</span>
            <span class="text-xl font-bold text-primary">${{ cartTotal.toLocaleString() }}</span>
          </div>

          <Button 
            label="Continuar al pago" 
            icon="pi pi-credit-card" 
            class="w-full mb-2"
            @click="checkout"
          />
          <Button 
            label="Vaciar carrito" 
            icon="pi pi-trash" 
            class="w-full p-button-outlined p-button-danger"
            @click="clearCart"
          />
        </div>
      </div>
    </Sidebar>

    <!-- Checkout Dialog -->
    <Dialog 
      v-model:visible="checkoutDialog" 
      header="Finalizar Pago" 
      :modal="true"
      :style="{ width: '550px' }"
    >
      <div class="checkout-confirmation">
        <div class="order-summary p-3 border-round mb-4" style="background: var(--surface-card); border: 1px solid var(--surface-border)">
          <h4 class="mb-3" style="color: var(--text-color)"><i class="pi pi-list mr-2"></i>Resumen de pagos</h4>          <div v-for="item in cart" :key="item.id" class="flex justify-content-between mb-2">
            <span style="color: var(--text-color-secondary)">{{ item.concepto }}</span>
            <span style="color: var(--text-color)">${{ item.monto?.toLocaleString() }}</span>
          </div>
          <Divider />
          <div class="flex justify-content-between">
            <span class="font-bold" style="color: var(--text-color)">Total a pagar</span>
            <span class="font-bold text-primary text-xl">${{ cartTotal.toLocaleString() }}</span>
          </div>
        </div>

        <!-- Método de pago -->
        <div class="payment-methods mb-4">
          <h4 class="mb-3" style="color: var(--text-color)"><i class="pi pi-credit-card mr-2"></i>Método de pago</h4>
          
          <div class="payment-options">
            <div 
              class="payment-option" 
              :class="{ 'selected': metodoPago === 'efectivo' }"
              @click="metodoPago = 'efectivo'"
            >
              <div class="payment-icon">
                <i class="pi pi-wallet"></i>
              </div>
              <div class="payment-info">
                <span class="payment-title">Pago en Efectivo</span>
                <span class="payment-desc">Pagas en el club. Requiere confirmación del admin.</span>
              </div>
              <i v-if="metodoPago === 'efectivo'" class="pi pi-check-circle text-green-400"></i>
            </div>

            <div
              class="payment-option"
              :class="{ 'selected': metodoPago === 'transferencia' }"
              @click="metodoPago = 'transferencia'"
            >
              <div class="payment-icon" style="background: #1a56db22; color: #60a5fa">
                <i class="pi pi-dollar"></i>
              </div>
              <div class="payment-info">
                <span class="payment-title">Transferencia Bancaria</span>
                <span class="payment-desc">Transferí y enviá el comprobante por WhatsApp</span>
              </div>
              <i v-if="metodoPago === 'transferencia'" class="pi pi-check-circle text-green-400"></i>
            </div>

            <div 
              class="payment-option" 
              :class="{ 'selected': metodoPago === 'mercadopago' }"
              @click="metodoPago = 'mercadopago'"
            >
              <div class="payment-icon mp-icon">
                <i class="pi pi-credit-card"></i>
              </div>
              <div class="payment-info">
                <span class="payment-title">MercadoPago</span>
                <span class="payment-desc">Tarjeta de débito, crédito o dinero en cuenta</span>
              </div>
              <i v-if="metodoPago === 'mercadopago'" class="pi pi-check-circle text-green-400"></i>
            </div>
          </div>
          <small v-if="pagoError" class="p-error mt-2 block">Debes seleccionar un método de pago</small>

          <!-- Datos de transferencia -->
          <div v-if="metodoPago === 'transferencia'" class="transferencia-info mt-3">
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
            <div class="flex align-items-start gap-2 mt-2" style="color: #f59e0b">
              <i class="pi pi-whatsapp mt-1" style="font-size:1rem"></i>
              <small>Una vez transferido, enviá el comprobante al <strong>+54 9 3533 68-0908</strong> indicando tu nombre y número de socio.</small>
            </div>
          </div>
        </div>

        <Message v-if="metodoPago === 'efectivo'" severity="info" :closable="false" class="mb-3">
          <i class="pi pi-info-circle mr-2"></i>
          El pago en efectivo debe ser confirmado por un administrador del club.
        </Message>
      </div>

      <template #footer>
        <Button label="Cancelar" icon="pi pi-times" text @click="checkoutDialog = false" />
        <Button 
          :label="metodoPago === 'mercadopago' ? 'Ir a MercadoPago' : 'Confirmar pago'" 
          :icon="metodoPago === 'mercadopago' ? 'pi pi-external-link' : 'pi pi-check'" 
          @click="procesarPago"
          :loading="processingPayment"
          :disabled="!metodoPago"
        />
      </template>
    </Dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { pagosService, reservasService, pedidosService } from '@/services'
import { useMobilePagination } from '@/composables/useMobilePagination'
import PageHeader from '@/components/mobile/PageHeader.vue'
import MobileRecordCard from '@/components/mobile/MobileRecordCard.vue'
import MobilePaginator from '@/components/mobile/MobilePaginator.vue'
import Tag from 'primevue/tag'
import Button from 'primevue/button'
import Dialog from 'primevue/dialog'
import Sidebar from 'primevue/sidebar'
import Divider from 'primevue/divider'
import Message from 'primevue/message'
import ProgressSpinner from 'primevue/progressspinner'
import { useToast } from 'primevue/usetoast'
import { openMercadoPagoCheckout } from '@/platform/mercadopago'

const authStore = useAuthStore()
const toast = useToast()

const pagos = ref([])
const loading = ref(false)
const processingPayment = ref(false)

// Cart state
const cart = ref([])
const showCart = ref(false)
const checkoutDialog = ref(false)
const metodoPago = ref(null)
const pagoError = ref(false)

const pagosGrouped = computed(() => {
  const sortByFecha = (a, b) => {
    const fa = new Date(b.fechaPago || b.fechaVencimiento || b.fechaCreacion || 0)
    const fb = new Date(a.fechaPago || a.fechaVencimiento || a.fechaCreacion || 0)
    return fa - fb
  }
  return {
    pendientes: pagos.value.filter(p => p.estado?.toLowerCase() === 'pendiente' && !p.pendienteConfirmacionEfectivo).sort(sortByFecha),
    pagados: pagos.value.filter(p => p.estado?.toLowerCase() === 'pagado').sort(sortByFecha),
    vencidos: pagos.value.filter(p => p.estado?.toLowerCase() === 'vencido' && !p.pendienteConfirmacionEfectivo).sort(sortByFecha),
    pendientesConfirmacion: pagos.value.filter(p => p.pendienteConfirmacionEfectivo).sort(sortByFecha)
  }
})

const pagosDisponiblesPagar = computed(() => {
  return [...pagosGrouped.value.pendientes, ...pagosGrouped.value.vencidos]
})

const pagosPagados = computed(() => pagosGrouped.value.pagados)
const { page: pagadosPage, paginated: paginatedPagados } = useMobilePagination(pagosPagados, 10)

const cartItemsCount = computed(() => cart.value.length)

const cartTotal = computed(() => {
  return cart.value.reduce((sum, p) => sum + (p.monto || 0), 0)
})

function formatDate(date) {
  if (!date) return '-'
  return new Date(date).toLocaleDateString('es-ES')
}

function isInCart(pago) {
  return cart.value.some(p => p.id === pago.id)
}

function toggleCart(pago) {
  if (isInCart(pago)) {
    cart.value = cart.value.filter(p => p.id !== pago.id)
  } else {
    cart.value.push(pago)
  }
}

function removeFromCart(pago) {
  cart.value = cart.value.filter(p => p.id !== pago.id)
}

function clearCart() {
  cart.value = []
}

function checkout() {
  if (cart.value.length === 0) return
  metodoPago.value = null
  pagoError.value = false
  showCart.value = false
  checkoutDialog.value = true
}

async function procesarPago() {
  if (!metodoPago.value) {
    pagoError.value = true
    return
  }
  
  if (cart.value.length === 0) return
  
  processingPayment.value = true
  pagoError.value = false
  
  try {
    const pagoIds = cart.value.map(p => p.id)
      if (metodoPago.value === 'mercadopago') {
      const response = await pagosService.initMercadoPagoMultiple(pagoIds)
      checkoutDialog.value = false
      await openMercadoPagoCheckout(response.initPoint || response.sandboxInitPoint)
    } else if (metodoPago.value === 'efectivo') {
      await pagosService.solicitarPagoEfectivo(pagoIds)
      toast.add({
        severity: 'success',
        summary: 'Solicitud enviada',
        detail: 'Tu solicitud de pago en efectivo fue enviada. Un administrador debe confirmarla.',
        life: 5000
      })
      checkoutDialog.value = false
      clearCart()
      await loadPagos()
    } else if (metodoPago.value === 'transferencia') {
      await pagosService.solicitarPagoEfectivo(pagoIds)
      toast.add({
        severity: 'success',
        summary: 'Transferencia registrada',
        detail: 'Enviá el comprobante al +54 9 3533 68-0908. Un administrador confirmará tu pago.',
        life: 8000
      })
      checkoutDialog.value = false
      clearCart()
      await loadPagos()
    }
  } catch (error) {
    console.error('Error al procesar pago:', error)
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: error.response?.data?.message || 'No se pudo procesar el pago',
      life: 3000
    })
  } finally {
    processingPayment.value = false
  }
}

async function loadPagos() {
  loading.value = true
  try {
    const [pagosSocio, misReservas, misPedidos] = await Promise.allSettled([
      pagosService.getBySocio(authStore.user.id),
      reservasService.getMisReservas(),
      pedidosService.getMisPedidos()
    ])

    const listaPagos = pagosSocio.status === 'fulfilled' ? pagosSocio.value : []

    // Reservas pagadas como registros de historial
    const pagosReservas = misReservas.status === 'fulfilled'
      ? misReservas.value
          .filter(r => r.estadoPago?.toLowerCase() === 'pagado' && r.monto > 0)
          .map(r => ({
            id: `reserva-${r.id}`,
            concepto: `Reserva — ${r.espacioNombre || r.espacio?.nombre || 'Espacio'}`,
            monto: r.monto,
            estado: 'Pagado',
            fechaPago: r.fechaPago || r.fecha,
            metodoPago: r.metodoPago || '-',
            pendienteConfirmacionEfectivo: false,
            _tipo: 'reserva'
          }))
      : []

    // Pedidos de tienda (todos, con su estado real)
    const pagosPedidos = misPedidos.status === 'fulfilled'
      ? misPedidos.value
          .map(p => ({
            id: `pedido-${p.id}`,
            concepto: `Tienda — Pedido #${p.id?.slice(-6).toUpperCase()}`,
            monto: p.total,
            estado: p.estadoPago || p.estado || 'Pendiente',
            fechaPago: p.estadoPago?.toLowerCase() === 'pagado' ? p.fechaPedido : null,
            fechaCreacion: p.fechaPedido,
            metodoPago: p.metodoPago || '-',
            pendienteConfirmacionEfectivo: false,
            _tipo: 'pedido'
          }))
      : []

    pagos.value = [...listaPagos, ...pagosReservas, ...pagosPedidos]
  } catch (error) {
    console.error('Error loading pagos:', error)
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'No se pudieron cargar los pagos',
      life: 3000
    })
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadPagos()

  // Manejar retorno desde MercadoPago
  const params = new URLSearchParams(window.location.search)
  const status = params.get('status')

  if (status === 'success') {
    toast.add({
      severity: 'success',
      summary: '¡Pago exitoso!',
      detail: 'Tus pagos fueron procesados correctamente con MercadoPago.',
      life: 6000
    })
    window.history.replaceState({}, '', window.location.pathname)
  } else if (status === 'failure') {
    toast.add({
      severity: 'error',
      summary: 'Pago rechazado',
      detail: 'El pago no pudo procesarse. Podés intentarlo nuevamente.',
      life: 6000
    })
    window.history.replaceState({}, '', window.location.pathname)
  } else if (status === 'pending') {
    toast.add({
      severity: 'warn',
      summary: 'Pago pendiente',
      detail: 'Tu pago está siendo procesado. Te avisaremos cuando se confirme.',
      life: 6000
    })
    window.history.replaceState({}, '', window.location.pathname)
  }
})
</script>

<style scoped>
.stat-card-green,
.stat-card-yellow,
.stat-card-red {
  background: var(--surface-card);
  border: 1px solid var(--surface-border);
  border-radius: 12px;
  padding: 1.25rem;
}

.stat-card-green  { border-left: 3px solid #22c55e; }
.stat-card-yellow { border-left: 3px solid #f59e0b; }
.stat-card-red    { border-left: 3px solid #ef4444; }

.stat-icon-green,
.stat-icon-yellow,
.stat-icon-red {
  width: 2.5rem;
  height: 2.5rem;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.stat-icon-green  { background: rgba(34, 197, 94, 0.2);  color: #22c55e; }
.stat-icon-yellow { background: rgba(245, 158, 11, 0.2);  color: #f59e0b; }
.stat-icon-red    { background: rgba(239, 68, 68, 0.2);   color: #ef4444; }

/* Pago Cards */
.pago-card {
  background: var(--surface-card);
  border: 2px solid var(--surface-border);
  border-radius: 12px;
  padding: 1rem;
  cursor: pointer;
  transition: all 0.3s ease;
}

.pago-card:hover {
  border-color: #3b82f6;
  transform: translateY(-2px);
}

.pago-card.selected {
  border-color: #22c55e;
  background: rgba(34, 197, 94, 0.1);
}

.pago-card.vencido {
  border-left: 3px solid #ef4444;
}

.pago-card.pending-confirmation {
  border-color: #f59e0b;
  background: rgba(245, 158, 11, 0.05);
  cursor: default;
}

.pago-card.pending-confirmation:hover {
  transform: none;
  border-color: #f59e0b;
}

.pago-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.75rem;
}

.pago-content { margin-bottom: 1rem; }

.pago-concepto {
  color: var(--text-color);
  font-size: 1.1rem;
  margin: 0 0 0.5rem 0;
}

.pago-vencimiento {
  color: var(--text-color-secondary);
  font-size: 0.875rem;
  margin: 0;
}

.pago-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.pago-monto {
  color: #22c55e;
  font-size: 1.25rem;
  font-weight: bold;
}

/* Cart Sidebar */
.cart-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  text-align: center;
  padding: 2rem;
}

.cart-empty i {
  font-size: 4rem;
  color: #3b82f6;
  margin-bottom: 1rem;
  opacity: 0.5;
}

.cart-empty p { color: var(--text-color-secondary); margin-bottom: 1rem; }

.cart-content {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.cart-items { flex: 1; overflow-y: auto; }

.cart-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  background: var(--surface-hover);
  border-radius: 8px;
  margin-bottom: 0.75rem;
}

.cart-item-icon {
  width: 3rem;
  height: 3rem;
  background: rgba(59, 130, 246, 0.2);
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #3b82f6;
}

.cart-item-icon i { font-size: 1.25rem; }

.cart-item-name {
  color: var(--text-color);
  font-size: 0.95rem;
  margin: 0 0 0.25rem 0;
}

.cart-item-details { margin: 0.25rem 0; }

.cart-item-price { color: #22c55e; font-weight: 600; }

.cart-summary { padding-top: 1rem; }

/* Empty State */
.empty-state {
  text-align: center;
  padding: 4rem 2rem;
  background: var(--surface-card);
  border: 1px solid var(--surface-border);
  border-radius: 12px;
}

.empty-state i { font-size: 4rem; color: #22c55e; margin-bottom: 1rem; }

.empty-state h3 { color: var(--text-color); margin: 0 0 0.5rem 0; }

.empty-state p { color: var(--text-color-secondary); margin: 0; }

/* Checkout Dialog */
.checkout-confirmation .order-summary {
  border: 1px solid var(--surface-border);
}

.payment-options {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.payment-option {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  background: var(--surface-card);
  border: 2px solid var(--surface-border);
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.payment-option:hover { border-color: #3b82f6; }

.payment-option.selected {
  border-color: #22c55e;
  background: rgba(34, 197, 94, 0.1);
}

.payment-icon {
  width: 3rem;
  height: 3rem;
  background: rgba(59, 130, 246, 0.2);
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #3b82f6;
}

.payment-icon.mp-icon { background: rgba(0, 158, 227, 0.2); color: #00b1ea; }

.transferencia-info {
  background: var(--surface-ground);
  border: 1px solid #1d4ed855;
  border-radius: 10px;
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}
.transferencia-dato { display: flex; justify-content: space-between; align-items: center; }
.transferencia-label { color: var(--text-color-secondary); font-size: 0.85rem; min-width: 60px; }
.transferencia-valor { font-family: monospace; font-size: 0.9rem; font-weight: 600; color: var(--text-color); }

.payment-icon i { font-size: 1.25rem; }

.payment-info { flex: 1; }

.payment-title {
  display: block;
  color: var(--text-color);
  font-weight: 600;
  margin-bottom: 0.25rem;
}

.payment-desc {
  display: block;
  color: var(--text-color-secondary);
  font-size: 0.85rem;
}

/* Cart button */
.cart-btn {
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%) !important;
  border: none !important;
}

.cart-btn:hover {
  background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%) !important;
}
</style>
