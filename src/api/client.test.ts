import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { HttpResponse, http } from 'msw'

import { useAuthStore } from '@/features/auth/store/authStore'
import { server } from '@/test/msw/server'
import { resetAuthStore } from '@/test/helpers'

import { AppError, getErrorMessage, getFieldErrors } from '@/lib/errors'

import { api } from './client'

beforeEach(() => {
  resetAuthStore()
})

afterEach(() => {
  resetAuthStore()
})

describe('api client', () => {
  it('attaches the access token from the store as a Bearer header', async () => {
    useAuthStore.setState({ accessToken: 'live-token' })
    let observed: string | null = null
    server.use(
      http.get('*/api/probe', ({ request }) => {
        observed = request.headers.get('Authorization')
        return HttpResponse.json({ ok: true })
      }),
    )

    await api.get('probe').json()

    expect(observed).toBe('Bearer live-token')
  })

  it('refreshes once when several concurrent requests get 401', async () => {
    useAuthStore.setState({ accessToken: 'stale' })

    let refreshCallCount = 0
    let probeCallCount = 0
    const seenTokens: Array<string | null> = []

    server.use(
      http.get('*/api/probe', ({ request }) => {
        probeCallCount++
        const auth = request.headers.get('Authorization')
        seenTokens.push(auth)
        if (auth === 'Bearer stale') {
          return HttpResponse.json({ message: 'unauthorized' }, { status: 401 })
        }
        return HttpResponse.json({ ok: true })
      }),
      http.post('*/api/auth/refresh', () => {
        refreshCallCount++
        return HttpResponse.json({
          accessToken: 'fresh-token',
          user: {
            id: '99999999-9999-4999-8999-999999999999',
            email: 'admin@example.com',
            fullName: 'Test Admin',
            role: 'admin',
          },
        })
      }),
    )

    // Fire three concurrent requests that all hit 401 first.
    const responses = await Promise.all([
      api.get('probe').json(),
      api.get('probe').json(),
      api.get('probe').json(),
    ])

    expect(responses).toEqual([{ ok: true }, { ok: true }, { ok: true }])
    expect(refreshCallCount).toBe(1)
    expect(useAuthStore.getState().accessToken).toBe('fresh-token')
    // Three initial 401s + three replays with the fresh token.
    expect(probeCallCount).toBe(6)
    expect(seenTokens.filter((t) => t === 'Bearer fresh-token')).toHaveLength(3)
  })

  it('clears the store when refresh itself fails', async () => {
    useAuthStore.setState({ accessToken: 'stale' })
    server.use(
      http.get('*/api/probe', () => HttpResponse.json({}, { status: 401 })),
      http.post('*/api/auth/refresh', () => HttpResponse.json({}, { status: 401 })),
    )

    const response = await api.get('probe').then(
      (r) => r,
      (err: unknown) => err,
    )

    // Either the original 401 is returned or AppError is thrown — both are
    // acceptable. The non-negotiable invariant is that the store is cleared.
    expect(useAuthStore.getState().accessToken).toBeNull()
    expect(response).toBeDefined()
  })

  describe('error normalization', () => {
    async function failWith(status: number, body: Record<string, unknown>): Promise<unknown> {
      server.use(http.post('*/api/probe', () => HttpResponse.json(body, { status })))
      try {
        await api.post('probe').json()
      } catch (err) {
        return err
      }
      throw new Error('expected request to fail')
    }

    it('uses problem+json detail as the error message', async () => {
      const err = await failWith(400, {
        title: 'Bad Request',
        detail: 'Email sudah dipakai',
        status: 400,
      })
      expect(getErrorMessage(err)).toBe('Email sudah dipakai')
    })

    it('falls back to title when detail is absent', async () => {
      const err = await failWith(403, { title: 'Forbidden', status: 403 })
      expect(getErrorMessage(err)).toBe('Forbidden')
    })

    it('falls back to legacy message bodies', async () => {
      const err = await failWith(500, { message: 'legacy boom' })
      expect(getErrorMessage(err)).toBe('legacy boom')
    })

    it('keeps code and status on the cause', async () => {
      const err = await failWith(409, { title: 'Conflict', code: 'totp_required' })
      expect(err).toBeInstanceOf(AppError)
      expect(err instanceof AppError && err.cause).toMatchObject({
        status: 409,
        code: 'totp_required',
      })
    })

    it('normalizes a Zod issues array into fieldErrors keyed by dotted path', async () => {
      const err = await failWith(400, {
        title: 'Bad Request',
        errors: [
          { path: ['email'], message: 'Email tidak valid', code: 'invalid_format' },
          { path: ['items', 0, 'qty'], message: 'Harus positif', code: 'too_small' },
          { path: ['email'], message: 'Wajib', code: 'custom' },
        ],
      })
      expect(getFieldErrors(err)).toEqual({
        email: ['Email tidak valid', 'Wajib'],
        'items.0.qty': ['Harus positif'],
      })
    })

    it('normalizes a flattened ZodError into fieldErrors', async () => {
      const err = await failWith(400, {
        title: 'Bad Request',
        errors: { formErrors: ['x'], fieldErrors: { password: ['Terlalu pendek'] } },
      })
      expect(getFieldErrors(err)).toEqual({ password: ['Terlalu pendek'] })
    })
  })
})
