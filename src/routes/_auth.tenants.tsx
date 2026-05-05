import { createFileRoute } from '@tanstack/react-router'

// Route definition only — the component lives in _auth.tenants.lazy.tsx so it
// is fetched on demand. Anything that must run before the chunk loads (loaders,
// search params, beforeLoad) belongs here.
export const Route = createFileRoute('/_auth/tenants')({})
