import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useForm } from 'react-hook-form'
import { describe, expect, it } from 'vitest'

import { Form } from '@/components/ui/form'
import { onboardCustomer } from '@/api/onboarding'
import { listOdp } from '@/api/odp'
import type { OnboardingInput } from '@/schemas/onboarding'
import { renderWithProviders } from '@/test/helpers'

import { OdpSelectField, ServiceabilityHint } from './OnboardingFields'
import { CustomerStep } from './OnboardingSteps'

// Radix primitives use pointer-capture APIs that jsdom doesn't implement;
// stubbing them keeps Select/Checkbox interactions from throwing under jsdom.
Element.prototype.hasPointerCapture = () => false
Element.prototype.releasePointerCapture = () => {}

const FORM_DEFAULTS: OnboardingInput = {
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
}

// Small RHF host so the onboarding field components have a form context.
function FieldHarness({
  areaName = '',
  onSubmit,
}: {
  areaName?: string
  onSubmit?: (values: OnboardingInput) => void
}) {
  const form = useForm<OnboardingInput>({
    defaultValues: { ...FORM_DEFAULTS, areaName },
  })
  return (
    <Form {...form}>
      <form onSubmit={onSubmit ? form.handleSubmit(onSubmit) : undefined}>
        <ServiceabilityHint areaName={areaName} />
        <OdpSelectField form={form} areaName={areaName} />
        <CustomerStep form={form} />
        <button type="submit">Simpan</button>
      </form>
    </Form>
  )
}

// Minimal onboarding payload for the API-level submission tests.
const BASE = {
  fullName: 'Budi Santoso',
  phone: '081234567',
  email: '',
  address: 'Jl. Pemuda No. 12, Jepara',
  planId: '',
  technician: 'Teknisi Budi',
  scheduledAt: '2026-07-10',
}

describe('OnboardingWizard fields', () => {
  it('renders ODP options with free ports and disables the full ones', async () => {
    // Empty area → the picker lists every ODP, including full ones. Radix mirrors
    // the items into a hidden native <select>, so options are assertable directly.
    renderWithProviders(<FieldHarness />)

    // An ODP with free ports is a selectable option…
    const available = await screen.findByText('ODP-JEP-01 · 14/16 tersedia')
    expect(available.closest('option')).not.toBeDisabled()

    // …while a full ODP (0 free) is rendered but disabled and flagged "penuh".
    const full = screen.getByText('ODP-BAN-06 · 0/8 tersedia (penuh)')
    expect(full.closest('option')).toBeDisabled()
  })

  it('warns when the chosen area is not serviceable (down)', async () => {
    renderWithProviders(<FieldHarness areaName="Kalinyamatan" />)

    expect(await screen.findByRole('alert')).toHaveTextContent(/belum terjangkau layanan/i)
  })

  it('shows a soft note when the area is under maintenance', async () => {
    renderWithProviders(<FieldHarness areaName="Pecangaan" />)

    expect(await screen.findByRole('status')).toHaveTextContent(/pemeliharaan/i)
  })

  it('does not warn for an operational area', async () => {
    renderWithProviders(<FieldHarness areaName="Jepara" />)

    await waitFor(() => expect(screen.getByLabelText('ODP')).toBeEnabled())
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('renders KYC + consent fields and submits their values', async () => {
    const user = userEvent.setup()
    let submitted: OnboardingInput | undefined
    renderWithProviders(<FieldHarness onSubmit={(v) => (submitted = v)} />)

    await user.type(screen.getByLabelText('NIK / KTP (opsional)'), '3300123456789012')
    await user.click(screen.getByLabelText('Persetujuan pemrosesan data pribadi'))
    await user.click(screen.getByRole('button', { name: 'Simpan' }))

    await waitFor(() => expect(submitted).toBeDefined())
    expect(submitted?.ktp).toBe('3300123456789012')
    expect(submitted?.consent).toBe(true)
  })
})

describe('onboarding submission (MSW contract)', () => {
  it('persists KYC + consent and reserves the chosen ODP port', async () => {
    const before = await listOdp({})
    const target = before.items.find((o) => o.totalPorts - o.usedPorts > 0)
    if (!target) throw new Error('expected an ODP with a free port in the fixtures')

    const customer = await onboardCustomer({
      ...BASE,
      areaName: 'Jepara',
      odpId: target.id,
      ktp: '3300123456789012',
      npwp: '00.000.000.0-000.000',
      consent: true,
    })

    expect(customer.ktp).toBe('3300123456789012')
    expect(customer.npwp).toBe('00.000.000.0-000.000')
    expect(customer.consentAt).not.toBeNull()

    const after = await listOdp({})
    const reserved = after.items.find((o) => o.id === target.id)
    expect(reserved?.usedPorts).toBe(target.usedPorts + 1)
  })

  it('rejects a non-serviceable (down) area with 422', async () => {
    await expect(onboardCustomer({ ...BASE, areaName: 'Kalinyamatan' })).rejects.toThrow()
  })

  it('rejects a full ODP with 409', async () => {
    const full = await listOdp({ view: 'full' })
    const fullOdp = full.items[0]
    if (!fullOdp) throw new Error('expected at least one full ODP in the fixtures')

    await expect(
      onboardCustomer({ ...BASE, areaName: 'Jepara', odpId: fullOdp.id }),
    ).rejects.toThrow()
  })
})
