import { zodResolver } from '@hookform/resolvers/zod'
import { RotateCwIcon, WifiIcon } from 'lucide-react'
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
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { SetWifiSchema, type SetWifiInput } from '@/schemas/customer'

import { useRebootOnu, useSetOnuWifi } from '../hooks/useCustomers'

type Props = {
  customerId: string
  ssid: string
}

// GenieACS / TR-069 actions on the subscriber's ONU. Mock now.
export function OnuActions({ customerId, ssid }: Props) {
  const reboot = useRebootOnu(customerId)
  return (
    <div className="flex flex-wrap gap-2">
      <Button
        variant="outline"
        size="sm"
        disabled={reboot.isPending}
        onClick={() => reboot.mutate()}
      >
        <RotateCwIcon className="size-4" />
        Reboot ONU
      </Button>
      <WifiDialog customerId={customerId} ssid={ssid} />
    </div>
  )
}

function WifiDialog({ customerId, ssid }: Props) {
  const [open, setOpen] = useState(false)
  const setWifi = useSetOnuWifi(customerId)
  const form = useForm<SetWifiInput>({
    resolver: zodResolver(SetWifiSchema),
    defaultValues: { ssid, password: '' },
  })

  const handleSubmit = form.handleSubmit(async (values) => {
    try {
      await setWifi.mutateAsync(values)
      form.reset({ ssid: values.ssid, password: '' })
      setOpen(false)
    } catch {
      // useSetOnuWifi surfaces a toast.
    }
  })

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <WifiIcon className="size-4" />
          Ganti WiFi
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Ganti WiFi ONU</DialogTitle>
          <DialogDescription>
            Ubah SSID dan kata sandi WiFi pelanggan dari jarak jauh (TR-069).
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={handleSubmit} noValidate className="space-y-4">
            <FormField
              control={form.control}
              name="ssid"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>SSID</FormLabel>
                  <FormControl>
                    <Input placeholder="Nama WiFi" autoComplete="off" {...field} />
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
                  <FormLabel>Kata sandi</FormLabel>
                  <FormControl>
                    <Input
                      type="password"
                      placeholder="Minimal 8 karakter"
                      autoComplete="off"
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
                onClick={() => setOpen(false)}
                disabled={form.formState.isSubmitting}
              >
                Batal
              </Button>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? 'Menyimpan…' : 'Simpan'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
