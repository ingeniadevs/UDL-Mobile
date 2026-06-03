import api from './api';

const ENDPOINTS = {
  PLANES: '/planesmembresia',
  ESTADISTICAS: '/planesmembresia/estadisticas'
};

export const planesService = {
  // Obtener todos los planes
  async getAll(activo = null) {
    const params = activo !== null ? { activo } : {};
    const response = await api.get(ENDPOINTS.PLANES, { params });
    return response.data;
  },

  // Obtener un plan por ID
  async getById(id) {
    const response = await api.get(`${ENDPOINTS.PLANES}/${id}`);
    return response.data;
  },

  // Crear un nuevo plan
  async create(planData) {
    const response = await api.post(ENDPOINTS.PLANES, planData);
    return response.data;
  },

  // Actualizar un plan
  async update(id, planData) {
    const response = await api.put(`${ENDPOINTS.PLANES}/${id}`, planData);
    return response.data;
  },

  // Eliminar un plan
  async delete(id) {
    const response = await api.delete(`${ENDPOINTS.PLANES}/${id}`);
    return response.data;
  },

  // Obtener estadísticas
  async getEstadisticas() {
    const response = await api.get(ENDPOINTS.ESTADISTICAS);
    return response.data;
  }
};
