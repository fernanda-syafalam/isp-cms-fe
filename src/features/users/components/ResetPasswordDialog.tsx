import { CheckIcon, CopyIcon } from 'lucide-react'
import { useState } from 'react'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import type { AppUser } from '@/schemas/user'

type Props = {
  user: AppUser
  // The one-time password to reveal, or null when the dialog is closed.
  password: string | null
  onOpenChange: (open: boolean) => void
}

// Reveals the one-time password from an admin reset exactly once. The value
// is never fetched again, so the dialog makes copying it easy before it is
// dismissed.
export function ResetPasswordDialog({ user, password, onOpenChange }: Props) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    if (!password) return
    await navigator.clipboard.writeText(password)
    setCopied(true)
  }

  return (
    <Dialog
      open={password !== null}
      onOpenChange={(open) => {
        if (!open) setCopied(false)
        onOpenChange(open)
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Kata sandi sementara</DialogTitle>
          <DialogDescription>
            Sampaikan kata sandi ini ke {user.fullName}. Kata sandi hanya ditampilkan sekali dan
            tidak dapat dilihat lagi setelah dialog ditutup.
          </DialogDescription>
        </DialogHeader>
        <div className="flex items-center gap-2">
          <code className="flex-1 rounded-md bg-muted px-3 py-2 font-mono text-sm break-all">
            {password}
          </code>
          <Button
            type="button"
            variant="outline"
            size="icon"
            aria-label="Salin kata sandi"
            onClick={handleCopy}
          >
            {copied ? <CheckIcon className="size-4" /> : <CopyIcon className="size-4" />}
          </Button>
        </div>
        <DialogFooter>
          <Button type="button" onClick={() => onOpenChange(false)}>
            Selesai
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
