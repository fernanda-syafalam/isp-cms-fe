import { KeyRoundIcon, MoreHorizontalIcon, PencilIcon, UserXIcon } from 'lucide-react'
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
import type { AppUser } from '@/schemas/user'

import { useDeactivateUser, useResetUserPassword } from '../hooks/useUsers'
import { EditUserDialog } from './EditUserDialog'
import { ResetPasswordDialog } from './ResetPasswordDialog'

type Props = {
  user: AppUser
}

// Per-row account actions for a user record (gated by the caller on
// staff.manage): edit, reset password (shows the one-time password once),
// and deactivate (soft-delete). Owns its own dialog/menu state.
export function UserRowActions({ user }: Props) {
  const [editOpen, setEditOpen] = useState(false)
  const [deactivateOpen, setDeactivateOpen] = useState(false)
  const [resetPassword, setResetPassword] = useState<string | null>(null)

  const reset = useResetUserPassword()
  const deactivate = useDeactivateUser()

  const handleReset = async () => {
    const result = await reset.mutateAsync(user.id)
    setResetPassword(result.initialPassword)
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="size-8"
            aria-label={`Aksi untuk ${user.fullName}`}
          >
            <MoreHorizontalIcon className="size-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onSelect={() => setEditOpen(true)}>
            <PencilIcon className="size-4" />
            Edit
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={handleReset} disabled={reset.isPending}>
            <KeyRoundIcon className="size-4" />
            Reset kata sandi
          </DropdownMenuItem>
          <DropdownMenuItem variant="destructive" onSelect={() => setDeactivateOpen(true)}>
            <UserXIcon className="size-4" />
            Nonaktifkan
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {editOpen ? <EditUserDialog user={user} open={editOpen} onOpenChange={setEditOpen} /> : null}

      <ResetPasswordDialog
        user={user}
        password={resetPassword}
        onOpenChange={(open) => {
          if (!open) setResetPassword(null)
        }}
      />

      <AlertDialog open={deactivateOpen} onOpenChange={setDeactivateOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Nonaktifkan akun?</AlertDialogTitle>
            <AlertDialogDescription>
              Akun {user.fullName} tidak akan bisa masuk lagi. Tindakan ini dapat dipulihkan oleh
              admin melalui basis data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deactivate.mutate(user.id)}
              disabled={deactivate.isPending}
            >
              Nonaktifkan
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
