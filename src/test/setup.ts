import '@testing-library/jest-dom/vitest'
import { afterAll, afterEach, beforeAll, beforeEach } from 'vitest'

import { resetMockDb } from './msw/handlers'
import { server } from './msw/server'

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))
// Reset the stateful mock store to its seed before each test for determinism.
beforeEach(() => resetMockDb())
afterEach(() => server.resetHandlers())
afterAll(() => server.close())
