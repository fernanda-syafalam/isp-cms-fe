import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'

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
import { LoginSchema, type LoginInput } from '@/schemas/auth'

import { useLogin } from '../hooks/useAuth'

type Props = {
  onSuccess: () => void
}

export function LoginForm({ onSuccess }: Props) {
  const loginMutation = useLogin()

  const form = useForm<LoginInput>({
    resolver: zodResolver(LoginSchema),
    defaultValues: { email: '', password: '' },
  })

  const handleSubmit = form.handleSubmit(async (values) => {
    try {
      await loginMutation.mutateAsync(values)
      onSuccess()
    } catch {
      // useLogin.onError already surfaces a toast; swallow here so
      // the rejection does not bubble up as unhandled.
    }
  })

  return (
    <Form {...form}>
      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input type="email" autoComplete="email" placeholder="you@example.com" {...field} />
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
              <FormLabel>Password</FormLabel>
              <FormControl>
                <Input type="password" autoComplete="current-password" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" disabled={form.formState.isSubmitting} className="w-full">
          {form.formState.isSubmitting ? 'Signing in…' : 'Sign in'}
        </Button>
      </form>
    </Form>
  )
}
