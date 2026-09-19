<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { NButton, NCheckbox, NIcon, NInput, NQrCode, NSpin, useMessage } from 'naive-ui'
import {
  EyeOffOutline,
  EyeOutline,
  LayersOutline,
  LockClosedOutline,
  OpenOutline,
  PersonOutline,
  QrCodeOutline,
  RefreshOutline,
  ShieldCheckmarkOutline,
} from '@vicons/ionicons5'
import { authApi } from '../api/auth'
import PrivacyNoticeModal from '../components/PrivacyNoticeModal.vue'
import { getApiErrorMessage } from '../api/client'
import type { QRCodeLoginStatus } from '../api/types'
import { useSession } from '../state/session'
import { useTheme } from '../state/theme'
import ThemeSelect from '../components/ThemeSelect.vue'

type LoginMethod = 'qrcode' | 'password'
type QRCodeState = 'loading' | 'waiting' | 'expired' | 'error'

const QR_POLL_INTERVAL_MS = 1_500
const QR_STATUS_TEXT: Record<QRCodeLoginStatus, string> = {
  '0': '等待使用企业微信扫码…',
  '1': '已确认，正在完成登录…',
  '2': '已扫码，请在手机上确认登录…',
  '3': '二维码已过期，请刷新后重试',
}
const isMobileUserAgent = typeof navigator !== 'undefined'
  && /Android|iPhone|iPad|iPod|IEMobile|Opera Mini|Mobi/i.test(navigator.userAgent)

const router = useRouter()
const message = useMessage()
const { clearSession, setDisplayName } = useSession()
const { isDark } = useTheme()
const loginMethod = ref<LoginMethod>('password')
const account = ref('')
const password = ref('')
const showPassword = ref(false)
const submitting = ref(false)
const checkingSession = ref(true)
const privacyVisible = ref(false)
const privacyAccepted = ref(false)
const qrCodeUrl = ref('')
const qrCodeState = ref<QRCodeState>('loading')
const qrStatusText = ref('正在获取登录二维码…')
const clearSavedPassword = ref(false)

let qrFlowController: AbortController | null = null

async function checkSession() {
  try {
    const currentUser = await authApi.getCurrentUser()
    setDisplayName(currentUser.name)
    await router.replace('/home')
  } catch {
    clearSession()
    // 登录状态不存在、失效或检查失败时停留在登录页。
  } finally {
    checkingSession.value = false
  }
}

function requirePrivacyAcceptance() {
  if (privacyAccepted.value) return true
  message.warning('请先阅读并确认隐私说明')
  return false
}

async function submitLogin() {
  if (!account.value.trim() || !password.value) {
    message.warning('请输入学号和密码')
    return
  }
  if (!requirePrivacyAcceptance()) return

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

function cancelQRCodeFlow() {
  qrFlowController?.abort()
  qrFlowController = null
}

function updateQRCodeStatus(status: QRCodeLoginStatus) {
  const expired = status === '3'
  qrCodeState.value = expired ? 'expired' : 'waiting'
  qrStatusText.value = QR_STATUS_TEXT[status]
  return !expired
}

function showQRCodeError(error: unknown, fallback: string) {
  qrCodeState.value = 'error'
  qrStatusText.value = getApiErrorMessage(error, fallback)
}

function waitForNextQRCodeCheck(signal: AbortSignal) {
  return new Promise<boolean>((resolve) => {
    if (signal.aborted) {
      resolve(false)
      return
    }

    const finish = (active: boolean) => {
      window.clearTimeout(timer)
      signal.removeEventListener('abort', handleAbort)
      resolve(active)
    }
    const handleAbort = () => finish(false)
    const timer = window.setTimeout(() => finish(true), QR_POLL_INTERVAL_MS)
    signal.addEventListener('abort', handleAbort, { once: true })
  })
}

async function pollQRCodeLogin(sessionId: string, signal: AbortSignal) {
  while (!signal.aborted) {
    try {
      const result = await authApi.loginWithQRCode({
        qrlogin_session_id: sessionId,
        clear_password: clearSavedPassword.value,
      }, signal)

      if (signal.aborted) return
      if ('detail' in result) {
        if (!updateQRCodeStatus(result.detail)) return
        if (!await waitForNextQRCodeCheck(signal)) return
        continue
      }

      setDisplayName(result.name)
      message.success('扫码登录成功')
      await router.replace('/home')
      return
    } catch (error) {
      if (signal.aborted) return
      showQRCodeError(error, '扫码登录失败，请重新获取二维码')
      return
    }
  }
}

async function loadQRCode() {
  cancelQRCodeFlow()
  const flowController = new AbortController()
  qrFlowController = flowController
  qrCodeUrl.value = ''
  qrCodeState.value = 'loading'
  qrStatusText.value = '正在获取登录二维码…'

  try {
    const result = await authApi.getLoginQRCode(flowController.signal)
    if (flowController.signal.aborted) return

    qrCodeUrl.value = result.qrcode_url
    qrCodeState.value = 'waiting'
    qrStatusText.value = QR_STATUS_TEXT['0']
    await pollQRCodeLogin(result.session_id, flowController.signal)
  } catch (error) {
    if (flowController.signal.aborted) return
    showQRCodeError(error, '二维码获取失败，请稍后重试')
  } finally {
    if (qrFlowController === flowController) qrFlowController = null
  }
}

function selectLoginMethod(method: LoginMethod) {
  if (loginMethod.value === method) return
  if (method === 'qrcode' && !requirePrivacyAcceptance()) return

  if (method === 'password') cancelQRCodeFlow()
  loginMethod.value = method

  if (method === 'qrcode') {
    void loadQRCode()
  }
}

onMounted(checkSession)
onBeforeUnmount(() => cancelQRCodeFlow())
</script>

<template>
  <div class="login-page">
    <header class="login-header">
      <RouterLink to="/login" class="login-brand">
        <img
          :src="isDark ? '/assets/brand/logo-lockup-header.png' : '/assets/brand/logo-lockup.png'"
          alt="聚合截止线"
        />
      </RouterLink>
      <ThemeSelect />
    </header>

    <main class="login-main">
      <section class="login-art" aria-label="聚合截止时间插画">
        <div class="art-glow" />
        <img src="/assets/illustrations/deadline-calendar.png" alt="日历、绿植与时钟" />
      </section>

      <section class="login-card">
        <div class="login-card-heading">
          <h1>统一认证登录</h1>
          <p>{{ loginMethod === 'qrcode' ? '请使用企业微信扫码，并在手机上确认登录。' : '使用统一认证码和密码完成登录。' }}</p>
        </div>

        <div class="login-method-tabs" role="tablist" aria-label="登录方式">
          <NButton
            id="password-login-tab"
            role="tab"
            :aria-selected="loginMethod === 'password'"
            :type="loginMethod === 'password' ? 'primary' : 'default'" secondary
            @click="selectLoginMethod('password')"
          >
            <template #icon><NIcon :size="18"><LockClosedOutline /></NIcon></template>
            密码登录
          </NButton>
          <NButton
            id="qrcode-login-tab"
            role="tab"
            :aria-selected="loginMethod === 'qrcode'"
            :type="loginMethod === 'qrcode' ? 'primary' : 'default'" secondary
            :disabled="checkingSession"
            :title="!privacyAccepted ? '请先确认隐私政策' : undefined"
            @click="selectLoginMethod('qrcode')"
          >
            <template #icon><NIcon :size="18"><QrCodeOutline /></NIcon></template>
            扫码登录
          </NButton>
        </div>

        <div
          v-if="loginMethod === 'qrcode'"
          class="qrcode-login"
          role="tabpanel"
          aria-labelledby="qrcode-login-tab"
        >
          <div class="qrcode-password-option">
            <NCheckbox v-model:checked="clearSavedPassword">
              扫码登录后清除已保存的统一认证密码
            </NCheckbox>
            <p>仅清除本平台保存的密码，不会修改统一认证密码；后续登录态失效时需重新登录。</p>
          </div>

          <div class="qrcode-stage">
            <NSpin v-if="qrCodeState === 'loading'" size="large" />
            <NQrCode
              v-else-if="qrCodeUrl"
              :value="qrCodeUrl"
              :size="218"
              :padding="12"
              error-correction-level="H"
              color="#101828"
              background-color="#ffffff"
            />
            <NIcon v-else :size="70"><QrCodeOutline /></NIcon>

            <div
              v-if="qrCodeState === 'expired' || qrCodeState === 'error'"
              class="qrcode-retry-overlay"
            >
              <NButton type="primary" size="large" @click="loadQRCode">
                <template #icon><NIcon :size="25"><RefreshOutline /></NIcon></template>
                <span>刷新二维码</span>
              </NButton>
            </div>
          </div>

          <div class="qrcode-status" :class="`is-${qrCodeState}`" aria-live="polite">
            <span class="status-dot" />
            {{ qrStatusText }}
          </div>

          <a
            v-if="qrCodeState === 'waiting' && isMobileUserAgent"
            class="qrcode-device-link"
            :href="qrCodeUrl"
            target="_blank"
            rel="noopener noreferrer"
          >
            <NIcon><OpenOutline /></NIcon>
            当前设备打开
          </a>
        </div>

        <form
          v-else
          role="tabpanel"
          aria-labelledby="password-login-tab"
          @submit.prevent="submitLogin"
        >
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
              <NButton text :aria-label="showPassword ? '隐藏密码' : '显示密码'" @click="showPassword = !showPassword">
                <template #icon><NIcon :size="23"><EyeOffOutline v-if="showPassword" /><EyeOutline v-else /></NIcon></template>
              </NButton>
            </template>
          </NInput>
          <div class="privacy-consent">
            <NCheckbox v-model:checked="privacyAccepted">
              我已知晓
            </NCheckbox>
            <NButton text type="primary" @click="privacyVisible = true">《隐私政策》</NButton>
          </div>
          <NButton
            attr-type="submit"
            type="primary"
            size="large"
            block
            :loading="submitting || checkingSession"
            :disabled="submitting || checkingSession || !privacyAccepted"
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
    radial-gradient(circle at 16% 54%, var(--bg-glow), transparent 26%),
    var(--bg);
}

.login-header {
  height: 68px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid var(--header-border);
  padding: 0 28px;
  background: var(--header-bg);
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
  background: radial-gradient(circle, color-mix(in srgb, var(--primary) 24%, transparent), transparent 72%);
}

.login-art img {
  position: relative;
  z-index: 1;
  width: min(100%, 540px);
  opacity: var(--illustration-opacity);
  filter: var(--illustration-filter) drop-shadow(0 22px 30px rgba(0, 0, 0, 0.18));
}

.login-card {
  width: 100%;
  justify-self: center;
  padding: 42px 38px 34px;
  border: 1px solid var(--line);
  border-radius: 22px;
  background: var(--surface-card);
  box-shadow: var(--shadow-raised);
}

.login-card-heading {
  margin-bottom: 22px;
}

.login-card h1 {
  margin: 0 0 9px;
  color: var(--text-strong);
  font-size: 31px;
  letter-spacing: -0.7px;
}

.login-card-heading p {
  margin: 0;
  color: var(--muted);
  font-size: 14px;
}

.login-card form {
  display: grid;
  gap: 15px;
}

.login-method-tabs {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 5px;
  margin-bottom: 24px;
}

.qrcode-login {
  display: grid;
  justify-items: center;
  gap: 15px;
}

.qrcode-password-option {
  width: 100%;
  padding: 12px 14px;
  border: 1px solid var(--line);
  border-radius: 11px;
  background: var(--surface-soft);
}

.qrcode-password-option p {
  margin: 6px 0 0 25px;
  color: var(--text-tertiary);
  font-size: 11px;
  line-height: 1.55;
}

.qrcode-stage {
  position: relative;
  width: 244px;
  height: 244px;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  border: 1px solid var(--line-strong);
  border-radius: 16px;
  color: var(--text-disabled);
  background:
    linear-gradient(45deg, var(--surface-soft) 25%, transparent 25%) 0 0 / 18px 18px,
    linear-gradient(-45deg, var(--surface-soft) 25%, transparent 25%) 0 9px / 18px 18px,
    var(--surface-subtle);
}

.qrcode-retry-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: color-mix(in srgb, var(--surface-card) 78%, transparent);
  backdrop-filter: blur(4px);
}

.qrcode-status {
  min-height: 22px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  color: var(--text-secondary);
  font-size: 13px;
  text-align: center;
}

.status-dot {
  width: 7px;
  height: 7px;
  flex: 0 0 auto;
  border-radius: 50%;
}

.qrcode-status.is-loading .status-dot,
.qrcode-status.is-waiting .status-dot {
  background: var(--primary);
  box-shadow: 0 0 0 5px var(--focus-ring);
  animation: status-pulse 1.4s ease-in-out infinite;
}

.qrcode-status.is-expired,
.qrcode-status.is-error {
  color: var(--danger-text);
}

.qrcode-status.is-expired .status-dot,
.qrcode-status.is-error .status-dot {
  background: var(--danger-text);
}

.qrcode-device-link {
  min-height: 36px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 5px;
  color: var(--primary-text);
  font-size: 13px;
  font-weight: 500;
}

.qrcode-device-link:hover {
  text-decoration: underline;
}

@keyframes status-pulse {
  0%, 100% { opacity: 0.62; }
  50% { opacity: 1; }
}

.privacy-consent {
  display: flex;
  align-items: center;
  gap: 2px;
  color: var(--text-secondary);
  font-size: 12px;
}

.login-note {
  display: flex;
  align-items: center;
  gap: 13px;
  margin-top: 18px;
  color: var(--text-tertiary);
  font-size: 11px;
}

.login-note.primary-note {
  min-height: 50px;
  padding: 0 14px;
  border: 1px solid var(--primary-border);
  border-radius: 11px;
  color: var(--text-secondary);
  background: var(--primary-soft);
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
}

@media (prefers-reduced-motion: reduce) {
  .qrcode-status.is-loading .status-dot,
  .qrcode-status.is-waiting .status-dot {
    animation: none;
  }
}
</style>
