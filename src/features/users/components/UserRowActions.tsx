import { PencilIcon } from 'lucide-react'
import { useState } from 'react'

import { Button } from '@/components/ui/button'
import type { AppUser } from '@/schemas/user'

import { EditUserDialog } from './EditUserDialog'

type Props = {
  user: AppUser
}

// Per-row edit affordance for a staff account (gated by the caller on
// staff.manage). Owns its own dialog state.
export function UserRowActions({ user }: Props) {
  const [open, setOpen] = useState(false)
  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        className="size-8"
        aria-label={`Edit ${user.fullName}`}
        onClick={() => setOpen(true)}
      >
        <PencilIcon className="size-4" />
      </Button>
      {open ? <EditUserDialog user={user} open={open} onOpenChange={setOpen} /> : null}
    </>
  )
}
