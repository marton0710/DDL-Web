import { apiRequest } from './client'
import type {
  HomeworkQuery,
  HomeworkResponse,
  PlatformName,
} from './types'

function homeworkUrl(query: HomeworkQuery = {}): string {
  const search = new URLSearchParams()

  if (query.num !== undefined) search.set('num', String(query.num))
  if (query.page !== undefined) search.set('page', String(query.page))
  if (query.platform !== undefined) search.set('platform', query.platform)

  const queryString = search.toString()
  return queryString ? `/api/homework?${queryString}` : '/api/homework'
}

export const homeworkApi = {
  getHomeworks(query: HomeworkQuery = {}) {
    return apiRequest<HomeworkResponse>(homeworkUrl(query))
  },

  refresh(platform?: PlatformName) {
    const query = platform
      ? `?${new URLSearchParams({ platform }).toString()}`
      : ''
    return apiRequest<string[]>(`/api/homework/refresh${query}`, {
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
