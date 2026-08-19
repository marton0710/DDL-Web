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
    borderRadius: '10px',
    fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Helvetica Neue", "PingFang SC", "Microsoft YaHei", sans-serif',
  },
  Select: {
    menuBoxShadow: '0 14px 36px rgba(34, 53, 80, 0.14)',
    peers: {
      InternalSelection: {
        heightMedium: '38px',
        borderRadius: '10px',
        color: '#ffffff',
        colorActive: '#ffffff',
        textColor: '#34445e',
        placeholderColor: '#7f8b9d',
        arrowColor: '#768398',
        border: '1px solid #d5dde8',
        borderHover: '1px solid #1769e8',
        borderActive: '1px solid #1769e8',
        borderFocus: '1px solid #1769e8',
        boxShadowActive: '0 0 0 2px rgba(23, 105, 232, 0.16)',
        boxShadowFocus: '0 0 0 2px rgba(23, 105, 232, 0.16)',
      },
      InternalSelectMenu: {
        color: '#ffffff',
        borderRadius: '10px',
        optionFontSizeMedium: '13px',
        optionHeightMedium: '42px',
        optionPaddingMedium: '0 12px',
        paddingMedium: '6px',
        optionTextColor: '#34445e',
        optionTextColorActive: '#1769e8',
        optionCheckColor: '#1769e8',
        optionColorPending: '#f1f5fc',
        optionColorActive: '#eaf2ff',
        optionColorActivePending: '#e1ecff',
      },
    },
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
    borderRadius: '10px',
    fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Helvetica Neue", "PingFang SC", "Microsoft YaHei", sans-serif',
  },
  Button: {
    colorPrimary: '#1769e8',
    colorHoverPrimary: '#1b70ed',
    colorPressedPrimary: '#0f5ed9',
    colorFocusPrimary: '#1769e8',
    textColorPrimary: '#ffffff',
    textColorHoverPrimary: '#ffffff',
    textColorPressedPrimary: '#ffffff',
    textColorFocusPrimary: '#ffffff',
    textColorDisabledPrimary: 'rgba(255, 255, 255, 0.58)',
    colorError: '#c92a3f',
    colorHoverError: '#d43a50',
    colorPressedError: '#b92339',
    colorFocusError: '#c92a3f',
    textColorError: '#ffffff',
    textColorHoverError: '#ffffff',
    textColorPressedError: '#ffffff',
    textColorFocusError: '#ffffff',
  },
  Input: {
    color: '#171e29',
    colorFocus: '#171e29',
    colorDisabled: '#111720',
    textColor: '#f5f7fa',
    placeholderColor: '#7f8a9b',
    iconColor: '#a7b1c2',
    suffixTextColor: '#a7b1c2',
    border: '1px solid #5e6d82',
    borderHover: '1px solid #5b9eff',
    borderFocus: '1px solid #5b9eff',
    borderDisabled: '1px solid #3c4758',
    boxShadowFocus: '0 0 0 2px rgba(91, 158, 255, 0.28)',
  },
  Select: {
    menuBoxShadow: '0 18px 44px rgba(0, 0, 0, 0.46)',
    peers: {
      InternalSelection: {
        heightMedium: '38px',
        borderRadius: '10px',
        color: '#171e29',
        colorActive: '#1d2633',
        textColor: '#f5f7fa',
        placeholderColor: '#7f8a9b',
        arrowColor: '#a7b1c2',
        border: '1px solid #5e6d82',
        borderHover: '1px solid #5b9eff',
        borderActive: '1px solid #5b9eff',
        borderFocus: '1px solid #5b9eff',
        boxShadowActive: '0 0 0 2px rgba(91, 158, 255, 0.28)',
        boxShadowFocus: '0 0 0 2px rgba(91, 158, 255, 0.28)',
      },
      InternalSelectMenu: {
        color: '#1d2633',
        borderRadius: '10px',
        optionFontSizeMedium: '13px',
        optionHeightMedium: '42px',
        optionPaddingMedium: '0 12px',
        paddingMedium: '6px',
        optionTextColor: '#d5dce8',
        optionTextColorActive: '#dce8ff',
        optionCheckColor: '#5b9eff',
        optionColorPending: '#253142',
        optionColorActive: '#102b4e',
        optionColorActivePending: '#15365e',
      },
    },
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
