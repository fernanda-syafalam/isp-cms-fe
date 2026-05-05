---
description: Generate behavior-focused tests for a target file
argument-hint: <file-path> [test-type: unit|component|integration|e2e]
allowed-tools: Bash, Read, Write
---

Generate tests for the target file following the Testing Strategy in CLAUDE.md.

## Input

- Target: $1 (file path)
- Test type (optional): $2 — auto-detect from file location if not provided:
  - `lib/**` -> unit (Vitest)
  - `schemas/**` -> unit (Vitest)
  - `hooks/**` -> integration (Vitest + Testing Library)
  - `components/**` -> component (Testing Library)
  - `routes/**` (critical paths) -> e2e (Playwright)
  - `api/**` -> integration with MSW

## Steps

1. Read CLAUDE.md "Testing Strategy" section.
2. Read the target file and understand its public API and behavior.
3. Identify the **observable behaviors** (not internal implementation).
4. For each behavior, write a test that:
   - Has a clear "Given / When / Then" structure (in test name and body).
   - Uses Testing Library queries in priority order (role > label > text > testid).
   - Mocks at the network layer (MSW) for API tests, not at function level.
   - Asserts user-visible outcomes, not internal state.
5. Place test next to source: `Foo.tsx` -> `Foo.test.tsx`.
6. Run the new tests and confirm they pass.

## What to test

- Primary happy path (rendered correctly with valid input)
- Empty / loading / error states (mandatory for any data-fetching component)
- Edge cases that have specific business logic
- User interactions that change state (click, type, submit)
- Accessibility (form has labels, button is keyboard-activatable)

## What NOT to test

- Trivial display components with no logic
- Third-party library behavior
- TypeScript-guaranteed properties (e.g., "props are passed through")
- Internal state shape (`useState` calls, hook call order)
- CSS classes (unless they encode meaningful semantics like `aria-current`)

## Component test template

```tsx
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi } from 'vitest'
import { ComponentName } from './ComponentName'

describe('ComponentName', () => {
  it('renders the primary content for valid input', () => {
    render(<ComponentName name="Acme Corp" />)
    expect(screen.getByRole('heading', { name: /Acme Corp/i })).toBeInTheDocument()
  })

  it('shows empty state when there is no data', () => {
    render(<ComponentName items={[]} />)
    expect(screen.getByText(/no items/i)).toBeInTheDocument()
  })

  it('calls onSubmit when user submits the form', async () => {
    const onSubmit = vi.fn()
    render(<ComponentName onSubmit={onSubmit} />)
    await userEvent.type(screen.getByLabelText(/email/i), 'user@example.com')
    await userEvent.click(screen.getByRole('button', { name: /save/i }))
    expect(onSubmit).toHaveBeenCalledWith({ email: 'user@example.com' })
  })
})
```

## Rules

- Test names describe behavior in plain English ("renders empty state when..." not "test1").
- Each test independent — no shared mutable state.
- No conditional logic in tests (no `if`, no `for` loops over assertions).
- Mock minimally — only what the test needs.
- If you find yourself testing implementation details, stop and ask whether the test should exist at all.
