<script setup lang="ts">
import { ref } from 'vue'
import { useRoute } from 'vue-router'
import { NDrawer, NDrawerContent, NIcon } from 'naive-ui'
import { MenuOutline, NotificationsOutline } from '@vicons/ionicons5'

const route = useRoute()
const mobileOpen = ref(false)
</script>

<template>
  <header class="site-header">
    <div class="header-inner">
      <RouterLink class="brand" to="/" aria-label="聚合截止线首页">
        <img src="/assets/brand/logo-lockup-header.png" alt="聚合截止线" />
      </RouterLink>

      <nav class="desktop-nav" aria-label="主导航">
        <RouterLink to="/" :class="{ active: route.name === 'home' }">首页</RouterLink>
        <RouterLink to="/profile" :class="{ active: route.name === 'profile' }">我的</RouterLink>
        <RouterLink to="/about" :class="{ active: route.name === 'about' }">关于</RouterLink>
      </nav>

      <div class="header-actions">
        <button class="notification-button" type="button" aria-label="查看通知">
          <NIcon :size="25"><NotificationsOutline /></NIcon>
          <span class="notification-dot" />
        </button>
        <RouterLink class="avatar" to="/profile" aria-label="进入个人中心">张</RouterLink>
        <button class="mobile-menu-button" type="button" aria-label="打开导航" @click="mobileOpen = true">
          <NIcon :size="25"><MenuOutline /></NIcon>
        </button>
      </div>
    </div>
  </header>

  <NDrawer v-model:show="mobileOpen" placement="right" :width="260">
    <NDrawerContent title="页面导航" closable>
      <nav class="mobile-nav" aria-label="移动端导航">
        <RouterLink to="/" @click="mobileOpen = false">首页</RouterLink>
        <RouterLink to="/profile" @click="mobileOpen = false">我的</RouterLink>
        <RouterLink to="/about" @click="mobileOpen = false">关于</RouterLink>
        <RouterLink to="/login" @click="mobileOpen = false">退出登录</RouterLink>
      </nav>
    </NDrawerContent>
  </NDrawer>
</template>

<style scoped>
.site-header {
  position: sticky;
  top: 0;
  z-index: 30;
  height: 68px;
  background: linear-gradient(110deg, #062d59 0%, #021c3e 58%, #03274f 100%);
  box-shadow: 0 5px 20px rgba(0, 22, 51, 0.16);
}

.header-inner {
  position: relative;
  width: min(1536px, calc(100% - 48px));
  height: 100%;
  margin: 0 auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.brand {
  display: inline-flex;
  align-items: center;
}

.brand img {
  display: block;
  width: auto;
  height: 43px;
  object-fit: contain;
}

.desktop-nav {
  position: absolute;
  left: 50%;
  top: 0;
  height: 100%;
  display: flex;
  align-items: stretch;
  gap: 44px;
  transform: translateX(-50%);
}

.desktop-nav a {
  position: relative;
  min-width: 66px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: rgba(255, 255, 255, 0.72);
  font-size: 17px;
  transition: color 0.2s ease;
}

.desktop-nav a::after {
  content: '';
  position: absolute;
  left: 13px;
  right: 13px;
  bottom: 7px;
  height: 4px;
  border-radius: 8px;
  background: #1680ff;
  opacity: 0;
  transform: scaleX(0.65);
  transition: 0.2s ease;
}

.desktop-nav a:hover,
.desktop-nav a.active {
  color: #fff;
  font-weight: 600;
}

.desktop-nav a.active::after {
  opacity: 1;
  transform: scaleX(1);
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 20px;
}

.notification-button,
.mobile-menu-button {
  position: relative;
  border: 0;
  padding: 5px;
  color: #fff;
  background: transparent;
  cursor: pointer;
}

.notification-dot {
  position: absolute;
  top: 3px;
  right: 3px;
  width: 6px;
  height: 6px;
  border: 1px solid #073061;
  border-radius: 50%;
  background: #ff6038;
}

.avatar {
  width: 38px;
  height: 38px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  color: white;
  font-size: 17px;
  background: linear-gradient(135deg, #2588ff, #0755e9);
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.2);
}

.mobile-menu-button {
  display: none;
}

.mobile-nav {
  display: grid;
  gap: 8px;
}

.mobile-nav a {
  padding: 12px 14px;
  border-radius: 8px;
  color: #23395f;
  background: #f5f8fd;
}

.mobile-nav a.router-link-active {
  color: var(--primary);
  background: #eaf2ff;
}

@media (max-width: 768px) {
  .site-header {
    height: 60px;
  }

  .header-inner {
    width: calc(100% - 24px);
  }

  .brand img {
    height: 34px;
  }

  .desktop-nav,
  .notification-button {
    display: none;
  }

  .header-actions {
    gap: 8px;
  }

  .avatar {
    width: 34px;
    height: 34px;
    font-size: 15px;
  }

  .mobile-menu-button {
    display: inline-flex;
  }
}
</style>
