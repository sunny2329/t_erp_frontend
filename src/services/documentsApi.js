import { api } from './apiClient'

// documents is a nested resource, always scoped to a load — matches
// loadAssignmentsApi's shape (see dispatchApi.js).
export const documentsApi = {
  list: (loadId) => api.get(`/loads/${loadId}/documents`),
  upload: (loadId, file) => {
    const formData = new FormData()
    formData.append('file', file)
    return api.upload(`/loads/${loadId}/documents/upload`, formData)
  },
  create: (loadId, payload) => api.post(`/loads/${loadId}/documents`, payload),
  remove: (loadId, docId) => api.post(`/loads/${loadId}/documents/${docId}/delete`),
}
