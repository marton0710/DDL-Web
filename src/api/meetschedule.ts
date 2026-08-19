import { apiRequest } from './client'
import type { MeetScheduleConfig } from './types'

export const meetScheduleApi = {
  bind(input: MeetScheduleConfig) {
    return apiRequest<void>('/api/meetschedule/bind', {
      method: 'POST',
      body: input,
    })
  },
}
