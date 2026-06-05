import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { PppProfile, PppSecret } from '@/schemas/mikrotik'

import { useCreateSecret, useUpdateSecret } from '../hooks/useMikrotik'

const FormSchema = z.object({
  username: z.string().min(1, 'Username wajib diisi').max(60),
  password: z.string().max(60),
  profileId: z.string().min(1, 'Profil wajib dipilih'),
  customerName: z.string().max(120),
  comment: z.string().max(160),
})
type FormValues = z.infer<typeof FormSchema>

type Props = {
  routerId: string
  profiles: PppProfile[]
  secret?: PppSecret
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function SecretFormDialog({ routerId, profiles, secret, open, onOpenChange }: Props) {
  const isEdit = Boolean(secret)
  const create = useCreateSecret(routerId)
  const update = useUpdateSecret(routerId)

  const form = useForm<FormValues>({
    resolver: zodResolver(FormSchema),
    values: {
      username: secret?.username ?? '',
      password: '',
      profileId: secret?.profileId ?? profiles[0]?.id ?? '',
      customerName: secret?.customerName ?? '',
      comment: secret?.comment ?? '',
    },
  })

  const handleSubmit = form.handleSubmit(async (values) => {
    try {
      if (secret) {
        await update.mutateAsync({
          id: secret.id,
          input: {
            username: values.username,
            profileId: values.profileId,
            customerName: values.customerName.trim() === '' ? null : values.customerName.trim(),
            comment: values.comment.trim() === '' ? null : values.comment.trim(),
            ...(values.password ? { password: values.password } : {}),
          },
        })
      } else {
        await create.mutateAsync({
          username: values.username,
          password: values.password || 'pppoe123',
          profileId: values.profileId,
          customerName: values.customerName.trim() || undefined,
          comment: values.comment.trim() || undefined,
        })
      }
      onOpenChange(false)
    } catch {
      // mutation hooks surface a toast
    }
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit secret' : 'Tambah PPPoE secret'}</DialogTitle>
          <DialogDescription>Akun PPPoE pelanggan pada router.</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={handleSubmit} noValidate className="space-y-4">
            <FormField
              control={form.control}
              name="username"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Username</FormLabel>
                  <FormControl>
                    <Input className="font-mono" autoComplete="off" {...field} />
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
                  <FormLabel>{isEdit ? 'Password baru (opsional)' : 'Password'}</FormLabel>
                  <FormControl>
                    <Input className="font-mono" autoComplete="off" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="profileId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Profil</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger className="w-full" aria-label="Profil">
                        <SelectValue placeholder="Pilih profil" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {profiles.map((p) => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.name} · {p.rateLimit}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="customerName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Pelanggan (opsional)</FormLabel>
                  <FormControl>
                    <Input placeholder="Nama pelanggan" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="comment"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Catatan (opsional)</FormLabel>
                  <FormControl>
                    <Input {...field} />
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
                {form.formState.isSubmitting ? 'Menyimpan…' : isEdit ? 'Simpan' : 'Tambah'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
