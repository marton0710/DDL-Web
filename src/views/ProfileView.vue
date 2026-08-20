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
  ChatbubbleEllipsesOutline,
  ChevronForwardOutline,
  CopyOutline,
  FlashOutline,
  HelpCircleOutline,
  InformationCircleOutline,
  KeyOutline,
  LayersOutline,
  QrCodeOutline,
  TimeOutline,
} from '@vicons/ionicons5'
import AccountActions from '../components/AccountActions.vue'
import MainHeader from '../components/MainHeader.vue'
import { authApi } from '../api/auth'
import { getApiErrorMessage, isAuthenticationError } from '../api/client'
import { meetScheduleApi } from '../api/meetschedule'
import { platformApi } from '../api/platform'
import { qqPushApi } from '../api/qqpush'
import type {
  CurrentUser,
  PlatformAuthMethod,
  PlatformCredentials,
  QqPushStrategy,
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
const qqBindingGuideOpen = ref(false)
const qqBotNumberInput = ref<HTMLInputElement | null>(null)
const meetScheduleDialogOpen = ref(false)
const qqReminderSaving = ref(false)
const meetScheduleSaving = ref(false)

const userInfo = reactive<CurrentUser>({
  name: '',
  qqpush_config: {
    qqchan_id: null,
    qq_push_strategy: 'scheduled',
    qq_push_at: '07:00:00',
    qq_push_scope: 24,
  },
  meetschedule_config: {
    meetschedule_key: null,
  },
})

const QQ_BOT_NUMBER = '4014491707'
const QQ_BOT_JOIN_URL = 'https://qun.qq.com/qunpro/robot/qunshare?robot_appid=1905400907&robot_uin=4014491707&biz_type=0&jumpsource=shorturl'
const canOpenQqBotDirectly = window.matchMedia('(hover: none) and (pointer: coarse)').matches
const DEFAULT_REMINDER_TIME = '07:00'

function formatReminderTime(value: string): string {
  const match = /^(?:[01]\d|2[0-3]):[0-5]\d/.exec(value)
  return match?.[0] ?? DEFAULT_REMINDER_TIME
}

function reminderTimeToApi(value: string): string {
  return `${formatReminderTime(value)}:00`
}

function updateReminderTime(value: string | null) {
  if (value) qqReminderForm.scheduledPushTime = value
}

const qqReminderForm = reactive({
  qqchanId: '',
  mode: 'scheduled' as QqPushStrategy,
  scheduledPushTime: DEFAULT_REMINDER_TIME,
  coverageHours: 24 as number | null,
})
const meetScheduleKey = ref('')

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
  Number(Boolean(userInfo.qqpush_config.qqchan_id))
  + Number(Boolean(userInfo.meetschedule_config.meetschedule_key))
))
const qqReminderTimeSummary = computed(() => {
  const config = userInfo.qqpush_config
  if (!config.qqchan_id) return ''
  if (config.qq_push_strategy === 'realtime') {
    return `实时提醒 · 临期 ${config.qq_push_scope} 小时`
  }

  return `定时提醒 · ${formatReminderTime(config.qq_push_at)} 推送 · 临期 ${config.qq_push_scope} 小时`
})
const canSaveQqReminder = computed(() => (
  Boolean(userInfo.qqpush_config.qqchan_id || qqReminderForm.qqchanId.trim())
  && Number.isInteger(qqReminderForm.coverageHours)
  && Number(qqReminderForm.coverageHours) > 0
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
  Object.assign(userInfo, currentUser)
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

function resetQqReminderDraft() {
  const config = userInfo.qqpush_config
  qqReminderForm.qqchanId = ''
  qqReminderForm.mode = config.qq_push_strategy
  qqReminderForm.scheduledPushTime = formatReminderTime(config.qq_push_at)
  qqReminderForm.coverageHours = config.qq_push_scope
}

function openQqReminderSettings() {
  resetQqReminderDraft()
  qqReminderDialogOpen.value = true
}

function selectQqBotNumber() {
  const input = qqBotNumberInput.value
  if (!input) return null
  input.focus({ preventScroll: true })
  input.select()
  input.setSelectionRange(0, input.value.length)
  return input
}

async function copyQqBotNumber() {
  if (window.isSecureContext && navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(QQ_BOT_NUMBER)
      message.success('机器人 QQ 号已复制')
      return
    } catch {
      message.warning('复制失败，请长按 QQ 号手动复制')
      return
    }
  }

  const input = selectQqBotNumber()
  if (!input) {
    message.warning('无法选择 QQ 号，请刷新页面后重试')
    return
  }

  let copied = false
  try {
    copied = document.execCommand('copy')
  } catch {
    // 由下方的手动复制提示统一处理。
  }
  input.setSelectionRange(input.value.length, input.value.length)
  input.blur()

  if (copied) message.success('机器人 QQ 号已复制')
  else message.warning('复制失败，请长按 QQ 号手动复制')
}

async function saveQqReminderSettings() {
  if (!canSaveQqReminder.value) return
  const qqchanId = qqReminderForm.qqchanId.trim() || userInfo.qqpush_config.qqchan_id
  qqReminderSaving.value = true
  try {
    await qqPushApi.configure({
      qqchan_id: qqchanId,
      qq_push_strategy: qqReminderForm.mode,
      qq_push_at: reminderTimeToApi(qqReminderForm.scheduledPushTime),
      qq_push_scope: Number(qqReminderForm.coverageHours),
    })
    applyCurrentUser(await authApi.getCurrentUser())
    qqReminderForm.qqchanId = ''
    qqReminderDialogOpen.value = false
    message.success('QQ机器人提醒设置已保存')
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
    await meetScheduleApi.bind({ meetschedule_key: meetScheduleKey.value.trim() })
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
    await qqPushApi.configure({
      ...userInfo.qqpush_config,
      qqchan_id: null,
    })
    userInfo.qqpush_config.qqchan_id = null
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
    await meetScheduleApi.bind({ meetschedule_key: null })
    userInfo.meetschedule_config.meetschedule_key = null
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
            <header><div><span>偏好设置</span><h2>提醒与同步</h2><p>管理 QQ机器人提醒和课程表同步。</p></div></header>
            <div class="service-grid">
              <button type="button" class="service-item" @click="openQqReminderSettings">
                <span class="service-icon key"><NIcon><KeyOutline /></NIcon></span>
                <div>
                  <strong>QQ机器人提醒</strong>
                  <span>{{ userInfo.qqpush_config.qqchan_id || '未配置' }}</span>
                  <small v-if="qqReminderTimeSummary">{{ qqReminderTimeSummary }}</small>
                </div>
                <NIcon class="service-chevron"><ChevronForwardOutline /></NIcon>
              </button>
              <button type="button" class="service-item" @click="openMeetScheduleSettings">
                <span class="service-icon layers"><NIcon><LayersOutline /></NIcon></span>
                <div><strong>Meet 课程表</strong><span>{{ userInfo.meetschedule_config.meetschedule_key || '未配置' }}</span></div>
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

    <NModal
      v-model:show="qqReminderDialogOpen"
      :mask-closable="false"
      @after-leave="resetQqReminderDraft"
    >
      <NCard class="profile-dialog qq-reminder-dialog" title="QQ机器人提醒" :bordered="false" role="dialog" aria-modal="true">
        <p class="dialog-description">绑定 QQ机器人提醒并选择提醒方式，以及需要关注的未来作业临期范围。</p>
        <NForm label-placement="top">
          <NFormItem label="QQ机器人绑定码">
            <div class="qq-binding-control">
              <NInput
                v-model:value="qqReminderForm.qqchanId"
                :placeholder="userInfo.qqpush_config.qqchan_id ? `${userInfo.qqpush_config.qqchan_id}；输入新值可更换` : '请输入绑定码'"
              />
              <div class="binding-guide-entry">
                <span><NIcon><HelpCircleOutline /></NIcon>还没有绑定码？</span>
                <button type="button" @click="qqBindingGuideOpen = true">
                  查看绑定教程 <NIcon><ChevronForwardOutline /></NIcon>
                </button>
              </div>
            </div>
          </NFormItem>
          <div class="reminder-mode-field">
            <span class="reminder-field-label">提醒方式</span>
            <div class="reminder-mode-switch" role="radiogroup" aria-label="提醒方式">
              <button
                type="button"
                class="reminder-mode-option"
                :class="{ active: qqReminderForm.mode === 'scheduled' }"
                role="radio"
                :aria-checked="qqReminderForm.mode === 'scheduled'"
                @click="qqReminderForm.mode = 'scheduled'"
              >
                <span class="reminder-mode-icon"><NIcon><TimeOutline /></NIcon></span>
                <span class="reminder-mode-copy">
                  <strong>定时提醒</strong>
                  <small>每天按指定时刻汇总推送</small>
                </span>
                <span class="reminder-mode-indicator" aria-hidden="true" />
              </button>
              <button
                type="button"
                class="reminder-mode-option"
                :class="{ active: qqReminderForm.mode === 'realtime' }"
                role="radio"
                :aria-checked="qqReminderForm.mode === 'realtime'"
                @click="qqReminderForm.mode = 'realtime'"
              >
                <span class="reminder-mode-icon"><NIcon><FlashOutline /></NIcon></span>
                <span class="reminder-mode-copy">
                  <strong>实时提醒</strong>
                  <small>在临期范围的作业推送提醒，可能存在延迟</small>
                </span>
                <span class="reminder-mode-indicator" aria-hidden="true" />
              </button>
            </div>
          </div>
          <div
            class="reminder-setting-grid"
            :class="{ 'single-field': qqReminderForm.mode === 'realtime' }"
          >
            <NFormItem v-if="qqReminderForm.mode === 'scheduled'" label="推送时刻">
              <NTimePicker
                :formatted-value="qqReminderForm.scheduledPushTime"
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
            <NFormItem label="临期范围">
              <NInputNumber
                v-model:value="qqReminderForm.coverageHours"
                class="setting-control"
                :min="1"
                :max="48"
                :precision="0"
                :step="1"
                placeholder="1–48"
              >
                <template #suffix>小时</template>
              </NInputNumber>
            </NFormItem>
          </div>
        </NForm>
        <div class="dialog-actions" :class="{ 'has-unbind': userInfo.qqpush_config.qqchan_id }">
          <NButton v-if="userInfo.qqpush_config.qqchan_id" type="error" secondary :loading="qqReminderSaving" @click="unbindQqReminder">取消绑定</NButton>
          <div class="dialog-primary-actions">
            <NButton :disabled="qqReminderSaving" @click="qqReminderDialogOpen = false">取消</NButton>
            <NButton type="primary" :loading="qqReminderSaving" :disabled="!canSaveQqReminder" @click="saveQqReminderSettings">保存</NButton>
          </div>
        </div>
      </NCard>
    </NModal>

    <NModal v-model:show="qqBindingGuideOpen" :mask-closable="false">
      <NCard
        class="profile-dialog qq-binding-guide-dialog"
        title="QQ机器人绑定教程"
        :bordered="false"
        role="dialog"
        aria-modal="true"
      >
        <p class="binding-guide-intro">完成下面三步即可获取并填写绑定码</p>

        <ol class="binding-guide-steps">
          <li>
            <header class="binding-guide-step-heading">
              <b>1</b>
              <div><strong>添加 QQ 机器人</strong><span>任选二维码或 QQ 号其中一种方式</span></div>
            </header>
            <div class="bot-add-methods">
              <article class="bot-add-method qr-method">
                <header><NIcon><QrCodeOutline /></NIcon><strong>扫描二维码</strong></header>
                <a
                  class="bot-qr-link"
                  :class="{ interactive: canOpenQqBotDirectly }"
                  :href="canOpenQqBotDirectly ? QQ_BOT_JOIN_URL : undefined"
                  :target="canOpenQqBotDirectly ? '_blank' : undefined"
                  :rel="canOpenQqBotDirectly ? 'noopener noreferrer' : undefined"
                  :aria-label="canOpenQqBotDirectly ? '打开 QQ 添加聚合截止线机器人' : undefined"
                >
                  <img src="/assets/qqbot-1905400907.png" alt="聚合截止线 QQ机器人二维码" />
                </a>
                <small>{{ canOpenQqBotDirectly ? '使用手机 QQ 扫一扫，或点击二维码直接添加好友' : '请使用手机 QQ 扫一扫并添加' }}</small>
              </article>
              <article class="bot-add-method number-method">
                <header><NIcon><ChatbubbleEllipsesOutline /></NIcon><strong>搜索 QQ 号</strong></header>
                <div class="bot-number-copy">
                  <input
                    ref="qqBotNumberInput"
                    :value="QQ_BOT_NUMBER"
                    aria-label="机器人 QQ 号"
                    readonly
                    @click="selectQqBotNumber"
                  />
                  <button type="button" aria-label="复制机器人 QQ 号" @click="copyQqBotNumber">
                    <NIcon><CopyOutline /></NIcon>复制
                  </button>
                </div>
                <small>在 QQ 中搜索账号并添加好友</small>
              </article>
            </div>
          </li>
          <li>
            <header class="binding-guide-step-heading">
              <b>2</b>
              <div><strong>获取绑定码</strong><span>发送指令或使用聊天窗口快捷菜单</span></div>
            </header>
            <div class="bot-help-command">
              <span>任选一种方式：向机器人发送 <code>/register</code>，或点击快捷菜单中的 <strong class="bot-menu-action">获取绑定码</strong>。</span>
            </div>
          </li>
          <li>
            <header class="binding-guide-step-heading">
              <b>3</b>
              <div><strong>填写绑定码</strong><span>返回设置窗口完成绑定</span></div>
            </header>
            <p class="binding-guide-step-copy">获取绑定码后，返回上一层窗口，将它粘贴到“QQ机器人绑定码”输入框并保存。</p>
          </li>
        </ol>

        <div class="dialog-actions">
          <NButton type="primary" @click="qqBindingGuideOpen = false">我知道了</NButton>
        </div>
      </NCard>
    </NModal>

    <NModal v-model:show="meetScheduleDialogOpen" :mask-closable="false">
      <NCard class="profile-dialog" title="Meet 课程表" :bordered="false" role="dialog" aria-modal="true">
        <p class="dialog-description">设置 Meet 课程表同步密钥。</p>
        <NForm label-placement="top">
          <NFormItem label="MeetSchedule Key">
            <NInput
              v-model:value="meetScheduleKey"
              type="password"
              show-password-on="click"
              :placeholder="userInfo.meetschedule_config.meetschedule_key ? `${userInfo.meetschedule_config.meetschedule_key}；输入新值可更换` : '请输入同步密钥'"
            />
          </NFormItem>
        </NForm>
        <div class="dialog-actions" :class="{ 'has-unbind': userInfo.meetschedule_config.meetschedule_key }">
          <NButton v-if="userInfo.meetschedule_config.meetschedule_key" type="error" secondary :loading="meetScheduleSaving" @click="unbindMeetSchedule">取消绑定</NButton>
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
        <div class="dialog-actions">
          <div class="dialog-primary-actions">
            <NButton @click="bindDialogOpen = false">取消</NButton>
            <NButton type="primary" :loading="bindLoading" @click="submitPlatformBinding">确认绑定</NButton>
          </div>
        </div>
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
.qq-reminder-dialog { width: min(680px, calc(100vw - 28px)); }
.dialog-description { margin: -3px 0 18px; border-radius: 10px; padding: 11px 12px; color: var(--text-secondary); background: var(--surface-soft); font-size: 11px; line-height: 1.65; }
.qq-binding-control { width: 100%; display: grid; gap: 8px; }
.binding-guide-entry { display: flex; align-items: center; justify-content: space-between; gap: 12px; color: var(--text-tertiary); font-size: 10px; }
.binding-guide-entry > span { display: inline-flex; align-items: center; gap: 5px; }
.binding-guide-entry > span :deep(.n-icon) { color: var(--primary-text); font-size: 14px; }
.binding-guide-entry button { display: inline-flex; align-items: center; gap: 2px; border: 0; padding: 2px 0; color: var(--primary-text); background: transparent; font-size: 10px; font-weight: 700; cursor: pointer; }
.binding-guide-entry button :deep(.n-icon) { font-size: 13px; }
.reminder-mode-field { margin-bottom: 20px; }
.reminder-field-label { display: block; margin-bottom: 8px; color: var(--text-strong); font-size: 14px; font-weight: 500; }
.reminder-mode-switch { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; }
.reminder-mode-option { min-width: 0; min-height: 72px; display: grid; grid-template-columns: auto minmax(0, 1fr) auto; align-items: center; gap: 11px; border: 1px solid var(--line-strong); border-radius: 13px; padding: 11px 13px; background: var(--surface-subtle); text-align: left; cursor: pointer; transition: border-color 0.18s ease, background-color 0.18s ease, box-shadow 0.18s ease, transform 0.18s ease; }
.reminder-mode-option:hover { border-color: var(--primary-border); background: var(--surface-hover); transform: translateY(-1px); }
.reminder-mode-option.active { border-color: var(--primary-border); background: var(--primary-soft); box-shadow: inset 0 0 0 1px var(--primary-border); }
.reminder-mode-icon { width: 36px; height: 36px; display: inline-flex; align-items: center; justify-content: center; border-radius: 11px; color: var(--text-tertiary); background: var(--surface-elevated); font-size: 19px; }
.reminder-mode-option.active .reminder-mode-icon { color: var(--primary-text); background: var(--surface-card); }
.reminder-mode-copy { min-width: 0; display: grid; gap: 3px; }
.reminder-mode-copy strong { color: var(--text-strong); font-size: 13px; }
.reminder-mode-copy small { overflow: hidden; color: var(--text-tertiary); font-size: 10px; line-height: 1.45; text-overflow: ellipsis; white-space: nowrap; }
.reminder-mode-option.active .reminder-mode-copy small { color: var(--text-secondary); }
.reminder-mode-indicator { width: 16px; height: 16px; display: inline-flex; align-items: center; justify-content: center; border: 1.5px solid var(--control-border); border-radius: 50%; }
.reminder-mode-option.active .reminder-mode-indicator { border-color: var(--primary); background: var(--primary); box-shadow: inset 0 0 0 3px var(--primary-soft); }
.reminder-setting-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 14px; }
.reminder-setting-grid.single-field { grid-template-columns: 1fr; }
.reminder-setting-grid :deep(.n-form-item) { min-width: 0; }
.setting-control { width: 100%; }
.readonly-time-picker :deep(.n-input),
.readonly-time-picker :deep(.n-input__input-el),
.readonly-time-picker :deep(.n-input-wrapper) { cursor: pointer; }
.readonly-time-picker :deep(.n-input__input-el) { caret-color: transparent; font-variant-numeric: tabular-nums; }
.dialog-actions { display: flex; justify-content: flex-end; gap: 9px; }
.dialog-actions.has-unbind { justify-content: space-between; }
.dialog-primary-actions { display: flex; justify-content: flex-end; gap: 9px; }

.qq-binding-guide-dialog { width: min(720px, calc(100vw - 28px)); }
.qq-binding-guide-dialog .dialog-actions { margin-top: 18px; }
.binding-guide-intro { margin: -3px 0 18px; color: var(--text-secondary); font-size: 12px; line-height: 1.7; }
.binding-guide-steps { display: grid; gap: 12px; margin: 0; padding: 0; list-style: none; }
.binding-guide-steps > li { border: 1px solid var(--line); border-radius: 14px; padding: 14px; background: var(--surface-subtle); }
.binding-guide-step-heading { display: flex; align-items: center; gap: 10px; }
.binding-guide-step-heading > b { width: 26px; height: 26px; flex: 0 0 auto; display: inline-flex; align-items: center; justify-content: center; border-radius: 8px; color: var(--primary-soft-text); background: var(--primary-soft); font-size: 12px; }
.binding-guide-step-heading > div { min-width: 0; display: grid; gap: 2px; }
.binding-guide-step-heading strong { color: var(--text-strong); font-size: 13px; }
.binding-guide-step-heading span { color: var(--text-tertiary); font-size: 10px; }
.bot-add-methods { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; margin-top: 12px; }
.bot-add-method { min-width: 0; display: flex; align-items: center; flex-direction: column; border: 1px solid var(--line-soft); border-radius: 12px; padding: 12px; background: var(--surface-elevated); text-align: center; }
.bot-add-method > header { width: 100%; display: flex; align-items: center; justify-content: center; gap: 6px; }
.bot-add-method > header :deep(.n-icon) { color: var(--primary-text); font-size: 17px; }
.bot-add-method > header strong { color: var(--text-strong); font-size: 12px; }
.bot-add-method small { color: var(--text-tertiary); font-size: 9px; line-height: 1.5; }
.bot-qr-link { display: inline-flex; margin: 10px 0 7px; border-radius: 12px; }
.bot-qr-link.interactive:focus-visible { outline: 2px solid var(--primary); outline-offset: 3px; }
.qr-method img { width: 132px; height: 132px; border: 6px solid #fff; border-radius: 12px; object-fit: cover; transition: transform 0.18s ease, box-shadow 0.18s ease; }
.bot-qr-link.interactive:hover img { box-shadow: 0 8px 20px rgba(23, 105, 232, 0.18); transform: translateY(-2px); }
.number-method { justify-content: center; }
.bot-number-copy { width: 100%; display: flex; align-items: center; justify-content: center; gap: 8px; margin: 24px 0 20px; }
.bot-number-copy input { width: 154px; min-width: 0; border: 0; padding: 0; outline: 0; color: var(--text-strong); background: transparent; font-family: ui-monospace, SFMono-Regular, Consolas, monospace; font-size: 23px; font-weight: 750; letter-spacing: 1px; text-align: center; }
.bot-number-copy button { display: inline-flex; align-items: center; gap: 4px; border: 1px solid var(--primary-border); border-radius: 8px; padding: 6px 8px; color: var(--primary-soft-text); background: var(--primary-soft); font-size: 10px; font-weight: 700; cursor: pointer; }
.bot-help-command { margin: 12px 0 0 36px; }
.bot-help-command code { border-radius: 8px; padding: 6px 10px; color: var(--primary-soft-text); background: var(--primary-soft); font-family: ui-monospace, SFMono-Regular, Consolas, monospace; font-size: 13px; font-weight: 750; user-select: all; }
.bot-menu-action { display: inline-block; border-radius: 7px; padding: 4px 8px; color: var(--primary-soft-text); background: var(--primary-soft); font-size: 11px; font-weight: 750; white-space: nowrap; }
.bot-help-command span,
.binding-guide-step-copy { color: var(--text-secondary); font-size: 10px; line-height: 1.65; }
.binding-guide-step-copy { margin: 9px 0 0 36px; }
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
  .binding-guide-entry { align-items: flex-start; flex-direction: column; gap: 5px; }
  .bot-add-methods { grid-template-columns: 1fr; }
  .reminder-mode-switch { grid-template-columns: 1fr; }
  .reminder-mode-copy small { overflow: visible; text-overflow: clip; white-space: normal; }
  .reminder-setting-grid { grid-template-columns: 1fr; gap: 0; }
  .dialog-actions { display: block; }
  .dialog-actions.has-unbind { display: flex; align-items: stretch; flex-direction: column-reverse; gap: 10px; }
  .dialog-primary-actions { display: grid; grid-template-columns: 1fr 1fr; }
  .dialog-actions :deep(.n-button) { width: 100%; }
}
</style>
