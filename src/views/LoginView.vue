<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { NButton, NIcon, NInput } from 'naive-ui'
import {
  EyeOffOutline,
  EyeOutline,
  LayersOutline,
  LockClosedOutline,
  PersonOutline,
  ShieldCheckmarkOutline,
} from '@vicons/ionicons5'

const router = useRouter()
const account = ref('')
const password = ref('')
const showPassword = ref(false)

function submitLogin() {
  router.push('/')
}
</script>

<template>
  <div class="login-page">
    <header class="login-header">
      <RouterLink to="/" class="login-brand">
        <img src="/assets/brand/logo-lockup-header.png" alt="聚合截止线" />
      </RouterLink>
      <nav>
        <RouterLink to="/about">关于项目</RouterLink>
        <i />
        <button type="button" @click="router.push('/about')">隐私说明</button>
      </nav>
    </header>

    <main class="login-main">
      <section class="login-art" aria-label="聚合截止时间插画">
        <div class="art-glow" />
        <img src="/assets/illustrations/deadline-calendar.png" alt="日历、绿植与时钟" />
      </section>

      <section class="login-card">
        <div class="login-card-heading">
          <h1>统一认证登录</h1>
          <p>首次登录将自动注册，无需单独注册</p>
        </div>

        <form @submit.prevent="submitLogin">
          <NInput v-model:value="account" size="large" placeholder="学号 / 工号" aria-label="学号或工号">
            <template #prefix><NIcon :size="25"><PersonOutline /></NIcon></template>
          </NInput>
          <NInput
            v-model:value="password"
            size="large"
            :type="showPassword ? 'text' : 'password'"
            placeholder="密码"
            aria-label="密码"
          >
            <template #prefix><NIcon :size="23"><LockClosedOutline /></NIcon></template>
            <template #suffix>
              <button class="password-toggle" type="button" :aria-label="showPassword ? '隐藏密码' : '显示密码'" @click="showPassword = !showPassword">
                <NIcon :size="23"><EyeOffOutline v-if="showPassword" /><EyeOutline v-else /></NIcon>
              </button>
            </template>
          </NInput>
          <NButton attr-type="submit" type="primary" size="large" block>登录</NButton>
        </form>

        <div class="login-note primary-note">
          <NIcon :size="25"><ShieldCheckmarkOutline /></NIcon>
          <span>此账号仅用于登录聚合截止线，不用于获取作业</span>
        </div>
        <div class="login-note">
          <NIcon :size="23"><LayersOutline /></NIcon>
          <span>登录后，可在「我的」中按需绑定学习平台</span>
        </div>
      </section>
    </main>
  </div>
</template>

<style scoped>
.login-page {
  min-height: 100vh;
  background:
    radial-gradient(circle at 15% 58%, rgba(213, 229, 255, 0.38), transparent 23%),
    linear-gradient(180deg, #fbfdff 0%, #f7faff 100%);
}

.login-header {
  height: 96px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 34px;
  background: linear-gradient(110deg, #062e5b 0%, #031e40 68%, #042952 100%);
}

.login-brand img {
  display: block;
  height: 58px;
  width: auto;
}

.login-header nav {
  display: flex;
  align-items: center;
  gap: 26px;
  color: rgba(255, 255, 255, 0.88);
  font-size: 16px;
}

.login-header nav i {
  width: 1px;
  height: 25px;
  background: rgba(255, 255, 255, 0.22);
}

.login-header nav button {
  border: 0;
  padding: 0;
  color: inherit;
  background: transparent;
  cursor: pointer;
}

.login-main {
  width: min(1420px, calc(100% - 64px));
  min-height: calc(100vh - 96px);
  display: grid;
  grid-template-columns: 1fr 0.95fr;
  align-items: center;
  gap: 70px;
  margin: 0 auto;
  padding: 52px 0 70px;
}

.login-art {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
}

.art-glow {
  position: absolute;
  width: 520px;
  height: 360px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(206, 225, 255, 0.62), rgba(229, 239, 255, 0.22) 60%, transparent 72%);
}

.login-art img {
  position: relative;
  z-index: 1;
  width: min(100%, 650px);
  filter: drop-shadow(0 24px 24px rgba(58, 104, 164, 0.12));
}

.login-card {
  width: min(100%, 700px);
  justify-self: center;
  padding: 62px 50px 50px;
  border: 1px solid #e0e7f1;
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.95);
  box-shadow: 0 22px 52px rgba(40, 74, 119, 0.09);
}

.login-card-heading {
  margin-bottom: 34px;
  text-align: center;
}

.login-card h1 {
  margin: 0 0 12px;
  font-size: 35px;
  letter-spacing: 1px;
}

.login-card-heading p {
  margin: 0;
  color: #7584a0;
  font-size: 17px;
}

.login-card form {
  display: grid;
  gap: 22px;
}

.login-card form :deep(.n-input) {
  --n-height: 64px !important;
  height: 64px;
  min-height: 64px;
  border-radius: 9px;
  font-size: 18px;
}

.login-card form :deep(.n-input-wrapper) {
  height: 100%;
  align-items: center;
}

.login-card form :deep(.n-input__input),
.login-card form :deep(.n-input__input-el) {
  height: 100%;
}

.login-card form :deep(.n-input__prefix),
.login-card form :deep(.n-input__suffix) {
  height: 100%;
  display: inline-flex;
  align-items: center;
}

.login-card form :deep(.n-button) {
  height: 62px;
  font-size: 21px;
  font-weight: 600;
  background: linear-gradient(135deg, #106df6, #0758ef);
}

.password-toggle {
  height: 100%;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 0;
  padding: 3px;
  color: #71819c;
  background: transparent;
  cursor: pointer;
}

.login-note {
  display: flex;
  align-items: center;
  gap: 13px;
  margin-top: 26px;
  color: #71819d;
  font-size: 15px;
}

.login-note.primary-note {
  min-height: 60px;
  padding: 0 18px;
  border: 1px solid #bcd8ff;
  border-radius: 8px;
  color: #4d6588;
  background: #f2f7ff;
}

.login-note.primary-note :deep(.n-icon) {
  color: var(--primary);
}

@media (max-width: 900px) {
  .login-header {
    height: 70px;
    padding: 0 20px;
  }

  .login-brand img {
    height: 42px;
  }

  .login-main {
    width: min(100% - 32px, 650px);
    min-height: calc(100vh - 70px);
    grid-template-columns: 1fr;
    padding: 35px 0 50px;
  }

  .login-art {
    display: none;
  }

  .login-card {
    padding: 42px 32px 34px;
  }
}

@media (max-width: 520px) {
  .login-header nav {
    gap: 12px;
    font-size: 13px;
  }

  .login-header nav i,
  .login-header nav button {
    display: none;
  }

  .login-card {
    padding: 34px 20px 28px;
  }

  .login-card h1 {
    font-size: 27px;
  }

  .login-card-heading p {
    font-size: 14px;
  }

  .login-card form :deep(.n-input),
  .login-card form :deep(.n-button) {
    --n-height: 54px !important;
    min-height: 54px;
    height: 54px;
  }
}
</style>
