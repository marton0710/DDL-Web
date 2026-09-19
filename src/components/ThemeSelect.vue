<script setup lang="ts">
import { NSelect } from 'naive-ui'
import { useTheme } from '../state/theme'

const { preference, setThemePreference } = useTheme()
const options = [
  { label: '跟随系统', value: 'system' },
  { label: '浅色', value: 'light' },
  { label: '深色', value: 'dark' },
]
</script>

<template>
  <NSelect
    class="theme-select"
    :value="preference"
    :options="options"
    size="small"
    aria-label="主题模式"
    @update:value="setThemePreference"
  />
</template>

<style scoped>
.theme-select { width: 116px; }
</style>
