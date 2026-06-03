<template>
  <div class="planes-membresia-container">
    <div class="header">
      <div>
        <h1>Planes de Membresía</h1>
        <p class="subtitle">Gestión de planes y cuotas del club</p>
      </div>
      <Button label="+ Nuevo Plan" @click="openCreateDialog" severity="danger" />
    </div>

    <!-- Estadísticas -->
    <div class="stats-grid">
      <Card class="stat-card">
        <template #content>
          <div class="stat-content">
            <div class="stat-number">{{ estadisticas.planesActivos }}</div>
            <div class="stat-label">Planes activos</div>
          </div>
        </template>
      </Card>
      <Card class="stat-card">
        <template #content>
          <div class="stat-content">
            <div class="stat-number">{{ estadisticas.planesCreados }}</div>
            <div class="stat-label">Planes creados</div>
          </div>
        </template>
      </Card>
      <Card class="stat-card highlight">
        <template #content>
          <div class="stat-content">
            <div class="stat-number">{{ formatCurrency(estadisticas.ingresoMensualEstimado) }}</div>
            <div class="stat-label">Ingreso mensual estimado</div>
          </div>
        </template>
      </Card>
    </div>

    <!-- Lista de planes -->
    <div class="planes-grid">
      <Card v-for="plan in planes" :key="plan.id" class="plan-card" :class="{ inactive: !plan.activo }">
        <template #content>
          <div class="plan-header">
            <div>
              <Tag :value="plan.tipoPlan" :severity="getPlanSeverity(plan.tipoPlan)" class="plan-tag" />
              <h3 class="plan-nombre">{{ plan.nombre }}</h3>
              <p class="plan-descripcion">{{ plan.descripcion }}</p>
            </div>
          </div>

          <div class="plan-body">
            <div class="plan-precio">
              <span class="precio-simbolo">$</span>
              <span class="precio-monto">{{ formatPrice(plan.precioMensual) }}</span>
              <span class="precio-periodo">/ mes</span>
            </div>

            <div class="plan-detalles">
              <div class="detalle-item">
                <i class="pi pi-users"></i>
                <span>{{ plan.cupoMayores }} mayor{{ plan.cupoMayores > 1 ? 'es' : '' }}</span>
              </div>
              <div v-if="plan.cupoMenores > 0" class="detalle-item">
                <i class="pi pi-user"></i>
                <span>{{ plan.cupoMenores }} menor{{ plan.cupoMenores > 1 ? 'es' : '' }}</span>
              </div>
              <div class="detalle-item">
                <i class="pi pi-id-card"></i>
                <span>{{ plan.sociosActivos }} socio{{ plan.sociosActivos !== 1 ? 's' : '' }} activo{{ plan.sociosActivos !== 1 ? 's' : '' }}</span>
              </div>
            </div>

            <div class="plan-estado">
              <InputSwitch v-model="plan.activo" @change="togglePlanActivo(plan)" />
              <span>Plan {{ plan.activo ? 'activo' : 'inactivo' }}</span>
            </div>
          </div>

          <div class="plan-actions">
            <Button icon="pi pi-pencil" label="Editar" @click="openEditDialog(plan)" text />
            <Button icon="pi pi-trash" severity="danger" @click="confirmDelete(plan)" text />
          </div>
        </template>
      </Card>
    </div>

    <!-- Dialog Crear/Editar Plan -->
    <Dialog v-model:visible="dialogVisible" :header="isEditing ? 'Editar Plan' : 'Nuevo Plan'" :modal="true" class="plan-dialog">
      <div class="dialog-content">
        <div class="form-group">
          <label for="nombre">Nombre del Plan *</label>
          <InputText id="nombre" v-model="planForm.nombre" placeholder="Ej: Grupo Familiar I" />
        </div>

        <div class="form-group">
          <label for="descripcion">Descripción</label>
          <Textarea id="descripcion" v-model="planForm.descripcion" rows="3" placeholder="1 mayor + 1 menor" />
        </div>

        <div class="form-group">
          <label for="precioMensual">Precio mensual (ARS) *</label>
          <InputNumber 
            id="precioMensual" 
            v-model="planForm.precioMensual" 
            mode="currency" 
            currency="ARS" 
            locale="es-AR"
            :minFractionDigits="2"
          />
        </div>

        <div class="form-group">
          <label for="tipoPlan">Tipo de plan *</label>
          <Dropdown 
            id="tipoPlan" 
            v-model="planForm.tipoPlan" 
            :options="tiposPlan" 
            optionLabel="label" 
            optionValue="value"
            placeholder="Seleccionar tipo"
          />
        </div>

        <div class="form-row">
          <div class="form-group">
            <label for="cupoMayores">Cupo mayores (≥18) *</label>
            <InputNumber id="cupoMayores" v-model="planForm.cupoMayores" :min="0" showButtons />
          </div>

          <div class="form-group">
            <label for="cupoMenores">Cupo menores (<18)</label>
            <InputNumber id="cupoMenores" v-model="planForm.cupoMenores" :min="0" showButtons />
          </div>
        </div>

        <div class="form-group checkbox-group">
          <Checkbox id="activo" v-model="planForm.activo" :binary="true" />
          <label for="activo">Plan activo</label>
        </div>

        <!-- Vista previa -->
        <div class="vista-previa">
          <h4>VISTA PREVIA</h4>
          <div class="preview-card">
            <h3>{{ planForm.nombre || 'Nombre del Plan' }}</h3>
            <p>{{ planForm.descripcion || 'Descripción' }}</p>
            <div class="preview-precio">$ {{ formatPrice(planForm.precioMensual || 0) }}</div>
            <div class="preview-detalles">
              <span>{{ planForm.cupoMayores }} mayor{{ planForm.cupoMayores > 1 ? 'es' : '' }}</span>
              <span v-if="planForm.cupoMenores > 0"> · {{ planForm.cupoMenores }} menor{{ planForm.cupoMenores > 1 ? 'es' : '' }}</span>
            </div>
          </div>
        </div>
      </div>

      <template #footer>
        <Button label="Cancelar" @click="dialogVisible = false" text />
        <Button label="Guardar cambios" @click="savePlan" severity="danger" :loading="saving" />
      </template>
    </Dialog>

    <!-- Dialog Confirmación Eliminar -->
    <Dialog v-model:visible="deleteDialogVisible" header="Confirmar eliminación" :modal="true">
      <p>¿Está seguro que desea eliminar el plan <strong>{{ planToDelete?.nombre }}</strong>?</p>
      <p v-if="planToDelete?.sociosActivos > 0" class="warning-text">
        <i class="pi pi-exclamation-triangle"></i>
        Este plan tiene {{ planToDelete.sociosActivos }} socio(s) activo(s) asociado(s).
      </p>
      <template #footer>
        <Button label="Cancelar" @click="deleteDialogVisible = false" text />
        <Button label="Eliminar" @click="deletePlan" severity="danger" :loading="deleting" />
      </template>
    </Dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useToast } from 'primevue/usetoast';
import { planesService } from '@/services/planesService';
import Button from 'primevue/button';
import Card from 'primevue/card';
import Dialog from 'primevue/dialog';
import InputText from 'primevue/inputtext';
import Textarea from 'primevue/textarea';
import InputNumber from 'primevue/inputnumber';
import Dropdown from 'primevue/dropdown';
import InputSwitch from 'primevue/inputswitch';
import Checkbox from 'primevue/checkbox';
import Tag from 'primevue/tag';

const toast = useToast();

const planes = ref([]);
const estadisticas = ref({
  planesActivos: 0,
  planesCreados: 0,
  ingresoMensualEstimado: 0
});

const dialogVisible = ref(false);
const deleteDialogVisible = ref(false);
const isEditing = ref(false);
const saving = ref(false);
const deleting = ref(false);

const planForm = ref({
  nombre: '',
  descripcion: '',
  precioMensual: 0,
  tipoPlan: 'Individual',
  cupoMayores: 1,
  cupoMenores: 0,
  activo: true
});

const planToDelete = ref(null);

const tiposPlan = [
  { label: 'Individual', value: 'Individual' },
  { label: 'Familiar', value: 'Familiar' },
  { label: 'Jubilado', value: 'Jubilado' }
];

const loadPlanes = async () => {
  try {
    planes.value = await planesService.getAll();
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'No se pudieron cargar los planes',
      life: 3000
    });
  }
};

const loadEstadisticas = async () => {
  try {
    estadisticas.value = await planesService.getEstadisticas();
  } catch (error) {
    console.error('Error cargando estadísticas:', error);
  }
};

const openCreateDialog = () => {
  isEditing.value = false;
  planForm.value = {
    nombre: '',
    descripcion: '',
    precioMensual: 0,
    tipoPlan: 'Individual',
    cupoMayores: 1,
    cupoMenores: 0,
    activo: true
  };
  dialogVisible.value = true;
};

const openEditDialog = (plan) => {
  isEditing.value = true;
  planForm.value = {
    id: plan.id,
    nombre: plan.nombre,
    descripcion: plan.descripcion,
    precioMensual: plan.precioMensual,
    tipoPlan: plan.tipoPlan,
    cupoMayores: plan.cupoMayores,
    cupoMenores: plan.cupoMenores,
    activo: plan.activo
  };
  dialogVisible.value = true;
};

const savePlan = async () => {
  try {
    saving.value = true;

    if (!planForm.value.nombre || planForm.value.precioMensual <= 0) {
      toast.add({
        severity: 'warn',
        summary: 'Validación',
        detail: 'Complete todos los campos requeridos',
        life: 3000
      });
      return;
    }

    if (isEditing.value) {
      await planesService.update(planForm.value.id, planForm.value);
      toast.add({
        severity: 'success',
        summary: 'Éxito',
        detail: 'Plan actualizado correctamente',
        life: 3000
      });
    } else {
      await planesService.create(planForm.value);
      toast.add({
        severity: 'success',
        summary: 'Éxito',
        detail: 'Plan creado correctamente',
        life: 3000
      });
    }

    dialogVisible.value = false;
    await loadPlanes();
    await loadEstadisticas();
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: error.response?.data?.message || 'Error al guardar el plan',
      life: 3000
    });
  } finally {
    saving.value = false;
  }
};

const confirmDelete = (plan) => {
  planToDelete.value = plan;
  deleteDialogVisible.value = true;
};

const deletePlan = async () => {
  try {
    deleting.value = true;
    await planesService.delete(planToDelete.value.id);
    
    toast.add({
      severity: 'success',
      summary: 'Éxito',
      detail: 'Plan eliminado correctamente',
      life: 3000
    });

    deleteDialogVisible.value = false;
    await loadPlanes();
    await loadEstadisticas();
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: error.response?.data?.message || 'Error al eliminar el plan',
      life: 3000
    });
  } finally {
    deleting.value = false;
  }
};

const togglePlanActivo = async (plan) => {
  try {
    await planesService.update(plan.id, { activo: plan.activo });
    toast.add({
      severity: 'success',
      summary: 'Éxito',
      detail: `Plan ${plan.activo ? 'activado' : 'desactivado'} correctamente`,
      life: 3000
    });
    await loadEstadisticas();
  } catch (error) {
    // Revertir el cambio
    plan.activo = !plan.activo;
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'Error al cambiar el estado del plan',
      life: 3000
    });
  }
};

const getPlanSeverity = (tipoPlan) => {
  const severityMap = {
    'Individual': 'info',
    'Familiar': 'success',
    'Jubilado': 'warning'
  };
  return severityMap[tipoPlan] || 'info';
};

const formatPrice = (price) => {
  return new Intl.NumberFormat('es-AR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(price);
};

const formatCurrency = (amount) => {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
};

onMounted(() => {
  loadPlanes();
  loadEstadisticas();
});
</script>

<style scoped>
.planes-membresia-container {
  padding: 2rem;
  max-width: 1400px;
  margin: 0 auto;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
}

.header h1 {
  margin: 0;
  font-size: 2rem;
  color: var(--text-color);
}

.subtitle {
  color: var(--text-color-secondary);
  margin-top: 0.5rem;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.stat-card {
  background: var(--surface-card);
  border: 1px solid var(--surface-border);
}

.stat-card.highlight {
  border: 1px solid #dc2626;
  background: var(--surface-card);
}

.stat-content {
  padding: 1rem;
}

.stat-number {
  font-size: 2rem;
  font-weight: bold;
  color: #dc2626;
  margin-bottom: 0.5rem;
}

.stat-label {
  color: var(--text-color-secondary);
  font-size: 0.9rem;
}

.planes-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 1.5rem;
}

.plan-card {
  background: var(--surface-card);
  border: 1px solid var(--surface-border);
  transition: all 0.3s ease;
}

.plan-card:hover {
  border-color: #dc2626;
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(220, 38, 38, 0.2);
}

.plan-card.inactive {
  opacity: 0.6;
}

.plan-header {
  margin-bottom: 1.5rem;
}

.plan-tag {
  margin-bottom: 0.5rem;
}

.plan-nombre {
  font-size: 1.5rem;
  margin: 0.5rem 0;
  color: var(--text-color);
}

.plan-descripcion {
  color: var(--text-color-secondary);
  font-size: 0.9rem;
}

.plan-body {
  border-top: 1px solid var(--surface-border);
  border-bottom: 1px solid var(--surface-border);
  padding: 1.5rem 0;
  margin: 1.5rem 0;
}

.plan-precio {
  text-align: center;
  margin-bottom: 1.5rem;
}

.precio-simbolo {
  font-size: 1.5rem;
  color: #dc2626;
  vertical-align: super;
}

.precio-monto {
  font-size: 3rem;
  font-weight: bold;
  color: #dc2626;
}

.precio-periodo {
  color: var(--text-color-secondary);
  font-size: 1rem;
}

.plan-detalles {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  margin-bottom: 1.5rem;
}

.detalle-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  color: var(--text-color-secondary);
}

.detalle-item i {
  color: #dc2626;
  font-size: 1.1rem;
}

.plan-estado {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  justify-content: center;
}

.plan-actions {
  display: flex;
  gap: 1rem;
  justify-content: center;
  padding-top: 1rem;
}

.plan-dialog {
  width: 600px;
  max-width: 90vw;
}

.dialog-content {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.form-group label {
  font-weight: 500;
  color: var(--text-color);
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

.checkbox-group {
  flex-direction: row;
  align-items: center;
}

.checkbox-group label {
  margin-left: 0.5rem;
}

.vista-previa {
  background: var(--surface-hover);
  padding: 1.5rem;
  border-radius: 8px;
  border: 1px solid var(--surface-border);
}

.vista-previa h4 {
  margin: 0 0 1rem 0;
  color: var(--text-color-secondary);
  font-size: 0.85rem;
  letter-spacing: 1px;
}

.preview-card {
  background: var(--surface-card);
  padding: 1.5rem;
  border-radius: 8px;
  text-align: center;
  border: 1px solid #dc2626;
}

.preview-card h3 {
  margin: 0 0 0.5rem 0;
  color: var(--text-color);
}

.preview-card p {
  color: var(--text-color-secondary);
  margin: 0 0 1rem 0;
}

.preview-precio {
  font-size: 2rem;
  font-weight: bold;
  color: #dc2626;
  margin: 1rem 0;
}

.preview-detalles {
  color: var(--text-color-secondary);
  font-size: 0.9rem;
}

.warning-text {
  color: #f59e0b;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-top: 1rem;
}

@media (max-width: 768px) {
  .planes-membresia-container {
    padding: 1rem;
  }

  .header {
    flex-direction: column;
    gap: 1rem;
    align-items: flex-start;
  }

  .planes-grid {
    grid-template-columns: 1fr;
  }

  .form-row {
    grid-template-columns: 1fr;
  }
}
</style>
