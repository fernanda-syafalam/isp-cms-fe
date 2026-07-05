import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2Icon, LockIcon, MailIcon, UserIcon } from 'lucide-react'
import { useForm } from 'react-hook-form'

import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { BootstrapFormSchema, type BootstrapFormValues } from '@/schemas/auth'

import { useBootstrap } from '../hooks/useAuth'

type Props = {
  onSuccess: () => void
}

/**
 * First-run create-admin form (P3.E.1). The confirmation field never leaves
 * the client; only { email, fullName, password } is sent to the backend, which
 * forces the admin role server-side.
 */
export function BootstrapForm({ onSuccess }: Props) {
  const bootstrapMutation = useBootstrap()

  const form = useForm<BootstrapFormValues>({
    resolver: zodResolver(BootstrapFormSchema),
    defaultValues: { email: '', fullName: '', password: '', confirmPassword: '' },
  })

  const handleSubmit = form.handleSubmit(async (values) => {
    try {
      await bootstrapMutation.mutateAsync({
        email: values.email,
        fullName: values.fullName,
        password: values.password,
      })
      onSuccess()
    } catch {
      // useBootstrap.onError already surfaces a toast; swallow so the
      // rejection does not bubble up as unhandled.
    }
  })

  return (
    <Form {...form}>
      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        <FormField
          control={form.control}
          name="fullName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nama lengkap</FormLabel>
              <div className="relative">
                <UserIcon className="-translate-y-1/2 absolute top-1/2 left-3 size-4 text-muted-foreground" />
                <FormControl>
                  <Input autoComplete="name" placeholder="Nama admin" className="pl-9" {...field} />
                </FormControl>
              </div>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <div className="relative">
                <MailIcon className="-translate-y-1/2 absolute top-1/2 left-3 size-4 text-muted-foreground" />
                <FormControl>
                  <Input
                    type="email"
                    autoComplete="email"
                    placeholder="admin@example.com"
                    className="pl-9"
                    {...field}
                  />
                </FormControl>
              </div>
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
              <div className="relative">
                <LockIcon className="-translate-y-1/2 absolute top-1/2 left-3 size-4 text-muted-foreground" />
                <FormControl>
                  <Input
                    type="password"
                    autoComplete="new-password"
                    placeholder="Minimal 12 karakter"
                    className="pl-9"
                    {...field}
                  />
                </FormControl>
              </div>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="confirmPassword"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Konfirmasi kata sandi</FormLabel>
              <div className="relative">
                <LockIcon className="-translate-y-1/2 absolute top-1/2 left-3 size-4 text-muted-foreground" />
                <FormControl>
                  <Input type="password" autoComplete="new-password" className="pl-9" {...field} />
                </FormControl>
              </div>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" disabled={form.formState.isSubmitting} className="w-full">
          {form.formState.isSubmitting ? (
            <>
              <Loader2Icon className="size-4 animate-spin" />
              Membuat akun…
            </>
          ) : (
            'Buat akun admin'
          )}
        </Button>
      </form>
    </Form>
  )
}
