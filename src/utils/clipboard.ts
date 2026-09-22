export async function copyText(value: string): Promise<boolean> {
  if (window.isSecureContext && navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(value)
      return true
    } catch {
      // 剪贴板权限不可用时，尝试兼容方式。
    }
  }

  const previousFocus = document.activeElement as HTMLElement | null
  const input = document.createElement('textarea')
  input.value = value
  input.readOnly = true
  input.style.cssText = 'position:fixed;opacity:0;pointer-events:none;'
  // 放在当前弹窗内，避免焦点锁定打断复制。
  const container = previousFocus?.closest('[role="dialog"]') ?? document.body
  container.append(input)
  input.select()
  input.setSelectionRange(0, value.length)
  try {
    return document.execCommand('copy')
  } catch {
    return false
  } finally {
    input.remove()
    previousFocus?.focus({ preventScroll: true })
  }
}
