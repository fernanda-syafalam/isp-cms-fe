import { setupWorker } from 'msw/browser'

import { handlers } from './handlers'

// Browser worker used in dev so the mock-first ISP modules render real-looking
// data without a backend. See docs/ADR/0003-isp-modules-mock-first.md.
export const worker = setupWorker(...handlers)
