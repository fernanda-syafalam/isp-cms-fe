import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import {
  CUSTOMER_EXPORT_LIMIT,
  type CustomerFilter,
  activateCustomer,
  createCustomer,
  getCustomer,
  changeCustomerPlan,
  isolateCustomer,
  listCustomers,
  notifyWhatsapp,
  rebootOnu,
  recordConsent,
  relocateCustomer,
  requestDataDeletion,
  resumeCustomer,
  setOnuWifi,
  stopCustomer,
  suspendCustomer,
  updateCustomer,
  updateKyc,
} from '@/api/customers'
import { getErrorMessage } from '@/lib/errors'
import type {
  ChangePlanInput,
  Customer,
  CreateCustomerInput,
  RelocateCustomerInput,
  SetWifiInput,
  UpdateKycInput,
} from '@/schemas/customer'

export function useCustomersList(filter: CustomerFilter = {}) {
  return useQuery({
    queryKey: ['customers', 'list', filter] as const,
    queryFn: () => listCustomers(filter),
  })
}

// Export-all: fetch one max-size page that honours the current filter (status +
// branch scope + search) but ignores paging, for a CSV download.
export function useExportCustomers() {
  const qc = useQueryClient()
  return (filter: CustomerFilter) => {
    const exportFilter = { ...filter, limit: CUSTOMER_EXPORT_LIMIT, offset: 0 }
    return qc.fetchQuery({
      queryKey: ['customers', 'list', exportFilter] as const,
      queryFn: () => listCustomers(exportFilter),
    })
  }
}

export function useCustomer(id: string) {
  return useQuery({
    queryKey: ['customers', 'detail', id] as const,
    queryFn: () => getCustomer(id),
  })
}

export function useCreateCustomer() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: CreateCustomerInput) => createCustomer(input),
    onSuccess: (customer) => {
      qc.invalidateQueries({ queryKey: ['customers'] })
      toast.success(`Pelanggan "${customer.fullName}" dibuat`)
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  })
}

function syncCustomerCaches(qc: ReturnType<typeof useQueryClient>, customer: Customer) {
  qc.setQueryData(['customers', 'detail', customer.id], customer)
  qc.invalidateQueries({ queryKey: ['customers', 'list'] })
  // Lifecycle changes (aktif/isolir/berhenti) flip the customer's topology node.
  qc.invalidateQueries({ queryKey: ['topology'] })
}

export function useIsolateCustomer() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => isolateCustomer(id),
    onSuccess: (customer) => {
      syncCustomerCaches(qc, customer)
      toast.success(`Pelanggan "${customer.fullName}" diisolir`)
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  })
}

export function useActivateCustomer() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => activateCustomer(id),
    onSuccess: (customer) => {
      syncCustomerCaches(qc, customer)
      toast.success(`Pelanggan "${customer.fullName}" diaktifkan`)
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  })
}

// Bulk isolir / aktivasi over selected ids (one summary toast).
export function useBulkCustomerStatus() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ ids, action }: { ids: string[]; action: 'isolate' | 'activate' }) => {
      const fn = action === 'isolate' ? isolateCustomer : activateCustomer
      await Promise.all(ids.map((id) => fn(id)))
      return { count: ids.length, action }
    },
    onSuccess: ({ count, action }) => {
      qc.invalidateQueries({ queryKey: ['customers'] })
      qc.invalidateQueries({ queryKey: ['analytics'] })
      qc.invalidateQueries({ queryKey: ['topology'] })
      toast.success(
        action === 'isolate' ? `${count} pelanggan diisolir` : `${count} pelanggan diaktifkan`,
      )
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  })
}

export function useUpdateCustomer(id: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: CreateCustomerInput) => updateCustomer(id, input),
    onSuccess: (customer) => {
      syncCustomerCaches(qc, customer)
      toast.success(`Pelanggan "${customer.fullName}" diperbarui`)
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  })
}

export function useChangePlan(id: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: ChangePlanInput) => changeCustomerPlan(id, input),
    onSuccess: (customer) => {
      syncCustomerCaches(qc, customer)
      qc.invalidateQueries({ queryKey: ['invoices'] })
      qc.invalidateQueries({ queryKey: ['analytics'] })
      toast.success(`Paket "${customer.fullName}" diubah ke ${customer.planName}`)
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  })
}

export function useStopCustomer() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => stopCustomer(id),
    onSuccess: (customer) => {
      syncCustomerCaches(qc, customer)
      toast.success(`Pelanggan "${customer.fullName}" dihentikan`)
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  })
}

// UU PDP: consent, KYC capture, and data-subject erasure request.
export function useRecordConsent(id: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: () => recordConsent(id),
    onSuccess: (customer) => {
      syncCustomerCaches(qc, customer)
      toast.success('Persetujuan pemrosesan data dicatat')
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  })
}

export function useUpdateKyc(id: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: UpdateKycInput) => updateKyc(id, input),
    onSuccess: (customer) => {
      syncCustomerCaches(qc, customer)
      toast.success('Data KYC diperbarui')
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  })
}

export function useRequestDataDeletion(id: string) {
  return useMutation({
    mutationFn: () => requestDataDeletion(id),
    onSuccess: () => toast.success('Permintaan hapus data dicatat'),
    onError: (err) => toast.error(getErrorMessage(err)),
  })
}

export function useRelocateCustomer(id: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: RelocateCustomerInput) => relocateCustomer(id, input),
    onSuccess: (customer) => {
      syncCustomerCaches(qc, customer)
      toast.success(
        `Pelanggan "${customer.fullName}" dimutasi ke ${customer.areaName ?? 'alamat baru'}`,
      )
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  })
}

// Voluntary suspend (berhenti sementara) + resume, at the customer's request.
export function useSuspendCustomer() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => suspendCustomer(id),
    onSuccess: (customer) => {
      syncCustomerCaches(qc, customer)
      toast.success(`Pelanggan "${customer.fullName}" dihentikan sementara`)
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  })
}

export function useResumeCustomer() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => resumeCustomer(id),
    onSuccess: (customer) => {
      syncCustomerCaches(qc, customer)
      toast.success(`Pelanggan "${customer.fullName}" diaktifkan kembali`)
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  })
}

export function useRebootOnu(id: string) {
  return useMutation({
    mutationFn: () => rebootOnu(id),
    onSuccess: () => toast.success('Perintah reboot ONU dikirim'),
    onError: (err) => toast.error(getErrorMessage(err)),
  })
}

export function useSetOnuWifi(id: string) {
  return useMutation({
    mutationFn: (input: SetWifiInput) => setOnuWifi(id, input),
    onSuccess: () => toast.success('Pengaturan WiFi ONU diperbarui'),
    onError: (err) => toast.error(getErrorMessage(err)),
  })
}

export function useNotifyWhatsapp(id: string) {
  return useMutation({
    mutationFn: () => notifyWhatsapp(id),
    onSuccess: () => toast.success('Pengingat WhatsApp terkirim'),
    onError: (err) => toast.error(getErrorMessage(err)),
  })
}
