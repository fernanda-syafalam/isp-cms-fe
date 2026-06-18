import type { ColumnDef } from '@tanstack/react-table'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { DataTable, type DataTableServerState } from './data-table'

type Row = { id: string; name: string }

const columns: ColumnDef<Row>[] = [{ accessorKey: 'name', header: 'Nama' }]
const data: Row[] = [
  { id: '1', name: 'Budi' },
  { id: '2', name: 'Sri' },
]

function makeServer(overrides: Partial<DataTableServerState> = {}): DataTableServerState {
  return {
    pageIndex: 0,
    pageSize: 10,
    rowCount: 25,
    sorting: [],
    search: '',
    onPaginationChange: vi.fn(),
    onSortingChange: vi.fn(),
    onSearchChange: vi.fn(),
    ...overrides,
  }
}

describe('DataTable (server mode)', () => {
  it('derives the page count from the server rowCount, not the page length', () => {
    render(
      <DataTable
        columns={columns}
        data={data}
        isLoading={false}
        isError={false}
        server={makeServer({ rowCount: 25, pageSize: 10 })}
      />,
    )

    // 25 rows / 10 per page = 3 pages, and the total reflects the server count.
    expect(screen.getByText('Hal 1 dari 3')).toBeInTheDocument()
    expect(screen.getByText('25 baris')).toBeInTheDocument()
  })

  it('calls onPaginationChange when paging forward', async () => {
    const user = userEvent.setup()
    const onPaginationChange = vi.fn()
    render(
      <DataTable
        columns={columns}
        data={data}
        isLoading={false}
        isError={false}
        server={makeServer({ onPaginationChange })}
      />,
    )

    await user.click(screen.getByRole('button', { name: 'Halaman berikutnya' }))
    expect(onPaginationChange).toHaveBeenCalledWith({
      pageIndex: 1,
      pageSize: 10,
    })
  })

  it('calls onSearchChange when typing in the search box', async () => {
    const user = userEvent.setup()
    const onSearchChange = vi.fn()
    render(
      <DataTable
        columns={columns}
        data={data}
        isLoading={false}
        isError={false}
        searchPlaceholder="Cari nama…"
        server={makeServer({ onSearchChange })}
      />,
    )

    await user.type(screen.getByPlaceholderText('Cari nama…'), 'b')
    expect(onSearchChange).toHaveBeenCalledWith('b')
  })

  it('does not page past the last server page', () => {
    render(
      <DataTable
        columns={columns}
        data={data}
        isLoading={false}
        isError={false}
        server={makeServer({ pageIndex: 2, rowCount: 25, pageSize: 10 })}
      />,
    )

    expect(screen.getByText('Hal 3 dari 3')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Halaman berikutnya' })).toBeDisabled()
  })
})

describe('DataTable (error & empty states)', () => {
  it('shows an error alert with a retry button wired to onRetry', async () => {
    const user = userEvent.setup()
    const onRetry = vi.fn()
    render(
      <DataTable
        columns={columns}
        data={[]}
        isLoading={false}
        isError
        errorMessage="Gagal memuat data."
        onRetry={onRetry}
        server={makeServer({ rowCount: 0 })}
      />,
    )

    const alert = screen.getByRole('alert')
    expect(alert).toHaveTextContent('Gagal memuat data.')

    await user.click(screen.getByRole('button', { name: 'Coba lagi' }))
    expect(onRetry).toHaveBeenCalledTimes(1)
  })

  it('omits the retry button when onRetry is not provided', () => {
    render(
      <DataTable
        columns={columns}
        data={[]}
        isLoading={false}
        isError
        server={makeServer({ rowCount: 0 })}
      />,
    )

    expect(screen.getByRole('alert')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Coba lagi' })).not.toBeInTheDocument()
  })

  it('shows the empty message when there are no rows and no error', () => {
    render(
      <DataTable
        columns={columns}
        data={[]}
        isLoading={false}
        isError={false}
        emptyMessage="Belum ada data."
        server={makeServer({ rowCount: 0 })}
      />,
    )

    expect(screen.getByText('Belum ada data.')).toBeInTheDocument()
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })
})
