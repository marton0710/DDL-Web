import { computed, ref } from 'vue'

const storageKey = 'ddl-web.display-name'
const displayName = ref(sessionStorage.getItem(storageKey) ?? '')

const avatarText = computed(() => displayName.value.trim().charAt(0) || '我')

export function useSession() {
  function setDisplayName(name: string) {
    displayName.value = name.trim()
    sessionStorage.setItem(storageKey, displayName.value)
  }

  function clearSession() {
    displayName.value = ''
    sessionStorage.removeItem(storageKey)
  }

  return {
    displayName,
    avatarText,
    setDisplayName,
    clearSession,
  }
}
