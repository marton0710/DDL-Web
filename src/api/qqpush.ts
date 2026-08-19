import { apiRequest } from './client'
import type { QqPushConfig } from './types'

export const qqPushApi = {
  configure(input: QqPushConfig) {
    return apiRequest<void>('/api/qqpush/configure', {
      method: 'POST',
      body: input,
    })
  },
}
