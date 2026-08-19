import { computed, ref } from 'vue'

type ThemePreference = 'light' | 'dark' | 'system'
type ResolvedTheme = Exclude<ThemePreference, 'system'>

const STORAGE_KEY = 'ddl-theme-preference'
const preference = ref<ThemePreference>('system')
const systemPrefersDark = ref(false)
let initialized = false
let mediaQuery: MediaQueryList | null = null

const resolvedTheme = computed<ResolvedTheme>(() => {
  if (preference.value !== 'system') return preference.value
  return systemPrefersDark.value ? 'dark' : 'light'
})

const isDark = computed(() => resolvedTheme.value === 'dark')

function isThemePreference(value: string | null): value is ThemePreference {
  return value === 'light' || value === 'dark' || value === 'system'
}

function applyTheme(theme: ResolvedTheme) {
  const root = document.documentElement
  root.dataset.theme = theme
  root.style.colorScheme = theme
}

function handleSystemThemeChange(event: MediaQueryListEvent) {
  systemPrefersDark.value = event.matches
  if (preference.value === 'system') applyTheme(resolvedTheme.value)
}

function initializeTheme() {
  if (initialized || typeof window === 'undefined') return
  initialized = true

  let savedPreference: string | null = null
  try {
    savedPreference = window.localStorage.getItem(STORAGE_KEY)
  } catch {
    // 浏览器禁用存储时仍可跟随系统主题。
  }
  if (isThemePreference(savedPreference)) preference.value = savedPreference

  mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
  systemPrefersDark.value = mediaQuery.matches
  mediaQuery.addEventListener('change', handleSystemThemeChange)
  applyTheme(resolvedTheme.value)
}

function setThemePreference(nextPreference: ThemePreference) {
  preference.value = nextPreference
  try {
    window.localStorage.setItem(STORAGE_KEY, nextPreference)
  } catch {
    // 存储不可用时仅保持当前会话内的主题选择。
  }
  applyTheme(resolvedTheme.value)
}

function toggleTheme() {
  setThemePreference(isDark.value ? 'light' : 'dark')
}

export function useTheme() {
  initializeTheme()

  return {
    isDark,
    toggleTheme,
  }
}
