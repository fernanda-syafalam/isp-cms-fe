import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2Icon } from 'lucide-react'
import { QRCodeSVG } from 'qrcode.react'
import { useEffect } from 'react'
import { useForm } from 'react-hook-form'

import { CopyButton } from '@/components/shared/copy-button'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { type TwoFactorCodeInput, TwoFactorCodeSchema } from '@/schemas/security'

import { useConfirmTwoFactor, useEnrollTwoFactor } from '../hooks/useSecurity'

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function TwoFactorDialog({ open, onOpenChange }: Props) {
  const {
    mutate: startEnroll,
    reset: resetEnroll,
    data: enrollData,
    isPending: isEnrolling,
    isError: enrollFailed,
  } = useEnrollTwoFactor()
  const confirm = useConfirmTwoFactor()

  const form = useForm<TwoFactorCodeInput>({
    resolver: zodResolver(TwoFactorCodeSchema),
    defaultValues: { code: '' },
  })

  // Begin enrollment when the dialog opens (a fresh secret each time) and
  // discard it when it closes. Firing an imperative POST on open/close is a
  // side effect, not query-style data fetching — mutate/reset are stable.
  useEffect(() => {
    if (open) {
      startEnroll()
    } else {
      resetEnroll()
      confirm.reset()
      form.reset()
    }
  }, [open, startEnroll, resetEnroll, confirm.reset, form.reset])

  const handleSubmit = form.handleSubmit(async (values) => {
    try {
      await confirm.mutateAsync(values.code)
      onOpenChange(false)
    } catch {
      // Wrong/expired code — keep the dialog open and show an inline error.
      form.setError('code', { message: 'Kode salah, coba lagi.' })
    }
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Aktifkan autentikasi dua faktor</DialogTitle>
          <DialogDescription>
            Pindai kode QR di aplikasi authenticator (Google Authenticator / Authy), lalu masukkan
            kode 6 digit untuk verifikasi.
          </DialogDescription>
        </DialogHeader>

        {enrollFailed ? (
          <div className="space-y-3 rounded-md border border-destructive/50 bg-destructive/10 p-3 text-center">
            <p className="text-destructive text-sm">Gagal memulai pendaftaran 2FA.</p>
            <Button type="button" variant="outline" size="sm" onClick={() => startEnroll()}>
              Coba lagi
            </Button>
          </div>
        ) : isEnrolling || !enrollData ? (
          <div className="flex flex-col items-center gap-3">
            <Skeleton className="size-40" />
            <Skeleton className="h-4 w-48" />
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3">
            <div className="rounded-md border border-border bg-white p-3">
              <QRCodeSVG
                value={enrollData.otpauthUri}
                size={160}
                aria-label="Kode QR autentikator"
              />
            </div>
            <div className="w-full rounded-md border border-border bg-muted/40 p-3 text-center">
              <p className="text-muted-foreground text-xs">Kunci rahasia (entri manual)</p>
              <div className="mt-1 flex items-center justify-center gap-1">
                <p className="break-all font-mono text-sm tracking-widest">
                  {enrollData.twoFactorSecret}
                </p>
                <CopyButton value={enrollData.twoFactorSecret} label="Kunci disalin" />
              </div>
            </div>
          </div>
        )}

        <Form {...form}>
          <form onSubmit={handleSubmit} noValidate className="space-y-4">
            <FormField
              control={form.control}
              name="code"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Kode verifikasi</FormLabel>
                  <FormControl>
                    <Input
                      inputMode="numeric"
                      autoComplete="one-time-code"
                      maxLength={6}
                      placeholder="123456"
                      className="font-mono tracking-widest"
                      disabled={!enrollData}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button
                type="button"
                variant="ghost"
                onClick={() => onOpenChange(false)}
                disabled={confirm.isPending}
              >
                Batal
              </Button>
              <Button type="submit" disabled={!enrollData || confirm.isPending}>
                {confirm.isPending ? (
                  <>
                    <Loader2Icon className="size-4 animate-spin" />
                    Memverifikasi…
                  </>
                ) : (
                  'Aktifkan'
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
