<template>
  <div>
    <PageHeader title="Reservas">
      <template #actions>
        <Button label="Agenda" icon="pi pi-calendar" severity="warning" size="small" @click="agendaDialog = true" />
        <Button label="Informes" icon="pi pi-chart-bar" severity="secondary" size="small" @click="openInformeDialog" />
        <Button label="Nueva Reserva" icon="pi pi-plus" size="small" @click="openNew" />
      </template>
    </PageHeader>

    <!-- Resumen de Pagos -->
    <div class="grid mb-4">
      <div class="col-6 md:col-2">
        <div class="stat-card stat-total">
          <div class="stat-icon">
            <i class="pi pi-calendar"></i>
          </div>
          <div class="stat-content">
            <span class="stat-value">{{ resumenFiltrado.totalReservas }}</span>
            <span class="stat-label">Total Reservas</span>
          </div>
        </div>      </div>
      <div class="col-6 md:col-2">
        <div class="stat-card stat-success">
          <div class="stat-icon">
            <i class="pi pi-check-circle"></i>
          </div>
          <div class="stat-content">
            <span class="stat-value">{{ resumenFiltrado.reservasPagadas }}</span>
            <span class="stat-label">Pagadas</span>
            <small class="stat-amount">${{ resumenFiltrado.montoTotalPagado.toLocaleString() }}</small>
          </div>
        </div>      </div>
      <div class="col-6 md:col-2">
        <div class="stat-card stat-warning">
          <div class="stat-icon">
            <i class="pi pi-clock"></i>
          </div>
          <div class="stat-content">
            <span class="stat-value">{{ resumenFiltrado.reservasPendientes }}</span>
            <span class="stat-label">Pendientes</span>
            <small class="stat-amount">${{ resumenFiltrado.montoTotalPendiente.toLocaleString() }}</small>
          </div>
        </div>
      </div>      <div class="col-6 md:col-3">
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
      <h3 class="m-0 mb-3">Listado de Reservas</h3>

      <div v-if="loading" class="flex justify-content-center py-5">
        <ProgressSpinner />
      </div>
      <template v-else>
        <div v-if="reservasFiltradas.length === 0" class="text-center text-gray-400 py-4">Sin reservas</div>
        <div v-else class="mobile-card-list">
          <MobileRecordCard
            v-for="r in paginatedReservas"
            :key="r.id"
            :title="r.socioNombre || r.nombreCliente || '—'"
            :subtitle="`${formatDate(r.fecha)} · ${r.horaInicio} - ${r.horaFin}`"
          >
            <template #tags>
              <Tag :value="r.espacioNombre" :severity="getTipoSeverity(r.espacioTipo)" />
              <Tag :severity="getEstadoSeverity(r.estado)" :value="r.estado" />
            </template>
            <template #body>
              <div class="record-card__row">
                <span class="record-card__label">Espacio</span>
                <span class="record-card__value">{{ r.espacioNombre }}</span>
              </div>
              <div class="record-card__row">
                <span class="record-card__label">Monto</span>
                <span class="record-card__value font-bold text-primary">${{ r.monto?.toLocaleString() }}</span>
              </div>
              <div class="record-card__row">
                <span class="record-card__label">Pago</span>
                <span class="record-card__value">
                  <span :class="`pago-${r.estadoPago?.toLowerCase()}`">{{ r.estadoPago }}</span>
                  <span v-if="r.metodoPago" class="text-gray-400 ml-1">· {{ r.metodoPago }}</span>
                </span>
              </div>
            </template>
            <template #actions>
              <Button v-if="r.estado === 'pendiente'" icon="pi pi-thumbs-up" text rounded size="small" severity="success" @click="aprobarReserva(r)" v-tooltip.top="'Aprobar'" />
              <Button v-if="r.estado === 'pendiente'" icon="pi pi-thumbs-down" text rounded size="small" severity="danger" @click="openRechazo(r)" v-tooltip.top="'Rechazar'" />
              <Button v-if="r.estado === 'pendiente'" icon="pi pi-check" text rounded size="small" severity="success" @click="confirmarReserva(r)" v-tooltip.top="'Confirmar'" />
              <Button v-if="r.estado?.toLowerCase() === 'confirmada' && r.estadoPago?.toLowerCase() === 'pendiente'" icon="pi pi-money-bill" text rounded size="small" severity="success" @click="confirmarPagoEfectivo(r)" v-tooltip.top="'Pagar'" />
              <Button v-if="r.estadoPago?.toLowerCase() !== 'pagado' && r.estado?.toLowerCase() !== 'cancelada'" icon="pi pi-trash" text rounded size="small" severity="danger" @click="confirmDelete(r)" v-tooltip.top="'Eliminar'" />
              <Button icon="pi pi-whatsapp" text rounded size="small" severity="success" @click="abrirWhatsApp(r)" v-tooltip.top="'Enviar WhatsApp'" />
            </template>
          </MobileRecordCard>
        </div>
        <MobilePaginator v-model:page="reservasPage" :rows="10" :total="reservasFiltradas.length" />
      </template>
    </div>

    <!-- Dialog de Reservas Pendientes de Efectivo -->    <Dialog 
      v-model:visible="pendientesEfectivoDialog" 
      header="Reservas Pendientes de Pago en Efectivo" 
      :modal="true"
      :style="{ width: '700px' }"
    >
      <div v-if="reservasPendientesEfectivo.length === 0" class="text-center text-gray-400 py-4">
        Sin reservas pendientes de efectivo
      </div>
      <div v-else class="mobile-card-list">
        <MobileRecordCard
          v-for="r in reservasPendientesEfectivo"
          :key="r.id"
          :title="r.socioNombre || r.nombreCliente || '—'"
          :subtitle="r.espacioNombre"
          @click="togglePendienteSeleccion(r)"
        >
          <template #leading>
            <Checkbox
              :modelValue="isPendienteSelected(r)"
              binary
              @update:modelValue="togglePendienteSeleccion(r)"
              @click.stop
            />
          </template>
          <template #body>
            <div class="record-card__row">
              <span class="record-card__label">Fecha</span>
              <span class="record-card__value">{{ formatDate(r.fecha) }}</span>
            </div>
            <div class="record-card__row">
              <span class="record-card__label">Monto</span>
              <span class="record-card__value font-bold">${{ r.monto?.toLocaleString() }}</span>
            </div>
          </template>
        </MobileRecordCard>
      </div>

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
    </Dialog>

    <!-- Dialog Pago -->
    <Dialog
      v-model:visible="pagoDialog"
      header="Confirmar Pago"
      :modal="true"
      :style="{ width: '420px' }"
    >
      <div class="flex flex-column gap-4 pt-2" v-if="pagoReserva">
        <div class="surface-ground border-round p-3">
          <div class="flex justify-content-between align-items-center">
            <span class="text-gray-300">{{ pagoReserva.espacioNombre }}</span>
            <span class="font-bold text-xl text-primary">${{ pagoReserva.monto?.toLocaleString() }}</span>
          </div>
          <small class="text-gray-400">{{ pagoReserva.socioNombre || pagoReserva.nombreCliente || 'No socio' }} · {{ pagoReserva.fecha }}</small>
        </div>

        <div class="field">
          <label class="font-medium text-gray-300 block mb-3">Forma de pago</label>
          <div class="flex flex-column gap-2">
            <div
              v-for="op in metodosPagoOpciones"
              :key="op.value"
              class="metodo-pago-card p-3 border-round cursor-pointer flex align-items-center gap-3"
              :class="{ 'selected': metodoPagoSeleccionado === op.value }"
              @click="metodoPagoSeleccionado = op.value"
            >
              <i :class="[op.icon, 'text-xl']"></i>
              <span class="font-medium">{{ op.label }}</span>
              <i v-if="metodoPagoSeleccionado === op.value" class="pi pi-check-circle text-primary ml-auto"></i>
            </div>
          </div>
        </div>
      </div>
      <template #footer>
        <Button label="Cancelar" icon="pi pi-times" text @click="pagoDialog = false" />
        <Button label="Confirmar pago" icon="pi pi-check" severity="success" @click="doConfirmarPago" :loading="savingPago" />
      </template>
    </Dialog>

    <!-- Dialog Agenda: fechas con reservas pendientes -->
    <Dialog v-model:visible="agendaDialog" header="Agenda — Próximas Reservas" :modal="true" :style="{ width: '640px' }">
      <div v-if="agendaAgrupada.length === 0" class="text-center py-6 text-gray-400">
        <i class="pi pi-calendar text-4xl text-gray-500 mb-3 block"></i>
        <p class="text-lg">No hay reservas próximas cargadas.</p>
      </div>
      <div v-else class="flex flex-column gap-3">
        <p class="text-gray-400 m-0 text-sm">
          <i class="pi pi-info-circle mr-1"></i>
          {{ agendaAgrupada.reduce((s,g) => s + g.reservas.length, 0) }} reserva(s) en los próximos días
          <span v-if="agendaTotalPendientes > 0" class="text-yellow-400 font-medium ml-1">· {{ agendaTotalPendientes }} pendiente(s) de aprobación</span>
        </p>
        <div v-for="grupo in agendaAgrupada" :key="grupo.fecha" class="border-round overflow-hidden" style="border: 1px solid var(--surface-border)">
          <!-- Cabecera de fecha -->
          <div class="flex align-items-center justify-content-between px-3 py-2" style="background: var(--surface-ground)">
            <div class="flex align-items-center gap-2">
              <i class="pi pi-calendar text-primary"></i>
              <span class="font-bold">{{ grupo.fechaLabel }}</span>
              <Tag :value="grupo.reservas.length + ' reserva' + (grupo.reservas.length > 1 ? 's' : '')" severity="secondary" />
              <Tag v-if="grupo.pendientes > 0" :value="grupo.pendientes + ' pendiente' + (grupo.pendientes > 1 ? 's' : '')" severity="warning" />
            </div>
            <span class="text-gray-400 text-sm">{{ grupo.diasRestantes }}</span>
          </div>
          <!-- Lista de reservas del día -->
          <div v-for="r in grupo.reservas" :key="r.id" class="flex align-items-center justify-content-between px-3 py-2" style="border-top: 1px solid var(--surface-border)">
            <div class="flex align-items-center gap-3">
              <Tag :severity="getEstadoSeverity(r.estado)" :value="r.estado" style="font-size:0.7rem" />
              <div class="flex flex-column">
                <span class="font-medium text-sm">{{ r.horaInicio }} — {{ r.horaFin }}</span>
                <span class="text-gray-400 text-xs">{{ r.espacioNombre }}</span>
              </div>
              <div class="flex flex-column">
                <span class="text-sm">{{ r.socioNombre || (r.nombreCliente + ' ' + (r.apellidoCliente || '')).trim() }}</span>
                <span class="text-gray-400 text-xs">${{ (r.monto || 0).toLocaleString('es-AR') }}</span>
              </div>
            </div>
            <div v-if="r.estado === 'pendiente'" class="flex gap-1">
              <Button icon="pi pi-thumbs-up" text rounded size="small" severity="success" v-tooltip.top="'Aprobar'" @click="aprobarReserva(r); agendaDialog = false" />
              <Button icon="pi pi-thumbs-down" text rounded size="small" severity="danger" v-tooltip.top="'Rechazar'" @click="openRechazo(r); agendaDialog = false" />
            </div>
          </div>
        </div>
      </div>
      <template #footer>
        <Button label="Cerrar" icon="pi pi-times" text @click="agendaDialog = false" />
      </template>
    </Dialog>

    <!-- Dialog Informes -->
    <Dialog
      v-model:visible="informeDialog"
      header="Informes de Reservas"
      :modal="true"
      :style="{ width: '980px' }"
    >
      <TabView>
        <!-- ── Tab Mensual ─────────────────────────────────────────── -->
        <TabPanel header="Mensual">
          <div class="flex flex-column gap-4 pt-2">
            <div class="grid align-items-end">
              <div class="col-12 md:col-3">
                <label class="font-medium text-gray-300 block mb-2">Mes</label>
                <Dropdown v-model="informeFiltros.mes" :options="mesesOptions" optionLabel="label" optionValue="value" class="w-full" />
              </div>
              <div class="col-12 md:col-2">
                <label class="font-medium text-gray-300 block mb-2">Año</label>
                <Dropdown v-model="informeFiltros.anio" :options="aniosOptions" class="w-full" />
              </div>
              <div class="col-12 md:col-4">
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
          </div>
          <div class="flex justify-content-end gap-2 mt-3">
            <Button label="Cerrar" icon="pi pi-times" text @click="informeDialog = false" />
            <Button v-if="informe" label="Exportar PDF" icon="pi pi-file-pdf" severity="danger" @click="exportarPDF" />
          </div>
        </TabPanel>

        <!-- ── Tab Anual ───────────────────────────────────────────── -->
        <TabPanel header="Anual">
          <div class="flex flex-column gap-4 pt-2">
            <div class="grid align-items-end">
              <div class="col-12 md:col-3">
                <label class="font-medium text-gray-300 block mb-2">Año</label>
                <Dropdown v-model="informeAnualFiltros.anio" :options="aniosOptions" class="w-full" />
              </div>
              <div class="col-12 md:col-4">
                <label class="font-medium text-gray-300 block mb-2">Espacio (opcional)</label>
                <Dropdown
                  v-model="informeAnualFiltros.espacioId"
                  :options="espaciosFiltroOpciones"
                  optionLabel="nombre"
                  optionValue="id"
                  placeholder="Todos los espacios"
                  class="w-full"
                  showClear
                />
              </div>
              <div class="col-12 md:col-3">
                <Button label="Generar informe anual" icon="pi pi-search" class="w-full" @click="generarInformeAnual" :loading="loadingInformeAnual" />
              </div>
            </div>

            <div v-if="informeAnual">
              <!-- Totales del año -->
              <div class="grid mb-3">
                <div class="col-6 md:col-2">
                  <div class="surface-ground border-round p-3 text-center">
                    <div class="text-2xl font-bold">{{ informeAnualTotales.total }}</div>
                    <div class="text-sm text-color-secondary">Total {{ informeAnualFiltros.anio }}</div>
                  </div>
                </div>
                <div class="col-6 md:col-2">
                  <div class="surface-ground border-round p-3 text-center">
                    <div class="text-2xl font-bold text-green-400">{{ informeAnualTotales.aprobadas }}</div>
                    <div class="text-sm text-color-secondary">Aprobadas</div>
                  </div>
                </div>
                <div class="col-6 md:col-2">
                  <div class="surface-ground border-round p-3 text-center">
                    <div class="text-2xl font-bold text-red-400">{{ informeAnualTotales.rechazadas }}</div>
                    <div class="text-sm text-color-secondary">Rechazadas</div>
                  </div>
                </div>
                <div class="col-6 md:col-2">
                  <div class="surface-ground border-round p-3 text-center">
                    <div class="text-2xl font-bold text-yellow-400">{{ informeAnualTotales.pendientes }}</div>
                    <div class="text-sm text-color-secondary">Pendientes</div>
                  </div>
                </div>
                <div class="col-6 md:col-2">
                  <div class="surface-ground border-round p-3 text-center">
                    <div class="text-xl font-bold">${{ informeAnualTotales.montoTotal.toLocaleString('es-AR') }}</div>
                    <div class="text-sm text-color-secondary">Monto Total</div>
                  </div>
                </div>
                <div class="col-6 md:col-2">
                  <div class="surface-ground border-round p-3 text-center">
                    <div class="text-xl font-bold text-green-400">${{ informeAnualTotales.cobrado.toLocaleString('es-AR') }}</div>
                    <div class="text-sm text-color-secondary">Cobrado</div>
                  </div>
                </div>
              </div>

              <!-- Tabla por mes -->
              <DataTable :value="informeAnual" class="p-datatable-sm" responsiveLayout="scroll">
                <Column field="mes" header="Mes" />
                <Column field="total" header="Total" sortable />
                <Column field="aprobadas" header="Aprobadas" sortable>
                  <template #body="s"><span class="text-green-400 font-medium">{{ s.data.aprobadas }}</span></template>
                </Column>
                <Column field="rechazadas" header="Rechazadas" sortable>
                  <template #body="s"><span class="text-red-400 font-medium">{{ s.data.rechazadas }}</span></template>
                </Column>
                <Column field="pendientes" header="Pendientes" sortable>
                  <template #body="s"><span class="text-yellow-400 font-medium">{{ s.data.pendientes }}</span></template>
                </Column>
                <Column header="Monto Total" sortable field="montoTotal">
                  <template #body="s"><span class="font-bold">${{ s.data.montoTotal.toLocaleString('es-AR') }}</span></template>
                </Column>
                <Column header="Cobrado" sortable field="cobrado">
                  <template #body="s"><span class="font-bold text-green-400">${{ s.data.cobrado.toLocaleString('es-AR') }}</span></template>
                </Column>
              </DataTable>
            </div>

            <div v-else-if="!loadingInformeAnual" class="text-center py-5 text-color-secondary">
              <i class="pi pi-calendar text-4xl mb-3 block"></i>
              Seleccioná el año y presioná <strong>Generar informe anual</strong> para ver los datos.
            </div>
          </div>
          <div class="flex justify-content-end gap-2 mt-3">
            <Button label="Cerrar" icon="pi pi-times" text @click="informeDialog = false" />
            <Button v-if="informeAnual" label="Exportar PDF" icon="pi pi-file-pdf" severity="danger" @click="exportarPDFAnual" />
          </div>
        </TabPanel>
      </TabView>
    </Dialog>

    <!-- Create Dialog -->
    <Dialog 
      v-model:visible="reservaDialog" 
      header="Nueva Reserva" 
      :modal="true"
      :style="{ width: '550px' }"
    >
      <div class="flex flex-column gap-4 pt-3">
        <!-- Toggle Socio / No socio -->
        <div class="field">
          <div class="flex align-items-center gap-3">
            <InputSwitch id="esSocioSwitch" v-model="esSocio" />
            <label for="esSocioSwitch" class="font-medium" :class="esSocio ? 'text-primary' : 'text-orange-400'">
              {{ esSocio ? 'Reserva para socio' : 'Reserva para no socio' }}
            </label>
          </div>
        </div>

        <!-- Socio (si es socio) -->
        <div v-if="esSocio" class="field">
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
            filterFields="['nombre','apellido','numeroSocio']"
            :class="{ 'p-invalid': submitted && esSocio && !reserva.socioId }"
          >
            <template #value="slotProps">
              <span v-if="slotProps.value">
                {{ socios.find(s => s.id === slotProps.value)?.nombre }}
                {{ socios.find(s => s.id === slotProps.value)?.apellido }}
                <span class="text-gray-400 text-sm ml-1">#{{ socios.find(s => s.id === slotProps.value)?.numeroSocio }}</span>
              </span>
              <span v-else class="text-gray-400">Seleccione un socio</span>
            </template>
            <template #option="slotProps">
              <div>
                <span class="font-medium">{{ slotProps.option.nombre }} {{ slotProps.option.apellido }}</span>
                <span class="text-gray-400 text-sm ml-2">#{{ slotProps.option.numeroSocio }}</span>
              </div>
            </template>
          </Dropdown>
          <small v-if="submitted && esSocio && !reserva.socioId" class="p-error">El socio es requerido</small>
        </div>

        <!-- Datos del cliente (si no es socio) -->
        <template v-if="!esSocio">
          <div class="field">
            <label class="font-medium text-gray-300">Nombre *</label>
            <InputText v-model="reserva.nombreCliente" class="w-full mt-2" placeholder="Nombre"
              :class="{ 'p-invalid': submitted && !esSocio && !reserva.nombreCliente }" />
            <small v-if="submitted && !esSocio && !reserva.nombreCliente" class="p-error">El nombre es requerido</small>
          </div>
          <div class="grid" style="margin: 0">
            <div class="col-12 md:col-6" style="min-width:0">
              <label class="font-medium text-gray-300">Apellido</label>
              <InputText v-model="reserva.apellidoCliente" class="w-full mt-2" placeholder="Apellido" />
            </div>
            <div class="col-12 md:col-6" style="min-width:0">
              <label class="font-medium text-gray-300">Teléfono</label>
              <InputText v-model="reserva.telefonoCliente" class="w-full mt-2" placeholder="Teléfono" />
            </div>
          </div>
          <div class="field">
            <label class="font-medium text-gray-300">Importe manual</label>
            <InputNumber v-model="reserva.montoManual" mode="currency" currency="ARS" locale="es-AR"
              class="w-full mt-2" inputClass="w-full" placeholder="Dejar vacío para usar precio del espacio" />
            <small class="text-gray-400">Si no se ingresa, se usará el precio configurado en el espacio.</small>
          </div>
        </template>

        <div class="field">
          <label for="espacio" class="font-medium text-gray-300">Espacio *</label>
          <Dropdown 
            id="espacio"
            v-model="reserva.espacioId" 
            :options="espacioForzado ? misEspacios : espaciosActivos" 
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
            :minDate="startOfTodayLocal()"
            showIcon
            :class="{ 'p-invalid': submitted && !reserva.fecha }"
            @date-select="onReservaFechaSelect"
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
                'selected': reserva.horaInicio === turno.horaInicio && reserva.horaFin === turno.horaFin,
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
                  <i v-else-if="reserva.horaInicio === turno.horaInicio && reserva.horaFin === turno.horaFin" class="pi pi-check-circle text-primary text-xl"></i>
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

    <WhatsAppSendDialog
      v-model="waDialog"
      :cliente-nombre="waItem?.clienteNombre || ''"
      :telefono="waItem?.telefono || ''"
      tipo="Reserva"
      :mensaje="waMensaje"
      :telefono-valido="waItem?.puedeWhatsApp"
      :telefono-error="waItem?.telefonoError"
      @confirmado="onWhatsAppConfirmado"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, nextTick, watch } from 'vue'
import { useToast } from 'primevue/usetoast'
import { useConfirm } from 'primevue/useconfirm'
import { useAuthStore } from '@/stores/auth'
import { reservasService, espaciosService, sociosService } from '@/services'
import { notificacionesService } from '@/services/notificacionesService'
import { validarTelefonoAR } from '@/utils/phone'
import WhatsAppSendDialog from '@/components/notificaciones/WhatsAppSendDialog.vue'
import {
  formatCalendarDateFromApi,
  formatDateOnlyForApi,
  startOfTodayLocal,
  toLocalCalendarDate
} from '@/utils/reservationDates'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { savePdfDocument, downloadTextFile } from '@/platform/files'
import { useMobilePagination } from '@/composables/useMobilePagination'
import PageHeader from '@/components/mobile/PageHeader.vue'
import MobileRecordCard from '@/components/mobile/MobileRecordCard.vue'
import MobilePaginator from '@/components/mobile/MobilePaginator.vue'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Button from 'primevue/button'
import Dialog from 'primevue/dialog'
import TabView from 'primevue/tabview'
import TabPanel from 'primevue/tabpanel'
import Dropdown from 'primevue/dropdown'
import Calendar from 'primevue/calendar'
import Textarea from 'primevue/textarea'
import Tag from 'primevue/tag'
import InputSwitch from 'primevue/inputswitch'
import InputNumber from 'primevue/inputnumber'
import InputText from 'primevue/inputtext'
import Checkbox from 'primevue/checkbox'
import ProgressSpinner from 'primevue/progressspinner'

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
const esSocio = ref(true)

// WhatsApp
const waDialog = ref(false)
const waItem = ref(null)
const waMensaje = ref('')

// Espacio forzado para admins no-master
const espacioForzado = ref(false)
const misEspaciosIds = ref([])

// Reservas visibles: master ve todo, admin solo sus espacios
const reservasFiltradas = computed(() => {
  if (!espacioForzado.value) return reservas.value
  if (misEspaciosIds.value.length === 0) return []
  return reservas.value.filter(r => misEspaciosIds.value.includes(r.espacioId))
})

const { page: reservasPage, paginated: paginatedReservas } = useMobilePagination(
  reservasFiltradas,
  10,
  [() => filtros.value.socioId, () => filtros.value.espacioId, () => filtros.value.estado, () => filtros.value.estadoPago, () => filtros.value.fechaDesde, () => filtros.value.fechaHasta]
)

// Dialog de pendientes efectivo
const pendientesEfectivoDialog = ref(false)

// Agenda: reservas con fecha futura agrupadas por fecha
const agendaDialog = ref(false)
const agendaAgrupada = computed(() => {
  const hoy = new Date(); hoy.setHours(0, 0, 0, 0)
  const proximas = reservasFiltradas.value.filter(r => {
    if (r.estado?.toLowerCase() === 'cancelada') return false
    const fechaR = new Date((r.fecha ?? '').split('T')[0] + 'T00:00:00')
    return fechaR >= hoy
  })
  const grupos = {}
  proximas.forEach(r => {
    const key = (r.fecha ?? '').split('T')[0]
    if (!grupos[key]) grupos[key] = []
    grupos[key].push(r)
  })
  return Object.entries(grupos)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([fecha, reservas]) => {
      const d = new Date(fecha + 'T00:00:00')
      const diff = Math.round((d - hoy) / 86400000)
      const fechaLabel = d.toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' })
      const diasRestantes = diff === 0 ? 'Hoy' : diff === 1 ? 'Mañana' : `En ${diff} días`
      const pendientes = reservas.filter(r => r.estado === 'pendiente').length
      return { fecha, fechaLabel, diasRestantes, reservas, pendientes }
    })
})
const agendaTotalPendientes = computed(() => agendaAgrupada.value.reduce((s, g) => s + g.pendientes, 0))
const reservasParaConfirmar = ref([])

// Aprobación de reservas
const rechazoDialog = ref(false)
const motivoRechazo = ref('')
const rechazoSubmitted = ref(false)
const procesandoAprobacion = ref(false)
const reservaEnProceso = ref(null)

// Dialog pago
const pagoDialog = ref(false)
const pagoReserva = ref(null)
const metodoPagoSeleccionado = ref('Efectivo')
const savingPago = ref(false)
const metodosPagoOpciones = [
  { label: 'Efectivo', value: 'Efectivo', icon: 'pi pi-money-bill' },
  { label: 'Transferencia', value: 'Transferencia', icon: 'pi pi-arrow-right-arrow-left' },
  { label: 'MercadoPago', value: 'MercadoPago', icon: 'pi pi-credit-card' }
]

// Informe mensual
const informeDialog = ref(false)
const loadingInforme = ref(false)
const informe = ref(null)
const informeFiltros = ref({
  mes: new Date().getMonth() + 1,
  anio: new Date().getFullYear(),
  espacioId: null
})

// Informe anual
const loadingInformeAnual = ref(false)
const informeAnual = ref(null)
const informeAnualFiltros = ref({
  anio: new Date().getFullYear(),
  espacioId: null
})
const informeAnualTotales = computed(() => {
  if (!informeAnual.value) return { total: 0, aprobadas: 0, rechazadas: 0, pendientes: 0, montoTotal: 0, cobrado: 0 }
  return informeAnual.value.reduce((acc, m) => ({
    total: acc.total + m.total,
    aprobadas: acc.aprobadas + m.aprobadas,
    rechazadas: acc.rechazadas + m.rechazadas,
    pendientes: acc.pendientes + m.pendientes,
    montoTotal: acc.montoTotal + m.montoTotal,
    cobrado: acc.cobrado + m.cobrado
  }), { total: 0, aprobadas: 0, rechazadas: 0, pendientes: 0, montoTotal: 0, cobrado: 0 })
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
  { label: 'Cancelada', value: 'cancelada' }
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
  reservasFiltradas.value.filter(r => r.estadoPago === 'pendiente' && r.metodoPago === 'efectivo')
)

const reservasPendientesAprobacion = computed(() =>
  reservasFiltradas.value.filter(r => r.estado === 'pendiente')
)

const resumenFiltrado = computed(() => {
  const lista = reservasFiltradas.value
  return {
    totalReservas: lista.length,
    reservasPagadas: lista.filter(r => r.estadoPago?.toLowerCase() === 'pagado').length,
    montoTotalPagado: lista.filter(r => r.estadoPago?.toLowerCase() === 'pagado').reduce((s, r) => s + (r.monto || 0), 0),
    reservasPendientes: lista.filter(r => r.estadoPago?.toLowerCase() === 'pendiente').length,
    montoTotalPendiente: lista.filter(r => r.estadoPago?.toLowerCase() === 'pendiente').reduce((s, r) => s + (r.monto || 0), 0)
  }
})

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
    'cancelada': 'danger'
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
  return formatCalendarDateFromApi(date)
}

function formatDateForApi(date) {
  return formatDateOnlyForApi(date)
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
  if (!reserva.value.fecha) {
    reserva.value.fecha = startOfTodayLocal()
  }
  if (reserva.value.espacioId && reserva.value.fecha) {
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
    const turnoSel = turnos.value.find(t => t.horaInicio === reserva.value.horaInicio && t.horaFin === reserva.value.horaFin)
    return turnoSel?.precio || 0
  }

  // Cancha: precio fijo por reserva
  return espacioSeleccionado.value.precioPorHora || 0
}

function onReservaFechaSelect(ev) {
  const normalized = toLocalCalendarDate(ev)
  if (normalized) reserva.value.fecha = normalized
}

function openNew() {
  reserva.value = { fecha: startOfTodayLocal() }
  turnos.value = []
  submitted.value = false
  esSocio.value = true
  reservaDialog.value = true
}

function hideDialog() {
  reservaDialog.value = false
  submitted.value = false
}

watch(
  () => reserva.value.fecha,
  (fecha) => {
    if (!reservaDialog.value) return
    if (fecha) {
      const normalized = toLocalCalendarDate(fecha)
      if (normalized && fecha instanceof Date && normalized.getTime() !== fecha.getTime()) {
        reserva.value.fecha = normalized
        return
      }
    }
    if (!reserva.value.espacioId) return
    if (!fecha) {
      turnos.value = []
      return
    }
    loadTurnos()
  }
)

async function saveReserva() {
  submitted.value = true

  if (esSocio.value && !reserva.value.socioId) return
  if (!esSocio.value && !reserva.value.nombreCliente) return
  if (!reserva.value.espacioId || !reserva.value.fecha || !reserva.value.horaInicio) return

  const fechaApi = formatDateForApi(reserva.value.fecha)
  if (!fechaApi) {
    toast.add({ severity: 'warn', summary: 'Fecha inválida', life: 3000 })
    return
  }

  saving.value = true
  try {
    await reservasService.createAdmin({
      socioId: esSocio.value ? reserva.value.socioId : null,
      espacioId: reserva.value.espacioId,
      fecha: fechaApi,
      horaInicio: reserva.value.horaInicio,
      horaFin: reserva.value.horaFin,
      observaciones: reserva.value.observaciones,
      esSocio: esSocio.value,
      nombreCliente: esSocio.value ? null : reserva.value.nombreCliente,
      apellidoCliente: esSocio.value ? null : reserva.value.apellidoCliente,
      telefonoCliente: esSocio.value ? null : reserva.value.telefonoCliente,
      montoManual: esSocio.value ? null : (reserva.value.montoManual || null)
    })
    toast.add({
      severity: 'success',
      summary: 'Reserva creada',
      detail: `Fecha guardada: ${formatCalendarDateFromApi(fechaApi)}`,
      life: 4000
    })
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
function isPendienteSelected(r) {
  return reservasParaConfirmar.value.some(x => x.id === r.id)
}

function togglePendienteSeleccion(r) {
  const idx = reservasParaConfirmar.value.findIndex(x => x.id === r.id)
  if (idx >= 0) reservasParaConfirmar.value.splice(idx, 1)
  else reservasParaConfirmar.value.push(r)
}

function mostrarPendientesEfectivo() {
  reservasParaConfirmar.value = []
  pendientesEfectivoDialog.value = true
}

async function confirmarPagoEfectivo(data) {
  pagoReserva.value = data
  metodoPagoSeleccionado.value = 'Efectivo'
  pagoDialog.value = true
}

async function doConfirmarPago() {
  savingPago.value = true
  try {
    await reservasService.confirmarPagoEfectivo([pagoReserva.value.id], metodoPagoSeleccionado.value)
    toast.add({ severity: 'success', summary: 'Pago confirmado', detail: `Método: ${metodoPagoSeleccionado.value}`, life: 3000 })
    pagoDialog.value = false
    await loadReservas()
    await loadResumenPagos()
  } catch (error) {
    toast.add({ severity: 'error', summary: 'Error', detail: error.response?.data?.message || 'No se pudo confirmar el pago', life: 3000 })
  } finally {
    savingPago.value = false
  }
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

// ── Informe Mensual ────────────────────────────────────────────────────────────
function openInformeDialog() {
  informe.value = null
  informeAnual.value = null
  if (espacioForzado.value) {
    informeFiltros.value.espacioId = filtros.value.espacioId
    informeAnualFiltros.value.espacioId = filtros.value.espacioId
  }
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

async function generarInformeAnual() {
  loadingInformeAnual.value = true
  informeAnual.value = null
  try {
    const { anio, espacioId } = informeAnualFiltros.value
    const resultados = await Promise.all(
      mesesOptions.map(m => reservasService.getInforme(m.value, anio, espacioId || null).catch(() => null))
    )
    informeAnual.value = mesesOptions.map((m, i) => {
      const r = resultados[i]
      return {
        mes: m.label,
        total: r?.totalReservas ?? 0,
        aprobadas: r?.reservasAprobadas ?? 0,
        rechazadas: r?.reservasRechazadas ?? 0,
        pendientes: r?.reservasPendientes ?? 0,
        montoTotal: r?.montoTotal ?? 0,
        cobrado: r?.montoRecaudado ?? 0
      }
    })
  } catch (e) {
    toast.add({ severity: 'error', summary: 'Error', detail: 'No se pudo generar el informe anual', life: 3000 })
  } finally {
    loadingInformeAnual.value = false
  }
}

function exportarPDFAnual() {
  if (!informeAnual.value) return
  const { anio, espacioId } = informeAnualFiltros.value
  const espacioLabel = espacioId
    ? (espaciosFiltroOpciones.value.find(e => e.id === espacioId)?.nombre || 'Todos')
    : 'Todos los espacios'
  const tot = informeAnualTotales.value

  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' })

  doc.setFillColor(30, 30, 46)
  doc.rect(0, 0, 297, 28, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(18)
  doc.setFont('helvetica', 'bold')
  doc.text('Informe Anual de Reservas', 14, 11)
  doc.setFontSize(11)
  doc.setFont('helvetica', 'normal')
  doc.text(`Año: ${anio}   |   Espacio: ${espacioLabel}`, 14, 20)
  doc.setFontSize(9)
  doc.text(`Generado: ${new Date().toLocaleDateString('es-AR')}`, 257, 20, { align: 'right' })

  doc.setTextColor(30, 30, 46)
  const resumenY = 35
  const stats = [
    ['Total', tot.total], ['Aprobadas', tot.aprobadas], ['Rechazadas', tot.rechazadas],
    ['Pendientes', tot.pendientes],
    ['Monto Total', `$${tot.montoTotal.toLocaleString('es-AR')}`],
    ['Cobrado', `$${tot.cobrado.toLocaleString('es-AR')}`]
  ]
  const boxW = 44, boxH = 14, gap = 4, startX = 14
  stats.forEach(([label, val], i) => {
    const x = startX + i * (boxW + gap)
    doc.setFillColor(245, 245, 250)
    doc.roundedRect(x, resumenY, boxW, boxH, 2, 2, 'F')
    doc.setFont('helvetica', 'bold'); doc.setFontSize(13); doc.setTextColor(30, 30, 46)
    doc.text(String(val), x + boxW / 2, resumenY + 8, { align: 'center' })
    doc.setFont('helvetica', 'normal'); doc.setFontSize(8); doc.setTextColor(100, 100, 120)
    doc.text(label, x + boxW / 2, resumenY + 12.5, { align: 'center' })
  })

  autoTable(doc, {
    startY: resumenY + boxH + 8,
    head: [['Mes', 'Total', 'Aprobadas', 'Rechazadas', 'Pendientes', 'Monto Total', 'Cobrado']],
    body: informeAnual.value.map(m => [
      m.mes, m.total, m.aprobadas, m.rechazadas, m.pendientes,
      `$${m.montoTotal.toLocaleString('es-AR')}`,
      `$${m.cobrado.toLocaleString('es-AR')}`
    ]),
    theme: 'grid',
    headStyles: { fillColor: [30, 30, 46], textColor: 255, fontStyle: 'bold', fontSize: 10 },
    bodyStyles: { fontSize: 9, textColor: [30, 30, 46] },
    alternateRowStyles: { fillColor: [248, 248, 252] },
    columnStyles: { 5: { halign: 'right', fontStyle: 'bold' }, 6: { halign: 'right', fontStyle: 'bold' } },
    margin: { left: 14, right: 14 }
  })

  savePdfDocument(doc, `informe-anual-reservas-${anio}.pdf`)
}
function aplicarFiltroEspacio() {
  const user = authStore.user
  if (!user || user.rol === 'master') return

  // Siempre activar el filtro para admins no-master
  espacioForzado.value = true

  // Espacios por asignación directa N:M
  const porAsignacion = espacios.value.filter(e =>
    e.adminsAsignados?.some(a => a.adminId === user.id)
  )

  // Espacios por deporte del admin
  const porDeporte = user.deporte
    ? espacios.value.filter(e => e.deporte === user.deporte)
    : []

  // Unión sin duplicados
  const ids = new Set([...porAsignacion.map(e => e.id), ...porDeporte.map(e => e.id)])
  misEspaciosIds.value = [...ids]

  // Pre-seleccionar en el filtro si hay exactamente uno
  if (misEspaciosIds.value.length === 1) {
    filtros.value.espacioId = misEspaciosIds.value[0]
  }
}

async function abrirWhatsApp(row) {
  try {
    const gen = await notificacionesService.generarMensaje({
      tipo: 'Reserva',
      referenciaId: row.id
    })
    // 'Cliente' es el nombre por defecto del backend cuando no hay item en cola
    const clienteNombre = (gen.clienteNombre && gen.clienteNombre !== 'Cliente')
      ? gen.clienteNombre
      : (row.socioNombre || row.nombreCliente || '')
    const telefono = gen.telefono || row.socioTelefono || row.telefonoCliente || ''
    // Si el backend no tenía el teléfono, validarlo localmente con el fallback
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
      tipo: 'Reserva',
      referenciaId: waItem.value.referenciaId,
      clienteNombre: waItem.value.clienteNombre,
      socioId: waItem.value.socioId,
      telefono: waItem.value.telefono,
      mensaje
    })
  } catch { /* no crítico */ }
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

/* Cards view */
.reservas-cards-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 0.75rem;
}
.reserva-card {
  background: var(--surface-section);
  border: 1px solid var(--surface-border);
  border-radius: 10px;
  padding: 0.9rem;
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
}
.reserva-card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 0.5rem;
}
.reserva-card-body {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  font-size: 0.875rem;
}
.reserva-card-row {
  display: flex;
  align-items: center;
  color: var(--text-color);
}
.reserva-card-actions {
  display: flex;
  gap: 0.25rem;
  justify-content: flex-end;
  border-top: 1px solid var(--surface-border);
  padding-top: 0.5rem;
  margin-top: 0.1rem;
}
@media (max-width: 480px) {
  .reservas-cards-grid { grid-template-columns: 1fr; }
}

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

.metodo-pago-card {
  border: 1px solid rgba(255,255,255,0.1);
  background: rgba(255,255,255,0.04);
  transition: all 0.2s;
}
.metodo-pago-card:hover {
  border-color: rgba(255,255,255,0.25);
  background: rgba(255,255,255,0.08);
}
.metodo-pago-card.selected {
  border-color: var(--primary-color, #6366f1);
  background: rgba(99, 102, 241, 0.15);
}
</style>
