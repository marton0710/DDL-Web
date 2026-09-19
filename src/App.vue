<script setup lang="ts">
import { computed } from 'vue'
import {
  NConfigProvider,
  NMessageProvider,
  darkTheme,
  dateZhCN,
  zhCN,
} from 'naive-ui'
import type { GlobalThemeOverrides } from 'naive-ui'
import { useTheme } from './state/theme'

const { isDark } = useTheme()

const lightThemeOverrides: GlobalThemeOverrides = {
  common: {
    primaryColor: '#0f6af5',
    primaryColorHover: '#2d7cf6',
    primaryColorPressed: '#0759d4',
    primaryColorSuppl: '#0f6af5',
  },
}

const darkThemeOverrides: GlobalThemeOverrides = {
  common: {
    primaryColor: '#1769e8',
    primaryColorHover: '#1b70ed',
    primaryColorPressed: '#0f5ed9',
    primaryColorSuppl: '#5b9eff',
    infoColor: '#5b9eff',
    successColor: '#35d0ba',
    warningColor: '#ff9f43',
    errorColor: '#ff667a',
    bodyColor: '#0b0f14',
    cardColor: '#111720',
    modalColor: '#171e29',
    popoverColor: '#1d2633',
    tableColor: '#111720',
    inputColor: '#171e29',
    actionColor: '#171e29',
    textColorBase: '#f5f7fa',
    textColor1: '#f5f7fa',
    textColor2: '#a7b1c2',
    textColor3: '#7f8a9b',
    textColorDisabled: '#5f6875',
    placeholderColor: '#7f8a9b',
    placeholderColorDisabled: '#5f6875',
    borderColor: '#3c4758',
    dividerColor: 'rgba(255, 255, 255, 0.08)',
    hoverColor: '#1d2633',
    tableHeaderColor: '#0e141d',
    tableColorHover: '#171e29',
  },
}

const activeTheme = computed(() => (isDark.value ? darkTheme : null))
const activeThemeOverrides = computed(() => (
  isDark.value ? darkThemeOverrides : lightThemeOverrides
))
</script>

<template>
  <NConfigProvider
    :locale="zhCN"
    :date-locale="dateZhCN"
    :theme="activeTheme"
    :theme-overrides="activeThemeOverrides"
  >
    <NMessageProvider>
      <RouterView />
    </NMessageProvider>
  </NConfigProvider>
</template>
