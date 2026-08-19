import type { Homework } from '../api/types'

export type HomeworkState = 'done' | 'overdue' | 'soon' | 'pending'

const dateTimeFormatter = new Intl.DateTimeFormat('zh-CN', {
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
})

const timeFormatter = new Intl.DateTimeFormat('zh-CN', {
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
})

const dateFormatter = new Intl.DateTimeFormat('zh-CN', {
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
})

export function parseDeadline(deadline: string | null): Date | null {
  if (!deadline) return null
  const date = new Date(deadline)
  return Number.isNaN(date.getTime()) ? null : date
}

export function getHomeworkState(homework: Homework, now = Date.now()): HomeworkState {
  if (homework.done) return 'done'
  const deadline = parseDeadline(homework.deadline)
  if (!deadline) return 'pending'

  const remaining = deadline.getTime() - now
  if (remaining < 0) return 'overdue'
  if (remaining <= 24 * 60 * 60 * 1000) return 'soon'
  return 'pending'
}

export function formatDeadlineDate(deadline: string | null): string {
  const date = parseDeadline(deadline)
  return date ? dateFormatter.format(date).replace(/\//g, '-') : '无截止日期'
}

function formatDuration(milliseconds: number): string {
  const totalMinutes = Math.max(1, Math.floor(milliseconds / 60_000))
  const days = Math.floor(totalMinutes / 1_440)
  const hours = Math.floor((totalMinutes % 1_440) / 60)
  const minutes = totalMinutes % 60

  if (days > 0) return `${days} 天${hours > 0 ? ` ${hours} 小时` : ''}`
  if (hours > 0) return `${hours} 小时${minutes > 0 ? ` ${minutes} 分` : ''}`
  return `${minutes} 分`
}

export function formatRemaining(homework: Homework, now = Date.now()): string {
  if (homework.done) return '已完成'
  const deadline = parseDeadline(homework.deadline)
  if (!deadline) return '未设置'

  const remaining = deadline.getTime() - now
  return remaining < 0
    ? `已逾期 ${formatDuration(Math.abs(remaining))}`
    : formatDuration(remaining)
}

export function formatTimelineDate(deadline: string | null): string {
  const date = parseDeadline(deadline)
  return date ? `${date.getMonth() + 1}/${date.getDate()}` : '--/--'
}

export function formatTimelineTime(deadline: string | null): string {
  const date = parseDeadline(deadline)
  return date ? timeFormatter.format(date) : '--:--'
}

export function formatUpdatedAt(value: string | null): string {
  if (!value) return '尚未同步'
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? '时间未知' : dateTimeFormatter.format(date)
}

export function isInCurrentWeek(homework: Homework, now = new Date()): boolean {
  const deadline = parseDeadline(homework.deadline)
  if (!deadline) return false

  const start = new Date(now)
  const weekday = start.getDay() || 7
  start.setDate(start.getDate() - weekday + 1)
  start.setHours(0, 0, 0, 0)

  const end = new Date(start)
  end.setDate(end.getDate() + 7)
  return deadline >= start && deadline < end
}
