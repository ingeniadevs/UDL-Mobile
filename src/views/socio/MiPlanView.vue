<template>
  <div class="mi-plan-container">
    <div class="header">
      <div>
        <h1>Mi Plan de Membresía</h1>
        <p class="subtitle">Gestiona tu plan y adherentes</p>
      </div>
    </div>

    <div v-if="loading" class="loading-container">
      <ProgressSpinner />
    </div>

    <div v-else-if="!planActual" class="sin-plan-container">
      <Card>
        <template #content>
          <div class="sin-plan-content">
            <i class="pi pi-info-circle"></i>
            <h2>No tienes un plan asignado</h2>
            <p>Contacta con el club para que te asignen un plan de membresía</p>
          </div>
        </template>
      </Card>
    </div>

    <div v-else class="content-grid">
      <!-- Plan Actual -->
      <Card class="plan-actual-card">
        <template #header>
          <div class="plan-header">
            <Tag :value="planActual.tipoPlan" :severity="getPlanSeverity(planActual.tipoPlan)" />
          </div>
        </template>        <template #content>
          <h2 class="plan-nombre">{{ planActual.nombre }}</h2>
          <p class="plan-descripcion">{{ planActual.descripcion }}</p>
          
          <div class="plan-precio">
            <span class="precio-simbolo">$</span>
            <span class="precio-monto">{{ formatPrice(planActual.precioMensual) }}</span>
            <span class="precio-periodo">/ mes</span>
          </div>

          <Divider />

          <!-- Cuota Mensual -->
          <div class="desglose-cuotas-plan">
            <h3>💰 Tu Cuota Mensual</h3>
            <div class="desglose-items">
              <div class="desglose-item">
                <span class="desglose-label">
                  <i class="pi pi-home"></i>
                  Membresía del Club
                </span>
                <span class="desglose-valor text-green-400">${{ formatPrice(planActual.precioMensual) }}</span>
              </div>
              
              <Divider class="my-2" />
              
              <div class="desglose-total">
                <span class="total-label">Total Mensual</span>
                <span class="total-valor">${{ formatPrice(planActual.precioMensual) }}</span>
              </div>
            </div>
          </div>

          <Divider />

          <div class="plan-capacidad">
            <h3>Capacidad del Plan</h3>
            <div class="capacidad-items">
              <div class="capacidad-item">
                <div class="capacidad-label">
                  <i class="pi pi-users"></i>
                  <span>Mayores (≥18 años)</span>
                </div>
                <div class="capacidad-valor">
                  <span class="usado">{{ adherentesMayores.length + 1 }}</span>
                  <span class="separador">/</span>
                  <span class="total">{{ planActual.cupoMayores }}</span>
                </div>
              </div>
              <ProgressBar 
                :value="((adherentesMayores.length + 1) / planActual.cupoMayores) * 100"
                :showValue="false"
                class="capacidad-bar"
              />

              <div v-if="planActual.cupoMenores > 0" class="capacidad-item">
                <div class="capacidad-label">
                  <i class="pi pi-user"></i>
                  <span>Menores (<18 años)</span>
                </div>
                <div class="capacidad-valor">
                  <span class="usado">{{ adherentesMenores.length }}</span>
                  <span class="separador">/</span>
                  <span class="total">{{ planActual.cupoMenores }}</span>
                </div>
              </div>
              <ProgressBar 
                v-if="planActual.cupoMenores > 0"
                :value="(adherentesMenores.length / planActual.cupoMenores) * 100"
                :showValue="false"
                class="capacidad-bar"
              />
            </div>
          </div>
        </template>
      </Card>

      <!-- Adherentes -->
      <Card class="adherentes-card">
        <template #header>
          <div class="adherentes-header">
            <h3>Mis Adherentes</h3>
            <Button 
              v-if="puedesAgregarAdherente"
              label="Agregar Adherente" 
              icon="pi pi-plus" 
              @click="mostrarDialogAgregarAdherente = true"
              severity="danger"
              size="small"
            />
          </div>
        </template>
        <template #content>
          <div v-if="adherentes.length === 0" class="sin-adherentes">
            <i class="pi pi-users"></i>
            <p>No tienes adherentes en tu plan</p>
            <Button 
              v-if="puedesAgregarAdherente"
              label="Agregar el primero" 
              @click="mostrarDialogAgregarAdherente = true"
              text
            />
          </div>

          <div v-else class="adherentes-lista">
            <div v-for="adherente in adherentes" :key="adherente.id" class="adherente-item">
              <Avatar 
                v-if="adherente.foto"
                :image="adherente.foto"
                size="large"
                shape="circle"
              />
              <Avatar 
                v-else
                :label="adherente.nombre?.charAt(0).toUpperCase()" 
                size="large"
                shape="circle"
                class="avatar-red"
              />
                <div class="adherente-info">
                <h4>{{ adherente.nombre }} {{ adherente.apellido }}</h4>
                <p>Socio #{{ adherente.numeroSocio }}</p>
                <div class="adherente-detalles">
                  <Tag 
                    v-if="adherente.fechaNacimiento"
                    :value="calcularEdad(adherente.fechaNacimiento) >= 18 ? 'Mayor' : 'Menor'" 
                    :severity="calcularEdad(adherente.fechaNacimiento) >= 18 ? 'info' : 'warning'" 
                    size="small" 
                  />
                  <span class="detalle-item">
                    <i class="pi pi-check-circle" style="color: var(--green-400)"></i>
                    Cuota incluida en plan familiar
                  </span>
                </div>
              </div>

            </div>
          </div>
        </template>
      </Card>

      <!-- Planes Disponibles (para cambiar) -->
      <Card v-if="planesDisponibles.length > 0" class="planes-disponibles-card">
        <template #header>
          <div class="adherentes-header">
            <h3>Otros Planes Disponibles</h3>
          </div>
        </template>
        <template #content>
          <div class="planes-grid">
            <div 
              v-for="plan in planesDisponibles" 
              :key="plan.id" 
              class="plan-disponible"
              :class="{ recomendado: plan.id === planRecomendado?.id }"
            >
              <Tag 
                v-if="plan.id === planRecomendado?.id"
                value="Recomendado"
                severity="success"
                class="tag-recomendado"
              />
              <Tag :value="plan.tipoPlan" :severity="getPlanSeverity(plan.tipoPlan)" class="tag-tipo" />
              <h4>{{ plan.nombre }}</h4>
              <p class="plan-desc">{{ plan.descripcion }}</p>
              <div class="plan-precio-small">
                ${{ formatPrice(plan.precioMensual) }}/mes
              </div>
              <div class="plan-cupos">
                <span><i class="pi pi-users"></i> {{ plan.cupoMayores }} mayores</span>
                <span v-if="plan.cupoMenores > 0"><i class="pi pi-user"></i> {{ plan.cupoMenores }} menores</span>
              </div>
            </div>
          </div>
        </template>
      </Card>
    </div>

    <!-- Dialog: Cambiar Plan -->
    <Dialog 
      v-model:visible="mostrarDialogCambiarPlan" 
      header="Cambiar Plan de Membresía"
      :modal="true"
      :style="{ width: '600px' }"
    >
      <div class="dialog-content">
        <div class="plan-comparison">
          <div class="plan-col">
            <h4>Plan Actual</h4>
            <div class="plan-box">
              <h3>{{ planActual.nombre }}</h3>
              <div class="precio">${{ formatPrice(planActual.precioMensual) }}</div>
              <p>{{ adherentes.length + 1 }} personas en el plan</p>
            </div>
          </div>
          <i class="pi pi-arrow-right arrow-icon"></i>
          <div class="plan-col">
            <h4>Nuevo Plan</h4>
            <Dropdown
              v-model="planSeleccionado"
              :options="planesDisponiblesFiltrados"
              optionLabel="nombre"
              placeholder="Seleccionar plan"
              class="w-full"
            >
              <template #value="slotProps">
                <div v-if="slotProps.value">
                  <div>{{ slotProps.value.nombre }}</div>
                  <small>${{ formatPrice(slotProps.value.precioMensual) }}/mes</small>
                </div>
              </template>
              <template #option="slotProps">
                <div>
                  <div class="font-bold">{{ slotProps.option.nombre }}</div>
                  <div class="text-sm">${{ formatPrice(slotProps.option.precioMensual) }}/mes - {{ slotProps.option.cupoMayores }}M + {{ slotProps.option.cupoMenores }}m</div>
                </div>
              </template>
            </Dropdown>
          </div>
        </div>

        <Message v-if="planSeleccionado" :severity="getDiferenciaSeverity()">
          <template v-if="planSeleccionado.precioMensual > planActual.precioMensual">
            <strong>Upgrade:</strong> El nuevo plan cuesta ${{ formatPrice(planSeleccionado.precioMensual - planActual.precioMensual) }} más por mes
          </template>
          <template v-else-if="planSeleccionado.precioMensual < planActual.precioMensual">
            <strong>Downgrade:</strong> Ahorrarás ${{ formatPrice(planActual.precioMensual - planSeleccionado.precioMensual) }} por mes
          </template>
          <template v-else>
            Mismo precio mensual
          </template>
        </Message>

        <div v-if="planSeleccionado" class="cambio-info">
          <h4>⚠️ Importante:</h4>
          <ul>
            <li>El cambio se aplicará desde el próximo período de facturación</li>
            <li>Tus adherentes actuales se mantendrán si el nuevo plan tiene capacidad</li>
            <li v-if="planSeleccionado.precioMensual > planActual.precioMensual">
              Se ajustará el monto de tu próxima cuota
            </li>
          </ul>
        </div>
      </div>

      <template #footer>
        <Button label="Cancelar" @click="mostrarDialogCambiarPlan = false" text />
        <Button 
          label="Confirmar Cambio" 
          @click="confirmarCambioPlan" 
          severity="danger"
          :disabled="!planSeleccionado"
          :loading="cambiandoPlan"
        />
      </template>
    </Dialog>

    <!-- Dialog: Agregar Adherente -->
    <Dialog 
      v-model:visible="mostrarDialogAgregarAdherente" 
      header="Agregar Adherente al Plan"
      :modal="true"
      :style="{ width: '600px' }"
    >
      <div class="dialog-content">        <Message severity="info">
          Tu plan <strong>{{ planActual.nombre }}</strong> incluye el costo para todos los adherentes. 
          No se cobra cuota individual por persona.
        </Message>

        <Message severity="warn">
          Espacios disponibles: 
          <strong v-if="espaciosDisponibles.mayores > 0">{{ espaciosDisponibles.mayores }} mayor(es) (≥18 años)</strong>
          <span v-if="espaciosDisponibles.mayores > 0 && espaciosDisponibles.menores > 0"> y </span>
          <strong v-if="espaciosDisponibles.menores > 0">{{ espaciosDisponibles.menores }} menor(es) (<18 años)</strong>
        </Message>

        <div class="form-group">
          <label>Nombre *</label>
          <InputText v-model="nuevoAdherente.nombre" placeholder="Nombre" class="w-full" />
        </div>

        <div class="form-group">
          <label>Apellido *</label>
          <InputText v-model="nuevoAdherente.apellido" placeholder="Apellido" class="w-full" />
        </div>

        <div class="form-group">
          <label>Email *</label>
          <InputText v-model="nuevoAdherente.email" type="email" placeholder="email@ejemplo.com" class="w-full" />
        </div>

        <div class="form-group">
          <label>Contraseña *</label>
          <Password v-model="nuevoAdherente.password" placeholder="Contraseña" class="w-full" toggleMask />
        </div>

        <div class="form-row">
          <div class="form-group">
            <label>DNI</label>
            <InputText v-model="nuevoAdherente.dni" placeholder="12345678" class="w-full" />
          </div>

          <div class="form-group">
            <label>Teléfono *</label>
            <InputText v-model="nuevoAdherente.telefono" placeholder="1234567890" class="w-full" />
          </div>
        </div>

        <div class="form-group">
          <label>Fecha de Nacimiento *</label>
          <Calendar 
            v-model="nuevoAdherente.fechaNacimiento" 
            dateFormat="dd/mm/yy"
            placeholder="Seleccionar fecha"
            :maxDate="new Date()"
            showIcon
            class="w-full"
          />
          <small v-if="nuevoAdherente.fechaNacimiento" class="edad-info">
            Edad: {{ calcularEdadDesdeNacimiento(nuevoAdherente.fechaNacimiento) }} años
            <span :class="calcularEdadDesdeNacimiento(nuevoAdherente.fechaNacimiento) >= 18 ? 'text-blue-400' : 'text-orange-400'">
              ({{ calcularEdadDesdeNacimiento(nuevoAdherente.fechaNacimiento) >= 18 ? 'Mayor' : 'Menor' }})
            </span>
          </small>
        </div>

        <Divider />

        <div class="form-group checkbox-group">
          <Checkbox v-model="nuevoAdherente.pagaCuotaElAdherente" :binary="true" inputId="pagaCuota" />
          <label for="pagaCuota">El adherente paga su propia cuota</label>
        </div>

        <div class="form-group checkbox-group">
          <Checkbox v-model="nuevoAdherente.pagaDisciplinasElAdherente" :binary="true" inputId="pagaDisciplinas" />
          <label for="pagaDisciplinas">El adherente paga sus propias disciplinas</label>
        </div>
      </div>

      <template #footer>
        <Button label="Cancelar" @click="mostrarDialogAgregarAdherente = false" text />
        <Button 
          label="Agregar Adherente" 
          @click="agregarAdherente" 
          severity="danger"
          :loading="agregandoAdherente"
        />
      </template>
    </Dialog>

    <!-- Dialog: Confirmar Quitar Adherente -->
    <Dialog 
      v-model:visible="mostrarDialogQuitarAdherente" 
      header="Confirmar Eliminación"
      :modal="true"
      :style="{ width: '450px' }"
    >
      <div class="dialog-content">
        <p>¿Estás seguro que deseas quitar a <strong>{{ adherenteAQuitar?.nombre }} {{ adherenteAQuitar?.apellido }}</strong> de tu plan?</p>
        
        <Message severity="warn">
          Esta acción no se puede deshacer. El adherente perderá acceso al plan familiar.
        </Message>
      </div>

      <template #footer>
        <Button label="Cancelar" @click="mostrarDialogQuitarAdherente = false" text />
        <Button 
          label="Quitar del Plan" 
          @click="quitarAdherente" 
          severity="danger"
          :loading="quitandoAdherente"
        />
      </template>
    </Dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useToast } from 'primevue/usetoast';
import { useAuthStore } from '@/stores/auth';
import { planesService } from '@/services/planesService';
import { sociosService } from '@/services';
import Card from 'primevue/card';
import Button from 'primevue/button';
import Tag from 'primevue/tag';
import { getPlanTypeSeverity } from '@/utils/planTypes';
import Divider from 'primevue/divider';
import ProgressBar from 'primevue/progressbar';
import ProgressSpinner from 'primevue/progressspinner';
import Dialog from 'primevue/dialog';
import Dropdown from 'primevue/dropdown';
import InputText from 'primevue/inputtext';
import InputNumber from 'primevue/inputnumber';
import Password from 'primevue/password';
import Checkbox from 'primevue/checkbox';
import Message from 'primevue/message';
import Avatar from 'primevue/avatar';
import Calendar from 'primevue/calendar';
import {
  toLocalCalendarDate,
  normalizeReservaFechaForApi,
  calcularEdadDesdeFechaNacimiento
} from '@/utils/reservationDates';

const toast = useToast();
const authStore = useAuthStore();

const loading = ref(true);
const socioActual = ref(null);
const planActual = ref(null);
const adherentes = ref([]);
const todosLosPlanes = ref([]);
const misDisciplinasActivas = ref([]);

const mostrarDialogCambiarPlan = ref(false);
const mostrarDialogAgregarAdherente = ref(false);
const mostrarDialogQuitarAdherente = ref(false);

const planSeleccionado = ref(null);
const cambiandoPlan = ref(false);

const agregandoAdherente = ref(false);
const nuevoAdherente = ref({
  nombre: '',
  apellido: '',
  email: '',
  password: '',
  dni: '',
  telefono: '',
  fechaNacimiento: null,
  pagaCuotaElAdherente: true,
  pagaDisciplinasElAdherente: true
});

const quitandoAdherente = ref(false);
const adherenteAQuitar = ref(null);

// Computed
const adherentesMayores = computed(() => {
  return adherentes.value.filter(a => {
    if (a.fechaNacimiento) {
      return calcularEdadDesdeNacimiento(a.fechaNacimiento) >= 18;
    }
    // Si no tiene fecha de nacimiento, asumir mayor por defecto
    return true;
  });
});

const adherentesMenores = computed(() => {
  return adherentes.value.filter(a => {
    if (a.fechaNacimiento) {
      return calcularEdadDesdeNacimiento(a.fechaNacimiento) < 18;
    }
    return false;
  });
});

const espaciosDisponibles = computed(() => {
  if (!planActual.value) return { mayores: 0, menores: 0 };
  
  return {
    mayores: planActual.value.cupoMayores - (adherentesMayores.value.length + 1), // +1 por el titular
    menores: planActual.value.cupoMenores - adherentesMenores.value.length
  };
});

const puedesAgregarAdherente = computed(() => {
  return espaciosDisponibles.value.mayores > 0 || espaciosDisponibles.value.menores > 0;
});

const planesDisponibles = computed(() => {
  if (!planActual.value) return todosLosPlanes.value;
  return todosLosPlanes.value.filter(p => p.id !== planActual.value.id && p.activo);
});

const planesDisponiblesFiltrados = computed(() => {
  return planesDisponibles.value.filter(p => puedeCambiarAPlan(p));
});

const planRecomendado = computed(() => {
  const totalPersonas = adherentes.value.length + 1;
  const mayores = adherentesMayores.value.length + 1;
  const menores = adherentesMenores.value.length;

  return planesDisponibles.value.find(p => 
    p.cupoMayores >= mayores && 
    p.cupoMenores >= menores &&
    (p.cupoMayores + p.cupoMenores) === totalPersonas
  );
});

const puedesCambiarPlan = computed(() => {
  return planesDisponiblesFiltrados.value.length > 0;
});

// Methods
const calcularEdadDesdeNacimiento = (fechaNacimiento) =>
  calcularEdadDesdeFechaNacimiento(fechaNacimiento);

const calcularEdad = (fecha) => {
  // Para adherentes existentes que pueden no tener fecha de nacimiento
  return calcularEdadDesdeNacimiento(fecha);
};

const calcularTotalCuota = () => {
  if (!planActual.value) return 0;
    let total = planActual.value.precioMensual || 0;
  
  if (misDisciplinasActivas.value.length > 0) {
    total += misDisciplinasActivas.value.reduce((sum, disc) => {
      return sum + (disc.cuotaMensual || 0);  // ✅ Acceso directo
    }, 0);
  }
  
  return total;
};

const puedeCambiarAPlan = (plan) => {
  const mayores = adherentesMayores.value.length + 1;
  const menores = adherentesMenores.value.length;
  
  return plan.cupoMayores >= mayores && plan.cupoMenores >= menores;
};

const getPlanSeverity = getPlanTypeSeverity;

const getDiferenciaSeverity = () => {
  if (!planSeleccionado.value) return 'info';
  if (planSeleccionado.value.precioMensual > planActual.value.precioMensual) return 'warn';
  if (planSeleccionado.value.precioMensual < planActual.value.precioMensual) return 'success';
  return 'info';
};

const formatPrice = (price) => {
  return new Intl.NumberFormat('es-AR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(price);
};

const loadDatos = async () => {
  loading.value = true;
  try {
    // Cargar datos del socio actual con adherentes
    socioActual.value = await sociosService.getById(authStore.user.id);
    adherentes.value = socioActual.value.adherentes || [];
    
    // Cargar disciplinas activas del socio
    misDisciplinasActivas.value = (socioActual.value.inscripciones || []).filter(i => i.activa);

    // Cargar plan actual si tiene asignado
    if (socioActual.value.planMembresiaId) {
      planActual.value = await planesService.getById(socioActual.value.planMembresiaId);
    }

    // Cargar todos los planes disponibles
    todosLosPlanes.value = await planesService.getAll();
  } catch (error) {
    console.error('Error cargando datos:', error);
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'No se pudieron cargar los datos',
      life: 3000
    });
  } finally {
    loading.value = false;
  }
};

const solicitarCambioPlan = (plan) => {
  planSeleccionado.value = plan;
  mostrarDialogCambiarPlan.value = true;
};

const confirmarCambioPlan = async () => {
  if (!planSeleccionado.value) return;

  try {
    cambiandoPlan.value = true;

    await sociosService.updatePerfil({
      planMembresiaId: planSeleccionado.value.id
    });

    toast.add({
      severity: 'success',
      summary: 'Plan Actualizado',
      detail: `Tu plan ha sido cambiado a ${planSeleccionado.value.nombre}`,
      life: 5000
    });

    mostrarDialogCambiarPlan.value = false;
    planSeleccionado.value = null;
    await loadDatos();
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: error.response?.data?.message || 'No se pudo cambiar el plan',
      life: 3000
    });
  } finally {
    cambiandoPlan.value = false;
  }
};

const agregarAdherente = async () => {
  try {
    // Validar campos requeridos
    if (!nuevoAdherente.value.nombre || !nuevoAdherente.value.apellido || 
        !nuevoAdherente.value.email || !nuevoAdherente.value.password || 
        !nuevoAdherente.value.telefono || !nuevoAdherente.value.fechaNacimiento) {
      toast.add({
        severity: 'warn',
        summary: 'Validación',
        detail: 'Complete todos los campos requeridos incluyendo la fecha de nacimiento',
        life: 3000
      });
      return;
    }

    // Validar que haya espacio en el plan según la edad
    const edad = calcularEdadDesdeNacimiento(nuevoAdherente.value.fechaNacimiento);
    const esMayor = edad >= 18;

    if (esMayor && espaciosDisponibles.value.mayores <= 0) {
      toast.add({
        severity: 'error',
        summary: 'Sin espacio',
        detail: 'No hay espacio disponible para mayores en tu plan',
        life: 3000
      });
      return;
    }

    if (!esMayor && espaciosDisponibles.value.menores <= 0) {
      toast.add({
        severity: 'error',
        summary: 'Sin espacio',
        detail: 'No hay espacio disponible para menores en tu plan',
        life: 3000
      });
      return;
    }

    agregandoAdherente.value = true;

    // Crear el adherente asociado al titular actual
    // La cuota se toma del plan, no se ingresa manualmente
    await sociosService.create({
      ...nuevoAdherente.value,
      fechaNacimiento: normalizeReservaFechaForApi(nuevoAdherente.value.fechaNacimiento),
      cuotaSocio: 0, // Se calculará en el backend según el plan
      tipoSocio: 'Adherente',
      titularId: authStore.user.id,
      planMembresiaId: planActual.value.id
    });

    toast.add({
      severity: 'success',
      summary: 'Adherente Agregado',
      detail: `${nuevoAdherente.value.nombre} ha sido agregado a tu plan`,
      life: 3000
    });

    mostrarDialogAgregarAdherente.value = false;
    resetNuevoAdherente();
    await loadDatos();
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: error.response?.data?.message || 'No se pudo agregar el adherente',
      life: 3000
    });
  } finally {
    agregandoAdherente.value = false;
  }
};

const confirmarQuitarAdherente = (adherente) => {
  adherenteAQuitar.value = adherente;
  mostrarDialogQuitarAdherente.value = true;
};

const quitarAdherente = async () => {
  if (!adherenteAQuitar.value) return;

  try {
    quitandoAdherente.value = true;

    // Actualizar el adherente para quitarlo del plan (cambiar a titular)
    await sociosService.update(adherenteAQuitar.value.id, {
      tipoSocio: 'Titular',
      titularId: null
    });

    toast.add({
      severity: 'success',
      summary: 'Adherente Removido',
      detail: `${adherenteAQuitar.value.nombre} ha sido removido de tu plan`,
      life: 3000
    });

    mostrarDialogQuitarAdherente.value = false;
    adherenteAQuitar.value = null;
    await loadDatos();
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: error.response?.data?.message || 'No se pudo quitar el adherente',
      life: 3000
    });
  } finally {
    quitandoAdherente.value = false;
  }
};

const resetNuevoAdherente = () => {
  nuevoAdherente.value = {
    nombre: '',
    apellido: '',
    email: '',
    password: '',
    dni: '',
    telefono: '',
    fechaNacimiento: null,
    pagaCuotaElAdherente: true,
    pagaDisciplinasElAdherente: true
  };
};

onMounted(() => {
  loadDatos();
});
</script>

<style scoped>
.mi-plan-container {
  padding: 2rem;
  max-width: 1400px;
  margin: 0 auto;
}

.header {
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

.loading-container {
  display: flex;
  justify-content: center;
  padding: 3rem;
}

.sin-plan-container {
  max-width: 600px;
  margin: 2rem auto;
}

.sin-plan-content {
  text-align: center;
  padding: 2rem;
}

.sin-plan-content i {
  font-size: 4rem;
  color: #dc2626;
  margin-bottom: 1rem;
}

.sin-plan-content h2 {
  margin: 1rem 0;
  color: var(--text-color);
}

.sin-plan-content p {
  color: var(--text-color-secondary);
}

.content-grid {
  display: grid;
  gap: 2rem;
  grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
}

/* Plan Actual Card */
.plan-actual-card {
  grid-column: 1 / -1;
  background: var(--surface-card);
  border: 1px solid #dc2626;
}

.plan-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 1.5rem;
  background: var(--surface-ground);
}

.plan-nombre {
  font-size: 2rem;
  margin: 0 0 0.5rem 0;
  color: var(--text-color);
}

.plan-descripcion {
  color: var(--text-color-secondary);
  margin-bottom: 1.5rem;
}

.plan-precio {
  text-align: center;
  margin: 2rem 0;
}

.precio-simbolo {
  font-size: 1.5rem;
  color: #dc2626;
  vertical-align: super;
}

.precio-monto {
  font-size: 3.5rem;
  font-weight: bold;
  color: #dc2626;
}

.precio-periodo {
  color: var(--text-color-secondary);
  font-size: 1.2rem;
}

.desglose-cuotas-plan {
  background: var(--surface-ground);
  border-radius: 8px;
  padding: 1.5rem;
  margin: 1.5rem 0;
}

.desglose-cuotas-plan h3 {
  color: var(--text-color);
  font-size: 1.1rem;
  margin: 0 0 1rem 0;
}

.desglose-items {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.desglose-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem;
  background: var(--surface-hover);
  border-radius: 6px;
  border-left: 3px solid #dc2626;
}

.desglose-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: var(--text-color);
  font-size: 0.95rem;
}

.desglose-label i {
  color: #dc2626;
}

.desglose-valor {
  font-weight: bold;
  font-size: 1.1rem;
}

.desglose-total {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  background: rgba(220, 38, 38, 0.1);
  border-radius: 8px;
  border: 2px solid #dc2626;
}

.total-label {
  color: var(--text-color);
  font-weight: 600;
  font-size: 1.1rem;
}

.total-valor {
  color: #dc2626;
  font-weight: bold;
  font-size: 1.8rem;
}

.plan-capacidad {
  margin-top: 2rem;
}

.plan-capacidad h3 {
  color: var(--text-color);
  margin-bottom: 1rem;
}

.capacidad-items {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.capacidad-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  color: var(--text-color-secondary);
}

.capacidad-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.capacidad-label i {
  color: #dc2626;
}

.capacidad-valor {
  font-size: 1.2rem;
  font-weight: bold;
}

.capacidad-valor .usado {
  color: #dc2626;
}

.capacidad-valor .separador {
  color: var(--text-color-secondary);
  margin: 0 0.3rem;
}

.capacidad-valor .total {
  color: var(--text-color-secondary);
}

.capacidad-bar {
  height: 8px;
  margin-top: 0.5rem;
}

/* Adherentes Card */
.adherentes-card {
  grid-column: 1 / -1;
}

.adherentes-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 1.5rem;
  background: var(--surface-ground);
}

.adherentes-header h3 {
  margin: 0;
  color: var(--text-color);
}

.sin-adherentes {
  text-align: center;
  padding: 3rem;
  color: var(--text-color-secondary);
}

.sin-adherentes i {
  font-size: 3rem;
  margin-bottom: 1rem;
  color: var(--text-color-secondary);
}

.adherentes-lista {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.adherente-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  background: var(--surface-card);
  border-radius: 8px;
  border: 1px solid var(--surface-border);
  transition: all 0.2s;
}

.adherente-item:hover {
  border-color: #dc2626;
  background: var(--surface-hover);
}

.adherente-info {
  flex: 1;
}

.adherente-info h4 {
  margin: 0 0 0.25rem 0;
  color: var(--text-color);
}

.adherente-info p {
  margin: 0 0 0.5rem 0;
  color: var(--text-color-secondary);
  font-size: 0.9rem;
}

.adherente-detalles {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.detalle-item {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  color: var(--text-color-secondary);
  font-size: 0.85rem;
}

.detalle-item i {
  color: #dc2626;
}

.avatar-red {
  background-color: #dc2626 !important;
}

/* Planes Disponibles */
.planes-disponibles-card {
  grid-column: 1 / -1;
}

.planes-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 1.5rem;
}

.plan-disponible {
  position: relative;
  padding: 1.5rem;
  background: var(--surface-card);
  border: 1px solid var(--surface-border);
  border-radius: 8px;
  transition: all 0.3s;
}

.plan-disponible:hover {
  border-color: #dc2626;
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(220, 38, 38, 0.2);
}

.plan-disponible.recomendado {
  border-color: #22c55e;
  background: var(--surface-card);
}

.tag-recomendado {
  position: absolute;
  top: 1rem;
  right: 1rem;
}

.tag-tipo {
  margin-bottom: 0.5rem;
}

.plan-disponible h4 {
  margin: 0.5rem 0;
  color: var(--text-color);
  font-size: 1.3rem;
}

.plan-desc {
  color: var(--text-color-secondary);
  font-size: 0.9rem;
  margin-bottom: 1rem;
}

.plan-precio-small {
  font-size: 1.5rem;
  font-weight: bold;
  color: #dc2626;
  margin: 1rem 0;
}

.plan-cupos {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin: 1rem 0;
  color: var(--text-color-secondary);
  font-size: 0.9rem;
}

.plan-cupos span {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.plan-cupos i {
  color: #dc2626;
}

.btn-seleccionar {
  width: 100%;
  margin-top: 1rem;
}

.text-warning {
  color: #f59e0b;
  display: block;
  margin-top: 0.5rem;
  text-align: center;
}

/* Dialogs */
.dialog-content {
  padding: 1rem 0;
}

.plan-comparison {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  gap: 1.5rem;
  align-items: center;
  margin-bottom: 1.5rem;
}

.plan-col h4 {
  color: var(--text-color-secondary);
  margin-bottom: 1rem;
  text-align: center;
}

.plan-box {
  padding: 1.5rem;
  background: var(--surface-card);
  border-radius: 8px;
  text-align: center;
  border: 1px solid var(--surface-border);
}

.plan-box h3 {
  margin: 0 0 1rem 0;
  color: var(--text-color);
}

.plan-box .precio {
  font-size: 1.8rem;
  font-weight: bold;
  color: #dc2626;
  margin-bottom: 0.5rem;
}

.plan-box p {
  color: var(--text-color-secondary);
  margin: 0;
  font-size: 0.9rem;
}

.arrow-icon {
  font-size: 2rem;
  color: #dc2626;
}

.cambio-info {
  background: var(--surface-card);
  padding: 1.5rem;
  border-radius: 8px;
  margin-top: 1rem;
  border: 1px solid var(--surface-border);
}

.cambio-info h4 {
  color: var(--text-color);
  margin-top: 0;
}

.cambio-info ul {
  margin: 0.5rem 0 0 0;
  padding-left: 1.5rem;
  color: var(--text-color-secondary);
}

.cambio-info li {
  margin-bottom: 0.5rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-bottom: 1rem;
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
  cursor: pointer;
}

.edad-info {
  display: block;
  margin-top: 0.5rem;
  color: var(--text-color-secondary);
  font-size: 0.9rem;
}

@media (max-width: 768px) {
  .mi-plan-container {
    padding: 1rem;
  }

  .content-grid {
    grid-template-columns: 1fr;
  }

  .plan-comparison {
    grid-template-columns: 1fr;
  }

  .arrow-icon {
    transform: rotate(90deg);
  }

  .form-row {
    grid-template-columns: 1fr;
  }
}
</style>
