import { apiRequest, getApiUrl } from './client'
import type { IcsSubscription, IcsSubscriptionCreated } from './types'

export const icsApi = {
  list() {
    return apiRequest<IcsSubscription[]>('/api/ics/subscription')
  },

  create() {
    return apiRequest<IcsSubscriptionCreated>('/api/ics/subscription', { method: 'POST' })
  },

  revoke(id: string) {
    return apiRequest<void>(`/api/ics/subscription/${encodeURIComponent(id)}`, { method: 'DELETE' })
  },
}

export function getIcsFeedUrl(token: string): string {
  return new URL(getApiUrl(`/api/ics/feed/${encodeURIComponent(token)}.ics`), window.location.origin).href
}
