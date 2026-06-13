import { renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { useGeolocation } from './useGeolocation'

const { toastError } = vi.hoisted(() => ({ toastError: vi.fn() }))
vi.mock('sonner', () => ({ toast: { error: toastError, success: vi.fn() } }))

const watchPosition = vi.fn()
const clearWatch = vi.fn()

beforeEach(() => {
  watchPosition.mockReset()
  clearWatch.mockReset()
  toastError.mockReset()
  Object.defineProperty(globalThis.navigator, 'geolocation', {
    configurable: true,
    value: { watchPosition, clearWatch },
  })
})

describe('useGeolocation', () => {
  it('reports the position once a fix arrives', async () => {
    watchPosition.mockImplementation((success: PositionCallback) => {
      success({
        coords: { latitude: -6.55, longitude: 110.68, accuracy: 12 },
      } as GeolocationPosition)
      return 7
    })

    const { result } = renderHook(() => useGeolocation(true))

    await waitFor(() =>
      expect(result.current.position).toEqual({
        lat: -6.55,
        lng: 110.68,
        accuracy: 12,
      }),
    )
  })

  it('shows one Bahasa toast when permission is denied and stays null', async () => {
    watchPosition.mockImplementation(
      (_success: PositionCallback, error?: PositionErrorCallback) => {
        error?.({ code: 1, PERMISSION_DENIED: 1 } as GeolocationPositionError)
        return 7
      },
    )

    const { result } = renderHook(() => useGeolocation(true))

    await waitFor(() => expect(toastError).toHaveBeenCalledTimes(1))
    expect(toastError).toHaveBeenCalledWith(expect.stringMatching(/izin lokasi ditolak/i))
    expect(result.current.position).toBeNull()
  })

  it('never starts a watch while disabled', () => {
    renderHook(() => useGeolocation(false))
    expect(watchPosition).not.toHaveBeenCalled()
  })

  it('clears the watch on unmount', () => {
    watchPosition.mockReturnValue(7)
    const { unmount } = renderHook(() => useGeolocation(true))
    unmount()
    expect(clearWatch).toHaveBeenCalledWith(7)
  })
})
