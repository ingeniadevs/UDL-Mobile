<template>
  <div>
    <PageHeader title="Empleados">
      <template #actions>
        <Button label="Nuevo Empleado" icon="pi pi-plus" size="small" @click="openNewDialog" />
      </template>
    </PageHeader>

    <div class="card mb-3">
      <span class="p-input-icon-left w-full">
        <i class="pi pi-search" />
        <InputText v-model="searchTerm" placeholder="Buscar..." class="w-full" />
      </span>
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
      <MobilePaginator v-model:page="currentPage" :rows="10" :total="empleadosFiltrados.length" />
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
        <div class="col-12 md:col-6" v-if="!isEditing">
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
    <ConfirmDialog />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useToast } from 'primevue/usetoast'
import { useConfirm } from 'primevue/useconfirm'
import { empleadosService } from '@/services'
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import InputNumber from 'primevue/inputnumber'
import Dropdown from 'primevue/dropdown'
import Calendar from 'primevue/calendar'
import Checkbox from 'primevue/checkbox'
import Dialog from 'primevue/dialog'
import Tag from 'primevue/tag'
import Avatar from 'primevue/avatar'
import ConfirmDialog from 'primevue/confirmdialog'
import ProgressSpinner from 'primevue/progressspinner'
import PageHeader from '@/components/mobile/PageHeader.vue'
import MobileRecordCard from '@/components/mobile/MobileRecordCard.vue'
import MobilePaginator from '@/components/mobile/MobilePaginator.vue'

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

const searchTerm = ref('')
const currentPage = ref(1)

const empleadosFiltrados = computed(() => {
  if (!searchTerm.value.trim()) return empleados.value
  const q = searchTerm.value.toLowerCase()
  return empleados.value.filter(e =>
    e.nombre?.toLowerCase().includes(q) ||
    e.apellido?.toLowerCase().includes(q) ||
    e.email?.toLowerCase().includes(q) ||
    e.puesto?.toLowerCase().includes(q)
  )
})

const paginatedEmpleados = computed(() => {
  const start = (currentPage.value - 1) * 10
  return empleadosFiltrados.value.slice(start, start + 10)
})

watch(searchTerm, () => { currentPage.value = 1 })

const puestos = ref([
  'Recepcionista',
  'Entrenador',
  'Profesor',
  'Mantenimiento',
  'Limpieza',
  'Administrativo',
  'Seguridad',
  'Coordinador',
  'Gerente'
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
.avatar-red {
  background-color: #dc2626 !important;
  color: white !important;
}
</style>
