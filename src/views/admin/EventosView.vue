<template>
  <div>
    <PageHeader title="Eventos">
      <template #actions>
        <Button label="Nuevo Evento" icon="pi pi-plus" size="small" @click="openNuevoEvento" />
      </template>
    </PageHeader>    <!-- Tabs: Activos / Cerrados -->
    <TabView v-model:activeIndex="tabActivo" class="tabview-dark mb-4">
      <TabPanel header="Eventos Activos">
        <div v-if="loadingEventos" class="flex justify-content-center py-6">
          <ProgressSpinner />
        </div>
        <div v-else-if="eventosActivos.length === 0" class="text-center py-6">
          <i class="pi pi-calendar text-5xl text-gray-600 mb-3 block"></i>
          <p class="text-gray-400">No hay eventos activos</p>
          <Button label="Crear primer evento" icon="pi pi-plus" class="mt-2" @click="openNuevoEvento" />
        </div>
        <div v-else class="grid">
          <div v-for="evento in eventosActivos" :key="evento.id" class="col-12 lg:col-6 xl:col-4">
            <div class="evento-card cursor-pointer" @click="abrirEvento(evento)">
              <div class="flex align-items-start justify-content-between mb-3">
                <div>                  <div class="font-bold text-lg mb-1" style="color: var(--text-color)">{{ evento.nombre }}</div>
                  <div class="text-gray-400 text-sm">{{ formatDate(evento.fecha) }}</div>
                  <div v-if="evento.lugar" class="text-gray-500 text-sm"><i class="pi pi-map-marker mr-1"></i>{{ evento.lugar }}</div>
                </div>
                <Tag value="Activo" severity="success" />
              </div>
              <div class="grid">
                <div class="col-6">
                  <div class="mini-resumen">
                    <span class="text-gray-500 text-xs block">Ingresos</span>
                    <span class="text-green-400 font-bold">${{ (evento.totalIngresos ?? 0).toLocaleString('es-AR') }}</span>
                  </div>
                </div>
                <div class="col-6">
                  <div class="mini-resumen">
                    <span class="text-gray-500 text-xs block">Gastos</span>
                    <span class="text-red-400 font-bold">${{ (evento.totalEgresos ?? 0).toLocaleString('es-AR') }}</span>
                  </div>
                </div>
                <div class="col-12">
                  <div class="mini-resumen" :style="(evento.totalIngresos??0)-(evento.totalEgresos??0) >= 0 ? 'border-color:#22c55e33' : 'border-color:#ef444433'">
                    <span class="text-gray-500 text-xs block">Resultado neto</span>
                    <span class="font-bold text-lg" :class="(evento.totalIngresos??0)-(evento.totalEgresos??0) >= 0 ? 'text-green-400' : 'text-red-400'">
                      {{ (evento.totalIngresos??0)-(evento.totalEgresos??0) >= 0 ? '+' : '' }}${{ ((evento.totalIngresos??0)-(evento.totalEgresos??0)).toLocaleString('es-AR') }}
                    </span>
                  </div>
                </div>
              </div>
              <div class="flex gap-2 mt-3">
                <button class="ver-btn flex-1" @click.stop="abrirEvento(evento)"><i class="pi pi-eye mr-1"></i>Ver detalle</button>
                <button class="cerrar-btn" @click.stop="confirmarCierre(evento)"><i class="pi pi-lock mr-1"></i>Cerrar</button>
              </div>
            </div>
          </div>
        </div>
      </TabPanel>
      <TabPanel header="Eventos Cerrados">
        <div v-if="loadingEventos" class="flex justify-content-center py-6">
          <ProgressSpinner />
        </div>
        <div v-else-if="eventosCerrados.length === 0" class="text-center py-6">
          <i class="pi pi-lock text-5xl text-gray-600 mb-3 block"></i>
          <p class="text-gray-400">No hay eventos cerrados</p>
        </div>
        <div v-else class="grid">
          <div v-for="evento in eventosCerrados" :key="evento.id" class="col-12 lg:col-6 xl:col-4">
            <div class="evento-card evento-cerrado cursor-pointer" @click="abrirEvento(evento)">
              <div class="flex align-items-start justify-content-between mb-3">
                <div>                  <div class="font-bold text-lg mb-1" style="color: var(--text-color)">{{ evento.nombre }}</div>
                  <div class="text-gray-400 text-sm">{{ formatDate(evento.fecha) }}</div>
                  <div v-if="evento.lugar" class="text-gray-500 text-sm"><i class="pi pi-map-marker mr-1"></i>{{ evento.lugar }}</div>
                </div>
                <Tag value="Cerrado" severity="secondary" />
              </div>
              <div class="grid">
                <div class="col-6">
                  <div class="mini-resumen">
                    <span class="text-gray-500 text-xs block">Ingresos</span>
                    <span class="text-green-400 font-bold">${{ (evento.totalIngresos ?? 0).toLocaleString('es-AR') }}</span>
                  </div>
                </div>
                <div class="col-6">
                  <div class="mini-resumen">
                    <span class="text-gray-500 text-xs block">Gastos</span>
                    <span class="text-red-400 font-bold">${{ (evento.totalEgresos ?? 0).toLocaleString('es-AR') }}</span>
                  </div>
                </div>
                <div class="col-12">
                  <div class="mini-resumen" :style="(evento.totalIngresos??0)-(evento.totalEgresos??0) >= 0 ? 'border-color:#22c55e33' : 'border-color:#ef444433'">
                    <span class="text-gray-500 text-xs block">Resultado neto</span>
                    <span class="font-bold text-lg" :class="(evento.totalIngresos??0)-(evento.totalEgresos??0) >= 0 ? 'text-green-400' : 'text-red-400'">
                      {{ (evento.totalIngresos??0)-(evento.totalEgresos??0) >= 0 ? '+' : '' }}${{ ((evento.totalIngresos??0)-(evento.totalEgresos??0)).toLocaleString('es-AR') }}
                    </span>
                  </div>
                </div>
              </div>
              <div class="flex gap-2 mt-3">
                <button class="ver-btn flex-1" @click.stop="abrirEvento(evento)"><i class="pi pi-eye mr-1"></i>Ver detalle</button>
              </div>
            </div>
          </div>
        </div>
      </TabPanel>
    </TabView>

    <!-- ===== DIALOG DETALLE EVENTO ===== -->
    <Dialog
      v-model:visible="dialogDetalle"
      :header="eventoActual ? eventoActual.nombre : ''"
      :modal="true"
      :style="{ width: '860px' }"
      :breakpoints="{ '960px': '95vw' }"
      class="dialog-dark"
      @hide="eventoActual = null"
    >
      <template v-if="eventoActual">
        <!-- Info del evento + resumen financiero -->
        <div class="grid mb-4">
          <div class="col-12 md:col-6">
            <div class="evento-info-box">
              <div class="flex align-items-center gap-2 mb-3">
                <i class="pi pi-calendar text-red-400 text-xl"></i>
                <span class="font-bold text-lg" style="color: var(--text-color)">{{ eventoActual.nombre }}</span>
                <Tag :value="eventoActual.estado === 'activo' ? 'Activo' : 'Cerrado'"
                     :severity="eventoActual.estado === 'activo' ? 'success' : 'secondary'" />
              </div>
              <div class="flex flex-column gap-1 text-sm">
                <div class="flex gap-2">
                  <span class="text-gray-500 w-6rem">Fecha:</span>
                  <span class="text-gray-300">{{ formatDate(eventoActual.fecha) }}</span>
                </div>
                <div class="flex gap-2">
                  <span class="text-gray-500 w-6rem">Lugar:</span>
                  <span class="text-gray-300">{{ eventoActual.lugar || '—' }}</span>
                </div>
                <div class="flex gap-2">
                  <span class="text-gray-500 w-6rem">Descripción:</span>
                  <span class="text-gray-300">{{ eventoActual.descripcion || '—' }}</span>
                </div>
              </div>
            </div>
          </div>
          <div class="col-12 md:col-6">
            <div class="grid h-full">
              <div class="col-6">
                <div class="mini-stat ingreso-bg">
                  <span class="text-gray-400 text-xs block mb-1">Total Ingresos</span>
                  <span class="text-green-400 font-bold text-xl">${{ totalesEvento.ingresos.toLocaleString('es-AR') }}</span>
                </div>
              </div>
              <div class="col-6">
                <div class="mini-stat egreso-bg">
                  <span class="text-gray-400 text-xs block mb-1">Total Gastos</span>
                  <span class="text-red-400 font-bold text-xl">${{ totalesEvento.egresos.toLocaleString('es-AR') }}</span>
                </div>
              </div>
              <div class="col-12">
                <div class="mini-stat" :class="totalesEvento.saldo >= 0 ? 'saldo-pos-bg' : 'saldo-neg-bg'">
                  <span class="text-gray-400 text-xs block mb-1">Resultado neto</span>
                  <span class="font-bold text-2xl" :class="totalesEvento.saldo >= 0 ? 'text-green-400' : 'text-red-400'">
                    {{ totalesEvento.saldo >= 0 ? '+' : '' }}${{ totalesEvento.saldo.toLocaleString('es-AR') }}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Tabs Ingresos / Gastos dentro del evento -->
        <TabView class="tabview-dark">
          <TabPanel>
            <template #header>
              <span>
                <i class="pi pi-arrow-down mr-2 text-green-400"></i>
                Ingresos
                <Badge :value="movimientosIngreso.length" severity="success" class="ml-2" />
              </span>
            </template>
            <div class="flex justify-content-end mb-3">
              <Button
                v-if="eventoActual.estado === 'activo'"
                label="Agregar Ingreso"
                icon="pi pi-plus"
                size="small"
                severity="success"
                outlined
                @click="openMovimiento('ingreso')"
              />
            </div>
            <DataTable :value="movimientosIngreso" class="p-datatable-sm" :rows="8" paginator>
              <template #empty><span class="text-gray-500">Sin ingresos cargados</span></template>
              <Column field="fecha" header="Fecha" style="width:110px">
                <template #body="{ data }"><span class="text-gray-300 text-sm">{{ formatDate(data.fecha) }}</span></template>
              </Column>
              <Column field="concepto" header="Concepto">
                <template #body="{ data }">
                  <div>                    <div class="text-sm" style="color: var(--text-color)">{{ data.concepto }}</div>
                    <div v-if="data.descripcion" class="text-gray-500 text-xs">{{ data.descripcion }}</div>
                  </div>
                </template>
              </Column>
              <Column field="categoria" header="Categoría" style="width:140px">
                <template #body="{ data }">
                  <span class="text-gray-300 text-sm">{{ labelCategoria(data.categoria) }}</span>
                </template>
              </Column>
              <Column field="monto" header="Monto" style="width:120px">
                <template #body="{ data }">
                  <span class="text-green-400 font-bold">${{ data.monto?.toLocaleString('es-AR') }}</span>
                </template>
              </Column>
              <Column style="width:80px" v-if="eventoActual.estado === 'activo'">
                <template #body="{ data }">
                  <Button icon="pi pi-trash" text rounded size="small" severity="danger" @click="eliminarMovEvento(data)" />
                </template>
              </Column>
            </DataTable>
          </TabPanel>

          <TabPanel>
            <template #header>
              <span>
                <i class="pi pi-arrow-up mr-2 text-red-400"></i>
                Gastos
                <Badge :value="movimientosEgreso.length" severity="danger" class="ml-2" />
              </span>
            </template>
            <div class="flex justify-content-end mb-3">
              <Button
                v-if="eventoActual.estado === 'activo'"
                label="Agregar Gasto"
                icon="pi pi-plus"
                size="small"
                severity="danger"
                outlined
                @click="openMovimiento('egreso')"
              />
            </div>
            <DataTable :value="movimientosEgreso" class="p-datatable-sm" :rows="8" paginator>
              <template #empty><span class="text-gray-500">Sin gastos cargados</span></template>
              <Column field="fecha" header="Fecha" style="width:110px">
                <template #body="{ data }"><span class="text-gray-300 text-sm">{{ formatDate(data.fecha) }}</span></template>
              </Column>
              <Column field="concepto" header="Concepto">
                <template #body="{ data }">
                  <div>                    <div class="text-sm" style="color: var(--text-color)">{{ data.concepto }}</div>
                    <div v-if="data.descripcion" class="text-gray-500 text-xs">{{ data.descripcion }}</div>
                  </div>
                </template>
              </Column>
              <Column field="categoria" header="Categoría" style="width:140px">
                <template #body="{ data }">
                  <span class="text-gray-300 text-sm">{{ labelCategoria(data.categoria) }}</span>
                </template>
              </Column>              <Column field="monto" header="Monto" style="width:120px">
                <template #body="{ data }">
                  <span class="text-red-400 font-bold">${{ data.monto?.toLocaleString('es-AR') }}</span>
                </template>
              </Column>
              <Column field="pagado" header="Pago" style="width:100px">
                <template #body="{ data }">
                  <div class="flex align-items-center gap-2">
                    <Button 
                      :icon="data.pagado ? 'pi pi-check' : 'pi pi-clock'"
                      :class="data.pagado ? 'p-button-text p-button-success' : 'p-button-text p-button-warning'"
                      :severity="data.pagado ? 'success' : 'warning'"
                      size="small"
                      text
                      rounded
                      :disabled="eventoActual.estado !== 'activo'"
                      @click="togglePagoMovimiento(data)"
                      :title="data.pagado ? 'Pagado' : 'Pendiente'"
                    />
                    <span class="text-xs" :class="data.pagado ? 'text-green-400' : 'text-yellow-400'">
                      {{ data.pagado ? 'Pagado' : 'Pendiente' }}
                    </span>
                  </div>
                </template>
              </Column>
              <Column style="width:80px" v-if="eventoActual.estado === 'activo'">
                <template #body="{ data }">
                  <Button icon="pi pi-trash" text rounded size="small" severity="danger" @click="eliminarMovEvento(data)" />
                </template>
              </Column>
            </DataTable>
          </TabPanel>
        </TabView>        <!-- Botón cerrar evento -->
        <div v-if="eventoActual.estado === 'activo'" class="mt-4 p-3 border-round cierre-box">
          <!-- Advertencia de gastos pendientes -->
          <div v-if="egresosSinPagar.length > 0" class="mb-3 p-3 border-round" style="background: rgba(251, 146, 60, 0.1); border: 1px solid rgba(251, 146, 60, 0.3);">
            <div class="flex align-items-center gap-2 mb-2">
              <i class="pi pi-exclamation-triangle text-orange-400"></i>
              <span class="text-orange-400 font-bold">Gastos pendientes de pago</span>
            </div>
            <div class="text-orange-200 text-sm mb-2">
              Hay {{ egresosSinPagar.length }} gasto{{ egresosSinPagar.length > 1 ? 's' : '' }} sin marcar como pagado{{ egresosSinPagar.length > 1 ? 's' : '' }}. 
              Debes marcar todos los gastos como pagados antes de cerrar el evento.
            </div>
            <ul class="text-orange-200 text-xs ml-4 mb-0">
              <li v-for="egreso in egresosSinPagar.slice(0, 3)" :key="egreso.id">
                {{ egreso.concepto }} - ${{ egreso.monto?.toLocaleString('es-AR') }}
              </li>
              <li v-if="egresosSinPagar.length > 3" class="text-orange-300">
                ... y {{ egresosSinPagar.length - 3 }} más
              </li>
            </ul>
          </div>

          <div class="flex align-items-center justify-content-between flex-wrap gap-3">
            <div>              <div class="font-bold mb-1" style="color: var(--text-color)">
                <i class="pi pi-lock mr-2 text-yellow-400"></i>Cerrar Evento
              </div>
              <div class="text-gray-400 text-sm">
                Al cerrar, el resultado neto
                <span :class="totalesEvento.saldo >= 0 ? 'text-green-400' : 'text-red-400'" class="font-bold">
                  {{ totalesEvento.saldo >= 0 ? '+' : '' }}${{ totalesEvento.saldo.toLocaleString('es-AR') }}
                </span>
                se registrará automáticamente como
                <span class="font-bold" style="color: var(--text-color)">{{ totalesEvento.saldo >= 0 ? 'Ingreso' : 'Egreso' }}</span>
                en el módulo de Ingresos &amp; Egresos.
              </div>
            </div>
            <Button
              label="Cerrar Evento"
              icon="pi pi-lock"
              severity="warning"
              :loading="cerrandoEvento"
              :disabled="!puedeSerCerrado"
              @click="confirmarCierre(eventoActual)"
            />
          </div>
        </div>

        <!-- Info evento cerrado -->
        <div v-else class="mt-4 p-3 border-round" style="background: var(--surface-hover); border: 1px solid var(--surface-border)">
          <div class="flex align-items-center gap-2">
            <i class="pi pi-lock text-gray-400"></i>
            <span class="text-gray-400 text-sm">
              Evento cerrado el {{ formatDate(eventoActual.fechaCierre) }}.
              El resultado fue registrado en Ingresos &amp; Egresos.
            </span>
          </div>
        </div>
      </template>
    </Dialog>

    <!-- ===== DIALOG NUEVO EVENTO ===== -->
    <Dialog
      v-model:visible="dialogNuevoEvento"
      header="Nuevo Evento"
      :modal="true"
      :style="{ width: '480px' }"
      :breakpoints="{ '640px': '95vw' }"
      class="dialog-dark"
      @hide="resetFormEvento"
    >
      <form @submit.prevent="crearEvento" class="flex flex-column gap-4 pt-2">
        <div>
          <label class="block text-gray-300 font-medium mb-2">Nombre del evento *</label>
          <InputText v-model="formEvento.nombre" class="w-full" placeholder="Ej: Torneo de Fútbol Infantil" :class="{ 'p-invalid': formEventoErrors.nombre }" />
          <small v-if="formEventoErrors.nombre" class="p-error">{{ formEventoErrors.nombre }}</small>
        </div>
        <div>
          <label class="block text-gray-300 font-medium mb-2">Descripción</label>
          <Textarea v-model="formEvento.descripcion" class="w-full" rows="2" autoResize placeholder="Descripción opcional del evento" />
        </div>
        <div class="flex gap-3">
          <div class="flex-1">
            <label class="block text-gray-300 font-medium mb-2">Fecha *</label>
            <Calendar v-model="formEvento.fecha" dateFormat="dd/mm/yy" showIcon class="w-full" :class="{ 'p-invalid': formEventoErrors.fecha }" />
            <small v-if="formEventoErrors.fecha" class="p-error">{{ formEventoErrors.fecha }}</small>
          </div>
          <div class="flex-1">
            <label class="block text-gray-300 font-medium mb-2">Lugar</label>
            <InputText v-model="formEvento.lugar" class="w-full" placeholder="Ej: Cancha principal" />
          </div>
        </div>
        <Message v-if="errorNuevoEvento" severity="error" :closable="false">{{ errorNuevoEvento }}</Message>
      </form>
      <template #footer>
        <Button label="Cancelar" icon="pi pi-times" text class="text-gray-400" @click="dialogNuevoEvento = false" />
        <Button label="Crear Evento" icon="pi pi-check" :loading="guardandoEvento" @click="crearEvento" />
      </template>
    </Dialog>

    <!-- ===== DIALOG NUEVO MOVIMIENTO DEL EVENTO ===== -->
    <Dialog
      v-model:visible="dialogMovimiento"
      :header="tipoMovimiento === 'ingreso' ? 'Agregar Ingreso al Evento' : 'Agregar Gasto al Evento'"
      :modal="true"
      :style="{ width: '460px' }"
      :breakpoints="{ '640px': '95vw' }"
      class="dialog-dark"
      @hide="resetFormMovimiento"
    >
      <form @submit.prevent="guardarMovimiento" class="flex flex-column gap-4 pt-2">
        <!-- Indicador visual de tipo -->
        <div class="flex align-items-center gap-2 p-2 border-round"
          :style="tipoMovimiento === 'ingreso' ? 'background:rgba(34,197,94,0.1);border:1px solid rgba(34,197,94,0.3)' : 'background:rgba(239,68,68,0.1);border:1px solid rgba(239,68,68,0.3)'">
          <i :class="tipoMovimiento === 'ingreso' ? 'pi pi-arrow-down text-green-400' : 'pi pi-arrow-up text-red-400'" class="text-xl"></i>
          <span :class="tipoMovimiento === 'ingreso' ? 'text-green-400' : 'text-red-400'" class="font-bold capitalize">{{ tipoMovimiento }}</span>
        </div>

        <div>
          <label class="block text-gray-300 font-medium mb-2">Categoría *</label>
          <Dropdown
            v-model="formMov.categoria"
            :options="categoriasMovimiento"
            optionLabel="label"
            optionValue="value"
            placeholder="Seleccioná una categoría"
            class="w-full"
            :class="{ 'p-invalid': formMovErrors.categoria }"
          />
          <small v-if="formMovErrors.categoria" class="p-error">{{ formMovErrors.categoria }}</small>
        </div>

        <div>
          <label class="block text-gray-300 font-medium mb-2">Concepto *</label>
          <InputText v-model="formMov.concepto" class="w-full" placeholder="Ej: Venta de entradas, Alquiler sonido..." :class="{ 'p-invalid': formMovErrors.concepto }" />
          <small v-if="formMovErrors.concepto" class="p-error">{{ formMovErrors.concepto }}</small>
        </div>

        <div>
          <label class="block text-gray-300 font-medium mb-2">Descripción</label>
          <Textarea v-model="formMov.descripcion" class="w-full" rows="2" autoResize placeholder="Detalle adicional (opcional)" />
        </div>

        <div class="flex gap-3">
          <div class="flex-1">
            <label class="block text-gray-300 font-medium mb-2">Monto *</label>
            <InputNumber
              v-model="formMov.monto"
              class="w-full"
              mode="currency"
              currency="ARS"
              locale="es-AR"
              :minFractionDigits="0"
              :class="{ 'p-invalid': formMovErrors.monto }"
            />
            <small v-if="formMovErrors.monto" class="p-error">{{ formMovErrors.monto }}</small>
          </div>
          <div class="flex-1">
            <label class="block text-gray-300 font-medium mb-2">Fecha *</label>
            <Calendar v-model="formMov.fecha" dateFormat="dd/mm/yy" showIcon class="w-full" :class="{ 'p-invalid': formMovErrors.fecha }" />
            <small v-if="formMovErrors.fecha" class="p-error">{{ formMovErrors.fecha }}</small>
          </div>
        </div>

        <div>
          <label class="block text-gray-300 font-medium mb-2">Comprobante <span class="text-gray-500 font-normal text-sm">(opcional)</span></label>
          <InputText v-model="formMov.comprobante" class="w-full" placeholder="Nro. de recibo, factura, etc." />
        </div>

        <Message v-if="errorMovimiento" severity="error" :closable="false">{{ errorMovimiento }}</Message>
      </form>
      <template #footer>
        <Button label="Cancelar" icon="pi pi-times" text class="text-gray-400" @click="dialogMovimiento = false" />
        <Button
          :label="tipoMovimiento === 'ingreso' ? 'Agregar Ingreso' : 'Agregar Gasto'"
          :icon="tipoMovimiento === 'ingreso' ? 'pi pi-arrow-down' : 'pi pi-arrow-up'"
          :severity="tipoMovimiento === 'ingreso' ? 'success' : 'danger'"
          :loading="guardandoMovimiento"
          @click="guardarMovimiento"
        />
      </template>
    </Dialog>

    <!-- Confirm Dialog Cierre de Evento -->
    <Dialog
      v-model:visible="showConfirmCierre"
      header="Cerrar Evento"
      :modal="true"
      :style="{ width: '420px' }"
      class="dialog-dark"
    >
      <div v-if="eventoParaCerrar" class="flex align-items-start gap-3">
        <i class="pi pi-exclamation-triangle text-3xl text-yellow-400 mt-1"></i>
        <div>
          <p class="m-0 font-bold mb-2">¿Cerrar el evento &quot;{{ eventoParaCerrar.nombre }}&quot;?
          </p>
          <p class="m-0 text-sm" style="color: var(--text-color-secondary)">
            El resultado neto de
            <span class="font-bold" :class="((eventoParaCerrar.totalIngresos ?? 0) - (eventoParaCerrar.totalEgresos ?? 0)) >= 0 ? 'text-green-400' : 'text-red-400'">
              ${{ Math.abs((eventoParaCerrar.totalIngresos ?? 0) - (eventoParaCerrar.totalEgresos ?? 0)).toLocaleString('es-AR') }}
            </span>
            se registrará como
            <span class="font-bold">{{ ((eventoParaCerrar.totalIngresos ?? 0) - (eventoParaCerrar.totalEgresos ?? 0)) >= 0 ? 'INGRESO' : 'EGRESO' }}</span>
            en el módulo de Ingresos &amp; Egresos.
          </p>
          <p class="m-0 text-sm text-orange-300 mt-2">Esta acción no se puede deshacer.</p>
        </div>
      </div>
      <template #footer>
        <Button label="Cancelar" icon="pi pi-times" outlined @click="showConfirmCierre = false" />
        <Button label="Sí, cerrar evento" icon="pi pi-lock" severity="warning" :loading="cerrandoEvento" @click="ejecutarCierre" />
      </template>
    </Dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useToast } from 'primevue/usetoast'
import { eventosService } from '@/services'
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
import Dialog from 'primevue/dialog'
import Tag from 'primevue/tag'
import Badge from 'primevue/badge'
import Message from 'primevue/message'
import ProgressSpinner from 'primevue/progressspinner'
import PageHeader from '@/components/mobile/PageHeader.vue'

const toast = useToast()

// ── ESTADO GENERAL ──────────────────────────────────────
const tabActivo = ref(0)
const loadingEventos = ref(false)
const eventos = ref([])

const eventosActivos  = computed(() => {
  const activos = eventos.value.filter(e => e.estado === 'activo')

  return activos
})
const eventosCerrados = computed(() => eventos.value.filter(e => e.estado !== 'activo'))

// ── DETALLE EVENTO ──────────────────────────────────────
const dialogDetalle  = ref(false)
const eventoActual   = ref(null)
const movimientos    = ref([])
const cerrandoEvento = ref(false)

const movimientosIngreso = computed(() => movimientos.value.filter(m => m.tipo === 'ingreso'))
const movimientosEgreso  = computed(() => movimientos.value.filter(m => m.tipo === 'egreso'))

const totalesEvento = computed(() => {
  const ingresos = movimientosIngreso.value.reduce((a, m) => a + (m.monto ?? 0), 0)
  const egresos  = movimientosEgreso.value.reduce((a, m) => a + (m.monto ?? 0), 0)
  return { ingresos, egresos, saldo: ingresos - egresos }
})

const egresosSinPagar = computed(() => {
  return movimientosEgreso.value.filter(m => !m.pagado)
})

const puedeSerCerrado = computed(() => {
  return eventoActual.value?.estado === 'activo' && egresosSinPagar.value.length === 0
})

async function abrirEvento(evento) {
  eventoActual.value = evento
  movimientos.value  = []
  dialogDetalle.value = true
  try {
    movimientos.value = await eventosService.getMovimientos(evento.id)
  } catch {
    toast.add({ severity: 'error', summary: 'Error', detail: 'No se pudieron cargar los movimientos', life: 3000 })
  }
}

// ── NUEVO EVENTO ────────────────────────────────────────
const dialogNuevoEvento  = ref(false)
const guardandoEvento    = ref(false)
const errorNuevoEvento   = ref('')
const formEventoErrors   = ref({})
const formEvento = ref({ nombre: '', descripcion: '', fecha: new Date(), lugar: '' })

function openNuevoEvento() {
  resetFormEvento()
  dialogNuevoEvento.value = true
}

function resetFormEvento() {
  formEvento.value = { nombre: '', descripcion: '', fecha: new Date(), lugar: '' }
  formEventoErrors.value = {}
  errorNuevoEvento.value = ''
}

function validateEvento() {
  formEventoErrors.value = {}
  if (!formEvento.value.nombre?.trim()) formEventoErrors.value.nombre = 'El nombre es requerido'
  if (!formEvento.value.fecha) formEventoErrors.value.fecha = 'La fecha es requerida'
  return Object.keys(formEventoErrors.value).length === 0
}

async function crearEvento() {
  if (!validateEvento()) return
  guardandoEvento.value = true
  errorNuevoEvento.value = ''
  try {
    await eventosService.create({
      nombre: formEvento.value.nombre.trim(),
      descripcion: formEvento.value.descripcion?.trim() || undefined,
      fecha: formEvento.value.fecha instanceof Date ? formEvento.value.fecha.toISOString() : formEvento.value.fecha,
      lugar: formEvento.value.lugar?.trim() || undefined
    })
    toast.add({ severity: 'success', summary: 'Creado', detail: 'Evento creado correctamente', life: 3000 })
    dialogNuevoEvento.value = false
    await cargarEventos()
  } catch (e) {
    errorNuevoEvento.value = e.response?.data?.message || 'Error al crear el evento'
  } finally {
    guardandoEvento.value = false
  }
}

// ── MOVIMIENTO DEL EVENTO ───────────────────────────────
const dialogMovimiento    = ref(false)
const guardandoMovimiento = ref(false)
const errorMovimiento     = ref('')
const tipoMovimiento      = ref('ingreso')
const formMovErrors       = ref({})
const formMov = ref({ categoria: null, concepto: '', descripcion: '', monto: null, fecha: new Date(), comprobante: '' })

const categoriasIngreso = [
  { label: 'Venta de entradas',      value: 'entradas' },
  { label: 'Patrocinio / Sponsor',   value: 'sponsor' },
  { label: 'Venta de productos',     value: 'venta_productos' },
  { label: 'Buffet / Gastronomía',   value: 'buffet' },
  { label: 'Inscripciones',          value: 'inscripciones' },
  { label: 'Donación',               value: 'donacion' },
  { label: 'Otro ingreso',           value: 'otro_ingreso' }
]

const categoriasEgreso = [
  { label: 'Alquiler de espacio',    value: 'alquiler' },
  { label: 'Sonido / Iluminación',   value: 'sonido' },
  { label: 'Catering / Buffet',      value: 'catering' },
  { label: 'Publicidad / Difusión',  value: 'publicidad' },
  { label: 'Personal / Árbitros',    value: 'personal' },
  { label: 'Trofeos / Premios',      value: 'premios' },
  { label: 'Materiales',             value: 'materiales' },
  { label: 'Otro gasto',             value: 'otro_egreso' }
]

const categoriasMovimiento = computed(() =>
  tipoMovimiento.value === 'ingreso' ? categoriasIngreso : categoriasEgreso
)

function openMovimiento(tipo) {
  tipoMovimiento.value = tipo
  resetFormMovimiento()
  dialogMovimiento.value = true
}

function resetFormMovimiento() {
  formMov.value = { categoria: null, concepto: '', descripcion: '', monto: null, fecha: new Date(), comprobante: '' }
  formMovErrors.value = {}
  errorMovimiento.value = ''
}

function validateMovimiento() {
  formMovErrors.value = {}
  if (!formMov.value.categoria) formMovErrors.value.categoria = 'Seleccioná una categoría'
  if (!formMov.value.concepto?.trim()) formMovErrors.value.concepto = 'El concepto es requerido'
  if (!formMov.value.monto || formMov.value.monto <= 0) formMovErrors.value.monto = 'Ingresá un monto válido'
  if (!formMov.value.fecha) formMovErrors.value.fecha = 'La fecha es requerida'
  return Object.keys(formMovErrors.value).length === 0
}

async function guardarMovimiento() {
  if (!validateMovimiento()) return
  guardandoMovimiento.value = true
  errorMovimiento.value = ''
  try {
    await eventosService.addMovimiento(eventoActual.value.id, {
      tipo: tipoMovimiento.value,
      categoria: formMov.value.categoria,
      concepto: formMov.value.concepto.trim(),
      descripcion: formMov.value.descripcion?.trim() || undefined,
      monto: formMov.value.monto,
      fecha: formMov.value.fecha instanceof Date ? formMov.value.fecha.toISOString() : formMov.value.fecha,
      comprobante: formMov.value.comprobante?.trim() || undefined
    })
    toast.add({ severity: 'success', summary: 'Guardado', detail: `${tipoMovimiento.value === 'ingreso' ? 'Ingreso' : 'Gasto'} agregado`, life: 3000 })
    dialogMovimiento.value = false
    // recargar movimientos del evento y lista
    movimientos.value = await eventosService.getMovimientos(eventoActual.value.id)
    const updated = await eventosService.getById(eventoActual.value.id)
    eventoActual.value = updated
    await cargarEventos()
  } catch (e) {
    errorMovimiento.value = e.response?.data?.message || 'Error al guardar'
  } finally {
    guardandoMovimiento.value = false
  }
}

async function eliminarMovEvento(mov) {
  try {
    await eventosService.deleteMovimiento(eventoActual.value.id, mov.id)
    toast.add({ severity: 'success', summary: 'Eliminado', detail: 'Movimiento eliminado', life: 3000 })
    movimientos.value = await eventosService.getMovimientos(eventoActual.value.id)
    const updated = await eventosService.getById(eventoActual.value.id)
    eventoActual.value = updated
    await cargarEventos()
  } catch {
    toast.add({ severity: 'error', summary: 'Error', detail: 'No se pudo eliminar', life: 3000 })
  }
}

async function togglePagoMovimiento(movimiento) {
  try {
    await eventosService.marcarPago(eventoActual.value.id, movimiento.id, !movimiento.pagado)
    const textoEstado = !movimiento.pagado ? 'marcado como pagado' : 'marcado como pendiente'
    toast.add({ 
      severity: 'success', 
      summary: 'Estado actualizado', 
      detail: `Gasto ${textoEstado}`, 
      life: 3000 
    })
    // Actualizar el estado local inmediatamente
    movimiento.pagado = !movimiento.pagado
    if (movimiento.pagado) {
      movimiento.fechaPago = new Date().toISOString()
    } else {
      movimiento.fechaPago = null
    }
  } catch (e) {
    toast.add({ 
      severity: 'error', 
      summary: 'Error', 
      detail: e.response?.data?.message || 'No se pudo actualizar el estado de pago', 
      life: 3000 
    })
  }
}

// ── CIERRE DE EVENTO ────────────────────────────────────
const showConfirmCierre = ref(false)
const eventoParaCerrar  = ref(null)

function confirmarCierre(evento) {
  if (egresosSinPagar.value.length > 0) {
    toast.add({ 
      severity: 'warn', 
      summary: 'No se puede cerrar', 
      detail: `Hay ${egresosSinPagar.value.length} gasto${egresosSinPagar.value.length > 1 ? 's' : ''} pendiente${egresosSinPagar.value.length > 1 ? 's' : ''} de pago`, 
      life: 4000 
    })
    return
  }
  eventoParaCerrar.value = evento
  showConfirmCierre.value = true
}

function ejecutarCierre() {
  showConfirmCierre.value = false
  cerrarEvento(eventoParaCerrar.value)
}

async function cerrarEvento(evento) {
  cerrandoEvento.value = true
  try {
    await eventosService.cerrar(evento.id)
    toast.add({ severity: 'success', summary: '¡Evento cerrado!', detail: 'El resultado fue registrado en Ingresos & Egresos', life: 4000 })
    dialogDetalle.value = false
    eventoActual.value = null
    movimientos.value = []
    await cargarEventos()
  } catch (e) {
    toast.add({ severity: 'error', summary: 'Error', detail: e.response?.data?.message || 'No se pudo cerrar el evento', life: 3000 })
  } finally {
    cerrandoEvento.value = false
    eventoParaCerrar.value = null
  }
}

// ── CARGA DE DATOS ──────────────────────────────────────
async function cargarEventos() {
  loadingEventos.value = true
  try {
    const data = await eventosService.getAll()

    eventos.value = data
  } catch (e) {
    console.error('[Eventos] error al cargar:', e.response?.status, e.response?.data || e.message)
    toast.add({ severity: 'error', summary: 'Error', detail: 'No se pudieron cargar los eventos', life: 3000 })
  } finally {
    loadingEventos.value = false
  }
}

// ── HELPERS ─────────────────────────────────────────────
function formatDate(f) {
  if (!f) return '—'
  return new Date(f).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

const todasCategorias = [...categoriasIngreso, ...categoriasEgreso]
function labelCategoria(value) {
  return todasCategorias.find(c => c.value === value)?.label ?? value ?? '—'
}

onMounted(cargarEventos)
</script>

<style scoped>
/* ── Cards de eventos ── */
.evento-card {
  background: var(--surface-card);
  border: 1px solid var(--surface-border);
  border-radius: 12px;
  padding: 1.25rem;
  transition: border-color 0.2s, transform 0.1s;
  height: 100%;
}
.evento-card:hover { border-color: #dc2626; transform: translateY(-2px); }
.evento-cerrado { opacity: 0.7; }
.evento-cerrado:hover { border-color: var(--surface-400); }

.mini-resumen {
  background: var(--surface-hover);
  border: 1px solid var(--surface-border);
  border-radius: 8px;
  padding: 0.6rem 0.75rem;
  margin-bottom: 0.5rem;
}

.ver-btn {
  background: rgba(220,38,38,0.1);
  border: 1px solid rgba(220,38,38,0.3);
  color: #dc2626;
  border-radius: 6px;
  padding: 0.4rem 0.75rem;
  font-size: 0.85rem;
  cursor: pointer;
  transition: background 0.2s;
}
.ver-btn:hover { background: rgba(220,38,38,0.2); }

.cerrar-btn {
  background: rgba(234,179,8,0.1);
  border: 1px solid rgba(234,179,8,0.3);
  color: #eab308;
  border-radius: 6px;
  padding: 0.4rem 0.75rem;
  font-size: 0.85rem;
  cursor: pointer;
  transition: background 0.2s;
}
.cerrar-btn:hover { background: rgba(234,179,8,0.2); }

/* ── Info box evento ── */
.evento-info-box {
  background: var(--surface-card);
  border: 1px solid var(--surface-border);
  border-radius: 10px;
  padding: 1rem;
  height: 100%;
}

/* ── Mini stats en detalle ── */
.mini-stat {
  background: var(--surface-card);
  border: 1px solid var(--surface-border);
  border-radius: 8px;
  padding: 0.75rem 1rem;
  height: 100%;
}
.ingreso-bg { border-left: 3px solid #22c55e; }
.egreso-bg  { border-left: 3px solid #ef4444; }
.saldo-pos-bg { border-left: 3px solid #22c55e; background: rgba(34,197,94,0.05); }
.saldo-neg-bg { border-left: 3px solid #ef4444; background: rgba(239,68,68,0.05); }

/* ── Caja de cierre ── */
.cierre-box {
  background: rgba(234,179,8,0.05);
  border: 1px solid rgba(234,179,8,0.25);
}

/* ── Dialog adaptable al tema ── */
:deep(.dialog-dark .p-dialog)         { background: var(--surface-overlay); border: 1px solid var(--surface-border); border-radius: 12px; }
:deep(.dialog-dark .p-dialog-header)  { background: var(--surface-overlay); color: var(--text-color); border-bottom: 1px solid var(--surface-border); border-radius: 12px 12px 0 0; }
:deep(.dialog-dark .p-dialog-content) { background: var(--surface-overlay); color: var(--text-color); padding: 1.5rem; }
:deep(.dialog-dark .p-dialog-footer)  { background: var(--surface-overlay); border-top: 1px solid var(--surface-border); border-radius: 0 0 12px 12px; }
:deep(.dialog-dark .p-dialog-header-close) { color: var(--text-color-secondary) !important; }

/* ── TabView adaptable al tema ── */
:deep(.tabview-dark .p-tabview-nav)             { background: transparent; border-bottom: 1px solid var(--surface-border); }
:deep(.tabview-dark .p-tabview-nav-link)        { background: transparent !important; color: var(--text-color-secondary) !important; border-color: transparent !important; }
:deep(.tabview-dark .p-tabview-nav li.p-highlight .p-tabview-nav-link) { color: #dc2626 !important; border-bottom: 2px solid #dc2626 !important; }
:deep(.tabview-dark .p-tabview-panels)          { background: transparent; padding: 1rem 0 0; }
</style>
