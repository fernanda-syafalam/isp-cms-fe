import { useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'

export type GeoPosition = { lat: number; lng: number; accuracy: number }

// Watches the device location while `enabled` is true — the basis for the field
// technician's "you are here" marker, distance-to-node, and "nearest free ODP".
// The effect re-subscribes only when `enabled` flips (not on every position
// update), so the GPS stream can't trigger a render loop. Permission/availability
// failures show one Bahasa toast (not one per failed reading). Returns null while
// disabled so the map marker disappears when the technician turns it off.
export function useGeolocation(enabled: boolean): {
  position: GeoPosition | null
  isLocating: boolean
} {
  const [position, setPosition] = useState<GeoPosition | null>(null)
  const [isLocating, setIsLocating] = useState(false)
  const errorShown = useRef(false)

  useEffect(() => {
    if (!enabled) return
    if (!('geolocation' in navigator)) {
      toast.error('Perangkat ini tidak mendukung geolokasi.')
      return
    }
    setIsLocating(true)
    errorShown.current = false
    const watchId = navigator.geolocation.watchPosition(
      (p) => {
        setIsLocating(false)
        setPosition({
          lat: p.coords.latitude,
          lng: p.coords.longitude,
          accuracy: p.coords.accuracy,
        })
      },
      (err) => {
        setIsLocating(false)
        if (errorShown.current) return
        errorShown.current = true
        toast.error(
          err.code === err.PERMISSION_DENIED
            ? 'Izin lokasi ditolak. Aktifkan izin lokasi di pengaturan browser.'
            : 'Lokasi tidak tersedia saat ini.',
        )
      },
      { enableHighAccuracy: true, maximumAge: 10_000, timeout: 15_000 },
    )
    return () => navigator.geolocation.clearWatch(watchId)
  }, [enabled])

  return {
    position: enabled ? position : null,
    isLocating: enabled ? isLocating : false,
  }
}
