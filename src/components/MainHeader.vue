<script setup lang="ts">
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { NDrawer, NDrawerContent, NIcon, useMessage } from 'naive-ui'
import { LogOutOutline, MenuOutline, PersonOutline } from '@vicons/ionicons5'
import { authApi } from '../api/auth'
import { getApiErrorMessage } from '../api/client'
import { useSession } from '../state/session'

const route = useRoute()
const router = useRouter()
const message = useMessage()
const { avatarText, displayName, clearSession } = useSession()
const mobileOpen = ref(false)
const loggingOut = ref(false)

async function leaveSession() {
  if (loggingOut.value) return
  loggingOut.value = true
  try {
    await authApi.logout()
    clearSession()
    mobileOpen.value = false
    await router.replace('/login')
  } catch (error) {
    message.error(getApiErrorMessage(error, '退出登录失败，请稍后重试'))
  } finally {
    loggingOut.value = false
  }
}
</script>

<template>
  <header class="site-header">
    <div class="header-inner">
      <RouterLink class="brand" to="/home" aria-label="聚合截止线首页">
        <img src="/assets/brand/logo-lockup.png" alt="聚合截止线" />
      </RouterLink>

      <nav class="desktop-nav" aria-label="主导航">
        <RouterLink to="/home" :class="{ active: route.name === 'home' }">作业</RouterLink>
        <RouterLink to="/profile" :class="{ active: route.name === 'profile' }">我的</RouterLink>
        <RouterLink to="/about" :class="{ active: route.name === 'about' }">关于</RouterLink>
      </nav>

      <div class="header-actions">
        <RouterLink class="profile-entry" to="/profile" :aria-label="displayName ? `${displayName}的个人中心` : '进入个人中心'">
          <span class="profile-name">{{ displayName || '个人中心' }}</span>
          <span class="avatar">{{ avatarText }}</span>
        </RouterLink>
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
        <button class="mobile-logout" type="button" :disabled="loggingOut" @click="leaveSession">
          <NIcon><LogOutOutline /></NIcon>{{ loggingOut ? '正在退出…' : '退出登录' }}
        </button>
      </nav>
    </NDrawerContent>
  </NDrawer>
</template>

<style scoped>
.site-header {
  position: sticky;
  top: 0;
  z-index: 30;
  height: 64px;
  border-bottom: 1px solid rgba(218, 225, 235, 0.88);
  background: rgba(255, 255, 255, 0.9);
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
  color: #6b788d;
  font-size: 14px;
  font-weight: 600;
  transition: 0.18s ease;
}

.desktop-nav a:hover { color: #1769e8; background: #f1f5fc; }
.desktop-nav a.active { color: #1769e8; background: #eaf1ff; }

.header-actions { display: flex; align-items: center; }
.profile-entry { display: flex; align-items: center; gap: 10px; border-radius: 10px; padding: 5px 6px 5px 10px; transition: background 0.18s ease; }
.profile-entry:hover { background: #f2f5f9; }
.profile-name { max-width: 110px; overflow: hidden; color: #5d6b80; font-size: 12px; font-weight: 650; text-overflow: ellipsis; white-space: nowrap; }
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

.mobile-menu-button { display: none; border: 0; padding: 7px; color: #3e4e68; background: transparent; font-size: 25px; cursor: pointer; }
.drawer-profile { display: flex; align-items: center; gap: 12px; }
.drawer-profile > span { width: 38px; height: 38px; display: inline-flex; align-items: center; justify-content: center; border-radius: 11px; color: white; background: #1769e8; }
.drawer-profile > div { display: grid; }
.drawer-profile strong { color: #243550; font-size: 14px; }
.drawer-profile small { margin-top: 2px; color: #8a96a8; font-size: 10px; }

.mobile-nav { display: grid; gap: 7px; }
.mobile-nav a,
.mobile-logout { min-height: 44px; display: flex; align-items: center; gap: 9px; border: 0; border-radius: 10px; padding: 0 13px; color: #536178; background: transparent; font-size: 13px; font-weight: 650; text-align: left; cursor: pointer; }
.mobile-nav a.router-link-active { color: #1769e8; background: #eaf1ff; }
.mobile-logout { margin-top: 12px; color: #c92a3f; background: #fff1f3; }
.mobile-logout:disabled { opacity: 0.6; cursor: wait; }

@media (max-width: 720px) {
  .site-header { height: 58px; }
  .header-inner { width: calc(100% - 24px); }
  .brand img { width: 137px; height: 36px; }
  .desktop-nav,
  .profile-entry { display: none; }
  .mobile-menu-button { display: inline-flex; }
}
</style>
