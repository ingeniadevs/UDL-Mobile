<template>
  <div>
    <PageHeader title="Pago de Cuotas">
      <template #actions>
        <Button label="Nuevo Pago Mutual" icon="pi pi-money-bill" severity="success" size="small" @click="openPagoMutual" />
        <Button label="Generar cuota atrasada" icon="pi pi-calendar-plus" severity="warning" size="small" @click="openGenerarCuota" v-tooltip.left="'Cuota de meses previos al alta en producción'" />
      </template>
    </PageHeader>

    <!-- Pagos esperando confirmación de efectivo -->
    <div v-if="pagosPendientesConfirmacion.length > 0" class="mb-4">
      <div class="card" style="border: 2px solid #f59e0b; background: var(--surface-overlay);">
        <div class="flex align-items-center justify-content-between mb-3">
          <div class="flex align-items-center gap-2">
            <i class="pi pi-clock text-2xl text-yellow-400"></i>
            <h3 class="text-xl font-bold text-yellow-400 m-0">Pagos esperando confirmación</h3>
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
    </div>

    <!-- Stat cards -->
    <div class="grid mb-4">
      <div class="col-6 md:col-3">
        <div class="stat-card stat-success">
          <div class="stat-icon"><i class="pi pi-check-circle"></i></div>
          <div class="stat-content">
            <span class="stat-value">{{ estadisticas.cantidadPagadas }}</span>
            <span class="stat-label">Cuotas Pagadas</span>
            <small class="stat-amount">${{ estadisticas.totalPagado.toLocaleString() }}</small>
          </div>
        </div>
      </div>
      <div class="col-6 md:col-3">
        <div class="stat-card stat-warning">
          <div class="stat-icon"><i class="pi pi-clock"></i></div>
          <div class="stat-content">
            <span class="stat-value">{{ estadisticas.cantidadPendientes }}</span>
            <span class="stat-label">Pendientes</span>
            <small class="stat-amount">${{ estadisticas.totalPendiente.toLocaleString() }}</small>
          </div>
        </div>
      </div>
      <div class="col-6 md:col-3">
        <div class="stat-card stat-danger">
          <div class="stat-icon"><i class="pi pi-exclamation-circle"></i></div>
          <div class="stat-content">
            <span class="stat-value">{{ estadisticas.cantidadVencidas }}</span>
            <span class="stat-label">Vencidas</span>
            <small class="stat-amount">${{ estadisticas.totalVencido.toLocaleString() }}</small>
          </div>
        </div>
      </div>
      <div class="col-6 md:col-3">
        <div class="stat-card stat-mutual">
          <div class="stat-icon"><i class="pi pi-building"></i></div>
          <div class="stat-content">
            <span class="stat-value">{{ estadisticas.cantidadMutual }}</span>
            <span class="stat-label">Pago Mutual</span>
            <small class="stat-amount">${{ estadisticas.totalMutual.toLocaleString() }}</small>
          </div>
        </div>
      </div>
    </div>

    <!-- Filtros -->
    <div class="card mb-4">
      <div class="flex flex-wrap align-items-center gap-3">
        <span class="p-input-icon-left flex-1" style="min-width: 200px">
          <i class="pi pi-search" />
          <InputText v-model="filters['global'].value" placeholder="Buscar por socio o concepto..." class="w-full" />
        </span>
        <Dropdown 
          v-model="socioFilter" 
          :options="socios" 
          optionLabel="nombre" 
          optionValue="id"
          placeholder="Filtrar por socio"
          class="w-15rem"
          showClear
          filter
        />
        <Dropdown 
          v-model="estadoFilter" 
          :options="estadoOptions" 
          optionLabel="label" 
          optionValue="value"
          placeholder="Filtrar por estado"
          class="w-12rem"
          showClear
        />
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
            <Tag v-if="item.metodoPago?.toLowerCase() === 'efectivo'" severity="info" value="Efectivo" />
            <Tag v-else-if="item.metodoPago?.toLowerCase() === 'transferencia'" severity="secondary" value="Transferencia" />
            <Tag v-else-if="item.metodoPago?.toLowerCase() === 'mercadopago'" severity="warning" value="MercadoPago" />
            <Tag v-else-if="item.metodoPago?.toLowerCase() === 'mutual'" severity="success" icon="pi pi-building" value="Mutual" />
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
            <div class="record-card__row">
              <span class="record-card__label">Fecha pago</span>
              <span class="record-card__value">{{ item.fechaPago ? formatDate(item.fechaPago) : '—' }}</span>
            </div>
          </template>
          <template #actions>
            <Button icon="pi pi-list" text rounded size="small" severity="secondary" @click="verDetallePago(item)" v-tooltip.top="'Ver desglose'" />
            <Button v-if="item.metodoPago?.toLowerCase() === 'mutual'" icon="pi pi-file-pdf" text rounded size="small" severity="help" @click="generarCupon(item)" v-tooltip.top="'Cupón mutual'" />
            <Button v-if="item.estado === 'pendiente' || item.estado === 'vencido'" icon="pi pi-credit-card" label="Pagar" text rounded size="small" severity="success" @click="abrirPagarDialog(item)" :loading="procesandoPago === item.id" />
            <Button v-if="item.estado?.toLowerCase() !== 'pagado'" icon="pi pi-pencil" text rounded size="small" severity="info" @click="editPago(item)" v-tooltip.top="'Editar'" />
            <Button v-if="item.estado?.toLowerCase() !== 'pagado'" icon="pi pi-trash" text rounded size="small" severity="danger" @click="confirmDelete(item)" v-tooltip.top="'Eliminar'" />
            <Button v-if="item.estado !== 'pagado'" icon="pi pi-whatsapp" text rounded size="small" severity="success" @click="abrirWhatsApp(item)" v-tooltip.top="'Enviar WhatsApp'" />
          </template>
        </MobileRecordCard>
      </div>
      <MobilePaginator v-model:page="pagosPage" :rows="10" :total="pagosFiltrados.length" />
    </template>

    <WhatsAppSendDialog
      v-model="waDialog"
      :cliente-nombre="waItem?.clienteNombre || ''"
      :telefono="waItem?.telefono || ''"
      tipo="Vencimiento"
      :mensaje="waMensaje"
      :telefono-valido="waItem?.puedeWhatsApp"
      :telefono-error="waItem?.telefonoError"
      @confirmado="onWhatsAppConfirmado"
    />

    <!-- Dialog Pagar -->
    <Dialog v-model:visible="pagarDialog" header="Registrar Pago" :modal="true" :style="{ width: '420px' }">
      <div v-if="pagoAPagar" class="flex flex-column gap-4 pt-2">
        <div class="p-3 border-round" style="background: rgba(255,255,255,0.05)">
          <div class="mb-1"><span class="text-gray-400">Socio:</span> <strong>{{ pagoAPagar.socioNombre }}</strong></div>
          <div class="mb-1"><span class="text-gray-400">Concepto:</span> {{ pagoAPagar.concepto }}</div>
          <div><span class="text-gray-400">Monto:</span> <strong class="text-green-400 text-xl">${{ pagoAPagar.monto?.toLocaleString('es-AR') }}</strong></div>
        </div>
        <div v-if="pagoAPagar.metodoPago?.toLowerCase() === 'mutual'" class="flex align-items-center gap-2 text-blue-300 p-3 border-round" style="background: rgba(59,130,246,0.1)">
          <i class="pi pi-building text-xl"></i>
          <span>Se registrará como cobro por <strong>Mutual</strong></span>
        </div>
        <div v-else>
          <label class="font-medium text-gray-300 mb-3 block">Método de pago</label>
          <div class="flex gap-4">
            <div class="flex align-items-center gap-2">
              <RadioButton v-model="metodoPagoElegido" inputId="mp-efectivo" value="Efectivo" />
              <label for="mp-efectivo" class="text-gray-300">Efectivo</label>
            </div>
            <div class="flex align-items-center gap-2">
              <RadioButton v-model="metodoPagoElegido" inputId="mp-transferencia" value="Transferencia" />
              <label for="mp-transferencia" class="text-gray-300">Transferencia</label>
            </div>
          </div>
        </div>
      </div>
      <template #footer>
        <Button label="Cancelar" icon="pi pi-times" text @click="pagarDialog = false" />
        <Button label="Confirmar pago" icon="pi pi-check" severity="success" @click="confirmarPagoDesdeDialog" :loading="procesandoPagarDialog" />
      </template>
    </Dialog>

    <!-- Create/Edit Dialog -->
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
          <!-- Grilla de selección -->
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
            Si selecciona "Efectivo", el pago se marca pagado con distribución automática club + disciplinas.
          </small>
        </div>

        <div class="field" v-if="!isEditing && pago.metodoPago === 'efectivo'">
          <label class="font-medium text-gray-300">Observaciones</label>
          <InputText v-model="pago.observacion" class="w-full" placeholder="Opcional" />
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
    </Dialog>

    <!-- Dialog Pago Mutual (multi-socio) -->
    <Dialog
      v-model:visible="pagoMutualDialog"
      header="Nuevo Pago Mutual"
      :modal="true"
      :style="{ width: '640px' }"
    >
      <div class="flex flex-column gap-4 pt-3">
        <!-- Buscador de socios -->
        <div class="field">
          <label class="font-medium text-gray-300">Socios *</label>
          <span class="p-input-icon-left w-full mb-2">
            <i class="pi pi-search" />
            <InputText v-model="mutualSearch" placeholder="Buscar por nombre, email o número..." class="w-full" />
          </span>
          <div v-if="socios.filter(s => s.pagaPorMutual).length === 0" class="text-center py-4">
            <i class="pi pi-info-circle text-2xl text-yellow-400 mb-2 block"></i>
            <p class="text-gray-400 text-sm">No hay socios con cobro por mutual configurado.</p>
            <p class="text-gray-500 text-xs mt-1">Activá "Cobra por Mutual" en la ficha del socio.</p>
          </div>
          <div v-else class="mobile-card-list socio-selector-list">
            <MobileRecordCard
              v-for="s in mutualSociosFiltrados"
              :key="s.id"
              :title="s.nombre"
              :subtitle="s.email"
              @click="toggleMutualSocio(s)"
            >
              <template #tags>
                <Tag :value="s.numeroSocio?.toString() || '-'" severity="info" />
              </template>
              <template #actions>
                <Checkbox
                  :modelValue="mutualSociosSeleccionados.some(x => x.id === s.id)"
                  :binary="true"
                  @update:modelValue="val => toggleMutualSocio(s, val)"
                />
              </template>
            </MobileRecordCard>
          </div>
          <small class="text-gray-400 mt-1 block">
            <i class="pi pi-info-circle mr-1"></i>{{ mutualSociosSeleccionados.length }} socio(s) seleccionado(s)
          </small>
          <small v-if="mutualSubmitted && mutualSociosSeleccionados.length === 0" class="p-error">Debe seleccionar al menos un socio</small>
        </div>

        <div class="field">
          <label class="font-medium text-gray-300">Concepto *</label>
          <InputText v-model="mutualPago.concepto" class="w-full" :class="{ 'p-invalid': mutualSubmitted && !mutualPago.concepto }" placeholder="Ej: Pago Mutual Julio 2026" />
          <small v-if="mutualSubmitted && !mutualPago.concepto" class="p-error">El concepto es requerido</small>
        </div>

        <!-- Montos individuales por socio -->
        <div v-if="mutualSociosSeleccionados.length > 0" class="field">
          <label class="font-medium text-gray-300 block mb-2">
            <i class="pi pi-pencil mr-1"></i>Monto por socio
            <span class="text-xs text-gray-400 ml-2">(por defecto: cuota del socio)</span>
          </label>
          <div class="monto-individual-list">
            <div
              v-for="(item, idx) in mutualSociosConMonto"
              :key="item.id"
              class="monto-individual-row"
            >
              <div class="flex align-items-center gap-2 flex-1">
                <Tag :value="item.socio.numeroSocio?.toString() || '-'" severity="info" />
                <span class="font-medium" style="color: var(--text-color)">{{ item.socio.nombre }} {{ item.socio.apellido }}</span>
              </div>
              <div class="monto-input-wrap">
                <span class="monto-prefix">$</span>
                <input
                  type="number"
                  :value="mutualSociosConMonto[idx].monto"
                  @input="mutualSociosConMonto[idx].monto = Number($event.target.value) || 0"
                  class="monto-input-raw"
                  min="0"
                  step="100"
                  :class="{ 'input-invalid': mutualSubmitted && !mutualSociosConMonto[idx].monto }"
                />
              </div>
            </div>
          </div>
          <div class="flex justify-content-end mt-2">
            <span class="text-sm text-gray-400">Total: </span>
            <span class="font-bold ml-2" style="color: var(--primary-color)">
              ${{ mutualSociosConMonto.reduce((a, b) => a + (b.monto || 0), 0).toLocaleString('es-AR') }}
            </span>
          </div>
        </div>

        <div class="field">
          <label class="font-medium text-gray-300">Fecha de Vencimiento *</label>
          <Calendar v-model="mutualPago.fechaVencimiento" dateFormat="dd/mm/yy" class="w-full" showIcon />
        </div>

        <div class="p-3 border-round" style="background: var(--surface-hover); border: 1px solid #10b981;">
          <div class="flex align-items-center gap-2">
            <i class="pi pi-check-circle text-green-400"></i>
            <span class="font-medium text-green-400">Forma de pago: Mutual</span>
          </div>
          <small class="text-gray-400 mt-1 block">El pago se registrará como <strong class="text-yellow-400">pendiente</strong> para cada socio seleccionado.</small>
        </div>
      </div>

      <template #footer>
        <Button label="Cancelar" icon="pi pi-times" text @click="pagoMutualDialog = false" />
        <Button
          :label="`Registrar ${mutualSociosSeleccionados.length > 1 ? mutualSociosSeleccionados.length + ' pagos' : '1 pago'}`"
          icon="pi pi-check"
          @click="savePagosMutual"
          :loading="mutualSaving"
          :disabled="mutualSociosSeleccionados.length === 0"
        />
      </template>
    </Dialog>
    <Dialog
      v-model:visible="generarCuotaDialog"
      header="Generar cuota atrasada"
      :modal="true"
      :style="{ width: '520px' }"
    >
      <div class="flex flex-column gap-4 pt-3">
        <Message severity="info" :closable="false">
          Use esta opción para cargar cuotas de meses anteriores a la salida a producción.
          El socio verá el pago como pendiente o vencido según la fecha de vencimiento.
        </Message>

        <div class="field">
          <label class="font-medium text-gray-300">Socio *</label>
          <Dropdown
            v-model="cuotaData.socioId"
            :options="sociosCuotaOptions"
            optionLabel="label"
            optionValue="value"
            placeholder="Seleccionar socio"
            filter
            class="w-full"
            :class="{ 'p-invalid': cuotaSubmitted && !cuotaData.socioId }"
          />
          <small v-if="cuotaSubmitted && !cuotaData.socioId" class="p-error">Debe seleccionar un socio</small>
        </div>

        <div class="grid">
          <div class="col-6 field">
            <label class="font-medium text-gray-300">Mes *</label>
            <Dropdown
              v-model="cuotaData.mes"
              :options="mesOptions"
              optionLabel="label"
              optionValue="value"
              class="w-full"
            />
          </div>
          <div class="col-6 field">
            <label class="font-medium text-gray-300">Año *</label>
            <InputNumber v-model="cuotaData.año" :min="2020" :max="2100" :useGrouping="false" class="w-full" />
          </div>
        </div>

        <div class="field">
          <label class="font-medium text-gray-300">Fecha de vencimiento *</label>
          <Calendar v-model="cuotaData.fechaVencimiento" dateFormat="dd/mm/yy" class="w-full" showIcon />
          <small class="text-gray-400">Si la fecha ya pasó, la cuota se creará como vencida.</small>
        </div>

        <div v-if="cuotaTotal" class="p-3 border-round" style="background: var(--surface-hover);">
          <div class="font-medium mb-2">{{ periodoCuotaPreview }}</div>
          <div class="flex justify-content-between text-sm mb-1">
            <span>Cuota base</span>
            <span>${{ cuotaTotal.cuotaBase?.toLocaleString() }}</span>
          </div>
          <div class="flex justify-content-between font-bold text-green-400 pt-2 border-top-1 surface-border">
            <span>Total</span>
            <span>${{ cuotaTotal.cuotaTotal?.toLocaleString() }}</span>
          </div>
        </div>
        <div v-else-if="cuotaData.socioId" class="text-gray-400 text-sm">
          <i class="pi pi-spin pi-spinner mr-1"></i> Calculando cuota...
        </div>
      </div>

      <template #footer>
        <Button label="Cancelar" icon="pi pi-times" text @click="generarCuotaDialog = false" />
        <Button
          label="Generar cuota"
          icon="pi pi-check"
          severity="warning"
          @click="generarCuota"
          :loading="generandoCuota"
          :disabled="!cuotaData.socioId || !cuotaTotal?.cuotaTotal"
        />
      </template>
    </Dialog>

    <!-- Cupones Masivos post-registro Mutual -->
    <Dialog
      v-model:visible="cuponMasivoDialog"
      header="Cupones de Pago - Mutual"
      :modal="true"
      :style="{ width: '860px', maxHeight: '90vh' }"
      :contentStyle="{ overflowY: 'auto' }"
    >
      <div v-if="cuponMasivoData">
        <div class="flex align-items-center justify-content-between mb-3">
          <span class="text-gray-400 text-sm">
            <i class="pi pi-check-circle text-green-400 mr-1"></i>
            {{ cuponMasivoData.socios.length }} pago(s) registrados exitosamente
          </span>
          <Button label="Imprimir todos" icon="pi pi-print" @click="imprimirCuponesMasivo" />
        </div>

        <!-- Grid de cupones para previsualización -->
        <div id="cupones-masivo-print" style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
          <div
            v-for="s in cuponMasivoData.socios"
            :key="s.id"
            class="cupon-masivo"
          >
            <!-- Encabezado -->
            <div class="cupon-masivo-header">
              <img src="/images/logo-udl.png" alt="UDL" style="width:44px;height:44px;object-fit:contain;" />
              <div>
                <div class="font-bold text-sm">UNIÓN DEPORTIVA LASPIUR</div>
                <div class="text-xs text-gray-400">Cupón de Pago - Mutual</div>
              </div>
            </div>

            <!-- Badge Mutual -->
            <div class="mb-2">
              <span class="cupon-mutual-badge">MUTUAL</span>
            </div>

            <!-- Datos -->
            <div class="cupon-masivo-row">
              <span class="cupon-lbl">N° Socio:</span>
              <span class="cupon-val">{{ s.numeroSocio || '-' }}</span>
            </div>
            <div class="cupon-masivo-row">
              <span class="cupon-lbl">Socio:</span>
              <span class="cupon-val">{{ s.nombre }} {{ s.apellido }}</span>
            </div>
            <div class="cupon-masivo-row">
              <span class="cupon-lbl">Concepto:</span>
              <span class="cupon-val">{{ cuponMasivoData.concepto }}</span>
            </div>
            <div class="cupon-masivo-row">
              <span class="cupon-lbl">Vencimiento:</span>
              <span class="cupon-val">{{ cuponMasivoData.fechaVencimiento ? new Date(cuponMasivoData.fechaVencimiento).toLocaleDateString('es-AR') : '-' }}</span>
            </div>

            <!-- Monto -->
            <div class="cupon-masivo-monto">
              <span class="text-xs text-gray-400 block">MONTO</span>
              <span class="text-2xl font-bold" style="color:#1a3a8f">${{ s.monto?.toLocaleString('es-AR') }}</span>
            </div>

            <div class="text-center text-xs text-gray-400 mt-2">
              Emitido: {{ cuponMasivoData.fechaEmision?.toLocaleDateString('es-AR') }}
            </div>
          </div>
        </div>
      </div>

      <template #footer>
        <Button label="Cerrar" icon="pi pi-times" text @click="cuponMasivoDialog = false" />
        <Button label="Imprimir todos" icon="pi pi-print" @click="imprimirCuponesMasivo" />
      </template>
    </Dialog>

    <!-- Generar Cupón Mutual Dialog -->
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
        <Button label="Descargar / Imprimir" icon="pi pi-print" @click="imprimirCupon" />
      </template>
    </Dialog>

    <!-- Detalle pago con desglose -->
    <Dialog v-model:visible="detalleDialog" header="Detalle del pago" :modal="true" :style="{ width: '560px' }">
      <div v-if="pagoDetalle" class="flex flex-column gap-3">
        <div><strong>Socio:</strong> {{ pagoDetalle.socioNombre }}</div>
        <div><strong>Concepto:</strong> {{ pagoDetalle.concepto }}</div>
        <div><strong>Monto total:</strong> <span class="text-green-400 font-bold">${{ pagoDetalle.monto?.toLocaleString('es-AR') }}</span></div>
        <div><strong>Estado:</strong> <Tag :severity="getEstadoSeverity(pagoDetalle.estado)" :value="pagoDetalle.estado" /></div>
        <div v-if="pagoDetalle.detalles?.length">
          <strong class="block mb-2">Desglose</strong>
          <div
            v-for="(d, i) in pagoDetalle.detalles"
            :key="i"
            class="record-card__row py-2"
            style="border-bottom: 1px solid var(--surface-border)"
          >
            <span class="record-card__label">
              {{ d.concepto }}
              <span class="block text-xs">{{ d.tipoDestino === 'Club' ? 'Club' : (d.disciplinaNombre || 'Disciplina') }}</span>
            </span>
            <span class="record-card__value">${{ d.monto?.toLocaleString('es-AR') }}</span>
          </div>
        </div>
        <Message v-else severity="info" :closable="false">Este pago no tiene desglose (cobro histórico).</Message>
      </div>
      <template #footer>
        <Button label="Cerrar" icon="pi pi-times" text @click="detalleDialog = false" />
      </template>
    </Dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useToast } from 'primevue/usetoast'
import { useConfirm } from 'primevue/useconfirm'
import { pagosService, sociosService } from '@/services'
import { notificacionesService } from '@/services/notificacionesService'
import { validarTelefonoAR } from '@/utils/phone'
import { FilterMatchMode } from 'primevue/api'
import { useMobilePagination } from '@/composables/useMobilePagination'
import PageHeader from '@/components/mobile/PageHeader.vue'
import MobileRecordCard from '@/components/mobile/MobileRecordCard.vue'
import MobilePaginator from '@/components/mobile/MobilePaginator.vue'
import WhatsAppSendDialog from '@/components/notificaciones/WhatsAppSendDialog.vue'
import html2canvas from 'html2canvas'
import { Capacitor } from '@capacitor/core'
import { shareDataUrl } from '@/platform/files'
import Button from 'primevue/button'
import Dialog from 'primevue/dialog'
import InputText from 'primevue/inputtext'
import InputNumber from 'primevue/inputnumber'
import Dropdown from 'primevue/dropdown'
import Calendar from 'primevue/calendar'
import Tag from 'primevue/tag'
import RadioButton from 'primevue/radiobutton'
import Checkbox from 'primevue/checkbox'
import Message from 'primevue/message'
import ProgressSpinner from 'primevue/progressspinner'

const toast = useToast()
const confirm = useConfirm()

// WhatsApp
const waDialog = ref(false)
const waItem = ref(null)
const waMensaje = ref('')

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

const pago = ref({})

const filters = ref({
  global: { value: null, matchMode: FilterMatchMode.CONTAINS }
})

const pagosFiltrados = computed(() => {
  const search = (filters.value.global?.value || '').toLowerCase()
  if (!search) return pagos.value
  return pagos.value.filter(p =>
    p.socioNombre?.toLowerCase().includes(search) ||
    p.concepto?.toLowerCase().includes(search)
  )
})

const { page: pagosPage, paginated: paginatedPagos } = useMobilePagination(
  pagosFiltrados,
  10,
  [() => filters.value.global?.value, estadoFilter, socioFilter]
)

// Dialog Pagar
const pagarDialog = ref(false)
const pagoAPagar = ref(null)
const metodoPagoElegido = ref('Efectivo')
const procesandoPagarDialog = ref(false)

function abrirPagarDialog(data) {
  pagoAPagar.value = data
  metodoPagoElegido.value = data.metodoPago?.toLowerCase() === 'mutual' ? 'Mutual' : 'Efectivo'
  pagarDialog.value = true
}

async function confirmarPagoDesdeDialog() {
  procesandoPagarDialog.value = true
  try {
    await pagosService.registrarPagoEfectivo(pagoAPagar.value.id, metodoPagoElegido.value)
    toast.add({ severity: 'success', summary: 'Pago confirmado', detail: `Pago de $${pagoAPagar.value.monto?.toLocaleString('es-AR')} registrado como ${metodoPagoElegido.value}`, life: 3000 })
    pagarDialog.value = false
    await loadData()
  } catch (error) {
    toast.add({ severity: 'error', summary: 'Error', detail: error.response?.data?.message || 'No se pudo registrar el pago', life: 3000 })
  } finally {
    procesandoPagarDialog.value = false
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

// Cupón masivo post-registro
const cuponMasivoDialog = ref(false)
const cuponMasivoData = ref(null)

function imprimirCuponesMasivo() {
  if (!cuponMasivoData.value) return
  if (Capacitor.isNativePlatform()) {
    toast.add({
      severity: 'info',
      summary: 'Impresión',
      detail: 'En la app, abrí cada cupón y usá Descargar / Imprimir para compartirlo',
      life: 4000
    })
    return
  }
  const d = cuponMasivoData.value
  const fechaEmision = d.fechaEmision?.toLocaleDateString('es-AR') ?? new Date().toLocaleDateString('es-AR')
  const fechaVenc = d.fechaVencimiento ? new Date(d.fechaVencimiento).toLocaleDateString('es-AR') : '-'

  const cuponesHtml = d.socios.map(s => `
    <div class="cupon">
      <div class="cupon-header">
        <img src="/images/logo-udl.png" onerror="this.style.display='none'" alt="UDL" />
        <div class="cupon-header-text">
          <h3>UNIÓN DEPORTIVA LASPIUR</h3>
          <p>Cupón de Pago - Mutual</p>
        </div>
      </div>
      <div><span class="mutual-badge">MUTUAL</span></div>
      <div class="cupon-row"><span class="lbl">N° Socio:</span><span class="val">${s.numeroSocio || '-'}</span></div>
      <div class="cupon-row"><span class="lbl">Socio:</span><span class="val">${s.nombre} ${s.apellido}</span></div>
      <div class="cupon-row"><span class="lbl">Concepto:</span><span class="val">${d.concepto}</span></div>
      <div class="cupon-row"><span class="lbl">Vencimiento:</span><span class="val">${fechaVenc}</span></div>
      <div class="cupon-monto">
        <span class="monto-label">MONTO A PAGAR</span>
        <span class="monto-val">$${s.monto?.toLocaleString('es-AR') ?? '0'}</span>
      </div>
      <div class="cupon-footer">Emitido: ${fechaEmision}</div>
    </div>`).join('')

  const ventana = window.open('', '_blank')
  ventana.document.write(`
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <title>Cupones de Pago Mutual</title>
      <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: Arial, sans-serif; background: #fff; color: #222; padding: 16px; }
        .cupones-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
        .cupon { border: 2px solid #1a3a8f; border-radius: 8px; padding: 16px; page-break-inside: avoid; background: #fff; }
        .cupon-header { display: flex; align-items: center; gap: 10px; border-bottom: 1px solid #ccc; padding-bottom: 10px; margin-bottom: 10px; }
        .cupon-header img { width: 48px; height: 48px; object-fit: contain; }
        .cupon-header-text h3 { font-size: 13px; font-weight: bold; margin: 0; }
        .cupon-header-text p { font-size: 10px; color: #555; margin: 2px 0 0; }
        .mutual-badge { display: inline-block; background: #1a3a8f; color: #fff; padding: 2px 8px; border-radius: 10px; font-size: 9px; font-weight: bold; margin-bottom: 8px; }
        .cupon-row { display: flex; justify-content: space-between; margin: 5px 0; font-size: 11px; }
        .cupon-row .lbl { color: #555; }
        .cupon-row .val { font-weight: bold; color: #000; }
        .cupon-monto { text-align: center; margin: 12px 0 8px; padding: 10px; background: #f0f4ff; border: 1px dashed #1a3a8f; border-radius: 6px; }
        .monto-label { font-size: 10px; color: #555; text-transform: uppercase; letter-spacing: 1px; display: block; margin-bottom: 4px; }
        .monto-val { font-size: 24px; font-weight: bold; color: #1a3a8f; }
        .cupon-footer { text-align: center; font-size: 9px; color: #888; border-top: 1px dashed #ccc; padding-top: 8px; margin-top: 8px; }
        @media print {
          @page { margin: 10mm; }
          body { padding: 0; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        }
      </style>
    </head>
    <body>
      <div class="cupones-grid">${cuponesHtml}</div>
    </body>
    </html>`)
  ventana.document.close()
  ventana.focus()
  setTimeout(() => { ventana.print(); ventana.close() }, 500)
}

const detalleDialog = ref(false)
const pagoDetalle = ref(null)

const generarCuotaDialog = ref(false)
const generandoCuota = ref(false)
const cuotaSubmitted = ref(false)
const cuotaData = ref({ socioId: null, mes: 1, año: new Date().getFullYear(), fechaVencimiento: null })
const cuotaTotal = ref(null)

const mesOptions = [
  { label: 'Enero', value: 1 }, { label: 'Febrero', value: 2 }, { label: 'Marzo', value: 3 },
  { label: 'Abril', value: 4 }, { label: 'Mayo', value: 5 }, { label: 'Junio', value: 6 },
  { label: 'Julio', value: 7 }, { label: 'Agosto', value: 8 }, { label: 'Septiembre', value: 9 },
  { label: 'Octubre', value: 10 }, { label: 'Noviembre', value: 11 }, { label: 'Diciembre', value: 12 }
]

const sociosCuotaOptions = computed(() =>
  socios.value.map(s => ({
    label: `${s.nombre} ${s.apellido || ''}${s.numeroSocio ? ` (#${s.numeroSocio})` : ''}${s.dni ? ` · DNI ${s.dni}` : ''}`.trim(),
    value: s.id
  }))
)

const periodoCuotaPreview = computed(() => {
  const mes = mesOptions.find(m => m.value === cuotaData.value.mes)
  return mes ? `Cuota Social - ${mes.label} ${cuotaData.value.año}` : ''
})

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

// === PAGO MUTUAL (multi-socio) ===
const pagoMutualDialog = ref(false)
const mutualSaving = ref(false)
const mutualSubmitted = ref(false)
const mutualSearch = ref('')
const mutualSociosSeleccionados = ref([])
const mutualPago = ref({ concepto: '', fechaVencimiento: new Date() })
// Array de { id, socio, monto } para edición individual
const mutualSociosConMonto = ref([])

watch(mutualSociosSeleccionados, (nuevos) => {
  // Añadir socios nuevos con su cuota como default
  const existingIds = mutualSociosConMonto.value.map(x => x.id)
  nuevos.forEach(s => {
    if (!existingIds.includes(s.id)) {
      mutualSociosConMonto.value.push({ id: s.id, socio: s, monto: s.cuotaSocio || 0 })
    }
  })
  // Eliminar socios deseleccionados en-lugar (splice preserva reactividad)
  const nuevosIds = nuevos.map(s => s.id)
  for (let i = mutualSociosConMonto.value.length - 1; i >= 0; i--) {
    if (!nuevosIds.includes(mutualSociosConMonto.value[i].id)) {
      mutualSociosConMonto.value.splice(i, 1)
    }
  }
})

const mutualSociosFiltrados = computed(() => {
  const soloMutual = socios.value.filter(s => s.pagaPorMutual)
  if (!mutualSearch.value.trim()) return soloMutual
  const q = mutualSearch.value.toLowerCase()
  return soloMutual.filter(s =>
    s.nombre?.toLowerCase().includes(q) ||
    s.email?.toLowerCase().includes(q) ||
    s.numeroSocio?.toString().includes(q)
  )
})

function openPagoMutual() {
  mutualPago.value = { concepto: '', fechaVencimiento: new Date() }
  mutualSociosSeleccionados.value = []
  mutualSociosConMonto.value = []
  mutualSearch.value = ''
  mutualSubmitted.value = false
  pagoMutualDialog.value = true
}

async function savePagosMutual() {
  mutualSubmitted.value = true
  if (mutualSociosSeleccionados.value.length === 0 || !mutualPago.value.concepto) return
  const sinMonto = mutualSociosConMonto.value.some(item => !item.monto || item.monto <= 0)
  if (sinMonto) {
    toast.add({ severity: 'warn', summary: 'Montos incompletos', detail: 'Todos los socios deben tener un monto mayor a cero', life: 3000 })
    return
  }

  mutualSaving.value = true
  try {
    await Promise.all(
      mutualSociosConMonto.value.map(item =>
        pagosService.create({
          socioId: item.id,
          concepto: mutualPago.value.concepto,
          monto: item.monto,
          fechaVencimiento: mutualPago.value.fechaVencimiento,
          generarDistribucion: false,
          marcarPagado: false,
          metodoPago: 'mutual',
          observacion: null
        })
      )
    )
    toast.add({
      severity: 'success',
      summary: 'Pagos registrados',
      detail: `Se registraron ${mutualSociosSeleccionados.value.length} pago(s) mutual correctamente`,
      life: 4000
    })
    pagoMutualDialog.value = false
    await loadData()
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: error.response?.data?.message || 'Error al registrar los pagos',
      life: 3000
    })
  } finally {
    mutualSaving.value = false
  }
}

function onSocioSelect(event) {
  pago.value.socioId = event.data.id
  socioSearch.value = ''
  if (!isEditing.value && (pago.value.metodoPago === 'efectivo' || pago.value.metodoPago === 'pendiente')) {
    cargarCuotaSocio(event.data.id)
  }
}

function toggleMutualSocio(s, val) {
  const selected = mutualSociosSeleccionados.value.some(x => x.id === s.id)
  const shouldSelect = val === undefined ? !selected : !!val
  if (shouldSelect && !selected) {
    mutualSociosSeleccionados.value = [...mutualSociosSeleccionados.value, s]
  } else if (!shouldSelect && selected) {
    mutualSociosSeleccionados.value = mutualSociosSeleccionados.value.filter(x => x.id !== s.id)
  }
}

async function cargarCuotaSocio(socioId) {
  try {
    const cuota = await pagosService.getCuotaTotal(socioId)
    if (cuota?.cuotaTotal > 0) {
      pago.value.monto = cuota.cuotaTotal
      if (!pago.value.concepto) {
        const mes = new Date().toLocaleString('es-AR', { month: 'long' })
        pago.value.concepto = `Cuota Social - ${mes} ${new Date().getFullYear()}`
      }
    }
  } catch {
    // ignore
  }
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
    if (p.metodoPago?.toLowerCase() === 'mutual') {
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

function togglePendingPago(item, val) {
  if (val) {
    if (!selectedPendingPagos.value.some(p => p.id === item.id)) {
      selectedPendingPagos.value = [...selectedPendingPagos.value, item]
    }
  } else {
    selectedPendingPagos.value = selectedPendingPagos.value.filter(p => p.id !== item.id)
  }
}

watch(estadoFilter, (val) => {
  applyFilters()
})

watch(socioFilter, (val) => {
  loadData()
})

watch(() => cuotaData.value.socioId, () => {
  loadCuotaTotal()
})

watch(
  () => [cuotaData.value.mes, cuotaData.value.año],
  ([mes, anio]) => {
    if (mes && anio) {
      const dia = Math.min(10, new Date(anio, mes, 0).getDate())
      cuotaData.value.fechaVencimiento = new Date(anio, mes - 1, dia)
    }
  }
)

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

async function verDetallePago(data) {
  try {
    pagoDetalle.value = await pagosService.getById(data.id)
    detalleDialog.value = true
  } catch {
    toast.add({ severity: 'error', summary: 'Error', detail: 'No se pudo cargar el detalle', life: 3000 })
  }
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
      const esEfectivo = pago.value.metodoPago === 'efectivo'
      const pagoData = {
        socioId: pago.value.socioId,
        concepto: pago.value.concepto,
        monto: pago.value.monto,
        fechaVencimiento: pago.value.fechaVencimiento,
        generarDistribucion: true,
        marcarPagado: esEfectivo,
        metodoPago: esEfectivo ? 'efectivo' : null,
        observacion: pago.value.observacion || null
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
  const hoy = new Date()
  const mesAnterior = new Date(hoy.getFullYear(), hoy.getMonth() - 1, 1)
  const mes = mesAnterior.getMonth() + 1
  const año = mesAnterior.getFullYear()
  const dia = Math.min(10, new Date(año, mes, 0).getDate())

  cuotaData.value = {
    socioId: null,
    mes,
    año,
    fechaVencimiento: new Date(año, mes - 1, dia)
  }
  cuotaTotal.value = null
  cuotaSubmitted.value = false
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
  cuotaSubmitted.value = true
  if (!cuotaData.value.socioId || !cuotaData.value.mes || !cuotaData.value.año || !cuotaData.value.fechaVencimiento) {
    return
  }
  if (!cuotaTotal.value?.cuotaTotal) return

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
    generandoCuota.value = false
  }
}

// Funciones de cupón de mutual
function generarCupon(data) {
  const socio = socios.value.find(s => s.id === data.socioId)
  cuponData.value = {
    socioNombre: data.socioNombre,
    numeroSocio: socio?.numeroSocio || data.numeroSocio || '-',
    concepto: data.concepto,
    monto: data.monto,
    fechaVencimiento: data.fechaVencimiento
  }
  cuponDialog.value = true
}

function _buildCuponHtml(c) {
  const fechaEmision = new Date().toLocaleDateString('es-AR')
  const fechaVenc = c.fechaVencimiento ? new Date(c.fechaVencimiento).toLocaleDateString('es-AR') : '-'
  const monto = c.monto?.toLocaleString('es-AR') ?? '0'
  return `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <title>Cupón Mutual - ${c.socioNombre}</title>
      <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: Arial, sans-serif; background: #fff; color: #222; display: flex; justify-content: center; padding: 30px; }
        .cupon {
          border: 2px solid #1a3a8f;
          border-radius: 10px;
          padding: 24px;
          width: 400px;
          background: #fff;
        }
        .header { text-align: center; border-bottom: 1px solid #ddd; padding-bottom: 14px; margin-bottom: 14px; }
        .header img { width: 60px; height: 60px; object-fit: contain; }
        .header h2 { font-size: 15px; font-weight: bold; margin: 6px 0 2px; color: #000; }
        .header p { font-size: 11px; color: #333; }
        .badge { display: inline-block; background: #222; color: #fff; padding: 2px 10px; border-radius: 10px; font-size: 10px; font-weight: bold; margin-top: 4px; }
        .fields { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 16px; }
        .field .lbl { font-size: 10px; color: #555; text-transform: uppercase; margin-bottom: 2px; }
        .field .val { font-size: 13px; font-weight: bold; color: #000; }
        .monto-box { background: #f5f5f5; border: 1px dashed #333; border-radius: 8px; text-align: center; padding: 14px; margin-bottom: 14px; }
        .monto-box .lbl { font-size: 10px; color: #555; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 4px; }
        .monto-box .val { font-size: 28px; font-weight: bold; color: #000; }
        .footer { text-align: center; font-size: 9px; color: #555; border-top: 1px dashed #aaa; padding-top: 10px; margin-top: 4px; }
        @media print {
          @page { margin: 10mm; size: A5 portrait; }
          body { padding: 0; }
          .cupon { border: 2px solid #1a3a8f; }
        }
      </style>
    </head>
    <body>
      <div class="cupon">
        <div class="header">
          <img src="/images/logo-udl.png" onerror="this.style.display='none'" />
          <h2>UNIÓN DEPORTIVA LASPIUR</h2>
          <p>Cupón de Pago</p>
          <span class="badge">MUTUAL</span>
        </div>
        <div class="fields">
          <div class="field"><div class="lbl">Socio</div><div class="val">${c.socioNombre}</div></div>
          <div class="field"><div class="lbl">N° Socio</div><div class="val">${c.numeroSocio}</div></div>
          <div class="field"><div class="lbl">Concepto</div><div class="val">${c.concepto}</div></div>
          <div class="field"><div class="lbl">Vencimiento</div><div class="val">${fechaVenc}</div></div>
        </div>
        <div class="monto-box">
          <div class="lbl">Monto a Pagar</div>
          <div class="val">$${monto}</div>
        </div>
        <div class="footer">
          <p>Fecha de Emisión: ${fechaEmision}</p>
          <p>Este cupón es válido únicamente para pago por mutual</p>
        </div>
      </div>
    </body>
    </html>`
}

async function descargarCupon() {
  try {
    const element = cuponRef.value
    if (!element) return
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

async function imprimirCupon() {
  if (Capacitor.isNativePlatform()) {
    await descargarCupon()
    return
  }
  const win = window.open('', '_blank')
  win.document.write(_buildCuponHtml(cuponData.value))
  win.document.close()
  win.focus()
  setTimeout(() => { win.print(); win.close() }, 600)
}

async function abrirWhatsApp(row) {
  try {
    const gen = await notificacionesService.generarMensaje({
      tipo: 'Vencimiento',
      referenciaId: row.id
    })
    const socio = socios.value.find(s => s.id === row.socioId)
    const clienteNombre = (gen.clienteNombre && gen.clienteNombre !== 'Cliente')
      ? gen.clienteNombre
      : (row.socioNombre || '')
    const telefono = gen.telefono || socio?.telefono || ''
    const validacionLocal = !gen.telefono && telefono ? validarTelefonoAR(telefono) : null
    waItem.value = {
      clienteNombre,
      telefono: validacionLocal?.normalizado || telefono,
      puedeWhatsApp: gen.telefono ? gen.telefonoValido : (validacionLocal?.valido ?? false),
      telefonoError: gen.telefono ? gen.telefonoError : (validacionLocal?.error ?? null),
      socioId: row.socioId,
      referenciaId: row.id
    }
    waMensaje.value = gen.mensaje
    waDialog.value = true
  } catch {
    toast.add({ severity: 'error', summary: 'No se pudo generar el mensaje', life: 3000 })
  }
}

async function onWhatsAppConfirmado({ mensaje }) {
  if (!waItem.value) return
  try {
    await notificacionesService.registrarWhatsAppAbierto({
      tipo: 'Vencimiento',
      referenciaId: waItem.value.referenciaId,
      clienteNombre: waItem.value.clienteNombre,
      socioId: waItem.value.socioId,
      telefono: waItem.value.telefono,
      mensaje
    })
  } catch { /* no crítico */ }
}

onMounted(() => {
  loadData()
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

.stat-success .stat-icon { background: linear-gradient(135deg, #22c55e, #16a34a); }
.stat-warning .stat-icon { background: linear-gradient(135deg, #f59e0b, #d97706); }
.stat-danger .stat-icon  { background: linear-gradient(135deg, #ef4444, #dc2626); }
.stat-mutual .stat-icon  { background: linear-gradient(135deg, #3b82f6, #2563eb); }

.stat-content { display: flex; flex-direction: column; }
.stat-value { font-size: 1.75rem; font-weight: 700; color: var(--text-color); }
.stat-label { font-size: 0.85rem; color: var(--text-color-secondary); }
.stat-amount { font-size: 0.75rem; color: var(--text-color-secondary); margin-top: 0.25rem; }

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

/* Cupones masivos */
.cupon-masivo {
  border: 2px solid var(--surface-border);
  border-radius: 8px;
  padding: 12px;
  background: var(--surface-card);
}

.cupon-masivo-header {
  display: flex;
  align-items: center;
  gap: 10px;
  border-bottom: 1px solid var(--surface-border);
  padding-bottom: 8px;
  margin-bottom: 8px;
}

.cupon-masivo-row {
  display: flex;
  justify-content: space-between;
  font-size: 0.8rem;
  margin: 3px 0;
}

.cupon-lbl { color: var(--text-color-secondary); }
.cupon-val { font-weight: 600; color: var(--text-color); }

.cupon-masivo-monto {
  text-align: center;
  background: rgba(26, 58, 143, 0.1);
  border: 1px dashed #1a3a8f;
  border-radius: 6px;
  padding: 8px;
  margin: 8px 0;
}

.cupon-mutual-badge {
  display: inline-block;
  background: #1a3a8f;
  color: #fff;
  padding: 2px 10px;
  border-radius: 10px;
  font-size: 0.7rem;
  font-weight: bold;
  letter-spacing: 1px;
}

/* Montos individuales */
.monto-individual-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
  max-height: 240px;
  overflow-y: auto;
}

.monto-individual-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 6px 8px;
  border-radius: 6px;
  background: var(--surface-hover);
  border: 1px solid var(--surface-border);
}

.monto-input-wrap {
  display: flex;
  align-items: center;
  background: var(--surface-ground);
  border: 1px solid var(--surface-border);
  border-radius: 6px;
  padding: 0 10px;
  min-width: 140px;
}

.monto-prefix {
  color: var(--text-color-secondary);
  font-weight: 600;
  margin-right: 4px;
}

.monto-input-raw {
  background: transparent;
  border: none;
  outline: none;
  color: var(--text-color);
  font-size: 1rem;
  font-weight: 600;
  text-align: right;
  width: 110px;
  padding: 6px 0;
}

.monto-input-raw.input-invalid {
  color: #ef4444;
}

.monto-input-raw::-webkit-inner-spin-button,
.monto-input-raw::-webkit-outer-spin-button {
  opacity: 1;
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

.socio-selector-list {
  max-height: 240px;
  overflow-y: auto;
}
.socio-selector-list.p-invalid {
  border: 1px solid var(--red-500);
  border-radius: 8px;
  padding: 4px;
}
</style>
