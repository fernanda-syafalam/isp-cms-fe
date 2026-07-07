import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2Icon } from 'lucide-react'
import { useForm } from 'react-hook-form'

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
import { type TwoFactorCodeInput, TwoFactorCodeSchema } from '@/schemas/security'

import { useDisableTwoFactor } from '../hooks/useSecurity'

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function DisableTwoFactorDialog({ open, onOpenChange }: Props) {
  const disable = useDisableTwoFactor()

  const form = useForm<TwoFactorCodeInput>({
    resolver: zodResolver(TwoFactorCodeSchema),
    defaultValues: { code: '' },
  })

  const handleSubmit = form.handleSubmit(async (values) => {
    try {
      await disable.mutateAsync(values.code)
      form.reset()
      onOpenChange(false)
    } catch {
      // Wrong code — useDisableTwoFactor surfaced a toast; keep the dialog
      // open and mark the field so the user can retry.
      form.setError('code', { message: 'Kode salah, coba lagi.' })
    }
  })

  const handleOpenChange = (next: boolean) => {
    if (!next) form.reset()
    onOpenChange(next)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nonaktifkan autentikasi dua faktor</DialogTitle>
          <DialogDescription>
            Masukkan kode 6 digit dari aplikasi authenticator untuk mematikan 2FA pada akun ini.
          </DialogDescription>
        </DialogHeader>
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
                onClick={() => handleOpenChange(false)}
                disabled={disable.isPending}
              >
                Batal
              </Button>
              <Button type="submit" variant="destructive" disabled={disable.isPending}>
                {disable.isPending ? (
                  <>
                    <Loader2Icon className="size-4 animate-spin" />
                    Memproses…
                  </>
                ) : (
                  'Nonaktifkan'
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
