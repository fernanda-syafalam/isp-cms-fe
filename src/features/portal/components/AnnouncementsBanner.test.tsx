import { screen, waitFor } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'

import { renderWithProviders } from '@/test/helpers'
import { server } from '@/test/msw/server'

import { AnnouncementsBanner } from './AnnouncementsBanner'

describe('AnnouncementsBanner', () => {
  it('renders an active outage notice from the seed', async () => {
    renderWithProviders(<AnnouncementsBanner />)

    expect(await screen.findByText('Gangguan layanan area Jepara Kota')).toBeInTheDocument()
    const notice = screen.getByText('Gangguan layanan area Jepara Kota').closest('[role="status"]')
    expect(notice).toHaveAttribute('aria-live', 'assertive')
  })

  it('renders nothing when there are no announcements', async () => {
    server.use(http.get('*/api/portal/announcements', () => HttpResponse.json([])))

    const { container } = renderWithProviders(<AnnouncementsBanner />)

    await waitFor(() => expect(screen.queryByRole('status')).toBeNull())
    expect(container).toBeEmptyDOMElement()
  })
})
