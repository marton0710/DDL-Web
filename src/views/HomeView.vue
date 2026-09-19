<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { NButton, NPagination, NIcon, NInput, NSelect, NSpin, useMessage } from 'naive-ui'
import {
  AlarmOutline,
  CalendarOutline,
  CheckmarkCircleOutline,
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
const taskFilter = ref<TaskFilter>('pending')
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

const platformSelectOptions = [
  { label: '全部平台', value: 'all' },
  ...PLATFORM_META.map((platform) => ({ label: platform.name, value: platform.name })),
]

const courseSelectOptions = computed(() => [
  { label: '全部课程', value: 'all' },
  ...[...new Set(homeworks.value.map((item) => item.course_name).filter(Boolean))]
    .sort((left, right) => left.localeCompare(right, 'zh-CN'))
    .map((course) => ({ label: course, value: course })),
])

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

function homeworkSortGroup(homework: Homework, now: number): number {
  if (homework.done) return 3

  const deadlineTimestamp = getDeadlineTimestamp(homework)
  if (deadlineTimestamp === Number.MAX_SAFE_INTEGER) return 2
  return deadlineTimestamp < now ? 1 : 0
}

function getDeadlineTimestamp(homework: Homework): number {
  return parseDeadline(homework.deadline)?.getTime() ?? Number.MAX_SAFE_INTEGER
}

function compareDeadlines(left: Homework, right: Homework): number {
  return getDeadlineTimestamp(left) - getDeadlineTimestamp(right)
}

function compareHomeworks(left: Homework, right: Homework, now: number): number {
  const groupDifference = homeworkSortGroup(left, now) - homeworkSortGroup(right, now)
  if (groupDifference !== 0) return groupDifference
  if (left.done && right.done) {
    const leftTimestamp = getDeadlineTimestamp(left)
    const rightTimestamp = getDeadlineTimestamp(right)
    if (leftTimestamp === Number.MAX_SAFE_INTEGER || rightTimestamp === Number.MAX_SAFE_INTEGER) {
      return leftTimestamp - rightTimestamp
    }
    return rightTimestamp - leftTimestamp
  }
  return compareDeadlines(left, right)
}

const filteredHomeworks = computed(() => {
  const normalizedKeyword = keyword.value.trim().toLocaleLowerCase('zh-CN')
  const now = Date.now()

  return homeworks.value
    .filter((homework) => {
      if (platformFilter.value !== 'all' && homework.platform !== platformFilter.value) return false
      if (courseFilter.value !== 'all' && homework.course_name !== courseFilter.value) return false
      if (
        normalizedKeyword
        && !`${homework.title} ${homework.course_name}`.toLocaleLowerCase('zh-CN').includes(normalizedKeyword)
      ) return false

      if (taskFilter.value === 'pending') return !homework.done
      if (taskFilter.value === 'all') return true
      return getHomeworkState(homework) === taskFilter.value
    })
    .sort((left, right) => compareHomeworks(left, right, now))
})

const pageCount = computed(() => Math.max(1, Math.ceil(filteredHomeworks.value.length / pageSize)))
const pagedHomeworks = computed(() => {
  const start = (page.value - 1) * pageSize
  return filteredHomeworks.value.slice(start, start + pageSize)
})

const priorityHomework = computed(() =>
  homeworks.value
    .filter((item) => (
      !item.done
      && parseDeadline(item.deadline) !== null
      && getHomeworkState(item) !== 'overdue'
    ))
    .sort(compareDeadlines)[0] ?? null,
)

const timelineHomeworks = computed(() =>
  homeworks.value
    .filter((item) => (
      !item.done
      && isInCurrentWeek(item)
      && getHomeworkState(item) !== 'overdue'
    ))
    .sort(compareDeadlines)
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
  await router.replace('/login')
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

async function changeCompletion(homework: Homework) {
  if (!homework.id || updatingHomeworkIds.value.has(homework.id)) return
  const completed = !homework.done
  updatingHomeworkIds.value.add(homework.id)

  try {
    await homeworkApi.setCompleted(homework.id, completed)
    homework.done = completed
  } catch (error) {
    if (await handleAuthenticationError(error)) return
    message.error(getApiErrorMessage(error, '更新完成状态失败'))
  } finally {
    updatingHomeworkIds.value.delete(homework.id)
  }
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
          <p v-else>当前没有待完成作业。</p>
        </div>
        <div class="heading-actions">
          <NButton class="heading-action" size="large" @click="calendarVisible = true">
            <template #icon><NIcon><CalendarOutline /></NIcon></template>日历视图
          </NButton>
          <NButton
            class="heading-action"
            type="primary"
            size="large"
            :loading="refreshing"
            :disabled="loading || refreshing"
            @click="refreshHomeworks"
          >
            <template #icon><NIcon><RefreshOutline /></NIcon></template>
            {{ refreshing ? '正在刷新' : '刷新作业' }}
          </NButton>
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
              <strong>暂无待截止作业</strong>
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
            <div class="status-tabs" role="group" aria-label="任务状态筛选">
              <NButton :type="taskFilter === 'pending' ? 'primary' : 'default'" secondary :aria-pressed="taskFilter === 'pending'" @click="taskFilter = 'pending'">
                待完成 <span>{{ statistics.pending }}</span>
              </NButton>
              <NButton :type="taskFilter === 'soon' ? 'primary' : 'default'" secondary :aria-pressed="taskFilter === 'soon'" @click="taskFilter = 'soon'">即将截止</NButton>
              <NButton :type="taskFilter === 'overdue' ? 'primary' : 'default'" secondary :aria-pressed="taskFilter === 'overdue'" @click="taskFilter = 'overdue'">已逾期</NButton>
              <NButton :type="taskFilter === 'done' ? 'primary' : 'default'" secondary :aria-pressed="taskFilter === 'done'" @click="taskFilter = 'done'">已完成</NButton>
              <NButton :type="taskFilter === 'all' ? 'primary' : 'default'" secondary :aria-pressed="taskFilter === 'all'" @click="taskFilter = 'all'">全部</NButton>
            </div>
            <div class="select-filters">
              <NSelect
                v-model:value="platformFilter"
                class="filter-select platform-filter"
                :options="platformSelectOptions"
                aria-label="选择平台"
              />
              <NSelect
                v-model:value="courseFilter"
                class="filter-select course-filter"
                :options="courseSelectOptions"
                aria-label="选择课程"
              />
            </div>
          </div>

          <div class="desktop-task-list">
            <table>
              <colgroup>
                <col class="task-col-title" />
                <col class="task-col-platform" />
                <col class="task-col-deadline" />
                <col class="task-col-remaining" />
                <col class="task-col-action" />
              </colgroup>
              <thead>
                <tr>
                  <th>作业</th>
                  <th>平台</th>
                  <th>截止时间</th>
                  <th>剩余时间</th>
                  <th>操作</th>
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
                    <NButton v-if="homeworks.length" type="primary" secondary size="small" @click="resetFilters">清除筛选</NButton>
                    <NButton v-else type="primary" secondary size="small" @click="router.push('/profile')">去绑定平台</NButton>
                  </td>
                </tr>
                <tr v-for="homework in pagedHomeworks" v-else :key="homework.id ?? `${homework.platform}-${homework.title}`" :class="{ completed: homework.done }">
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
                  <td>
                    <NButton
                      dashed
                      size="small"
                      :loading="!!homework.id && updatingHomeworkIds.has(homework.id)"
                      :disabled="!homework.id || updatingHomeworkIds.has(homework.id)"
                      :aria-label="`${homework.done ? '撤销完成' : '标记完成'}：${homework.title}`"
                      @click="changeCompletion(homework)"
                    >
                      {{ homework.done ? '撤销完成' : '标记完成' }}
                    </NButton>
                  </td>
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
              <NButton type="primary" secondary size="small" @click="homeworks.length ? resetFilters() : router.push('/profile')">
                {{ homeworks.length ? '清除筛选' : '去绑定平台' }}
              </NButton>
            </div>
            <article v-for="homework in pagedHomeworks" v-else :key="homework.id ?? `${homework.platform}-${homework.title}`" :class="{ completed: homework.done }">
              <div class="mobile-task-head">
                <span class="platform-chip" :class="getPlatformMeta(homework.platform).className"><i />{{ homework.platform }}</span>
                <span class="remaining-chip" :class="getHomeworkState(homework)">{{ formatRemaining(homework) }}</span>
              </div>
              <a v-if="homework.url" class="mobile-task-title" :href="homework.url" target="_blank" rel="noopener noreferrer">{{ homework.title }}</a>
              <strong v-else class="mobile-task-title">{{ homework.title }}</strong>
              <p>{{ homework.course_name || '未分类课程' }}</p>
              <footer>
                <span><NIcon><TimeOutline /></NIcon>{{ formatDeadlineDate(homework.deadline) }} {{ formatTimelineTime(homework.deadline) }}</span>
                <NButton
                  dashed
                  size="small"
                  :loading="!!homework.id && updatingHomeworkIds.has(homework.id)"
                  :disabled="!homework.id || updatingHomeworkIds.has(homework.id)"
                  :aria-label="`${homework.done ? '撤销完成' : '标记完成'}：${homework.title}`"
                  @click="changeCompletion(homework)"
                >
                  {{ homework.done ? '撤销完成' : '标记完成' }}
                </NButton>
              </footer>
            </article>
          </div>

          <footer v-if="filteredHomeworks.length" class="panel-footer">
            <span>第 {{ page }} / {{ pageCount }} 页</span>
            <NPagination v-model:page="page" class="pagination" :page-count="pageCount" :page-slot="5" size="small" aria-label="作业分页" />
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
            <div v-else class="side-empty"><NIcon><CheckmarkCircleOutline /></NIcon><strong>本周暂无待截止作业</strong></div>
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
              <p>绑定学习平台后，刷新即可同步作业</p>
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
  color: var(--text-tertiary);
  font-size: 14px;
  font-weight: 600;
}

.workspace-heading h1 {
  margin: 0;
  color: var(--text-strong);
  font-size: clamp(30px, 3vw, 42px);
  line-height: 1.15;
  letter-spacing: -1px;
}

.workspace-heading p {
  margin: 10px 0 0;
  color: var(--text-secondary);
  font-size: 15px;
}

.workspace-heading p strong { color: var(--primary-text); }
.workspace-heading p em { color: var(--warning-text); font-style: normal; font-weight: 700; }

.heading-actions {
  display: grid;
  grid-template-columns: auto auto;
  gap: 8px 10px;
}

.heading-actions small {
  grid-column: 1 / -1;
  justify-self: end;
  color: var(--text-tertiary);
  font-size: 12px;
}

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
  border: 1px solid var(--line);
  background: var(--surface-card);
  box-shadow: var(--shadow);
}

.focus-card {
  min-width: 0;
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  align-items: center;
  gap: 16px;
  border-radius: 16px;
  padding: 20px 22px;
  background: var(--focus-card-bg);
}

.focus-icon {
  width: 45px;
  height: 45px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 13px;
  color: var(--primary-text);
  font-size: 25px;
  background: var(--primary-soft-hover);
}

.focus-copy { min-width: 0; }
.focus-copy > span { display: block; margin-bottom: 4px; color: var(--text-tertiary); font-size: 12px; font-weight: 650; }
.focus-copy a,
.focus-copy > strong { max-width: 100%; display: flex; align-items: center; gap: 5px; overflow: hidden; color: var(--text-strong); font-size: 16px; font-weight: 750; text-overflow: ellipsis; white-space: nowrap; }
.focus-copy a:hover { color: var(--primary-text); }
.focus-copy p { margin: 5px 0 0; overflow: hidden; color: var(--text-tertiary); font-size: 13px; text-overflow: ellipsis; white-space: nowrap; }
.focus-remaining { border-radius: 999px; padding: 7px 11px; color: var(--neutral-text); background: var(--neutral-container); font-size: 12px; white-space: nowrap; }
.focus-remaining.soon { color: var(--warning-text); background: var(--warning-container); }

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

.metric-grid span { color: var(--text-tertiary); font-size: 12px; white-space: nowrap; }
.metric-grid strong { margin-top: 4px; color: var(--text-strong); font-size: 25px; line-height: 1; }
.metric-grid .soon strong { color: var(--warning-text); }
.metric-grid .overdue strong { color: var(--danger-text); }
.metric-grid .done strong { color: var(--success-text); }

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
  border-bottom: 1px solid var(--line-soft);
}

.panel-heading > div { display: flex; align-items: baseline; gap: 10px; }
.panel-heading h2 { margin: 0; color: var(--text-strong); font-size: 19px; }
.panel-heading span { color: var(--text-tertiary); font-size: 12px; }
.task-search { width: 250px; }

.task-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  padding: 12px 20px;
  border-bottom: 1px solid var(--line-soft);
  background: var(--surface-subtle);
}

.status-tabs { display: flex; gap: 4px; }

.select-filters { display: flex; gap: 8px; }
.filter-select { flex: 0 0 auto; }
.platform-filter { width: 150px; }
.course-filter { width: 196px; }

.desktop-task-list { overflow-x: auto; }
.desktop-task-list table { width: 100%; min-width: 760px; border-collapse: collapse; table-layout: fixed; }
.desktop-task-list .task-col-action { width: 112px; }
.desktop-task-list .task-col-platform { width: 112px; }
.desktop-task-list .task-col-deadline { width: 130px; }
.desktop-task-list .task-col-remaining { width: 172px; }
.desktop-task-list th { height: 42px; padding: 0 12px; color: var(--text-tertiary); background: var(--table-head-bg); font-size: 11px; font-weight: 650; text-align: left; }
.desktop-task-list td { height: 70px; border-top: 1px solid var(--line-soft); padding: 9px 12px; color: var(--text-secondary); font-size: 13px; }
.desktop-task-list tbody tr { transition: background 0.15s ease; }
.desktop-task-list tbody tr:hover { background: var(--surface-hover); }
.desktop-task-list tbody tr.completed { opacity: 0.6; }
.desktop-task-list tbody tr.completed .task-title-cell a,
.desktop-task-list tbody tr.completed .task-title-cell > strong { text-decoration: line-through; }

.task-title-cell { min-width: 0; display: grid; gap: 4px; }
.task-title-cell a,
.task-title-cell > strong { overflow: hidden; color: var(--text-strong); font-size: 14px; font-weight: 700; text-overflow: ellipsis; white-space: nowrap; }
.task-title-cell a:hover { color: var(--primary-text); }
.task-title-cell span { overflow: hidden; color: var(--text-tertiary); font-size: 11px; text-overflow: ellipsis; white-space: nowrap; }

.platform-chip,
.remaining-chip { display: inline-flex; align-items: center; border-radius: 999px; white-space: nowrap; }
.platform-chip { gap: 6px; padding: 6px 9px; color: var(--neutral-text); background: var(--neutral-container); font-size: 11px; font-weight: 650; }
.platform-chip i { width: 7px; height: 7px; border-radius: 50%; background: currentColor; }
.platform-chip.cqupt { color: var(--primary-text); background: var(--primary-soft); }
.platform-chip.chaoxing { color: var(--danger-text); background: var(--danger-container); }
.platform-chip.yuketang { color: var(--success-text); background: var(--success-container); }
.remaining-chip { padding: 6px 9px; color: var(--neutral-text); background: var(--neutral-container); font-size: 11px; font-weight: 700; }
.remaining-chip.soon { color: var(--warning-text); background: var(--warning-container); }
.remaining-chip.overdue { color: var(--danger-text); background: var(--danger-container); }
.remaining-chip.done { color: var(--success-text); background: var(--success-container); }

.deadline-cell { display: grid; gap: 3px; }
.deadline-cell strong { color: var(--text-secondary); font-size: 12px; font-weight: 650; }
.deadline-cell span { color: var(--text-tertiary); font-size: 11px; }

.table-message { height: 285px !important; text-align: center !important; }
.table-message :deep(.n-spin) { margin-right: 8px; vertical-align: middle; }
.empty-table > * { display: block; margin-left: auto; margin-right: auto; }
.empty-table strong { margin-top: 12px; color: var(--text-strong); font-size: 15px; }
.empty-table p { margin-top: 6px; margin-bottom: 14px; color: var(--text-tertiary); font-size: 12px; }
.empty-icon { width: 44px; height: 44px; display: inline-flex !important; align-items: center; justify-content: center; border-radius: 13px; color: var(--primary-text); background: var(--primary-soft); font-size: 23px; }

.mobile-task-list { display: none; }

.panel-footer {
  min-height: 57px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 9px 20px;
  border-top: 1px solid var(--line-soft);
  color: var(--text-tertiary);
  font-size: 12px;
}
.pagination { display: flex; gap: 5px; }

.side-column { display: grid; gap: 18px; }
.side-card { overflow: hidden; padding: 18px; }
.side-card header { display: flex; align-items: flex-start; justify-content: space-between; gap: 12px; }
.side-card header span { display: block; margin-bottom: 3px; color: var(--text-tertiary); font-size: 11px; font-weight: 650; text-transform: uppercase; }
.side-card header h2 { margin: 0; color: var(--text-strong); font-size: 17px; }

.upcoming-list { display: grid; margin-top: 14px; }
.upcoming-list article { position: relative; display: grid; grid-template-columns: 58px minmax(0, 1fr) 5px; align-items: center; gap: 10px; min-height: 62px; border-top: 1px solid var(--line-soft); }
.upcoming-list article:first-child { border-top: 0; }
.upcoming-list time { display: grid; gap: 2px; }
.upcoming-list time strong { color: var(--text-secondary); font-size: 12px; }
.upcoming-list time span { color: var(--text-tertiary); font-size: 10px; }
.upcoming-list article > div { min-width: 0; display: grid; gap: 4px; }
.upcoming-list article > div strong { overflow: hidden; color: var(--text-strong); font-size: 12px; text-overflow: ellipsis; white-space: nowrap; }
.upcoming-list article > div span { overflow: hidden; color: var(--text-tertiary); font-size: 10px; text-overflow: ellipsis; white-space: nowrap; }
.upcoming-list article > i { width: 5px; height: 28px; border-radius: 4px; }
.upcoming-list i.cqupt,
.progress-card li i.cqupt { background: #1769e8; }
.upcoming-list i.chaoxing,
.progress-card li i.chaoxing { background: #d12c43; }
.upcoming-list i.yuketang,
.progress-card li i.yuketang { background: #07968c; }

.side-empty { min-height: 210px; display: flex; flex-direction: column; align-items: center; justify-content: center; color: var(--text-secondary); text-align: center; }
.side-empty :deep(.n-icon) { margin-bottom: 8px; color: var(--success-text); font-size: 32px; }
.side-empty strong { color: var(--text-secondary); font-size: 13px; }
.side-empty span { margin-top: 4px; font-size: 11px; }

.progress-card header > strong { color: var(--primary-text); font-size: 25px; }
.progress-track { height: 8px; overflow: hidden; margin: 18px 0 8px; border-radius: 99px; background: var(--neutral-container); }
.progress-track i { height: 100%; display: block; border-radius: inherit; background: linear-gradient(90deg, #1769e8, #4b91f3); transition: width 0.4s ease; }
.progress-card > p { margin: 0 0 14px; color: var(--text-secondary); font-size: 11px; }
.progress-card ul { display: grid; gap: 10px; margin: 0; border-top: 1px solid var(--line-soft); padding: 14px 0 0; list-style: none; }
.progress-card li { display: grid; grid-template-columns: 8px 1fr auto; align-items: center; gap: 8px; color: var(--text-secondary); font-size: 11px; }
.progress-card li i { width: 7px; height: 7px; border-radius: 50%; }
.progress-card li strong { color: var(--text-secondary); font-size: 10px; font-weight: 600; }
.progress-empty { min-height: 188px; display: flex; flex-direction: column; align-items: center; justify-content: center; color: var(--text-secondary); text-align: center; }
.progress-empty > strong { margin-top: 10px; color: var(--text-secondary); font-size: 13px; }
.progress-empty > p { margin: 5px 0 0; font-size: 11px; }

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
  .filter-select { flex: 1; width: auto; }
  .desktop-task-list table { min-width: 720px; }
}

@media (max-width: 640px) {
  .home-main { width: min(100% - 20px, 1360px); padding: 22px 0 42px; }
  .workspace-heading { flex-direction: column; gap: 18px; }
  .workspace-heading h1 { font-size: 30px; }
  .heading-actions { width: 100%; }
  .heading-actions small { justify-self: center; }
  .overview-grid { gap: 10px; }
  .focus-card { grid-template-columns: auto minmax(0, 1fr); padding: 16px; }
  .focus-remaining { grid-column: 2; justify-self: start; }
  .metric-grid { gap: 8px; }
  .metric-grid article { padding: 13px; }
  .metric-grid strong { font-size: 22px; }
  .workspace-grid,
  .side-column { gap: 12px; }
  .side-column { display: contents; }
  .upcoming-card { order: -1; }
  .upcoming-list { grid-template-columns: 1fr; }
  .upcoming-list article:nth-child(2) { border-top: 1px solid var(--line-soft); }
  .panel-heading { align-items: stretch; flex-direction: column; padding: 16px; }
  .task-search { width: 100%; }
  .task-toolbar { padding: 10px 12px 12px; }
  .select-filters { display: grid; grid-template-columns: 1fr 1fr; }
  .desktop-task-list { display: none; }
  .mobile-task-list { width: 100%; min-width: 0; display: grid; gap: 10px; overflow: hidden; padding: 12px; background: var(--mobile-list-bg); }
  .mobile-task-list article { width: 100%; min-width: 0; max-width: 100%; border: 1px solid var(--line); border-radius: 13px; padding: 14px; background: var(--surface-elevated); }
  .mobile-task-list article > * { min-width: 0; }
  .mobile-task-list article.completed { opacity: 0.6; }
  .mobile-task-head { min-width: 0; display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 8px 10px; margin-bottom: 11px; }
  .mobile-task-head .platform-chip { flex: 0 0 auto; }
  .mobile-task-head .remaining-chip { max-width: 100%; overflow: hidden; text-overflow: ellipsis; }
  .mobile-task-title { display: -webkit-box; overflow: hidden; color: var(--text-strong); font-size: 14px; font-weight: 750; line-height: 1.45; overflow-wrap: anywhere; -webkit-box-orient: vertical; -webkit-line-clamp: 2; }
  .mobile-task-list article > p { margin: 5px 0 13px; color: var(--text-tertiary); font-size: 11px; }
  .mobile-task-list article footer { min-width: 0; display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 9px 12px; border-top: 1px solid var(--line-soft); padding-top: 11px; }
  .mobile-task-list article footer > span { min-width: 0; display: flex; align-items: center; gap: 5px; color: var(--text-tertiary); font-size: 10px; overflow-wrap: anywhere; }
  .mobile-loading,
  .mobile-empty { min-height: 230px; display: flex; flex-direction: column; align-items: center; justify-content: center; color: var(--text-secondary); font-size: 12px; text-align: center; }
  .mobile-loading { flex-direction: row; gap: 8px; }
  .mobile-empty strong { margin-top: 12px; color: var(--text-secondary); font-size: 14px; }
  .mobile-empty p { margin: 6px 0 14px; }
  .panel-footer { padding: 10px 12px; }
}

@media (max-width: 390px) {
  .panel-footer > span { display: none; }
  .pagination { width: 100%; justify-content: center; }
}

.heading-action { width: 100%; }
</style>
