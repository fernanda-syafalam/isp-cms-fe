import type { HTTPError } from 'ky'
import ky from 'ky'

import { useAuthStore } from '@/features/auth/store/authStore'
import { AppError, normalizeFieldErrors } from '@/lib/errors'
import { SessionSchema } from '@/schemas/auth'

const baseURL = import.meta.env.VITE_API_BASE_URL ?? '/api'

// Single-flight refresh: many concurrent 401s share one /auth/refresh call.
let refreshPromise: Promise<string | null> | null = null

async function refreshAccessToken(): Promise<string | null> {
  if (refreshPromise) return refreshPromise

  refreshPromise = (async () => {
    try {
      const json = await ky
        .post(`${baseURL}/auth/refresh`, { credentials: 'include', retry: 0 })
        .json()
      const session = SessionSchema.parse(json)
      useAuthStore.getState().setSession(session)
      return session.accessToken
    } catch {
      useAuthStore.getState().clear()
      return null
    } finally {
      refreshPromise = null
    }
  })()

  return refreshPromise
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

// RFC 7807 `detail` first, then `title`; `message` covers legacy/mock bodies.
function pickMessage(body: Record<string, unknown>): string | undefined {
  for (const candidate of [body.detail, body.title, body.message]) {
    if (typeof candidate === 'string' && candidate !== '') return candidate
  }
  return undefined
}

export const api = ky.create({
  prefixUrl: baseURL,
  timeout: 15_000,
  retry: { limit: 1, methods: ['get'] },
  hooks: {
    beforeRequest: [
      (request) => {
        const token = useAuthStore.getState().accessToken
        if (token) request.headers.set('Authorization', `Bearer ${token}`)
      },
    ],
    afterResponse: [
      async (request, _options, response) => {
        const url = request.url
        const isAuthEndpoint = url.includes('/auth/refresh') || url.includes('/auth/login')
        if (response.status !== 401 || isAuthEndpoint) return response

        const newToken = await refreshAccessToken()
        if (!newToken) return response

        request.headers.set('Authorization', `Bearer ${newToken}`)
        return ky(request)
      },
    ],
    beforeError: [
      async (error: HTTPError) => {
        const { response } = error
        let message = error.message
        let cause: unknown = error
        try {
          const parsed: unknown = await response.json()
          if (isRecord(parsed)) {
            message = pickMessage(parsed) ?? message
            cause = {
              ...parsed,
              status: response.status,
              fieldErrors: normalizeFieldErrors(parsed.errors),
            }
          } else {
            cause = parsed
          }
        } catch {
          // body is not JSON — keep default message and the original error as cause
        }
        // Cause carries the problem+json body plus normalized `fieldErrors`
        // so callers can map them onto a form.
        throw new AppError('HTTP_ERROR', message, cause)
      },
    ],
  },
})
