import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { type PortalWifiUpdate, PortalWifiUpdateSchema } from '@/schemas/portal'

import { useUpdatePortalWifi } from '../hooks/usePortal'

type Props = {
  currentSsid: string | null
}

export function WifiSettingsDialog({ currentSsid }: Props) {
  const [open, setOpen] = useState(false)
  const update = useUpdatePortalWifi()

  const form = useForm<PortalWifiUpdate>({
    resolver: zodResolver(PortalWifiUpdateSchema),
    defaultValues: { ssid: currentSsid ?? '', password: '' },
  })

  const handleSubmit = form.handleSubmit(async (values) => {
    try {
      await update.mutateAsync(values)
      form.reset({ ssid: values.ssid, password: '' })
      setOpen(false)
    } catch {
      // useUpdatePortalWifi surfaces a toast.
    }
  })

  const isPending = form.formState.isSubmitting || update.isPending

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          Ubah Wi-Fi
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Ubah pengaturan Wi-Fi</DialogTitle>
          <DialogDescription>
            Ganti nama jaringan dan kata sandi Wi-Fi Anda. Perangkat yang terhubung perlu masuk
            ulang setelah perubahan.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={handleSubmit} noValidate className="space-y-4">
            <FormField
              control={form.control}
              name="ssid"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nama Wi-Fi (SSID)</FormLabel>
                  <FormControl>
                    <Input placeholder="cth. Rumah-Budi" autoComplete="off" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Kata sandi baru</FormLabel>
                  <FormControl>
                    <Input
                      type="password"
                      placeholder="Minimal 8 karakter"
                      autoComplete="new-password"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>Gunakan 8–63 karakter agar aman.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button
                type="button"
                variant="ghost"
                onClick={() => setOpen(false)}
                disabled={isPending}
              >
                Batal
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? 'Menyimpan…' : 'Simpan perubahan'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
