export const PLATFORM_NAMES = ['学在重邮', '学习通', '雨课堂'] as const

export type PlatformName = (typeof PLATFORM_NAMES)[number]
export type PlatformAuthMethod = 'cqupt_ids' | 'password'

export interface LoginInput {
  username: string
  password: string
}

export interface LoginResult {
  name: string
}

export interface CurrentUser {
  name: string
  email: string | null
  qqchan_id: string | null
  meetschedule_key: string | null
}

export interface UserInfoPatch {
  email?: string | null
  qqchan_id?: string | null
  meetschedule_key?: string | null
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

export interface HomeworkQuery {
  num?: number
  page?: number
  platform?: PlatformName
}

export interface PasswordCredentials {
  username: string
  password: string
}

export type PlatformCredentials = PasswordCredentials | Record<string, never>
