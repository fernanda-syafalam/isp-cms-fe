import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/')({
  component: HomePage,
})

function HomePage() {
  return (
    <section>
      <h1 className="text-2xl font-semibold">SaaS Clinic Controller</h1>
      <p className="mt-2 text-sm text-gray-600">
        Boilerplate ready. Edit <code>src/routes/index.tsx</code> to start.
      </p>
    </section>
  )
}
