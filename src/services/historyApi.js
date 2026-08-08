import { api } from './apiClient'

export const historyApi = {
  get: (loadId) => api.get(`/loads/${loadId}/history`),
}
