import { zodResolver } from '@hookform/resolvers/zod'
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
import { EnableTwoFactorSchema, type EnableTwoFactorInput } from '@/schemas/security'

import { useEnableTwoFactor } from '../hooks/useSecurity'

// Static demo secret — a real backend issues a per-user TOTP secret + QR.
const DEMO_SECRET = 'JBSWY3DPEHPK3PXP'

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function TwoFactorDialog({ open, onOpenChange }: Props) {
  const enable = useEnableTwoFactor()

  const form = useForm<EnableTwoFactorInput>({
    resolver: zodResolver(EnableTwoFactorSchema),
    defaultValues: { code: '' },
  })

  const handleSubmit = form.handleSubmit(async (values) => {
    try {
      await enable.mutateAsync(values.code)
      form.reset()
      onOpenChange(false)
    } catch {
      // useEnableTwoFactor surfaces a toast.
    }
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Aktifkan autentikasi dua faktor</DialogTitle>
          <DialogDescription>
            Pindai kode di aplikasi authenticator (Google Authenticator / Authy), lalu masukkan kode
            6 digit untuk verifikasi.
          </DialogDescription>
        </DialogHeader>
        <div className="rounded-md border border-border bg-muted/40 p-3 text-center">
          <p className="text-muted-foreground text-xs">Kunci rahasia (manual)</p>
          <p className="mt-1 font-mono text-sm tracking-widest">{DEMO_SECRET}</p>
        </div>
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
                onClick={() => onOpenChange(false)}
                disabled={form.formState.isSubmitting}
              >
                Batal
              </Button>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? 'Memverifikasi…' : 'Aktifkan'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
