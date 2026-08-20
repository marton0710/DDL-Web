import { apiRequest } from './client'
import type { CurrentUser, LoginInput, LoginResult } from './types'

export const authApi = {
  login(input: LoginInput) {
    return apiRequest<LoginResult>('/api/auth/login', {
      method: 'POST',
      body: input,
      retryUnauthorized: false,
    })
  },

  getCurrentUser() {
    return apiRequest<CurrentUser>('/api/auth/me')
  },

  logout() {
    return apiRequest<void>('/api/auth/logout', {
      method: 'POST',
    })
  },

  deleteAccount() {
    return apiRequest<void>('/api/auth/me', {
      method: 'DELETE',
    })
  },
}
