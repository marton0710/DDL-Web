import { apiRequest } from './client'

export const systemApi = {
  getVersion() {
    return apiRequest<string>('/api/version', { retryUnauthorized: false })
  },
}
