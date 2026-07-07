import { zodResolver } from '@hookform/resolvers/zod'
import { KeyRoundIcon, Loader2Icon, LockIcon, MailIcon } from 'lucide-react'
import { type FormEvent, useState } from 'react'
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
import { Label } from '@/components/ui/label'
import { getErrorCode } from '@/lib/errors'
import { LoginSchema, type LoginInput } from '@/schemas/auth'

import { useLogin } from '../hooks/useAuth'

type Props = {
  onSuccess: () => void
}

// Credentials held only in memory for a 2FA resubmit — never persisted
// (ADR-0002: no password or secret in web storage).
type Challenge = { email: string; password: string }

export function LoginForm({ onSuccess }: Props) {
  const loginMutation = useLogin()
  const [challenge, setChallenge] = useState<Challenge | null>(null)
  const [locked, setLocked] = useState(false)
  const [code, setCode] = useState('')
  const [codeError, setCodeError] = useState<string | null>(null)

  const form = useForm<LoginInput>({
    resolver: zodResolver(LoginSchema),
    defaultValues: { email: '', password: '' },
  })

  const handleSubmit = form.handleSubmit(async (values) => {
    try {
      await loginMutation.mutateAsync({
        email: values.email,
        password: values.password,
      })
      onSuccess()
    } catch (err) {
      // A 2FA account with a correct password asks for a code — reveal the
      // challenge input instead of showing the (suppressed) error toast.
      if (getErrorCode(err) === 'totp_required') {
        setChallenge({ email: values.email, password: values.password })
      }
      // Any other failure already surfaced a toast in useLogin.onError.
    }
  })

  const handleCodeSubmit = async (event: FormEvent) => {
    event.preventDefault()
    if (!challenge || locked) return
    if (!/^\d{6}$/.test(code)) {
      setCodeError('Kode harus 6 digit')
      return
    }
    setCodeError(null)
    try {
      await loginMutation.mutateAsync({ ...challenge, totpCode: code })
      onSuccess()
    } catch (err) {
      const errorCode = getErrorCode(err)
      if (errorCode === 'totp_locked') {
        setLocked(true)
        setCodeError('Terlalu banyak percobaan. Coba lagi nanti.')
      } else if (errorCode === 'totp_invalid') {
        setCodeError('Kode salah, coba lagi.')
      }
    }
  }

  const resetChallenge = () => {
    setChallenge(null)
    setLocked(false)
    setCode('')
    setCodeError(null)
  }

  if (challenge) {
    return (
      <form onSubmit={handleCodeSubmit} noValidate className="space-y-4">
        <div className="rounded-md border border-border bg-muted/40 p-3">
          <p className="text-muted-foreground text-xs">Verifikasi dua faktor untuk</p>
          <p className="font-medium text-sm">{challenge.email}</p>
        </div>
        <div className="space-y-2">
          <Label htmlFor="totp-code">Kode autentikator</Label>
          <div className="relative">
            <KeyRoundIcon className="-translate-y-1/2 absolute top-1/2 left-3 size-4 text-muted-foreground" />
            <Input
              id="totp-code"
              value={code}
              onChange={(event) => setCode(event.target.value)}
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              placeholder="123456"
              className="pl-9 font-mono tracking-widest"
              disabled={locked || loginMutation.isPending}
              aria-invalid={codeError ? true : undefined}
              aria-describedby={codeError ? 'totp-code-error' : undefined}
            />
          </div>
          {codeError ? (
            <p id="totp-code-error" role="alert" className="text-destructive text-sm">
              {codeError}
            </p>
          ) : null}
        </div>
        <Button type="submit" disabled={locked || loginMutation.isPending} className="w-full">
          {loginMutation.isPending ? (
            <>
              <Loader2Icon className="size-4 animate-spin" />
              Memverifikasi…
            </>
          ) : (
            'Verifikasi'
          )}
        </Button>
        <Button type="button" variant="ghost" className="w-full" onClick={resetChallenge}>
          Gunakan akun lain
        </Button>
      </form>
    )
  }

  return (
    <Form {...form}>
      <form onSubmit={handleSubmit} noValidate className="space-y-4">
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
                    placeholder="you@example.com"
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
                    autoComplete="current-password"
                    className="pl-9"
                    {...field}
                  />
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
              Memproses…
            </>
          ) : (
            'Masuk'
          )}
        </Button>
      </form>
    </Form>
  )
}
