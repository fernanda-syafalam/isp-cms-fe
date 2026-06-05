import { zodResolver } from '@hookform/resolvers/zod'
import { useNavigate } from '@tanstack/react-router'
import { ArrowLeftIcon, CheckIcon } from 'lucide-react'
import { useState } from 'react'
import { type FieldPath, useForm } from 'react-hook-form'

import { PageHeader } from '@/components/shared/page-header'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
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
import { Textarea } from '@/components/ui/textarea'
import { usePlanOptions } from '@/hooks/usePlanOptions'
import { cn } from '@/lib/cn'
import { OnboardingSchema, type OnboardingInput } from '@/schemas/onboarding'

import { useOnboardCustomer } from '../hooks/useOnboarding'

const AREAS = ['Bandung Kota', 'Cimahi', 'Sumedang', 'Garut', 'Cianjur']
const TECHNICIANS = ['Teknisi Budi', 'Teknisi Sari', 'Teknisi Joko']

const STEPS = ['Data pelanggan', 'Paket', 'Jadwal instalasi', 'Ringkasan']
const STEP_FIELDS: FieldPath<OnboardingInput>[][] = [
  ['fullName', 'phone', 'email', 'address', 'areaName'],
  ['planId'],
  ['technician', 'scheduledAt', 'note'],
]

export function OnboardingWizard() {
  const [step, setStep] = useState(0)
  const navigate = useNavigate()
  const onboard = useOnboardCustomer()
  const { data: planOptions } = usePlanOptions()

  const form = useForm<OnboardingInput>({
    resolver: zodResolver(OnboardingSchema),
    defaultValues: {
      fullName: '',
      phone: '',
      email: '',
      address: '',
      areaName: '',
      planId: '',
      technician: '',
      scheduledAt: '',
      note: '',
    },
  })

  const next = async () => {
    const fields = STEP_FIELDS[step]
    if (fields && !(await form.trigger(fields))) return
    setStep((s) => Math.min(s + 1, STEPS.length - 1))
  }

  const submit = form.handleSubmit(async (values) => {
    try {
      const customer = await onboard.mutateAsync(values)
      await navigate({
        to: '/customers/$customerId',
        params: { customerId: customer.id },
      })
    } catch {
      // useOnboardCustomer surfaces a toast.
    }
  })

  const values = form.getValues()
  const planLabel = planOptions?.find((p) => p.value === values.planId)?.label ?? '—'

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <PageHeader
        title="Onboarding pelanggan"
        description="Daftar, pilih paket, dan jadwalkan instalasi."
      />

      <ol className="flex items-center gap-2">
        {STEPS.map((label, i) => (
          <li key={label} className="flex flex-1 items-center gap-2">
            <span
              className={cn(
                'flex size-7 shrink-0 items-center justify-center rounded-full border font-medium text-xs',
                i < step && 'border-primary bg-primary text-primary-foreground',
                i === step && 'border-primary text-primary',
                i > step && 'border-border text-muted-foreground',
              )}
            >
              {i < step ? <CheckIcon className="size-3.5" /> : i + 1}
            </span>
            <span
              className={cn(
                'hidden text-sm sm:inline',
                i === step ? 'font-medium' : 'text-muted-foreground',
              )}
            >
              {label}
            </span>
            {i < STEPS.length - 1 ? <span className="h-px flex-1 bg-border" /> : null}
          </li>
        ))}
      </ol>

      <Card>
        <CardContent className="pt-6">
          <Form {...form}>
            <form onSubmit={submit} noValidate className="space-y-4">
              {step === 0 ? (
                <>
                  <TextField form={form} name="fullName" label="Nama" placeholder="Budi Santoso" />
                  <TextField form={form} name="phone" label="Telepon" placeholder="0812xxxxxxx" />
                  <TextField
                    form={form}
                    name="email"
                    label="Email (opsional)"
                    placeholder="budi@example.com"
                  />
                  <TextField
                    form={form}
                    name="address"
                    label="Alamat"
                    placeholder="Jl. Merdeka No. 1"
                  />
                  <SelectField
                    form={form}
                    name="areaName"
                    label="Area"
                    placeholder="Pilih area"
                    options={AREAS.map((a) => ({ value: a, label: a }))}
                  />
                </>
              ) : null}

              {step === 1 ? (
                <SelectField
                  form={form}
                  name="planId"
                  label="Paket"
                  placeholder="Pilih paket"
                  options={planOptions ?? []}
                />
              ) : null}

              {step === 2 ? (
                <>
                  <SelectField
                    form={form}
                    name="technician"
                    label="Teknisi"
                    placeholder="Pilih teknisi"
                    options={TECHNICIANS.map((t) => ({ value: t, label: t }))}
                  />
                  <FormField
                    control={form.control}
                    name="scheduledAt"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Jadwal instalasi</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="note"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Catatan survey (opsional)</FormLabel>
                        <FormControl>
                          <Textarea placeholder="Hasil survey, titik tarikan, dll." {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </>
              ) : null}

              {step === 3 ? (
                <dl className="grid gap-3 sm:grid-cols-2">
                  <Summary label="Nama" value={values.fullName} />
                  <Summary label="Telepon" value={values.phone} />
                  <Summary label="Email" value={values.email || '—'} />
                  <Summary label="Alamat" value={values.address} />
                  <Summary label="Area" value={values.areaName} />
                  <Summary label="Paket" value={planLabel} />
                  <Summary label="Teknisi" value={values.technician} />
                  <Summary label="Jadwal instalasi" value={values.scheduledAt} />
                </dl>
              ) : null}

              <div className="flex items-center justify-between border-border border-t pt-4">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() =>
                    step === 0 ? navigate({ to: '/customers' }) : setStep((s) => s - 1)
                  }
                >
                  <ArrowLeftIcon className="size-4" />
                  {step === 0 ? 'Batal' : 'Kembali'}
                </Button>
                {step < STEPS.length - 1 ? (
                  <Button type="button" onClick={next}>
                    Lanjut
                  </Button>
                ) : (
                  <Button type="submit" disabled={form.formState.isSubmitting}>
                    {form.formState.isSubmitting ? 'Memproses…' : 'Selesaikan onboarding'}
                  </Button>
                )}
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  )
}

type FieldProps = {
  form: ReturnType<typeof useForm<OnboardingInput>>
  name: FieldPath<OnboardingInput>
  label: string
  placeholder?: string
}

function TextField({ form, name, label, placeholder }: FieldProps) {
  return (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel>{label}</FormLabel>
          <FormControl>
            <Input placeholder={placeholder} autoComplete="off" {...field} />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  )
}

function SelectField({
  form,
  name,
  label,
  placeholder,
  options,
}: FieldProps & { options: Array<{ value: string; label: string }> }) {
  return (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel>{label}</FormLabel>
          <Select value={field.value ?? ''} onValueChange={field.onChange}>
            <FormControl>
              <SelectTrigger className="w-full" aria-label={label}>
                <SelectValue placeholder={placeholder} />
              </SelectTrigger>
            </FormControl>
            <SelectContent>
              {options.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <FormMessage />
        </FormItem>
      )}
    />
  )
}

function Summary({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-muted-foreground text-xs">{label}</dt>
      <dd className="mt-0.5 text-sm">{value}</dd>
    </div>
  )
}
