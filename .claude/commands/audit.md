---
description: Run a security and performance audit against CLAUDE.md baselines
argument-hint: [scope: security|performance|a11y|all]
allowed-tools: Bash, Read, Grep, Glob
---

Audit the codebase against the Security, Performance, and Accessibility sections of CLAUDE.md.

## Input

- Scope: $1 — one of `security`, `performance`, `a11y`, or `all` (default).

## Audit checks

### Security
- [ ] No secrets in source (search for common patterns: `sk_`, `password`, `secret`, `api_key`)
- [ ] No JWT in `localStorage`/`sessionStorage` (grep for these with token patterns)
- [ ] No `dangerouslySetInnerHTML` without DOMPurify nearby
- [ ] No `eval`, `new Function`, `Function(`
- [ ] No `target="_blank"` without `rel="noopener noreferrer"`
- [ ] All API responses validated with Zod (sample 5 random API calls and check)
- [ ] Env vars only `VITE_PUBLIC_*` or `NEXT_PUBLIC_*` are exposed
- [ ] Run `pnpm audit` and report critical/high vulnerabilities

### Performance
- [ ] Route components lazy-loaded (`lazy()` / `React.lazy`)
- [ ] No `import * as` from large libraries (date-fns, lodash, recharts)
- [ ] No `useMemo`/`useCallback` without justification (sample 5 and check)
- [ ] Lists with >100 items virtualized
- [ ] Images use proper sizes/formats (no raw `<img src="huge.jpg">`)
- [ ] Bundle size: run `pnpm build` and report main chunk size
- [ ] No moment.js (search imports)
- [ ] No `axios` if `ky`/`fetch` is also used

### Accessibility
- [ ] No `<div onClick>` (use `<button>`)
- [ ] All `<img>` have `alt`
- [ ] All form inputs have associated labels
- [ ] `<a href="#">` links flagged (use `<button>`)
- [ ] Color-only information flagged (errors should not be red-only)
- [ ] No `tabindex` >0 outside focus management contexts
- [ ] Run `pnpm playwright test --grep @a11y` if axe-core E2E exists

## Output format

For each scope, produce:

### CRITICAL (fix immediately)
- File:line — issue — recommendation

### WARNING (fix in current sprint)
- File:line — issue — recommendation

### INFO (improvement opportunity)
- File:line — observation — recommendation

End with a summary: count per severity.

## Rules

- Don't auto-fix. This is read-only audit.
- Don't flag issues that are already in TODO with ticket reference.
- Cite CLAUDE.md sections for every finding.
- If a section can't be audited via static checks (e.g., "test with screen reader"), say so explicitly and recommend manual testing.
