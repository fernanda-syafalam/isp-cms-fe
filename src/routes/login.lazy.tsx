import { createLazyFileRoute, useNavigate } from '@tanstack/react-router'
import { Building2Icon, CheckCircle2Icon } from 'lucide-react'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { LoginForm } from '@/features/auth'
import { safeInternalPath } from '@/lib/safeRedirect'

export const Route = createLazyFileRoute('/login')({
  component: LoginPage,
})

const HIGHLIGHTS = [
  'Pelanggan & lifecycle (isolir otomatis)',
  'Billing, pembayaran & piutang (AR)',
  'Provisioning ONU/Mikrotik & redaman',
]

function LoginPage() {
  const { from } = Route.useSearch()
  const navigate = useNavigate()

  const handleSuccess = () => {
    // `from` is attacker-controllable (?from=…); only honor internal paths.
    void navigate({ to: safeInternalPath(from), replace: true })
  }

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* Brand panel */}
      <div className="relative hidden flex-col justify-between overflow-hidden border-sidebar-border border-r bg-sidebar p-12 lg:flex">
        <div
          aria-hidden="true"
          className="-top-32 -left-24 absolute size-96 rounded-full bg-primary/25 blur-3xl"
        />
        <div
          aria-hidden="true"
          className="absolute right-[-6rem] bottom-[-6rem] size-80 rounded-full bg-amber-500/10 blur-3xl"
        />
        <div className="relative flex items-center gap-2 font-semibold tracking-tight">
          <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm">
            <Building2Icon className="size-4" />
          </span>
          ISP CMS
        </div>

        <div className="relative max-w-md space-y-6">
          <h1 className="font-bold text-4xl tracking-tight">
            Operasikan ISP Anda dari satu dasbor.
          </h1>
          <p className="text-muted-foreground">
            Pelanggan, jaringan, dan tagihan dalam satu tempat — dari prospek sampai isolir, lengkap
            dengan provisioning dan pembayaran.
          </p>
          <ul className="space-y-3">
            {HIGHLIGHTS.map((item) => (
              <li key={item} className="flex items-center gap-3 text-sm">
                <CheckCircle2Icon className="size-4 shrink-0 text-primary" />
                {item}
              </li>
            ))}
          </ul>
        </div>

        <p className="relative text-muted-foreground text-xs">Penggunaan internal · ISP CMS</p>
      </div>

      {/* Form panel */}
      <div className="flex items-center justify-center p-6 py-12">
        <div className="w-full max-w-sm">
          <div className="mb-8 text-center lg:hidden">
            <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg">
              <Building2Icon className="size-6" />
            </div>
            <h1 className="font-bold text-2xl tracking-tight">ISP CMS</h1>
          </div>

          <Card className="shadow-xl">
            <CardHeader className="space-y-1">
              <CardTitle className="text-xl">Masuk</CardTitle>
              <CardDescription>Masukkan kredensial Anda untuk melanjutkan.</CardDescription>
            </CardHeader>
            <CardContent>
              <LoginForm onSuccess={handleSuccess} />
            </CardContent>
          </Card>

          <p className="mt-6 text-center text-muted-foreground text-xs">
            Mode demo — gunakan email apa pun + kata sandi (min. 8 karakter).
          </p>
        </div>
      </div>
    </div>
  )
}
