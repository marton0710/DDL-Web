const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL ?? '').replace(/\/+$/, '')

type AuthenticationMode = 'auto' | 'none' | 'resource'

interface ApiRequestOptions extends Omit<RequestInit, 'body' | 'credentials'> {
  body?: unknown
  authentication?: AuthenticationMode
}

interface ValidationIssue {
  msg?: string
}

interface FastApiErrorPayload {
  detail?: string | ValidationIssue[]
}

export class ApiError extends Error {
  readonly status: number
  readonly payload: unknown

  constructor(status: number, message: string, payload: unknown) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.payload = payload
  }
}

export class AuthenticationError extends ApiError {
  constructor(error: ApiError) {
    super(error.status, error.message, error.payload)
    this.name = 'AuthenticationError'
  }
}

let sessionRefreshPromise: Promise<void> | null = null

function getPayloadMessage(payload: unknown): string | null {
  if (typeof payload === 'string') return payload.trim() || null
  if (!payload || typeof payload !== 'object') return null

  const detail = (payload as FastApiErrorPayload).detail
  if (typeof detail === 'string') return detail.trim() || null
  if (!Array.isArray(detail)) return null

  const messages = detail
    .map((issue) => issue.msg?.trim())
    .filter((message): message is string => Boolean(message))
  return messages.length ? messages.join('；') : null
}

async function readResponseBody(response: Response): Promise<unknown> {
  if (response.status === 204) return undefined

  const text = await response.text()
  if (!text) return undefined

  const contentType = response.headers.get('content-type') ?? ''
  return contentType.includes('application/json') ? JSON.parse(text) : text
}

async function sendRequest<T>(path: string, options: ApiRequestOptions): Promise<T> {
  const {
    authentication: _authentication,
    body,
    headers: initialHeaders,
    ...requestInit
  } = options
  const headers = new Headers(initialHeaders)

  if (body !== undefined && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json')
  }

  const response = await fetch(`${apiBaseUrl}${path}`, {
    ...requestInit,
    credentials: 'include',
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  })
  const payload = await readResponseBody(response)

  if (!response.ok) {
    throw new ApiError(
      response.status,
      getPayloadMessage(payload) ?? `请求失败（${response.status}）`,
      payload,
    )
  }

  return payload as T
}

function refreshSession(): Promise<void> {
  if (!sessionRefreshPromise) {
    sessionRefreshPromise = sendRequest<void>('/api/auth/refresh', {
      method: 'POST',
      authentication: 'none',
    }).finally(() => {
      sessionRefreshPromise = null
    })
  }
  return sessionRefreshPromise
}

function isRefreshCredentialError(error: unknown): boolean {
  return error instanceof ApiError && [401, 403, 422].includes(error.status)
}

export async function apiRequest<T>(
  path: string,
  options: ApiRequestOptions = {},
): Promise<T> {
  const authentication = options.authentication ?? 'auto'

  try {
    return await sendRequest<T>(path, options)
  } catch (error) {
    if (!(error instanceof ApiError) || error.status !== 401 || authentication === 'none') {
      throw error
    }

    try {
      await refreshSession()
    } catch (refreshError) {
      if (isRefreshCredentialError(refreshError)) throw new AuthenticationError(error)
      throw refreshError
    }

    try {
      return await sendRequest<T>(path, { ...options, authentication: 'none' })
    } catch (retryError) {
      if (
        retryError instanceof ApiError
        && retryError.status === 401
        && authentication === 'auto'
      ) {
        throw new AuthenticationError(retryError)
      }
      throw retryError
    }
  }
}

export function isAuthenticationError(error: unknown): error is AuthenticationError {
  return error instanceof AuthenticationError
}

export function getApiErrorMessage(error: unknown, fallback: string): string {
  return error instanceof ApiError && error.message ? error.message : fallback
}
