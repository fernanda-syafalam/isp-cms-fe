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
import { CreateProfileSchema, type CreateProfileInput, type PppProfile } from '@/schemas/mikrotik'

import { useCreateProfile, useUpdateProfile } from '../hooks/useMikrotik'

type Props = {
  routerId: string
  profile?: PppProfile
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ProfileFormDialog({ routerId, profile, open, onOpenChange }: Props) {
  const isEdit = Boolean(profile)
  const create = useCreateProfile(routerId)
  const update = useUpdateProfile(routerId)

  const form = useForm<CreateProfileInput>({
    resolver: zodResolver(CreateProfileSchema),
    values: {
      name: profile?.name ?? '',
      rateLimit: profile?.rateLimit ?? '',
    },
  })

  const handleSubmit = form.handleSubmit(async (values) => {
    try {
      if (profile) await update.mutateAsync({ id: profile.id, input: values })
      else await create.mutateAsync(values)
      onOpenChange(false)
    } catch {
      // mutation hooks surface a toast
    }
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit profil' : 'Tambah profil'}</DialogTitle>
          <DialogDescription>Profil bandwidth (rate limit) PPP.</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={handleSubmit} noValidate className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nama profil</FormLabel>
                  <FormControl>
                    <Input placeholder="Home 20" autoComplete="off" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="rateLimit"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Rate limit (rx/tx)</FormLabel>
                  <FormControl>
                    <Input className="font-mono" placeholder="20M/20M" {...field} />
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
