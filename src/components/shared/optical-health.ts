import type { StatusTone } from '@/components/shared/status-badge'

// Shared GPON RX optical-power helpers, used by the device and customer views.
// Single source so the badge tone and the field diagnosis can't drift apart.

// GPON optical health: healthy ≳ −25 dBm, marginal −25…−27, bad < −27.
export function rxTone(dbm: number | null): StatusTone {
  if (dbm == null) return 'neutral'
  if (dbm >= -25) return 'success'
  if (dbm >= -27) return 'warning'
  return 'danger'
}

// Field-tech diagnosis for an ONT's RX power: what to check at the premises.
export function rxDiagnosis(dbm: number): string {
  if (dbm >= -25) return 'Sinyal sehat — dalam rentang normal GPON (≥ −25 dBm).'
  if (dbm >= -27)
    return 'Redaman agak tinggi — pantau; cek konektor kotor atau tekukan kabel (bend).'
  if (dbm >= -30)
    return 'Redaman tinggi — kemungkinan konektor kotor, splice buruk, atau jarak/splitter berlebih.'
  return 'Sinyal kritis / mendekati LOS — cek drop cable putus, konektor, atau core di ODP.'
}
