import { useState } from 'react'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'

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
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Users</CardTitle>
        <CreateUserDialog />
      </CardHeader>
      <Separator />
      <CardContent className="space-y-4 pt-6">
        <UsersTable
          users={data?.items}
          isLoading={isLoading}
          isError={isError}
          hasPrevious={hasPrevious}
          hasNext={hasNext}
          onPrevious={handlePrevious}
          onNext={handleNext}
        />
      </CardContent>
    </Card>
  )
}
