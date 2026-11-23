import { useNavigate } from '@tanstack/react-router'

import { Button } from '@/components/ui/button'

import { useLogout } from '../hooks/useAuth'

export function AccessUnavailable() {
  const logout = useLogout()
  const navigate = useNavigate()

  // Navigate from the promise: the hook's onSettled clears the session, which unmounts
  // this component, and per-call mutate callbacks are dropped once unmounted.
  const goToLogin = () => void navigate({ to: '/login' })
  const handleLogout = () => {
    void logout.mutateAsync().then(goToLogin, goToLogin)
  }

  return (
    <main
      id="main-content"
      tabIndex={-1}
      className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background p-6 text-center text-foreground outline-none"
    >
      <h1 className="font-semibold text-2xl tracking-tight">Akses tidak tersedia</h1>
      <p className="max-w-sm text-muted-foreground text-sm">
        Akun Anda belum memiliki akses ke aplikasi ini. Silakan keluar atau hubungi operator.
      </p>
      <Button onClick={handleLogout} disabled={logout.isPending}>
        Keluar
      </Button>
    </main>
  )
}
