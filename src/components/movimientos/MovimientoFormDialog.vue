<template>
  <Dialog 
    :visible="visible" 
    :modal="true" 
    :header="esEdicion ? 'Editar Movimiento' : 'Nuevo Movimiento'"
    :style="{ width: '600px' }"
    @update:visible="$emit('update:visible', $event)"
    class="p-dialog-custom"
  >
    <form @submit.prevent="guardarMovimiento" class="space-y-4">
      <!-- Tipo de movimiento -->
      <div class="grid">
        <div class="col-12">
          <label class="block text-sm font-medium mb-2 required">Tipo de Movimiento</label>
          <div class="flex gap-3">
            <div class="flex align-items-center">
              <RadioButton 
                v-model="form.tipo" 
                inputId="tipo_ingreso" 
                name="tipo" 
                value="ingreso" 
                :class="{ 'p-invalid': errors.tipo }"
              />
              <label for="tipo_ingreso" class="ml-2 text-green-600 font-medium">
                <i class="pi pi-arrow-down mr-1"></i>
                Ingreso
              </label>
            </div>
            <div class="flex align-items-center">
              <RadioButton 
                v-model="form.tipo" 
                inputId="tipo_egreso" 
                name="tipo" 
                value="egreso" 
                :class="{ 'p-invalid': errors.tipo }"
              />
              <label for="tipo_egreso" class="ml-2 text-red-600 font-medium">
                <i class="pi pi-arrow-up mr-1"></i>
                Egreso
              </label>
            </div>
          </div>
          <small class="p-error">{{ errors.tipo }}</small>
        </div>
      </div>

      <!-- Categoría y Concepto -->
      <div class="grid">
        <div class="col-12 md:col-6">
          <label class="block text-sm font-medium mb-2 required">Categoría</label>          <Dropdown 
            v-model="form.categoria" 
            :options="categoriasFiltradas"
            optionLabel="label"
            optionValue="value"
            placeholder="Seleccionar categoría"
            :class="{ 'p-invalid': errors.categoria }"
            class="w-full"
          />
          <small class="p-error">{{ errors.categoria }}</small>
        </div>
        
        <div class="col-12 md:col-6">
          <label class="block text-sm font-medium mb-2 required">Concepto</label>
          <InputText 
            v-model="form.concepto" 
            placeholder="Concepto del movimiento"
            :class="{ 'p-invalid': errors.concepto }"
            class="w-full"
          />
          <small class="p-error">{{ errors.concepto }}</small>
        </div>
      </div>

      <!-- Descripción -->
      <div class="grid">
        <div class="col-12">
          <label class="block text-sm font-medium mb-2">Descripción</label>
          <Textarea 
            v-model="form.descripcion" 
            placeholder="Descripción adicional (opcional)"
            :autoResize="true"
            rows="3"
            class="w-full"
          />
        </div>
      </div>

      <!-- Monto y Fecha -->
      <div class="grid">
        <div class="col-12 md:col-6">
          <label class="block text-sm font-medium mb-2 required">Monto</label>
          <div class="p-inputgroup">
            <span class="p-inputgroup-addon">$</span>
            <InputNumber 
              v-model="form.monto" 
              :minFractionDigits="2"
              :maxFractionDigits="2"
              :min="0"
              placeholder="0.00"
              :class="{ 'p-invalid': errors.monto }"
              class="w-full"
            />
          </div>
          <small class="p-error">{{ errors.monto }}</small>
        </div>
        
        <div class="col-12 md:col-6">
          <label class="block text-sm font-medium mb-2 required">Fecha</label>
          <Calendar 
            v-model="form.fecha" 
            dateFormat="dd/mm/yy"
            :showIcon="true"
            iconDisplay="input"
            placeholder="Seleccionar fecha"
            :maxDate="new Date()"
            :class="{ 'p-invalid': errors.fecha }"
            class="w-full"
          />
          <small class="p-error">{{ errors.fecha }}</small>
        </div>
      </div>

      <!-- Empleado (solo para sueldos) -->
      <div class="grid" v-if="mostrarEmpleado">
        <div class="col-12">          <label class="block text-sm font-medium mb-2">
            Empleado
            <span v-if="form.categoria === 'sueldos'" class="required">*</span>
          </label>
          <Dropdown 
            v-model="form.empleadoId" 
            :options="empleados" 
            optionLabel="nombreCompleto"
            optionValue="id"
            placeholder="Seleccionar empleado"
            :loading="loadingEmpleados"
            :class="{ 'p-invalid': errors.empleadoId }"
            :filter="true"
            filterPlaceholder="Buscar empleado..."
            class="w-full"
            :showClear="form.categoria !== 'sueldos'"
          />
          <small class="p-error">{{ errors.empleadoId }}</small>
        </div>
      </div>

      <!-- Comprobante -->
      <div class="grid">
        <div class="col-12 md:col-6">
          <label class="block text-sm font-medium mb-2">Número de Comprobante</label>
          <InputText 
            v-model="form.comprobante" 
            placeholder="Número de factura, recibo, etc. (opcional)"
            class="w-full"
          />
        </div>

        <div class="col-12 md:col-6">
          <label class="block text-sm font-medium mb-2">Método de Pago</label>
          <Dropdown
            v-model="form.metodoPago"
            :options="metodosPago"
            optionLabel="label"
            optionValue="value"
            placeholder="Seleccionar método (opcional)"
            :showClear="true"
            class="w-full"
          />
        </div>
      </div>

      <!-- Botones de acción -->
      <div class="flex justify-content-end gap-2 pt-4 border-top-1 surface-border">
        <Button 
          type="button" 
          label="Cancelar" 
          severity="secondary" 
          @click="cancelar"
          outlined
        />
        <Button 
          type="submit" 
          :label="esEdicion ? 'Guardar Cambios' : 'Crear Movimiento'" 
          :loading="loading"
          :disabled="!formularioValido"
        />
      </div>
    </form>
  </Dialog>
</template>

<script setup>
import { ref, watch, computed, onMounted } from 'vue'
import { movimientosService, empleadosService } from '@/services'
import Dialog from 'primevue/dialog'
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import InputNumber from 'primevue/inputnumber'
import Textarea from 'primevue/textarea'
import Dropdown from 'primevue/dropdown'
import Calendar from 'primevue/calendar'
import RadioButton from 'primevue/radiobutton'

// Props
const props = defineProps({
  visible: Boolean,
  movimiento: Object
})

// Emits
const emit = defineEmits(['update:visible', 'saved'])

// Estado
const loading = ref(false)
const loadingEmpleados = ref(false)
const empleados = ref([])
const errors = ref({})

// Formulario
const form = ref({
  tipo: 'ingreso',
  categoria: '',
  concepto: '',
  descripcion: '',
  monto: null,
  fecha: new Date(),
  empleadoId: null,
  comprobante: '',
  metodoPago: null
})

// Opciones de método de pago
const metodosPago = [
  { label: 'Efectivo', value: 'efectivo' },
  { label: 'Transferencia bancaria', value: 'transferencia' },
  { label: 'Tarjeta de débito', value: 'debito' },
  { label: 'Tarjeta de crédito', value: 'credito' },
  { label: 'Cheque', value: 'cheque' },
  { label: 'Mercado Pago', value: 'mercadopago' },
  { label: 'Otro', value: 'otro' },
]

// Categorías por tipo — deben coincidir con CategoriaLabels del backend
const categorias = {
  ingreso: [
    { value: 'cuota_socios',      label: 'Cuota de socios' },
    { value: 'factura_cobro',     label: 'Factura / Cobro' },
    { value: 'donacion',          label: 'Donación' },
    { value: 'evento',            label: 'Evento / Torneo' },
    { value: 'venta_productos',   label: 'Venta de productos' },
    { value: 'alquiler_espacios', label: 'Alquiler de espacios' },
    { value: 'subsidio',          label: 'Subsidio / Ayuda' },
    { value: 'otro_ingreso',      label: 'Otro ingreso' },
  ],
  egreso: [
    { value: 'sueldos',           label: 'Sueldos / Honorarios' },
    { value: 'factura_servicio',  label: 'Factura de servicios' },
    { value: 'compra_productos',  label: 'Compra de productos' },
    { value: 'mantenimiento',     label: 'Mantenimiento' },
    { value: 'evento_egreso',     label: 'Evento / Torneo' },
    { value: 'impuestos',         label: 'Impuestos / Tasas' },
    { value: 'otro_egreso',       label: 'Otro egreso' },
  ]
}

// Computed
const esEdicion = computed(() => !!props.movimiento?.id)

const categoriasFiltradas = computed(() => {
  return categorias[form.value.tipo] || []
})

const mostrarEmpleado = computed(() => {
  return form.value.categoria === 'sueldos'
})

const formularioValido = computed(() => {
  return form.value.tipo &&
         form.value.categoria &&
         form.value.concepto &&
         form.value.monto > 0 &&
         form.value.fecha &&
         (!mostrarEmpleado.value || form.value.empleadoId)
})

// Watchers
watch(() => props.visible, (newVal) => {
  if (newVal) {
    resetForm()
    if (props.movimiento) {
      cargarDatosMovimiento()
    }
    cargarEmpleados()
  }
})

watch(() => form.value.tipo, (newTipo, oldTipo) => {
  if (newTipo !== oldTipo) {
    form.value.categoria = ''
    form.value.empleadoId = null
  }
})

watch(() => form.value.categoria, (newCategoria) => {
  if (newCategoria !== 'sueldos') {
    form.value.empleadoId = null
  }
})

// Métodos
const resetForm = () => {
  form.value = {
    tipo: 'ingreso',
    categoria: '',
    concepto: '',
    descripcion: '',
    monto: null,
    fecha: new Date(),
    empleadoId: null,
    comprobante: '',
    metodoPago: null
  }
  errors.value = {}
}

const cargarDatosMovimiento = () => {
  if (props.movimiento) {
    form.value = {
      tipo: props.movimiento.tipo,
      categoria: props.movimiento.categoria,
      concepto: props.movimiento.concepto,
      descripcion: props.movimiento.descripcion || '',
      monto: props.movimiento.monto,
      fecha: new Date(props.movimiento.fecha),
      empleadoId: props.movimiento.empleadoId || null,
      comprobante: props.movimiento.comprobante || '',
      metodoPago: props.movimiento.metodoPago || null
    }
  }
}

const cargarEmpleados = async () => {
  try {
    loadingEmpleados.value = true
    const response = await empleadosService.getAll()
    empleados.value = response.map(emp => ({
      ...emp,
      nombreCompleto: `${emp.nombre} ${emp.apellido}`
    }))
  } catch (error) {
    console.error('Error cargando empleados:', error)
  } finally {
    loadingEmpleados.value = false
  }
}

const validarFormulario = () => {
  errors.value = {}
  
  if (!form.value.tipo) {
    errors.value.tipo = 'Selecciona el tipo de movimiento'
  }
  
  if (!form.value.categoria) {
    errors.value.categoria = 'Selecciona una categoría'
  }
  
  if (!form.value.concepto?.trim()) {
    errors.value.concepto = 'El concepto es requerido'
  }
  
  if (!form.value.monto || form.value.monto <= 0) {
    errors.value.monto = 'El monto debe ser mayor a 0'
  }
  
  if (!form.value.fecha) {
    errors.value.fecha = 'Selecciona una fecha'
  }
    if (form.value.categoria === 'sueldos' && !form.value.empleadoId) {
    errors.value.empleadoId = 'Selecciona un empleado para sueldos'
  }
  
  return Object.keys(errors.value).length === 0
}

const guardarMovimiento = async () => {
  if (!validarFormulario()) return
  
  try {
    loading.value = true
    
    const data = {
      tipo: form.value.tipo,
      categoria: form.value.categoria,
      concepto: form.value.concepto.trim(),
      descripcion: form.value.descripcion?.trim() || null,
      monto: form.value.monto,
      fecha: form.value.fecha.toISOString().split('T')[0],
      empleadoId: form.value.empleadoId || null,
      comprobante: form.value.comprobante?.trim() || null,
      metodoPago: form.value.metodoPago || null
    }
    
    if (esEdicion.value) {
      await movimientosService.update(props.movimiento.id, data)
    } else {
      await movimientosService.create(data)
    }
    
    emit('saved')
    emit('update:visible', false)
  } catch (error) {
    console.error('Error guardando movimiento:', error)
    // Aquí podrías mostrar un toast de error
  } finally {
    loading.value = false
  }
}

const cancelar = () => {
  emit('update:visible', false)
}

onMounted(() => {
  cargarEmpleados()
})
</script>

<style scoped>
.required::after {
  content: ' *';
  color: #ef4444;
}

.space-y-4 > * + * {
  margin-top: 1rem;
}

.p-dialog-custom {
  font-family: inherit;
}

.p-dialog-custom .p-dialog-header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-radius: 8px 8px 0 0;
}

.p-inputgroup .p-inputnumber {
  flex: 1;
}

.border-top-1 {
  border-top: 1px solid #e5e7eb;
}

.surface-border {
  border-color: #e5e7eb;
}
</style>
