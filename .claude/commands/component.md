---
description: Scaffold a new React component following CLAUDE.md patterns
argument-hint: <ComponentName> [feature-folder]
allowed-tools: Bash, Read, Write, Edit
---

Scaffold a new React component following the project's CLAUDE.md conventions.

## Input

- Component name: $1 (PascalCase)
- Feature folder (optional): $2 — if provided, place under `src/features/$2/components/`. Otherwise, ask user where it belongs.

## Steps

1. Read CLAUDE.md sections: "React Component Patterns", "Naming Conventions", "File Organization".
2. Determine target path:
   - If feature-folder given -> `src/features/$2/components/$1.tsx`
   - Else -> ask: "Is this a UI primitive (`components/ui/`), shared composite (`components/shared/`), or feature component? If feature, which feature?"
3. Generate the component file with:
   - Named export (function declaration)
   - Co-located `Props` type
   - Imports grouped (external, then internal)
4. Generate matching test file at the same level: `$1.test.tsx`
5. Run `pnpm tsc --noEmit` to verify no type errors.

## Component template

```tsx
type Props = {
  // TODO: define props
}

export function ComponentName({ }: Props) {
  return (
    <div>
      {/* TODO */}
    </div>
  )
}
```

## Test template

```tsx
import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { ComponentName } from './ComponentName'

describe('ComponentName', () => {
  it('renders', () => {
    render(<ComponentName />)
    // TODO: assert visible content
  })
})
```

## Rules

- Don't add unused props "for the future" (YAGNI).
- Don't add `forwardRef` unless component will be used as a form input or with focus management.
- Don't add memoization preemptively.
- Use named export, not default.
- Function declaration, not arrow function assigned to const.
- After scaffolding, ask user what props are needed and update accordingly.
