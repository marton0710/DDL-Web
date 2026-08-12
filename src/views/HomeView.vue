<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { NIcon, NInput, NSpin, useMessage } from 'naive-ui'
import {
  AlarmOutline,
  CalendarOutline,
  CheckmarkCircleOutline,
  ChevronBackOutline,
  ChevronForwardOutline,
  ClipboardOutline,
  OpenOutline,
  RefreshOutline,
  SearchOutline,
  TimeOutline,
} from '@vicons/ionicons5'
import MainHeader from '../components/MainHeader.vue'
import HomeworkCalendarModal from '../components/HomeworkCalendarModal.vue'
import { homeworkApi } from '../api/homework'
import { getApiErrorMessage, isAuthenticationError } from '../api/client'
import type { Homework, HomeworkResponse, PlatformName } from '../api/types'
import { getPlatformMeta, PLATFORM_META } from '../domain/platform'
import { useSession } from '../state/session'
import {
  formatDeadlineDate,
  formatRemaining,
  formatTimelineDate,
  formatTimelineTime,
  formatUpdatedAt,
  getHomeworkState,
  isInCurrentWeek,
  parseDeadline,
} from '../utils/homework'

type TaskFilter = 'pending' | 'soon' | 'overdue' | 'done' | 'all'

const router = useRouter()
const message = useMessage()
const { clearSession } = useSession()
const taskFilter = ref<TaskFilter>('all')
const platformFilter = ref<'all' | PlatformName>('all')
const courseFilter = ref('all')
const keyword = ref('')
const page = ref(1)
const pageSize = 10
const homeworks = ref<Homework[]>([])
const lastRefreshTime = ref<string | null>(null)
const loading = ref(false)
const refreshing = ref(false)
const updatingHomeworkIds = ref(new Set<string>())
const calendarVisible = ref(false)

const todayLabel = new Intl.DateTimeFormat('zh-CN', {
  month: 'long',
  day: 'numeric',
  weekday: 'long',
}).format(new Date())

const courseOptions = computed(() =>
  [...new Set(homeworks.value.map((item) => item.course_name).filter(Boolean))]
    .sort((left, right) => left.localeCompare(right, 'zh-CN')),
)

const statistics = computed(() => ({
  all: homeworks.value.length,
  pending: homeworks.value.filter((item) => !item.done).length,
  soon: homeworks.value.filter((item) => getHomeworkState(item) === 'soon').length,
  overdue: homeworks.value.filter((item) => getHomeworkState(item) === 'overdue').length,
  done: homeworks.value.filter((item) => item.done).length,
}))

const completionRate = computed(() => (
  statistics.value.all ? Math.round((statistics.value.done / statistics.value.all) * 100) : 0
))

function compareHomeworks(left: Homework, right: Homework): number {
  if (left.done !== right.done) return left.done ? 1 : -1

  const leftTime = parseDeadline(left.deadline)?.getTime() ?? Number.MAX_SAFE_INTEGER
  const rightTime = parseDeadline(right.deadline)?.getTime() ?? Number.MAX_SAFE_INTEGER
  return leftTime - rightTime
}

const filteredHomeworks = computed(() => {
  const normalizedKeyword = keyword.value.trim().toLocaleLowerCase('zh-CN')

  return homeworks.value
    .filter((homework) => {
      if (platformFilter.value !== 'all' && homework.platform !== platformFilter.value) return false
      if (courseFilter.value !== 'all' && homework.course_name !== courseFilter.value) return false
      if (
        normalizedKeyword
        && !`${homework.title} ${homework.course_name}`.toLocaleLowerCase('zh-CN').includes(normalizedKeyword)
      ) return false

      const state = getHomeworkState(homework)
      if (taskFilter.value === 'pending') return !homework.done
      if (taskFilter.value === 'soon') return state === 'soon'
      if (taskFilter.value === 'overdue') return state === 'overdue'
      if (taskFilter.value === 'done') return state === 'done'
      return true
    })
    .sort(compareHomeworks)
})

const hasActiveFilters = computed(() => (
  taskFilter.value !== 'all'
  || platformFilter.value !== 'all'
  || courseFilter.value !== 'all'
  || Boolean(keyword.value.trim())
))

const pageCount = computed(() => Math.max(1, Math.ceil(filteredHomeworks.value.length / pageSize)))
const pagedHomeworks = computed(() => {
  const start = (page.value - 1) * pageSize
  return filteredHomeworks.value.slice(start, start + pageSize)
})
const visiblePages = computed(() => {
  const start = Math.max(1, Math.min(page.value - 2, pageCount.value - 4))
  const end = Math.min(pageCount.value, start + 4)
  return Array.from({ length: end - start + 1 }, (_, index) => start + index)
})

const priorityHomework = computed(() =>
  homeworks.value
    .filter((item) => !item.done && getHomeworkState(item) !== 'overdue')
    .sort((left, right) => {
      const leftTime = parseDeadline(left.deadline)?.getTime() ?? Number.MAX_SAFE_INTEGER
      const rightTime = parseDeadline(right.deadline)?.getTime() ?? Number.MAX_SAFE_INTEGER
      return leftTime - rightTime
    })[0] ?? null,
)

const timelineHomeworks = computed(() =>
  homeworks.value
    .filter((item) => !item.done && isInCurrentWeek(item))
    .sort((left, right) => {
      const leftTime = parseDeadline(left.deadline)?.getTime() ?? Number.MAX_SAFE_INTEGER
      const rightTime = parseDeadline(right.deadline)?.getTime() ?? Number.MAX_SAFE_INTEGER
      return leftTime - rightTime
    })
    .slice(0, 5),
)

const platformSummary = computed(() =>
  PLATFORM_META.map((platform) => ({
    ...platform,
    count: homeworks.value.filter((item) => item.platform === platform.name && !item.done).length,
  })),
)

watch([taskFilter, platformFilter, courseFilter, keyword], () => {
  page.value = 1
})

watch(pageCount, (nextPageCount) => {
  if (page.value > nextPageCount) page.value = nextPageCount
})

function applyHomeworkSnapshot(snapshot: HomeworkResponse) {
  homeworks.value = snapshot.homeworks
  lastRefreshTime.value = snapshot.last_refresh_time
  page.value = 1
}

async function handleAuthenticationError(error: unknown): Promise<boolean> {
  if (!isAuthenticationError(error)) return false
  clearSession()
  await router.replace({ name: 'login', query: { redirect: '/home' } })
  return true
}

async function loadHomeworks() {
  loading.value = true
  try {
    applyHomeworkSnapshot(await homeworkApi.getHomeworks())
  } catch (error) {
    if (await handleAuthenticationError(error)) return
    message.error(getApiErrorMessage(error, '作业加载失败'))
  } finally {
    loading.value = false
  }
}

async function refreshHomeworks() {
  if (refreshing.value) return
  refreshing.value = true
  try {
    const warnings = await homeworkApi.refresh()
    applyHomeworkSnapshot(await homeworkApi.getHomeworks())

    if (warnings.length) {
      warnings.forEach((warning) => message.warning(`平台刷新失败：${warning}`))
    } else {
      message.success(`作业已刷新，共 ${homeworks.value.length} 条`)
    }
  } catch (error) {
    if (await handleAuthenticationError(error)) return
    message.error(getApiErrorMessage(error, '作业刷新失败，请稍后重试'))
  } finally {
    refreshing.value = false
  }
}

async function changeCompletion(homework: Homework, event: Event) {
  if (!homework.id) return
  const checked = (event.target as HTMLInputElement).checked
  const previous = homework.done
  homework.done = checked
  updatingHomeworkIds.value = new Set(updatingHomeworkIds.value).add(homework.id)

  try {
    await homeworkApi.setCompleted(homework.id, checked)
  } catch (error) {
    homework.done = previous
    if (await handleAuthenticationError(error)) return
    message.error(getApiErrorMessage(error, '更新完成状态失败'))
  } finally {
    const nextIds = new Set(updatingHomeworkIds.value)
    nextIds.delete(homework.id)
    updatingHomeworkIds.value = nextIds
  }
}

function taskInputId(homework: Homework, index: number): string {
  return `task-${homework.id ?? `${page.value}-${index}`}`
}

function changePage(nextPage: number) {
  page.value = Math.min(Math.max(nextPage, 1), pageCount.value)
}

function resetFilters() {
  taskFilter.value = 'all'
  platformFilter.value = 'all'
  courseFilter.value = 'all'
  keyword.value = ''
}

onMounted(loadHomeworks)
</script>

<template>
  <div class="home-page">
    <MainHeader />

    <main class="page-shell home-main">
      <header class="workspace-heading">
        <div>
          <span class="date-label">{{ todayLabel }}</span>
          <h1>作业总览</h1>
          <p v-if="statistics.pending">
            还有 <strong>{{ statistics.pending }}</strong> 项待完成
            <template v-if="statistics.soon">，其中 <em>{{ statistics.soon }}</em> 项将在 24 小时内截止</template>
          </p>
          <p v-else>当前没有待完成作业，可以稍微放松一下。</p>
        </div>
        <div class="heading-actions">
          <button class="secondary-action" type="button" @click="calendarVisible = true">
            <NIcon><CalendarOutline /></NIcon>日历视图
          </button>
          <button
            class="primary-action"
            type="button"
            :disabled="loading || refreshing"
            @click="refreshHomeworks"
          >
            <NIcon :class="{ spinning: refreshing }"><RefreshOutline /></NIcon>
            {{ refreshing ? '正在刷新' : '刷新作业' }}
          </button>
          <small>上次更新：{{ formatUpdatedAt(lastRefreshTime) }}</small>
        </div>
      </header>

      <section class="overview-grid" aria-label="作业概况">
        <article class="focus-card">
          <span class="focus-icon"><NIcon><AlarmOutline /></NIcon></span>
          <div class="focus-copy">
            <span>优先关注</span>
            <template v-if="priorityHomework">
              <a v-if="priorityHomework.url" :href="priorityHomework.url" target="_blank" rel="noopener noreferrer">
                {{ priorityHomework.title }} <NIcon><OpenOutline /></NIcon>
              </a>
              <strong v-else>{{ priorityHomework.title }}</strong>
              <p>
                {{ priorityHomework.course_name || '未分类课程' }} ·
                {{ formatDeadlineDate(priorityHomework.deadline) }} {{ formatTimelineTime(priorityHomework.deadline) }}
              </p>
            </template>
            <template v-else>
              <strong>暂无临近截止</strong>
              <p>逾期作业不会进入优先关注，可在下方列表中查看。</p>
            </template>
          </div>
          <b v-if="priorityHomework" class="focus-remaining" :class="getHomeworkState(priorityHomework)">
            {{ formatRemaining(priorityHomework) }}
          </b>
        </article>

        <div class="metric-grid">
          <article><span>待完成</span><strong>{{ statistics.pending }}</strong></article>
          <article class="soon"><span>24 小时内</span><strong>{{ statistics.soon }}</strong></article>
          <article class="overdue"><span>已逾期</span><strong>{{ statistics.overdue }}</strong></article>
          <article class="done"><span>已完成</span><strong>{{ statistics.done }}</strong></article>
        </div>
      </section>

      <div class="workspace-grid">
        <section class="task-panel">
          <header class="panel-heading">
            <div><h2>任务</h2><span>{{ filteredHomeworks.length }} 项结果</span></div>
            <NInput v-model:value="keyword" class="task-search" clearable placeholder="搜索作业或课程">
              <template #prefix><NIcon><SearchOutline /></NIcon></template>
            </NInput>
          </header>

          <div class="task-toolbar">
            <div class="status-tabs" role="tablist" aria-label="任务状态筛选">
              <button type="button" :class="{ active: taskFilter === 'pending' }" @click="taskFilter = 'pending'">
                待完成 <span>{{ statistics.pending }}</span>
              </button>
              <button type="button" :class="{ active: taskFilter === 'soon' }" @click="taskFilter = 'soon'">即将截止</button>
              <button type="button" :class="{ active: taskFilter === 'overdue' }" @click="taskFilter = 'overdue'">已逾期</button>
              <button type="button" :class="{ active: taskFilter === 'done' }" @click="taskFilter = 'done'">已完成</button>
              <button type="button" :class="{ active: taskFilter === 'all' }" @click="taskFilter = 'all'">全部</button>
            </div>
            <div class="select-filters">
              <select v-model="platformFilter" aria-label="选择平台">
                <option value="all">全部平台</option>
                <option v-for="platform in PLATFORM_META" :key="platform.name" :value="platform.name">{{ platform.name }}</option>
              </select>
              <select v-model="courseFilter" aria-label="选择课程">
                <option value="all">全部课程</option>
                <option v-for="course in courseOptions" :key="course" :value="course">{{ course }}</option>
              </select>
            </div>
          </div>

          <div class="desktop-task-list">
            <table>
              <colgroup>
                <col class="task-col-check" />
                <col class="task-col-title" />
                <col class="task-col-platform" />
                <col class="task-col-deadline" />
                <col class="task-col-remaining" />
              </colgroup>
              <thead>
                <tr>
                  <th class="check-column"><span class="sr-only">完成状态</span></th>
                  <th>作业</th>
                  <th>平台</th>
                  <th>截止时间</th>
                  <th>剩余时间</th>
                </tr>
              </thead>
              <tbody>
                <tr v-if="loading">
                  <td class="table-message" colspan="5"><NSpin size="small" />正在加载作业</td>
                </tr>
                <tr v-else-if="pagedHomeworks.length === 0">
                  <td class="table-message empty-table" colspan="5">
                    <span class="empty-icon"><NIcon><ClipboardOutline /></NIcon></span>
                    <strong>{{ homeworks.length ? '没有符合条件的作业' : '还没有同步到作业' }}</strong>
                    <p>{{ homeworks.length ? '调整筛选条件后再看看。' : '先绑定学习平台，再点击右上角刷新作业。' }}</p>
                    <button v-if="homeworks.length" type="button" @click="resetFilters">清除筛选</button>
                    <button v-else type="button" @click="router.push('/profile')">去绑定平台</button>
                  </td>
                </tr>
                <tr v-for="(homework, index) in pagedHomeworks" v-else :key="homework.id ?? `${homework.platform}-${homework.title}`" :class="{ completed: homework.done }">
                  <td class="check-cell">
                    <input
                      :id="taskInputId(homework, index)"
                      class="task-toggle"
                      type="checkbox"
                      :checked="homework.done"
                      :disabled="!homework.id || updatingHomeworkIds.has(homework.id)"
                      @change="changeCompletion(homework, $event)"
                    />
                    <label :for="taskInputId(homework, index)" aria-label="切换完成状态" />
                  </td>
                  <td>
                    <div class="task-title-cell">
                      <a v-if="homework.url" :href="homework.url" target="_blank" rel="noopener noreferrer">{{ homework.title }}</a>
                      <strong v-else>{{ homework.title }}</strong>
                      <span>{{ homework.course_name || '未分类课程' }}</span>
                    </div>
                  </td>
                  <td><span class="platform-chip" :class="getPlatformMeta(homework.platform).className"><i />{{ homework.platform }}</span></td>
                  <td><div class="deadline-cell"><strong>{{ formatDeadlineDate(homework.deadline) }}</strong><span>{{ formatTimelineTime(homework.deadline) }}</span></div></td>
                  <td><span class="remaining-chip" :class="getHomeworkState(homework)">{{ formatRemaining(homework) }}</span></td>
                </tr>
              </tbody>
            </table>
          </div>

          <div class="mobile-task-list">
            <div v-if="loading" class="mobile-loading"><NSpin size="small" />正在加载作业</div>
            <div v-else-if="pagedHomeworks.length === 0" class="mobile-empty">
              <span class="empty-icon"><NIcon><ClipboardOutline /></NIcon></span>
              <strong>{{ homeworks.length ? '没有符合条件的作业' : '还没有同步到作业' }}</strong>
              <p>{{ homeworks.length ? '调整筛选条件后再看看。' : '先绑定学习平台，再刷新作业。' }}</p>
              <button type="button" @click="homeworks.length ? resetFilters() : router.push('/profile')">
                {{ homeworks.length ? '清除筛选' : '去绑定平台' }}
              </button>
            </div>
            <article v-for="(homework, index) in pagedHomeworks" v-else :key="homework.id ?? `${homework.platform}-${homework.title}`" :class="{ completed: homework.done }">
              <div class="mobile-task-head">
                <span class="platform-chip" :class="getPlatformMeta(homework.platform).className"><i />{{ homework.platform }}</span>
                <span class="remaining-chip" :class="getHomeworkState(homework)">{{ formatRemaining(homework) }}</span>
              </div>
              <a v-if="homework.url" class="mobile-task-title" :href="homework.url" target="_blank" rel="noopener noreferrer">{{ homework.title }}</a>
              <strong v-else class="mobile-task-title">{{ homework.title }}</strong>
              <p>{{ homework.course_name || '未分类课程' }}</p>
              <footer>
                <span><NIcon><TimeOutline /></NIcon>{{ formatDeadlineDate(homework.deadline) }} {{ formatTimelineTime(homework.deadline) }}</span>
                <label>
                  <input
                    :id="`mobile-${taskInputId(homework, index)}`"
                    type="checkbox"
                    :checked="homework.done"
                    :disabled="!homework.id || updatingHomeworkIds.has(homework.id)"
                    @change="changeCompletion(homework, $event)"
                  />
                  <span>{{ homework.done ? '已完成' : '标记完成' }}</span>
                </label>
              </footer>
            </article>
          </div>

          <footer v-if="filteredHomeworks.length" class="panel-footer">
            <span>第 {{ page }} / {{ pageCount }} 页</span>
            <nav class="pagination" aria-label="作业分页">
              <button type="button" :disabled="page === 1" aria-label="上一页" @click="changePage(page - 1)"><NIcon><ChevronBackOutline /></NIcon></button>
              <button v-for="pageNumber in visiblePages" :key="pageNumber" type="button" :class="{ active: pageNumber === page }" @click="changePage(pageNumber)">{{ pageNumber }}</button>
              <button type="button" :disabled="page === pageCount" aria-label="下一页" @click="changePage(page + 1)"><NIcon><ChevronForwardOutline /></NIcon></button>
            </nav>
          </footer>
        </section>

        <aside class="side-column">
          <section class="side-card upcoming-card">
            <header><div><span>本周</span><h2>接下来截止</h2></div></header>
            <div v-if="timelineHomeworks.length" class="upcoming-list">
              <article v-for="homework in timelineHomeworks" :key="homework.id ?? `${homework.platform}-${homework.title}`">
                <time><strong>{{ formatTimelineDate(homework.deadline) }}</strong><span>{{ formatTimelineTime(homework.deadline) }}</span></time>
                <div><strong>{{ homework.title }}</strong><span>{{ homework.course_name || homework.platform }}</span></div>
                <i :class="getPlatformMeta(homework.platform).className" />
              </article>
            </div>
            <div v-else class="side-empty"><NIcon><CheckmarkCircleOutline /></NIcon><strong>本周作业已清空</strong><span>没有即将截止的作业</span></div>
          </section>

          <section class="side-card progress-card">
            <header><div><span>全部作业</span><h2>完成进度</h2></div><strong v-if="statistics.all">{{ completionRate }}%</strong></header>
            <template v-if="statistics.all">
              <div class="progress-track"><i :style="{ width: `${completionRate}%` }" /></div>
              <p>已完成 {{ statistics.done }} 项，待处理 {{ statistics.pending }} 项</p>
              <ul>
                <li v-for="platform in platformSummary" :key="platform.name">
                  <i :class="platform.className" />{{ platform.name }}
                  <strong>{{ platform.count }} 项待办</strong>
                </li>
              </ul>
            </template>
            <div v-else class="progress-empty">
              <span class="empty-icon"><NIcon><ClipboardOutline /></NIcon></span>
              <strong>暂无作业数据</strong>
              <p>快去绑定平台刷新作业吧</p>
            </div>
          </section>
        </aside>
      </div>
    </main>

    <HomeworkCalendarModal v-model:show="calendarVisible" :homeworks="homeworks" />
  </div>
</template>

<style scoped>
.home-main {
  width: min(1360px, calc(100% - 48px));
  padding: 38px 0 64px;
}

.workspace-heading {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 32px;
  margin-bottom: 26px;
}

.date-label {
  display: block;
  margin-bottom: 7px;
  color: #6d7c94;
  font-size: 14px;
  font-weight: 600;
}

.workspace-heading h1 {
  margin: 0;
  color: #10213f;
  font-size: clamp(30px, 3vw, 42px);
  line-height: 1.15;
  letter-spacing: -1px;
}

.workspace-heading p {
  margin: 10px 0 0;
  color: #64738a;
  font-size: 15px;
}

.workspace-heading p strong { color: #1d58c9; }
.workspace-heading p em { color: #dd5a16; font-style: normal; font-weight: 700; }

.heading-actions {
  display: grid;
  grid-template-columns: auto auto;
  gap: 8px 10px;
}

.heading-actions small {
  grid-column: 1 / -1;
  justify-self: end;
  color: #8490a3;
  font-size: 12px;
}

.primary-action,
.secondary-action {
  height: 42px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  border: 1px solid #d9e1ec;
  border-radius: 10px;
  padding: 0 17px;
  color: #32445f;
  background: white;
  font-weight: 650;
  cursor: pointer;
  transition: 0.18s ease;
}

.primary-action {
  border-color: #1769e8;
  color: white;
  background: #1769e8;
  box-shadow: 0 8px 18px rgba(23, 105, 232, 0.2);
}

.primary-action:hover { background: #0f5ed9; transform: translateY(-1px); }
.secondary-action:hover { border-color: #aac4e9; color: #1769e8; background: #f7faff; }
.primary-action:disabled { opacity: 0.65; cursor: wait; transform: none; }
.spinning { animation: spin 0.8s linear infinite; }

.overview-grid {
  display: grid;
  grid-template-columns: minmax(0, 1.25fr) minmax(440px, 0.75fr);
  gap: 16px;
  margin-bottom: 18px;
}

.focus-card,
.metric-grid article,
.task-panel,
.side-card {
  border: 1px solid #e1e7f0;
  background: rgba(255, 255, 255, 0.96);
  box-shadow: 0 8px 26px rgba(26, 51, 89, 0.055);
}

.focus-card {
  min-width: 0;
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  align-items: center;
  gap: 16px;
  border-radius: 16px;
  padding: 20px 22px;
  background: linear-gradient(110deg, #f3f7ff 0%, #fff 52%);
}

.focus-icon {
  width: 45px;
  height: 45px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 13px;
  color: #1769e8;
  font-size: 25px;
  background: #e1ecff;
}

.focus-copy { min-width: 0; }
.focus-copy > span { display: block; margin-bottom: 4px; color: #7b889b; font-size: 12px; font-weight: 650; }
.focus-copy a,
.focus-copy > strong { max-width: 100%; display: flex; align-items: center; gap: 5px; overflow: hidden; color: #172946; font-size: 16px; font-weight: 750; text-overflow: ellipsis; white-space: nowrap; }
.focus-copy a:hover { color: #1769e8; }
.focus-copy p { margin: 5px 0 0; overflow: hidden; color: #78869a; font-size: 13px; text-overflow: ellipsis; white-space: nowrap; }
.focus-remaining { border-radius: 999px; padding: 7px 11px; color: #43516a; background: #eef2f7; font-size: 12px; white-space: nowrap; }
.focus-remaining.soon { color: #c95010; background: #fff0e4; }

.metric-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 10px;
}

.metric-grid article {
  min-width: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  border-radius: 14px;
  padding: 15px 14px;
  text-align: center;
}

.metric-grid span { color: #77859a; font-size: 12px; white-space: nowrap; }
.metric-grid strong { margin-top: 4px; color: #21324f; font-size: 25px; line-height: 1; }
.metric-grid .soon strong { color: #d15a17; }
.metric-grid .overdue strong { color: #d12c43; }
.metric-grid .done strong { color: #098777; }

.workspace-grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 320px;
  align-items: start;
  gap: 18px;
}

.task-panel,
.side-card { border-radius: 16px; }
.task-panel { min-width: 0; overflow: hidden; }

.panel-heading {
  min-height: 72px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  padding: 14px 20px;
  border-bottom: 1px solid #edf0f5;
}

.panel-heading > div { display: flex; align-items: baseline; gap: 10px; }
.panel-heading h2 { margin: 0; color: #152540; font-size: 19px; }
.panel-heading span { color: #8a96a8; font-size: 12px; }
.task-search { width: 250px; }
.task-search :deep(.n-input-wrapper) { padding: 0 12px; }

.task-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  padding: 12px 20px;
  border-bottom: 1px solid #edf0f5;
  background: #fbfcfe;
}

.status-tabs { display: flex; gap: 4px; }
.status-tabs button {
  min-height: 34px;
  border: 0;
  border-radius: 8px;
  padding: 0 11px;
  color: #69778c;
  background: transparent;
  font-size: 13px;
  cursor: pointer;
}
.status-tabs button:hover { color: #1769e8; background: #eef4ff; }
.status-tabs button.active { color: #1769e8; background: #e8f0ff; font-weight: 700; }
.status-tabs button span { margin-left: 3px; }

.select-filters { display: flex; gap: 8px; }
.select-filters select {
  max-width: 138px;
  height: 34px;
  border: 1px solid #dbe2ec;
  border-radius: 8px;
  padding: 0 29px 0 10px;
  color: #55657b;
  background: white;
  font-size: 12px;
  outline: none;
}

.desktop-task-list { overflow-x: auto; }
.desktop-task-list table { width: 100%; min-width: 760px; border-collapse: collapse; table-layout: fixed; }
.desktop-task-list .task-col-check { width: 52px; }
.desktop-task-list .task-col-platform { width: 112px; }
.desktop-task-list .task-col-deadline { width: 130px; }
.desktop-task-list .task-col-remaining { width: 172px; }
.desktop-task-list th { height: 42px; padding: 0 12px; color: #8b96a7; background: #fafbfd; font-size: 11px; font-weight: 650; text-align: left; }
.desktop-task-list td { height: 70px; border-top: 1px solid #eef1f5; padding: 9px 12px; color: #4c5a70; font-size: 13px; }
.desktop-task-list tbody tr { transition: background 0.15s ease; }
.desktop-task-list tbody tr:hover { background: #fafcff; }
.desktop-task-list tbody tr.completed { opacity: 0.6; }
.desktop-task-list tbody tr.completed .task-title-cell a,
.desktop-task-list tbody tr.completed .task-title-cell > strong { text-decoration: line-through; }
.check-column { width: 52px; }

.check-cell { text-align: center; }
.task-toggle { position: absolute; width: 1px; height: 1px; overflow: hidden; opacity: 0; }
.check-cell label {
  width: 20px;
  height: 20px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 1.5px solid #bcc8d8;
  border-radius: 6px;
  cursor: pointer;
}
.task-toggle:checked + label { border-color: #1769e8; background: #1769e8; }
.task-toggle:checked + label::after { content: ''; width: 8px; height: 4px; margin-top: -2px; border: solid white; border-width: 0 0 2px 2px; transform: rotate(-45deg); }
.task-toggle:disabled + label { opacity: 0.55; cursor: wait; }

.task-title-cell { min-width: 0; display: grid; gap: 4px; }
.task-title-cell a,
.task-title-cell > strong { overflow: hidden; color: #172946; font-size: 14px; font-weight: 700; text-overflow: ellipsis; white-space: nowrap; }
.task-title-cell a:hover { color: #1769e8; }
.task-title-cell span { overflow: hidden; color: #8a96a8; font-size: 11px; text-overflow: ellipsis; white-space: nowrap; }

.platform-chip,
.remaining-chip { display: inline-flex; align-items: center; border-radius: 999px; white-space: nowrap; }
.platform-chip { gap: 6px; padding: 6px 9px; color: #4e5e75; background: #f1f4f8; font-size: 11px; font-weight: 650; }
.platform-chip i { width: 7px; height: 7px; border-radius: 50%; background: currentColor; }
.platform-chip.cqupt { color: #1769e8; background: #edf4ff; }
.platform-chip.chaoxing { color: #d12c43; background: #fff0f2; }
.platform-chip.yuketang { color: #078b82; background: #eaf8f6; }
.remaining-chip { padding: 6px 9px; color: #526177; background: #f0f3f7; font-size: 11px; font-weight: 700; }
.remaining-chip.soon { color: #c95010; background: #fff0e4; }
.remaining-chip.overdue { color: #c9293d; background: #ffeaed; }
.remaining-chip.done { color: #087f71; background: #e9f7f4; }

.deadline-cell { display: grid; gap: 3px; }
.deadline-cell strong { color: #415069; font-size: 12px; font-weight: 650; }
.deadline-cell span { color: #8b96a7; font-size: 11px; }

.table-message { height: 285px !important; text-align: center !important; }
.table-message :deep(.n-spin) { margin-right: 8px; vertical-align: middle; }
.empty-table > * { display: block; margin-left: auto; margin-right: auto; }
.empty-table strong { margin-top: 12px; color: #2f405b; font-size: 15px; }
.empty-table p { margin-top: 6px; margin-bottom: 14px; color: #8793a5; font-size: 12px; }
.empty-table button,
.mobile-empty button { border: 0; border-radius: 8px; padding: 8px 12px; color: #1769e8; background: #eaf1ff; font-size: 12px; font-weight: 700; cursor: pointer; }
.empty-icon { width: 44px; height: 44px; display: inline-flex !important; align-items: center; justify-content: center; border-radius: 13px; color: #7192c6; background: #edf3fc; font-size: 23px; }

.mobile-task-list { display: none; }

.panel-footer {
  min-height: 57px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 9px 20px;
  border-top: 1px solid #edf0f5;
  color: #8a96a8;
  font-size: 12px;
}
.pagination { display: flex; gap: 5px; }
.pagination button { min-width: 31px; height: 31px; display: inline-flex; align-items: center; justify-content: center; border: 1px solid #dfe5ed; border-radius: 8px; color: #5f6d81; background: white; cursor: pointer; }
.pagination button.active { border-color: #1769e8; color: white; background: #1769e8; }
.pagination button:disabled { opacity: 0.38; cursor: default; }

.side-column { display: grid; gap: 18px; }
.side-card { overflow: hidden; padding: 18px; }
.side-card header { display: flex; align-items: flex-start; justify-content: space-between; gap: 12px; }
.side-card header span { display: block; margin-bottom: 3px; color: #8c98a9; font-size: 11px; font-weight: 650; text-transform: uppercase; }
.side-card header h2 { margin: 0; color: #172946; font-size: 17px; }
.side-card header button { border: 0; padding: 4px; color: #1769e8; background: transparent; font-size: 11px; cursor: pointer; }

.upcoming-list { display: grid; margin-top: 14px; }
.upcoming-list article { position: relative; display: grid; grid-template-columns: 58px minmax(0, 1fr) 5px; align-items: center; gap: 10px; min-height: 62px; border-top: 1px solid #eef1f5; }
.upcoming-list article:first-child { border-top: 0; }
.upcoming-list time { display: grid; gap: 2px; }
.upcoming-list time strong { color: #34445e; font-size: 12px; }
.upcoming-list time span { color: #929cab; font-size: 10px; }
.upcoming-list article > div { min-width: 0; display: grid; gap: 4px; }
.upcoming-list article > div strong { overflow: hidden; color: #2a3b56; font-size: 12px; text-overflow: ellipsis; white-space: nowrap; }
.upcoming-list article > div span { overflow: hidden; color: #8a96a7; font-size: 10px; text-overflow: ellipsis; white-space: nowrap; }
.upcoming-list article > i { width: 5px; height: 28px; border-radius: 4px; }
.upcoming-list i.cqupt,
.progress-card li i.cqupt { background: #1769e8; }
.upcoming-list i.chaoxing,
.progress-card li i.chaoxing { background: #d12c43; }
.upcoming-list i.yuketang,
.progress-card li i.yuketang { background: #07968c; }

.side-empty { min-height: 210px; display: flex; flex-direction: column; align-items: center; justify-content: center; color: #a2adbb; text-align: center; }
.side-empty :deep(.n-icon) { margin-bottom: 8px; color: #39a995; font-size: 32px; }
.side-empty strong { color: #526177; font-size: 13px; }
.side-empty span { margin-top: 4px; font-size: 11px; }

.progress-card header > strong { color: #1769e8; font-size: 25px; }
.progress-track { height: 8px; overflow: hidden; margin: 18px 0 8px; border-radius: 99px; background: #e9eef5; }
.progress-track i { height: 100%; display: block; border-radius: inherit; background: linear-gradient(90deg, #1769e8, #4b91f3); transition: width 0.4s ease; }
.progress-card > p { margin: 0 0 14px; color: #8a96a8; font-size: 11px; }
.progress-card ul { display: grid; gap: 10px; margin: 0; border-top: 1px solid #eef1f5; padding: 14px 0 0; list-style: none; }
.progress-card li { display: grid; grid-template-columns: 8px 1fr auto; align-items: center; gap: 8px; color: #5d6b80; font-size: 11px; }
.progress-card li i { width: 7px; height: 7px; border-radius: 50%; }
.progress-card li strong { color: #768398; font-size: 10px; font-weight: 600; }
.progress-empty { min-height: 188px; display: flex; flex-direction: column; align-items: center; justify-content: center; color: #99a5b5; text-align: center; }
.progress-empty > strong { margin-top: 10px; color: #526177; font-size: 13px; }
.progress-empty > p { margin: 5px 0 0; font-size: 11px; }

.sr-only { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0, 0, 0, 0); white-space: nowrap; }

@keyframes spin { to { transform: rotate(360deg); } }

@media (max-width: 1120px) {
  .overview-grid { grid-template-columns: 1fr; }
  .workspace-grid { grid-template-columns: 1fr; }
  .side-column { grid-template-columns: 1fr 1fr; }
  .upcoming-list { grid-template-columns: 1fr 1fr; column-gap: 18px; }
  .upcoming-list article:nth-child(2) { border-top: 0; }
}

@media (max-width: 820px) {
  .home-main { width: min(100% - 28px, 1360px); padding-top: 26px; }
  .workspace-heading { align-items: flex-start; }
  .metric-grid { grid-template-columns: repeat(2, 1fr); }
  .task-toolbar { align-items: stretch; flex-direction: column; }
  .status-tabs { overflow-x: auto; padding-bottom: 2px; }
  .status-tabs button { flex: 0 0 auto; }
  .select-filters select { flex: 1; max-width: none; }
  .desktop-task-list table { min-width: 720px; }
}

@media (max-width: 640px) {
  .home-main { width: min(100% - 20px, 1360px); padding: 22px 0 42px; }
  .workspace-heading { flex-direction: column; gap: 18px; }
  .workspace-heading h1 { font-size: 30px; }
  .heading-actions { width: 100%; }
  .primary-action,
  .secondary-action { width: 100%; padding: 0 12px; }
  .heading-actions small { justify-self: center; }
  .overview-grid { gap: 10px; }
  .focus-card { grid-template-columns: auto minmax(0, 1fr); padding: 16px; }
  .focus-remaining { grid-column: 2; justify-self: start; }
  .metric-grid { gap: 8px; }
  .metric-grid article { padding: 13px; }
  .metric-grid strong { font-size: 22px; }
  .workspace-grid,
  .side-column { gap: 12px; }
  .side-column { grid-template-columns: 1fr; }
  .upcoming-list { grid-template-columns: 1fr; }
  .upcoming-list article:nth-child(2) { border-top: 1px solid #eef1f5; }
  .panel-heading { align-items: stretch; flex-direction: column; padding: 16px; }
  .task-search { width: 100%; }
  .task-toolbar { padding: 10px 12px 12px; }
  .select-filters { display: grid; grid-template-columns: 1fr 1fr; }
  .desktop-task-list { display: none; }
  .mobile-task-list { width: 100%; min-width: 0; display: grid; gap: 10px; overflow: hidden; padding: 12px; background: #f8fafd; }
  .mobile-task-list article { width: 100%; min-width: 0; max-width: 100%; border: 1px solid #e3e8f0; border-radius: 13px; padding: 14px; background: white; }
  .mobile-task-list article > * { min-width: 0; }
  .mobile-task-list article.completed { opacity: 0.6; }
  .mobile-task-head { min-width: 0; display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 8px 10px; margin-bottom: 11px; }
  .mobile-task-head .platform-chip { flex: 0 0 auto; }
  .mobile-task-head .remaining-chip { max-width: 100%; overflow: hidden; text-overflow: ellipsis; }
  .mobile-task-title { display: -webkit-box; overflow: hidden; color: #172946; font-size: 14px; font-weight: 750; line-height: 1.45; overflow-wrap: anywhere; -webkit-box-orient: vertical; -webkit-line-clamp: 2; }
  .mobile-task-list article > p { margin: 5px 0 13px; color: #8a96a8; font-size: 11px; }
  .mobile-task-list article footer { min-width: 0; display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 9px 12px; border-top: 1px solid #eef1f5; padding-top: 11px; }
  .mobile-task-list article footer > span { min-width: 0; display: flex; align-items: center; gap: 5px; color: #7f8b9d; font-size: 10px; overflow-wrap: anywhere; }
  .mobile-task-list article footer label { flex: 0 0 auto; color: #1769e8; font-size: 11px; font-weight: 700; cursor: pointer; }
  .mobile-task-list article footer input { margin-right: 5px; accent-color: #1769e8; }
  .mobile-loading,
  .mobile-empty { min-height: 230px; display: flex; flex-direction: column; align-items: center; justify-content: center; color: #8c98a9; font-size: 12px; text-align: center; }
  .mobile-loading { flex-direction: row; gap: 8px; }
  .mobile-empty strong { margin-top: 12px; color: #43516a; font-size: 14px; }
  .mobile-empty p { margin: 6px 0 14px; }
  .panel-footer { padding: 10px 12px; }
  .pagination button { min-width: 29px; height: 29px; }
}

@media (max-width: 390px) {
  .status-tabs button { padding: 0 9px; }
  .panel-footer > span { display: none; }
  .pagination { width: 100%; justify-content: center; }
}
</style>
