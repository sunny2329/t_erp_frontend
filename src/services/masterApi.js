import { api } from './apiClient'

// Every master module (carriers, customers, drivers, vehicles, trailers,
// locations, terminal, users) exposes the same REST shape on the backend —
// see t_erp_backend/README.md. `is_active=all` is passed so masters pages
// show inactive rows too (they're managed there, not hidden).
export function createMasterApi(basePath) {
  return {
    list: (extraParams = {}) => api.get(basePath, { pageSize: -1, is_active: 'all', ...extraParams }),
    getById: (id) => api.get(`${basePath}/${id}`),
    create: (payload) => api.post(`${basePath}/create`, payload),
    update: (id, payload) => api.post(`${basePath}/update/${id}`, payload),
    remove: (id) => api.post(`${basePath}/delete/${id}`),
  }
}

export const carriersApi = createMasterApi('/carriers')
export const customersApi = createMasterApi('/customers')
export const driversApi = createMasterApi('/drivers')
export const vehiclesApi = createMasterApi('/vehicles')
export const trailersApi = createMasterApi('/trailers')
export const locationsApi = createMasterApi('/locations')
export const terminalsApi = createMasterApi('/terminal')
export const usersApi = createMasterApi('/users')
export const pagesApi = createMasterApi('/pages')
export const loadsApi = {
  ...createMasterApi('/loads'),
  checkCustomerRef: (ref) => api.get('/loads/check-customer-ref', { ref }),
}
