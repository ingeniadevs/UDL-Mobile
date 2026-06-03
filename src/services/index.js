import api from './api'

export const authService = {
  // Login unificado: el backend determina el rol según si es email o alias
  async login(identificador, password) {
    const response = await api.post('/auth/login', { identificador, password })
    return response.data
  },
  async registrarSocio(data) {
    const response = await api.post('/auth/registro', data)
    return response.data
  },

  // FASE 3: Registro con selección de método de pago
  async registerWithPayment(data) {
    const response = await api.post('/auth/register', data)
    return response.data
  },

  async loginAdmin(email, password) {
    const response = await api.post('/auth/admin/login', { email, password })
    return response.data
  },

  async loginSocio(email, password) {
    const response = await api.post('/auth/socio/login', { email, password })
    return response.data
  },

  async verify() {
    const response = await api.get('/auth/verify')
    return response.data
  },

  // Recuperación de contraseña
  async solicitarRecuperacion(email) {
    const response = await api.post('/auth/solicitar-recuperacion', { email })
    return response.data
  },
  async resetearPassword(token, nuevaPassword) {
    const response = await api.post('/auth/resetear-password', { token, nuevaPassword })
    return response.data
  },

  async cambiarPassword(codigo, nuevaPassword) {
    const response = await api.post('/auth/cambiar-password', { codigo, nuevaPassword })
    return response.data
  },

  async solicitarCambioPassword() {
    const response = await api.post('/auth/solicitar-cambio-password')
    return response.data
  },

  async adminResetPasswordSocio(socioId, nuevaPassword) {
    const response = await api.post(`/auth/admin/reset-password-socio/${socioId}`, { nuevaPassword })
    return response.data
  }
}

export const adminsService = {
  async getAll() {
    const response = await api.get('/admins')
    return response.data
  },

  async create(data) {
    const response = await api.post('/admins', data)
    return response.data
  },

  async update(id, data) {
    const response = await api.put(`/admins/${id}`, data)
    return response.data
  },

  async delete(id) {
    await api.delete(`/admins/${id}`)
  },

  async getEspaciosAsignados(id) {
    const response = await api.get(`/admins/${id}/espacios`)
    return response.data
  },

  async asignarEspacios(id, espacioIds) {
    const response = await api.put(`/admins/${id}/espacios`, { espacioIds })
    return response.data
  }
}

export const sociosService = {
  async getAll() {
    const response = await api.get('/socios')
    return response.data
  },

  async getById(id) {
    const response = await api.get(`/socios/${id}`)
    return response.data
  },

  async create(data) {
    const response = await api.post('/socios', data)
    return response.data
  },

  async update(id, data) {
    const response = await api.put(`/socios/${id}`, data)
    return response.data
  },

  async delete(id) {
    const response = await api.delete(`/socios/${id}`)
    return response.data
  },
  // Métodos para gestión de adherentes
  async createAdherente(titularId, data) {
    // Los adherentes se crean como socios normales pero asociados a un titular
    const adherenteData = {
      ...data,
      tipoSocio: 'Adherente',
      titularId: titularId
    }
    const response = await api.post('/socios', adherenteData)
    return response.data
  },

  // FASE 4: Actualizar perfil del socio
  async updatePerfil(data) {
    const response = await api.patch('/socios/perfil', data)
    return response.data
  },

  // FASE 5: Obtener carnet digital
  async getCarnet() {
    const response = await api.get('/socios/carnet')
    return response.data
  },

  // Enviar WhatsApp manual (admin)
  async enviarWhatsApp(id, mensaje) {
    const response = await api.post(`/socios/${id}/whatsapp`, { mensaje })
    return response.data
  }
}

export const disciplinasService = {
  async getAll() {
    const response = await api.get('/disciplinas')
    return response.data
  },

  async getById(id) {
    const response = await api.get(`/disciplinas/${id}`)
    return response.data
  },

  async create(data) {
    const response = await api.post('/disciplinas', data)
    return response.data
  },

  async update(id, data) {
    const response = await api.put(`/disciplinas/${id}`, data)
    return response.data
  },

  async delete(id) {
    const response = await api.delete(`/disciplinas/${id}`)
    return response.data
  },

  // Socios inscriptos en una disciplina
  async getSocios(id) {
    const response = await api.get(`/disciplinas/${id}/socios`)
    return response.data
  },

  // Inscribir socio a disciplina
  async inscribirSocio(id, socioId, datos = {}) {
    const response = await api.post(`/disciplinas/${id}/socios`, { socioId, ...datos })
    return response.data
  },

  // Dar de baja a un socio de la disciplina
  async desinscribirSocio(id, socioId) {
    const response = await api.delete(`/disciplinas/${id}/socios/${socioId}`)
    return response.data
  }
}

export const pagosService = {
  async getAll(socioId = null) {
    const params = socioId ? { socioId } : {}
    const response = await api.get('/pagos', { params })
    return response.data
  },

  async getBySocio(socioId) {
    const response = await api.get(`/pagos/socio/${socioId}`)
    return response.data
  },

  async create(data) {
    const response = await api.post('/pagos', data)
    return response.data
  },
  async update(id, data) {
    const response = await api.put(`/pagos/${id}`, data)
    return response.data
  },

  async delete(id) {
    const response = await api.delete(`/pagos/${id}`)
    return response.data
  },

  // Pago en efectivo (admin confirma)
  async registrarPagoEfectivo(pagoId) {
    const response = await api.post(`/pagos/${pagoId}/pagar-efectivo`)
    return response.data
  },

  // Solicitar pago en efectivo (socio) - múltiples pagos
  async solicitarPagoEfectivo(pagoIds) {
    const response = await api.post('/pagos/solicitar-efectivo', { PagoIds: pagoIds })
    return response.data
  },

  // MercadoPago individual
  async initMercadoPago(pagoId) {
    const response = await api.post(`/pagos/${pagoId}/mercadopago/init`)
    return response.data
  },

  // MercadoPago múltiple
  async initMercadoPagoMultiple(pagoIds) {
    const response = await api.post('/pagos/mercadopago/init-multiple', { PagoIds: pagoIds })
    return response.data
  },

  // Confirmar múltiples pagos en efectivo (admin)
  async confirmarPagosEfectivo(pagoIds) {
    const response = await api.post('/pagos/confirmar-efectivo', { PagoIds: pagoIds })
    return response.data
  },

  async checkMercadoPagoStatus(pagoId) {
    const response = await api.get(`/pagos/${pagoId}/mercadopago/status`)
    return response.data
  },
  // Cuota total con disciplinas
  async getCuotaTotal(socioId) {
    const response = await api.get(`/pagos/socio/${socioId}/cuota-total`)
    return response.data
  },

  // Generar pagos mensuales automáticamente
  async generarMensuales(mes = null, año = null) {
    const params = {}
    if (mes) params.mes = mes
    if (año) params.año = año
    const response = await api.post('/pagos/generar-mensuales', null, { params })
    return response.data
  },

  // Generar cuota mensual (incluye disciplinas activas)
  async generarCuotaMensual(socioId, data) {
    const response = await api.post(`/pagos/socio/${socioId}/generar-cuota`, data)
    return response.data
  }
}

export const productosService = {
  async getAll() {
    const response = await api.get('/productos')
    return response.data
  },

  async getById(id) {
    const response = await api.get(`/productos/${id}`)
    return response.data
  },

  async create(data) {
    const response = await api.post('/productos', data)
    return response.data
  },

  async update(id, data) {
    const response = await api.put(`/productos/${id}`, data)
    return response.data
  },
  async delete(id) {
    const response = await api.delete(`/productos/${id}`)
    return response.data
  },

  // Gestión de stock por talle
  async getStocks(id) {
    const response = await api.get(`/productos/${id}/stocks`)
    return response.data
  },

  async updateStocks(id, stocks) {
    const response = await api.put(`/productos/${id}/stocks`, stocks)
    return response.data
  }
}

export const uploadService = {
  async uploadImage(file) {
    const formData = new FormData()
    formData.append('file', file)
    const response = await api.post('/upload/image', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
    return response.data
  },

  async deleteImage(publicUrl) {
    const response = await api.delete('/upload/image', { params: { url: publicUrl } })
    return response.data
  }
}

export const pedidosService = {
  async getAll() {
    const response = await api.get('/pedidos')
    return response.data
  },

  async getById(id) {
    const response = await api.get(`/pedidos/${id}`)
    return response.data
  },

  async getBySocio(socioId) {
    const response = await api.get(`/pedidos/socio/${socioId}`)
    return response.data
  },

  async getMisPedidos() {
    const response = await api.get('/pedidos/mis-pedidos')
    return response.data
  },

  async create(data) {
    const response = await api.post('/pedidos', data)
    return response.data
  },

  async updateEstado(id, data) {
    const response = await api.put(`/pedidos/${id}/estado`, data)
    return response.data
  },

  async createManual(data) {
    const response = await api.post('/pedidos/manual', data)
    return response.data
  },

  // MercadoPago
  async initMercadoPago(pedidoId) {
    const response = await api.post(`/pedidos/${pedidoId}/mercadopago/init`)
    return response.data
  }
}

export const empleadosService = {
  async getAll() {
    const response = await api.get('/empleados')
    return response.data
  },

  async getById(id) {
    const response = await api.get(`/empleados/${id}`)
    return response.data
  },

  async create(data) {
    const response = await api.post('/empleados', data)
    return response.data
  },

  async update(id, data) {
    const response = await api.put(`/empleados/${id}`, data)
    return response.data
  },
  async delete(id) {
    const response = await api.delete(`/empleados/${id}`)
    return response.data
  },

  async pagarSueldo(id, data = {}) {
    const response = await api.post(`/empleados/${id}/pagar-sueldo`, data)
    return response.data
  }
}

export const inscripcionesService = {
  async getMisInscripciones() {
    const response = await api.get('/inscripciones/mis-inscripciones')
    return response.data
  },

  async inscribirse(disciplinaId) {
    const response = await api.post('/inscripciones/inscribirse', { disciplinaId })
    return response.data
  },

  async cancelar(disciplinaId) {
    const response = await api.post('/inscripciones/cancelar', { disciplinaId })
    return response.data
  }
}

export const espaciosService = {
  async getAll(soloActivos = null) {
    const params = soloActivos !== null ? { soloActivos } : {}
    const response = await api.get('/espacios', { params })
    return response.data
  },

  async getById(id) {
    const response = await api.get(`/espacios/${id}`)
    return response.data
  },

  async getTurnosDisponibles(id, fecha) {
    const response = await api.get(`/espacios/${id}/turnos/${fecha}`)
    return response.data
  },

  async create(data) {
    const response = await api.post('/espacios', data)
    return response.data
  },

  async update(id, data) {
    const response = await api.put(`/espacios/${id}`, data)
    return response.data
  },

  async delete(id) {
    const response = await api.delete(`/espacios/${id}`)
    return response.data
  }
}

export const reservasService = {
  async getAll(params = {}) {
    const response = await api.get('/reservas', { params })
    return response.data
  },

  async getById(id) {
    const response = await api.get(`/reservas/${id}`)
    return response.data
  },

  async getMisReservas() {
    const response = await api.get('/reservas/mis-reservas')
    return response.data
  },

  async getBySocio(socioId) {
    const response = await api.get(`/reservas/socio/${socioId}`)
    return response.data
  },

  async getByEspacioAndFecha(espacioId, fecha) {
    const response = await api.get(`/reservas/espacio/${espacioId}/fecha/${fecha}`)
    return response.data
  },

  async create(data) {
    const response = await api.post('/reservas', data)
    return response.data
  },

  async createAdmin(data) {
    const response = await api.post('/reservas/admin', data)
    return response.data
  },

  async updateEstado(id, data) {
    const response = await api.put(`/reservas/${id}/estado`, data)
    return response.data
  },

  async cancelar(id) {
    const response = await api.post(`/reservas/${id}/cancelar`)
    return response.data
  },

  async delete(id) {
    const response = await api.delete(`/reservas/${id}`)
    return response.data
  },

  // ==================== PAGOS ====================

  // Resumen de pagos (admin)
  async getResumenPagos(params = {}) {
    const response = await api.get('/reservas/pagos/resumen', { params })
    return response.data
  },
  // MercadoPago individual
  async initMercadoPago(reservaId) {
    const response = await api.post(`/reservas/${reservaId}/mercadopago/init`)
    return response.data
  },

  // MercadoPago múltiple
  async initMercadoPagoMultiple(reservaIds) {
    const response = await api.post('/reservas/mercadopago/init-multiple', { reservaIds })
    return response.data
  },

  // Obtener Public Key de MercadoPago desde el backend (seguro)
  async getMercadoPagoPublicKey() {
    const response = await api.get('/reservas/mercadopago/public-key')
    return response.data.publicKey
  },// Solicitar pago en efectivo (socio)
  async solicitarPagoEfectivo(reservaIds) {
    const response = await api.post('/reservas/solicitar-efectivo', { reservaIds })
    return response.data
  },
  // Confirmar pago en efectivo (admin)
  async confirmarPagoEfectivo(reservaIds) {
    const response = await api.post('/reservas/confirmar-efectivo', { reservaIds })
    return response.data
  },
  // Aprobar o rechazar reserva (admin)
  async aprobar(id, aprobada, motivoRechazo = '') {
    const response = await api.post(`/reservas/${id}/aprobar`, { aprobada, motivoRechazo })
    return response.data
  },

  // Informe mensual de reservas
  async getInforme(mes, anio, espacioId = null) {
    const params = { mes, anio }
    if (espacioId) params.espacioId = espacioId
    const response = await api.get('/reservas/informe-mensual', { params })
    return response.data
  }
}

export const movimientosService = {
  async getAll(params = {}) {
    const response = await api.get('/movimientos', { params })
    return response.data
  },

  async getById(id) {
    const response = await api.get(`/movimientos/${id}`)
    return response.data
  },

  async create(data) {
    const response = await api.post('/movimientos', data)
    return response.data
  },

  async update(id, data) {
    const response = await api.put(`/movimientos/${id}`, data)
    return response.data
  },

  async delete(id) {
    const response = await api.delete(`/movimientos/${id}`)
    return response.data
  },

  async getResumen(params = {}) {
    const response = await api.get('/movimientos/resumen', { params })
    return response.data
  },

  // ==================== DASHBOARD Y REPORTES ====================

  async getDashboardMensual(anio, mes) {
    const response = await api.get(`/movimientos/dashboard/mensual/${anio}/${mes}`)
    return response.data
  },

  async getDashboardAnual(anio) {
    const response = await api.get(`/movimientos/dashboard/anual/${anio}`)
    return response.data
  },

  async getReporte(fechaDesde, fechaHasta, tipo = null, categoria = null) {
    const params = { fechaDesde, fechaHasta }
    if (tipo) params.tipo = tipo
    if (categoria) params.categoria = categoria
    const response = await api.get('/movimientos/reporte', { params })
    return response.data
  }
}

export const eventosService = {
  async getAll() {
    const response = await api.get('/eventos')
    return response.data
  },

  async getById(id) {
    const response = await api.get(`/eventos/${id}`)
    return response.data
  },

  async create(data) {
    const response = await api.post('/eventos', data)
    return response.data
  },

  async cerrar(id) {
    const response = await api.post(`/eventos/${id}/cerrar`)
    return response.data
  },

  async getMovimientos(eventoId) {
    const response = await api.get(`/eventos/${eventoId}/movimientos`)
    return response.data
  },

  async addMovimiento(eventoId, data) {
    const response = await api.post(`/eventos/${eventoId}/movimientos`, data)
    return response.data
  },  async deleteMovimiento(eventoId, movimientoId) {
    const response = await api.delete(`/eventos/${eventoId}/movimientos/${movimientoId}`)
    return response.data
  },

  async marcarPago(eventoId, movimientoId, pagado) {
    const response = await api.patch(`/eventos/${eventoId}/movimientos/${movimientoId}/pago`, { pagado })
    return response.data
  }
}

export const estadisticasService = {
  async getFinancieras(fechaInicio = null, fechaFin = null) {
    const params = {}
    if (fechaInicio) params.fechaInicio = fechaInicio
    if (fechaFin) params.fechaFin = fechaFin
    const response = await api.get('/estadisticas/financieras', { params })
    return response.data
  }
}
