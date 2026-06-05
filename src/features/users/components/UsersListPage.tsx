import { useState } from 'react'

import { CreateUserDialog } from './CreateUserDialog'
import { UsersTable } from './UsersTable'
import { useUsersList } from '../hooks/useUsers'

const PAGE_SIZE = 10

export function UsersListPage() {
  // Cursor pagination keeps a stack of the cursors we have walked through, so
  // Previous can step back. The first page has no cursor (undefined).
  const [cursors, setCursors] = useState<Array<string | undefined>>([undefined])
  const cursor = cursors[cursors.length - 1]
  const { data, isLoading, isError } = useUsersList({
    cursor,
    limit: PAGE_SIZE,
  })

  const hasPrevious = cursors.length > 1
  const hasNext = data?.nextCursor != null

  const handleNext = () => {
    const next = data?.nextCursor
    if (next != null) setCursors((prev) => [...prev, next])
  }

  const handlePrevious = () => {
    setCursors((prev) => (prev.length > 1 ? prev.slice(0, -1) : prev))
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-bold text-2xl tracking-tight">Staf</h1>
          <p className="mt-1 text-muted-foreground text-sm">Akun staf dan admin internal.</p>
        </div>
        <CreateUserDialog />
      </div>

      <div className="rounded-lg border border-border bg-card p-4">
        <UsersTable
          users={data?.items}
          isLoading={isLoading}
          isError={isError}
          hasPrevious={hasPrevious}
          hasNext={hasNext}
          onPrevious={handlePrevious}
          onNext={handleNext}
        />
      </div>
    </div>
  )
}
