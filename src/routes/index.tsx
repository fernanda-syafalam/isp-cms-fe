import { Link, createFileRoute } from '@tanstack/react-router'
import { ArrowRightIcon, Building2Icon, UsersIcon } from 'lucide-react'
import type { ComponentType } from 'react'

import { Card, CardContent } from '@/components/ui/card'
import { useCurrentUser } from '@/features/auth'

export const Route = createFileRoute('/')({
  component: HomePage,
})

type Section = {
  to: string
  label: string
  description: string
  icon: ComponentType<{ className?: string }>
}

const SECTIONS: Section[] = [
  {
    to: '/tenants',
    label: 'Tenants',
    description: 'Onboard and manage clinic tenants and their status.',
    icon: Building2Icon,
  },
  {
    to: '/users',
    label: 'Users',
    description: 'Create user accounts and manage roles and access.',
    icon: UsersIcon,
  },
]

function HomePage() {
  const { data: user } = useCurrentUser()

  return (
    <div className="space-y-8">
      <header>
        <h1 className="font-bold text-3xl tracking-tight">
          Welcome{user ? `, ${user.fullName}` : ''}
        </h1>
        <p className="mt-2 text-muted-foreground">Manage tenants and users from one place.</p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2">
        {SECTIONS.map((section) => (
          <SectionCard key={section.to} section={section} />
        ))}
      </div>
    </div>
  )
}

function SectionCard({ section }: { section: Section }) {
  const Icon = section.icon
  return (
    <Link to={section.to} className="group block focus-visible:outline-none">
      <Card className="transition-shadow group-hover:shadow-md group-focus-visible:ring-2 group-focus-visible:ring-ring">
        <CardContent className="flex items-start gap-4 pt-6">
          <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Icon className="size-5" />
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-2">
              <h2 className="font-semibold text-base">{section.label}</h2>
              <ArrowRightIcon className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
            </div>
            <p className="mt-1 text-muted-foreground text-sm">{section.description}</p>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
