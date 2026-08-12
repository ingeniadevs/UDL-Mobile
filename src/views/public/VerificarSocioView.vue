<template>
  <div class="verificar-container">
    <div class="verificar-header">
      <img src="/images/logo-udl.png" alt="UDL" class="verificar-logo" />
      <h2>UNIÓN DEPORTIVA LASPIUR</h2>
      <p class="subtitulo">Verificación de Carnet de Socio</p>
    </div>

    <div v-if="loading" class="verificar-card text-center py-6">
      <i class="pi pi-spin pi-spinner text-4xl text-blue-400"></i>
      <p class="text-gray-400 mt-3">Verificando socio...</p>
    </div>

    <div v-else-if="error" class="verificar-card text-center py-6">
      <i class="pi pi-times-circle text-5xl text-red-400 mb-3 block"></i>
      <h3 class="text-red-400 font-bold text-xl mb-2">Socio no encontrado</h3>
      <p class="text-gray-400 text-sm">Este carnet no corresponde a un socio activo del club.</p>
      <div class="sello sello--invalido mt-4">
        <i class="pi pi-ban"></i> NO VÁLIDO
      </div>
    </div>

    <div v-else-if="socio" class="verificar-card">
      <!-- Foto y nombre -->
      <div class="flex flex-column align-items-center gap-3 mb-4">
        <div v-if="socio.foto" class="socio-foto-wrapper">
          <img :src="socio.foto" alt="Foto del socio" class="socio-foto" />
        </div>
        <div v-else class="socio-avatar-placeholder">
          <span>{{ initials }}</span>
        </div>
        <div class="text-center">
          <h2 class="font-bold text-2xl m-0" style="color:var(--text-color)">{{ socio.nombreCompleto }}</h2>
          <p class="text-gray-400 text-sm mt-1">SOCIO N° {{ socio.numeroSocio }} · {{ socio.tipoSocio }}</p>
        </div>
      </div>

      <!-- Estado cuotas -->
      <div class="estado-row" :class="socio.cuotasAlDia ? 'estado-ok' : 'estado-adeuda'">
        <i :class="socio.cuotasAlDia ? 'pi pi-check-circle' : 'pi pi-exclamation-triangle'"></i>
        <span class="font-bold">{{ socio.cuotasAlDia ? 'CUOTAS AL DÍA' : 'CUOTAS ADEUDADAS' }}</span>
        <span v-if="!socio.cuotasAlDia && socio.montoAdeudado > 0" class="text-sm ml-2">
          (${{ socio.montoAdeudado.toLocaleString() }})
        </span>
      </div>

      <!-- Disciplinas -->
      <div v-if="socio.disciplinasActivas && socio.disciplinasActivas.length > 0" class="disciplinas-section">
        <p class="text-gray-400 text-xs font-semibold uppercase mb-2">Disciplinas activas</p>
        <div class="flex flex-wrap gap-2 justify-content-center">
          <span v-for="d in socio.disciplinasActivas" :key="d" class="disc-tag">{{ d }}</span>
        </div>
      </div>

      <!-- Sello válido -->
      <div class="sello" :class="socio.cuotasAlDia ? 'sello--valido' : 'sello--adeuda'">
        <i :class="socio.cuotasAlDia ? 'pi pi-verified' : 'pi pi-exclamation-circle'"></i>
        {{ socio.cuotasAlDia ? 'VERIFICADO' : 'CON DEUDA' }}
      </div>

      <p class="text-gray-600 text-xs text-center mt-3">
        Verificado el {{ fechaHoy }} · Unión Deportiva Laspiur
      </p>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import api from '@/services/api'

const route = useRoute()
const socio = ref(null)
const loading = ref(true)
const error = ref(false)

const initials = computed(() => {
  if (!socio.value?.nombreCompleto) return '?'
  return socio.value.nombreCompleto.split(' ').slice(0, 2).map(w => w[0]?.toUpperCase() ?? '').join('')
})

const fechaHoy = computed(() =>
  new Date().toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
)

onMounted(async () => {
  try {
    const { data } = await api.get(`/socios/verificar/${route.params.id}`)
    socio.value = data
  } catch {
    error.value = true
  } finally {
    loading.value = false
  }
})
</script>

<style scoped>
.verificar-container {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 2rem 1rem;
  background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
}

.verificar-header {
  text-align: center;
  margin-bottom: 2rem;
  color: #fff;
}

.verificar-logo {
  width: 80px;
  height: 80px;
  object-fit: contain;
  margin-bottom: 0.75rem;
}

.verificar-header h2 {
  margin: 0;
  font-size: 1.1rem;
  font-weight: 700;
  letter-spacing: 0.05em;
  color: #e2e8f0;
}

.subtitulo {
  margin: 0.25rem 0 0;
  font-size: 0.8rem;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

.verificar-card {
  background: rgba(30, 41, 59, 0.9);
  border: 1px solid rgba(255,255,255,0.1);
  border-radius: 20px;
  padding: 2rem 1.5rem;
  width: 100%;
  max-width: 400px;
  box-shadow: 0 20px 60px rgba(0,0,0,0.5);
}

.socio-foto-wrapper {
  width: 100px;
  height: 100px;
  border-radius: 50%;
  overflow: hidden;
  border: 3px solid #3b82f6;
}

.socio-foto {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.socio-avatar-placeholder {
  width: 100px;
  height: 100px;
  border-radius: 50%;
  background: linear-gradient(135deg, #3b82f6, #6366f1);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2.5rem;
  font-weight: 700;
  color: #fff;
}

.estado-row {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  border-radius: 10px;
  font-size: 0.95rem;
  margin-bottom: 1rem;
}

.estado-ok {
  background: rgba(16, 185, 129, 0.15);
  color: #10b981;
  border: 1px solid rgba(16, 185, 129, 0.3);
}

.estado-adeuda {
  background: rgba(245, 158, 11, 0.15);
  color: #f59e0b;
  border: 1px solid rgba(245, 158, 11, 0.3);
}

.disciplinas-section {
  text-align: center;
  margin-bottom: 1.5rem;
}

.disc-tag {
  background: rgba(99, 102, 241, 0.2);
  color: #a5b4fc;
  border: 1px solid rgba(99, 102, 241, 0.3);
  border-radius: 20px;
  padding: 0.2rem 0.75rem;
  font-size: 0.75rem;
  font-weight: 600;
}

.sello {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  border-radius: 10px;
  font-size: 1.1rem;
  font-weight: 800;
  letter-spacing: 0.1em;
  border: 2px solid;
  margin-top: 1rem;
}

.sello--valido {
  color: #10b981;
  border-color: #10b981;
  background: rgba(16, 185, 129, 0.1);
}

.sello--adeuda {
  color: #f59e0b;
  border-color: #f59e0b;
  background: rgba(245, 158, 11, 0.1);
}

.sello--invalido {
  color: #ef4444;
  border-color: #ef4444;
  background: rgba(239, 68, 68, 0.1);
}
</style>
