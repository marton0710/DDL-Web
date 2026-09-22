<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { NButton, NIcon, NModal } from 'naive-ui'
import {
  CalendarClearOutline,
  ChevronBackOutline,
  ChevronForwardOutline,
  CloseOutline,
  OpenOutline,
} from '@vicons/ionicons5'
import type { Homework } from '../api/types'
import { getPlatformMeta } from '../domain/platform'
import {
  formatRemaining,
  formatTimelineTime,
  getHomeworkState,
  parseDeadline,
} from '../utils/homework'

interface CalendarDay {
  date: Date
  key: string
  inCurrentMonth: boolean
  isToday: boolean
  homeworks: Homework[]
}

const props = defineProps<{
  show: boolean
  homeworks: Homework[]
  now: number
}>()

const emit = defineEmits<{
  'update:show': [value: boolean]
}>()

const today = computed(() => new Date(props.now))
const viewedMonth = ref(startOfMonth(today.value))
const selectedDateKey = ref(toDateKey(today.value))
const weekdays = ['周一', '周二', '周三', '周四', '周五', '周六', '周日']

const datedHomeworks = computed(() =>
  props.homeworks
    .flatMap((homework) => {
      const deadline = parseDeadline(homework.deadline)
      return deadline ? [{ homework, deadline, timestamp: deadline.getTime(), key: toDateKey(deadline) }] : []
    })
    .sort((left, right) => left.timestamp - right.timestamp),
)

const groupedHomeworks = computed(() => {
  const groups = new Map<string, Homework[]>()
  for (const { homework, key } of datedHomeworks.value) {
    const group = groups.get(key)
    if (group) group.push(homework)
    else groups.set(key, [homework])
  }
  return groups
})

const monthLabel = computed(() =>
  `${viewedMonth.value.getFullYear()}年 ${viewedMonth.value.getMonth() + 1}月`,
)

const calendarDays = computed<CalendarDay[]>(() => {
  const firstDay = startOfMonth(viewedMonth.value)
  const mondayOffset = (firstDay.getDay() + 6) % 7
  const gridStart = new Date(firstDay)
  gridStart.setDate(gridStart.getDate() - mondayOffset)

  const todayKey = toDateKey(today.value)
  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(gridStart)
    date.setDate(gridStart.getDate() + index)
    const key = toDateKey(date)
    return {
      date,
      key,
      inCurrentMonth: date.getMonth() === viewedMonth.value.getMonth(),
      isToday: key === todayKey,
      homeworks: groupedHomeworks.value.get(key) ?? [],
    }
  })
})

const selectedDate = computed(() => calendarDays.value.find((day) => day.key === selectedDateKey.value))
const selectedDateLabel = computed(() => {
  const date = selectedDate.value?.date
  if (!date) return ''
  return new Intl.DateTimeFormat('zh-CN', {
    month: 'long',
    day: 'numeric',
    weekday: 'long',
  }).format(date)
})

watch(() => props.show, (show) => {
  if (!show) return
  const defaultDate = getDefaultDate()
  viewedMonth.value = startOfMonth(defaultDate)
  selectedDateKey.value = toDateKey(defaultDate)
})

function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1)
}

function toDateKey(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function getDefaultDate(): Date {
  const todayKey = toDateKey(today.value)
  const currentMonth = startOfMonth(today.value).getTime()
  const hasCurrentMonthHomework = datedHomeworks.value.some(({ deadline }) => (
    startOfMonth(deadline).getTime() === currentMonth
  ))
  if (hasCurrentMonthHomework) return today.value

  const upcomingHomework = datedHomeworks.value.find(({ homework, key }) => key >= todayKey && !homework.done)
  const lastHomework = datedHomeworks.value[datedHomeworks.value.length - 1]
  return upcomingHomework?.deadline ?? lastHomework?.deadline ?? today.value
}

function changeMonth(offset: number) {
  const nextMonth = new Date(viewedMonth.value.getFullYear(), viewedMonth.value.getMonth() + offset, 1)
  viewedMonth.value = nextMonth
  selectedDateKey.value = toDateKey(nextMonth)
}

function goToToday() {
  viewedMonth.value = startOfMonth(today.value)
  selectedDateKey.value = toDateKey(today.value)
}

function selectDay(day: CalendarDay) {
  selectedDateKey.value = day.key
  if (!day.inCurrentMonth) viewedMonth.value = startOfMonth(day.date)
}
</script>

<template>
  <NModal
    :show="show"
    :auto-focus="false"
    :mask-closable="true"
    @update:show="emit('update:show', $event)"
  >
    <section class="calendar-modal" role="dialog" aria-modal="true" aria-labelledby="calendar-title">
      <header class="calendar-header">
        <div>
          <span class="calendar-kicker"><NIcon><CalendarClearOutline /></NIcon> 作业日历</span>
          <h2 id="calendar-title">{{ monthLabel }}</h2>
        </div>
        <div class="calendar-actions">
          <NButton quaternary circle aria-label="上个月" @click="changeMonth(-1)">
            <template #icon><NIcon><ChevronBackOutline /></NIcon></template>
          </NButton>
          <NButton secondary @click="goToToday">今天</NButton>
          <NButton quaternary circle aria-label="下个月" @click="changeMonth(1)">
            <template #icon><NIcon><ChevronForwardOutline /></NIcon></template>
          </NButton>
          <NButton quaternary circle aria-label="关闭日历" @click="emit('update:show', false)">
            <template #icon><NIcon><CloseOutline /></NIcon></template>
          </NButton>
        </div>
      </header>

      <div class="calendar-scroll">
        <div class="calendar-weekdays" aria-hidden="true">
          <span v-for="weekday in weekdays" :key="weekday">{{ weekday }}</span>
        </div>
        <div class="calendar-grid">
          <div
            v-for="day in calendarDays"
            :key="day.key"
            class="calendar-day"
            :class="{
              muted: !day.inCurrentMonth,
              today: day.isToday,
              selected: day.key === selectedDateKey,
            }"
            role="button"
            tabindex="0"
            :aria-label="`${day.key}，${day.homeworks.length} 项作业`"
            @click="selectDay(day)"
            @keydown.enter.prevent="selectDay(day)"
            @keydown.space.prevent="selectDay(day)"
          >
            <span class="day-number">{{ day.date.getDate() }}</span>
            <div class="day-homeworks">
              <span
                v-for="homework in day.homeworks.slice(0, 2)"
                :key="homework.id ?? `${homework.platform}-${homework.title}`"
                class="day-homework"
                :class="[
                  getPlatformMeta(homework.platform).className,
                  getHomeworkState(homework, now),
                ]"
                :title="homework.title"
              >
                <i aria-hidden="true" />
                <span>{{ formatTimelineTime(homework.deadline) }} {{ homework.title }}</span>
              </span>
              <span
                v-if="day.homeworks.length > 2"
                class="more-homeworks"
                :data-compact-label="`+${day.homeworks.length - 2}`"
              >
                另有 {{ day.homeworks.length - 2 }} 项
              </span>
            </div>
          </div>
        </div>
      </div>

      <section class="selected-day-panel" aria-live="polite">
        <header>
          <div>
            <span>所选日期</span>
            <h3>{{ selectedDateLabel }}</h3>
          </div>
          <b>{{ selectedDate?.homeworks.length ?? 0 }} 项作业</b>
        </header>
        <p v-if="!selectedDate?.homeworks.length" class="selected-day-empty">当天没有截止作业</p>
        <div v-else class="selected-homework-list">
          <article
            v-for="homework in selectedDate.homeworks"
            :key="homework.id ?? `${homework.platform}-${homework.title}`"
            class="selected-homework"
          >
            <span class="platform-dot" :class="`${getPlatformMeta(homework.platform).className}-bg`" />
            <div>
              <a
                v-if="homework.url"
                :href="homework.url"
                target="_blank"
                rel="noopener noreferrer"
                :title="homework.title"
              >
                {{ homework.title }} <NIcon><OpenOutline /></NIcon>
              </a>
              <strong v-else :title="homework.title">{{ homework.title }}</strong>
              <span>{{ formatTimelineTime(homework.deadline) }} · {{ homework.course_name || '未分类课程' }} · {{ homework.platform }}</span>
            </div>
            <em :class="getHomeworkState(homework, now)">{{ formatRemaining(homework, now) }}</em>
          </article>
        </div>
      </section>
    </section>
  </NModal>
</template>

<style scoped>
.calendar-modal {
  width: min(1120px, calc(100vw - 32px));
  max-height: calc(100vh - 40px);
  max-height: calc(100dvh - 40px);
  overflow: hidden;
  color: var(--text-strong);
  border: 1px solid var(--line);
  border-radius: 20px;
  background: var(--surface);
  box-shadow: var(--shadow-modal);
}

.calendar-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
  padding: 22px 24px 18px;
  border-bottom: 1px solid var(--line-soft);
  background: var(--focus-card-bg);
}

.calendar-header h2 {
  margin: 3px 0 2px;
  font-size: 25px;
}

.calendar-kicker {
  display: flex;
  align-items: center;
  gap: 5px;
  color: var(--primary-text);
  font-size: 12px;
  font-weight: 700;
}

.calendar-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.calendar-scroll {
  max-height: calc(100vh - 370px);
  min-height: 330px;
  overflow: auto;
  padding: 14px 20px 0;
}

.calendar-weekdays,
.calendar-grid {
  width: 100%;
  min-width: 0;
  display: grid;
  grid-template-columns: repeat(7, minmax(0, 1fr));
}

.calendar-weekdays span {
  padding: 4px 10px 10px;
  color: var(--text-secondary);
  font-size: 12px;
  font-weight: 600;
  text-align: center;
}

.calendar-grid {
  overflow: hidden;
  border-top: 1px solid var(--line-soft);
  border-left: 1px solid var(--line-soft);
  border-radius: 10px;
}

.calendar-day {
  min-width: 0;
  min-height: 94px;
  padding: 8px;
  border-right: 1px solid var(--line-soft);
  border-bottom: 1px solid var(--line-soft);
  background: var(--surface);
  cursor: pointer;
  transition: background 0.16s ease, box-shadow 0.16s ease;
}

.calendar-day:hover,
.calendar-day:focus-visible {
  z-index: 1;
  outline: none;
  background: var(--primary-soft);
  box-shadow: inset 0 0 0 1px var(--primary-border);
}

.calendar-day.muted {
  color: var(--text-disabled);
  background: var(--surface-subtle);
}

.calendar-day.selected {
  z-index: 1;
  background: var(--primary-soft);
  box-shadow: inset 0 0 0 2px var(--primary-text);
}

.day-number {
  width: 25px;
  height: 25px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  font-size: 12px;
  font-weight: 600;
}

.calendar-day.today .day-number {
  color: #fff;
  background: var(--primary);
}

.day-homeworks {
  display: grid;
  gap: 4px;
  margin-top: 4px;
}

.day-homework {
  overflow: hidden;
  display: block;
  padding: 3px 5px;
  border-left: 3px solid currentColor;
  border-radius: 4px;
  font-size: 10px;
  line-height: 1.35;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.day-homework > i { display: none; }

.day-homework.cqupt { color: var(--primary-text); background: var(--primary-soft); }
.day-homework.chaoxing { color: var(--danger-text); background: var(--danger-container); }
.day-homework.yuketang { color: var(--success-text); background: var(--success-container); }
.day-homework.overdue { color: var(--danger-text); background: var(--danger-container); }
.day-homework.done { color: var(--neutral-text); background: var(--neutral-container); text-decoration: line-through; }

.more-homeworks {
  padding-left: 4px;
  color: var(--text-secondary);
  font-size: 10px;
}

.selected-day-panel {
  max-height: 190px;
  overflow: auto;
  padding: 16px 24px 20px;
  border-top: 1px solid var(--line-soft);
  background: var(--surface-subtle);
}

.selected-day-panel > header {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  margin-bottom: 10px;
}

.selected-day-panel header span {
  color: var(--text-tertiary);
  font-size: 11px;
}

.selected-day-panel h3 {
  margin: 1px 0 0;
  font-size: 16px;
}

.selected-day-panel header b {
  color: var(--primary-text);
  font-size: 12px;
}

.selected-day-empty {
  margin: 14px 0 4px;
  color: var(--text-tertiary);
  font-size: 13px;
  text-align: center;
}

.selected-homework-list {
  display: grid;
  gap: 7px;
}

.selected-homework {
  min-width: 0;
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  align-items: center;
  gap: 9px;
  padding: 7px 10px;
  border: 1px solid var(--line);
  border-radius: 8px;
  background: var(--surface-elevated);
}

.platform-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.cqupt-bg { background: #1478f7; }
.chaoxing-bg { background: #ed2939; }
.yuketang-bg { background: #10aea5; }

.selected-homework div {
  min-width: 0;
  display: grid;
  gap: 2px;
}

.selected-homework a,
.selected-homework strong {
  overflow: hidden;
  color: var(--text-strong);
  font-size: 12px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.selected-homework a:hover {
  color: var(--primary-text);
}

.selected-homework a .n-icon {
  vertical-align: -2px;
}

.selected-homework div span {
  overflow: hidden;
  color: var(--text-tertiary);
  font-size: 10px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.selected-homework em {
  color: var(--text-secondary);
  font-size: 10px;
  font-style: normal;
  white-space: nowrap;
}

.selected-homework em.soon { color: var(--warning-text); }
.selected-homework em.overdue { color: var(--danger-text); }
.selected-homework em.done { color: var(--success-text); }

@media (max-width: 680px) {
  .calendar-modal {
    width: calc(100vw - 16px);
    max-height: calc(100vh - 16px);
    max-height: calc(100dvh - 16px);
    border-radius: 14px;
  }

  .calendar-header {
    align-items: flex-start;
    flex-wrap: wrap;
    gap: 10px 14px;
    padding: 16px;
  }

  .calendar-header > div:first-child { min-width: 0; }

  .calendar-header h2 {
    font-size: 20px;
  }

  .calendar-actions {
    flex: 0 0 auto;
    margin-left: auto;
    gap: 4px;
  }

  .calendar-scroll {
    max-height: calc(100vh - 330px);
    max-height: calc(100dvh - 330px);
    min-height: 0;
    overflow-x: hidden;
    padding: 10px 8px 0;
  }

  .calendar-weekdays span {
    min-width: 0;
    padding: 4px 0 8px;
    font-size: 10px;
  }

  .calendar-day {
    min-height: clamp(46px, 12vw, 62px);
    overflow: hidden;
    padding: 4px;
  }

  .day-number {
    width: 22px;
    height: 22px;
    font-size: 10px;
  }

  .day-homeworks {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 3px;
    margin: 3px 1px 0;
  }

  .day-homework {
    width: 6px;
    height: 6px;
    flex: 0 0 6px;
    padding: 0;
    border: 0;
    border-radius: 50%;
    background: transparent;
  }

  .day-homework > i {
    width: 100%;
    height: 100%;
    display: block;
    border-radius: inherit;
    background: currentColor;
  }

  .day-homework > span {
    display: none;
  }

  .more-homeworks {
    padding: 0;
    font-size: 0;
  }

  .more-homeworks::after {
    content: attr(data-compact-label);
    font-size: 8px;
  }

  .selected-day-panel {
    max-height: 180px;
    padding: 12px 14px 16px;
  }

  .selected-homework {
    grid-template-columns: auto minmax(0, 1fr);
  }

  .selected-homework em {
    grid-column: 2;
    justify-self: start;
    white-space: normal;
  }
}
</style>
