import { createFileRoute } from '@tanstack/react-router'

// Route stub only — component is code-split into _auth.tickets.$ticketId.lazy.tsx.
export const Route = createFileRoute('/_auth/tickets/$ticketId')({})
