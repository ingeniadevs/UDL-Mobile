<template>
  <div class="inventario-view">
    <PageHeader title="Inventario" subtitle="Gestión de materiales, equipamiento y mobiliario">
      <template #actions>
        <Button label="Alertas" icon="pi pi-bell" severity="warning" outlined size="small" @click="activeTab = 4" :badge="alertaCount > 0 ? String(alertaCount) : undefined" badgeSeverity="danger" />
        <Button label="Nuevo Artículo" icon="pi pi-plus" size="small" @click="abrirNuevoArticulo" />
      </template>
    </PageHeader>

    <!-- KPI Cards -->
    <div class="grid mb-4">
      <div class="col-12 md:col-3">
        <div class="kpi-card">
          <div class="kpi-icon bg-blue-100"><i class="pi pi-box text-blue-500 text-2xl" /></div>
          <div>
            <div class="text-2xl font-bold">{{ reporte?.resumen?.totalArticulos ?? '—' }}</div>
            <div class="text-sm text-color-secondary">Total Artículos</div>
          </div>
        </div>
      </div>
      <div class="col-12 md:col-3">
        <div class="kpi-card">
          <div class="kpi-icon bg-orange-100"><i class="pi pi-exclamation-triangle text-orange-500 text-2xl" /></div>
          <div>
            <div class="text-2xl font-bold text-orange-500">{{ reporte?.resumen?.articulosBajoStock ?? '—' }}</div>
            <div class="text-sm text-color-secondary">Bajo Stock</div>
          </div>
        </div>
      </div>
      <div class="col-12 md:col-3">
        <div class="kpi-card">
          <div class="kpi-icon bg-green-100"><i class="pi pi-dollar text-green-500 text-2xl" /></div>
          <div>
            <div class="text-2xl font-bold">{{ formatCurrency(reporte?.resumen?.valorTotalInventario) }}</div>
            <div class="text-sm text-color-secondary">Valor Total</div>
          </div>
        </div>
      </div>
      <div class="col-12 md:col-3">
        <div class="kpi-card">
          <div class="kpi-icon bg-purple-100"><i class="pi pi-wrench text-purple-500 text-2xl" /></div>
          <div>
            <div class="text-2xl font-bold text-purple-500">{{ reporte?.resumen?.mantenimientosPendientes ?? '—' }}</div>
            <div class="text-sm text-color-secondary">Mantenimientos Pendientes</div>
          </div>
        </div>
      </div>
    </div>

    <!-- Tabs principales -->
    <TabView v-model:activeIndex="activeTab">
      <!-- ═══ TAB ARTÍCULOS ═══ -->
      <TabPanel header="Artículos" leftIcon="pi pi-box">
        <div class="flex gap-2 mb-3 flex-wrap">
          <InputText v-model="filtros.busqueda" placeholder="Buscar por nombre o código..." class="w-15rem" @input="buscarArticulos" />
          <Dropdown v-model="filtros.categoria" :options="categorias" optionLabel="label" optionValue="value" placeholder="Categoría" class="w-12rem" @change="buscarArticulos" showClear />
          <Dropdown v-model="filtros.estado" :options="estadosArticulo" optionLabel="label" optionValue="value" placeholder="Estado" class="w-12rem" @change="buscarArticulos" showClear />
          <Dropdown v-model="filtros.ubicacionId" :options="ubicaciones" optionLabel="nombre" optionValue="id" placeholder="Ubicación" class="w-12rem" @change="buscarArticulos" showClear />
          <ToggleButton v-model="filtros.soloBajoStock" onLabel="Solo bajo stock" offLabel="Bajo stock" onIcon="pi pi-filter" offIcon="pi pi-filter-slash" @change="buscarArticulos" />
        </div>

        <div v-if="loadingArticulos" class="flex justify-content-center py-5"><ProgressSpinner /></div>
        <template v-else>
          <div v-if="articulos.length === 0" class="text-center py-4 text-color-secondary">No se encontraron artículos</div>
          <div v-else class="mobile-card-list">
            <MobileRecordCard v-for="item in paginatedArticulos" :key="item.id" :title="item.nombre" :subtitle="item.codigo" @click="verArticulo(item)">
              <template #tags>
                <Tag :value="categoriaLabel(item.categoria)" :severity="categoriaSeverity(item.categoria)" />
                <Tag :value="estadoLabel(item.estado)" :severity="estadoSeverity(item.estado)" />
              </template>
              <template #body>
                <div class="record-card__row"><span class="record-card__label">Ubicación</span><span class="record-card__value">{{ item.ubicacionNombre }}</span></div>
                <div class="record-card__row">
                  <span class="record-card__label">Stock</span>
                  <span class="record-card__value" :class="item.stockActual <= item.stockMinimo ? 'text-red-500 font-bold' : ''">{{ item.stockActual }} / min {{ item.stockMinimo }}</span>
                </div>
                <Tag v-if="item.stockActual <= item.stockMinimo" value="Bajo" severity="danger" class="text-xs mt-1" />
              </template>
              <template #actions>
                <Button icon="pi pi-eye" text rounded size="small" @click="verArticulo(item)" />
                <Button icon="pi pi-pencil" text rounded size="small" severity="info" @click="editarArticulo(item)" />
                <Button icon="pi pi-arrows-v" text rounded size="small" severity="success" @click="abrirMovimiento(item)" />
                <Button icon="pi pi-trash" text rounded size="small" severity="danger" @click="confirmarEliminar(item)" />
              </template>
            </MobileRecordCard>
          </div>
          <MobilePaginator v-model:page="articulosPage" :rows="10" :total="articulos.length" />
        </template>
      </TabPanel>

      <!-- ═══ TAB MOVIMIENTOS ═══ -->
      <TabPanel header="Movimientos" leftIcon="pi pi-arrows-v">
        <div class="flex gap-2 mb-3 flex-wrap">
          <Dropdown v-model="filtrosMovs.tipo" :options="tiposMovimiento" optionLabel="label" optionValue="value" placeholder="Tipo de movimiento" class="w-15rem" @change="cargarMovimientos" showClear />
          <Calendar v-model="filtrosMovs.desde" placeholder="Desde" dateFormat="dd/mm/yy" class="w-11rem" @date-select="cargarMovimientos" showButtonBar />
          <Calendar v-model="filtrosMovs.hasta" placeholder="Hasta" dateFormat="dd/mm/yy" class="w-11rem" @date-select="cargarMovimientos" showButtonBar />
          <Button icon="pi pi-refresh" text rounded @click="cargarMovimientos" v-tooltip="'Actualizar'" />
        </div>

        <div v-if="loadingMovs" class="flex justify-content-center py-5"><ProgressSpinner /></div>
        <template v-else>
          <div v-if="movimientos.length === 0" class="text-center py-4 text-color-secondary">No hay movimientos registrados</div>
          <div v-else class="mobile-card-list">
            <MobileRecordCard v-for="item in paginatedMovimientos" :key="item.id" :title="item.articuloNombre" :subtitle="formatDate(item.fechaMovimiento)">
              <template #tags><Tag :value="tipoMovLabel(item.tipo)" :severity="tipoMovSeverity(item.tipo)" /></template>
              <template #body>
                <div class="record-card__row"><span class="record-card__label">Cantidad</span><span class="record-card__value">{{ item.cantidad }}</span></div>
                <div class="record-card__row"><span class="record-card__label">Stock</span><span class="record-card__value">{{ item.stockAnterior }} → {{ item.stockResultante }}</span></div>
                <div class="record-card__row"><span class="record-card__label">Motivo</span><span class="record-card__value">{{ item.motivo }}</span></div>
              </template>
            </MobileRecordCard>
          </div>
          <MobilePaginator v-model:page="movsPage" :rows="10" :total="movimientos.length" />
        </template>
      </TabPanel>

      <!-- ═══ TAB UBICACIONES ═══ -->
      <TabPanel header="Ubicaciones" leftIcon="pi pi-map-marker">
        <div class="flex justify-content-end mb-3">
          <Button label="Nueva Ubicación" icon="pi pi-plus" size="small" @click="abrirNuevaUbicacion" />
        </div>
        <div v-if="ubicaciones.length === 0" class="text-center py-4 text-color-secondary">No hay ubicaciones registradas</div>
        <div v-else class="mobile-card-list">
          <MobileRecordCard v-for="item in paginatedUbicaciones" :key="item.id" :title="item.nombre" :subtitle="item.direccionFisica || 'Sin dirección'">
            <template #tags>
              <Tag :value="tipoUbicacionLabel(item.tipo)" severity="info" />
              <Tag :value="item.activa ? 'Activa' : 'Inactiva'" :severity="item.activa ? 'success' : 'secondary'" />
            </template>
            <template #body>
              <div class="record-card__row"><span class="record-card__label">Artículos</span><span class="record-card__value">{{ item.cantidadArticulos }}</span></div>
            </template>
            <template #actions>
              <Button icon="pi pi-pencil" text rounded size="small" severity="info" @click="editarUbicacion(item)" />
              <Button icon="pi pi-trash" text rounded size="small" severity="danger" @click="confirmarEliminarUbicacion(item)" />
            </template>
          </MobileRecordCard>
        </div>
        <MobilePaginator v-model:page="ubicacionesPage" :rows="10" :total="ubicaciones.length" />
      </TabPanel>

      <!-- ═══ TAB MANTENIMIENTOS ═══ -->
      <TabPanel header="Mantenimientos" leftIcon="pi pi-wrench">
        <div class="flex gap-2 mb-3 flex-wrap">
          <Dropdown v-model="filtrosMant.estado" :options="estadosMantenimiento" optionLabel="label" optionValue="value" placeholder="Estado" class="w-12rem" @change="cargarMantenimientos" showClear />
          <Dropdown v-model="filtrosMant.tipo" :options="tiposMantenimiento" optionLabel="label" optionValue="value" placeholder="Tipo" class="w-12rem" @change="cargarMantenimientos" showClear />
          <Button label="Registrar Mantenimiento" icon="pi pi-plus" size="small" @click="abrirNuevoMantenimiento" />
        </div>
        <div v-if="loadingMant" class="flex justify-content-center py-5"><ProgressSpinner /></div>
        <template v-else>
          <div v-if="mantenimientos.length === 0" class="text-center py-4 text-color-secondary">No hay mantenimientos registrados</div>
          <div v-else class="mobile-card-list">
            <MobileRecordCard v-for="item in paginatedMantenimientos" :key="item.id" :title="item.articuloNombre" :subtitle="formatDate(item.fechaMantenimiento)">
              <template #tags>
                <Tag :value="tipoMantLabel(item.tipo)" severity="info" />
                <Tag :value="estadoMantLabel(item.estado)" :severity="estadoMantSeverity(item.estado)" />
              </template>
              <template #body>
                <div class="record-card__row"><span class="record-card__label">Descripción</span><span class="record-card__value">{{ item.descripcion }}</span></div>
                <div class="record-card__row"><span class="record-card__label">Costo</span><span class="record-card__value">{{ item.costo ? formatCurrency(item.costo) : '—' }}</span></div>
              </template>
              <template #actions>
                <Button v-if="item.estado === 0" icon="pi pi-check" text rounded size="small" severity="success" @click="completarMant(item)" v-tooltip="'Completar'" />
              </template>
            </MobileRecordCard>
          </div>
          <MobilePaginator v-model:page="mantPage" :rows="10" :total="mantenimientos.length" />
        </template>
      </TabPanel>

      <!-- ═══ TAB ALERTAS ═══ -->
      <TabPanel header="Alertas" leftIcon="pi pi-bell">
        <div v-if="loadingAlertas" class="flex justify-content-center py-6">
          <ProgressSpinner />
        </div>
        <div v-else class="grid">
          <!-- Stock Bajo -->
          <div class="col-12 md:col-4">
            <Panel header="⚠️ Stock Bajo" class="h-full">
              <div v-if="alertas?.stockBajo?.length === 0" class="text-color-secondary text-sm">Sin alertas</div>
              <div v-for="item in alertas?.stockBajo" :key="item.articuloId" class="alert-item mb-2">
                <div class="font-semibold text-sm">{{ item.nombre }}</div>
                <div class="text-xs text-color-secondary">{{ item.ubicacionNombre }}</div>
                <div class="flex align-items-center gap-2 mt-1">
                  <Tag :value="`Stock: ${item.stockActual} / min ${item.stockMinimo}`" severity="danger" />
                </div>
              </div>
            </Panel>
          </div>
          <!-- Por Vencer -->
          <div class="col-12 md:col-4">
            <Panel header="📅 Por Vencer (30 días)" class="h-full">
              <div v-if="alertas?.porVencer?.length === 0" class="text-color-secondary text-sm">Sin alertas</div>
              <div v-for="item in alertas?.porVencer" :key="item.articuloId" class="alert-item mb-2">
                <div class="font-semibold text-sm">{{ item.nombre }}</div>
                <div class="text-xs text-color-secondary">{{ item.ubicacionNombre }}</div>
                <Tag :value="`Vence en ${item.diasParaVencer} días`" :severity="item.diasParaVencer <= 7 ? 'danger' : 'warning'" class="mt-1" />
              </div>
            </Panel>
          </div>
          <!-- Mantenimientos Pendientes -->
          <div class="col-12 md:col-4">
            <Panel header="🔧 Mantenimientos Pendientes" class="h-full">
              <div v-if="alertas?.mantenimientosPendientes?.length === 0" class="text-color-secondary text-sm">Sin alertas</div>
              <div v-for="item in alertas?.mantenimientosPendientes" :key="item.id" class="alert-item mb-2">
                <div class="font-semibold text-sm">{{ item.articuloNombre }}</div>
                <div class="text-xs text-color-secondary">{{ tipoMantLabel(item.tipo) }}</div>
                <div class="text-xs mt-1">{{ formatDate(item.fechaMantenimiento) }}</div>
              </div>
            </Panel>
          </div>
        </div>
      </TabPanel>
    </TabView>

    <!-- ══════════════════════════════════════
         DIALOG ARTÍCULO (Crear/Editar)
    ══════════════════════════════════════ -->
    <Dialog v-model:visible="dlgArticulo" :header="articuloEdit.id ? 'Editar Artículo' : 'Nuevo Artículo'"
      modal :style="{width:'700px'}" :draggable="false">
      <div class="grid">
        <div class="col-12 md:col-6 field">
          <label class="font-semibold">Código *</label>
          <InputText v-model="articuloEdit.codigo" class="w-full" :disabled="!!articuloEdit.id" />
        </div>
        <div class="col-12 md:col-6 field">
          <label class="font-semibold">Nombre *</label>
          <InputText v-model="articuloEdit.nombre" class="w-full" />
        </div>
        <div class="col-12 field">
          <label class="font-semibold">Descripción</label>
          <Textarea v-model="articuloEdit.descripcion" rows="2" class="w-full" autoResize />
        </div>
        <div class="col-12 md:col-6 field">
          <label class="font-semibold">Categoría *</label>
          <Dropdown v-model="articuloEdit.categoria" :options="categorias" optionLabel="label" optionValue="value" class="w-full" />
        </div>
        <div class="col-12 md:col-6 field">
          <label class="font-semibold">Ubicación *</label>
          <Dropdown v-model="articuloEdit.ubicacionId" :options="ubicaciones" optionLabel="nombre" optionValue="id" class="w-full" />
        </div>
        <div class="col-12 md:col-4 field">
          <label class="font-semibold">Marca</label>
          <InputText v-model="articuloEdit.marca" class="w-full" />
        </div>
        <div class="col-12 md:col-4 field">
          <label class="font-semibold">Modelo</label>
          <InputText v-model="articuloEdit.modelo" class="w-full" />
        </div>
        <div class="col-12 md:col-4 field">
          <label class="font-semibold">Unidad Medida</label>
          <InputText v-model="articuloEdit.unidadMedida" class="w-full" />
        </div>
        <div class="col-12 md:col-4 field">
          <label class="font-semibold">Stock Actual</label>
          <InputNumber v-model="articuloEdit.stockActual" class="w-full" :min="0" :disabled="!!articuloEdit.id" />
        </div>
        <div class="col-12 md:col-4 field">
          <label class="font-semibold">Stock Mínimo</label>
          <InputNumber v-model="articuloEdit.stockMinimo" class="w-full" :min="0" />
        </div>
        <div class="col-12 md:col-4 field">
          <label class="font-semibold">Stock Máximo</label>
          <InputNumber v-model="articuloEdit.stockMaximo" class="w-full" :min="0" />
        </div>
        <div class="col-12 md:col-6 field">
          <label class="font-semibold">Valor Compra</label>
          <InputNumber v-model="articuloEdit.valorCompra" mode="currency" currency="ARS" class="w-full" />
        </div>
        <div class="col-12 md:col-6 field">
          <label class="font-semibold">Valor Actual</label>
          <InputNumber v-model="articuloEdit.valorActual" mode="currency" currency="ARS" class="w-full" />
        </div>
        <div class="col-12 md:col-6 field">
          <label class="font-semibold">Estado</label>
          <Dropdown v-model="articuloEdit.estado" :options="estadosArticulo" optionLabel="label" optionValue="value" class="w-full" />
        </div>
        <div class="col-12 md:col-6 field">
          <label class="font-semibold">Condición</label>
          <Dropdown v-model="articuloEdit.condicion" :options="condicionesArticulo" optionLabel="label" optionValue="value" class="w-full" />
        </div>
        <div class="col-12 md:col-6 field">
          <label class="font-semibold">Proveedor</label>
          <InputText v-model="articuloEdit.proveedor" class="w-full" />
        </div>
        <div class="col-12 md:col-6 field">
          <label class="font-semibold">Fecha Vencimiento</label>
          <Calendar v-model="articuloEdit.fechaVencimiento" dateFormat="dd/mm/yy" class="w-full" showButtonBar />
        </div>
        <div class="col-12 field">
          <label class="font-semibold">Observaciones</label>
          <Textarea v-model="articuloEdit.observaciones" rows="2" class="w-full" autoResize />
        </div>
        <div class="col-12 field flex align-items-center gap-2">
          <Checkbox v-model="articuloEdit.requiereMantenimiento" :binary="true" inputId="reqMant" />
          <label for="reqMant">Requiere mantenimiento periódico</label>
        </div>
        <div v-if="articuloEdit.requiereMantenimiento" class="col-12 md:col-6 field">
          <label class="font-semibold">Próximo Mantenimiento</label>
          <Calendar v-model="articuloEdit.proximoMantenimiento" dateFormat="dd/mm/yy" class="w-full" showButtonBar />
        </div>
      </div>
      <template #footer>
        <Button label="Cancelar" text @click="dlgArticulo = false" />
        <Button :label="articuloEdit.id ? 'Guardar' : 'Crear'" :loading="guardando" @click="guardarArticulo" />
      </template>
    </Dialog>

    <!-- ══════════════════════════════════════
         DIALOG MOVIMIENTO
    ══════════════════════════════════════ -->
    <Dialog v-model:visible="dlgMovimiento" header="Registrar Movimiento" modal :style="{width:'480px'}" :draggable="false">
      <div class="grid">
        <div class="col-12 field">
          <label class="font-semibold">Artículo</label>
          <InputText :value="movEdit.articuloNombre" disabled class="w-full" />
        </div>
        <div class="col-12 field">
          <label class="font-semibold">Tipo de Movimiento *</label>
          <Dropdown v-model="movEdit.tipo" :options="tiposMovimiento" optionLabel="label" optionValue="value" class="w-full" />
        </div>
        <div class="col-12 field">
          <label class="font-semibold">Cantidad *</label>
          <InputNumber v-model="movEdit.cantidad" class="w-full" :min="1" />
        </div>
        <div class="col-12 field">
          <label class="font-semibold">Motivo *</label>
          <InputText v-model="movEdit.motivo" class="w-full" />
        </div>
        <div class="col-12 field">
          <label class="font-semibold">Observaciones</label>
          <Textarea v-model="movEdit.observaciones" rows="2" class="w-full" autoResize />
        </div>
        <div class="col-12 field">
          <label class="font-semibold">Valor Unitario</label>
          <InputNumber v-model="movEdit.valorUnitario" mode="currency" currency="ARS" class="w-full" />
        </div>
        <div v-if="movEdit.tipo === 2 || movEdit.tipo === 3" class="col-12 field">
          <!-- Tipo 2=Prestamo, 3=Devolucion -->
          <label class="font-semibold">Fecha Devolución Esperada</label>
          <Calendar v-model="movEdit.fechaDevolucionEsperada" dateFormat="dd/mm/yy" class="w-full" showButtonBar />
        </div>
      </div>
      <template #footer>
        <Button label="Cancelar" text @click="dlgMovimiento = false" />
        <Button label="Registrar" :loading="guardando" @click="guardarMovimiento" />
      </template>
    </Dialog>

    <!-- ══════════════════════════════════════
         DIALOG UBICACIÓN
    ══════════════════════════════════════ -->
    <Dialog v-model:visible="dlgUbicacion" :header="ubicacionEdit.id ? 'Editar Ubicación' : 'Nueva Ubicación'"
      modal :style="{width:'480px'}" :draggable="false">
      <div class="grid">
        <div class="col-12 field">
          <label class="font-semibold">Nombre *</label>
          <InputText v-model="ubicacionEdit.nombre" class="w-full" />
        </div>
        <div class="col-12 field">
          <label class="font-semibold">Tipo *</label>
          <Dropdown v-model="ubicacionEdit.tipo" :options="tiposUbicacion" optionLabel="label" optionValue="value" class="w-full" />
        </div>
        <div class="col-12 field">
          <label class="font-semibold">Descripción</label>
          <Textarea v-model="ubicacionEdit.descripcion" rows="2" class="w-full" autoResize />
        </div>
        <div class="col-12 field">
          <label class="font-semibold">Dirección Física</label>
          <InputText v-model="ubicacionEdit.direccionFisica" class="w-full" />
        </div>
        <div class="col-12 flex gap-4">
          <div class="flex align-items-center gap-2">
            <Checkbox v-model="ubicacionEdit.esDeposito" :binary="true" inputId="esDeposito" />
            <label for="esDeposito">Es depósito</label>
          </div>
          <div class="flex align-items-center gap-2">
            <Checkbox v-model="ubicacionEdit.requiereAccesoEspecial" :binary="true" inputId="reqAcceso" />
            <label for="reqAcceso">Acceso especial</label>
          </div>
          <div class="flex align-items-center gap-2">
            <Checkbox v-model="ubicacionEdit.activa" :binary="true" inputId="activa" />
            <label for="activa">Activa</label>
          </div>
        </div>
      </div>
      <template #footer>
        <Button label="Cancelar" text @click="dlgUbicacion = false" />
        <Button :label="ubicacionEdit.id ? 'Guardar' : 'Crear'" :loading="guardando" @click="guardarUbicacion" />
      </template>
    </Dialog>

    <!-- ══════════════════════════════════════
         DIALOG MANTENIMIENTO
    ══════════════════════════════════════ -->
    <Dialog v-model:visible="dlgMantenimiento" header="Registrar Mantenimiento" modal :style="{width:'480px'}" :draggable="false">
      <div class="grid">
        <div class="col-12 field">
          <label class="font-semibold">Artículo *</label>
          <Dropdown v-model="mantEdit.articuloId" :options="articulos" optionLabel="nombre" optionValue="id" class="w-full" filter />
        </div>
        <div class="col-12 md:col-6 field">
          <label class="font-semibold">Tipo *</label>
          <Dropdown v-model="mantEdit.tipoMantenimiento" :options="tiposMantenimiento" optionLabel="label" optionValue="value" class="w-full" />
        </div>
        <div class="col-12 md:col-6 field">
          <label class="font-semibold">Fecha *</label>
          <Calendar v-model="mantEdit.fechaMantenimiento" dateFormat="dd/mm/yy" class="w-full" showButtonBar />
        </div>
        <div class="col-12 field">
          <label class="font-semibold">Descripción *</label>
          <Textarea v-model="mantEdit.descripcion" rows="2" class="w-full" autoResize />
        </div>
        <div class="col-12 md:col-6 field">
          <label class="font-semibold">Proveedor Servicio</label>
          <InputText v-model="mantEdit.proveedorServicio" class="w-full" />
        </div>
        <div class="col-12 md:col-6 field">
          <label class="font-semibold">Costo</label>
          <InputNumber v-model="mantEdit.costo" mode="currency" currency="ARS" class="w-full" />
        </div>
        <div class="col-12 field">
          <label class="font-semibold">Próximo Mantenimiento</label>
          <Calendar v-model="mantEdit.fechaProximoMantenimiento" dateFormat="dd/mm/yy" class="w-full" showButtonBar />
        </div>
        <div class="col-12 field">
          <label class="font-semibold">Observaciones</label>
          <Textarea v-model="mantEdit.observaciones" rows="2" class="w-full" autoResize />
        </div>
      </div>
      <template #footer>
        <Button label="Cancelar" text @click="dlgMantenimiento = false" />
        <Button label="Registrar" :loading="guardando" @click="guardarMantenimiento" />
      </template>
    </Dialog>

    <ConfirmDialog />
    <Toast />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useConfirm } from 'primevue/useconfirm'
import { useToast } from 'primevue/usetoast'
import * as inventarioService from '@/services/inventarioService'

// PrimeVue components (auto-imported via PrimeVue plugin)
import TabView from 'primevue/tabview'
import TabPanel from 'primevue/tabpanel'
import Button from 'primevue/button'
import PageHeader from '@/components/mobile/PageHeader.vue'
import MobileRecordCard from '@/components/mobile/MobileRecordCard.vue'
import MobilePaginator from '@/components/mobile/MobilePaginator.vue'
import InputText from 'primevue/inputtext'
import InputNumber from 'primevue/inputnumber'
import Textarea from 'primevue/textarea'
import Dropdown from 'primevue/dropdown'
import Calendar from 'primevue/calendar'
import Checkbox from 'primevue/checkbox'
import Tag from 'primevue/tag'
import Dialog from 'primevue/dialog'
import Panel from 'primevue/panel'
import ToggleButton from 'primevue/togglebutton'
import ProgressSpinner from 'primevue/progressspinner'
import ConfirmDialog from 'primevue/confirmdialog'
import Toast from 'primevue/toast'

const confirm = useConfirm()
const toast = useToast()

// ── State ──
const activeTab = ref(0)
const articulosPage = ref(1)
const movsPage = ref(1)
const ubicacionesPage = ref(1)
const mantPage = ref(1)
const loadingArticulos = ref(false)
const loadingMovs = ref(false)
const loadingMant = ref(false)
const loadingAlertas = ref(false)
const guardando = ref(false)

const articulos = ref([])
const ubicaciones = ref([])
const movimientos = ref([])
const mantenimientos = ref([])
const reporte = ref(null)
const alertas = ref(null)

// Dialogs
const dlgArticulo = ref(false)
const dlgMovimiento = ref(false)
const dlgUbicacion = ref(false)
const dlgMantenimiento = ref(false)

// Filtros
const filtros = ref({ busqueda: '', categoria: null, estado: null, ubicacionId: null, soloBajoStock: false })
const filtrosMovs = ref({ tipo: null, desde: null, hasta: null })
const filtrosMant = ref({ estado: null, tipo: null })

// Forms
const articuloEdit = ref(defaultArticulo())
const movEdit = ref(defaultMovimiento())
const ubicacionEdit = ref(defaultUbicacion())
const mantEdit = ref(defaultMantenimiento())

// ── Computed ──
const alertaCount = computed(() =>
  (alertas.value?.stockBajo?.length ?? 0) +
  (alertas.value?.porVencer?.length ?? 0) +
  (alertas.value?.mantenimientosPendientes?.length ?? 0)
)

const paginatedArticulos = computed(() => {
  const start = (articulosPage.value - 1) * 10
  return articulos.value.slice(start, start + 10)
})
const paginatedMovimientos = computed(() => {
  const start = (movsPage.value - 1) * 10
  return movimientos.value.slice(start, start + 10)
})
const paginatedUbicaciones = computed(() => {
  const start = (ubicacionesPage.value - 1) * 10
  return ubicaciones.value.slice(start, start + 10)
})
const paginatedMantenimientos = computed(() => {
  const start = (mantPage.value - 1) * 10
  return mantenimientos.value.slice(start, start + 10)
})

// ── Catalogs ──
const categorias = [
  { label: 'Material Deportivo', value: 0 },
  { label: 'Equipamiento', value: 1 },
  { label: 'Mobiliario', value: 2 },
  { label: 'Electrónica', value: 3 },
  { label: 'Limpieza', value: 4 },
  { label: 'Oficina', value: 5 },
  { label: 'Indumentaria', value: 6 },
  { label: 'Otros', value: 7 }
]
const estadosArticulo = [
  { label: 'Activo', value: 0 },
  { label: 'Prestado', value: 1 },
  { label: 'En Mantenimiento', value: 2 },
  { label: 'Dado de Baja', value: 3 },
  { label: 'Reservado', value: 4 }
]
const condicionesArticulo = [
  { label: 'Nuevo', value: 0 },
  { label: 'Bueno', value: 1 },
  { label: 'Regular', value: 2 },
  { label: 'Malo', value: 3 },
  { label: 'Fuera de Servicio', value: 4 }
]
const tiposMovimiento = [
  { label: 'Entrada', value: 0 },
  { label: 'Salida', value: 1 },
  { label: 'Préstamo', value: 2 },
  { label: 'Devolución', value: 3 },
  { label: 'Transferencia', value: 4 },
  { label: 'Ajuste', value: 5 }
]
const tiposUbicacion = [
  { label: 'Depósito', value: 0 },
  { label: 'Salón', value: 1 },
  { label: 'Cancha', value: 2 },
  { label: 'Oficina', value: 3 },
  { label: 'Exterior', value: 4 },
  { label: 'Otro', value: 5 }
]
const tiposMantenimiento = [
  { label: 'Preventivo', value: 0 },
  { label: 'Correctivo', value: 1 },
  { label: 'Limpieza', value: 2 },
  { label: 'Calibración', value: 3 },
  { label: 'Otro', value: 4 }
]
const estadosMantenimiento = [
  { label: 'Pendiente', value: 0 },
  { label: 'En Proceso', value: 1 },
  { label: 'Completado', value: 2 },
  { label: 'Cancelado', value: 3 }
]

// ── Helpers ──
function defaultArticulo() {
  return {
    id: null, codigo: '', nombre: '', descripcion: '', categoria: 0,
    marca: '', modelo: '', ubicacionId: null, stockActual: 0,
    stockMinimo: 0, stockMaximo: 100, unidadMedida: 'Unidad',
    valorCompra: null, valorActual: null, fechaVencimiento: null,
    estado: 0, condicion: 0, proveedor: '', observaciones: '',
    requiereMantenimiento: false, proximoMantenimiento: null
  }
}
function defaultMovimiento() {
  return {
    articuloId: null, articuloNombre: '', tipo: 0,
    cantidad: 1, motivo: '', observaciones: '', valorUnitario: null,
    fechaDevolucionEsperada: null
  }
}
function defaultUbicacion() {
  return {
    id: null, nombre: '', descripcion: '', tipo: 0,
    direccionFisica: '', esDeposito: false, requiereAccesoEspecial: false, activa: true
  }
}
function defaultMantenimiento() {
  return {
    articuloId: null, tipoMantenimiento: 0,
    fechaMantenimiento: new Date(), descripcion: '', proveedorServicio: '',
    costo: null, fechaProximoMantenimiento: null, observaciones: '',
    empleadoId: 'SYSTEM'
  }
}

const formatDate = (d) => d ? new Date(d).toLocaleString('es-AR', { day:'2-digit', month:'2-digit', year:'numeric', hour:'2-digit', minute:'2-digit' }) : '—'
const formatCurrency = (v) => v != null ? new Intl.NumberFormat('es-AR', { style:'currency', currency:'ARS', minimumFractionDigits:0 }).format(v) : '—'

const categoriaLabel = (v) => categorias.find(c => c.value === v)?.label ?? v
const categoriaSeverity = (v) => ['info','success','warning','danger','secondary','contrast','info','secondary'][v] ?? 'secondary'
const estadoLabel = (v) => estadosArticulo.find(c => c.value === v)?.label ?? v
const estadoSeverity = (v) => ['success','warning','info','secondary','contrast'][v] ?? 'secondary'
const condicionLabel = (v) => condicionesArticulo.find(c => c.value === v)?.label ?? v
const condicionSeverity = (v) => ['success','success','warning','danger','secondary'][v] ?? 'secondary'
const tipoMovLabel = (v) => tiposMovimiento.find(c => c.value === v)?.label ?? v
const tipoMovSeverity = (v) => ['success','warning','info','success','contrast','secondary'][v] ?? 'secondary'
const tipoUbicacionLabel = (v) => tiposUbicacion.find(c => c.value === v)?.label ?? v
const tipoMantLabel = (v) => tiposMantenimiento.find(c => c.value === v)?.label ?? v
const estadoMantLabel = (v) => estadosMantenimiento.find(c => c.value === v)?.label ?? v
const estadoMantSeverity = (v) => ['warning','info','success','secondary'][v] ?? 'secondary'

// ── Data Loading ──
async function cargarTodo() {
  await Promise.all([
    cargarArticulos(),
    cargarUbicaciones(),
    cargarMovimientos(),
    cargarMantenimientos(),
    cargarReporte(),
    cargarAlertas()
  ])
}

async function cargarArticulos() {
  loadingArticulos.value = true
  try {
    const params = {}
    if (filtros.value.busqueda) params.busqueda = filtros.value.busqueda
    if (filtros.value.categoria !== null) params.categoria = filtros.value.categoria
    if (filtros.value.estado !== null) params.estado = filtros.value.estado
    if (filtros.value.ubicacionId) params.ubicacionId = filtros.value.ubicacionId
    if (filtros.value.soloBajoStock) params.soloBajoStock = true
    const res = await inventarioService.getArticulos(params)
    articulos.value = res.items ?? res
  } finally { loadingArticulos.value = false }
}

let busquedaTimer = null
function buscarArticulos() {
  clearTimeout(busquedaTimer)
  busquedaTimer = setTimeout(cargarArticulos, 400)
}

async function cargarUbicaciones() {
  const res = await inventarioService.getUbicaciones()
  ubicaciones.value = res
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

async function cargarMantenimientos() {
  loadingMant.value = true
  try {
    const params = {}
    if (filtrosMant.value.estado !== null) params.estado = filtrosMant.value.estado
    if (filtrosMant.value.tipo !== null) params.tipo = filtrosMant.value.tipo
    const res = await inventarioService.getMantenimientos(params)
    mantenimientos.value = res.items ?? res
  } finally { loadingMant.value = false }
}

async function cargarReporte() {
  try { reporte.value = await inventarioService.getReporte() } catch (e) { console.error(e) }
}

async function cargarAlertas() {
  loadingAlertas.value = true
  try { alertas.value = await inventarioService.getAlertas() } finally { loadingAlertas.value = false }
}

// ── CRUD Artículos ──
function abrirNuevoArticulo() {
  articuloEdit.value = defaultArticulo()
  dlgArticulo.value = true
}
function editarArticulo(art) {
  articuloEdit.value = { ...art }
  dlgArticulo.value = true
}
function verArticulo(art) {
  editarArticulo(art)
}
async function guardarArticulo() {
  if (!articuloEdit.value.nombre || !articuloEdit.value.codigo || !articuloEdit.value.ubicacionId) {
    toast.add({ severity: 'warn', summary: 'Campos requeridos', detail: 'Código, nombre y ubicación son obligatorios', life: 3000 })
    return
  }
  guardando.value = true
  try {
    if (articuloEdit.value.id) {
      await inventarioService.actualizarArticulo(articuloEdit.value.id, articuloEdit.value)
      toast.add({ severity: 'success', summary: 'Actualizado', detail: 'Artículo actualizado correctamente', life: 3000 })
    } else {
      await inventarioService.crearArticulo(articuloEdit.value)
      toast.add({ severity: 'success', summary: 'Creado', detail: 'Artículo creado correctamente', life: 3000 })
    }
    dlgArticulo.value = false
    await cargarArticulos()
    await cargarReporte()
  } catch (e) {
    toast.add({ severity: 'error', summary: 'Error', detail: e.response?.data?.message ?? 'No se pudo guardar', life: 4000 })
  } finally { guardando.value = false }
}
function confirmarEliminar(art) {
  confirm.require({
    message: `¿Eliminar "${art.nombre}"? Si tiene movimientos, se dará de baja en lugar de eliminarse.`,
    header: 'Confirmar eliminación',
    icon: 'pi pi-trash',
    acceptSeverity: 'danger',
    accept: async () => {
      await inventarioService.eliminarArticulo(art.id)
      toast.add({ severity: 'success', summary: 'Eliminado', life: 2000 })
      await cargarArticulos()
      await cargarReporte()
    }
  })
}

// ── Movimientos ──
function abrirMovimiento(art) {
  movEdit.value = { ...defaultMovimiento(), articuloId: art.id, articuloNombre: art.nombre }
  dlgMovimiento.value = true
}
async function guardarMovimiento() {
  if (!movEdit.value.motivo || !movEdit.value.cantidad) {
    toast.add({ severity: 'warn', summary: 'Campos requeridos', detail: 'Motivo y cantidad son obligatorios', life: 3000 })
    return
  }
  guardando.value = true
  try {
    const payload = {
      articuloId: movEdit.value.articuloId,
      cantidad: movEdit.value.cantidad,
      motivo: movEdit.value.motivo,
      observaciones: movEdit.value.observaciones,
      valorUnitario: movEdit.value.valorUnitario,
      fechaDevolucionEsperada: movEdit.value.fechaDevolucionEsperada,
      empleadoId: 'SYSTEM'
    }
    const tipoMap = {
      0: inventarioService.registrarEntrada,
      1: inventarioService.registrarSalida,
      2: inventarioService.registrarPrestamo,
      3: inventarioService.registrarDevolucion,
      4: inventarioService.registrarTransferencia,
      5: inventarioService.registrarAjuste
    }
    await tipoMap[movEdit.value.tipo](payload)
    toast.add({ severity: 'success', summary: 'Movimiento registrado', life: 3000 })
    dlgMovimiento.value = false
    await cargarArticulos()
    await cargarMovimientos()
    await cargarReporte()
  } catch (e) {
    toast.add({ severity: 'error', summary: 'Error', detail: e.response?.data?.message ?? 'No se pudo registrar', life: 4000 })
  } finally { guardando.value = false }
}

// ── Ubicaciones ──
function abrirNuevaUbicacion() {
  ubicacionEdit.value = defaultUbicacion()
  dlgUbicacion.value = true
}
function editarUbicacion(ub) {
  ubicacionEdit.value = { ...ub }
  dlgUbicacion.value = true
}
async function guardarUbicacion() {
  if (!ubicacionEdit.value.nombre) {
    toast.add({ severity: 'warn', summary: 'Nombre requerido', life: 3000 })
    return
  }
  guardando.value = true
  try {
    if (ubicacionEdit.value.id) {
      await inventarioService.actualizarUbicacion(ubicacionEdit.value.id, ubicacionEdit.value)
      toast.add({ severity: 'success', summary: 'Ubicación actualizada', life: 3000 })
    } else {
      await inventarioService.crearUbicacion(ubicacionEdit.value)
      toast.add({ severity: 'success', summary: 'Ubicación creada', life: 3000 })
    }
    dlgUbicacion.value = false
    await cargarUbicaciones()
  } catch (e) {
    toast.add({ severity: 'error', summary: 'Error', detail: e.response?.data?.message ?? 'No se pudo guardar', life: 4000 })
  } finally { guardando.value = false }
}
function confirmarEliminarUbicacion(ub) {
  confirm.require({
    message: `¿Eliminar la ubicación "${ub.nombre}"?`,
    header: 'Confirmar',
    icon: 'pi pi-trash',
    acceptSeverity: 'danger',
    accept: async () => {
      await inventarioService.eliminarUbicacion(ub.id)
      toast.add({ severity: 'success', summary: 'Eliminada', life: 2000 })
      await cargarUbicaciones()
    }
  })
}

// ── Mantenimientos ──
function abrirNuevoMantenimiento() {
  mantEdit.value = defaultMantenimiento()
  dlgMantenimiento.value = true
}
async function guardarMantenimiento() {
  if (!mantEdit.value.articuloId || !mantEdit.value.descripcion) {
    toast.add({ severity: 'warn', summary: 'Campos requeridos', detail: 'Artículo y descripción son obligatorios', life: 3000 })
    return
  }
  guardando.value = true
  try {
    await inventarioService.registrarMantenimiento(mantEdit.value)
    toast.add({ severity: 'success', summary: 'Mantenimiento registrado', life: 3000 })
    dlgMantenimiento.value = false
    await cargarMantenimientos()
    await cargarAlertas()
  } catch (e) {
    toast.add({ severity: 'error', summary: 'Error', detail: e.response?.data?.message ?? 'No se pudo registrar', life: 4000 })
  } finally { guardando.value = false }
}
async function completarMant(mant) {
  try {
    await inventarioService.completarMantenimiento(mant.id, { observaciones: null, costo: mant.costo })
    toast.add({ severity: 'success', summary: 'Mantenimiento completado', life: 3000 })
    await cargarMantenimientos()
    await cargarAlertas()
  } catch (e) {
    toast.add({ severity: 'error', summary: 'Error', life: 3000 })
  }
}

// ── Mount ──
onMounted(cargarTodo)
</script>

<style scoped>
.kpi-card {
  background: var(--surface-card);
  border: 1px solid var(--surface-border);
  border-radius: 0.75rem;
  padding: 1.25rem;
  display: flex;
  align-items: center;
  gap: 1rem;
}
.kpi-icon {
  width: 3rem;
  height: 3rem;
  border-radius: 0.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.alert-item {
  padding: 0.5rem;
  border-radius: 0.4rem;
  background: var(--surface-ground);
  border-left: 3px solid var(--orange-400);
}
.field {
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
}
</style>
