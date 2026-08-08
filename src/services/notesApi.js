import { api } from './apiClient'

// notes is a nested resource, always scoped to a load — matches
// loadAssignmentsApi's shape (see dispatchApi.js).
export const notesApi = {
  list: (loadId) => api.get(`/loads/${loadId}/notes`),
  create: (loadId, payload) => api.post(`/loads/${loadId}/notes`, payload),
  update: (loadId, noteId, payload) => api.post(`/loads/${loadId}/notes/${noteId}`, payload),
  remove: (loadId, noteId) => api.post(`/loads/${loadId}/notes/${noteId}/delete`),
}
