import { api } from './apiClient'

export const dropdownApi = {
  getTypes: (typeId) => api.get('/dropdown/types', { type_id: typeId }),
  getCities: (q) => api.get('/dropdown/cities', { q }),
  getStates: () => api.get('/dropdown/states'),
}
