import api from './api'

const BASE = '/inventario'

// ══════════════════════════════════════════════════════
// ARTÍCULOS
// ══════════════════════════════════════════════════════

export const getArticulos = (params = {}) =>
  api.get(`${BASE}/articulos`, { params }).then(r => r.data)

export const getArticulo = (id) =>
  api.get(`${BASE}/articulos/${id}`).then(r => r.data)

export const crearArticulo = (data) =>
  api.post(`${BASE}/articulos`, data).then(r => r.data)

export const actualizarArticulo = (id, data) =>
  api.put(`${BASE}/articulos/${id}`, { ...data, id }).then(r => r.data)

export const eliminarArticulo = (id) =>
  api.delete(`${BASE}/articulos/${id}`).then(r => r.data)

// ══════════════════════════════════════════════════════
// UBICACIONES
// ══════════════════════════════════════════════════════

export const getUbicaciones = (params = {}) =>
  api.get(`${BASE}/ubicaciones`, { params }).then(r => r.data)

export const crearUbicacion = (data) =>
  api.post(`${BASE}/ubicaciones`, data).then(r => r.data)

export const actualizarUbicacion = (id, data) =>
  api.put(`${BASE}/ubicaciones/${id}`, { ...data, id }).then(r => r.data)

export const eliminarUbicacion = (id) =>
  api.delete(`${BASE}/ubicaciones/${id}`).then(r => r.data)

// ══════════════════════════════════════════════════════
// MOVIMIENTOS
// ══════════════════════════════════════════════════════

export const getMovimientos = (params = {}) =>
  api.get(`${BASE}/movimientos`, { params }).then(r => r.data)

export const registrarEntrada = (data) =>
  api.post(`${BASE}/movimientos/entrada`, data).then(r => r.data)

export const registrarSalida = (data) =>
  api.post(`${BASE}/movimientos/salida`, data).then(r => r.data)

export const registrarPrestamo = (data) =>
  api.post(`${BASE}/movimientos/prestamo`, data).then(r => r.data)

export const registrarDevolucion = (data) =>
  api.post(`${BASE}/movimientos/devolucion`, data).then(r => r.data)

export const registrarTransferencia = (data) =>
  api.post(`${BASE}/movimientos/transferencia`, data).then(r => r.data)

export const registrarAjuste = (data) =>
  api.post(`${BASE}/movimientos/ajuste`, data).then(r => r.data)

// ══════════════════════════════════════════════════════
// MANTENIMIENTOS
// ══════════════════════════════════════════════════════

export const getMantenimientos = (params = {}) =>
  api.get(`${BASE}/mantenimientos`, { params }).then(r => r.data)

export const registrarMantenimiento = (data) =>
  api.post(`${BASE}/mantenimientos`, data).then(r => r.data)

export const completarMantenimiento = (id, data) =>
  api.put(`${BASE}/mantenimientos/${id}/completar`, { ...data, id }).then(r => r.data)

// ══════════════════════════════════════════════════════
// REPORTES Y ALERTAS
// ══════════════════════════════════════════════════════

export const getReporte = () =>
  api.get(`${BASE}/reporte`).then(r => r.data)

export const getAlertas = () =>
  api.get(`${BASE}/alertas`).then(r => r.data)
