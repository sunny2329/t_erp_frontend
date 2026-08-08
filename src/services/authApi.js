import { api } from './apiClient'

export const authApi = {
  login: (loginId, password) => api.post('/auth/login', { loginId, password }),
  logout: () => api.post('/auth/logout'),
  me: () => api.get('/auth/me'),
}
