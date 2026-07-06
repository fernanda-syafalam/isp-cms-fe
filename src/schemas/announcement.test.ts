import { describe, expect, it } from 'vitest'

import { AnnouncementSchema } from './announcement'

const base = {
  id: '00000000-0000-4000-8000-0000000000a1',
  title: 'Gangguan layanan',
  body: 'Sedang terjadi gangguan.',
  severity: 'outage',
  active: true,
  startsAt: '2026-07-06T02:00:00.000Z',
  endsAt: null,
  createdAt: '2026-07-06T02:00:00.000Z',
}

describe('AnnouncementSchema', () => {
  it('parses an outage announcement', () => {
    const parsed = AnnouncementSchema.parse(base)
    expect(parsed.severity).toBe('outage')
    expect(parsed.endsAt).toBeNull()
  })

  it('rejects an unknown severity', () => {
    const result = AnnouncementSchema.safeParse({
      ...base,
      severity: 'critical',
    })
    expect(result.success).toBe(false)
  })

  it('rejects a non-uuid id', () => {
    const result = AnnouncementSchema.safeParse({ ...base, id: 'not-a-uuid' })
    expect(result.success).toBe(false)
  })
})
