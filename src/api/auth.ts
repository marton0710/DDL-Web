import { apiRequest } from './client'
import type {
  CurrentUser,
  LoginInput,
  LoginQRCodeResult,
  LoginResult,
  QRCodeLoginInput,
  QRCodeLoginResult,
} from './types'

export const authApi = {
  login(input: LoginInput) {
    return apiRequest<LoginResult>('/api/auth/login', {
      method: 'POST',
      body: input,
      retryUnauthorized: false,
    })
  },

  getLoginQRCode(signal?: AbortSignal) {
    return apiRequest<LoginQRCodeResult>('/api/auth/qrcode_login', {
      signal,
      retryUnauthorized: false,
    })
  },

  loginWithQRCode(input: QRCodeLoginInput, signal?: AbortSignal) {
    return apiRequest<QRCodeLoginResult>('/api/auth/qrcode_login', {
      method: 'POST',
      body: input,
      signal,
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
