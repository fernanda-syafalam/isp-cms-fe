import { describe, expect, it } from 'vitest'

import { safeInternalPath } from './safeRedirect'

describe('safeInternalPath', () => {
  it('honors an internal path', () => {
    expect(safeInternalPath('/customers')).toBe('/customers')
  })

  it('rejects a protocol-relative URL', () => {
    expect(safeInternalPath('//evil.com')).toBe('/')
  })

  it('rejects an absolute URL', () => {
    expect(safeInternalPath('http://evil')).toBe('/')
    expect(safeInternalPath('https://evil.com/path')).toBe('/')
  })

  it('falls back to / for missing or non-path values', () => {
    expect(safeInternalPath(undefined)).toBe('/')
    expect(safeInternalPath(null)).toBe('/')
    expect(safeInternalPath('')).toBe('/')
    expect(safeInternalPath('customers')).toBe('/')
  })
})
