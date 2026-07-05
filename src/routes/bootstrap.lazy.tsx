import { createLazyFileRoute, useNavigate } from '@tanstack/react-router'
import { ShieldCheckIcon } from 'lucide-react'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { BootstrapForm } from '@/features/auth'

export const Route = createLazyFileRoute('/bootstrap')({
  component: BootstrapPage,
})

function BootstrapPage() {
  const navigate = useNavigate()

  const handleSuccess = () => {
    // Bootstrap auto-logs-in the new admin; land on the dashboard.
    void navigate({ to: '/', replace: true })
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-6 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg">
            <ShieldCheckIcon className="size-6" />
          </div>
          <h1 className="font-bold text-2xl tracking-tight">ISP CMS</h1>
        </div>

        <Card className="shadow-xl">
          <CardHeader className="space-y-1">
            <CardTitle className="text-xl">Buat akun admin pertama</CardTitle>
            <CardDescription>
              Instalasi ini belum memiliki pengguna. Buat akun admin untuk mulai.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <BootstrapForm onSuccess={handleSuccess} />
          </CardContent>
        </Card>

        <p className="mt-6 text-center text-muted-foreground text-xs">
          Langkah sekali jalan · hanya tersedia saat belum ada pengguna.
        </p>
      </div>
    </div>
  )
}
