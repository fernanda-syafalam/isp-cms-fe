import { zodResolver } from '@hookform/resolvers/zod'
import { useNavigate } from '@tanstack/react-router'
import { ArrowLeftIcon, CheckIcon } from 'lucide-react'
import { useState } from 'react'
import { type FieldPath, useForm } from 'react-hook-form'

import { PageHeader } from '@/components/shared/page-header'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Form } from '@/components/ui/form'
import { useOdpList } from '@/features/ftth/hooks/useOdp'
import { usePlanOptions } from '@/hooks/usePlanOptions'
import { cn } from '@/lib/cn'
import { OnboardingSchema, type OnboardingInput } from '@/schemas/onboarding'

import { useOnboardCustomer } from '../hooks/useOnboarding'
import { CustomerStep, LocationStep, PlanStep, ScheduleStep, SummaryStep } from './OnboardingSteps'

const STEPS = ['Data pelanggan', 'Lokasi & jaringan', 'Paket', 'Jadwal instalasi', 'Ringkasan']
const STEP_FIELDS: FieldPath<OnboardingInput>[][] = [
  ['fullName', 'phone', 'email', 'ktp', 'npwp'],
  ['address', 'areaName'],
  ['planId'],
  ['technician', 'scheduledAt', 'note'],
]

// Guided 5-step flow (data → lokasi/jaringan → paket → jadwal → ringkasan) that
// provisions a new subscriber. Step bodies live in OnboardingSteps; field
// helpers in OnboardingFields — this shell owns form state, navigation, layout.
export function OnboardingWizard() {
  const [step, setStep] = useState(0)
  const navigate = useNavigate()
  const onboard = useOnboardCustomer()
  const planQuery = usePlanOptions()
  const odpQuery = useOdpList()

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
      odpId: '',
      ktp: '',
      npwp: '',
      consent: false,
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
      // useOnboardCustomer surfaces a toast (incl. 422 not-serviceable / 409 ODP full).
    }
  })

  const values = form.getValues()
  const planLabel = planQuery.data?.find((p) => p.value === values.planId)?.label ?? '—'
  const odpName = odpQuery.data?.items.find((o) => o.id === values.odpId)?.name ?? '—'

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
              {step === 0 ? <CustomerStep form={form} /> : null}
              {step === 1 ? <LocationStep form={form} /> : null}
              {step === 2 ? <PlanStep form={form} planQuery={planQuery} /> : null}
              {step === 3 ? <ScheduleStep form={form} /> : null}
              {step === 4 ? (
                <SummaryStep values={values} planLabel={planLabel} odpName={odpName} />
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
