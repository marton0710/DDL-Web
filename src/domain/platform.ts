import type { PlatformName } from '../api/types'

export interface PlatformMeta {
  name: PlatformName
  className: 'cqupt' | 'chaoxing' | 'yuketang'
  mark: '邮' | '学' | '雨'
  color: string
}

export const PLATFORM_META: readonly PlatformMeta[] = [
  { name: '学在重邮', className: 'cqupt', mark: '邮', color: '#1478f7' },
  { name: '学习通', className: 'chaoxing', mark: '学', color: '#ed2939' },
  { name: '雨课堂', className: 'yuketang', mark: '雨', color: '#10aea5' },
]

export function getPlatformMeta(name: PlatformName): PlatformMeta {
  return PLATFORM_META.find((item) => item.name === name) ?? PLATFORM_META[0]
}
