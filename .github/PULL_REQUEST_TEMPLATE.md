# Pull Request

## Summary

<!-- 1-3 sentences describing what this PR does and why. -->

## Type of change

<!-- Mark with x -->

- [ ] Bug fix (non-breaking change that fixes an issue)
- [ ] New feature (non-breaking change that adds functionality)
- [ ] Breaking change (fix or feature that changes existing behavior)
- [ ] Refactor (no behavior change)
- [ ] Performance improvement
- [ ] Documentation update
- [ ] Build / CI / tooling

## Related issues / ADRs

<!-- Link tickets and ADRs. e.g., Closes #123, Implements ADR-0007 -->

## Checklist

### Code quality
- [ ] Follows CLAUDE.md (NEVER list, ALWAYS list, naming, layering)
- [ ] No `any`, no `as` (except `as const` or post-Zod), no `!`, no `@ts-ignore`
- [ ] Files <400 lines, components <200 lines, functions <50 lines
- [ ] Named exports, function declarations for components
- [ ] No commented-out code, no `console.log`, no untracked TODOs

### Tests
- [ ] New behavior has tests (unit / component / integration / E2E as appropriate)
- [ ] Tests describe behavior, not implementation
- [ ] All tests pass locally (`pnpm test`)
- [ ] Lint passes (`pnpm lint`)
- [ ] Type check passes (`pnpm tsc --noEmit`)

### Data & API
- [ ] API responses validated with Zod at boundary
- [ ] URL search params validated with Zod (if applicable)
- [ ] Forms use single Zod schema as source of truth (if applicable)

### UX
- [ ] Loading state present (skeleton, not spinner)
- [ ] Error state with friendly message and next action
- [ ] Empty state for any list/grid that can be empty
- [ ] Mobile / responsive verified (if user-facing)

### Accessibility
- [ ] Semantic HTML (no `div onClick`, no `<a href="#">` for buttons)
- [ ] Form inputs have associated labels
- [ ] Keyboard navigation works (Tab order, focus visible, no traps)
- [ ] Color contrast ≥ 4.5:1 for text
- [ ] `aria-live` for async announcements (if applicable)

### Security
- [ ] No secrets in code or commits
- [ ] No JWT in `localStorage`/`sessionStorage`
- [ ] No `dangerouslySetInnerHTML` without DOMPurify
- [ ] Env vars only `VITE_*` / `NEXT_PUBLIC_*` are public

### Performance
- [ ] Routes lazy-loaded (if adding new route)
- [ ] No unnecessary `useMemo`/`useCallback`
- [ ] Lists with >100 items virtualized
- [ ] No large dependencies introduced without justification

### Documentation
- [ ] CLAUDE.md updated if new pattern was introduced
- [ ] ADR created if architectural decision was made
- [ ] README updated if setup/scripts changed
- [ ] Public APIs documented (component props, hook signatures)

## Screenshots / videos

<!-- For UI changes, attach before/after screenshots or a short screen recording. -->

## Notes for reviewer

<!-- Anything specific to call attention to: tricky areas, deliberate trade-offs, follow-ups. -->
