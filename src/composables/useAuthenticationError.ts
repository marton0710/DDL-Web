import { useRouter } from 'vue-router'
import { isAuthenticationError } from '../api/client'
import { useSession } from '../state/session'

export function useAuthenticationError() {
  const router = useRouter()
  const { clearSession } = useSession()

  return async (error: unknown): Promise<boolean> => {
    if (!isAuthenticationError(error)) return false
    clearSession()
    await router.replace('/login')
    return true
  }
}
