<script setup lang="ts">
import { ref } from 'vue'
import { useRoute } from 'vue-router'
import { NDrawer, NDrawerContent, NIcon, NSwitch } from 'naive-ui'
import { MenuOutline, MoonOutline, PersonOutline, SunnyOutline } from '@vicons/ionicons5'
import AccountActions from './AccountActions.vue'
import { useSession } from '../state/session'
import { useTheme } from '../state/theme'

const route = useRoute()
const { avatarText, displayName } = useSession()
const { isDark, toggleTheme } = useTheme()
const mobileOpen = ref(false)
</script>

<template>
  <header class="site-header">
    <div class="header-inner">
      <RouterLink class="brand" to="/home" aria-label="聚合截止线首页">
        <img
          :src="isDark ? '/assets/brand/logo-lockup-header.png' : '/assets/brand/logo-lockup.png'"
          alt="聚合截止线"
        />
      </RouterLink>

      <nav class="desktop-nav" aria-label="主导航">
        <RouterLink to="/home" :class="{ active: route.name === 'home' }">作业</RouterLink>
        <RouterLink to="/profile" :class="{ active: route.name === 'profile' }">我的</RouterLink>
        <RouterLink to="/about" :class="{ active: route.name === 'about' }">关于</RouterLink>
      </nav>

      <div class="header-actions">
        <div class="theme-switch" :title="isDark ? '切换到浅色模式' : '切换到深色模式'">
          <NIcon><SunnyOutline v-if="isDark" /><MoonOutline v-else /></NIcon>
          <NSwitch
            :value="isDark"
            size="small"
            :aria-label="isDark ? '切换到浅色模式' : '切换到深色模式'"
            @update:value="toggleTheme"
          />
        </div>
        <div class="profile-entry" :aria-label="displayName ? `当前用户：${displayName}` : '当前用户'">
          <span class="profile-name">{{ displayName || '个人中心' }}</span>
          <span class="avatar">{{ avatarText }}</span>
        </div>
        <button class="mobile-menu-button" type="button" aria-label="打开导航" @click="mobileOpen = true">
          <NIcon><MenuOutline /></NIcon>
        </button>
      </div>
    </div>
  </header>

  <NDrawer v-model:show="mobileOpen" placement="right" :width="282">
    <NDrawerContent closable>
      <template #header>
        <div class="drawer-profile"><span>{{ avatarText }}</span><div><strong>{{ displayName || '个人中心' }}</strong><small>聚合截止线</small></div></div>
      </template>
      <nav class="mobile-nav" aria-label="移动端导航">
        <RouterLink to="/home" @click="mobileOpen = false">作业</RouterLink>
        <RouterLink to="/profile" @click="mobileOpen = false"><NIcon><PersonOutline /></NIcon>我的</RouterLink>
        <RouterLink to="/about" @click="mobileOpen = false">关于项目</RouterLink>
      </nav>
      <div class="mobile-session-action">
        <AccountActions
          variant="mobile"
          :username="displayName"
          :show-deletion="false"
        />
      </div>
      <template #footer>
        <div class="mobile-delete-action">
          <AccountActions
            variant="mobile"
            :username="displayName"
            :show-logout="false"
          />
        </div>
      </template>
    </NDrawerContent>
  </NDrawer>
</template>

<style scoped>
.site-header {
  position: sticky;
  top: 0;
  z-index: 30;
  height: 64px;
  border-bottom: 1px solid var(--header-border);
  background: var(--header-bg);
  backdrop-filter: blur(18px);
}

.header-inner {
  position: relative;
  width: min(1360px, calc(100% - 48px));
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin: 0 auto;
}

.brand { display: inline-flex; align-items: center; }
.brand img { width: 156px; height: 41px; display: block; object-fit: contain; }

.desktop-nav {
  position: absolute;
  left: 50%;
  display: flex;
  align-items: center;
  gap: 4px;
  transform: translateX(-50%);
}

.desktop-nav a {
  min-width: 70px;
  height: 38px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 9px;
  color: var(--text-secondary);
  font-size: 14px;
  font-weight: 600;
  transition: 0.18s ease;
}

.desktop-nav a:hover { color: var(--primary-text); background: var(--primary-soft); }
.desktop-nav a.active { color: var(--primary-soft-text); background: var(--primary-soft); }

.header-actions { display: flex; align-items: center; gap: 12px; }
.theme-switch { display: flex; align-items: center; gap: 7px; color: var(--text-tertiary); font-size: 17px; }
.profile-entry { display: flex; align-items: center; gap: 10px; border-radius: 10px; padding: 5px 6px 5px 10px; }
.profile-name { max-width: 110px; overflow: hidden; color: var(--text-secondary); font-size: 12px; font-weight: 650; text-overflow: ellipsis; white-space: nowrap; }
.avatar {
  width: 34px;
  height: 34px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 10px;
  color: white;
  background: linear-gradient(145deg, #2d7df0, #145cca);
  font-size: 14px;
  font-weight: 750;
  box-shadow: 0 5px 12px rgba(23, 105, 232, 0.2);
}

.mobile-menu-button { display: none; border: 0; padding: 7px; color: var(--text-secondary); background: transparent; font-size: 25px; cursor: pointer; }
.drawer-profile { display: flex; align-items: center; gap: 12px; }
.drawer-profile > span { width: 38px; height: 38px; display: inline-flex; align-items: center; justify-content: center; border-radius: 11px; color: white; background: var(--primary); }
.drawer-profile > div { display: grid; }
.drawer-profile strong { color: var(--text-strong); font-size: 14px; }
.drawer-profile small { margin-top: 2px; color: var(--text-tertiary); font-size: 10px; }

.mobile-nav { display: grid; gap: 7px; }
.mobile-nav a { min-height: 44px; display: flex; align-items: center; gap: 9px; border: 0; border-radius: 10px; padding: 0 13px; color: var(--text-secondary); background: transparent; font-size: 13px; font-weight: 650; text-align: left; cursor: pointer; }
.mobile-nav a.router-link-active { color: var(--primary-soft-text); background: var(--primary-soft); }
.mobile-session-action { margin-top: 12px; border-top: 1px solid var(--line-soft); padding-top: 12px; }
.mobile-delete-action { width: 100%; }

@media (max-width: 720px) {
  .site-header { height: 58px; }
  .header-inner { width: calc(100% - 24px); }
  .brand img { width: 137px; height: 36px; }
  .desktop-nav,
  .profile-entry { display: none; }
  .theme-switch { gap: 5px; }
  .mobile-menu-button { display: inline-flex; }
}
</style>
