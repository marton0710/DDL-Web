export type PlatformName = '学在重邮' | '学习通' | '雨课堂'
export type PlatformAuthMethod = 'cqupt_ids' | 'password'

export interface LoginInput {
  username: string
  password: string
}

export interface LoginResult {
  name: string
}

export type QqPushStrategy = 'scheduled' | 'realtime'

export interface QqPushConfig {
  qqchan_id: string | null
  qq_push_strategy: QqPushStrategy
  qq_push_at: string
  qq_push_scope: number
}

export interface MeetScheduleConfig {
  meetschedule_key: string | null
}

export interface CurrentUser {
  name: string
  qqpush_config: QqPushConfig
  meetschedule_config: MeetScheduleConfig
}

export interface Homework {
  id: string | null
  course_name: string
  title: string
  deadline: string | null
  url: string | null
  platform: PlatformName
  done: boolean
}

export interface HomeworkResponse {
  count: number
  last_refresh_time: string | null
  homeworks: Homework[]
}

export type PlatformCredentials = {
  username: string
  password: string
} | Record<string, never>
