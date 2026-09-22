<template>  <div>
    <div class="flex align-items-center justify-content-between mb-4 flex-wrap gap-2">
      <h1 class="text-3xl font-bold m-0" style="color: var(--text-color)">Socios</h1>
      <div class="flex gap-2">
        <Button label="Carga Masiva" icon="pi pi-file-excel" severity="secondary" @click="abrirCargaMasiva" />
        <Button label="Nuevo Socio" icon="pi pi-plus" @click="openNew" />
      </div>
    </div>

    <!-- Stat cards -->
    <div class="grid mb-4">
      <div class="col-6 md:col-3">
        <div class="stat-card stat-total">
          <div class="stat-icon"><i class="pi pi-users"></i></div>
          <div class="stat-content">
            <span class="stat-value">{{ socios.length }}</span>
            <span class="stat-label">Total Socios</span>
          </div>
        </div>
      </div>
      <div class="col-6 md:col-3">
        <div class="stat-card stat-success">
          <div class="stat-icon"><i class="pi pi-check-circle"></i></div>
          <div class="stat-content">
            <span class="stat-value">{{ sociosActivos }}</span>
            <span class="stat-label">Activos</span>
          </div>
        </div>
      </div>
      <div class="col-6 md:col-3">
        <div class="stat-card stat-warning">
          <div class="stat-icon"><i class="pi pi-ban"></i></div>
          <div class="stat-content">
            <span class="stat-value">{{ sociosInactivos }}</span>
            <span class="stat-label">Inactivos</span>
            <Button v-if="sociosInactivos > 0" label="Ver" size="small" text @click="filtroEstado = 'inactivos'" />
          </div>
        </div>
      </div>
      <div class="col-6 md:col-3">
        <div class="stat-card stat-mutual">
          <div class="stat-icon"><i class="pi pi-building"></i></div>
          <div class="stat-content">
            <span class="stat-value">{{ socios.filter(s => s.pagaPorMutual).length }}</span>
            <span class="stat-label">Cobro Mutual</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Filtros -->
    <div class="card mb-4">
      <div class="flex flex-wrap align-items-center gap-3">
        <span class="p-input-icon-left flex-1" style="min-width: 200px">
          <i class="pi pi-search" />
          <InputText v-model="filters['global'].value" placeholder="Buscar por nombre, email o número..." class="w-full" />
        </span>
        <div class="flex gap-2 flex-wrap">
          <Button :label="`Todos (${socios.length})`" :outlined="filtroEstado !== 'todos'" size="small" @click="filtroEstado = 'todos'" />
          <Button :label="`Inactivos (${sociosInactivos})`" :outlined="filtroEstado !== 'inactivos'" :severity="sociosInactivos > 0 ? 'warning' : undefined" size="small" @click="filtroEstado = 'inactivos'" />
          <Button :label="`Activos (${sociosActivos})`" :outlined="filtroEstado !== 'activos'" severity="success" size="small" @click="filtroEstado = 'activos'" />
        </div>
      </div>
    </div>

    <!-- Listado -->
    <div class="card">
      <div class="flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
        <h3 class="m-0">Listado de Socios</h3>
        <Button :icon="vistaGrid ? 'pi pi-table' : 'pi pi-th-large'" text rounded size="small"
          v-tooltip.top="vistaGrid ? 'Vista tabla' : 'Vista cards'"
          @click="vistaGrid = !vistaGrid" />
      </div>

      <!-- Vista cards -->
      <div v-if="vistaGrid">
        <div v-if="sociosParaMostrar.length === 0" class="text-center py-6">
          <i class="pi pi-users text-5xl text-gray-600 mb-3 block"></i>
          <p class="text-gray-400 text-lg">No se encontraron socios</p>
          <Button label="Nuevo Socio" icon="pi pi-plus" class="mt-2" @click="openNew" />
        </div>
        <div v-else class="grid">
          <div v-for="s in sociosParaMostrar" :key="s.id" class="col-12 sm:col-6 md:col-4 lg:col-3">
            <div class="socio-card" :class="{ 'socio-card--inactivo': !s.activo }">
              <div class="socio-card__header">
                <div class="socio-avatar-lg" :style="{ background: getSocioColor(s.nombre) }">
                  <span>{{ getSocioInitials(s.nombre, s.apellido) }}</span>
                </div>
                <div class="flex-1 min-w-0">
                  <div class="font-bold text-base truncate" style="color: var(--text-color)">{{ s.nombre }} {{ s.apellido }}</div>
                  <div class="text-gray-400 text-xs truncate">{{ s.email }}</div>
                  <div class="text-gray-500 text-xs">#{{ s.numeroSocio }}</div>
                </div>
                <Tag :severity="s.activo ? 'success' : 'danger'" :value="s.activo ? 'Activo' : 'Inactivo'" class="flex-shrink-0" />
              </div>
              <div class="socio-card__body">
                <div class="flex justify-content-between align-items-center mb-2">
                  <div class="flex gap-1">
                    <Tag v-if="s.tipoSocio === 'Adherente'" value="Adherente" severity="info" class="text-xs"
                         v-tooltip.top="s.titularNombreCompleto ? `Adherente de: ${s.titularNombreCompleto}` : 'Adherente'" />
                    <Tag v-else :value="s.cantidadAdherentes > 0 ? `Titular (${s.cantidadAdherentes})` : 'Titular'" severity="success" class="text-xs"
                         v-tooltip.top="s.cantidadAdherentes > 0 ? `Titular con ${s.cantidadAdherentes} adherente(s)` : 'Titular'" />
                    <Tag v-if="s.planNombre" :value="s.planNombre" severity="secondary" class="text-xs" />
                  </div>
                  <span class="text-green-400 font-bold text-sm">${{ s.cuotaSocio?.toLocaleString() }}</span>
                </div>
                <div v-if="s.disciplinasActivas && s.disciplinasActivas.length > 0" class="flex flex-wrap gap-1">
                  <Tag v-for="d in s.disciplinasActivas" :key="d" :value="d" severity="secondary" style="font-size:0.65rem" />
                </div>
                <div v-else class="text-gray-600 text-xs">Sin disciplinas</div>
              </div>
              <div class="socio-card__footer">
                <Button v-if="!s.activo" icon="pi pi-check-circle" text rounded size="small" severity="success" v-tooltip.top="'Activar'" @click="aprobarSocio(s)" />
                <Button icon="pi pi-eye" text rounded size="small" class="text-gray-400" v-tooltip.top="'Ver detalle'" @click="viewSocio(s)" />
                <Button icon="pi pi-pencil" text rounded size="small" severity="info" v-tooltip.top="'Editar'" @click="editSocio(s)" />
                <Button v-if="s.activo" icon="pi pi-ban" text rounded size="small" severity="danger" v-tooltip.top="'Desactivar'" @click="confirmDesactivar(s)" />
                <Button icon="pi pi-key" text rounded size="small" severity="warning" v-tooltip.top="'Resetear contraseña'" @click="openResetPassword(s)" />
                <Button icon="pi pi-whatsapp" text rounded size="small" severity="success" v-tooltip.top="'WhatsApp'" @click="openWaDialog(s)" />
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Vista tabla -->
      <DataTable v-else
        :value="sociosFiltrados"
        :loading="loading"
        :paginator="true"
        :rows="10"
        :rowsPerPageOptions="[5, 10, 25]"
        dataKey="id"
        :globalFilterFields="['nombre', 'email', 'numeroSocio']"
        v-model:filters="filters"
        filterDisplay="menu"
        responsiveLayout="scroll"
      >
        <Column field="numeroSocio" header="# Socio" sortable style="min-width: 100px"></Column>
        <Column header="Nombre" sortable style="min-width: 180px">
          <template #body="slotProps">
            {{ slotProps.data.nombre }} {{ slotProps.data.apellido }}
          </template>
        </Column>
        <Column field="email" header="Email" sortable style="min-width: 200px"></Column>
        <Column field="telefono" header="Teléfono" style="min-width: 120px"></Column>
        <Column header="Tipo" sortable style="min-width: 80px">
          <template #body="slotProps">
            <Tag v-if="slotProps.data.tipoSocio === 'Adherente'" value="Adherente" severity="info"
              v-tooltip.top="slotProps.data.titularNombreCompleto ? `Adherente de: ${slotProps.data.titularNombreCompleto}` : 'Adherente'" />
            <Tag v-else :value="slotProps.data.cantidadAdherentes > 0 ? `Titular (${slotProps.data.cantidadAdherentes})` : 'Titular'" severity="success"
              v-tooltip.top="slotProps.data.cantidadAdherentes > 0 ? `Titular con ${slotProps.data.cantidadAdherentes} adherente(s)` : 'Titular'" />
            <Tag v-if="slotProps.data.pagaPorMutual" value="MUTUAL" severity="warning" class="ml-1"
              v-tooltip.top="'Cobra por mutual — cuota no se genera automáticamente'" />
          </template>
        </Column>
        <Column header="Plan" sortable style="min-width: 140px">
          <template #body="slotProps">
            <span v-if="slotProps.data.planNombre" class="text-sm">{{ slotProps.data.planNombre }}</span>
            <span v-else class="text-gray-500 text-sm">Sin plan</span>
          </template>
        </Column>
        <Column header="Disciplinas" style="min-width: 160px">
          <template #body="slotProps">
            <div v-if="slotProps.data.disciplinasActivas && slotProps.data.disciplinasActivas.length > 0" class="flex flex-wrap gap-1">
              <Tag v-for="d in slotProps.data.disciplinasActivas" :key="d" :value="d" severity="secondary" style="font-size: 0.7rem" />
            </div>
            <span v-else class="text-gray-500 text-sm">Sin disciplinas</span>
          </template>
        </Column>
        <Column header="Cuota" sortable style="min-width: 100px">
          <template #body="slotProps">
            ${{ slotProps.data.cuotaSocio?.toLocaleString() }}
          </template>
        </Column>
        <Column header="Estado" style="min-width: 120px">
          <template #body="slotProps">
            <Tag :severity="slotProps.data.activo ? 'success' : 'danger'"
              :value="slotProps.data.activo ? 'Activo' : 'Inactivo'"
              :icon="slotProps.data.activo ? 'pi pi-check' : 'pi pi-ban'" />
          </template>
        </Column>
        <Column header="Acciones" style="min-width: 200px">
          <template #body="slotProps">
            <Button v-if="!slotProps.data.activo" icon="pi pi-check-circle" text rounded class="mr-2" severity="success"
              @click="aprobarSocio(slotProps.data)" v-tooltip.top="'Activar socio'" />
            <Button icon="pi pi-eye" text rounded class="mr-2" @click="viewSocio(slotProps.data)" v-tooltip.top="'Ver detalle'" />
            <Button icon="pi pi-pencil" text rounded class="mr-2" severity="info" @click="editSocio(slotProps.data)" v-tooltip.top="'Editar'" />
            <Button v-if="slotProps.data.activo" icon="pi pi-ban" text rounded severity="danger" @click="confirmDesactivar(slotProps.data)" v-tooltip.top="'Desactivar'" />
            <Button icon="pi pi-key" text rounded severity="warning" @click="openResetPassword(slotProps.data)" v-tooltip.top="'Resetear Contraseña'" />
            <Button icon="pi pi-whatsapp" text rounded severity="success" @click="openWaDialog(slotProps.data)" v-tooltip.top="'Enviar WhatsApp'" />
          </template>
        </Column>
      </DataTable>
    </div>

    <!-- Dialog Carga Masiva -->
    <Dialog v-model:visible="cargaMasivaDialog" header="Carga Masiva de Socios" :modal="true" :style="{ width: '900px' }">
      <div class="flex flex-column gap-4">

        <!-- Paso 1: subir archivo -->
        <div v-if="cargaMasivaStep === 1">
          <p class="text-gray-400 text-sm mb-3">
            Subí una planilla Excel (.xlsx / .xls / .csv) con las siguientes columnas (el orden no importa, pero los nombres deben coincidir):
          </p>
          <div class="surface-ground border-round p-3 mb-3 text-sm font-mono text-gray-300" style="line-height:1.8">
            <strong>Obligatorias:</strong> Nombre · Apellido · Email · Telefono<br>
            <strong>Opcionales:</strong> Dni · Direccion · FechaNacimiento (dd/mm/aaaa)
          </div>
          <div
            class="flex flex-column align-items-center justify-content-center border-round p-6 cursor-pointer"
            style="border: 2px dashed var(--primary-color); background: rgba(99,102,241,0.05); min-height:140px"
            @click="$refs.fileInputMasivo.click()"
            @dragover.prevent
            @drop.prevent="onDropExcel"
          >
            <i class="pi pi-file-excel text-5xl text-green-400 mb-3"></i>
            <span class="text-gray-300">Hacé clic o arrastrá tu archivo aquí</span>
            <span class="text-gray-500 text-sm mt-1">.xlsx · .xls · .csv</span>
          </div>
          <input ref="fileInputMasivo" type="file" accept=".xlsx,.xls,.csv" class="hidden" @change="onFileExcel" />
        </div>

        <!-- Paso 2: preview y validación -->
        <div v-if="cargaMasivaStep === 2">
          <div class="flex align-items-center justify-content-between mb-3">
            <span class="text-gray-300 text-sm">
              <span class="text-green-400 font-bold">{{ cargaMasivaFilas.filter(r=>!r._error).length }}</span> válidos ·
              <span v-if="cargaMasivaFilas.some(r=>r._error)" class="text-red-400 font-bold">{{ cargaMasivaFilas.filter(r=>r._error).length }} con error</span>
            </span>
            <Button label="Descargar plantilla" icon="pi pi-download" text size="small" @click="descargarPlantilla" />
          </div>
          <DataTable :value="cargaMasivaFilas" :rows="10" :paginator="cargaMasivaFilas.length > 10" class="p-datatable-sm" scrollable scrollHeight="380px">
            <Column header="#" style="width:40px">
              <template #body="s">
                <i v-if="s.data._error" class="pi pi-exclamation-circle text-red-400" v-tooltip.top="s.data._error" />
                <i v-else class="pi pi-check-circle text-green-400" />
              </template>
            </Column>
            <Column header="Nombre">
              <template #body="slotProps">{{ slotProps.data.nombre }} {{ slotProps.data.apellido }}</template>
            </Column>
            <Column field="apellido" header="Apellido" />
            <Column field="email" header="Email" />
            <Column field="telefono" header="Teléfono" />
            <Column field="dni" header="DNI" />
            <Column header="">
              <template #body="s">
                <Button icon="pi pi-trash" text rounded size="small" severity="danger" @click="cargaMasivaFilas.splice(s.index,1)" />
              </template>
            </Column>
          </DataTable>
          <Message v-if="cargaMasivaFilas.some(r=>r._error)" severity="warn" :closable="false" class="mt-2">
            Las filas con error se omitirán. Podés eliminarlas o corregir el archivo y volver a subirlo.
          </Message>
        </div>

        <!-- Paso 3: progreso -->
        <div v-if="cargaMasivaStep === 3" class="flex flex-column align-items-center gap-3 py-4">
          <i v-if="cargaMasivaProgreso < cargaMasivaTotal" class="pi pi-spin pi-spinner text-4xl text-primary"></i>
          <i v-else class="pi pi-check-circle text-4xl text-green-400"></i>
          <span class="text-lg font-medium">{{ cargaMasivaProgreso }} / {{ cargaMasivaTotal }}</span>
          <div class="w-full border-round" style="height:8px;background:var(--surface-ground)">
            <div class="border-round" style="height:8px;background:var(--primary-color);transition:width .3s" :style="{width: cargaMasivaTotal ? (cargaMasivaProgreso/cargaMasivaTotal*100)+'%' : '0%'}"></div>
          </div>
          <div v-if="cargaMasivaErrores.length > 0" class="w-full mt-2">
            <p class="text-red-400 text-sm font-medium mb-1">Errores durante la importación:</p>
            <ul class="text-red-300 text-xs" style="max-height:120px;overflow:auto">
              <li v-for="e in cargaMasivaErrores" :key="e">{{ e }}</li>
            </ul>
          </div>
          <p v-if="cargaMasivaProgreso === cargaMasivaTotal" class="text-green-400">
            Importación completada. {{ cargaMasivaOk }} socios creados correctamente.
          </p>
        </div>
      </div>

      <template #footer>
        <Button label="Cancelar" icon="pi pi-times" text @click="cargaMasivaDialog = false" />
        <Button v-if="cargaMasivaStep === 1" label="Volver a subir" icon="pi pi-upload" outlined disabled />
        <Button
          v-if="cargaMasivaStep === 2"
          :label="`Importar ${cargaMasivaFilas.filter(r=>!r._error).length} socios`"
          icon="pi pi-check"
          severity="success"
          :disabled="!cargaMasivaFilas.some(r=>!r._error)"
          @click="ejecutarCargaMasiva"
        />
        <Button v-if="cargaMasivaStep === 3 && cargaMasivaProgreso === cargaMasivaTotal" label="Cerrar" icon="pi pi-times" @click="cargaMasivaDialog = false" />
      </template>
    </Dialog>

    <!-- Create/Edit Dialog -->
    <Dialog 
      v-model:visible="socioDialog" 
      :header="isEditing ? 'Editar Socio' : 'Nuevo Socio'" 
      :modal="true"
      :style="{ width: '500px' }"
    >      <div class="flex flex-column gap-4 pt-3">
        <Message v-if="saving" severity="info" :closable="false">
          <span class="flex align-items-center gap-2">
            <i class="pi pi-spin pi-spinner"></i>
            Guardando socio...
          </span>
        </Message>
        <Message v-if="saveError" severity="error" :closable="false">{{ saveError }}</Message>
        <Message v-if="hasFormErrors" severity="warn" :closable="false">
          Revisá los campos marcados antes de continuar.
        </Message>

        <!-- Plan de Membresía -->
        <div class="field">
          <label for="planMembresia" class="font-medium text-gray-300">
            Plan de Membresía {{ !isEditing ? '*' : '' }}
          </label>
          <Dropdown 
            id="planMembresia" 
            v-model="socio.planMembresiaId" 
            :options="planesMembresia"
            optionLabel="nombre"
            optionValue="id"
            placeholder="Seleccionar plan"
            class="w-full"
            :class="{ 'p-invalid': !!formErrors.planMembresiaId }"
            @change="onPlanChange"
          >
            <template #option="slotProps">
              <div class="flex justify-content-between align-items-center w-full">
                <span>{{ slotProps.option.nombre }}</span>
                <Tag :value="slotProps.option.tipoPlan" severity="info" class="text-xs" />
                <span class="text-red-400 font-bold">${{ slotProps.option.precioMensual.toLocaleString() }}</span>
              </div>
            </template>
          </Dropdown>          <small v-if="formErrors.planMembresiaId" class="p-error">{{ formErrors.planMembresiaId }}</small>          <small v-if="selectedPlan" class="text-gray-400 block mt-1">
            {{ selectedPlan.descripcion }} - ${{ selectedPlan.precioMensual.toLocaleString() }}/mes
          </small>
        </div>        <!-- Tipo de Socio -->
        <div class="field">
          <label class="font-medium text-gray-300">Tipo de Socio {{ !isEditing ? '*' : '' }}</label>
          <div class="flex gap-3 mt-2">
            <div class="flex align-items-center">
              <RadioButton 
                v-model="socio.tipoSocio" 
                inputId="titular" 
                value="Titular"
                :disabled="titularDisabled"
              />
              <label for="titular" class="ml-2">Titular</label>
            </div>
            <div class="flex align-items-center">
              <RadioButton
                v-model="socio.tipoSocio"
                inputId="adherente"
                value="Adherente"
                :disabled="adherenteDisabled"
              />
              <label for="adherente" class="ml-2" :class="{ 'text-gray-500': adherenteDisabled }">Adherente</label>
            </div>
          </div>
          <small v-show="adherenteDisabled" class="text-gray-400 block mt-2">
            <i class="pi pi-info-circle"></i> El plan individual no permite socios adherentes.
          </small>
        </div>

        <!-- Selección de Titular (solo si es Adherente) -->
        <div class="field" v-if="socio.tipoSocio === 'Adherente'">
          <label for="titular" class="font-medium text-gray-300">Socio Titular {{ !isEditing ? '*' : '' }}</label>
          <Dropdown 
            id="titular" 
            v-model="socio.titularId" 
            :options="sociosTitularesDisponibles"
            optionLabel="nombreCompleto"
            optionValue="id"
            placeholder="Seleccionar titular"
            class="w-full"
            :class="{ 'p-invalid': !!formErrors.titularId }"
            :filter="true"
          >
            <template #option="slotProps">
              <div>
                <div>{{ slotProps.option.nombreCompleto }}</div>
                <small class="text-gray-400">{{ slotProps.option.numeroSocio }} - {{ slotProps.option.planNombre }}</small>
              </div>
            </template>          </Dropdown>          <small v-if="formErrors.titularId" class="p-error">
            {{ formErrors.titularId }}
          </small>
          <small v-show="isEditing && socio.titularIdOriginal && socio.titularId != socio.titularIdOriginal" class="text-yellow-400 block mt-1">
            <i class="pi pi-info-circle"></i> Está cambiando el titular de este adherente.
          </small>
        </div>

        <!-- Configuración de Pagos (solo para Adherentes) -->
        <div v-if="socio.tipoSocio === 'Adherente'" class="field">
          <label class="font-medium text-gray-300 mb-2 block">¿Quién paga?</label>
          <div class="flex flex-column gap-2">
            <div class="flex align-items-center">
              <Checkbox v-model="socio.pagaCuotaElAdherente" :binary="true" inputId="pagaCuota" />
              <label for="pagaCuota" class="ml-2">El adherente paga su propia cuota</label>
            </div>
            <div class="flex align-items-center">
              <Checkbox v-model="socio.pagaDisciplinasElAdherente" :binary="true" inputId="pagaDisciplinas" />
              <label for="pagaDisciplinas" class="ml-2">El adherente paga sus disciplinas</label>
            </div>
          </div>
        </div>

        <!-- Cobro por Mutual -->
        <div class="field">
          <label class="font-medium text-gray-300 mb-2 block">Método de cobro de cuota</label>
          <div class="flex align-items-center gap-2">
            <InputSwitch v-model="socio.pagaPorMutual" inputId="pagaPorMutual" />
            <div>
              <label for="pagaPorMutual" class="block" :class="socio.pagaPorMutual ? 'text-white font-medium' : 'text-gray-400'">
                Cobra por Mutual
              </label>
              <small class="text-gray-500 block">
                {{ socio.pagaPorMutual ? 'La cuota NO se genera automáticamente — el admin la registra vía Cobro Mutual.' : 'La cuota se genera automáticamente cada mes.' }}
              </small>
            </div>
          </div>
        </div>

        <div class="field">
          <label for="nombre" class="font-medium text-gray-300">Nombre *</label>
          <InputText id="nombre" v-model="socio.nombre" class="w-full" :class="{ 'p-invalid': !!formErrors.nombre }" />
          <small v-if="formErrors.nombre" class="p-error">{{ formErrors.nombre }}</small>
        </div>
        
        <div class="field">
          <label for="apellido" class="font-medium text-gray-300">Apellido *</label>
          <InputText id="apellido" v-model="socio.apellido" class="w-full" :class="{ 'p-invalid': !!formErrors.apellido }" />
          <small v-if="formErrors.apellido" class="p-error">{{ formErrors.apellido }}</small>
        </div>

        <div class="field">
          <label for="email" class="font-medium text-gray-300">Email *</label>
          <InputText id="email" v-model="socio.email" type="email" class="w-full" :class="{ 'p-invalid': !!formErrors.email }" />
          <small v-if="formErrors.email" class="p-error">{{ formErrors.email }}</small>
        </div>

        <div class="field" v-if="isEditing">
          <label for="numeroSocio" class="font-medium text-gray-300">Número de Socio</label>
          <InputText id="numeroSocio" v-model="socio.numeroSocio" class="w-full" disabled />
        </div>

        <div class="field" v-if="!isEditing">
          <label for="password" class="font-medium text-gray-300">Contraseña *</label>
          <Password id="password" v-model="socioPassword" class="w-full" input-class="w-full" toggle-mask />
          <small v-if="formErrors.password" class="p-error">{{ formErrors.password }}</small>
        </div>        <div class="field">
          <label for="telefono" class="font-medium text-gray-300">Teléfono</label>
          <div class="flex align-items-center gap-1">
            <span class="px-2 py-2 border-round text-color-secondary border-1 surface-border surface-ground" style="font-size:1rem;line-height:1.5;">+549</span>
            <InputText
              v-model="telefonoAreaAdmin"
              style="width:70px"
              placeholder="3533"
              maxlength="4"
            />
            <InputText
              v-model="telefonoNumeroAdmin"
              style="width:110px"
              placeholder="680908"
              maxlength="8"
            />
          </div>
          <small class="text-gray-400 block mt-1">Se guarda como +549 para WhatsApp y notificaciones.</small>
        </div>

        <div class="field">
          <label for="dni" class="font-medium text-gray-300">DNI</label>
          <InputText id="dni" v-model="socio.dni" class="w-full" />
        </div>

        <div class="field">
          <label for="fechaNacimiento" class="font-medium text-gray-300">Fecha de Nacimiento</label>
          <Calendar 
            id="fechaNacimiento" 
            v-model="socio.fechaNacimiento" 
            dateFormat="dd/mm/yy"
            :maxDate="new Date()"
            showIcon
            class="w-full"
            placeholder="Seleccionar fecha"
          />
          <small v-if="socio.fechaNacimiento" class="text-gray-400 block mt-1">
            <i class="pi pi-calendar mr-1"></i>
            Edad: {{ calcularEdad(socio.fechaNacimiento) }} años 
            ({{ calcularEdad(socio.fechaNacimiento) >= 18 ? 'Mayor' : 'Menor' }})
            <span v-if="obtenerCategoria(socio.fechaNacimiento)">
              · Categoría: {{ obtenerCategoria(socio.fechaNacimiento) }}
            </span>
          </small>
        </div>

        <div class="field">
          <label for="direccion" class="font-medium text-gray-300">Dirección</label>
          <InputText id="direccion" v-model="socio.direccion" class="w-full" />
        </div>        <div class="field">
          <label for="cuota" class="font-medium text-gray-300">Cuota Mensual</label>
          <InputNumber id="cuota" v-model="socio.cuotaSocio" mode="currency" currency="ARS" locale="es-AR" class="w-full" />
        </div>

        <!-- FASE 2: Selector de disciplinas al crear socio -->
        <div class="field" v-if="!isEditing">
          <label for="disciplinas" class="font-medium text-gray-300">Disciplinas (opcional)</label>
          <MultiSelect 
            id="disciplinas"
            v-model="socio.disciplinaIds" 
            :options="disciplinasDisponibles"
            optionLabel="nombre"
            optionValue="id"
            placeholder="Seleccionar disciplinas"
            class="w-full"
            display="chip"
          >
            <template #option="slotProps">
              <div class="flex justify-content-between align-items-center w-full">
                <span>{{ slotProps.option.nombre }}</span>
                <span class="text-green-400">${{ slotProps.option.cuotaMensual?.toLocaleString() }}/mes</span>
              </div>
            </template>
          </MultiSelect>
          <small class="text-gray-400 block mt-1">
            <i class="pi pi-info-circle"></i> Puedes inscribir al socio en disciplinas al momento de crearlo
          </small>
        </div>

        <div class="field">
          <label class="font-medium text-gray-300 mb-2 block">Foto del Socio</label>
          <ImageUpload v-model="socio.foto" placeholder="Subir foto del socio" />
        </div><div class="field" v-if="isEditing">
          <label for="activo" class="font-medium text-gray-300">Estado de Aprobación</label>
          <div class="flex align-items-center gap-2 mt-2">
            <InputSwitch id="activo" v-model="socio.activo" />
            <span class="text-gray-300">{{ socio.activo ? 'Aprobado y Activo' : 'Pendiente de Aprobación' }}</span>
          </div>
          <small v-if="!socio.activo" class="text-yellow-400 block mt-1">
            <i class="pi pi-exclamation-triangle"></i> Este socio no podrá iniciar sesión hasta que sea aprobado
          </small>
        </div>
      </div>

      <template #footer>
        <Button label="Cancelar" icon="pi pi-times" text @click="hideDialog" />
        <Button label="Guardar" icon="pi pi-check" @click="saveSocio" :loading="saving" />      </template>
    </Dialog>

    <!-- Reset Password Dialog -->
    <Dialog
      v-model:visible="resetPasswordDialog"
      header="Resetear Contraseña"
      :modal="true"
      :style="{ width: '400px' }"
      @hide="resetPwForm"
    >
      <div class="flex flex-column gap-3 pt-2">
        <p class="text-gray-300 m-0">
          Resetear contraseña para: <strong style="color: var(--text-color)">{{ resetPwSocio?.nombre }} {{ resetPwSocio?.apellido }}</strong>
        </p>
        <div>
          <label class="block text-gray-300 font-medium mb-2">Nueva contraseña *</label>
          <Password
            v-model="resetPwNueva"
            class="w-full"
            inputClass="w-full"
            toggleMask
            promptLabel="Ingresá una contraseña"
            weakLabel="Débil"
            mediumLabel="Media"
            strongLabel="Fuerte"
            :class="{ 'p-invalid': resetPwError }"
          />
          <small v-if="resetPwError" class="p-error">{{ resetPwError }}</small>
        </div>
        <Message v-if="resetPwApiError" severity="error" :closable="false">{{ resetPwApiError }}</Message>
      </div>
      <template #footer>
        <Button label="Cancelar" text @click="resetPasswordDialog = false" />
        <Button label="Resetear Contraseña" icon="pi pi-key" severity="warning" :loading="savingResetPw" @click="doResetPassword" />
      </template>
    </Dialog>

    <!-- Dialog: Enviar WhatsApp manual -->
    <Dialog
      v-model:visible="waDialog"
      header="Enviar WhatsApp"
      :modal="true"
      :style="{ width: '480px' }"
    >
      <div class="flex flex-column gap-3 pt-2">
        <p class="text-gray-300 m-0">
          Destinatario: <strong style="color: var(--text-color)">{{ waSocio?.nombre }} {{ waSocio?.apellido }}</strong>
          — <span class="text-green-400">{{ formatTelefonoDisplay(waSocio?.telefono) || 'Sin teléfono' }}</span>
        </p>
        <div>
          <label class="block text-gray-300 font-medium mb-2">Mensaje</label>
          <Textarea v-model="waMensaje" rows="5" class="w-full" autoResize />
        </div>
      </div>
      <template #footer>
        <Button label="Cancelar" text @click="waDialog = false" />
        <Button
          label="WhatsApp Web"
          icon="pi pi-whatsapp"
          severity="success"
          outlined
          @click="abrirWaWeb"
          :disabled="!waSocio?.telefono"
        />

      </template>
    </Dialog>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useToast } from 'primevue/usetoast'
import { useConfirm } from 'primevue/useconfirm'
import { sociosService, disciplinasService, authService } from '@/services'
import { planesService } from '@/services/planesService'
import { FilterMatchMode } from 'primevue/api'
import * as XLSX from 'xlsx'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Button from 'primevue/button'
import Dialog from 'primevue/dialog'
import InputText from 'primevue/inputtext'
import InputNumber from 'primevue/inputnumber'
import InputSwitch from 'primevue/inputswitch'
import Password from 'primevue/password'
import Tag from 'primevue/tag'
import Dropdown from 'primevue/dropdown'
import RadioButton from 'primevue/radiobutton'
import Checkbox from 'primevue/checkbox'
import Calendar from 'primevue/calendar'
import MultiSelect from 'primevue/multiselect'
import Message from 'primevue/message'
import Textarea from 'primevue/textarea'
import ImageUpload from '@/components/shared/ImageUpload.vue'
import {
  toLocalCalendarDate,
  normalizeReservaFechaForApi,
  calcularEdadDesdeFechaNacimiento,
  obtenerCategoriaDesdeFechaNacimiento
} from '@/utils/reservationDates'
import { parseTelefonoAR, formatTelefonoStorageAR, formatTelefonoDisplay, openWhatsApp, validarTelefonoAR } from '@/utils/phone'

const router = useRouter()
const toast = useToast()
const confirm = useConfirm()

const socios = ref([])
const planesMembresia = ref([])
const disciplinasDisponibles = ref([])
const loading = ref(false)
const socioDialog = ref(false)
const formErrors = ref({})
const saveError = ref('')
const saving = ref(false)
const isEditing = ref(false)
const socioPassword = ref('')

const hasFormErrors = computed(() => Object.keys(formErrors.value).length > 0)

const socio = ref({
  tipoSocio: 'Titular',
  pagaCuotaElAdherente: false,
  pagaDisciplinasElAdherente: true,
  pagaPorMutual: false,
  // Campos para tracking de cambios
  planMembresiaIdOriginal: null,
  tipoSocioOriginal: null,
  titularIdOriginal: null
})

function clearFormErrors() {
  formErrors.value = {}
  saveError.value = ''
}

function clearFieldError(key) {
  if (!formErrors.value[key]) return
  const next = { ...formErrors.value }
  delete next[key]
  formErrors.value = next
}

function validateForm() {
  const errors = {}

  if (!socio.value.nombre?.trim()) errors.nombre = 'El nombre es requerido'
  if (!socio.value.apellido?.trim()) errors.apellido = 'El apellido es requerido'
  if (!socio.value.email?.trim()) errors.email = 'El email es requerido'

  if (!isEditing.value) {
    if (!socioPassword.value) errors.password = 'La contraseña es requerida'
    if (!socio.value.planMembresiaId) errors.planMembresiaId = 'El plan es requerido'
  }

  if (socio.value.tipoSocio === 'Adherente' && !socio.value.titularId) {
    errors.titularId = 'Debe seleccionar un titular'
  }

  formErrors.value = errors
  return Object.keys(errors).length === 0
}

watch(() => socio.value.nombre, () => clearFieldError('nombre'))
watch(() => socio.value.apellido, () => clearFieldError('apellido'))
watch(() => socio.value.email, () => clearFieldError('email'))
watch(() => socio.value.planMembresiaId, () => clearFieldError('planMembresiaId'))
watch(() => socio.value.titularId, () => clearFieldError('titularId'))
watch(() => socio.value.tipoSocio, () => clearFieldError('titularId'))
watch(socioPassword, () => clearFieldError('password'))

// Split phone input
const telefonoAreaAdmin = ref('')
const telefonoNumeroAdmin = ref('')

watch([telefonoAreaAdmin, telefonoNumeroAdmin], () => {
  const formatted = formatTelefonoStorageAR(telefonoAreaAdmin.value, telefonoNumeroAdmin.value)
  if (formatted) socio.value.telefono = formatted
})
const filtroEstado = ref('todos')
const vistaGrid = ref(false)

// Reset password
const resetPasswordDialog = ref(false)
const resetPwSocio = ref(null)
const resetPwNueva = ref('')
const resetPwError = ref('')
const resetPwApiError = ref('')
const savingResetPw = ref(false)

function openResetPassword(data) {
  resetPwSocio.value = data
  resetPwNueva.value = ''
  resetPwError.value = ''
  resetPwApiError.value = ''
  resetPasswordDialog.value = true
}

function resetPwForm() {
  resetPwNueva.value = ''
  resetPwError.value = ''
  resetPwApiError.value = ''
}

async function doResetPassword() {
  resetPwError.value = ''
  resetPwApiError.value = ''
  if (!resetPwNueva.value) { resetPwError.value = 'Requerido'; return }
  if (resetPwNueva.value.length < 6) { resetPwError.value = 'Mínimo 6 caracteres'; return }
  savingResetPw.value = true
  try {
    await authService.adminResetPasswordSocio(resetPwSocio.value.id, resetPwNueva.value)
    resetPasswordDialog.value = false
    resetPwForm()
    toast.add({ severity: 'success', summary: 'Éxito', detail: 'Contraseña reseteada correctamente', life: 3000 })
  } catch (error) {
    resetPwApiError.value = error?.response?.data?.message || 'No se pudo resetear la contraseña'
  } finally {
    savingResetPw.value = false
  }
}

// WhatsApp manual
const waDialog = ref(false)
const waSocio = ref(null)
const waMensaje = ref('')
const waEnviando = ref(false)

function openWaDialog(data) {
  waSocio.value = data
  waMensaje.value = `Hola ${data.nombre}, te contactamos desde el Club. ¿En qué podemos ayudarte?`
  waDialog.value = true
}

function abrirWaWeb() {
  if (!waSocio.value?.telefono || !waMensaje.value.trim()) return
  const { valido, error } = validarTelefonoAR(waSocio.value.telefono)
  if (!valido) {
    toast.add({ severity: 'warn', summary: 'Teléfono inválido', detail: error, life: 4000 })
    return
  }
  if (!openWhatsApp(waSocio.value.telefono, waMensaje.value)) {
    toast.add({ severity: 'error', summary: 'Error', detail: 'No se pudo abrir WhatsApp Web', life: 3000 })
  }
}

async function enviarWA() {
  if (!waMensaje.value.trim()) return
  waEnviando.value = true
  try {
    await sociosService.enviarWhatsApp(waSocio.value.id, waMensaje.value)
    toast.add({ severity: 'success', summary: 'Enviado', detail: 'Mensaje enviado por WhatsApp', life: 3000 })
    waDialog.value = false
  } catch (error) {
    const msg = error?.response?.data?.message || 'No se pudo enviar el mensaje'
    toast.add({ severity: 'error', summary: 'Error', detail: msg, life: 3000 })
  } finally {
    waEnviando.value = false
  }
}

const hasAdherentes = ref(false)

const filters = ref({
  global: { value: null, matchMode: FilterMatchMode.CONTAINS }
})

// Computed: Contadores de socios
const sociosInactivos = computed(() => socios.value.filter(s => !s.activo).length)
const sociosActivos = computed(() => socios.value.filter(s => s.activo).length)

// Computed: Socios filtrados según el estado seleccionado
const sociosFiltrados = computed(() => {
  if (filtroEstado.value === 'inactivos') {
    return socios.value.filter(s => !s.activo)
  } else if (filtroEstado.value === 'activos') {
    return socios.value.filter(s => s.activo)
  }
  return socios.value
})

// Helpers vista card
const SOCIO_COLORES = ['#6366f1','#8b5cf6','#ec4899','#f59e0b','#10b981','#3b82f6','#ef4444','#14b8a6','#f97316','#06b6d4']
function getSocioColor(nombre = '') {
  return SOCIO_COLORES[(nombre.charCodeAt(0) || 0) % SOCIO_COLORES.length]
}
function getSocioInitials(nombre = '', apellido = '') {
  return ((nombre[0] || '') + (apellido[0] || '')).toUpperCase()
}
const sociosParaMostrar = computed(() => {
  const search = (filters.value['global']?.value || '').toLowerCase()
  const base = sociosFiltrados.value
  if (!search) return base
  return base.filter(s =>
    s.nombre?.toLowerCase().includes(search) ||
    s.apellido?.toLowerCase().includes(search) ||
    s.email?.toLowerCase().includes(search) ||
    String(s.numeroSocio).includes(search)
  )
})

// Computed: Plan seleccionado
const selectedPlan = computed(() => {
  if (!socio.value.planMembresiaId) return null
  return planesMembresia.value.find(p => p.id === socio.value.planMembresiaId)
})

// Computed: Socios titulares disponibles (excluye el socio actual si está editando)
const sociosTitularesDisponibles = computed(() => {
  return socios.value
    .filter(s => 
      s.tipoSocio === 'Titular' && 
      s.activo && 
      (!isEditing.value || s.id !== socio.value.id) // Excluir el socio actual
    )
    .map(s => ({
      ...s,
      nombreCompleto: `${s.nombre} ${s.apellido}`,
      planNombre: s.planNombre || 'Sin plan'
    }))
})

// Computed: Socios titulares (sin excluir el actual, para crear)
const sociosTitulares = computed(() => {
  return socios.value
    .filter(s => s.tipoSocio === 'Titular' && s.activo)
    .map(s => ({
      ...s,
      nombreCompleto: `${s.nombre} ${s.apellido}`,
      planNombre: s.planNombre || 'Sin plan'
    }))
})

// Computed: Para evitar errores en v-if complejos
const titularDisabled = computed(() => {
  return isEditing.value && socio.value.tipoSocioOriginal === 'Titular' && hasAdherentes.value
})

const adherenteDisabled = computed(() => selectedPlan.value?.tipoPlan === 'Individual')

// Función para calcular la edad desde la fecha de nacimiento
function calcularEdad(fechaNacimiento) {
  return calcularEdadDesdeFechaNacimiento(fechaNacimiento)
}

function obtenerCategoria(fechaNacimiento) {
  return obtenerCategoriaDesdeFechaNacimiento(fechaNacimiento)
}

async function loadSocios() {
  loading.value = true
  try {
    socios.value = await sociosService.getAll()
  } catch (error) {
    toast.add({ severity: 'error', summary: 'Error', detail: 'No se pudieron cargar los socios', life: 3000 })
  } finally {
    loading.value = false
  }
}

async function loadPlanes() {
  try {
    planesMembresia.value = await planesService.getAll(true) // Solo planes activos
  } catch (error) {
    console.error('Error cargando planes:', error)
  }
}

async function loadDisciplinas() {
  try {
    disciplinasDisponibles.value = await disciplinasService.getAll()
  } catch (error) {
    console.error('Error cargando disciplinas:', error)
  }
}

function onPlanChange() {
  if (selectedPlan.value) {
    socio.value.cuotaSocio = selectedPlan.value.precioMensual
    if (selectedPlan.value.tipoPlan === 'Individual' && socio.value.tipoSocio === 'Adherente') {
      socio.value.tipoSocio = 'Titular'
      socio.value.titularId = null
    }
  }
}

// ── Carga masiva ──────────────────────────────────────────────────────────────
const cargaMasivaDialog = ref(false)
const cargaMasivaStep = ref(1)
const cargaMasivaFilas = ref([])
const cargaMasivaProgreso = ref(0)
const cargaMasivaTotal = ref(0)
const cargaMasivaOk = ref(0)
const cargaMasivaErrores = ref([])

const COLUMN_MAP = {
  nombre: ['nombre', 'name', 'first name'],
  apellido: ['apellido', 'lastname', 'last name', 'surname'],
  email: ['email', 'correo', 'mail'],
  telefono: ['telefono', 'teléfono', 'phone', 'tel', 'celular'],
  dni: ['dni', 'documento', 'cedula', 'cédula', 'nro documento'],
  direccion: ['direccion', 'dirección', 'address'],
  fechaNacimiento: ['fechanacimiento', 'fecha nacimiento', 'fecha de nacimiento', 'birth', 'dob', 'nacimiento']
}

function normKey(k) { return k?.toString().toLowerCase().trim().replace(/\s+/g, ' ') }

function parsearExcel(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = e => {
      try {
        const wb = XLSX.read(e.target.result, { type: 'array', cellDates: true })
        const ws = wb.Sheets[wb.SheetNames[0]]
        const raw = XLSX.utils.sheet_to_json(ws, { defval: '' })
        if (!raw.length) { reject('El archivo está vacío.'); return }

        // Mapear columnas
        const keys = Object.keys(raw[0])
        const colMap = {}
        for (const [field, aliases] of Object.entries(COLUMN_MAP)) {
          const match = keys.find(k => aliases.includes(normKey(k)))
          if (match) colMap[field] = match
        }

        const filas = raw.map((row, i) => {
          const f = {
            nombre:          (row[colMap.nombre] ?? '').toString().trim(),
            apellido:        (row[colMap.apellido] ?? '').toString().trim(),
            email:           (row[colMap.email] ?? '').toString().trim(),
            telefono:        (row[colMap.telefono] ?? '').toString().trim(),
            dni:             (row[colMap.dni] ?? '').toString().trim(),
            direccion:       (row[colMap.direccion] ?? '').toString().trim(),
            fechaNacimiento: colMap.fechaNacimiento ? formatFechaNacimiento(row[colMap.fechaNacimiento]) : '',
            _fila: i + 2
          }
          if (!f.nombre) f._error = 'Falta Nombre'
          else if (!f.apellido) f._error = 'Falta Apellido'
          else if (!f.email) f._error = 'Falta Email'
          else if (!f.telefono) f._error = 'Falta Teléfono'
          else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email)) f._error = 'Email inválido'
          return f
        })
        resolve(filas)
      } catch (err) { reject('No se pudo leer el archivo: ' + err.message) }
    }
    reader.onerror = () => reject('Error al leer el archivo')
    reader.readAsArrayBuffer(file)
  })
}

function formatFechaNacimiento(val) {
  if (!val) return ''
  if (val instanceof Date) {
    return val.toISOString().split('T')[0]
  }
  const s = val.toString().trim()
  // dd/mm/aaaa → aaaa-mm-dd
  const m = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/)
  if (m) return `${m[3]}-${m[2].padStart(2,'0')}-${m[1].padStart(2,'0')}`
  return s
}

async function onFileExcel(e) {
  const file = e.target.files[0]
  if (!file) return
  await procesarArchivoExcel(file)
  e.target.value = ''
}

async function onDropExcel(e) {
  const file = e.dataTransfer.files[0]
  if (!file) return
  await procesarArchivoExcel(file)
}

async function procesarArchivoExcel(file) {
  try {
    cargaMasivaFilas.value = await parsearExcel(file)
    cargaMasivaStep.value = 2
  } catch (err) {
    toast.add({ severity: 'error', summary: 'Error', detail: err, life: 5000 })
  }
}

function abrirCargaMasiva() {
  cargaMasivaStep.value = 1
  cargaMasivaFilas.value = []
  cargaMasivaProgreso.value = 0
  cargaMasivaTotal.value = 0
  cargaMasivaOk.value = 0
  cargaMasivaErrores.value = []
  cargaMasivaDialog.value = true
}

async function ejecutarCargaMasiva() {
  const validas = cargaMasivaFilas.value.filter(r => !r._error)
  cargaMasivaTotal.value = validas.length
  cargaMasivaProgreso.value = 0
  cargaMasivaOk.value = 0
  cargaMasivaErrores.value = []
  cargaMasivaStep.value = 3

  for (const fila of validas) {
    try {
      await sociosService.create({
        nombre: fila.nombre,
        apellido: fila.apellido,
        email: fila.email,
        password: Math.random().toString(36).slice(-8) + 'A1!',
        telefono: fila.telefono,
        dni: fila.dni || '',
        direccion: fila.direccion || '',
        fechaNacimiento: fila.fechaNacimiento || null,
        cuotaSocio: 0,
        tipoSocio: 'Titular',
        recibeNotificacionesWhatsApp: true,
        pagaPorMutual: false
      })
      cargaMasivaOk.value++
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Error desconocido'
      cargaMasivaErrores.value.push(`Fila ${fila._fila} (${fila.nombre} ${fila.apellido}): ${msg}`)
    }
    cargaMasivaProgreso.value++
  }

  await loadSocios()
}

function descargarPlantilla() {
  const data = [
    { Nombre: 'Juan', Apellido: 'Pérez', Email: 'juan@ejemplo.com', Telefono: '1123456789', Dni: '30123456', Direccion: 'Av. Siempre Viva 123', FechaNacimiento: '15/03/1985' },
    { Nombre: 'María', Apellido: 'García', Email: 'maria@ejemplo.com', Telefono: '1187654321', Dni: '28765432', Direccion: '', FechaNacimiento: '' }
  ]
  const ws = XLSX.utils.json_to_sheet(data)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Socios')
  XLSX.writeFile(wb, 'plantilla-carga-socios.xlsx')
}

function openNew() {
  socio.value = { 
    cuotaSocio: 0, 
    activo: true,
    tipoSocio: 'Titular',
    disciplinaIds: [], // FASE 2: Inicializar array de disciplinas
    pagaCuotaElAdherente: false,
    pagaDisciplinasElAdherente: true,
    pagaPorMutual: false,
    recibeNotificacionesWhatsApp: true,
    planMembresiaIdOriginal: null,
    tipoSocioOriginal: null,
    titularIdOriginal: null
  }
  hasAdherentes.value = false
  clearFormErrors()
  socioPassword.value = ''
  isEditing.value = false
  telefonoAreaAdmin.value = ''
  telefonoNumeroAdmin.value = ''
  socioDialog.value = true
}

function editSocio(data) {
  socio.value = { 
    ...data,
    fechaNacimiento: toLocalCalendarDate(data.fechaNacimiento),
    // Guardar valores originales para tracking de cambios
    planMembresiaIdOriginal: data.planMembresiaId,
    tipoSocioOriginal: data.tipoSocio || 'Titular',
    titularIdOriginal: data.titularId,
    // Asegurar valores por defecto
    tipoSocio: data.tipoSocio || 'Titular',
    pagaCuotaElAdherente: data.pagaCuotaElAdherente ?? false,
    pagaDisciplinasElAdherente: data.pagaDisciplinasElAdherente ?? true,
    pagaPorMutual: data.pagaPorMutual ?? false,
    recibeNotificacionesWhatsApp: data.recibeNotificacionesWhatsApp ?? true
  }
  
  // Verificar si el socio tiene adherentes (si es Titular)
  if (data.tipoSocio === 'Titular') {
    hasAdherentes.value = socios.value.some(s => s.titularId === data.id)
    } else {
    hasAdherentes.value = false
  }
  
  isEditing.value = true
  clearFormErrors()
  socioPassword.value = ''
  const parsed = parseTelefonoAR(data.telefono)
  telefonoAreaAdmin.value = parsed.area
  telefonoNumeroAdmin.value = parsed.numero
  socioDialog.value = true
}

function viewSocio(data) {
  router.push(`/admin/socios/${data.id}`)
}

function hideDialog() {
  socioDialog.value = false
  clearFormErrors()
  socioPassword.value = ''
}

async function saveSocio() {
  saveError.value = ''

  if (!validateForm()) return

  if (isEditing.value) {
    if (hasAdherentes.value && socio.value.tipoSocio === 'Adherente') {
      saveError.value = 'Este socio tiene adherentes asociados. No puede cambiarse a adherente.'
      return
    }
  }

  saving.value = true
  try {
    if (isEditing.value) {
      const updateData = {
        nombre: socio.value.nombre,
        apellido: socio.value.apellido,
        email: socio.value.email,
        telefono: socio.value.telefono || '',
        dni: socio.value.dni || '',
        direccion: socio.value.direccion || '',
        fechaNacimiento: normalizeReservaFechaForApi(socio.value.fechaNacimiento),
        cuotaSocio: socio.value.cuotaSocio || 0,
        foto: socio.value.foto,
        activo: socio.value.activo,
        // Incluir campos de plan y adherente
        planMembresiaId: socio.value.planMembresiaId,
        tipoSocio: socio.value.tipoSocio,
        titularId: socio.value.tipoSocio === 'Adherente' ? socio.value.titularId : null,
        pagaCuotaElAdherente: socio.value.tipoSocio === 'Adherente' ? socio.value.pagaCuotaElAdherente : false,
        pagaDisciplinasElAdherente: socio.value.tipoSocio === 'Adherente' ? socio.value.pagaDisciplinasElAdherente : false,
        recibeNotificacionesWhatsApp: socio.value.recibeNotificacionesWhatsApp ?? true,
        pagaPorMutual: socio.value.pagaPorMutual ?? false
      }
      
      await sociosService.update(socio.value.id, updateData)
      toast.add({ severity: 'success', summary: 'Éxito', detail: 'Socio actualizado', life: 3000 })    } else {
      await sociosService.create({
        nombre: socio.value.nombre,
        apellido: socio.value.apellido,
        email: socio.value.email,
        password: socioPassword.value,
        telefono: socio.value.telefono || '',
        dni: socio.value.dni || '',
        direccion: socio.value.direccion || '',
        fechaNacimiento: normalizeReservaFechaForApi(socio.value.fechaNacimiento),
        cuotaSocio: socio.value.cuotaSocio || 0,
        foto: socio.value.foto,
        planMembresiaId: socio.value.planMembresiaId,
        tipoSocio: socio.value.tipoSocio,
        titularId: socio.value.tipoSocio === 'Adherente' ? socio.value.titularId : null,
        pagaCuotaElAdherente: socio.value.tipoSocio === 'Adherente' ? socio.value.pagaCuotaElAdherente : false,
        pagaDisciplinasElAdherente: socio.value.tipoSocio === 'Adherente' ? socio.value.pagaDisciplinasElAdherente : false,
        recibeNotificacionesWhatsApp: socio.value.recibeNotificacionesWhatsApp ?? true,
        pagaPorMutual: socio.value.pagaPorMutual ?? false
      })
      toast.add({ severity: 'success', summary: 'Éxito', detail: 'Socio creado', life: 3000 })
    }
    hideDialog()
    await loadSocios()
  } catch (error) {
    saveError.value = error.response?.data?.message || 'Error al guardar el socio'
    toast.add({ 
      severity: 'error', 
      summary: 'Error', 
      detail: saveError.value, 
      life: 3000 
    })
  } finally {
    saving.value = false
  }
}

function confirmDesactivar(data) {
  confirm.require({
    message: `¿Desactivar a ${data.nombre} ${data.apellido}? El socio no podrá iniciar sesión pero sus datos se conservarán.`,
    header: 'Desactivar socio',
    icon: 'pi pi-ban',
    acceptLabel: 'Desactivar',
    rejectLabel: 'Cancelar',
    acceptClass: 'p-button-danger',
    accept: async () => {
      try {
        await sociosService.update(data.id, { ...data, activo: false })
        toast.add({ severity: 'success', summary: 'Socio desactivado', detail: `${data.nombre} ${data.apellido} fue desactivado`, life: 3000 })
        await loadSocios()
      } catch (error) {
        toast.add({ severity: 'error', summary: 'Error', detail: 'No se pudo desactivar el socio', life: 3000 })
      }
    }
  })
}

async function aprobarSocio(data) {
  confirm.require({
    message: `¿Confirmar aprobación del socio ${data.nombre} ${data.apellido}?`,
    header: 'Aprobar Socio',
    icon: 'pi pi-check-circle',
    acceptLabel: 'Aprobar',
    rejectLabel: 'Cancelar',
    acceptClass: 'p-button-success',
    accept: async () => {
      try {
        await sociosService.update(data.id, { ...data, activo: true })
        toast.add({ 
          severity: 'success', 
          summary: 'Socio Activado', 
          detail: `${data.nombre} ${data.apellido} puede iniciar sesión`, 
          life: 3000 
        })
        await loadSocios()
      } catch (error) {
        toast.add({ 
          severity: 'error', 
          summary: 'Error', 
          detail: 'No se pudo aprobar el socio', 
          life: 3000 
        })
      }
    }
  })
}

onMounted(() => {
  loadSocios()
  loadPlanes()
  loadDisciplinas() // FASE 2: Cargar disciplinas disponibles
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

.stat-total .stat-icon   { background: linear-gradient(135deg, #6366f1, #8b5cf6); }
.stat-success .stat-icon { background: linear-gradient(135deg, #22c55e, #16a34a); }
.stat-warning .stat-icon { background: linear-gradient(135deg, #f59e0b, #d97706); }
.stat-mutual .stat-icon  { background: linear-gradient(135deg, #3b82f6, #2563eb); }

.stat-content { display: flex; flex-direction: column; }
.stat-value { font-size: 1.75rem; font-weight: 700; color: var(--text-color); }
.stat-label { font-size: 0.85rem; color: var(--text-color-secondary); }

.socio-card {
  background: var(--surface-card);
  border: 1px solid var(--surface-border);
  border-radius: 12px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  height: 100%;
  transition: border-color 0.2s, box-shadow 0.2s;
}
.socio-card:hover {
  border-color: var(--primary-color);
  box-shadow: 0 4px 16px rgba(0,0,0,0.2);
}
.socio-card--inactivo {
  opacity: 0.75;
}
.socio-card__header {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  padding: 1rem 1rem 0.75rem;
}
.socio-card__body {
  padding: 0 1rem 0.75rem;
  flex: 1;
}
.socio-card__footer {
  display: flex;
  align-items: center;
  gap: 0.1rem;
  padding: 0.5rem 0.75rem;
  border-top: 1px solid var(--surface-border);
  background: rgba(255,255,255,0.02);
}
.socio-avatar-lg {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  color: #fff;
  font-weight: 700;
  font-size: 1rem;
}
</style>
