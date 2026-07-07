// The backend returns the raw `User-Agent` string for each session (no
// server-side device parsing). We derive a lightly humanized "Browser · OS"
// label here for display, without inventing anything we cannot read off the
// string (e.g. never a location). When we cannot recognize either the browser
// or the OS we fall back to the raw UA rather than fabricating a label.

export type ParsedUserAgent = {
  /** Human-facing label, e.g. `Chrome · macOS`. Bahasa Indonesia fallback. */
  label: string
  /** True when the OS is a mobile platform — drives the phone/laptop icon. */
  isMobile: boolean
}

function detectBrowser(ua: string): string | null {
  if (/edg/i.test(ua)) return 'Edge'
  if (/opr\/|opera/i.test(ua)) return 'Opera'
  if (/firefox|fxios/i.test(ua)) return 'Firefox'
  if (/chrome|crios|chromium/i.test(ua)) return 'Chrome'
  if (/safari/i.test(ua)) return 'Safari'
  return null
}

function detectOs(ua: string): { name: string; isMobile: boolean } | null {
  if (/iphone|ipad|ipod/i.test(ua)) return { name: 'iOS', isMobile: true }
  if (/android/i.test(ua)) return { name: 'Android', isMobile: true }
  if (/windows/i.test(ua)) return { name: 'Windows', isMobile: false }
  if (/mac os x|macintosh/i.test(ua)) return { name: 'macOS', isMobile: false }
  if (/linux/i.test(ua)) return { name: 'Linux', isMobile: false }
  return null
}

const MAX_RAW_LABEL = 48

export function parseUserAgent(ua: string): ParsedUserAgent {
  const raw = ua.trim()
  if (!raw || raw.toLowerCase() === 'unknown') {
    return { label: 'Perangkat tidak dikenal', isMobile: false }
  }
  const browser = detectBrowser(raw)
  const os = detectOs(raw)
  const isMobile = os?.isMobile ?? false
  if (browser && os) return { label: `${browser} · ${os.name}`, isMobile }
  if (browser) return { label: browser, isMobile }
  if (os) return { label: os.name, isMobile }
  const label = raw.length > MAX_RAW_LABEL ? `${raw.slice(0, MAX_RAW_LABEL - 1)}…` : raw
  return { label, isMobile }
}
