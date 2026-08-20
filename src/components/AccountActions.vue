<script setup lang="ts">
import { computed, onBeforeUnmount, ref, useId, watch } from 'vue'
import { useRouter } from 'vue-router'
import { NButton, NCard, NIcon, NInput, NModal, useMessage } from 'naive-ui'
import { LogOutOutline, TrashOutline, WarningOutline } from '@vicons/ionicons5'
import { authApi } from '../api/auth'
import { getApiErrorMessage } from '../api/client'
import { useSession } from '../state/session'

const props = withDefaults(defineProps<{
  username: string
  variant?: 'desktop' | 'mobile'
  showLogout?: boolean
  showDeletion?: boolean
}>(), {
  variant: 'desktop',
  showLogout: true,
  showDeletion: true,
})

const message = useMessage()
const router = useRouter()
const { clearSession } = useSession()
const deletionInputId = useId()
const logoutDialogOpen = ref(false)
const deletionDialogOpen = ref(false)
const logoutLoading = ref(false)
const deletionLoading = ref(false)
const deletionCountdown = ref(10)
const deletionInput = ref('')
let countdownTimer: number | undefined

const deletionPhrase = computed(() => `确认删除${props.username}用户的所有信息`)
const canDelete = computed(() => (
  deletionCountdown.value === 0
  && Boolean(props.username)
  && deletionInput.value === deletionPhrase.value
))

function clearCountdown() {
  if (countdownTimer !== undefined) {
    window.clearInterval(countdownTimer)
    countdownTimer = undefined
  }
}

function openLogoutDialog() {
  logoutDialogOpen.value = true
}

function openDeletionDialog() {
  if (!props.username) {
    message.warning('用户信息尚未加载完成')
    return
  }
  deletionDialogOpen.value = true
}

async function confirmLogout() {
  if (logoutLoading.value) return
  logoutLoading.value = true
  try {
    await authApi.logout()
    logoutDialogOpen.value = false
    clearSession()
    await router.replace('/login')
    message.success('已退出登录')
  } catch (error) {
    message.error(getApiErrorMessage(error, '退出登录失败'))
  } finally {
    logoutLoading.value = false
  }
}

async function confirmDeletion() {
  if (!canDelete.value || deletionLoading.value) return
  deletionLoading.value = true
  try {
    await authApi.deleteAccount()
    deletionDialogOpen.value = false
    clearSession()
    await router.replace('/login')
    message.success('账户已注销')
  } catch (error) {
    message.error(getApiErrorMessage(error, '账户注销失败'))
  } finally {
    deletionLoading.value = false
  }
}

watch(deletionDialogOpen, (open) => {
  clearCountdown()
  deletionCountdown.value = 10
  deletionInput.value = ''
  if (!open) return

  countdownTimer = window.setInterval(() => {
    deletionCountdown.value -= 1
    if (deletionCountdown.value === 0) clearCountdown()
  }, 1_000)
})

onBeforeUnmount(clearCountdown)
</script>

<template>
  <div class="account-actions" :class="{ mobile: props.variant === 'mobile' }">
    <button v-if="props.showLogout" class="account-action logout" type="button" @click="openLogoutDialog">
      <NIcon><LogOutOutline /></NIcon>
      退出登录
    </button>
    <button v-if="props.showDeletion" class="account-action delete" type="button" @click="openDeletionDialog">
      <NIcon><TrashOutline /></NIcon>
      注销账户
    </button>
  </div>

  <NModal v-if="props.showLogout" v-model:show="logoutDialogOpen" :mask-closable="false">
    <NCard
      class="account-dialog logout-dialog"
      :bordered="false"
      role="dialog"
      aria-modal="true"
      title="确认退出登录？"
    >
      <p>退出后，该账号已有的登录状态将失效，其他设备可能也需要重新登录（提醒功能不受影响）。</p>
      <div class="dialog-actions">
        <NButton :disabled="logoutLoading" @click="logoutDialogOpen = false">取消</NButton>
        <NButton type="error" :loading="logoutLoading" @click="confirmLogout">确认退出</NButton>
      </div>
    </NCard>
  </NModal>

  <NModal v-if="props.showDeletion" v-model:show="deletionDialogOpen" :mask-closable="false">
    <NCard
      class="account-dialog deletion-dialog"
      :bordered="false"
      role="dialog"
      aria-modal="true"
      title="注销账户"
    >
      <div class="deletion-warning">
        <NIcon><WarningOutline /></NIcon>
        <div>
          <strong>账户数据将被永久删除</strong>
          <span>此操作完成后无法撤销。</span>
        </div>
      </div>

      <div class="deletion-confirmation">
        <p>为确认这是你本人的决定，请完整输入下方文字，内容必须一致。</p>
        <label :for="deletionInputId">
          <strong>{{ deletionPhrase }}</strong>
        </label>
        <NInput
          :id="deletionInputId"
          v-model:value="deletionInput"
          placeholder="请输入上方完整内容"
          autocomplete="off"
        />
      </div>

      <div class="dialog-actions">
        <NButton :disabled="deletionLoading" @click="deletionDialogOpen = false">取消</NButton>
        <NButton type="error" :disabled="!canDelete" :loading="deletionLoading" @click="confirmDeletion">
          {{ deletionCountdown > 0 ? `请等待 ${deletionCountdown} 秒` : '确认删除账户数据' }}
        </NButton>
      </div>
    </NCard>
  </NModal>
</template>

<style scoped>
.account-actions {
  display: grid;
  gap: 10px;
}

.account-action {
  width: 100%;
  height: 46px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  border: 1px solid var(--line-strong);
  border-radius: 12px;
  color: var(--text-secondary);
  background: var(--surface-card);
  font-size: 13px;
  font-weight: 650;
  cursor: pointer;
  transition: 0.18s ease;
}

.account-action:hover,
.account-action:focus-visible {
  border-color: var(--control-border);
  outline: none;
  background: var(--surface-elevated);
  box-shadow: var(--shadow);
}

.account-action.delete {
  color: var(--danger-text);
  border-color: var(--danger-border);
  background: var(--danger-container-soft);
}

.account-action.delete:hover,
.account-action.delete:focus-visible {
  color: var(--danger-text);
  border-color: var(--danger-text);
  background: var(--danger-container);
}

.account-actions.mobile .account-action {
  height: 44px;
  justify-content: flex-start;
  padding: 0 13px;
  border-color: transparent;
  border-radius: 10px;
  box-shadow: none;
}

.account-actions.mobile .logout {
  background: var(--surface-soft);
}

.account-actions.mobile .delete {
  background: var(--danger-container-soft);
}

.account-dialog {
  width: min(480px, calc(100vw - 28px));
  border-radius: 18px;
}

.account-dialog p {
  margin: 0 0 22px;
  color: var(--text-secondary);
  font-size: 13px;
  line-height: 1.7;
}

.deletion-warning {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  margin-bottom: 18px;
  border: 1px solid var(--danger-border);
  border-radius: 12px;
  padding: 13px 14px;
  color: var(--danger-text);
  background: var(--danger-container-soft);
}

.deletion-warning :deep(.n-icon) {
  flex: 0 0 auto;
  margin-top: 1px;
  font-size: 21px;
}

.deletion-warning div {
  display: grid;
  gap: 4px;
}

.deletion-warning strong {
  font-size: 13px;
}

.deletion-warning span {
  color: var(--text-secondary);
  font-size: 11px;
}

.deletion-confirmation {
  display: grid;
  gap: 10px;
  margin-bottom: 18px;
}

.deletion-confirmation > p {
  margin: 0;
  color: var(--text-secondary);
  font-size: 11px;
  line-height: 1.7;
}

.deletion-confirmation label {
  display: grid;
}

.deletion-confirmation label strong {
  overflow-wrap: anywhere;
  border-radius: 8px;
  padding: 7px 9px;
  color: var(--text-strong);
  background: var(--surface-soft);
  font-family: ui-monospace, SFMono-Regular, Consolas, monospace;
  font-size: 12px;
  user-select: all;
}

.dialog-actions {
  display: flex;
  justify-content: flex-end;
  gap: 9px;
}

@media (max-width: 520px) {
  .account-dialog {
    border-radius: 15px;
  }

  .dialog-actions {
    grid-template-columns: 1fr 1fr;
    display: grid;
  }

  .dialog-actions :deep(.n-button) {
    width: 100%;
  }
}
</style>
