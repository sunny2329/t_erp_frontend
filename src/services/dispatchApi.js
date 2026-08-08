import { api } from './apiClient'

// load_assignments is a nested resource — every operation is scoped to a
// specific load, so this isn't a createMasterApi() shape.
export const loadAssignmentsApi = {
  list: (loadId) => api.get(`/loads/${loadId}/assignments`),
  create: (loadId, payload) => api.post(`/loads/${loadId}/assignments`, payload),
  update: (loadId, legId, payload) => api.post(`/loads/${loadId}/assignments/${legId}`, payload),
  remove: (loadId, legId) => api.post(`/loads/${loadId}/assignments/${legId}/delete`),
  // Plain camelCase fields straight off the dispatch form's state — see
  // t_erp_backend loadAssignments.service.js checkConflicts.
  checkConflicts: (loadId, payload) => api.post(`/loads/${loadId}/assignments/check-conflicts`, payload),
}

// "Who currently drives this truck" — see t_erp_backend
// driverVehicleMapping.service.js. Used by CompanyDispatchModal to auto-fill
// Driver 1/2 as soon as a vehicle is picked.
export const driverVehicleMappingApi = {
  activeDriversForVehicle: (vehicleId) => api.get(`/vehicles/${vehicleId}/active-drivers`),
}
