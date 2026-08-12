<template>
  <div>
    <PageHeader title="Empleados">
      <template #actions>
        <Button label="Nuevo Empleado" icon="pi pi-plus" size="small" @click="openNewDialog" />
      </template>
    </PageHeader>

    <!-- Stat cards -->
    <div class="grid mb-4">
      <div class="col-6 md:col-3">
        <div class="stat-card stat-total">
          <div class="stat-icon"><i class="pi pi-users"></i></div>
          <div class="stat-content">
            <span class="stat-value">{{ empleados.length }}</span>
            <span class="stat-label">Total Empleados</span>
          </div>
        </div>
      </div>
      <div class="col-6 md:col-3">
        <div class="stat-card stat-success">
          <div class="stat-icon"><i class="pi pi-check-circle"></i></div>
          <div class="stat-content">
            <span class="stat-value">{{ empleados.filter(e => e.activo).length }}</span>
            <span class="stat-label">Activos</span>
          </div>
        </div>
      </div>
      <div class="col-6 md:col-3">
        <div class="stat-card stat-danger">
          <div class="stat-icon"><i class="pi pi-times-circle"></i></div>
          <div class="stat-content">
            <span class="stat-value">{{ empleados.filter(e => !e.activo).length }}</span>
            <span class="stat-label">Inactivos</span>
          </div>
        </div>
      </div>
      <div class="col-6 md:col-3">
        <div class="stat-card stat-warning">
          <div class="stat-icon"><i class="pi pi-dollar"></i></div>
          <div class="stat-content">
            <span class="stat-value">${{ empleados.filter(e => e.activo).reduce((s, e) => s + (e.salario || 0), 0).toLocaleString() }}</span>
            <span class="stat-label">Masa Salarial</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Filtros -->
    <div class="card mb-4">
      <div class="flex flex-wrap align-items-center gap-3">
        <span class="p-input-icon-left flex-1" style="min-width: 200px">
          <i class="pi pi-search" />
          <InputText v-model="filters.global.value" placeholder="Buscar por nombre, email o puesto..." class="w-full" />
        </span>
      </div>
    </div>

    <div v-if="loading" class="flex justify-content-center py-5">
      <ProgressSpinner />
    </div>
    <template v-else>
      <div v-if="empleadosFiltrados.length === 0" class="card text-center py-5 text-gray-400">
        No se encontraron empleados
      </div>
      <div v-else class="mobile-card-list">
        <MobileRecordCard
          v-for="item in paginatedEmpleados"
          :key="item.id"
          :title="`${item.nombre} ${item.apellido}`"
          :subtitle="item.email"
        >
          <template #leading>
            <Avatar :label="(item.nombre?.charAt(0) + item.apellido?.charAt(0)).toUpperCase()" shape="circle" class="avatar-red" />
          </template>
          <template #tags>
            <Tag :severity="item.activo ? 'success' : 'danger'" :value="item.activo ? 'Activo' : 'Inactivo'" />
          </template>
          <template #body>
            <div class="record-card__row">
              <span class="record-card__label">Puesto</span>
              <Tag :value="item.puesto" severity="info" />
            </div>
            <div class="record-card__row">
              <span class="record-card__label">Salario</span>
              <span class="record-card__value text-green-400">${{ item.salario?.toLocaleString() }}</span>
            </div>
            <div class="record-card__row">
              <span class="record-card__label">Ingreso</span>
              <span class="record-card__value">{{ formatDate(item.fechaIngreso) }}</span>
            </div>
          </template>
          <template #actions>
            <Button icon="pi pi-dollar" severity="success" text rounded size="small" v-tooltip.top="'Pagar sueldo'" @click="openPagarSueldoDialog(item)" :disabled="!item.activo" />
            <Button icon="pi pi-pencil" severity="info" text rounded size="small" @click="openEditDialog(item)" />
            <Button icon="pi pi-trash" severity="danger" text rounded size="small" @click="confirmDelete(item)" />
          </template>
        </MobileRecordCard>
      </div>
      <MobilePaginator v-model:page="empleadosPage" :rows="10" :total="empleadosFiltrados.length" />
    </template>

    <!-- Dialog Crear/Editar -->
    <Dialog 
      v-model:visible="dialogVisible" 
      :header="isEditing ? 'Editar Empleado' : 'Nuevo Empleado'" 
      :modal="true"
      :style="{ width: '500px' }"
    >
      <div class="grid">
        <div class="col-12 md:col-6">
          <label class="block text-gray-300 mb-2">Nombre *</label>
          <InputText v-model="form.nombre" class="w-full" placeholder="Nombre" />
        </div>
        <div class="col-12 md:col-6">
          <label class="block text-gray-300 mb-2">Apellido *</label>
          <InputText v-model="form.apellido" class="w-full" placeholder="Apellido" />
        </div>
        <div class="col-12">
          <label class="block text-gray-300 mb-2">Email *</label>
          <InputText v-model="form.email" type="email" class="w-full" placeholder="email@ejemplo.com" />
        </div>
        <div class="col-12 md:col-6">
          <label class="block text-gray-300 mb-2">Teléfono</label>
          <InputText v-model="form.telefono" class="w-full" placeholder="Teléfono" />
        </div>
        <div class="col-12 md:col-6">
          <label class="block text-gray-300 mb-2">Puesto *</label>
          <Dropdown 
            v-model="form.puesto" 
            :options="puestos" 
            class="w-full" 
            placeholder="Seleccionar puesto"
            editable
          />
        </div>
        <div class="col-12 md:col-6">
          <label class="block text-gray-300 mb-2">Salario *</label>
          <InputNumber v-model="form.salario" mode="currency" currency="ARS" locale="es-AR" class="w-full" />
        </div>
        <div class="col-12 md:col-6">
          <label class="block text-gray-300 mb-2">Fecha Ingreso</label>
          <Calendar v-model="form.fechaIngreso" dateFormat="dd/mm/yy" class="w-full" />
        </div>
        <div class="col-12" v-if="isEditing">
          <div class="flex align-items-center gap-2">
            <Checkbox v-model="form.activo" :binary="true" inputId="activo" />
            <label for="activo" class="text-gray-300">Empleado activo</label>
          </div>
        </div>
      </div>

      <template #footer>
        <Button label="Cancelar" icon="pi pi-times" text @click="dialogVisible = false" />
        <Button label="Guardar" icon="pi pi-check" @click="save" :loading="saving" />
      </template>
    </Dialog>    <!-- Dialog Pagar Sueldo -->
    <Dialog
      v-model:visible="pagarSueldoVisible"
      header="Registrar Pago de Sueldo"
      :modal="true"
      :style="{ width: '420px' }"
    >
      <div v-if="pagarSueldoEmpleado" class="grid">
        <div class="col-12 mb-2">
          <div class="flex align-items-center gap-3 p-3 border-round" style="background: var(--surface-100)">
            <Avatar
              :label="(pagarSueldoEmpleado.nombre?.charAt(0) + pagarSueldoEmpleado.apellido?.charAt(0)).toUpperCase()"
              shape="circle"
              class="avatar-red"
            />
            <div>
              <div class="font-bold">{{ pagarSueldoEmpleado.nombre }} {{ pagarSueldoEmpleado.apellido }}</div>
              <div class="text-sm text-gray-400">{{ pagarSueldoEmpleado.puesto }}</div>
            </div>
          </div>
        </div>
        <div class="col-12">
          <label class="block text-gray-300 mb-2">Monto a pagar *</label>
          <InputNumber v-model="pagarSueldoForm.monto" mode="currency" currency="ARS" locale="es-AR" class="w-full" />
          <small class="text-gray-400">Salario registrado: ${{ pagarSueldoEmpleado.salario?.toLocaleString() }}</small>
        </div>
        <div class="col-12">
          <label class="block text-gray-300 mb-2">Fecha de pago</label>
          <Calendar v-model="pagarSueldoForm.fecha" dateFormat="dd/mm/yy" class="w-full" showIcon />
        </div>
        <div class="col-12">
          <label class="block text-gray-300 mb-2">Descripción (opcional)</label>
          <InputText v-model="pagarSueldoForm.descripcion" class="w-full" placeholder="Ej: Sueldo mes de mayo 2026" />
        </div>
      </div>
      <template #footer>
        <Button label="Cancelar" icon="pi pi-times" text @click="pagarSueldoVisible = false" />
        <Button label="Registrar Pago" icon="pi pi-check" severity="success" @click="confirmarPagarSueldo" :loading="pagandoSueldo" />
      </template>
    </Dialog>

    <!-- Confirm Delete -->
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useToast } from 'primevue/usetoast'
import { useConfirm } from 'primevue/useconfirm'
import { empleadosService } from '@/services'
import { useMobilePagination } from '@/composables/useMobilePagination'
import PageHeader from '@/components/mobile/PageHeader.vue'
import MobileRecordCard from '@/components/mobile/MobileRecordCard.vue'
import MobilePaginator from '@/components/mobile/MobilePaginator.vue'
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import InputNumber from 'primevue/inputnumber'
import Dropdown from 'primevue/dropdown'
import Calendar from 'primevue/calendar'
import Checkbox from 'primevue/checkbox'
import Dialog from 'primevue/dialog'
import Tag from 'primevue/tag'
import Avatar from 'primevue/avatar'
import ProgressSpinner from 'primevue/progressspinner'

const toast = useToast()
const confirm = useConfirm()

const empleados = ref([])
const loading = ref(true)
const dialogVisible = ref(false)
const isEditing = ref(false)
const saving = ref(false)
const editingId = ref(null)

// Pagar sueldo
const pagarSueldoVisible = ref(false)
const pagarSueldoEmpleado = ref(null)
const pagandoSueldo = ref(false)
const pagarSueldoForm = ref({ monto: 0, fecha: new Date(), descripcion: '' })

const filters = ref({
  global: { value: null, matchMode: 'contains' }
})
const empleadosFiltrados = computed(() => {
  const search = (filters.value.global?.value || '').toLowerCase()
  if (!search) return empleados.value
  return empleados.value.filter(e =>
    e.nombre?.toLowerCase().includes(search) ||
    e.apellido?.toLowerCase().includes(search) ||
    e.email?.toLowerCase().includes(search) ||
    e.puesto?.toLowerCase().includes(search)
  )
})
const { page: empleadosPage, paginated: paginatedEmpleados } = useMobilePagination(
  empleadosFiltrados,
  10,
  [() => filters.value.global?.value]
)

const puestos = ref([
  'Entrenador',
  'Mantenimiento',
  'Limpieza',
  'Administrativo',
  'CM',
  'Otros'
])

const defaultForm = {
  nombre: '',
  apellido: '',
  email: '',
  telefono: '',
  puesto: '',
  salario: 0,
  fechaIngreso: new Date(),
  activo: true
}

const form = ref({ ...defaultForm })

function formatDate(date) {
  if (!date) return '-'
  return new Date(date).toLocaleDateString('es-ES')
}

async function loadEmpleados() {
  loading.value = true
  try {
    empleados.value = await empleadosService.getAll()
  } catch (error) {
    toast.add({ severity: 'error', summary: 'Error', detail: 'No se pudieron cargar los empleados', life: 3000 })
  } finally {
    loading.value = false
  }
}

function openNewDialog() {
  form.value = { ...defaultForm, fechaIngreso: new Date() }
  isEditing.value = false
  editingId.value = null
  dialogVisible.value = true
}

function openEditDialog(empleado) {
  form.value = {
    nombre: empleado.nombre,
    apellido: empleado.apellido,
    email: empleado.email,
    telefono: empleado.telefono || '',
    puesto: empleado.puesto,
    salario: empleado.salario,
    fechaIngreso: empleado.fechaIngreso ? new Date(empleado.fechaIngreso) : new Date(),
    activo: empleado.activo
  }
  isEditing.value = true
  editingId.value = empleado.id
  dialogVisible.value = true
}

async function save() {
  if (!form.value.nombre || !form.value.apellido || !form.value.email || !form.value.puesto) {
    toast.add({ severity: 'warn', summary: 'Atención', detail: 'Complete los campos obligatorios', life: 3000 })
    return
  }

  saving.value = true
  try {
    if (isEditing.value) {
      await empleadosService.update(editingId.value, form.value)
      toast.add({ severity: 'success', summary: 'Éxito', detail: 'Empleado actualizado', life: 3000 })
    } else {
      await empleadosService.create(form.value)
      toast.add({ severity: 'success', summary: 'Éxito', detail: 'Empleado creado', life: 3000 })
    }
    dialogVisible.value = false
    await loadEmpleados()
  } catch (error) {
    const message = error.response?.data?.message || 'Error al guardar'
    toast.add({ severity: 'error', summary: 'Error', detail: message, life: 3000 })
  } finally {
    saving.value = false
  }
}

function confirmDelete(empleado) {
  confirm.require({
    message: `¿Está seguro de eliminar al empleado ${empleado.nombre} ${empleado.apellido}?`,
    header: 'Confirmar eliminación',
    icon: 'pi pi-exclamation-triangle',
    acceptClass: 'p-button-danger',
    accept: () => deleteEmpleado(empleado.id)
  })
}

async function deleteEmpleado(id) {
  try {
    await empleadosService.delete(id)
    toast.add({ severity: 'success', summary: 'Éxito', detail: 'Empleado eliminado', life: 3000 })
    await loadEmpleados()
  } catch (error) {
    toast.add({ severity: 'error', summary: 'Error', detail: 'No se pudo eliminar el empleado', life: 3000 })
  }
}

function openPagarSueldoDialog(empleado) {
  pagarSueldoEmpleado.value = empleado
  pagarSueldoForm.value = {
    monto: empleado.salario,
    fecha: new Date(),
    descripcion: ''
  }
  pagarSueldoVisible.value = true
}

async function confirmarPagarSueldo() {
  if (!pagarSueldoForm.value.monto || pagarSueldoForm.value.monto <= 0) {
    toast.add({ severity: 'warn', summary: 'Atención', detail: 'El monto debe ser mayor a 0', life: 3000 })
    return
  }
  pagandoSueldo.value = true
  try {
    await empleadosService.pagarSueldo(pagarSueldoEmpleado.value.id, {
      monto: pagarSueldoForm.value.monto,
      fecha: pagarSueldoForm.value.fecha?.toISOString() ?? new Date().toISOString(),
      descripcion: pagarSueldoForm.value.descripcion || null
    })
    toast.add({ severity: 'success', summary: 'Éxito', detail: 'Sueldo registrado como egreso correctamente', life: 3000 })
    pagarSueldoVisible.value = false
  } catch (error) {
    const message = error.response?.data?.message || 'Error al registrar el pago'
    toast.add({ severity: 'error', summary: 'Error', detail: message, life: 3000 })
  } finally {
    pagandoSueldo.value = false
  }
}

onMounted(() => {
  loadEmpleados()
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
.stat-danger .stat-icon  { background: linear-gradient(135deg, #ef4444, #dc2626); }
.stat-warning .stat-icon { background: linear-gradient(135deg, #f59e0b, #d97706); }
.stat-content { display: flex; flex-direction: column; }
.stat-value { font-size: 1.5rem; font-weight: 700; color: var(--text-color); }
.stat-label { font-size: 0.85rem; color: var(--text-color-secondary); }

.avatar-red {
  background-color: #dc2626 !important;
  color: white !important;
}
.empleado-card {
  background: var(--surface-card);
  border: 1px solid var(--surface-border);
  border-radius: 12px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  height: 100%;
  transition: border-color 0.2s, box-shadow 0.2s;
}
.empleado-card:hover {
  border-color: var(--primary-color);
  box-shadow: 0 4px 16px rgba(0,0,0,0.2);
}
.empleado-card--inactivo {
  opacity: 0.65;
}
.empleado-card__header {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  padding: 1rem 1rem 0.75rem;
}
.empleado-card__body {
  padding: 0 1rem 0.75rem;
  flex: 1;
}
.empleado-card__footer {
  display: flex;
  align-items: center;
  gap: 0.1rem;
  padding: 0.5rem 0.75rem;
  border-top: 1px solid var(--surface-border);
  background: rgba(255,255,255,0.02);
}
.emp-avatar {
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
