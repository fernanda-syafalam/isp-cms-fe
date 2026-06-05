import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'

import { statusLabel } from '@/lib/status-label'

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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { AppError } from '@/lib/errors'
import { CreateUserSchema, UserRoleSchema, type CreateUserInput } from '@/schemas/user'

import { useCreateUser } from '../hooks/useUsers'

const ROLE_OPTIONS = UserRoleSchema.options
const FIELD_NAMES = ['email', 'fullName', 'password', 'role'] as const

// Server-side field errors arrive shaped { fieldErrors: { field: string[] } }
// (NestJS class-validator style). Narrow the unknown error cause without
// casting, then map any matching field error onto RHF so it renders inline.
function extractFieldErrors(cause: unknown): Partial<Record<keyof CreateUserInput, string>> {
  if (typeof cause !== 'object' || cause === null || !('fieldErrors' in cause)) return {}
  const { fieldErrors } = cause
  if (typeof fieldErrors !== 'object' || fieldErrors === null) return {}

  const result: Partial<Record<keyof CreateUserInput, string>> = {}
  for (const name of FIELD_NAMES) {
    if (!(name in fieldErrors)) continue
    const messages = Reflect.get(fieldErrors, name)
    const first = Array.isArray(messages) ? messages[0] : undefined
    if (typeof first === 'string') result[name] = first
  }
  return result
}

export function CreateUserDialog() {
  const [open, setOpen] = useState(false)
  const createMutation = useCreateUser()

  const form = useForm<CreateUserInput>({
    resolver: zodResolver(CreateUserSchema),
    defaultValues: { email: '', fullName: '', password: '', role: 'customer' },
  })

  const handleSubmit = form.handleSubmit(async (values) => {
    try {
      await createMutation.mutateAsync(values)
      form.reset()
      setOpen(false)
    } catch (err) {
      // useCreateUser.onError surfaces a toast. Additionally map any
      // structured field errors onto the form so they render inline.
      if (err instanceof AppError) {
        const fieldErrors = extractFieldErrors(err.cause)
        for (const [field, message] of Object.entries(fieldErrors)) {
          form.setError(field as keyof CreateUserInput, { message })
        }
      }
    }
  })

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>Staf baru</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Buat staf</DialogTitle>
          <DialogDescription>Tambahkan akun staf baru.</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={handleSubmit} noValidate className="space-y-4">
            <FormField
              control={form.control}
              name="fullName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nama</FormLabel>
                  <FormControl>
                    <Input placeholder="Jane Doe" autoComplete="off" {...field} />
                  </FormControl>
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
                  <FormControl>
                    <Input type="email" placeholder="jane@example.com" {...field} />
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
                  <FormLabel>Kata sandi</FormLabel>
                  <FormControl>
                    <Input type="password" autoComplete="new-password" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="role"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Peran</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger className="w-full" aria-label="Peran">
                        <SelectValue placeholder="Pilih peran" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {ROLE_OPTIONS.map((role) => (
                        <SelectItem key={role} value={role}>
                          {statusLabel(role)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button
                type="button"
                variant="ghost"
                onClick={() => setOpen(false)}
                disabled={form.formState.isSubmitting}
              >
                Batal
              </Button>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? 'Menyimpan…' : 'Buat'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
