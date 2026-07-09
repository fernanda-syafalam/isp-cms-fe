import { createFileRoute } from '@tanstack/react-router'

// Route stub only — component is code-split into _auth.network.devices.$deviceId.lazy.tsx.
export const Route = createFileRoute('/_auth/network/devices/$deviceId')({})
