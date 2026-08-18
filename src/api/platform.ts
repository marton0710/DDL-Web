import { apiRequest } from './client'
import type {
  PlatformAuthMethod,
  PlatformCredentials,
  PlatformName,
} from './types'

function platformUrl(platform: PlatformName, action: string): string {
  return `/api/platform/${encodeURIComponent(platform)}/${action}`
}

export const platformApi = {
  getAuthMethod(platform: PlatformName) {
    return apiRequest<PlatformAuthMethod>(platformUrl(platform, 'auth_method'))
  },

  bind(platform: PlatformName, credentials: PlatformCredentials) {
    return apiRequest<void>(platformUrl(platform, 'bind'), {
      method: 'POST',
      body: credentials,
    })
  },

  unbind(platform: PlatformName) {
    return apiRequest<void>(platformUrl(platform, 'unbind'), {
      method: 'POST',
    })
  },

  getCookieValidity(platform: PlatformName) {
    return apiRequest<boolean | null>(platformUrl(platform, 'valid_cookie'))
  },
}
