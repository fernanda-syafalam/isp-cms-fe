import { ArchiveIcon, MoreHorizontalIcon, PencilIcon } from 'lucide-react'
import { useState } from 'react'

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useCan } from '@/features/auth'
import type { Plan } from '@/schemas/plan'

import { useArchivePlan } from '../hooks/usePlans'
import { EditPlanDialog } from './EditPlanDialog'

export function PlanRowActions({ plan }: { plan: Plan }) {
  const [editOpen, setEditOpen] = useState(false)
  const [archiveOpen, setArchiveOpen] = useState(false)
  const canManage = useCan('plans.manage')
  const archive = useArchivePlan()

  if (!canManage) return null
  const canArchive = plan.status !== 'archived'

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="size-8" aria-label="Aksi baris">
            <MoreHorizontalIcon className="size-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-40">
          <DropdownMenuItem onSelect={() => setEditOpen(true)}>
            <PencilIcon className="size-4" />
            Edit
          </DropdownMenuItem>
          {canArchive ? (
            <DropdownMenuItem
              onSelect={() => setArchiveOpen(true)}
              className="text-destructive focus:text-destructive"
            >
              <ArchiveIcon className="size-4" />
              Arsipkan
            </DropdownMenuItem>
          ) : null}
        </DropdownMenuContent>
      </DropdownMenu>

      <EditPlanDialog plan={plan} open={editOpen} onOpenChange={setEditOpen} />

      <AlertDialog open={archiveOpen} onOpenChange={setArchiveOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Arsipkan paket?</AlertDialogTitle>
            <AlertDialogDescription>
              Paket "{plan.name}" akan diarsipkan dan tidak ditawarkan untuk pelanggan baru.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={() => archive.mutate(plan.id)}>
              Arsipkan
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
