import { onMounted, onUnmounted, ref } from 'vue'

export function useCurrentTime() {
  const now = ref(Date.now())
  let intervalId: number
  const update = () => { now.value = Date.now() }
  const onVisibilityChange = () => {
    if (document.visibilityState === 'visible') update()
  }

  onMounted(() => {
    update()
    intervalId = window.setInterval(update, 30_000)
    document.addEventListener('visibilitychange', onVisibilityChange)
  })
  onUnmounted(() => {
    window.clearInterval(intervalId)
    document.removeEventListener('visibilitychange', onVisibilityChange)
  })

  return now
}
