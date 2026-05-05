import type { HTTPError } from 'ky';
import ky from 'ky'

import { useAuthStore } from '@/features/auth/store/authStore'
import { AppError } from '@/lib/errors'
import { SessionSchema } from '@/schemas/auth'

const baseURL = import.meta.env['VITE_API_BASE_URL'] ?? '/api'

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
        try {
          const body = (await response.json()) as { message?: string }
          if (body?.message) message = body.message
        } catch {
          // body is not JSON — keep default message
        }
        throw new AppError('HTTP_ERROR', message, error)
      },
    ],
  },
})
