import { renderHook, waitFor } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { listBranches } from '@/api/branches'
import { TestProviders } from '@/test/helpers'

import { useUpdateBranch } from './useBranches'

describe('useUpdateBranch', () => {
  it('renames a branch and can deactivate it', async () => {
    const branches = (await listBranches()).items
    const target = branches.find((b) => !b.isHeadOffice) ?? branches[0]
    if (!target) throw new Error('seed has no branches')

    const { result } = renderHook(() => useUpdateBranch(), {
      wrapper: TestProviders,
    })
    result.current.mutate({
      id: target.id,
      input: { name: 'Cabang Diubah', status: 'inactive' },
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data?.name).toBe('Cabang Diubah')
    expect(result.current.data?.status).toBe('inactive')

    const after = (await listBranches()).items.find((b) => b.id === target.id)
    expect(after?.status).toBe('inactive')
  })
})
