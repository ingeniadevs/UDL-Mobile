import api from './api'

export const notificacionesService = {
  async getConfig() {
    const { data } = await api.get('/notificaciones/config')
    return data
  },
  async updateConfig(payload) {
    const { data } = await api.put('/notificaciones/config', payload)
    return data
  },
  async getPlantillas() {
    const { data } = await api.get('/notificaciones/plantillas')
    return data
  },
  async updatePlantilla(tipo, payload) {
    const { data } = await api.put(`/notificaciones/plantillas/${tipo}`, payload)
    return data
  },
  async sincronizar() {
    const { data } = await api.post('/notificaciones/sincronizar')
    return data
  },
  async getVencimientos(params = {}) {
    const { data } = await api.get('/notificaciones/vencimientos', { params })
    return data
  },
  async getReservas(params = {}) {
    const { data } = await api.get('/notificaciones/reservas', { params })
    return data
  },
  async getPedidos(params = {}) {
    const { data } = await api.get('/notificaciones/pedidos', { params })
    return data
  },
  async getHistorial(params = {}) {
    const { data } = await api.get('/notificaciones/historial', { params })
    return data
  },
  async generarMensaje(payload) {
    const { data } = await api.post('/notificaciones/generar-mensaje', payload)
    return data
  },
  async registrarWhatsAppAbierto(payload) {
    const { data } = await api.post('/notificaciones/whatsapp-abierto', payload)
    return data
  },
  async simular(queueId) {
    const { data } = await api.post(`/notificaciones/cola/${queueId}/simular`)
    return data
  },
  async reintentar(queueId) {
    const { data } = await api.post(`/notificaciones/cola/${queueId}/reintentar`)
    return data
  },
  async envioMasivo(tipo, queueIds) {
    const { data } = await api.post('/notificaciones/envio-masivo', { tipo, queueIds })
    return data
  }
}
