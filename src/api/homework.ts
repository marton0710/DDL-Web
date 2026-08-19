import { apiRequest } from './client'
import type { HomeworkResponse } from './types'

export const homeworkApi = {
  getHomeworks() {
    return apiRequest<HomeworkResponse>('/api/homework')
  },

  refresh() {
    return apiRequest<string[]>('/api/homework/refresh', {
      method: 'POST',
    })
  },

  setCompleted(id: string, isComplete: boolean) {
    return apiRequest<void>(`/api/homework/${encodeURIComponent(id)}/complete`, {
      method: 'POST',
      body: { is_complete: isComplete },
    })
  },
}
