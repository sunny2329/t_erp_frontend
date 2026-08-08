import { api } from './apiClient'

// Authenticated trigger — regenerates+saves the Load Confirmation PDF for
// one dispatched leg and emails the carrier a link-only "please review"
// message (see t_erp_backend/src/controllers/rateConSend.controller.js).
export const rateConApi = {
  send: (loadId, payload) => api.post(`/loads/${loadId}/rate-con/send`, payload),
}

// Public, unauthenticated — backs the /rate-confirm/:token/:assignmentId
// page a carrier opens from the emailed link. No JWT is sent/required; the
// token in the URL is the credential.
export const publicErateApi = {
  get: (token) => api.get(`/loads/erate/${token}`),
  update: (token, payload) => api.put(`/loads/erate/${token}`, payload),
}
