import { MoreHorizontalIcon } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import type { Tenant } from '@/schemas/tenant'
import type { TenantId } from '@/types/ids'

import { TenantStatusBadge } from './TenantStatusBadge'

type Props = {
  tenants: Tenant[] | undefined
  isLoading: boolean
  isError: boolean
  onSuspend: (id: TenantId) => void
}

export function TenantsTable({ tenants, isLoading, isError, onSuspend }: Props) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Email</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="w-12 sr-only">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {isLoading ? <LoadingRows /> : null}
        {isError ? <ErrorRow /> : null}
        {!isLoading && !isError && (!tenants || tenants.length === 0) ? <EmptyRow /> : null}
        {!isLoading && !isError && tenants
          ? tenants.map((tenant) => (
              <TableRow key={tenant.id}>
                <TableCell className="font-medium">{tenant.name}</TableCell>
                <TableCell className="text-muted-foreground">{tenant.email}</TableCell>
                <TableCell>
                  <TenantStatusBadge status={tenant.status} />
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" aria-label="Tenant actions">
                        <MoreHorizontalIcon />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        variant="destructive"
                        disabled={tenant.status === 'suspended'}
                        onSelect={() => onSuspend(tenant.id)}
                      >
                        Suspend
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))
          : null}
      </TableBody>
    </Table>
  )
}

function LoadingRows() {
  return (
    <>
      {Array.from({ length: 3 }).map((_, i) => (
        <TableRow key={i}>
          <TableCell>
            <Skeleton className="h-4 w-32" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-4 w-48" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-5 w-16 rounded-full" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-8 w-8 rounded" />
          </TableCell>
        </TableRow>
      ))}
    </>
  )
}

function ErrorRow() {
  return (
    <TableRow>
      <TableCell colSpan={4} className="text-center text-destructive" role="alert">
        Failed to load tenants. Try refreshing the page.
      </TableCell>
    </TableRow>
  )
}

function EmptyRow() {
  return (
    <TableRow>
      <TableCell colSpan={4} className="text-center text-muted-foreground">
        No tenants match these filters.
      </TableCell>
    </TableRow>
  )
}
