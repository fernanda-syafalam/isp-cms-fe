import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { DropdownMenuItem } from '@/components/ui/dropdown-menu'

import { RowActions } from './row-actions'

describe('RowActions', () => {
  it('opens the menu from the icon trigger and runs an item action', async () => {
    const user = userEvent.setup()
    const onSelect = vi.fn()
    render(
      <RowActions>
        <DropdownMenuItem onSelect={onSelect}>Edit</DropdownMenuItem>
      </RowActions>,
    )

    await user.click(screen.getByRole('button', { name: 'Aksi baris' }))
    await user.click(await screen.findByRole('menuitem', { name: 'Edit' }))
    expect(onSelect).toHaveBeenCalledTimes(1)
  })

  it('uses a custom accessible label for the trigger', () => {
    render(
      <RowActions label="Aksi pelanggan">
        <DropdownMenuItem>Edit</DropdownMenuItem>
      </RowActions>,
    )

    expect(screen.getByRole('button', { name: 'Aksi pelanggan' })).toBeInTheDocument()
  })

  it('disables the trigger when there are no available actions', () => {
    render(
      <RowActions disabled>
        <DropdownMenuItem>Edit</DropdownMenuItem>
      </RowActions>,
    )

    expect(screen.getByRole('button', { name: 'Aksi baris' })).toBeDisabled()
  })
})
