import { apiRequest } from './client'
import type { CurrentUser, LoginInput, LoginResult, UserInfoPatch } from './types'

export const authApi = {
  login(input: LoginInput) {
    return apiRequest<LoginResult>('/api/auth/login', {
      method: 'POST',
      body: input,
      retryUnauthorized: false,
    })
  },

  getCurrentUser() {
    return apiRequest<CurrentUser>('/api/auth/me', {
      retryUnauthorized: false,
    })
  },

  updateUserInfo(input: UserInfoPatch) {
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
