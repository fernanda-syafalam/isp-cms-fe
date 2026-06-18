import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { PlusIcon } from 'lucide-react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { Button } from '@/components/ui/button'
import { renderWithProviders } from '@/test/helpers'

import { PageHeader } from './page-header'

// HeaderActions branches on viewport; mock the hook so both layouts are testable.
const useIsMobile = vi.fn(() => false)
vi.mock('@/hooks/use-mobile', () => ({
  useIsMobile: () => useIsMobile(),
}))

describe('PageHeader', () => {
  beforeEach(() => {
    useIsMobile.mockReturnValue(false)
  })
  afterEach(() => {
    vi.clearAllMocks()
  })

  it('renders the title, breadcrumb, meta, and description', () => {
    renderWithProviders(
      <PageHeader
        title="Pelanggan"
        breadcrumb={<span>Operasional</span>}
        meta={<span>Aktif</span>}
        description="Daftar pelanggan."
      />,
    )

    expect(screen.getByRole('heading', { name: 'Pelanggan' })).toBeInTheDocument()
    expect(screen.getByText('Operasional')).toBeInTheDocument()
    expect(screen.getByText('Aktif')).toBeInTheDocument()
    expect(screen.getByText('Daftar pelanggan.')).toBeInTheDocument()
  })

  it('still renders the deprecated actions escape hatch', () => {
    renderWithProviders(<PageHeader title="Pengaturan" actions={<Button>Simpan</Button>} />)

    expect(screen.getByRole('button', { name: 'Simpan' })).toBeInTheDocument()
  })

  it('keeps up to two secondary actions inline on desktop', () => {
    renderWithProviders(
      <PageHeader title="Tagihan" secondaryActions={[{ label: 'Ekspor' }, { label: 'Cetak' }]} />,
    )

    expect(screen.getByRole('button', { name: 'Ekspor' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Cetak' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Lainnya' })).not.toBeInTheDocument()
  })

  it('collapses extra secondary actions into a "Lainnya" menu on desktop', async () => {
    const onArchive = vi.fn()
    renderWithProviders(
      <PageHeader
        title="Tagihan"
        secondaryActions={[
          { label: 'Ekspor' },
          { label: 'Cetak' },
          { label: 'Arsipkan', onClick: onArchive },
        ]}
      />,
    )

    expect(screen.getByRole('button', { name: 'Ekspor' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Arsipkan' })).not.toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: 'Lainnya' }))
    const item = await screen.findByRole('menuitem', { name: 'Arsipkan' })
    await userEvent.click(item)

    expect(onArchive).toHaveBeenCalledTimes(1)
  })

  it('collapses every secondary action into an "Aksi" menu on mobile', async () => {
    useIsMobile.mockReturnValue(true)
    renderWithProviders(
      <PageHeader title="Tagihan" secondaryActions={[{ label: 'Ekspor' }, { label: 'Cetak' }]} />,
    )

    expect(screen.queryByRole('button', { name: 'Ekspor' })).not.toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Aksi' }))
    expect(await screen.findByRole('menuitem', { name: 'Ekspor' })).toBeInTheDocument()
    expect(screen.getByRole('menuitem', { name: 'Cetak' })).toBeInTheDocument()
  })

  it('renders the primary action inline on desktop', () => {
    renderWithProviders(
      <PageHeader
        title="Prospek"
        primaryAction={
          <Button>
            <PlusIcon className="size-4" />
            Prospek baru
          </Button>
        }
        stickyOnMobile
      />,
    )

    expect(screen.getByRole('button', { name: /Prospek baru/ })).toBeInTheDocument()
  })

  it('still renders the primary action when floated as a mobile FAB', () => {
    useIsMobile.mockReturnValue(true)
    renderWithProviders(
      <PageHeader title="Prospek" primaryAction={<Button>Prospek baru</Button>} stickyOnMobile />,
    )

    expect(screen.getByRole('button', { name: 'Prospek baru' })).toBeInTheDocument()
  })
})
