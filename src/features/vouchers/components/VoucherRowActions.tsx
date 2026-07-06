import { CheckCircle2Icon } from 'lucide-react'
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
import { useCan } from '@/features/auth'
import type { Voucher } from '@/schemas/voucher'

import { useRedeemVoucher } from '../hooks/useVouchers'

export function VoucherRowActions({ voucher }: { voucher: Voucher }) {
  const [open, setOpen] = useState(false)
  const canManage = useCan('vouchers.manage')
  const redeem = useRedeemVoucher()

  // Only unused vouchers can be marked redeemed.
  if (!canManage || voucher.status !== 'unused') return null

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        className="h-8"
        onClick={() => setOpen(true)}
        disabled={redeem.isPending}
      >
        <CheckCircle2Icon className="size-4" />
        <span className="hidden sm:inline">Tandai terpakai</span>
      </Button>

      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Tandai voucher terpakai?</AlertDialogTitle>
            <AlertDialogDescription>
              Voucher "{voucher.code}" akan ditandai sudah ditukar, mencatat pembayaran senilai
              harga voucher
              {voucher.resellerName ? ` dan komisi untuk ${voucher.resellerName}` : ''}, dan tidak
              bisa dipakai lagi.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={() => redeem.mutate(voucher.id)}>
              Tandai terpakai
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
