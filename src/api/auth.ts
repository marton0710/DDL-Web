import { apiRequest } from './client'
import type { CurrentUser, LoginInput, LoginResult, UserBindingPatch } from './types'

export const authApi = {
  refresh() {
    return apiRequest<void>('/api/auth/refresh', {
      method: 'POST',
      retryUnauthorized: false,
    })
  },

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

  updateBindings(input: UserBindingPatch) {
    return apiRequest<void>('/api/auth/userinfo', {
      method: 'PATCH',
      body: input,
    })
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
