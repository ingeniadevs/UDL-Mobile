<template>
  <div>
    <PageHeader title="Disciplinas">
      <template #actions>
        <Button v-if="isMaster" label="Nueva Disciplina" icon="pi pi-plus" size="small" @click="openNew" />
      </template>
    </PageHeader>

    <!-- Stats Cards -->
    <div v-if="isMaster" class="grid mb-4">
      <div class="col-12 sm:col-6 md:col-3">
        <div class="stat-card">
          <div class="flex align-items-center gap-3">
            <div class="stat-icon total"><i class="pi pi-list text-2xl"></i></div>
            <div>
              <span class="block text-gray-400 text-sm mb-1">Total Disciplinas</span>
              <span class="text-2xl font-bold" style="color: var(--text-color)">{{ stats.total }}</span>
            </div>
          </div>
        </div>
      </div>
      <div class="col-12 sm:col-6 md:col-3">
        <div class="stat-card">
          <div class="flex align-items-center gap-3">
            <div class="stat-icon activas"><i class="pi pi-check-circle text-2xl"></i></div>
            <div>
              <span class="block text-gray-400 text-sm mb-1">Activas</span>
              <span class="text-2xl font-bold text-green-400">{{ stats.activas }}</span>
            </div>
          </div>
        </div>
      </div>
      <div class="col-12 sm:col-6 md:col-3">
        <div class="stat-card">
          <div class="flex align-items-center gap-3">
            <div class="stat-icon inactivas"><i class="pi pi-times-circle text-2xl"></i></div>
            <div>
              <span class="block text-gray-400 text-sm mb-1">Inactivas</span>
              <span class="text-2xl font-bold text-red-400">{{ stats.inactivas }}</span>
            </div>
          </div>
        </div>
      </div>
      <div class="col-12 sm:col-6 md:col-3">
        <div class="stat-card">
          <div class="flex align-items-center gap-3">
            <div class="stat-icon inscriptos"><i class="pi pi-users text-2xl"></i></div>
            <div>
              <span class="block text-gray-400 text-sm mb-1">Total Inscriptos</span>
              <span class="text-2xl font-bold text-blue-400">{{ stats.inscriptos }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Filtros -->
    <div class="card mb-4">
      <div class="flex flex-wrap gap-3 align-items-end">
        <div class="flex flex-column gap-1">
          <label class="text-gray-400 text-sm">Buscar</label>
          <span class="p-input-icon-left">
            <i class="pi pi-search" />
            <InputText v-model="busqueda" placeholder="Nombre, descripcion..." style="width:240px" />
          </span>
        </div>
        <div class="flex flex-column gap-1">
          <label class="text-gray-400 text-sm">Estado</label>
          <Dropdown
            v-model="filtroEstado"
            :options="estadoOptions"
            optionLabel="label"
            optionValue="value"
            placeholder="Todos"
            showClear
            style="width:150px"
          />
        </div>
        <Button icon="pi pi-filter-slash" label="Limpiar" outlined severity="secondary" size="small" @click="limpiarFiltros" />
      </div>
    </div>

    <div v-if="loading" class="flex justify-content-center py-5">
      <ProgressSpinner />
    </div>
    <template v-else>
      <div v-if="disciplinasFiltradas.length === 0" class="card text-center py-6">
        <i class="pi pi-list text-5xl text-gray-600 mb-3 block"></i>
        <p class="text-gray-400 text-lg">No se encontraron disciplinas</p>
        <Button v-if="isMaster" label="Nueva Disciplina" icon="pi pi-plus" class="mt-2" size="small" @click="openNew" />
      </div>
      <div v-else class="mobile-card-list">
        <MobileRecordCard
          v-for="disc in paginatedDisciplinas"
          :key="disc.id"
          :title="disc.nombre"
          :subtitle="disc.empleadoNombre || 'Sin instructor'"
          :class="{ 'opacity-60': !disc.activa }"
          @click="openDetalle(disc)"
        >
          <template #leading>
            <div class="disc-avatar" :style="{ background: getColor(disc.nombre) }">
              <span class="text-white font-bold text-sm">{{ getInitials(disc.nombre) }}</span>
            </div>
          </template>
          <template #tags>
            <Tag :severity="disc.activa ? 'success' : 'danger'" :value="disc.activa ? 'Activa' : 'Inactiva'" />
          </template>
          <template #body>
            <p v-if="disc.descripcion" class="text-gray-400 text-sm m-0 mb-2 disc-desc">{{ disc.descripcion }}</p>
            <div class="record-card__row">
              <span class="record-card__label">Inscriptos</span>
              <span class="record-card__value text-blue-400 font-bold">{{ disc.cantidadSocios ?? 0 }}</span>
            </div>
            <div class="record-card__row">
              <span class="record-card__label">Cuota</span>
              <span class="record-card__value text-green-400 font-bold">${{ disc.cuotaMensual?.toLocaleString('es-AR') ?? '0' }}</span>
            </div>
            <div class="record-card__row">
              <span class="record-card__label">Cobro</span>
              <span class="record-card__value">
                <Tag
                  :severity="disc.tipoFacturacion === 'IncluidaEnCuotaSocial' ? 'info' : 'warning'"
                  :value="disc.tipoFacturacion === 'IncluidaEnCuotaSocial' ? 'Cuota mensual' : 'Cobro aparte'"
                  class="text-xs"
                />
              </span>
            </div>
            <div v-if="disc.subcomisionNombre" class="record-card__row">
              <span class="record-card__label">Subcomisión</span>
              <span class="record-card__value">{{ disc.subcomisionNombre }}</span>
            </div>
            <div v-if="disc.categorias?.length || disc.cantidadCategorias" class="record-card__row">
              <span class="record-card__label">Categorías</span>
              <span class="record-card__value text-sm">
                {{ disc.categorias?.map(c => c.nombre || c).join(', ') || disc.cantidadCategorias }}
              </span>
            </div>
          </template>
          <template #actions>
            <Button icon="pi pi-eye" text rounded size="small" class="text-gray-400" v-tooltip="'Ver detalle'" @click="openDetalle(disc)" />
            <Button v-if="isMaster" icon="pi pi-pencil" text rounded size="small" severity="success" v-tooltip="'Editar'" @click="editDisciplina(disc)" />
            <Button icon="pi pi-users" text rounded size="small" class="text-blue-400" v-tooltip="'Inscriptos'" @click="openInscriptos(disc)" />
            <Button v-if="isMaster" icon="pi pi-trash" text rounded size="small" severity="danger" v-tooltip="'Eliminar'" @click="confirmDelete(disc)" />
          </template>
        </MobileRecordCard>
      </div>
      <MobilePaginator v-model:page="disciplinasPage" :rows="10" :total="disciplinasFiltradas.length" />
    </template>

    <!-- DIALOG CREAR / EDITAR -->
    <Dialog v-model:visible="dialogVisible" :header="isEditing ? 'Editar Disciplina' : 'Nueva Disciplina'" :modal="true" :style="{ width: '500px' }" :breakpoints="{ '640px': '95vw' }" @hide="resetForm">
      <form @submit.prevent="saveDisciplina" class="flex flex-column gap-4 pt-2">
        <div class="field">
          <label class="block text-gray-300 font-medium mb-2">Nombre *</label>
          <InputText v-model="form.nombre" class="w-full" placeholder="Ej: Futbol, Natacion..." :class="{ 'p-invalid': formErrors.nombre }" autofocus />
          <small v-if="formErrors.nombre" class="p-error">{{ formErrors.nombre }}</small>
        </div>
        <div class="field">
          <label class="block text-gray-300 font-medium mb-2">Descripcion</label>
          <Textarea v-model="form.descripcion" rows="3" class="w-full" placeholder="Descripcion (opcional)" autoResize />
        </div>
        <div class="flex gap-3">
          <div class="flex-1 field">
            <label class="block text-gray-300 font-medium mb-2">Cuota Mensual *</label>
            <InputNumber v-model="form.cuotaMensual" class="w-full" :class="{ 'p-invalid': formErrors.cuotaMensual }" mode="currency" currency="ARS" locale="es-AR" :minFractionDigits="0" placeholder="$0" />
            <small v-if="formErrors.cuotaMensual" class="p-error">{{ formErrors.cuotaMensual }}</small>
          </div>
          <div class="flex-1 field">
            <label class="block text-gray-300 font-medium mb-2">Dia de cobro</label>
            <InputNumber v-model="form.diaCobro" class="w-full" :min="1" :max="28" placeholder="Ej: 10" />
          </div>
        </div>
        <div class="field">
          <label class="block text-gray-300 font-medium mb-2">Subcomisión (opcional)</label>
          <div class="flex gap-2">
            <Dropdown
              v-model="form.subcomisionId"
              :options="subcomisiones"
              optionLabel="nombre"
              optionValue="id"
              placeholder="Sin subcomisión..."
              class="flex-1"
              filter
              showClear
              :loading="loadingSubcomisiones"
              :disabled="isScopedSubcomision"
            />
            <Button v-if="!isScopedSubcomision" icon="pi pi-plus" v-tooltip="'Nueva subcomisión'" outlined @click="openNuevaSubcomision" type="button" />
          </div>
          <small class="text-gray-500 block mt-2">
            La subcomisión es solo para rendición y reportes.
          </small>
        </div>
        <div class="field">
          <label class="block text-gray-300 font-medium mb-2">Cobro de cuota</label>
          <div class="flex align-items-center gap-3 mt-1">
            <InputSwitch v-model="form.cobrarConCuotaMensual" inputId="sw-facturacion" />
            <label for="sw-facturacion" class="cursor-pointer" :class="form.cobrarConCuotaMensual ? 'text-green-400' : 'text-gray-400'">
              {{ form.cobrarConCuotaMensual ? 'Incluida en la cuota mensual' : 'Cobro aparte (no incluida en cuota mensual)' }}
            </label>
          </div>
        </div>
        <div class="field" v-if="isScopedSubcomision">
          <label class="block text-gray-300 font-medium mb-2">Subcomisión asignada</label>
          <Tag :value="authStore.user?.subcomisionNombre || 'Mi subcomisión'" severity="info" />
        </div>
        <div class="field">
          <label class="block text-gray-300 font-medium mb-2">Entrenadores / Instructores</label>
          <MultiSelect
            v-model="form.empleadoIds"
            :options="empleados"
            optionLabel="nombreCompleto"
            optionValue="id"
            placeholder="Sin asignar"
            class="w-full"
            filter
            filterPlaceholder="Buscar entrenador..."
            :loading="loadingEmpleados"
            display="chip"
            :maxSelectedLabels="3"
          />
        </div>
        <div class="field" v-if="isEditing">
          <label class="block text-gray-300 font-medium mb-2">Estado</label>
          <div class="flex align-items-center gap-3 mt-1">
            <InputSwitch v-model="form.activa" inputId="sw-activa" />
            <label for="sw-activa" class="cursor-pointer" :class="form.activa ? 'text-green-400' : 'text-gray-500'">{{ form.activa ? 'Activa' : 'Inactiva' }}</label>
          </div>
        </div>
        <Message v-if="saveError" severity="error" :closable="false">{{ saveError }}</Message>
      </form>
      <template #footer>
        <Button label="Cancelar" icon="pi pi-times" text class="text-gray-400" @click="dialogVisible = false" />
        <Button :label="isEditing ? 'Guardar cambios' : 'Crear disciplina'" icon="pi pi-check" @click="saveDisciplina" :loading="saving" />
      </template>
    </Dialog>

    <!-- DIALOG DETALLE -->
    <Dialog v-model:visible="detalleVisible" :header="disciplinaActual?.nombre" :modal="true" :style="{ width: 'min(96vw, 1100px)' }" :breakpoints="{ '768px': '98vw' }" contentClass="disciplina-detalle-dialog" @hide="onDetalleHide">
      <div v-if="disciplinaActual">
        <div class="flex flex-wrap gap-3 mb-4">
          <div class="stat-mini">
            <i class="pi pi-tag text-gray-400"></i>
            <span class="text-gray-400 text-sm">Estado:</span>
            <Tag :severity="disciplinaActual.activa ? 'success' : 'danger'" :value="disciplinaActual.activa ? 'Activa' : 'Inactiva'" />
          </div>
          <div class="stat-mini">
            <i class="pi pi-dollar text-green-400"></i>
            <span class="text-gray-400 text-sm">Cuota:</span>
            <span class="text-green-400 font-bold">${{ disciplinaActual.cuotaMensual?.toLocaleString('es-AR') ?? '0' }}</span>
          </div>
          <div class="stat-mini">
            <i class="pi pi-user text-gray-400"></i>
            <span class="text-gray-400 text-sm">Entrenadores:</span>
            <span style="color: var(--text-color)">{{ disciplinaActual.empleadoNombre || 'Sin asignar' }}</span>
          </div>
          <div class="stat-mini">
            <i class="pi pi-users text-blue-400"></i>
            <span class="text-gray-400 text-sm">Inscriptos:</span>
            <span class="text-blue-400 font-bold">{{ sociosInscritos.length }}</span>
          </div>
        </div>
        <p v-if="disciplinaActual.descripcion" class="text-gray-400 text-sm mb-4 p-3 border-round" style="background: rgba(255,255,255,0.05)">{{ disciplinaActual.descripcion }}</p>
        <TabView>
          <TabPanel header="Inscriptos">
            <div class="flex align-items-center justify-content-between mb-3 mt-2 flex-wrap gap-2">
              <span class="text-gray-400 text-sm">
                {{ sociosInscritosFiltrados.length }} de {{ sociosInscritos.length }} socios
              </span>
              <div class="flex gap-2 flex-wrap">
                <Button label="Categorías" icon="pi pi-tags" size="small" outlined @click="openCategorias" />
                <Button label="Inscribir Socio" icon="pi pi-user-plus" size="small" @click="openInscribir" />
              </div>
            </div>
            <div class="flex flex-wrap gap-2 mb-3">
              <Dropdown
                v-model="filtroInscriptosCategoria"
                :options="categoriasInscriptosFiltro"
                optionLabel="label"
                optionValue="value"
                placeholder="Todas las categorías"
                class="w-full md:w-14rem"
                showClear
              />
              <Dropdown
                v-model="filtroInscriptosCuotas"
                :options="opcionesFiltroCuotas"
                optionLabel="label"
                optionValue="value"
                placeholder="Cuotas sociales"
                class="w-full md:w-14rem"
              />
              <Button
                v-if="filtroInscriptosCategoria || filtroInscriptosCuotas !== 'todos'"
                label="Limpiar filtros"
                icon="pi pi-filter-slash"
                size="small"
                text
                severity="secondary"
                @click="limpiarFiltrosInscriptos"
              />
            </div>
            <div v-if="loadingSocios" class="text-center py-4">
              <i class="pi pi-spin pi-spinner text-2xl text-gray-400"></i>
            </div>
            <div v-else-if="sociosInscritosFiltrados.length === 0" class="text-center py-4">
              <i class="pi pi-users text-3xl text-gray-600 mb-2 block"></i>
              <p class="text-gray-500 text-sm">
                {{ sociosInscritos.length === 0 ? 'No hay socios inscriptos' : 'Ningún socio coincide con los filtros' }}
              </p>
            </div>
            <template v-else>
              <div class="mobile-card-list">
                <MobileRecordCard
                  v-for="data in paginatedInscriptos"
                  :key="data.id"
                  :title="data.nombre"
                  :subtitle="data.email"
                >
                  <template #leading>
                    <div class="socio-avatar"><span>{{ getInitials(data.nombre) }}</span></div>
                  </template>
                  <template #tags>
                    <Tag :severity="data.activo ? 'success' : 'danger'" :value="data.activo ? 'Activo' : 'Inactivo'" />
                    <Tag
                      v-if="data.tieneCuotasSocialesAdeudadas"
                      severity="danger"
                      :value="`${data.cantidadCuotasSocialesAdeudadas} adeud.`"
                    />
                    <Tag v-else severity="success" value="Al día" />
                  </template>
                  <template #body>
                    <div class="record-card__row">
                      <span class="record-card__label">N° Socio</span>
                      <span class="record-card__value">#{{ data.numeroSocio }}</span>
                    </div>
                    <div class="record-card__row">
                      <span class="record-card__label">Teléfono</span>
                      <span class="record-card__value">{{ data.telefono || '-' }}</span>
                    </div>
                    <div class="record-card__row">
                      <span class="record-card__label">Categoría</span>
                      <span class="record-card__value" style="min-width: 0; flex: 1">
                        <Dropdown
                          :modelValue="data.categoriaId"
                          @update:modelValue="v => cambiarCategoriaInscripto(data, v)"
                          :options="categoriasDisciplinaOpciones"
                          optionLabel="label"
                          optionValue="value"
                          placeholder="Sin categoría"
                          class="w-full categoria-dropdown-sm"
                          showClear
                          :loading="asignandoCategoriaId === data.id"
                          :disabled="categoriasDisciplina.length === 0"
                        />
                      </span>
                    </div>
                  </template>
                  <template #actions>
                    <Button
                      icon="pi pi-user-minus"
                      label="Desinscribir"
                      text
                      size="small"
                      severity="danger"
                      :loading="desinscribiendoId === data.id"
                      @click="desinscribirSocio(data)"
                    />
                  </template>
                </MobileRecordCard>
              </div>
              <MobilePaginator v-model:page="inscriptosPage" :rows="8" :total="sociosInscritosFiltrados.length" />
            </template>
          </TabPanel>
          <TabPanel header="Informacion">
            <div class="flex flex-column gap-0 pt-2">
              <div class="info-row"><span class="text-gray-400 text-sm w-8rem">Nombre:</span><span style="color: var(--text-color)">{{ disciplinaActual.nombre }}</span></div>
              <div class="info-row"><span class="text-gray-400 text-sm w-8rem">Descripcion:</span><span class="text-gray-300">{{ disciplinaActual.descripcion || '-' }}</span></div>
              <div class="info-row"><span class="text-gray-400 text-sm w-8rem">Cobro:</span>
                <Tag
                  :severity="disciplinaActual.tipoFacturacion === 'IncluidaEnCuotaSocial' ? 'info' : 'warning'"
                  :value="disciplinaActual.tipoFacturacion === 'IncluidaEnCuotaSocial' ? 'Incluida en cuota unificada' : 'Cobro aparte'"
                />
              </div>
              <div class="info-row" v-if="disciplinaActual.subcomisionNombre"><span class="text-gray-400 text-sm w-8rem">Subcomisión:</span><span style="color: var(--text-color)">{{ disciplinaActual.subcomisionNombre }}</span></div>
              <div class="info-row"><span class="text-gray-400 text-sm w-8rem">Cuota:</span><span class="text-green-400 font-bold">${{ disciplinaActual.cuotaMensual?.toLocaleString('es-AR') ?? '0' }}</span></div>
              <div class="info-row"><span class="text-gray-400 text-sm w-8rem">Entrenadores:</span><span style="color: var(--text-color)">{{ disciplinaActual.empleadoNombre || 'Sin asignar' }}</span></div>
              <div class="info-row"><span class="text-gray-400 text-sm w-8rem">Estado:</span><Tag :severity="disciplinaActual.activa ? 'success' : 'danger'" :value="disciplinaActual.activa ? 'Activa' : 'Inactiva'" /></div>
            </div>
            <div class="flex gap-2 mt-4 pt-3" style="border-top: 1px solid rgba(255,255,255,0.1)">
              <Button label="Contabilidad" icon="pi pi-chart-bar" size="small" @click="irContabilidad(disciplinaActual)" />
              <Button v-if="isMaster" label="Editar" icon="pi pi-pencil" size="small" severity="success" @click="editDisciplina(disciplinaActual); detalleVisible = false" />
              <Button v-if="isMaster" label="Eliminar" icon="pi pi-trash" size="small" severity="danger" outlined @click="confirmDelete(disciplinaActual); detalleVisible = false" />
            </div>
          </TabPanel>
        </TabView>
      </div>
    </Dialog>

    <!-- DIALOG INSCRIBIR SOCIO -->
    <Dialog v-model:visible="inscribirVisible" header="Inscribir Socio" :modal="true" :style="{ width: '440px' }" :breakpoints="{ '640px': '95vw' }">
      <div class="flex flex-column gap-4 pt-2">
        <div>
          <label class="block text-gray-300 font-medium mb-2">Socio *</label>
          <Dropdown
            v-model="socioAInscribir"
            :options="sociosDisponibles"
            optionLabel="nombreCompleto"
            optionValue="id"
            placeholder="Buscar socio..."
            class="w-full"
            filter
            filterPlaceholder="Nombre, apellido, DNI o N° de socio..."
            :filterFields="['nombreCompleto', 'nombre', 'apellido', 'dni', 'numeroSocio']"
            :loading="loadingTodosSocios"
            showClear
          >
            <template #option="{ option }">
              <div class="flex align-items-center gap-2">
                <div class="socio-avatar-sm">{{ getInitials(option.nombreApellido) }}</div>
                <div>
                  <div class="text-sm" style="color: var(--text-color)">{{ option.nombreApellido }}</div>
                  <div class="text-gray-500 text-xs">DNI {{ option.dni || '—' }} · #{{ option.numeroSocio }}</div>
                </div>
              </div>
            </template>
          </Dropdown>
        </div>
        <div v-if="categoriasDisciplina.length > 0">
          <label class="block text-gray-300 font-medium mb-2">Categoría</label>
          <Dropdown
            v-model="categoriaAlInscribir"
            :options="categoriasDisciplinaOpciones"
            optionLabel="label"
            optionValue="value"
            placeholder="Sin categoría (asignar después)"
            class="w-full"
            showClear
          />
        </div>
        <small v-if="inscribirError" class="p-error mt-1 block">{{ inscribirError }}</small>
      </div>
      <template #footer>
        <Button label="Cancelar" icon="pi pi-times" text class="text-gray-400" @click="inscribirVisible = false" />
        <Button label="Inscribir" icon="pi pi-user-plus" @click="confirmarInscripcion" :loading="inscribiendo" :disabled="!socioAInscribir" />
      </template>
    </Dialog>


    <!-- DIALOG CATEGORÍAS -->
    <Dialog v-model:visible="categoriasVisible" :header="`Categorías — ${disciplinaActual?.nombre || ''}`" :modal="true" :style="{ width: 'min(96vw, 520px)' }">
      <div class="flex flex-column gap-3 pt-1">
        <Message severity="info" :closable="false" class="m-0">
          Las categorías son exclusivas de <strong>{{ disciplinaActual?.nombre }}</strong>. No se comparten con otras disciplinas.
        </Message>
        <p class="text-gray-400 text-sm m-0">
          Definí Mini, Infantil, Juvenil, etc. y asignalas a los inscriptos de esta disciplina.
        </p>
        <div class="flex gap-2">
          <InputText v-model="nuevaCategoriaNombre" class="flex-1" placeholder="Nombre de categoría..." @keyup.enter="crearCategoria" />
          <Button label="Agregar" icon="pi pi-plus" @click="crearCategoria" :loading="guardandoCategoria" :disabled="!nuevaCategoriaNombre?.trim()" />
        </div>
        <div v-if="loadingCategorias" class="text-center py-3">
          <i class="pi pi-spin pi-spinner text-gray-400"></i>
        </div>
        <div v-else-if="categoriasDisciplina.length === 0" class="text-center py-4 text-gray-500 text-sm">
          No hay categorías. Creá la primera arriba.
        </div>
        <ul v-else class="categorias-list m-0 p-0 list-none">
          <li v-for="cat in categoriasDisciplina" :key="cat.id" class="categoria-item">
            <template v-if="editandoCategoriaId === cat.id">
              <InputText v-model="editandoCategoriaNombre" class="flex-1" @keyup.enter="guardarEdicionCategoria(cat.id)" />
              <Button icon="pi pi-check" text severity="success" @click="guardarEdicionCategoria(cat.id)" :loading="guardandoCategoria" />
              <Button icon="pi pi-times" text class="text-gray-400" @click="cancelarEdicionCategoria" />
            </template>
            <template v-else>
              <div class="flex-1">
                <span class="font-medium" style="color: var(--text-color)">{{ cat.nombre }}</span>
                <span class="text-gray-500 text-xs ml-2">{{ cat.cantidadInscriptos }} inscripto(s)</span>
              </div>
              <Button icon="pi pi-pencil" text rounded size="small" @click="iniciarEdicionCategoria(cat)" />
              <Button icon="pi pi-trash" text rounded size="small" severity="danger" @click="eliminarCategoria(cat)" :loading="eliminandoCategoriaId === cat.id" />
            </template>
          </li>
        </ul>
        <Message v-if="categoriasError" severity="error" :closable="false">{{ categoriasError }}</Message>
      </div>
      <template #footer>
        <Button label="Cerrar" icon="pi pi-times" text class="text-gray-400" @click="categoriasVisible = false" />
      </template>
    </Dialog>

    <!-- DIALOG NUEVA SUBCOMISION -->
    <Dialog v-model:visible="subcomisionDialogVisible" header="Nueva Subcomisión" :modal="true" :style="{ width: '420px' }">
      <div class="flex flex-column gap-3 pt-2">
        <div class="field">
          <label class="block text-gray-300 font-medium mb-2">Nombre *</label>
          <InputText v-model="subcomisionForm.nombre" class="w-full" placeholder="Ej: Subcomisión de Fútbol" />
        </div>
        <div class="field">
          <label class="block text-gray-300 font-medium mb-2">Descripción</label>
          <Textarea v-model="subcomisionForm.descripcion" rows="2" class="w-full" autoResize />
        </div>
        <Message v-if="subcomisionError" severity="error" :closable="false">{{ subcomisionError }}</Message>
      </div>
      <template #footer>
        <Button label="Cancelar" text class="text-gray-400" @click="subcomisionDialogVisible = false" />
        <Button label="Crear" icon="pi pi-check" @click="saveSubcomision" :loading="savingSubcomision" />
      </template>
    </Dialog>

  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useToast } from 'primevue/usetoast'
import { useConfirm } from 'primevue/useconfirm'
import { useAuthStore } from '@/stores/auth'
import { disciplinasService, empleadosService, sociosService, subcomisionesService } from '@/services'
import { useMobilePagination } from '@/composables/useMobilePagination'
import PageHeader from '@/components/mobile/PageHeader.vue'
import MobileRecordCard from '@/components/mobile/MobileRecordCard.vue'
import MobilePaginator from '@/components/mobile/MobilePaginator.vue'
import Button from 'primevue/button'
import Dialog from 'primevue/dialog'
import InputText from 'primevue/inputtext'
import InputNumber from 'primevue/inputnumber'
import InputSwitch from 'primevue/inputswitch'
import Textarea from 'primevue/textarea'
import Dropdown from 'primevue/dropdown'
import MultiSelect from 'primevue/multiselect'
import Tag from 'primevue/tag'
import Message from 'primevue/message'
import TabView from 'primevue/tabview'
import TabPanel from 'primevue/tabpanel'
import ProgressSpinner from 'primevue/progressspinner'

const toast = useToast()
const confirm = useConfirm()
const authStore = useAuthStore()
const router = useRouter()

const isScopedSubcomision = computed(() => !!authStore.user?.subcomisionId)

const isMaster = computed(() => authStore.user?.rol === 'master')

const disciplinasForzadas = computed(() => {
  if (isMaster.value) return null
  const user = authStore.user
  return disciplinas.value.filter(d =>
    d.adminsAsignados?.some(a => a.adminId === user?.id)
  )
})

const disciplinas = ref([])
const subcomisiones = ref([])
const empleados = ref([])
const loading = ref(false)
const loadingEmpleados = ref(false)
const loadingSubcomisiones = ref(false)

const subcomisionDialogVisible = ref(false)
const subcomisionForm = ref({ nombre: '', descripcion: '' })
const subcomisionError = ref(null)
const savingSubcomision = ref(false)

const busqueda = ref('')
const filtroEstado = ref(null)

const estadoOptions = [
  { label: 'Activas', value: true },
  { label: 'Inactivas', value: false }
]

const dialogVisible = ref(false)
const isEditing = ref(false)
const saving = ref(false)
const saveError = ref(null)
const form = ref({})
const formErrors = ref({})

const detalleVisible = ref(false)
const disciplinaActual = ref(null)
const sociosInscritos = ref([])
const loadingSocios = ref(false)

const inscribirVisible = ref(false)
const todosSocios = ref([])
const loadingTodosSocios = ref(false)
const socioAInscribir = ref(null)
const inscribiendo = ref(false)
const inscribirError = ref(null)
const desinscribiendoId = ref(null)
const asignandoCategoriaId = ref(null)

const categoriasDisciplina = ref([])
const loadingCategorias = ref(false)
const categoriasVisible = ref(false)
const nuevaCategoriaNombre = ref('')
const guardandoCategoria = ref(false)
const categoriasError = ref(null)
const editandoCategoriaId = ref(null)
const editandoCategoriaNombre = ref('')
const eliminandoCategoriaId = ref(null)
const categoriaAlInscribir = ref(null)

const filtroInscriptosCategoria = ref(null)
const filtroInscriptosCuotas = ref('todos')

const opcionesFiltroCuotas = [
  { label: 'Todas las cuotas', value: 'todos' },
  { label: 'Con cuotas sociales adeudadas', value: 'adeuda' },
  { label: 'Cuota social al día', value: 'aldia' }
]

const categoriasDisciplinaOpciones = computed(() =>
  categoriasDisciplina.value.map(c => ({ label: c.nombre, value: c.id }))
)

const categoriasInscriptosFiltro = computed(() => [
  { label: 'Sin categoría', value: '__sin__' },
  ...categoriasDisciplina.value.map(c => ({ label: c.nombre, value: c.id }))
])

const sociosInscritosFiltrados = computed(() => {
  return sociosInscritos.value.filter(s => {
    if (filtroInscriptosCategoria.value) {
      if (filtroInscriptosCategoria.value === '__sin__') {
        if (s.categoriaId) return false
      } else if (s.categoriaId !== filtroInscriptosCategoria.value) {
        return false
      }
    }
    if (filtroInscriptosCuotas.value === 'adeuda' && !s.tieneCuotasSocialesAdeudadas)
      return false
    if (filtroInscriptosCuotas.value === 'aldia' && s.tieneCuotasSocialesAdeudadas)
      return false
    return true
  })
})

const stats = computed(() => {
  const base = disciplinasForzadas.value !== null ? disciplinasForzadas.value : disciplinas.value
  const total = base.length
  const activas = base.filter(d => d.activa).length
  const inactivas = total - activas
  const inscriptos = base.reduce((acc, d) => acc + (d.cantidadSocios ?? 0), 0)
  return { total, activas, inactivas, inscriptos }
})

const disciplinasFiltradas = computed(() => {
  const base = disciplinasForzadas.value !== null ? disciplinasForzadas.value : disciplinas.value
  return base.filter(d => {
    const busq = busqueda.value.toLowerCase()
    const matchBusq = !busq || d.nombre?.toLowerCase().includes(busq) || d.descripcion?.toLowerCase().includes(busq) || d.empleadoNombre?.toLowerCase().includes(busq)
    const matchEstado = filtroEstado.value === null || filtroEstado.value === undefined ? true : d.activa === filtroEstado.value
    return matchBusq && matchEstado
  })
})

const { page: disciplinasPage, paginated: paginatedDisciplinas } = useMobilePagination(
  disciplinasFiltradas,
  10,
  [busqueda, filtroEstado]
)

const { page: inscriptosPage, paginated: paginatedInscriptos } = useMobilePagination(
  sociosInscritosFiltrados,
  8,
  [filtroInscriptosCategoria, filtroInscriptosCuotas]
)

const sociosDisponibles = computed(() => {
  const yaInscritos = new Set(sociosInscritos.value.map(s => s.id))
  return todosSocios.value
    .filter(s => s.activo && !yaInscritos.has(s.id))
    .map(s => {
      const nombreApellido = `${s.nombre || ''} ${s.apellido || ''}`.trim()
      const dni = s.dni?.trim() || ''
      return {
        ...s,
        nombreApellido,
        nombreCompleto: dni ? `${nombreApellido} — DNI ${dni}` : nombreApellido
      }
    })
})

const COLORES = ['#6366f1','#8b5cf6','#ec4899','#f59e0b','#10b981','#3b82f6','#ef4444','#14b8a6']

function getColor(nombre = '') {
  return COLORES[nombre.charCodeAt(0) % COLORES.length]
}

function getInitials(nombre = '') {
  return nombre.split(' ').slice(0, 2).map(w => w[0]?.toUpperCase() ?? '').join('')
}

async function loadSubcomisiones() {
  loadingSubcomisiones.value = true
  try {
    subcomisiones.value = await subcomisionesService.getAll(true)
  } catch {
    subcomisiones.value = []
  } finally {
    loadingSubcomisiones.value = false
  }
}

async function loadAll() {
  loading.value = true
  loadingEmpleados.value = true
  try {
    const [disciplinasData, empleadosData] = await Promise.all([
      disciplinasService.getAll(),
      empleadosService.getAll()
    ])
    await loadSubcomisiones()
    disciplinas.value = disciplinasData
    empleados.value = empleadosData.map(e => ({ ...e, nombreCompleto: `${e.nombre} ${e.apellido}` }))
  } catch {
    toast.add({ severity: 'error', summary: 'Error', detail: 'No se pudieron cargar las disciplinas', life: 3000 })
  } finally {
    loading.value = false
    loadingEmpleados.value = false
  }
}

function limpiarFiltrosInscriptos() {
  filtroInscriptosCategoria.value = null
  filtroInscriptosCuotas.value = 'todos'
}

async function loadCategoriasDisciplina(disciplinaId) {
  loadingCategorias.value = true
  try {
    categoriasDisciplina.value = await disciplinasService.getCategorias(disciplinaId)
  } catch {
    categoriasDisciplina.value = []
  } finally {
    loadingCategorias.value = false
  }
}

async function loadSociosInscritos(disciplinaId) {
  loadingSocios.value = true
  sociosInscritos.value = []
  try {
    const [inscriptos] = await Promise.all([
      disciplinasService.getSocios(disciplinaId),
      loadCategoriasDisciplina(disciplinaId)
    ])
    sociosInscritos.value = inscriptos
  } catch {
    toast.add({ severity: 'error', summary: 'Error', detail: 'No se pudieron cargar los inscriptos', life: 3000 })
  } finally {
    loadingSocios.value = false
  }
}

async function loadTodosSocios(force = false) {
  if (!force && todosSocios.value.length > 0) return
  loadingTodosSocios.value = true
  try {
    todosSocios.value = await sociosService.getAll()
  } catch {
    todosSocios.value = []
  } finally {
    loadingTodosSocios.value = false
  }
}

function limpiarFiltros() {
  busqueda.value = ''
  filtroEstado.value = null
}

function openNew() {
  form.value = {
    cuotaMensual: 0,
    activa: true,
    diaCobro: null,
    empleadoIds: [],
    cobrarConCuotaMensual: false,
    subcomisionId: isScopedSubcomision.value ? authStore.user?.subcomisionId : null
  }
  formErrors.value = {}
  saveError.value = null
  isEditing.value = false
  dialogVisible.value = true
}

function editDisciplina(data) {
  form.value = {
    id: data.id,
    nombre: data.nombre,
    descripcion: data.descripcion || '',
    cuotaMensual: data.cuotaMensual ?? 0,
    diaCobro: data.diaCobro ?? null,
    empleadoIds: data.empleadoIds?.length ? [...data.empleadoIds] : (data.empleadoId ? [data.empleadoId] : []),
    activa: data.activa,
    cobrarConCuotaMensual: data.tipoFacturacion === 'IncluidaEnCuotaSocial',
    subcomisionId: data.subcomisionId ?? null
  }
  formErrors.value = {}
  saveError.value = null
  isEditing.value = true
  dialogVisible.value = true
}

function resetForm() {
  form.value = {}
  formErrors.value = {}
  saveError.value = null
}

function validateForm() {
  const errors = {}
  if (!form.value.nombre?.trim()) errors.nombre = 'El nombre es requerido'
  if (form.value.cuotaMensual === null || form.value.cuotaMensual === undefined || form.value.cuotaMensual < 0)
    errors.cuotaMensual = 'Ingresa un monto valido'
  formErrors.value = errors
  return Object.keys(errors).length === 0
}

function openNuevaSubcomision() {
  subcomisionForm.value = { nombre: '', descripcion: '' }
  subcomisionError.value = null
  subcomisionDialogVisible.value = true
}

async function saveSubcomision() {
  if (!subcomisionForm.value.nombre?.trim()) {
    subcomisionError.value = 'El nombre es requerido'
    return
  }
  savingSubcomision.value = true
  subcomisionError.value = null
  try {
    const created = await subcomisionesService.create({
      nombre: subcomisionForm.value.nombre.trim(),
      descripcion: subcomisionForm.value.descripcion?.trim() || null
    })
    await loadSubcomisiones()
    form.value.subcomisionId = created.id
    subcomisionDialogVisible.value = false
    toast.add({ severity: 'success', summary: 'Subcomisión creada', life: 3000 })
  } catch (error) {
    subcomisionError.value = error.response?.data?.message || 'No se pudo crear la subcomisión'
  } finally {
    savingSubcomision.value = false
  }
}

async function saveDisciplina() {
  if (!validateForm()) return
  saving.value = true
  saveError.value = null
  try {
    const tipoFacturacion = form.value.cobrarConCuotaMensual ? 'IncluidaEnCuotaSocial' : 'PagoApartado'
    const subcomisionId = isScopedSubcomision.value
      ? authStore.user?.subcomisionId
      : (form.value.subcomisionId || null)
    const payload = {
      nombre: form.value.nombre.trim(),
      descripcion: form.value.descripcion?.trim() || null,
      cuotaMensual: form.value.cuotaMensual ?? 0,
      diaCobro: form.value.diaCobro || null,
      empleadoIds: form.value.empleadoIds?.length ? form.value.empleadoIds : null,
      tipoFacturacion,
      subcomisionId,
      ...(isEditing.value ? { activa: form.value.activa } : {})
    }
    if (isEditing.value) {
      await disciplinasService.update(form.value.id, payload)
      toast.add({ severity: 'success', summary: 'Exito', detail: 'Disciplina actualizada', life: 3000 })
    } else {
      await disciplinasService.create(payload)
      toast.add({ severity: 'success', summary: 'Exito', detail: 'Disciplina creada', life: 3000 })
    }
    dialogVisible.value = false
    await loadAll()
  } catch (error) {
    saveError.value = error.response?.data?.message || 'Error al guardar la disciplina'
  } finally {
    saving.value = false
  }
}

function confirmDelete(data) {
  confirm.require({
    message: `Eliminar la disciplina "${data.nombre}"? Esta accion no se puede deshacer.`,
    header: 'Confirmar eliminacion',
    icon: 'pi pi-exclamation-triangle',
    acceptClass: 'p-button-danger',
    acceptLabel: 'Si, eliminar',
    rejectLabel: 'Cancelar',
    accept: async () => {
      try {
        await disciplinasService.delete(data.id)
        toast.add({ severity: 'success', summary: 'Eliminada', detail: `"${data.nombre}" fue eliminada`, life: 3000 })
        await loadAll()
      } catch {
        toast.add({ severity: 'error', summary: 'Error', detail: 'No se pudo eliminar la disciplina', life: 3000 })
      }
    }
  })
}

async function openDetalle(disc) {
  disciplinaActual.value = disc
  limpiarFiltrosInscriptos()
  categoriasDisciplina.value = []
  sociosInscritos.value = []
  detalleVisible.value = true
  await loadSociosInscritos(disc.id)
}

function irContabilidad(disc) {
  detalleVisible.value = false
  router.push({ path: '/admin/contabilidad-disciplinas', query: { disciplinaId: disc.id } })
}

function onDetalleHide() {
  disciplinaActual.value = null
  categoriasDisciplina.value = []
  sociosInscritos.value = []
  filtroInscriptosCategoria.value = null
  categoriasVisible.value = false
}


function openCategorias() {
  if (!disciplinaActual.value?.id) {
    toast.add({ severity: 'warn', summary: 'Disciplina', detail: 'Abrí una disciplina antes de gestionar categorías', life: 3000 })
    return
  }
  categoriasError.value = null
  nuevaCategoriaNombre.value = ''
  cancelarEdicionCategoria()
  categoriasVisible.value = true
}

async function crearCategoria() {
  const nombre = nuevaCategoriaNombre.value?.trim()
  const disciplinaId = disciplinaActual.value?.id
  if (!nombre || !disciplinaId) {
    categoriasError.value = 'Seleccioná una disciplina antes de crear categorías'
    return
  }
  guardandoCategoria.value = true
  categoriasError.value = null
  try {
    await disciplinasService.createCategoria(disciplinaId, { nombre })
    nuevaCategoriaNombre.value = ''
    await loadCategoriasDisciplina(disciplinaActual.value.id)
    toast.add({ severity: 'success', summary: 'Categoría creada', life: 2500 })
  } catch (error) {
    categoriasError.value = error.response?.data?.message || 'No se pudo crear la categoría'
  } finally {
    guardandoCategoria.value = false
  }
}

function iniciarEdicionCategoria(cat) {
  editandoCategoriaId.value = cat.id
  editandoCategoriaNombre.value = cat.nombre
}

function cancelarEdicionCategoria() {
  editandoCategoriaId.value = null
  editandoCategoriaNombre.value = ''
}

async function guardarEdicionCategoria(categoriaId) {
  const nombre = editandoCategoriaNombre.value?.trim()
  if (!nombre || !disciplinaActual.value) return
  guardandoCategoria.value = true
  categoriasError.value = null
  try {
    await disciplinasService.updateCategoria(disciplinaActual.value.id, categoriaId, { nombre })
    cancelarEdicionCategoria()
    await Promise.all([
      loadCategoriasDisciplina(disciplinaActual.value.id),
      loadSociosInscritos(disciplinaActual.value.id)
    ])
    toast.add({ severity: 'success', summary: 'Categoría actualizada', life: 2500 })
  } catch (error) {
    categoriasError.value = error.response?.data?.message || 'No se pudo actualizar'
  } finally {
    guardandoCategoria.value = false
  }
}

function eliminarCategoria(cat) {
  confirm.require({
    message: `¿Eliminar la categoría "${cat.nombre}"? Los inscriptos quedarán sin categoría.`,
    header: 'Confirmar',
    icon: 'pi pi-exclamation-triangle',
    acceptClass: 'p-button-danger',
    acceptLabel: 'Eliminar',
    rejectLabel: 'Cancelar',
    accept: async () => {
      eliminandoCategoriaId.value = cat.id
      categoriasError.value = null
      try {
        await disciplinasService.deleteCategoria(disciplinaActual.value.id, cat.id)
        await Promise.all([
          loadCategoriasDisciplina(disciplinaActual.value.id),
          loadSociosInscritos(disciplinaActual.value.id)
        ])
        toast.add({ severity: 'success', summary: 'Categoría eliminada', life: 2500 })
      } catch (error) {
        categoriasError.value = error.response?.data?.message || 'No se pudo eliminar'
      } finally {
        eliminandoCategoriaId.value = null
      }
    }
  })
}

async function cambiarCategoriaInscripto(socio, categoriaId) {
  if (!disciplinaActual.value) return
  asignandoCategoriaId.value = socio.id
  try {
    await disciplinasService.asignarCategoria(disciplinaActual.value.id, socio.id, categoriaId || null)
    const cat = categoriasDisciplina.value.find(c => c.id === categoriaId)
    socio.categoriaId = categoriaId || null
    socio.categoriaNombre = cat?.nombre || null
    await loadCategoriasDisciplina(disciplinaActual.value.id)
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: error.response?.data?.message || 'No se pudo asignar la categoría',
      life: 3000
    })
  } finally {
    asignandoCategoriaId.value = null
  }
}

async function openInscriptos(disc) {
  await openDetalle(disc)
}

async function openInscribir() {
  socioAInscribir.value = null
  categoriaAlInscribir.value = null
  inscribirError.value = null
  await loadTodosSocios()
  inscribirVisible.value = true
}

async function confirmarInscripcion() {
  if (!socioAInscribir.value) {
    inscribirError.value = 'Selecciona un socio'
    return
  }
  inscribiendo.value = true
  inscribirError.value = null
  try {
    await disciplinasService.inscribirSocio(disciplinaActual.value.id, socioAInscribir.value, {
      categoriaId: categoriaAlInscribir.value || null
    })
    toast.add({ severity: 'success', summary: 'Inscripto', detail: 'Socio inscripto correctamente', life: 3000 })
    inscribirVisible.value = false
    await loadSociosInscritos(disciplinaActual.value.id)
    const disc = disciplinas.value.find(d => d.id === disciplinaActual.value.id)
    if (disc) disc.cantidadSocios = (disc.cantidadSocios ?? 0) + 1
  } catch (error) {
    inscribirError.value = error.response?.data?.message || 'No se pudo inscribir al socio'
  } finally {
    inscribiendo.value = false
  }
}

function desinscribirSocio(socio) {
  confirm.require({
    message: `Desinscribir a ${socio.nombre} de esta disciplina?`,
    header: 'Confirmar baja',
    icon: 'pi pi-exclamation-triangle',
    acceptClass: 'p-button-danger',
    acceptLabel: 'Si, dar de baja',
    rejectLabel: 'Cancelar',
    accept: async () => {
      desinscribiendoId.value = socio.id
      try {
        await disciplinasService.desinscribirSocio(disciplinaActual.value.id, socio.id)
        toast.add({ severity: 'success', summary: 'Baja registrada', detail: `${socio.nombre} fue desinscripto`, life: 3000 })
        await loadSociosInscritos(disciplinaActual.value.id)
        const disc = disciplinas.value.find(d => d.id === disciplinaActual.value.id)
        if (disc && disc.cantidadSocios > 0) disc.cantidadSocios--
      } catch {
        toast.add({ severity: 'error', summary: 'Error', detail: 'No se pudo dar de baja al socio', life: 3000 })
      } finally {
        desinscribiendoId.value = null
      }
    }
  })
}

onMounted(() => { loadAll() })
</script>

<style scoped>
.stat-card {
  background: rgba(255,255,255,0.05);
  border: 1px solid rgba(255,255,255,0.1);
  border-radius: 12px;
  padding: 1.25rem 1.5rem;
  transition: border-color 0.2s;
}
.stat-card:hover { border-color: rgba(255,255,255,0.2); }
.stat-icon {
  width: 48px; height: 48px; border-radius: 12px;
  display: flex; align-items: center; justify-content: center; flex-shrink: 0;
}
.stat-icon.total      { background: rgba(139,92,246,0.2); color: #8b5cf6; }
.stat-icon.activas    { background: rgba(16,185,129,0.2); color: #10b981; }
.stat-icon.inactivas  { background: rgba(239,68,68,0.2);  color: #ef4444; }
.stat-icon.inscriptos { background: rgba(59,130,246,0.2); color: #3b82f6; }

.disciplina-card {
  background: var(--surface-card);
  border: 1px solid var(--surface-border);
  border-radius: 12px; overflow: hidden; cursor: pointer;
  transition: all 0.2s ease; height: 100%;
  display: flex; flex-direction: column;
}
.disciplina-card:hover {
  border-color: rgba(99,102,241,0.5);
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(0,0,0,0.15);
}
.disciplina-card.inactiva { opacity: 0.65; }
.disciplina-card.inactiva:hover { border-color: rgba(239,68,68,0.4); }
.disc-card-header { padding: 1.25rem 1.25rem 1rem; border-bottom: 1px solid var(--surface-border); }
.disc-card-body { padding: 1rem 1.25rem; flex: 1; }
.disc-card-footer {
  padding: 0.5rem 1rem; border-top: 1px solid var(--surface-border);
  display: flex; align-items: center; gap: 0.25rem;
  background: var(--surface-ground);
}
.disc-desc {
  overflow: hidden; display: -webkit-box;
  -webkit-line-clamp: 2; -webkit-box-orient: vertical; line-height: 1.5;
}

.disc-avatar {
  width: 46px; height: 46px; border-radius: 12px;
  display: flex; align-items: center; justify-content: center; flex-shrink: 0;
}
.disc-avatar-sm {
  width: 32px; height: 32px; border-radius: 8px;
  display: flex; align-items: center; justify-content: center; flex-shrink: 0;
}
.socio-avatar {
  width: 30px; height: 30px; border-radius: 50%;
  background: rgba(59,130,246,0.2);
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0; font-size: 0.7rem; font-weight: 700; color: #3b82f6;
}
.socio-avatar-sm {
  width: 28px; height: 28px; border-radius: 50%;
  background: rgba(59,130,246,0.2);
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0; font-size: 0.65rem; font-weight: 700; color: #3b82f6;
}

.stat-mini {
  display: flex; align-items: center; gap: 0.5rem;
  padding: 0.5rem 0.75rem;
  background: var(--surface-hover);
  border-radius: 8px; border: 1px solid var(--surface-border);
}
.info-row {
  display: flex; align-items: flex-start; gap: 1rem;
  padding: 0.6rem 0; border-bottom: 1px solid var(--surface-border);
}
.info-row:last-child { border-bottom: none; }

:deep(.disciplina-detalle-dialog) {
  overflow-x: hidden;
}
:deep(.categoria-dropdown-sm .p-dropdown) {
  min-height: 2rem;
  font-size: 0.85rem;
}
.categorias-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}
.categoria-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem;
  border-radius: 8px;
  background: var(--surface-hover);
}
:deep(.inscriptos-table .p-datatable-wrapper) {
  overflow-x: hidden !important;
}
</style>
