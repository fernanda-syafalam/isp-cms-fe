import { createLazyFileRoute, useNavigate } from '@tanstack/react-router'
import { Building2Icon } from 'lucide-react'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { LoginForm } from '@/features/auth'

export const Route = createLazyFileRoute('/login')({
  component: LoginPage,
})

function LoginPage() {
  const { from } = Route.useSearch()
  const navigate = useNavigate()

  const handleSuccess = () => {
    void navigate({ to: from ?? '/', replace: true })
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg">
            <Building2Icon className="size-6" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">ISP CMS</h1>
          <p className="mt-1 text-sm text-muted-foreground">Sign in to your account</p>
        </div>

        <Card className="shadow-xl">
          <CardHeader className="space-y-1">
            <CardTitle className="text-xl">Sign in</CardTitle>
            <CardDescription>Enter your credentials to continue.</CardDescription>
          </CardHeader>
          <CardContent>
            <LoginForm onSuccess={handleSuccess} />
          </CardContent>
        </Card>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          Internal use only · ISP CMS
        </p>
      </div>
    </div>
  )
}
