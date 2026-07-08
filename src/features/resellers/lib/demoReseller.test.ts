import { afterEach, describe, expect, it, vi } from 'vitest'

import { DEV_DEMO_RESELLER_ID, resolveMitraResellerId } from './demoReseller'

afterEach(() => {
  vi.unstubAllEnvs()
})

describe('resolveMitraResellerId', () => {
  it("uses the mitra's own linked resellerId when present", () => {
    vi.stubEnv('DEV', true)
    expect(resolveMitraResellerId('mitra', 'real-reseller-id')).toBe('real-reseller-id')
  })

  it('falls back to the first seeded storefront for a dev-switched, unlinked mitra', () => {
    // The demo role switcher leaves resellerId null; the dev fallback keeps the
    // mitra home from dead-ending on "belum tertaut".
    vi.stubEnv('DEV', true)
    expect(resolveMitraResellerId('mitra', null)).toBe(DEV_DEMO_RESELLER_ID)
    expect(resolveMitraResellerId('mitra', undefined)).toBe(DEV_DEMO_RESELLER_ID)
  })

  it('never fabricates a reseller in a production build (guard preserved)', () => {
    vi.stubEnv('DEV', false)
    expect(resolveMitraResellerId('mitra', null)).toBeNull()
  })

  it('does not apply the fallback to non-mitra roles', () => {
    vi.stubEnv('DEV', true)
    expect(resolveMitraResellerId('admin', null)).toBeNull()
    expect(resolveMitraResellerId('customer', null)).toBeNull()
  })
})
