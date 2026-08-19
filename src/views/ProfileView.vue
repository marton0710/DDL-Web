<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import {
  NButton,
  NCard,
  NForm,
  NFormItem,
  NIcon,
  NInput,
  NInputNumber,
  NModal,
  NTimePicker,
  useMessage,
} from 'naive-ui'
import {
  ChevronForwardOutline,
  InformationCircleOutline,
  KeyOutline,
  LayersOutline,
} from '@vicons/ionicons5'
import AccountActions from '../components/AccountActions.vue'
import MainHeader from '../components/MainHeader.vue'
import { authApi } from '../api/auth'
import { getApiErrorMessage, isAuthenticationError } from '../api/client'
import { platformApi } from '../api/platform'
import type {
  CurrentUser,
  PlatformAuthMethod,
  PlatformCredentials,
} from '../api/types'
import { PLATFORM_META, type PlatformMeta } from '../domain/platform'
import { useSession } from '../state/session'

const router = useRouter()
const message = useMessage()
const { avatarText, clearSession, displayName, setDisplayName } = useSession()
const bindDialogOpen = ref(false)
const bindLoading = ref(false)
const bindAuthMethod = ref<PlatformAuthMethod | null>(null)
const qqReminderDialogOpen = ref(false)
const meetScheduleDialogOpen = ref(false)
const qqReminderSaving = ref(false)
const meetScheduleSaving = ref(false)

const userInfo = reactive<CurrentUser>({
  name: '',
  qqchan_id: null,
  meetschedule_key: null,
})

function defaultReminderTime(): string {
  return '07:00'
}

function formatReminderTime(value: string): string {
  const time = new Date(value)
  if (Number.isNaN(time.getTime())) return defaultReminderTime()
  return new Intl.DateTimeFormat('zh-CN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(time)
}

function reminderTimeToIso(value: string): string {
  const [hour, minute] = value.split(':').map(Number)
  const time = new Date()
  time.setHours(hour, minute, 0, 0)
  return time.toISOString()
}

function updateReminderTime(value: string | null) {
  if (value) qqReminderForm.pushTime = value
}

const qqReminderForm = reactive({
  qqchanId: '',
  pushTime: defaultReminderTime(),
  coverageHours: 24 as number | null,
})
const meetScheduleKey = ref('')

interface QqReminderSettings {
  push_time: string
  coverage_hours: number
}

const qqReminderSettings = ref<QqReminderSettings | null>(null)

type PlatformStatus = 'loading' | 'bound' | 'invalid' | 'unbound' | 'error'
interface PlatformState extends PlatformMeta {
  status: PlatformStatus
  actionLoading: boolean
}

const platforms = reactive<PlatformState[]>(
  PLATFORM_META.map((platform) => ({ ...platform, status: 'loading', actionLoading: false })),
)
const selectedPlatform = ref<PlatformState | null>(null)
const platformCredentials = reactive({ username: '', password: '' })

const profileName = computed(() => userInfo.name || displayName.value || '同学')
const connectedPlatformCount = computed(() => platforms.filter((item) => item.status === 'bound').length)
const connectedServiceCount = computed(() => (
  Number(Boolean(userInfo.qqchan_id))
  + Number(Boolean(userInfo.meetschedule_key))
))
const qqReminderTimeSummary = computed(() => {
  const settings = qqReminderSettings.value
  if (!userInfo.qqchan_id && !settings) return ''
  const coverageHours = settings?.coverage_hours ?? 24
  const time = settings ? formatReminderTime(settings.push_time) : defaultReminderTime()
  return `${time} 推送 · 覆盖 ${coverageHours} 小时`
})
const canSaveQqReminder = computed(() => (
  Boolean(userInfo.qqchan_id || qqReminderForm.qqchanId.trim())
  && Number.isInteger(qqReminderForm.coverageHours)
  && Number(qqReminderForm.coverageHours) >= 24
  && Number(qqReminderForm.coverageHours) <= 48
))
const canSaveMeetSchedule = computed(() => Boolean(meetScheduleKey.value.trim()))

async function handleUnauthorized(error: unknown): Promise<boolean> {
  if (!isAuthenticationError(error)) return false
  clearSession()
  await router.push('/login')
  return true
}

function applyCurrentUser(currentUser: CurrentUser) {
  userInfo.name = currentUser.name
  userInfo.qqchan_id = currentUser.qqchan_id
  userInfo.meetschedule_key = currentUser.meetschedule_key
  setDisplayName(currentUser.name)
}

async function loadUserInfo(): Promise<boolean> {
  try {
    const currentUser = await authApi.getCurrentUser()
    applyCurrentUser(currentUser)
    return true
  } catch (error) {
    if (await handleUnauthorized(error)) return false
    message.error(getApiErrorMessage(error, '账号信息加载失败'))
    return false
  }
}

async function loadPlatformStatus(platform: PlatformState) {
  platform.status = 'loading'
  try {
    const validity = await platformApi.getCookieValidity(platform.name)
    platform.status = validity === null ? 'unbound' : validity ? 'bound' : 'invalid'
  } catch (error) {
    if (await handleUnauthorized(error)) return
    platform.status = 'error'
  }
}

function openQqReminderSettings() {
  const settings = qqReminderSettings.value
  qqReminderForm.qqchanId = ''
  qqReminderForm.pushTime = settings ? formatReminderTime(settings.push_time) : defaultReminderTime()
  qqReminderForm.coverageHours = settings?.coverage_hours ?? 24
  qqReminderDialogOpen.value = true
}

async function saveQqReminderSettings() {
  if (!canSaveQqReminder.value) return
  const qqchanId = qqReminderForm.qqchanId.trim()
  qqReminderSaving.value = true
  try {
    if (qqchanId) {
      await authApi.updateBindings({ qqchan_id: qqchanId })
      applyCurrentUser(await authApi.getCurrentUser())
    }
    qqReminderSettings.value = {
      push_time: reminderTimeToIso(qqReminderForm.pushTime),
      coverage_hours: Number(qqReminderForm.coverageHours),
    }
    qqReminderForm.qqchanId = ''
    qqReminderDialogOpen.value = false
  } catch (error) {
    if (await handleUnauthorized(error)) return
    message.error(getApiErrorMessage(error, 'QQ机器人提醒保存失败'))
  } finally {
    qqReminderSaving.value = false
  }
}

function openMeetScheduleSettings() {
  meetScheduleKey.value = ''
  meetScheduleDialogOpen.value = true
}

async function saveMeetScheduleSettings() {
  if (!canSaveMeetSchedule.value) return
  meetScheduleSaving.value = true
  try {
    await authApi.updateBindings({ meetschedule_key: meetScheduleKey.value.trim() })
    applyCurrentUser(await authApi.getCurrentUser())
    meetScheduleKey.value = ''
    meetScheduleDialogOpen.value = false
  } catch (error) {
    if (await handleUnauthorized(error)) return
    message.error(getApiErrorMessage(error, 'Meet 课程表保存失败'))
  } finally {
    meetScheduleSaving.value = false
  }
}

async function unbindQqReminder() {
  qqReminderSaving.value = true
  try {
    await authApi.updateBindings({ qqchan_id: null })
    userInfo.qqchan_id = null
    qqReminderSettings.value = null
    qqReminderForm.qqchanId = ''
    qqReminderDialogOpen.value = false
    message.success('已取消 QQ机器人提醒绑定')
  } catch (error) {
    if (await handleUnauthorized(error)) return
    message.error(getApiErrorMessage(error, '取消 QQ机器人提醒绑定失败'))
  } finally {
    qqReminderSaving.value = false
  }
}

async function unbindMeetSchedule() {
  meetScheduleSaving.value = true
  try {
    await authApi.updateBindings({ meetschedule_key: null })
    userInfo.meetschedule_key = null
    meetScheduleKey.value = ''
    meetScheduleDialogOpen.value = false
    message.success('已取消 Meet 课程表绑定')
  } catch (error) {
    if (await handleUnauthorized(error)) return
    message.error(getApiErrorMessage(error, '取消 Meet 课程表绑定失败'))
  } finally {
    meetScheduleSaving.value = false
  }
}

async function openPlatformBinding(platform: PlatformState) {
  platform.actionLoading = true
  try {
    bindAuthMethod.value = await platformApi.getAuthMethod(platform.name)
    selectedPlatform.value = platform
    platformCredentials.username = ''
    platformCredentials.password = ''
    bindDialogOpen.value = true
  } catch (error) {
    if (await handleUnauthorized(error)) return
    message.error(getApiErrorMessage(error, '无法获取平台认证方式'))
  } finally {
    platform.actionLoading = false
  }
}

async function submitPlatformBinding() {
  if (!selectedPlatform.value || !bindAuthMethod.value) return
  if (bindAuthMethod.value === 'password' && (!platformCredentials.username.trim() || !platformCredentials.password)) {
    message.warning('请输入平台账号和密码')
    return
  }

  bindLoading.value = true
  const platform = selectedPlatform.value
  try {
    const credentials: PlatformCredentials = bindAuthMethod.value === 'password'
      ? { username: platformCredentials.username.trim(), password: platformCredentials.password }
      : {}
    await platformApi.bind(platform.name, credentials)
    platform.status = 'bound'
    bindDialogOpen.value = false
    message.success(`${platform.name}绑定完成`)
  } catch (error) {
    if (await handleUnauthorized(error)) return
    message.error(getApiErrorMessage(error, '平台绑定失败'))
  } finally {
    bindLoading.value = false
  }
}

async function unbindPlatform(platform: PlatformState) {
  platform.actionLoading = true
  try {
    await platformApi.unbind(platform.name)
    platform.status = 'unbound'
    message.success(`已解绑${platform.name}`)
  } catch (error) {
    if (await handleUnauthorized(error)) return
    message.error(getApiErrorMessage(error, '平台解绑失败'))
  } finally {
    platform.actionLoading = false
  }
}

function platformStatusText(status: PlatformStatus): string {
  return {
    loading: '正在检查',
    bound: '连接正常',
    invalid: '授权已失效',
    unbound: '尚未绑定',
    error: '状态检查失败',
  }[status]
}

onMounted(async () => {
  if (!await loadUserInfo()) return
  await Promise.all(platforms.map(loadPlatformStatus))
})
</script>

<template>
  <div class="profile-page">
    <MainHeader />

    <main class="page-shell profile-main">
      <header class="page-heading">
        <span>账号与连接</span>
        <h1>我的</h1>
        <p>管理学习平台、提醒与课程表同步。</p>
      </header>

      <div class="profile-grid">
        <div class="profile-sidebar">
          <aside class="identity-card">
            <div class="profile-avatar">{{ avatarText }}</div>
            <h2>{{ profileName }}</h2>
            <div class="identity-stats">
              <div><strong>{{ connectedPlatformCount }}</strong><span>已连接平台</span></div>
              <div><strong>{{ connectedServiceCount }}</strong><span>可选功能</span></div>
            </div>
          </aside>
          <div class="desktop-account-actions">
            <AccountActions :username="userInfo.name" />
          </div>
        </div>

        <div class="profile-content">
          <section class="profile-card platform-card">
            <header>
              <div><span>数据来源</span><h2>学习平台</h2><p>绑定后，可在首页手动刷新各平台的作业。</p></div>
              <strong>{{ connectedPlatformCount }}/{{ platforms.length }} 已连接</strong>
            </header>

            <div class="platform-list">
              <article v-for="platform in platforms" :key="platform.name">
                <span class="platform-logo" :class="platform.className">{{ platform.mark }}</span>
                <div class="platform-copy">
                  <strong>{{ platform.name }}</strong>
                  <span
                    class="status-text"
                    :class="{
                      connected: platform.status === 'bound',
                      warning: platform.status === 'invalid' || platform.status === 'error',
                    }"
                  >
                    <i />{{ platformStatusText(platform.status) }}
                  </span>
                </div>
                <div class="platform-actions">
                  <NButton
                    v-if="platform.status === 'bound'"
                    size="small"
                    tertiary
                    type="error"
                    :loading="platform.actionLoading"
                    @click="unbindPlatform(platform)"
                  >解绑</NButton>
                  <NButton
                    v-else
                    size="small"
                    type="primary"
                    ghost
                    :loading="platform.actionLoading"
                    @click="openPlatformBinding(platform)"
                  >{{ platform.status === 'invalid' ? '重新绑定' : '绑定' }}</NButton>
                </div>
              </article>
            </div>
          </section>

          <section class="profile-card services-card">
            <header><div><span>偏好设置</span><h2>提醒与同步</h2><p>分别管理 QQ机器人提醒和课程表同步。</p></div></header>
            <div class="service-grid">
              <button type="button" class="service-item" @click="openQqReminderSettings">
                <span class="service-icon key"><NIcon><KeyOutline /></NIcon></span>
                <div>
                  <strong>QQ机器人提醒</strong>
                  <span>{{ userInfo.qqchan_id || '未配置' }}</span>
                  <small v-if="qqReminderTimeSummary">{{ qqReminderTimeSummary }}</small>
                </div>
                <NIcon class="service-chevron"><ChevronForwardOutline /></NIcon>
              </button>
              <button type="button" class="service-item" @click="openMeetScheduleSettings">
                <span class="service-icon layers"><NIcon><LayersOutline /></NIcon></span>
                <div><strong>Meet 课程表</strong><span>{{ userInfo.meetschedule_key || '未配置' }}</span></div>
                <NIcon class="service-chevron"><ChevronForwardOutline /></NIcon>
              </button>
            </div>
          </section>

          <section class="privacy-strip">
            <NIcon><InformationCircleOutline /></NIcon>
            <div><strong>关于平台凭据</strong><span>平台凭据仅用于完成平台登录及 Cookie 失效后的重新认证。解绑平台会同时移除该平台的作业数据和平台凭据。</span></div>
          </section>
        </div>
      </div>
    </main>

    <NModal v-model:show="qqReminderDialogOpen" :mask-closable="false">
      <NCard class="profile-dialog" title="QQ机器人提醒" :bordered="false" role="dialog" aria-modal="true">
        <p class="dialog-description">绑定 QQ机器人提醒并设置每天的推送时刻，以及要覆盖的未来作业范围。</p>
        <NForm label-placement="top">
          <NFormItem label="QQ机器人提醒绑定">
            <NInput
              v-model:value="qqReminderForm.qqchanId"
              :placeholder="userInfo.qqchan_id ? `${userInfo.qqchan_id}；输入新值可更换` : '请输入绑定标识'"
            />
          </NFormItem>
          <div class="reminder-setting-grid">
            <NFormItem label="推送时刻">
              <NTimePicker
                :formatted-value="qqReminderForm.pushTime"
                class="setting-control readonly-time-picker"
                format="HH:mm"
                value-format="HH:mm"
                input-readonly
                :actions="['confirm']"
                :clearable="false"
                placeholder="选择推送时间"
                @update:formatted-value="updateReminderTime"
              />
            </NFormItem>
            <NFormItem label="作业覆盖范围">
              <NInputNumber
                v-model:value="qqReminderForm.coverageHours"
                class="setting-control"
                :min="24"
                :max="48"
                :precision="0"
                :step="1"
                placeholder="24–48"
              >
                <template #suffix>小时</template>
              </NInputNumber>
            </NFormItem>
          </div>
        </NForm>
        <div class="dialog-actions" :class="{ 'has-unbind': userInfo.qqchan_id }">
          <NButton v-if="userInfo.qqchan_id" type="error" secondary :loading="qqReminderSaving" @click="unbindQqReminder">取消绑定</NButton>
          <div class="dialog-primary-actions">
            <NButton :disabled="qqReminderSaving" @click="qqReminderDialogOpen = false">取消</NButton>
            <NButton type="primary" :loading="qqReminderSaving" :disabled="!canSaveQqReminder" @click="saveQqReminderSettings">保存</NButton>
          </div>
        </div>
      </NCard>
    </NModal>

    <NModal v-model:show="meetScheduleDialogOpen" :mask-closable="false">
      <NCard class="profile-dialog" title="Meet 课程表" :bordered="false" role="dialog" aria-modal="true">
        <p class="dialog-description">单独设置 Meet 课程表同步密钥。</p>
        <NForm label-placement="top">
          <NFormItem label="MeetSchedule Key">
            <NInput
              v-model:value="meetScheduleKey"
              type="password"
              show-password-on="click"
              :placeholder="userInfo.meetschedule_key ? `${userInfo.meetschedule_key}；输入新值可更换` : '请输入同步密钥'"
            />
          </NFormItem>
        </NForm>
        <div class="dialog-actions" :class="{ 'has-unbind': userInfo.meetschedule_key }">
          <NButton v-if="userInfo.meetschedule_key" type="error" secondary :loading="meetScheduleSaving" @click="unbindMeetSchedule">取消绑定</NButton>
          <div class="dialog-primary-actions">
            <NButton :disabled="meetScheduleSaving" @click="meetScheduleDialogOpen = false">取消</NButton>
            <NButton type="primary" :loading="meetScheduleSaving" :disabled="!canSaveMeetSchedule" @click="saveMeetScheduleSettings">保存</NButton>
          </div>
        </div>
      </NCard>
    </NModal>

    <NModal v-model:show="bindDialogOpen">
      <NCard
        class="profile-dialog"
        :title="selectedPlatform ? `绑定${selectedPlatform.name}` : '绑定学习平台'"
        :bordered="false"
        role="dialog"
        aria-modal="true"
      >
        <p class="dialog-description">
          {{ bindAuthMethod === 'password'
            ? '该平台需要独立账号密码。凭据将加密保存，以便授权失效时重新认证。'
            : '该平台使用当前重邮统一认证身份完成绑定，无需再次输入账号密码。' }}
        </p>
        <NForm v-if="bindAuthMethod === 'password'" label-placement="top">
          <NFormItem label="平台账号"><NInput v-model:value="platformCredentials.username" autocomplete="username" /></NFormItem>
          <NFormItem label="平台密码"><NInput v-model:value="platformCredentials.password" type="password" show-password-on="click" autocomplete="current-password" /></NFormItem>
        </NForm>
        <div class="dialog-actions"><NButton @click="bindDialogOpen = false">取消</NButton><NButton type="primary" :loading="bindLoading" @click="submitPlatformBinding">确认绑定</NButton></div>
      </NCard>
    </NModal>
  </div>
</template>

<style scoped>
.profile-main { width: min(1180px, calc(100% - 48px)); padding: 36px 0 64px; }
.page-heading { margin-bottom: 24px; }
.page-heading > span { color: var(--text-tertiary); font-size: 13px; font-weight: 650; }
.page-heading h1 { margin: 5px 0 0; color: var(--text-strong); font-size: 36px; letter-spacing: -0.8px; }
.page-heading p { margin: 8px 0 0; color: var(--text-secondary); font-size: 14px; }

.profile-grid { display: grid; grid-template-columns: 290px minmax(0, 1fr); align-items: start; gap: 18px; }
.profile-sidebar { position: sticky; top: 82px; display: grid; gap: 10px; }
.identity-card,
.profile-card,
.privacy-strip { border: 1px solid var(--line); border-radius: 16px; background: var(--surface-card); box-shadow: var(--shadow); }
.identity-card { display: flex; flex-direction: column; align-items: center; padding: 28px 22px 20px; text-align: center; }
.profile-avatar { width: 76px; height: 76px; display: flex; align-items: center; justify-content: center; border-radius: 22px; color: white; background: linear-gradient(145deg, #2d7df0, #145cca); box-shadow: 0 12px 24px rgba(23, 105, 232, 0.22); font-size: 28px; font-weight: 750; }
.identity-card h2 { margin: 16px 0 0; color: var(--text-strong); font-size: 20px; }
.identity-stats { width: 100%; display: grid; grid-template-columns: 1fr 1fr; margin: 22px 0 0; border: solid var(--line-soft); border-width: 1px 0; padding: 15px 0; }
.identity-stats div { display: grid; gap: 4px; }
.identity-stats div + div { border-left: 1px solid var(--line-soft); }
.identity-stats strong { color: var(--text-strong); font-size: 20px; }
.identity-stats span { color: var(--text-tertiary); font-size: 10px; }

.profile-content { display: grid; gap: 18px; }
.profile-card { overflow: hidden; padding: 22px; }
.profile-card > header { display: flex; align-items: flex-start; justify-content: space-between; gap: 20px; padding-bottom: 18px; border-bottom: 1px solid var(--line-soft); }
.profile-card header span { color: var(--text-tertiary); font-size: 10px; font-weight: 700; text-transform: uppercase; }
.profile-card h2 { margin: 3px 0 0; color: var(--text-strong); font-size: 19px; }
.profile-card header p { margin: 5px 0 0; color: var(--text-tertiary); font-size: 11px; }
.platform-card > header > strong { border-radius: 999px; padding: 7px 10px; color: var(--primary-soft-text); background: var(--primary-soft); font-size: 11px; white-space: nowrap; }

.platform-list { display: grid; }
.platform-list article { display: grid; grid-template-columns: auto minmax(0, 1fr) auto; align-items: center; gap: 14px; min-height: 78px; border-top: 1px solid var(--line-soft); }
.platform-list article:first-child { border-top: 0; }
.platform-logo { width: 42px; height: 42px; display: flex; align-items: center; justify-content: center; border-radius: 12px; color: white; font-size: 16px; font-weight: 750; }
.platform-logo.cqupt { background: #1769e8; }
.platform-logo.chaoxing { background: #d62c43; }
.platform-logo.yuketang { background: #09988d; }
.platform-copy { min-width: 0; display: grid; gap: 5px; }
.platform-copy > strong { color: var(--text-strong); font-size: 14px; }
.status-text { display: flex; align-items: center; gap: 6px; color: var(--text-tertiary); font-size: 10px; }
.status-text i { width: 6px; height: 6px; border-radius: 50%; background: var(--text-disabled); }
.status-text.connected { color: var(--success-text); }
.status-text.connected i { background: var(--success-text); box-shadow: 0 0 0 3px var(--success-container); }
.status-text.warning { color: var(--warning-text); }
.status-text.warning i { background: var(--warning-text); box-shadow: 0 0 0 3px var(--warning-container); }
.platform-actions { display: flex; gap: 7px; }

.services-card > header { align-items: center; }
.service-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; padding-top: 18px; }
.service-item { min-width: 0; display: grid; grid-template-columns: auto minmax(0, 1fr) auto; align-items: center; gap: 10px; border: 1px solid var(--line); border-radius: 13px; padding: 13px; color: inherit; background: var(--surface-elevated); font: inherit; text-align: left; cursor: pointer; transition: border-color 0.18s ease, box-shadow 0.18s ease, transform 0.18s ease; }
.service-item:hover,
.service-item:focus-visible { border-color: var(--primary-border); outline: none; box-shadow: var(--shadow); transform: translateY(-1px); }
.service-icon { width: 34px; height: 34px; display: flex; align-items: center; justify-content: center; border-radius: 10px; font-size: 17px; }
.service-icon.key { color: var(--warning-text); background: var(--warning-container); }
.service-icon.layers { color: var(--success-text); background: var(--success-container); }
.service-item > div { min-width: 0; display: grid; gap: 4px; }
.service-item > div strong { color: var(--text-strong); font-size: 11px; }
.service-item > div span { overflow: hidden; color: var(--text-tertiary); font-size: 9px; text-overflow: ellipsis; white-space: nowrap; }
.service-item > div small { color: var(--text-secondary); font-size: 9px; line-height: 1.4; }
.service-chevron { grid-column: 3; grid-row: 1; color: var(--text-tertiary); font-size: 16px; }

.privacy-strip { display: flex; align-items: flex-start; gap: 13px; padding: 17px 19px; color: var(--text-secondary); box-shadow: none; }
.privacy-strip :deep(.n-icon) { flex: 0 0 auto; color: var(--primary-text); font-size: 20px; }
.privacy-strip div { display: grid; gap: 4px; }
.privacy-strip strong { color: var(--text-strong); font-size: 12px; }
.privacy-strip span { font-size: 10px; line-height: 1.65; }

.profile-dialog { width: min(520px, calc(100vw - 28px)); border-radius: 16px; }
.dialog-description { margin: -3px 0 18px; border-radius: 10px; padding: 11px 12px; color: var(--text-secondary); background: var(--surface-soft); font-size: 11px; line-height: 1.65; }
.reminder-setting-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 14px; }
.reminder-setting-grid :deep(.n-form-item) { min-width: 0; }
.setting-control { width: 100%; }
.readonly-time-picker :deep(.n-input),
.readonly-time-picker :deep(.n-input__input-el),
.readonly-time-picker :deep(.n-input-wrapper) { cursor: pointer; }
.readonly-time-picker :deep(.n-input__input-el) { caret-color: transparent; font-variant-numeric: tabular-nums; }
.dialog-actions { display: flex; justify-content: flex-end; gap: 9px; }
.dialog-actions.has-unbind { justify-content: space-between; }
.dialog-primary-actions { display: flex; justify-content: flex-end; gap: 9px; }

@media (max-width: 900px) {
  .profile-grid { grid-template-columns: 1fr; }
  .profile-sidebar { position: static; }
  .identity-card { position: static; align-items: center; display: grid; grid-template-columns: auto minmax(0, 1fr); gap: 5px 16px; text-align: left; }
  .profile-avatar { width: 60px; height: 60px; border-radius: 17px; font-size: 22px; }
  .identity-card h2 { margin: 0; }
  .identity-stats { grid-column: 1 / -1; }
}

@media (max-width: 720px) {
  .desktop-account-actions { display: none; }
}

@media (max-width: 680px) {
  .profile-main { width: min(100% - 20px, 1180px); padding: 24px 0 44px; }
  .page-heading h1 { font-size: 30px; }
  .profile-grid,
  .profile-content { gap: 12px; }
  .identity-card { display: flex; align-items: center; text-align: center; }
  .identity-card h2 { margin: 16px 0 0; }
  .profile-card { padding: 17px 14px; }
  .profile-card > header { align-items: flex-start; }
  .platform-list article { gap: 11px; padding: 13px 0; }
  .platform-logo { width: 40px; height: 40px; }
  .platform-copy > strong { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .status-text { white-space: nowrap; }
  .platform-actions { min-width: 0; justify-self: end; }
  .platform-actions :deep(.n-button) { min-height: 36px; padding: 0 11px; }
  .service-grid { grid-template-columns: 1fr; }
}

@media (max-width: 520px) {
  .reminder-setting-grid { grid-template-columns: 1fr; gap: 0; }
  .dialog-actions { display: block; }
  .dialog-actions.has-unbind { display: flex; align-items: stretch; flex-direction: column-reverse; gap: 10px; }
  .dialog-primary-actions { display: grid; grid-template-columns: 1fr 1fr; }
  .dialog-actions :deep(.n-button) { width: 100%; }
}
</style>
