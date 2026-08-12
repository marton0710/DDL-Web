import { apiRequest } from './client'
import type {
  PlatformAuthMethod,
  PlatformCookieValidity,
  PlatformCredentials,
  PlatformName,
} from './types'

function platformUrl(platform: PlatformName, action: string): string {
  return `/api/homework/platform/${encodeURIComponent(platform)}/${action}`
}

export const platformApi = {
  getAuthMethod(platform: PlatformName) {
    return apiRequest<PlatformAuthMethod>(platformUrl(platform, 'auth_method'))
  },

  bind(platform: PlatformName, credentials: PlatformCredentials) {
    return apiRequest<void>(platformUrl(platform, 'bind'), {
      method: 'POST',
      body: credentials,
      authentication: 'resource',
    })
  },

  unbind(platform: PlatformName) {
    return apiRequest<void>(platformUrl(platform, 'unbind'), {
      method: 'POST',
    })
  },

  getCookieValidity(platform: PlatformName) {
    return apiRequest<PlatformCookieValidity>(platformUrl(platform, 'valid_cookie'), {
      authentication: 'resource',
    })
  },
}
