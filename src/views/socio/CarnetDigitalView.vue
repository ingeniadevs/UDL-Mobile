<template>  <div class="carnet-container">
    <PageHeader title="Mi Carnet Digital" />

    <div v-if="loading" class="flex justify-content-center p-5">
      <ProgressSpinner />
    </div>

    <div v-else-if="carnet" class="flex flex-column align-items-center gap-4">
      <!-- Carnet Card -->
      <div class="carnet-card" ref="carnetRef">
        <!-- Anverso -->
        <div class="carnet-front">
          <div class="carnet-header">
            <img src="/images/logo-udl.png" alt="UDL" class="carnet-logo" />
            <h3>UNIÓN DEPORTIVA LASPIUR</h3>
            <p class="subtitle">CARNET DE SOCIO</p>
          </div>
          
          <div class="carnet-photo-container">
            <div class="carnet-photo">
              <img v-if="carnet.foto" :src="carnet.foto" alt="Foto del socio" />
              <Avatar 
                v-else
                :label="carnet.nombreCompleto.charAt(0)" 
                size="xlarge" 
                shape="circle"
                style="width: 120px; height: 120px; font-size: 3rem"
              />
            </div>
          </div>
          
          <div class="carnet-info">
            <h2>{{ carnet.nombreCompleto }}</h2>
            <p class="numero-socio">SOCIO N° {{ carnet.numeroSocio }}</p>
            
            <div class="estado-cuotas" :class="carnet.cuotasAlDia ? 'al-dia' : 'adeudado'">
              <i :class="carnet.cuotasAlDia ? 'pi pi-check-circle' : 'pi pi-exclamation-triangle'"></i>
              <span>{{ carnet.cuotasAlDia ? 'CUOTAS AL DÍA' : 'CUOTAS ADEUDADAS' }}</span>
            </div>

            <div v-if="!carnet.cuotasAlDia && carnet.montoAdeudado > 0" class="monto-adeudado">
              <span>Adeuda: ${{ carnet.montoAdeudado.toLocaleString() }}</span>
            </div>
          </div>

          <!-- Código QR -->
          <div class="qr-code-section">
            <img
              :src="`https://api.qrserver.com/v1/create-qr-code/?size=90x90&data=SOCIO-${carnet.numeroSocio}`"
              alt="QR"
              class="qr-image"
            />
            <p class="qr-label">N° {{ carnet.numeroSocio }}</p>
          </div>
        </div>

        <!-- Reverso -->
        <div class="carnet-back">
          <h4>Disciplinas Activas</h4>
          <div v-if="carnet.disciplinas && carnet.disciplinas.length > 0" class="disciplinas-list">
            <div v-for="disc in carnet.disciplinas" :key="disc.id" class="disciplina-item">
              <i class="pi pi-check-circle"></i>
              <span>{{ disc.disciplinaNombre }}</span>
            </div>
          </div>
          <p v-else class="no-disciplinas">Sin disciplinas activas</p>
        </div>
      </div>

    </div>

    <div v-else class="card">
      <p class="text-center" style="color: var(--text-color-secondary)">No se pudo cargar el carnet digital</p>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useToast } from 'primevue/usetoast'
import { sociosService } from '@/services'
import PageHeader from '@/components/mobile/PageHeader.vue'
import Button from 'primevue/button'
import Avatar from 'primevue/avatar'
import ProgressSpinner from 'primevue/progressspinner'
import html2canvas from 'html2canvas'
import { Share } from '@capacitor/share'
import { Capacitor } from '@capacitor/core'
import { shareDataUrl } from '@/platform/files'
import { copyToClipboard } from '@/platform/clipboard'

const toast = useToast()

const carnet = ref(null)
const loading = ref(true)
const downloading = ref(false)
const showBack = ref(false)
const carnetRef = ref(null)

function formatDate(date) {
  if (!date) return 'N/A'
  return new Date(date).toLocaleDateString('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  })
}

async function loadCarnet() {
  loading.value = true
  try {
    carnet.value = await sociosService.getCarnet()
  } catch (error) {
    console.error('Error loading carnet:', error)
    toast.add({ 
      severity: 'error', 
      summary: 'Error', 
      detail: 'No se pudo cargar el carnet digital', 
      life: 3000 
    })
  } finally {
    loading.value = false
  }
}

async function descargarCarnet() {
  downloading.value = true
  try {
    const element = carnetRef.value
    if (!element) return

    const canvas = await html2canvas(element, {
      backgroundColor: '#1e293b',
      scale: 2,
      logging: false
    })

    const dataUrl = canvas.toDataURL('image/png')
    await shareDataUrl(dataUrl, `carnet-socio-${carnet.value.numeroSocio}.png`)

    toast.add({ 
      severity: 'success', 
      summary: 'Descargado', 
      detail: 'Carnet descargado exitosamente', 
      life: 3000 
    })
  } catch (error) {
    console.error('Error downloading carnet:', error)
    toast.add({ 
      severity: 'error', 
      summary: 'Error', 
      detail: 'No se pudo descargar el carnet', 
      life: 3000 
    })
  } finally {
    downloading.value = false
  }
}

async function compartirCarnet() {
  try {
    const text = `Socio N° ${carnet.value.numeroSocio} - ${carnet.value.nombreCompleto}`
    if (Capacitor.isNativePlatform()) {
      await Share.share({
        title: 'Mi Carnet - UDL',
        text,
        dialogTitle: 'Compartir carnet'
      })
      return
    }
    if (navigator.share) {
      await navigator.share({
        title: 'Mi Carnet - Unión Deportiva Laspiur',
        text,
        url: window.location.href
      })
      return
    }
    const ok = await copyToClipboard(text)
    toast.add({
      severity: ok ? 'info' : 'warn',
      summary: ok ? 'Copiado' : 'Compartir',
      detail: ok ? 'Datos del carnet copiados' : 'Usá descargar para compartir la imagen',
      life: 3000
    })
  } catch (error) {
    console.error('Error sharing:', error)
  }
}

onMounted(() => {
  loadCarnet()
})
</script>

<style scoped>
.carnet-container {
  max-width: 600px;
  margin: 0 auto;
  padding: 0 1rem;
  box-sizing: border-box;
  width: 100%;
}

.carnet-card {
  width: 100%;
  max-width: 400px;
  background: #ffffff;
  border-radius: 20px;
  padding: 30px 20px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.2);
  border: 2px solid rgba(220, 38, 38, 0.3);
  position: relative;
  overflow: hidden;
}

.carnet-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: linear-gradient(90deg, #dc2626, #991b1b);
}

.carnet-front,
.carnet-back {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
}

.carnet-header {
  text-align: center;
  border-bottom: 2px solid rgba(220, 38, 38, 0.3);
  padding-bottom: 15px;
  width: 100%;
}

.carnet-logo {
  width: 80px;
  height: 80px;
  object-fit: contain;
  margin-bottom: 10px;
}

.carnet-header h3 {
  color: #dc2626;
  font-size: 1.2rem;
  font-weight: 700;
  margin: 0;
  letter-spacing: 1px;
}

.carnet-header .subtitle {
  color: #64748b;
  font-size: 0.75rem;
  margin: 5px 0 0 0;
  letter-spacing: 2px;
}

.carnet-photo-container {
  width: 100%;
  display: flex;
  justify-content: center;
}

.carnet-photo {
  width: 120px;
  height: 120px;
  border-radius: 50%;
  overflow: hidden;
  border: 4px solid #dc2626;
  box-shadow: 0 4px 20px rgba(220, 38, 38, 0.3);
  background: #e2e8f0;
}

.carnet-photo img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.carnet-info {
  text-align: center;
  width: 100%;
}

.carnet-info h2 {
  color: #0f172a;
  font-size: 1.4rem;
  font-weight: 700;
  margin: 0 0 5px 0;
  word-break: break-word;
}

.numero-socio {
  color: #64748b;
  font-size: 0.9rem;
  font-weight: 600;
  letter-spacing: 2px;
  margin: 0;
}

.estado-cuotas {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 10px 20px;
  border-radius: 10px;
  margin-top: 15px;
  font-weight: 600;
  font-size: 0.85rem;
}

.estado-cuotas.al-dia {
  background: rgba(16, 185, 129, 0.2);
  color: #10b981;
  border: 2px solid #10b981;
}

.estado-cuotas.adeudado {
  background: rgba(239, 68, 68, 0.2);
  color: #ef4444;
  border: 2px solid #ef4444;
}

.monto-adeudado {
  margin-top: 10px;
  color: #fbbf24;
  font-weight: 600;
  font-size: 0.9rem;
}

.qr-code-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding-top: 15px;
  border-top: 2px solid rgba(220, 38, 38, 0.3);
  width: 100%;
}

.qr-image {
  width: 90px;
  height: 90px;
  border-radius: 8px;
  background: white;
  padding: 4px;
  border: 1px solid #e2e8f0;
}

.qr-label {
  color: #64748b;
  font-size: 0.75rem;
  margin: 0;
  font-weight: 600;
  letter-spacing: 1px;
}

/* Reverso */
.carnet-back {
  padding-top: 10px;
  border-top: 2px solid rgba(220, 38, 38, 0.3);
  width: 100%;
}

.carnet-back h4 {
  color: #dc2626;
  font-size: 1.1rem;
  margin: 0 0 15px 0;
  text-align: center;
}

.disciplinas-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
  width: 100%;
}

.disciplina-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 12px;
  background: rgba(220, 38, 38, 0.07);
  border-radius: 8px;
  color: #0f172a;
  font-size: 0.9rem;
  font-weight: 500;
}

.disciplina-item i {
  color: #10b981;
}

.no-disciplinas {
  color: #64748b;
  font-style: italic;
}

/* Info Cards */
.info-cards-wrapper {
  display: flex;
  gap: 1rem;
  width: 100%;
  max-width: 400px;
}

.botones-wrapper {
  display: flex;
  gap: 0.75rem;
  width: 100%;
  max-width: 400px;
}

.botones-wrapper :deep(.p-button) {
  flex: 1;
}

.info-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 15px;
  background: var(--surface-card);
  border-radius: 10px;
  border-left: 4px solid #dc2626;
}

.info-card i {
  font-size: 1.5rem;
  color: #dc2626;
}

.info-card .label {
  display: block;
  color: var(--text-color-secondary);
  font-size: 0.75rem;
  margin-bottom: 2px;
}

.info-card .value {
  display: block;
  color: var(--text-color);
  font-weight: 700;
  font-size: 1rem;
}

/* Responsive */
@media (max-width: 640px) {
  .carnet-container {
    padding: 0 0.75rem;
  }

  .carnet-card {
    max-width: 100%;
    padding: 20px 15px;
  }

  .carnet-header h3 {
    font-size: 1rem;
  }

  .carnet-info h2 {
    font-size: 1.2rem;
  }

  .info-cards-wrapper {
    flex-direction: column;
    gap: 0.5rem;
  }

  .botones-wrapper {
    flex-direction: column;
  }

  .botones-wrapper :deep(.p-button) {
    width: 100%;
  }
}
</style>
