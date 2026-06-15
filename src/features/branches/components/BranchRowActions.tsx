import { PencilIcon } from 'lucide-react'
import { useState } from 'react'

import { Button } from '@/components/ui/button'
import type { Branch } from '@/schemas/branch'

import { EditBranchDialog } from './EditBranchDialog'

type Props = {
  branch: Branch
}

// Per-row edit affordance for a branch (gated by the caller on settings.manage).
export function BranchRowActions({ branch }: Props) {
  const [open, setOpen] = useState(false)
  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        className="size-8"
        aria-label={`Edit ${branch.name}`}
        onClick={() => setOpen(true)}
      >
        <PencilIcon className="size-4" />
      </Button>
      {open ? <EditBranchDialog branch={branch} open={open} onOpenChange={setOpen} /> : null}
    </>
  )
}
