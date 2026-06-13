import '@testing-library/jest-dom/vitest'
import { afterAll, afterEach, beforeAll, beforeEach, vi } from 'vitest'

import { resetMockDb } from './msw/handlers'
import { server } from './msw/server'

// jsdom doesn't implement these browser APIs that our component libraries rely
// on (cmdk uses ResizeObserver + scrollIntoView; useIsMobile/Sheet use
// matchMedia). Polyfill them once for every test instead of per file.
if (!('ResizeObserver' in globalThis)) {
  globalThis.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
}
if (!Element.prototype.scrollIntoView) {
  Element.prototype.scrollIntoView = () => {}
}
if (!window.matchMedia) {
  window.matchMedia = (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    addListener: vi.fn(),
    removeListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })
}

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))
// Reset the stateful mock store to its seed before each test for determinism.
beforeEach(() => resetMockDb())
afterEach(() => server.resetHandlers())
afterAll(() => server.close())
