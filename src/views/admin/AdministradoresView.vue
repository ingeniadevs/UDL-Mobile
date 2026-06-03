<template>
  <div>
    <div class="flex align-items-center justify-content-between mb-4">
      <h1 class="text-3xl font-bold page-title m-0">Administradores</h1>
      <Button label="Nuevo Administrador" icon="pi pi-plus" @click="openNew" />
    </div>

    <!-- Tabla -->
    <div class="card">
      <DataTable
        :value="admins"
        :loading="loading"
        paginator
        :rows="10"
        responsiveLayout="scroll"
        class="p-datatable-sm"
      >
        <template #empty>
          <div class="text-center py-4" style="color: var(--text-color-secondary)">
            No hay administradores registrados
          </div>
        </template>

        <Column field="nombre" header="Nombre" sortable />
        <Column field="email" header="Email" sortable />
        <Column field="alias" header="Alias" />        <Column field="rol" header="Rol" sortable>
          <template #body="{ data }">
            <Tag
              :value="rolLabel(data.rol)"
              :severity="rolSeverity(data.rol)"
            />
          </template>
        </Column>        <Column header="Secciones">
          <template #body="{ data }">
            <span v-if="data.rol === 'master'" style="color: var(--text-color-secondary); font-size: 0.8rem">
              <i class="pi pi-lock-open mr-1" style="color: #dc2626" />Acceso total
            </span>
            <span v-else style="color: var(--text-color-secondary); font-size: 0.8rem">
              {{ permisosCount(data.permisos) }} sección(es)
            </span>
          </template>
        </Column>        <Column header="Deporte">
          <template #body="{ data }">
            <span v-if="data.rol === 'master'" style="color: var(--text-color-secondary); font-size: 0.8rem">—</span>
            <Tag
              v-else-if="data.deporte"
              :value="deporteLabel(data.deporte)"
              severity="info"
            />
            <span v-else style="color: var(--text-color-secondary); font-size: 0.8rem">Sin deporte</span>
          </template>
        </Column>
        <Column header="Espacios asignados">
          <template #body="{ data }">
            <span v-if="data.rol === 'master'" style="color: var(--text-color-secondary); font-size: 0.8rem">
              <i class="pi pi-building mr-1" />Todos
            </span>
            <span v-else-if="data.espaciosAsignados && data.espaciosAsignados.length > 0" class="text-sm">
              <Tag
                v-for="e in data.espaciosAsignados.slice(0, 2)"
                :key="e.id"
                :value="e.nombre"
                severity="info"
                class="mr-1 mb-1"
              />
              <span v-if="data.espaciosAsignados.length > 2" class="text-gray-400 text-xs">
                +{{ data.espaciosAsignados.length - 2 }} más
              </span>
            </span>
            <span v-else style="color: var(--text-color-secondary); font-size: 0.8rem">Sin asignar</span>
          </template>
        </Column>
        <Column field="activo" header="Estado">
          <template #body="{ data }">
            <Tag
              :value="data.activo ? 'Activo' : 'Inactivo'"
              :severity="data.activo ? 'success' : 'danger'"
            />
          </template>
        </Column>
        <Column field="createdAt" header="Creado" sortable>
          <template #body="{ data }">
            {{ formatDate(data.createdAt) }}
          </template>
        </Column>        <Column header="Acciones" style="width: 10rem">
          <template #body="{ data }">
            <div class="flex gap-2">
              <Button
                icon="pi pi-building"
                text
                rounded
                severity="success"
                v-tooltip.top="'Asignar espacios'"
                :disabled="data.rol === 'master'"
                @click="openAsignarEspacios(data)"
              />
              <Button
                icon="pi pi-pencil"
                text
                rounded
                severity="info"
                v-tooltip.top="'Editar'"
                @click="openEdit(data)"
              />
              <Button
                icon="pi pi-trash"
                text
                rounded
                severity="danger"
                v-tooltip.top="'Eliminar'"
                :disabled="data.id === currentUserId"
                @click="confirmDelete(data)"
              />
            </div>
          </template>
        </Column>
      </DataTable>
    </div>

    <!-- Dialog crear/editar -->
    <Dialog
      v-model:visible="dialogVisible"
      :header="editMode ? 'Editar Administrador' : 'Nuevo Administrador'"
      :modal="true"
      :style="{ width: '480px' }"
      :closable="true"
    >
      <div class="flex flex-column gap-3 pt-2">
        <div class="field">
          <label class="font-medium block mb-1" style="color: var(--text-color)">Nombre *</label>
          <InputText v-model="form.nombre" class="w-full" placeholder="Nombre completo" />
        </div>
        <div class="field">
          <label class="font-medium block mb-1" style="color: var(--text-color)">Email *</label>
          <InputText v-model="form.email" class="w-full" placeholder="correo@ejemplo.com" type="email" />
        </div>
        <div class="field">
          <label class="font-medium block mb-1" style="color: var(--text-color)">Alias (login sin @)</label>
          <InputText v-model="form.alias" class="w-full" placeholder="ej: juan.perez" />
          <small style="color: var(--text-color-secondary)">Usado para iniciar sesión sin email</small>
        </div>        <div class="field">
          <label class="font-medium block mb-1" style="color: var(--text-color)">Rol *</label>
          <Dropdown
            v-model="form.rol"
            :options="roles"
            optionLabel="label"
            optionValue="value"
            class="w-full"
            placeholder="Seleccionar rol"
          />
          <div class="mt-2 p-2 border-round rol-info" style="background: var(--surface-section); border: 1px solid var(--surface-border)">
            <small style="color: var(--text-color-secondary)">
              <span v-if="form.rol === 'master'">🔴 <b>Master:</b> Acceso total + gestión de administradores</span>
              <span v-else-if="form.rol === 'admin'">🟡 <b>Admin:</b> Acceso a las secciones asignadas</span>
              <span v-else-if="form.rol === 'moderador'">🟢 <b>Moderador:</b> Solo lectura en secciones asignadas</span>
            </small>
          </div>
        </div>        <!-- Permisos granulares (solo para admin/moderador) -->
        <div v-if="form.rol !== 'master'" class="field">
          <label class="font-medium block mb-1" style="color: var(--text-color)">Deporte / Disciplina</label>
          <Dropdown
            v-model="form.deporte"
            :options="deportesOpciones"
            optionLabel="label"
            optionValue="value"
            class="w-full"
            placeholder="Sin restricción de deporte"
            showClear
          />
          <small style="color: var(--text-color-secondary)">
            Si se asigna, el admin verá las reservas de todos los espacios de ese deporte.
          </small>
        </div>

        <!-- Permisos granulares (solo para admin/moderador) -->
        <div v-if="form.rol !== 'master'" class="field">
          <label class="font-medium block mb-2" style="color: var(--text-color)">
            Secciones con acceso
          </label>
          <div class="permisos-grid">
            <div
              v-for="p in permisosDisponibles"
              :key="p.value"
              class="permiso-item"
              :class="{ 'permiso-activo': form.permisos.includes(p.value) }"
              @click="togglePermiso(p.value)"
            >
              <i :class="p.icon" class="permiso-icon" />
              <span class="permiso-label">{{ p.label }}</span>
              <i v-if="form.permisos.includes(p.value)" class="pi pi-check permiso-check" />
            </div>
          </div>
          <div class="flex gap-2 mt-2">
            <Button label="Todos" icon="pi pi-check-square" size="small" text @click="selectAllPermisos" />
            <Button label="Ninguno" icon="pi pi-stop" size="small" text severity="secondary" @click="form.permisos = []" />
          </div>
        </div>
        <div class="field">
          <label class="font-medium block mb-1" style="color: var(--text-color)">
            {{ editMode ? 'Nueva Contraseña (dejar vacío para no cambiar)' : 'Contraseña *' }}
          </label>
          <Password
            v-model="form.password"
            class="w-full"
            :placeholder="editMode ? 'Nueva contraseña (opcional)' : 'Mínimo 6 caracteres'"
            :feedback="false"
            toggleMask
            inputClass="w-full"
          />
        </div>
        <div v-if="editMode" class="field">
          <label class="font-medium block mb-1" style="color: var(--text-color)">Estado</label>
          <div class="flex align-items-center gap-2">
            <InputSwitch v-model="form.activo" />
            <span style="color: var(--text-color)">{{ form.activo ? 'Activo' : 'Inactivo' }}</span>
          </div>
        </div>
      </div>

      <template #footer>
        <Button label="Cancelar" icon="pi pi-times" text @click="dialogVisible = false" />
        <Button
          :label="editMode ? 'Actualizar' : 'Crear'"
          icon="pi pi-check"
          :loading="saving"
          @click="saveAdmin"
        />
      </template>
    </Dialog>    <!-- Confirm delete -->
    <ConfirmDialog />
    <Toast />

    <!-- Dialog Asignar Espacios -->
    <Dialog
      v-model:visible="asignarEspaciosVisible"
      :header="`Espacios asignados — ${asignarTarget?.nombre || ''}`"
      :modal="true"
      :style="{ width: '520px' }"
    >
      <div class="mb-3">
        <small style="color: var(--text-color-secondary)">
          <i class="pi pi-info-circle mr-1" />
          Este admin solo verá las reservas de los espacios seleccionados. Sin asignación, no verá ninguna reserva.
        </small>
      </div>
      <div v-if="loadingEspacios" class="text-center p-3">
        <i class="pi pi-spin pi-spinner" /> Cargando espacios...
      </div>
      <div v-else class="espacios-grid">
        <div
          v-for="esp in todosEspacios"
          :key="esp.id"
          class="espacio-item"
          :class="{ 'espacio-activo': asignarForm.includes(esp.id) }"
          @click="toggleEspacio(esp.id)"
        >
          <div class="flex align-items-center gap-2">
            <i class="pi pi-building espacio-icon" />
            <div>
              <div class="font-medium text-sm">{{ esp.nombre }}</div>
              <div class="text-xs" style="color: var(--text-color-secondary)">
                {{ esp.tipo }}<span v-if="esp.deporte"> · {{ deporteLabel(esp.deporte) }}</span>
              </div>
            </div>
          </div>
          <i v-if="asignarForm.includes(esp.id)" class="pi pi-check-circle text-green-400" />
        </div>
      </div>
      <div class="flex gap-2 mt-3">
        <Button label="Todos" icon="pi pi-check-square" size="small" text @click="asignarForm = todosEspacios.map(e => e.id)" />
        <Button label="Ninguno" icon="pi pi-stop" size="small" text severity="secondary" @click="asignarForm = []" />
      </div>
      <template #footer>
        <Button label="Cancelar" icon="pi pi-times" text @click="asignarEspaciosVisible = false" />
        <Button label="Guardar asignación" icon="pi pi-check" severity="success" :loading="savingEspacios" @click="saveAsignarEspacios" />
      </template>
    </Dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useConfirm } from 'primevue/useconfirm'
import { useToast } from 'primevue/usetoast'
import { useAuthStore } from '@/stores/auth'
import { adminsService, espaciosService } from '@/services'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Button from 'primevue/button'
import Tag from 'primevue/tag'
import Dialog from 'primevue/dialog'
import InputText from 'primevue/inputtext'
import Dropdown from 'primevue/dropdown'
import Password from 'primevue/password'
import InputSwitch from 'primevue/inputswitch'
import ConfirmDialog from 'primevue/confirmdialog'
import Toast from 'primevue/toast'

const confirm = useConfirm()
const toast = useToast()
const authStore = useAuthStore()

const admins = ref([])
const loading = ref(false)
const saving = ref(false)
const dialogVisible = ref(false)
const editMode = ref(false)
const selectedAdmin = ref(null)

// Asignar espacios
const asignarEspaciosVisible = ref(false)
const asignarTarget = ref(null)
const asignarForm = ref([])
const todosEspacios = ref([])
const loadingEspacios = ref(false)
const savingEspacios = ref(false)

const deportesOpciones = [
  { label: '🎾 Pádel', value: 'padel' },
  { label: '⚽ Fútbol', value: 'futbol' },
  { label: '🎾 Tenis', value: 'tenis' },
  { label: '🏀 Básquet', value: 'basquet' },
  { label: '🏊 Natación', value: 'natacion' },
  { label: '🏋️ Gimnasio', value: 'gimnasio' },
  { label: '🏛️ Salón', value: 'salon' },
  { label: '📦 Otro', value: 'otro' },
]

const deporteLabels = {
  padel: 'Pádel', futbol: 'Fútbol', tenis: 'Tenis', basquet: 'Básquet',
  natacion: 'Natación', gimnasio: 'Gimnasio', salon: 'Salón', otro: 'Otro'
}
function deporteLabel(d) { return deporteLabels[d] || d }

function toggleEspacio(id) {
  const idx = asignarForm.value.indexOf(id)
  if (idx === -1) asignarForm.value.push(id)
  else asignarForm.value.splice(idx, 1)
}

async function openAsignarEspacios(admin) {
  asignarTarget.value = admin
  asignarForm.value = []
  asignarEspaciosVisible.value = true
  loadingEspacios.value = true
  try {
    const [todos, asignados] = await Promise.all([
      espaciosService.getAll(),
      adminsService.getEspaciosAsignados(admin.id)
    ])
    todosEspacios.value = todos
    asignarForm.value = asignados.map(e => e.id)
  } catch (e) {
    toast.add({ severity: 'error', summary: 'Error', detail: 'No se pudieron cargar los espacios', life: 3000 })
  } finally {
    loadingEspacios.value = false
  }
}

async function saveAsignarEspacios() {
  savingEspacios.value = true
  try {
    await adminsService.asignarEspacios(asignarTarget.value.id, asignarForm.value)
    toast.add({ severity: 'success', summary: 'Guardado', detail: 'Espacios asignados correctamente', life: 3000 })
    asignarEspaciosVisible.value = false
    // Actualizar espaciosAsignados del admin en la lista local
    const updated = await adminsService.getEspaciosAsignados(asignarTarget.value.id)
    const idx = admins.value.findIndex(a => a.id === asignarTarget.value.id)
    if (idx !== -1) admins.value[idx].espaciosAsignados = updated
  } catch (e) {
    toast.add({ severity: 'error', summary: 'Error', detail: e.response?.data?.message || 'Error al guardar', life: 3000 })
  } finally {
    savingEspacios.value = false
  }
}

const currentUserId = computed(() => authStore.user?.id)

const roles = [
  { label: '🔴 Master (acceso total)', value: 'master' },
  { label: '🟡 Admin (secciones asignadas)', value: 'admin' },
  { label: '🟢 Moderador (solo lectura)', value: 'moderador' }
]

const permisosDisponibles = [
  { value: 'dashboard',    label: 'Dashboard',        icon: 'pi pi-home' },
  { value: 'socios',       label: 'Socios',            icon: 'pi pi-users' },
  { value: 'disciplinas',  label: 'Disciplinas',       icon: 'pi pi-bookmark' },
  { value: 'pagos',        label: 'Pagos',             icon: 'pi pi-dollar' },
  { value: 'productos',    label: 'Productos',         icon: 'pi pi-shopping-bag' },
  { value: 'pedidos',      label: 'Pedidos',           icon: 'pi pi-shopping-cart' },
  { value: 'empleados',    label: 'Empleados',         icon: 'pi pi-id-card' },
  { value: 'espacios',     label: 'Espacios',          icon: 'pi pi-building' },
  { value: 'reservas',     label: 'Reservas',          icon: 'pi pi-calendar' },
  { value: 'movimientos',  label: 'Ingresos/Egresos',  icon: 'pi pi-chart-bar' },
  { value: 'eventos',      label: 'Eventos',           icon: 'pi pi-star' },
]

function togglePermiso(valor) {
  const idx = form.value.permisos.indexOf(valor)
  if (idx === -1) form.value.permisos.push(valor)
  else form.value.permisos.splice(idx, 1)
}

function selectAllPermisos() {
  form.value.permisos = permisosDisponibles.map(p => p.value)
}

function permisosCount(permisosJson) {
  try {
    const arr = JSON.parse(permisosJson || '[]')
    return Array.isArray(arr) ? arr.length : 0
  } catch { return 0 }
}

const defaultForm = () => ({
  nombre: '',
  email: '',
  alias: '',
  rol: 'admin',
  password: '',
  activo: true,
  permisos: [],
  deporte: null
})

const form = ref(defaultForm())

function rolLabel(rol) {
  const map = { master: 'Master', admin: 'Admin', moderador: 'Moderador' }
  return map[rol] || rol
}

function rolSeverity(rol) {
  const map = { master: 'danger', admin: 'warning', moderador: 'success' }
  return map[rol] || 'info'
}

function formatDate(date) {
  if (!date) return '-'
  return new Date(date).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

async function loadAdmins() {
  loading.value = true
  try {
    const lista = await adminsService.getAll()
    // Cargar espacios asignados de cada admin (no-master) en paralelo
    await Promise.all(
      lista.map(async a => {
        if (a.rol !== 'master') {
          try {
            a.espaciosAsignados = await adminsService.getEspaciosAsignados(a.id)
          } catch { a.espaciosAsignados = [] }
        } else {
          a.espaciosAsignados = []
        }
      })
    )
    admins.value = lista
  } catch (e) {
    toast.add({ severity: 'error', summary: 'Error', detail: 'No se pudieron cargar los administradores', life: 3000 })
  } finally {
    loading.value = false
  }
}

function openNew() {
  editMode.value = false
  selectedAdmin.value = null
  form.value = defaultForm()
  dialogVisible.value = true
}

function openEdit(admin) {
  editMode.value = true
  selectedAdmin.value = admin
  form.value = {
    nombre: admin.nombre,
    email: admin.email,
    alias: admin.alias || '',
    rol: admin.rol,
    password: '',
    activo: admin.activo,
    deporte: admin.deporte || null,
    permisos: (() => {
      try { return JSON.parse(admin.permisos || '[]') } catch { return [] }
    })()
  }
  dialogVisible.value = true
}

async function saveAdmin() {
  if (!form.value.nombre || !form.value.email || !form.value.rol) {
    toast.add({ severity: 'warn', summary: 'Campos requeridos', detail: 'Nombre, email y rol son obligatorios', life: 3000 })
    return
  }
  if (!editMode.value && !form.value.password) {
    toast.add({ severity: 'warn', summary: 'Contraseña requerida', detail: 'Debes ingresar una contraseña', life: 3000 })
    return
  }
  saving.value = true
  try {
    const permisosJson = form.value.rol === 'master' ? '[]' : JSON.stringify(form.value.permisos)
    if (editMode.value) {      await adminsService.update(selectedAdmin.value.id, {
        nombre: form.value.nombre,
        email: form.value.email,
        alias: form.value.alias || null,
        rol: form.value.rol,
        permisos: permisosJson,
        activo: form.value.activo,
        nuevaPassword: form.value.password || null,
        deporte: form.value.deporte || null
      })
      toast.add({ severity: 'success', summary: 'Actualizado', detail: 'Administrador actualizado correctamente', life: 3000 })
    } else {      await adminsService.create({
        nombre: form.value.nombre,
        email: form.value.email,
        alias: form.value.alias || null,
        password: form.value.password,
        rol: form.value.rol,
        permisos: permisosJson,
        deporte: form.value.deporte || null
      })
      toast.add({ severity: 'success', summary: 'Creado', detail: 'Administrador creado correctamente', life: 3000 })
    }
    dialogVisible.value = false
    await loadAdmins()
  } catch (e) {
    const msg = e.response?.data?.message || e.message || 'Error al guardar'
    toast.add({ severity: 'error', summary: 'Error', detail: msg, life: 4000 })
  } finally {
    saving.value = false
  }
}

function confirmDelete(admin) {
  confirm.require({
    message: `¿Eliminar al administrador "${admin.nombre}"? Esta acción no se puede deshacer.`,
    header: 'Confirmar eliminación',
    icon: 'pi pi-exclamation-triangle',
    acceptClass: 'p-button-danger',
    accept: () => deleteAdmin(admin)
  })
}

async function deleteAdmin(admin) {
  try {
    await adminsService.delete(admin.id)
    toast.add({ severity: 'success', summary: 'Eliminado', detail: 'Administrador eliminado', life: 3000 })
    await loadAdmins()
  } catch (e) {
    const msg = e.response?.data?.message || 'Error al eliminar'
    toast.add({ severity: 'error', summary: 'Error', detail: msg, life: 4000 })
  }
}

onMounted(loadAdmins)
</script>

<style scoped>
.page-title {
  color: var(--text-color);
}

/* Grid de permisos */
.permisos-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.5rem;
}

.permiso-item {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.45rem 0.6rem;
  border-radius: 8px;
  border: 1px solid var(--surface-border);
  background: var(--surface-section);
  cursor: pointer;
  transition: all 0.15s;
  font-size: 0.8rem;
  color: var(--text-color-secondary);
  user-select: none;
}

.permiso-item:hover {
  border-color: #dc2626;
  color: #dc2626;
  background: rgba(220, 38, 38, 0.05);
}

.permiso-activo {
  border-color: #dc2626 !important;
  background: rgba(220, 38, 38, 0.1) !important;
  color: #dc2626 !important;
}

.permiso-icon {
  font-size: 0.85rem;
  flex-shrink: 0;
}

.permiso-label {
  flex: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.permiso-check {
  font-size: 0.7rem;
  flex-shrink: 0;
}

/* Grid de espacios */
.espacios-grid {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
  max-height: 340px;
  overflow-y: auto;
  padding-right: 4px;
}

.espacio-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.6rem 0.8rem;
  border-radius: 8px;
  border: 1px solid var(--surface-border);
  background: var(--surface-section);
  cursor: pointer;
  transition: all 0.15s;
  user-select: none;
}

.espacio-item:hover {
  border-color: #22c55e;
  background: rgba(34, 197, 94, 0.05);
}

.espacio-activo {
  border-color: #22c55e !important;
  background: rgba(34, 197, 94, 0.1) !important;
}

.espacio-icon {
  font-size: 1rem;
  color: var(--text-color-secondary);
}
</style>
