import { apiRequest } from './client'
import type { CurrentUser, LoginInput, LoginResult, UserInfoPatch } from './types'

export const authApi = {
  login(input: LoginInput) {
    return apiRequest<LoginResult>('/api/auth/login', {
      method: 'POST',
      body: input,
      authentication: 'none',
    })
  },

  logout() {
    return apiRequest<void>('/api/auth/logout', {
      method: 'POST',
      authentication: 'none',
    })
  },

  getCurrentUser() {
    return apiRequest<CurrentUser>('/api/auth/me')
  },

  updateUserInfo(input: UserInfoPatch) {
    return apiRequest<void>('/api/auth/userinfo', {
      method: 'PATCH',
      body: input,
    })
  },
}
