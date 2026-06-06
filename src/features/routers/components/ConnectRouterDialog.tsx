import { zodResolver } from '@hookform/resolvers/zod'
import { CheckCircle2Icon, PlugZapIcon, TriangleAlertIcon } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'

import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
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
import {
  ConnectRouterSchema,
  type ConnectRouterInput,
  type TestConnectionResult,
} from '@/schemas/router'

import { useConnectRouter, useTestRouterConnection } from '../hooks/useRouters'

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ConnectRouterDialog({ open, onOpenChange }: Props) {
  const test = useTestRouterConnection()
  const create = useConnectRouter()
  const [result, setResult] = useState<TestConnectionResult | null>(null)

  const form = useForm<ConnectRouterInput>({
    resolver: zodResolver(ConnectRouterSchema),
    defaultValues: {
      name: '',
      host: '',
      apiPort: 8728,
      username: '',
      password: '',
      useTls: false,
    },
  })

  // Any field edit invalidates a prior probe result — force a re-test.
  useEffect(() => {
    const sub = form.watch(() => setResult(null))
    return () => sub.unsubscribe()
  }, [form])

  const runTest = form.handleSubmit(async (values) => {
    const r = await test.mutateAsync(values)
    setResult(r)
  })

  const runConnect = form.handleSubmit(async (values) => {
    if (!result?.ok) return
    try {
      await create.mutateAsync(values)
      form.reset()
      setResult(null)
      onOpenChange(false)
    } catch {
      // useConnectRouter surfaces a toast.
    }
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Hubungkan router (RouterOS)</DialogTitle>
          <DialogDescription>
            Sambungkan ke perangkat Mikrotik via API. Uji koneksi untuk mengambil identity, model,
            dan versi sebelum disimpan.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={runConnect} noValidate className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nama router</FormLabel>
                  <FormControl>
                    <Input autoComplete="off" placeholder="MIKROTIK-Pusat" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid gap-4 sm:grid-cols-[1fr_auto]">
              <FormField
                control={form.control}
                name="host"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Host / IP</FormLabel>
                    <FormControl>
                      <Input className="font-mono" placeholder="10.20.0.1" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="apiPort"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Port API</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        inputMode="numeric"
                        className="w-24 font-mono"
                        value={field.value}
                        onChange={(e) => field.onChange(e.target.valueAsNumber || 0)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Username API</FormLabel>
                    <FormControl>
                      <Input autoComplete="off" placeholder="api" {...field} />
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
                      <Input type="password" autoComplete="off" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="useTls"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center gap-2 space-y-0">
                  <FormControl>
                    <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                  <FormLabel className="font-normal">Gunakan TLS (API-SSL, port 8729)</FormLabel>
                </FormItem>
              )}
            />

            {result ? (
              result.ok ? (
                <div className="space-y-1 rounded-md border border-green-500/30 bg-green-500/10 p-3 text-sm">
                  <p className="flex items-center gap-2 font-medium text-green-700 dark:text-green-400">
                    <CheckCircle2Icon className="size-4" />
                    Koneksi berhasil
                  </p>
                  <dl className="grid grid-cols-[auto_1fr] gap-x-3 text-muted-foreground text-xs">
                    <dt>Identity</dt>
                    <dd className="font-mono text-foreground">{result.identity}</dd>
                    <dt>Model</dt>
                    <dd className="font-mono text-foreground">{result.model}</dd>
                    <dt>Versi</dt>
                    <dd className="font-mono text-foreground">{result.version}</dd>
                  </dl>
                </div>
              ) : (
                <p className="flex items-center gap-2 rounded-md border border-destructive/30 bg-destructive/10 p-3 text-destructive text-sm">
                  <TriangleAlertIcon className="size-4 shrink-0" />
                  {result.message ?? 'Koneksi gagal'}
                </p>
              )
            ) : null}

            <DialogFooter className="gap-2 sm:justify-between">
              <Button type="button" variant="outline" disabled={test.isPending} onClick={runTest}>
                <PlugZapIcon className="size-4" />
                {test.isPending ? 'Menguji…' : 'Uji koneksi'}
              </Button>
              <Button type="submit" disabled={!result?.ok || create.isPending}>
                {create.isPending ? 'Menyimpan…' : 'Hubungkan & simpan'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
