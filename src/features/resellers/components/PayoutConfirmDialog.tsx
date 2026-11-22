import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { formatCurrency } from '@/lib/format'

export type PayoutAction = 'approve' | 'reject' | 'disburse'

type Copy = { title: string; consequence: string; confirm: string; destructive: boolean }

const COPY: Record<PayoutAction, Copy> = {
  approve: {
    title: 'Setujui pencairan?',
    consequence: 'Pencairan akan disetujui dan siap dicairkan.',
    confirm: 'Setujui',
    destructive: false,
  },
  reject: {
    title: 'Tolak pencairan?',
    consequence: 'Pengajuan ini ditolak dan tidak bisa diproses lagi.',
    confirm: 'Tolak',
    destructive: true,
  },
  disburse: {
    title: 'Cairkan dana?',
    consequence:
      'Saldo reseller akan dikurangi sebesar jumlah ini. Tindakan ini tidak bisa dibatalkan.',
    confirm: 'Cairkan',
    destructive: true,
  },
}

type Props = {
  open: boolean
  action: PayoutAction
  amount: number
  resellerName: string
  isPending: boolean
  onConfirm: () => void
  onClose: () => void
}

export function PayoutConfirmDialog({
  open,
  action,
  amount,
  resellerName,
  isPending,
  onConfirm,
  onClose,
}: Props) {
  const copy = COPY[action]
  return (
    <AlertDialog
      open={open}
      onOpenChange={(next) => {
        if (!next && !isPending) onClose()
      }}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{copy.title}</AlertDialogTitle>
          <AlertDialogDescription>
            Pencairan untuk {resellerName} sebesar {formatCurrency(amount)}. {copy.consequence}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>Batal</AlertDialogCancel>
          <Button
            variant={copy.destructive ? 'destructive' : 'default'}
            disabled={isPending}
            onClick={onConfirm}
          >
            {copy.confirm}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
