import { createLazyFileRoute, useNavigate } from '@tanstack/react-router'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { LoginForm } from '@/features/auth'

export const Route = createLazyFileRoute('/login')({
  component: LoginPage,
})

function LoginPage() {
  const { from } = Route.useSearch()
  const navigate = useNavigate()

  const handleSuccess = () => {
    void navigate({ to: from ?? '/tenants', replace: true })
  }

  return (
    <div className="mx-auto flex min-h-[60vh] max-w-md items-center">
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Sign in</CardTitle>
          <CardDescription>Enter your credentials to continue.</CardDescription>
        </CardHeader>
        <CardContent>
          <LoginForm onSuccess={handleSuccess} />
        </CardContent>
      </Card>
    </div>
  )
}
