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
import { ChangePasswordSchema, type ChangePasswordInput } from '@/schemas/user'

import { useChangePassword } from '../hooks/useChangePassword'

// Self-service password change, opened from the Security page. The current
// password is required (a hijacked session can't silently rotate); the new
// password is confirmed client-side before it reaches the API.
export function ChangePasswordDialog() {
  const change = useChangePassword()
  const form = useForm<ChangePasswordInput>({
    resolver: zodResolver(ChangePasswordSchema),
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
  })

  const handleSubmit = form.handleSubmit(async (values) => {
    await change.mutateAsync({
      currentPassword: values.currentPassword,
      newPassword: values.newPassword,
    })
    form.reset()
  })

  return (
    <Dialog
      onOpenChange={(open) => {
        if (!open) form.reset()
      }}
    >
      <DialogTrigger asChild>
        <Button variant="outline">Ubah kata sandi</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Ubah kata sandi</DialogTitle>
          <DialogDescription>
            Masukkan kata sandi saat ini dan kata sandi baru minimal 12 karakter.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={handleSubmit} className="space-y-4">
            <FormField
              control={form.control}
              name="currentPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Kata sandi saat ini</FormLabel>
                  <FormControl>
                    <Input type="password" autoComplete="current-password" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="newPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Kata sandi baru</FormLabel>
                  <FormControl>
                    <Input type="password" autoComplete="new-password" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="confirmPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Konfirmasi kata sandi baru</FormLabel>
                  <FormControl>
                    <Input type="password" autoComplete="new-password" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="submit" disabled={change.isPending}>
                {change.isPending ? 'Menyimpan…' : 'Simpan'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
