import { describe, expect, it } from 'vitest'

import { AppError, getErrorMessage } from './errors'

describe('getErrorMessage', () => {
  it('returns message for AppError', () => {
    expect(getErrorMessage(new AppError('UNKNOWN', 'boom'))).toBe('boom')
  })

  it('returns message for native Error', () => {
    expect(getErrorMessage(new Error('native'))).toBe('native')
  })

  it('falls back for unknown values', () => {
    expect(getErrorMessage('weird')).toBe('Terjadi kesalahan tak terduga')
  })
})
