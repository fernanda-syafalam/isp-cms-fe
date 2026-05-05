import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { HttpResponse, http } from 'msw'

import { useAuthStore } from '@/features/auth/store/authStore'
import { server } from '@/test/msw/server'
import { resetAuthStore } from '@/test/helpers'

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
            name: 'Test Admin',
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
})
