import '@testing-library/jest-dom/vitest'
import { vi } from 'vitest'

// Base setup applied to every DOM (jsdom) test: jest-dom matchers and the
// browser-API polyfills our component libraries rely on. It intentionally does
// NOT start MSW — pure-logic tests (schemas, lib, topology/lib) run in the
// `node` project with no setup, and only the `app` project layers the MSW
// lifecycle on top of this file (see vite.config.ts `test.projects`).

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
