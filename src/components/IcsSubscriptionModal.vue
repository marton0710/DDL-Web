<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import {
  NAlert, NButton, NCard, NEmpty, NIcon, NModal,
  NSpin, NThing, useMessage,
} from 'naive-ui'
import { AddOutline, TrashOutline } from '@vicons/ionicons5'
import { getIcsFeedUrl, icsApi } from '../api/ics'
import type { IcsSubscription } from '../api/types'
import { copyText } from '../utils/clipboard'
import InlineConfirmButton from './InlineConfirmButton.vue'
import CopyButton from './CopyButton.vue'

const props = defineProps<{ show: boolean; count: number }>()
const emit = defineEmits<{
  'update:show': [value: boolean]
  changed: []
  error: [error: unknown, fallback: string]
}>()
const message = useMessage()
const subscriptions = ref<IcsSubscription[]>([])
const createdLinks = ref<Record<string, string>>({})
const loading = ref(false)
const loadFailed = ref(false)
const creating = ref(false)
const revokingId = ref<string | null>(null)
const busy = computed(() => creating.value || revokingId.value !== null)
const dateFormat = new Intl.DateTimeFormat('zh-CN', {
  year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit',
})

function formatDate(value: string): string {
  return dateFormat.format(new Date(value))
}

async function loadSubscriptions() {
  if (loading.value) return
  loading.value = true
  loadFailed.value = false
  try {
    subscriptions.value = await icsApi.list()
  } catch (error) {
    loadFailed.value = true
    emit('error', error, 'ICS 订阅加载失败')
  } finally {
    loading.value = false
  }
}

async function createSubscription() {
  creating.value = true
  try {
    const { token, ...subscription } = await icsApi.create()
    createdLinks.value[subscription.id] = getIcsFeedUrl(token)
    subscriptions.value.unshift(subscription)
    emit('changed')
    await copySubscription(subscription.id)
  } catch (error) {
    emit('error', error, '创建 ICS 订阅失败')
  } finally {
    creating.value = false
  }
}

async function revokeSubscription(id: string) {
  revokingId.value = id
  try {
    await icsApi.revoke(id)
    subscriptions.value = subscriptions.value.filter((item) => item.id !== id)
    delete createdLinks.value[id]
    emit('changed')
    message.success('订阅已撤销，对应链接已失效')
  } catch (error) {
    emit('error', error, '撤销 ICS 订阅失败')
  } finally {
    revokingId.value = null
  }
}

async function copySubscription(id: string) {
  const url = createdLinks.value[id]
  if (!url) return
  if (await copyText(url)) message.success('订阅链接已复制')
  else message.error('复制失败，请重试并允许浏览器访问剪贴板')
}

function close() {
  if (busy.value) return
  emit('update:show', false)
}

watch(() => props.show, (show) => {
  if (show) void loadSubscriptions()
}, { immediate: true })
</script>

<template>
  <NModal
    :show="show"
    preset="card"
    size="small"
    title="ICS 日历订阅"
    class="ics-dialog"
    :bordered="false"
    :mask-closable="false"
    :close-on-esc="!busy"
    :closable="!busy"
    content-scrollable
    @update:show="close"
    @after-leave="createdLinks = {}"
  >
    <p class="ics-description">在日历中查看作业截止时间，也可以为不同设备分别创建订阅。</p>
    <NAlert v-if="Object.keys(createdLinks).length" type="info" :show-icon="false" class="ics-notice" role="status">
      关闭本弹窗后不能再次复制，请及时保存订阅链接。
    </NAlert>

    <div class="ics-toolbar">
      <strong>我的订阅<span class="ics-count">{{ count }}</span></strong>
      <NButton type="primary" :loading="creating" :disabled="loading || loadFailed || busy" @click="createSubscription">
        <template #icon><NIcon><AddOutline /></NIcon></template>
        新建订阅
      </NButton>
    </div>

    <NSpin :show="loading">
      <div class="ics-list-content" :aria-busy="loading">
        <NEmpty v-if="loadFailed" description="暂时无法加载订阅">
          <template #extra><NButton @click="loadSubscriptions">重新加载</NButton></template>
        </NEmpty>
        <NEmpty v-else-if="!loading && !subscriptions.length" description="还没有订阅，为你的日历创建一个吧" />
        <div v-else-if="!loading" class="ics-subscriptions">
          <NCard v-for="subscription in subscriptions" :key="subscription.id" size="small" tag="article" class="ics-subscription" content-style="padding: 8px 12px; display: flex; align-items: center; gap: 12px">
            <NThing class="ics-subscription-details">
              <template #header>
                <strong class="ics-subscription-heading">拉取 {{ subscription.fetch_count }} 次</strong>
              </template>
              <template #description>
                <span class="ics-last-fetch">
                  最近拉取：<time v-if="subscription.last_fetched_at" :datetime="subscription.last_fetched_at">{{ formatDate(subscription.last_fetched_at) }}</time><span v-else>尚未拉取</span>
                </span>
              </template>
            </NThing>
            <div class="ics-subscription-actions">
              <CopyButton
                v-if="createdLinks[subscription.id]"
                label="复制订阅链接"
                @click="copySubscription(subscription.id)"
              />
              <InlineConfirmButton
                class="ics-revoke"
                label="撤销订阅"
                confirm-label="确认撤销"
                :subject="`订阅 ${subscription.id.slice(-8)}`"
                quaternary
                type="error"
                :disabled="busy"
                :loading="revokingId === subscription.id"
                @confirm="revokeSubscription(subscription.id)"
              >
                <template #icon="{ confirming }">
                  <NIcon :size="20"><TrashOutline class="ics-trash" :class="{ 'ics-trash-open': confirming }" /></NIcon>
                </template>
              </InlineConfirmButton>
            </div>
          </NCard>
        </div>
      </div>
    </NSpin>
    <template #footer>
      <div class="ics-footer">
        <span>更新频率由日历应用决定</span>
        <NButton class="ics-done" :disabled="busy" @click="close">完成</NButton>
      </div>
    </template>
  </NModal>

</template>

<style scoped>
:global(.ics-dialog) { width: min(600px, calc(100vw - 28px)); max-height: calc(100dvh - 48px); }
.ics-description { margin: 0 0 12px; color: var(--text-secondary); font-size: 13px; line-height: 1.7; }
.ics-notice { margin-bottom: 12px; font-size: 12px; }
.ics-toolbar { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-bottom: 8px; }
.ics-toolbar > strong { display: flex; align-items: center; gap: 8px; color: var(--text-strong); font-size: 14px; }
.ics-count { min-width: 22px; padding: 1px 6px; border-radius: 6px; background: var(--neutral-container); color: var(--text-secondary); font-size: 12px; font-weight: 500; text-align: center; }
.ics-list-content[aria-busy='true'] { min-height: 72px; }
.ics-list-content > :deep(.n-empty) { padding: 28px 0; }
.ics-subscriptions { display: grid; gap: 8px; }
.ics-subscription { min-width: 0; border-radius: 12px; }
.ics-subscription-details { flex: 1; min-width: 0; }
.ics-subscription-heading { color: var(--text-strong); font-size: 14px; }
.ics-last-fetch { color: var(--text-secondary); font-size: 12px; }
.ics-last-fetch time { display: inline-block; }
.ics-subscription-actions { display: flex; align-items: center; flex-shrink: 0; gap: 4px; }
.ics-revoke { width: 40px; height: 40px; }
.ics-trash { overflow: visible; }
/* Ionicons TrashOutline 的第二、三个路径分别是桶盖和提手。 */
.ics-trash :deep(path:nth-child(2)), .ics-trash :deep(path:nth-child(3)) { transform-box: view-box; transform-origin: 50% 21.875%; }
.ics-trash-open :deep(path:nth-child(2)), .ics-trash-open :deep(path:nth-child(3)) { transform: translateY(-8%) rotate(-16deg); }
@media (prefers-reduced-motion: no-preference) {
  .ics-trash :deep(path:nth-child(2)), .ics-trash :deep(path:nth-child(3)) { transition: transform 0.18s ease; }
}
.ics-footer { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
.ics-footer > span { color: var(--text-tertiary); font-size: 12px; }
@media (max-width: 480px) {
  :global(.ics-dialog) { max-height: calc(100dvh - 28px); }
  .ics-done { display: none; }
}
</style>
