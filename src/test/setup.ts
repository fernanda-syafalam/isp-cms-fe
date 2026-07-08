import { afterAll, afterEach, beforeAll, beforeEach } from 'vitest'

import { resetMockDb } from './msw/handlers'
import { server } from './msw/server'

// MSW lifecycle for the `app` test project only. Pure-logic tests run in a
// separate `node` project that never imports this file, so they no longer pay
// the mega-handler import + server.listen + per-test seed-clone cost (this was
// the root cause of the collect/setup timeouts seen under machine load). The
// jest-dom + browser polyfills live in ./setup.base.ts, which the `app`
// project loads before this file.

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))
// Reset the stateful mock store to its seed before each test for determinism.
beforeEach(() => resetMockDb())
afterEach(() => server.resetHandlers())
afterAll(() => server.close())
