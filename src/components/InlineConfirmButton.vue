<script setup lang="ts">
import { ref, watch } from 'vue'
import { NButton } from 'naive-ui'

defineOptions({ inheritAttrs: false })
const props = defineProps<{
  label: string
  confirmLabel: string
  subject?: string
  loading?: boolean
  disabled?: boolean
  quaternary?: boolean
}>()
const emit = defineEmits<{ confirm: [] }>()
const confirming = ref(false)
let button: HTMLElement | null = null

function handleClick(event: MouseEvent) {
  if (confirming.value) {
    confirming.value = false
    emit('confirm')
  } else {
    button = event.currentTarget as HTMLElement
    confirming.value = true
  }
}

function handleEscape(event: KeyboardEvent) {
  if (!confirming.value) return
  confirming.value = false
  event.stopPropagation()
}

watch(confirming, (active, _, onCleanup) => {
  if (!active) return
  const cancelOutside = (event: PointerEvent) => {
    if (!button?.contains(event.target as Node)) confirming.value = false
  }
  document.addEventListener('pointerdown', cancelOutside, true)
  onCleanup(() => document.removeEventListener('pointerdown', cancelOutside, true))
})
</script>

<template>
  <NButton
    v-bind="$attrs"
    :quaternary="quaternary && !(confirming && $slots.icon)"
    :loading="props.loading"
    :disabled="props.disabled || props.loading"
    :aria-label="`${confirming ? confirmLabel : label}${subject ? ` ${subject}` : ''}`"
    :title="$slots.icon ? (confirming ? confirmLabel : label) : undefined"
    @click="handleClick"
    @blur="confirming = false"
    @keydown.esc="handleEscape"
  >
    <template v-if="$slots.icon" #icon><slot name="icon" :confirming="confirming" /></template>
    <template v-if="!$slots.icon" #default>{{ confirming ? confirmLabel : label }}</template>
  </NButton>
</template>
