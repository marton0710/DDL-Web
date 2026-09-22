<script setup lang="ts">
import { NButton, NIcon } from 'naive-ui'
import { CopyOutline } from '@vicons/ionicons5'

defineProps<{ label: string }>()
</script>

<template>
  <NButton class="copy-button" quaternary type="primary" :aria-label="label" :title="label">
    <template #icon><NIcon :size="20"><CopyOutline /></NIcon></template>
  </NButton>
</template>

<style scoped>
.copy-button { width: 40px; height: 40px; flex-shrink: 0; }
</style>
