<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { NButton, NCheckbox, NIcon, NInput, useMessage } from 'naive-ui'
import {
  EyeOffOutline,
  EyeOutline,
  LayersOutline,
  LockClosedOutline,
  PersonOutline,
  ShieldCheckmarkOutline,
} from '@vicons/ionicons5'
import { authApi } from '../api/auth'
import PrivacyNoticeModal from '../components/PrivacyNoticeModal.vue'
import { getApiErrorMessage } from '../api/client'
import { useSession } from '../state/session'

const router = useRouter()
const message = useMessage()
const { clearSession, setDisplayName } = useSession()
const account = ref('')
const password = ref('')
const showPassword = ref(false)
const submitting = ref(false)
const refreshingSession = ref(true)
const privacyVisible = ref(false)
const privacyAccepted = ref(false)

async function refreshSession() {
  try {
    await authApi.refresh()
    await router.replace('/home')
  } catch {
    clearSession()
    // refresh token 不存在、失效或刷新失败时停留在登录页。
  } finally {
    refreshingSession.value = false
  }
}

async function submitLogin() {
  if (!account.value.trim() || !password.value) {
    message.warning('请输入学号和密码')
    return
  }
  if (!privacyAccepted.value) {
    message.warning('请先阅读并确认隐私说明')
    return
  }

  submitting.value = true
  try {
    const result = await authApi.login({
      username: account.value.trim(),
      password: password.value,
    })
    setDisplayName(result.name)
    password.value = ''
    await router.replace('/home')
  } catch (error) {
    message.error(getApiErrorMessage(error, '登录失败，请稍后重试'))
  } finally {
    submitting.value = false
  }
}

onMounted(refreshSession)
</script>

<template>
  <div class="login-page">
    <header class="login-header">
      <RouterLink to="/login" class="login-brand">
        <img src="/assets/brand/logo-lockup.png" alt="聚合截止线" />
      </RouterLink>
    </header>

    <main class="login-main">
      <section class="login-art" aria-label="聚合截止时间插画">
        <div class="art-glow" />
        <img src="/assets/illustrations/deadline-calendar.png" alt="日历、绿植与时钟" />
      </section>

      <section class="login-card">
        <div class="login-card-heading">
          <h1>统一认证登录</h1>
          <p>首次使用，请务必仔细阅读隐私政策。</p>
        </div>

        <form @submit.prevent="submitLogin">
          <NInput v-model:value="account" size="large" placeholder="统一认证码" aria-label="统一认证码" autocomplete="username">
            <template #prefix><NIcon :size="25"><PersonOutline /></NIcon></template>
          </NInput>
          <NInput
            v-model:value="password"
            size="large"
            :type="showPassword ? 'text' : 'password'"
            placeholder="密码"
            aria-label="密码"
            autocomplete="current-password"
          >
            <template #prefix><NIcon :size="23"><LockClosedOutline /></NIcon></template>
            <template #suffix>
              <button class="password-toggle" type="button" :aria-label="showPassword ? '隐藏密码' : '显示密码'" @click="showPassword = !showPassword">
                <NIcon :size="23"><EyeOffOutline v-if="showPassword" /><EyeOutline v-else /></NIcon>
              </button>
            </template>
          </NInput>
          <div class="privacy-consent">
            <NCheckbox v-model:checked="privacyAccepted">我已知晓</NCheckbox>
            <button type="button" @click="privacyVisible = true">《隐私政策》</button>
          </div>
          <NButton
            attr-type="submit"
            type="primary"
            size="large"
            block
            :loading="submitting || refreshingSession"
            :disabled="submitting || refreshingSession || !privacyAccepted"
          >
            登录
          </NButton>
        </form>

        <div class="login-note primary-note">
          <NIcon :size="25"><ShieldCheckmarkOutline /></NIcon>
          <span>本平台仅支持重庆邮电大学，请使用重庆邮电大学统一认证完成本平台登录。</span>
        </div>
        <div class="login-note">
          <NIcon :size="23"><LayersOutline /></NIcon>
          <span>登录后，可在「我的」中按需绑定学习平台获取作业</span>
        </div>
      </section>
    </main>

    <PrivacyNoticeModal v-model:show="privacyVisible" />
  </div>
</template>

<style scoped>
.login-page {
  min-height: 100vh;
  background:
    radial-gradient(circle at 16% 54%, rgba(217, 230, 249, 0.52), transparent 26%),
    #f5f5f7;
}

.login-header {
  height: 68px;
  display: flex;
  align-items: center;
  justify-content: flex-start;
  border-bottom: 1px solid rgba(31, 35, 43, 0.08);
  padding: 0 28px;
  background: rgba(255, 255, 255, 0.84);
  backdrop-filter: blur(18px);
}

.login-brand img {
  display: block;
  height: 43px;
  width: auto;
}

.login-main {
  width: min(1180px, calc(100% - 64px));
  min-height: calc(100vh - 68px);
  display: grid;
  grid-template-columns: minmax(0, 1fr) 460px;
  align-items: center;
  gap: 84px;
  margin: 0 auto;
  padding: 48px 0 64px;
}

.login-art {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
}

.art-glow {
  position: absolute;
  width: 470px;
  height: 330px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(206, 225, 255, 0.62), rgba(229, 239, 255, 0.22) 60%, transparent 72%);
}

.login-art img {
  position: relative;
  z-index: 1;
  width: min(100%, 540px);
  filter: drop-shadow(0 22px 30px rgba(58, 104, 164, 0.1));
}

.login-card {
  width: 100%;
  justify-self: center;
  padding: 42px 38px 34px;
  border: 1px solid rgba(31, 35, 43, 0.09);
  border-radius: 22px;
  background: rgba(255, 255, 255, 0.92);
  box-shadow: 0 18px 55px rgba(0, 0, 0, 0.065);
}

.login-card-heading {
  margin-bottom: 28px;
}

.login-card h1 {
  margin: 0 0 9px;
  color: #1d1d1f;
  font-size: 31px;
  letter-spacing: -0.7px;
}

.login-card-heading p {
  margin: 0;
  color: #6e6e73;
  font-size: 14px;
}

.login-card form {
  display: grid;
  gap: 15px;
}

.login-card form :deep(.n-input) {
  --n-height: 52px !important;
  height: 52px;
  min-height: 52px;
  border-radius: 12px;
  font-size: 15px;
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
  height: 50px;
  border-radius: 12px;
  font-size: 16px;
  font-weight: 600;
  background: #1769e8;
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

.privacy-consent {
  display: flex;
  align-items: center;
  gap: 2px;
  color: #6e7d92;
  font-size: 12px;
}

.privacy-consent :deep(.n-checkbox__label) {
  padding-right: 2px;
  color: #6e7d92;
  font-size: 12px;
}

.privacy-consent button {
  border: 0;
  padding: 2px;
  color: #1769e8;
  background: transparent;
  font-size: 12px;
  cursor: pointer;
}

.privacy-consent button:hover,
.privacy-consent button:focus-visible {
  outline: none;
  text-decoration: underline;
}

.login-note {
  display: flex;
  align-items: center;
  gap: 13px;
  margin-top: 18px;
  color: #77777c;
  font-size: 11px;
}

.login-note.primary-note {
  min-height: 50px;
  padding: 0 14px;
  border: 1px solid #d7e4f7;
  border-radius: 11px;
  color: #596a82;
  background: #f3f7fd;
}

.login-note.primary-note :deep(.n-icon) {
  color: var(--primary);
}

@media (max-width: 900px) {
  .login-header {
    height: 62px;
    padding: 0 20px;
  }

  .login-brand img {
    height: 38px;
  }

  .login-main {
    width: min(100% - 32px, 650px);
    min-height: calc(100vh - 62px);
    grid-template-columns: 1fr;
    padding: 35px 0 50px;
  }

  .login-art {
    display: none;
  }

  .login-card {
    padding: 38px 32px 32px;
  }
}

@media (max-width: 520px) {
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
