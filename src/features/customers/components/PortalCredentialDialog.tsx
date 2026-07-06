import { CopyIcon, KeyRoundIcon } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

type PortalLogin = { email: string; initialPassword: string }

type Props = {
  portalLogin: PortalLogin | null
  onContinue: () => void
}

// One-time credential reveal shown right after onboarding provisions a portal
// login. The initial password is returned by the backend only ONCE, so staff
// must copy it here and hand it to the subscriber. Closing the dialog continues
// to the customer detail — the password is gone after that.
export function PortalCredentialDialog({ portalLogin, onContinue }: Props) {
  const handleCopy = () => {
    if (!portalLogin) return
    if (!navigator.clipboard) {
      toast.error('Penyalinan tidak didukung browser ini')
      return
    }
    navigator.clipboard.writeText(portalLogin.initialPassword).then(
      () => toast.success('Kata sandi disalin'),
      () => toast.error('Gagal menyalin'),
    )
  }

  return (
    <Dialog
      open={portalLogin !== null}
      onOpenChange={(open) => {
        if (!open) onContinue()
      }}
    >
      <DialogContent className="sm:max-w-md" showCloseButton={false}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <KeyRoundIcon className="size-5 text-primary" />
            Akun portal pelanggan dibuat
          </DialogTitle>
          <DialogDescription>
            Kata sandi ini hanya ditampilkan satu kali. Salin dan berikan ke pelanggan.
          </DialogDescription>
        </DialogHeader>

        {portalLogin ? (
          <dl className="space-y-3 rounded-md border border-border bg-muted/40 p-4">
            <div className="space-y-1">
              <dt className="text-muted-foreground text-xs">Email</dt>
              <dd className="break-all font-mono text-sm">{portalLogin.email}</dd>
            </div>
            <div className="space-y-1">
              <dt className="text-muted-foreground text-xs">Kata sandi awal</dt>
              <dd className="flex items-center justify-between gap-2">
                <span className="break-all font-mono text-sm">{portalLogin.initialPassword}</span>
                <Button type="button" variant="outline" size="sm" onClick={handleCopy}>
                  <CopyIcon className="size-3.5" />
                  Salin
                </Button>
              </dd>
            </div>
          </dl>
        ) : null}

        <DialogFooter>
          <Button type="button" onClick={onContinue}>
            Lanjutkan ke detail pelanggan
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
