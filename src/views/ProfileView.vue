<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { NButton, NCard, NCheckbox, NForm, NFormItem, NIcon, NInput, NModal, useMessage } from 'naive-ui'
import {
  InformationCircleOutline,
  KeyOutline,
  LayersOutline,
  MailOutline,
  WarningOutline,
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
  UserInfoPatch,
} from '../api/types'
import { PLATFORM_META, type PlatformMeta } from '../domain/platform'
import { useSession } from '../state/session'

const router = useRouter()
const message = useMessage()
const { avatarText, clearSession, displayName, setDisplayName } = useSession()
const profileLoading = ref(false)
const savingProfile = ref(false)
const editDialogOpen = ref(false)
const bindDialogOpen = ref(false)
const bindLoading = ref(false)
const bindAuthMethod = ref<PlatformAuthMethod | null>(null)

const userInfo = reactive<CurrentUser>({
  name: '',
  email: null,
  qqchan_id: null,
  meetschedule_key: null,
})

const editForm = reactive({
  email: '',
  qqchanId: '',
  meetscheduleKey: '',
  clearQqchanId: false,
  clearMeetscheduleKey: false,
})

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
const profileEmail = computed(() => userInfo.email || '暂未填写邮箱')
const connectedPlatformCount = computed(() => platforms.filter((item) => item.status === 'bound').length)

function nullableValue(value: string): string | null {
  return value.trim() || null
}

async function handleUnauthorized(error: unknown): Promise<boolean> {
  if (!isAuthenticationError(error)) return false
  clearSession()
  await router.push('/login')
  return true
}

async function loadUserInfo(): Promise<boolean> {
  profileLoading.value = true
  try {
    const currentUser = await authApi.getCurrentUser()
    Object.assign(userInfo, currentUser)
    setDisplayName(currentUser.name)
    return true
  } catch (error) {
    if (await handleUnauthorized(error)) return false
    message.error(getApiErrorMessage(error, '个人资料加载失败'))
    return false
  } finally {
    profileLoading.value = false
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

function openProfileEditor() {
  editForm.email = userInfo.email ?? ''
  editForm.qqchanId = ''
  editForm.meetscheduleKey = ''
  editForm.clearQqchanId = false
  editForm.clearMeetscheduleKey = false
  editDialogOpen.value = true
}

async function saveProfile() {
  if (editForm.email && !/^\S+@\S+\.\S+$/.test(editForm.email)) {
    message.warning('请输入有效的邮箱地址')
    return
  }

  const input: UserInfoPatch = {
    email: nullableValue(editForm.email),
  }
  if (editForm.clearQqchanId) input.qqchan_id = null
  else if (editForm.qqchanId.trim()) input.qqchan_id = editForm.qqchanId.trim()
  if (editForm.clearMeetscheduleKey) input.meetschedule_key = null
  else if (editForm.meetscheduleKey.trim()) input.meetschedule_key = editForm.meetscheduleKey.trim()

  savingProfile.value = true
  try {
    await authApi.updateUserInfo(input)
    const currentUser = await authApi.getCurrentUser()
    Object.assign(userInfo, currentUser)
    setDisplayName(currentUser.name)
    editDialogOpen.value = false
    message.success('个人资料已更新')
  } catch (error) {
    if (await handleUnauthorized(error)) return
    message.error(getApiErrorMessage(error, '个人资料更新失败'))
  } finally {
    savingProfile.value = false
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
        <p>管理个人资料、学习平台与提醒服务。</p>
      </header>

      <div class="profile-grid">
        <div class="profile-sidebar">
          <aside class="identity-card">
            <div class="profile-avatar">{{ avatarText }}</div>
            <h2>{{ profileName }}</h2>
            <p><NIcon><MailOutline /></NIcon>{{ profileLoading ? '正在加载资料' : profileEmail }}</p>
            <div class="identity-stats">
              <div><strong>{{ connectedPlatformCount }}</strong><span>已连接平台</span></div>
              <div><strong>{{ userInfo.qqchan_id ? 1 : 0 }}</strong><span>提醒服务</span></div>
            </div>
            <NButton block type="primary" ghost :loading="profileLoading" @click="openProfileEditor">编辑个人资料</NButton>
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
            <header><div><span>可选配置</span><h2>提醒与同步</h2><p>敏感字段已做脱敏处理，留空不会覆盖现有配置。</p></div></header>
            <div class="service-grid">
              <article>
                <span class="service-icon mail"><NIcon><MailOutline /></NIcon></span>
                <div><strong>通知邮箱</strong><span>{{ userInfo.email || '未配置' }}</span></div>
                <em :class="{ active: userInfo.email }">{{ userInfo.email ? '已配置' : '未配置' }}</em>
              </article>
              <article>
                <span class="service-icon key"><NIcon><KeyOutline /></NIcon></span>
                <div><strong>QQChan 提醒</strong><span>{{ userInfo.qqchan_id || '未配置' }}</span></div>
                <em :class="{ active: userInfo.qqchan_id }">{{ userInfo.qqchan_id ? '已配置' : '未配置' }}</em>
              </article>
              <article>
                <span class="service-icon layers"><NIcon><LayersOutline /></NIcon></span>
                <div><strong>Meet 课程表</strong><span>{{ userInfo.meetschedule_key || '未配置' }}</span></div>
                <em :class="{ active: userInfo.meetschedule_key }">{{ userInfo.meetschedule_key ? '已配置' : '未配置' }}</em>
              </article>
            </div>
          </section>

          <section class="privacy-strip">
            <NIcon><InformationCircleOutline /></NIcon>
            <div><strong>关于平台凭据</strong><span>平台凭据仅用于完成平台登录及 Cookie 失效后的重新认证。解绑平台会同时移除该平台的作业数据和平台凭据。</span></div>
          </section>
        </div>
      </div>
    </main>

    <NModal v-model:show="editDialogOpen">
      <NCard class="profile-dialog" title="编辑个人资料" :bordered="false" role="dialog" aria-modal="true">
        <p class="dialog-description">留空保留现有配置，填写新值或明确勾选清除时更新配置。</p>
        <NForm class="profile-form" label-placement="top">
          <NFormItem label="邮箱">
            <NInput v-model:value="editForm.email" placeholder="用于接收通知的邮箱" />
          </NFormItem>
          <NFormItem label="QQChan ID">
            <div class="sensitive-field">
              <NInput
                v-model:value="editForm.qqchanId"
                :disabled="editForm.clearQqchanId"
                :placeholder="userInfo.qqchan_id ? '输入新值以替换现有配置' : '不使用可留空'"
              />
              <div v-if="userInfo.qqchan_id" class="sensitive-meta" :class="{ clearing: editForm.clearQqchanId }">
                <span>{{ editForm.clearQqchanId ? '保存后将清除当前配置' : '已配置，留空则保持不变' }}</span>
                <NCheckbox v-model:checked="editForm.clearQqchanId">清除此项</NCheckbox>
              </div>
            </div>
          </NFormItem>
          <NFormItem label="MeetSchedule Key">
            <div class="sensitive-field">
              <NInput
                v-model:value="editForm.meetscheduleKey"
                type="password"
                show-password-on="click"
                :disabled="editForm.clearMeetscheduleKey"
                :placeholder="userInfo.meetschedule_key ? '输入新值以替换现有配置' : '不使用可留空'"
              />
              <div v-if="userInfo.meetschedule_key" class="sensitive-meta" :class="{ clearing: editForm.clearMeetscheduleKey }">
                <span>{{ editForm.clearMeetscheduleKey ? '保存后将清除当前配置' : '已配置，留空则保持不变' }}</span>
                <NCheckbox v-model:checked="editForm.clearMeetscheduleKey">清除此项</NCheckbox>
              </div>
            </div>
          </NFormItem>
        </NForm>
        <div class="dialog-actions"><NButton @click="editDialogOpen = false">取消</NButton><NButton type="primary" :loading="savingProfile" @click="saveProfile">保存</NButton></div>
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
            ? '该平台需要独立账号密码。后端会使用凭据登录并加密保存，以便授权失效时重新认证。'
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
.page-heading > span { color: #75849a; font-size: 13px; font-weight: 650; }
.page-heading h1 { margin: 5px 0 0; color: #172946; font-size: 36px; letter-spacing: -0.8px; }
.page-heading p { margin: 8px 0 0; color: #75849a; font-size: 14px; }

.profile-grid { display: grid; grid-template-columns: 290px minmax(0, 1fr); align-items: start; gap: 18px; }
.profile-sidebar { position: sticky; top: 82px; display: grid; gap: 10px; }
.identity-card,
.profile-card,
.privacy-strip { border: 1px solid #e1e7f0; border-radius: 16px; background: rgba(255, 255, 255, 0.97); box-shadow: var(--shadow); }
.identity-card { display: flex; flex-direction: column; align-items: center; padding: 28px 22px 20px; text-align: center; }
.profile-avatar { width: 76px; height: 76px; display: flex; align-items: center; justify-content: center; border-radius: 22px; color: white; background: linear-gradient(145deg, #2d7df0, #145cca); box-shadow: 0 12px 24px rgba(23, 105, 232, 0.22); font-size: 28px; font-weight: 750; }
.identity-card h2 { margin: 16px 0 5px; color: #1b2d49; font-size: 20px; }
.identity-card > p { max-width: 100%; display: flex; align-items: center; gap: 6px; margin: 0; overflow: hidden; color: #7d899c; font-size: 12px; text-overflow: ellipsis; white-space: nowrap; }
.identity-stats { width: 100%; display: grid; grid-template-columns: 1fr 1fr; margin: 22px 0; border: solid #edf0f5; border-width: 1px 0; padding: 15px 0; }
.identity-stats div { display: grid; gap: 4px; }
.identity-stats div + div { border-left: 1px solid #edf0f5; }
.identity-stats strong { color: #20324f; font-size: 20px; }
.identity-stats span { color: #8a96a8; font-size: 10px; }

.profile-content { display: grid; gap: 18px; }
.profile-card { overflow: hidden; padding: 22px; }
.profile-card > header { display: flex; align-items: flex-start; justify-content: space-between; gap: 20px; padding-bottom: 18px; border-bottom: 1px solid #edf0f5; }
.profile-card header span { color: #8491a4; font-size: 10px; font-weight: 700; text-transform: uppercase; }
.profile-card h2 { margin: 3px 0 0; color: #1d2f4b; font-size: 19px; }
.profile-card header p { margin: 5px 0 0; color: #8491a4; font-size: 11px; }
.platform-card > header > strong { border-radius: 999px; padding: 7px 10px; color: #1769e8; background: #edf4ff; font-size: 11px; white-space: nowrap; }

.platform-list { display: grid; }
.platform-list article { display: grid; grid-template-columns: auto minmax(0, 1fr) auto; align-items: center; gap: 14px; min-height: 78px; border-top: 1px solid #edf0f5; }
.platform-list article:first-child { border-top: 0; }
.platform-logo { width: 42px; height: 42px; display: flex; align-items: center; justify-content: center; border-radius: 12px; color: white; font-size: 16px; font-weight: 750; }
.platform-logo.cqupt { background: #1769e8; }
.platform-logo.chaoxing { background: #d62c43; }
.platform-logo.yuketang { background: #09988d; }
.platform-copy { min-width: 0; display: grid; gap: 5px; }
.platform-copy > strong { color: #2a3b56; font-size: 14px; }
.status-text { display: flex; align-items: center; gap: 6px; color: #8793a5; font-size: 10px; }
.status-text i { width: 6px; height: 6px; border-radius: 50%; background: #aab3c1; }
.status-text.connected { color: #078777; }
.status-text.connected i { background: #0da590; box-shadow: 0 0 0 3px #e6f7f3; }
.status-text.warning { color: #cb4c23; }
.status-text.warning i { background: #dc6133; box-shadow: 0 0 0 3px #fff0e8; }
.platform-actions { display: flex; gap: 7px; }

.services-card > header { align-items: center; }
.service-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; padding-top: 18px; }
.service-grid article { min-width: 0; display: grid; grid-template-columns: auto minmax(0, 1fr); align-items: center; gap: 10px; border: 1px solid #e7ebf2; border-radius: 13px; padding: 13px; }
.service-icon { width: 34px; height: 34px; display: flex; align-items: center; justify-content: center; border-radius: 10px; font-size: 17px; }
.service-icon.mail { color: #1769e8; background: #eaf1ff; }
.service-icon.key { color: #b55b13; background: #fff1e4; }
.service-icon.layers { color: #078777; background: #e8f7f4; }
.service-grid article > div { min-width: 0; display: grid; gap: 4px; }
.service-grid article > div strong { color: #34445e; font-size: 11px; }
.service-grid article > div span { overflow: hidden; color: #929cab; font-size: 9px; text-overflow: ellipsis; white-space: nowrap; }
.service-grid em { grid-column: 2; justify-self: start; border-radius: 99px; padding: 4px 7px; color: #7d899c; background: #f0f3f7; font-size: 8px; font-style: normal; }
.service-grid em.active { color: #078777; background: #e9f7f4; }

.privacy-strip { display: flex; align-items: flex-start; gap: 13px; padding: 17px 19px; color: #68778d; box-shadow: none; }
.privacy-strip :deep(.n-icon) { flex: 0 0 auto; color: #1769e8; font-size: 20px; }
.privacy-strip div { display: grid; gap: 4px; }
.privacy-strip strong { color: #354660; font-size: 12px; }
.privacy-strip span { font-size: 10px; line-height: 1.65; }

.profile-dialog { width: min(520px, calc(100vw - 28px)); border-radius: 16px; }
.dialog-description { margin: -3px 0 18px; border-radius: 10px; padding: 11px 12px; color: #6b7a90; background: #f4f7fb; font-size: 11px; line-height: 1.65; }
.profile-form :deep(.n-form-item-blank) { min-width: 0; }
.sensitive-field { width: 100%; min-width: 0; display: grid; gap: 8px; }
.sensitive-meta { min-height: 28px; display: flex; align-items: center; justify-content: space-between; gap: 12px; border-radius: 8px; padding: 4px 8px 4px 10px; color: #7b889b; background: #f7f9fc; font-size: 10px; }
.sensitive-meta.clearing { color: #bd3042; background: #fff2f4; }
.sensitive-meta :deep(.n-checkbox) { flex: 0 0 auto; }
.sensitive-meta :deep(.n-checkbox__label) { color: #59697f; font-size: 10px; }
.sensitive-meta.clearing :deep(.n-checkbox__label) { color: #bd3042; }
.dialog-actions { display: flex; justify-content: flex-end; gap: 9px; }

@media (max-width: 900px) {
  .profile-grid { grid-template-columns: 1fr; }
  .profile-sidebar { position: static; }
  .identity-card { position: static; align-items: flex-start; display: grid; grid-template-columns: auto minmax(0, 1fr) auto; gap: 5px 16px; text-align: left; }
  .profile-avatar { grid-row: 1 / span 2; width: 60px; height: 60px; border-radius: 17px; font-size: 22px; }
  .identity-card h2 { align-self: end; margin: 0; }
  .identity-card > p { align-self: start; }
  .identity-stats { grid-column: 1 / -1; }
  .identity-card > :deep(.n-button) { grid-column: 3; grid-row: 1 / span 2; align-self: center; }
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
  .identity-card h2 { align-self: auto; margin: 16px 0 5px; }
  .identity-card > p { align-self: auto; }
  .identity-card > :deep(.n-button) { width: 100%; }
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
  .sensitive-meta { align-items: flex-start; flex-direction: column; gap: 5px; padding: 8px 10px; }
  .dialog-actions { display: grid; grid-template-columns: 1fr 1fr; }
  .dialog-actions :deep(.n-button) { width: 100%; }
}
</style>
