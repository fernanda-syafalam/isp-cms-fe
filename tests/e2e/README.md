# tests/e2e/

Playwright tests. Two Playwright projects:

- **`chromium`** — critical-path E2E only (login, primary action per main
  feature, payment if applicable). 5–15 tests for the whole app. Run:
  `pnpm test:e2e`.
- **`visual`** — screenshot evidence gallery under `visual/`. Not a pass/fail
  assertion; it logs in and captures every page in `visual/harness.ts` at
  375 / 768 / 1440 px × light + dark, writing PNGs to
  `visual/__shots__/` (gitignored). Run: `pnpm shots`.

The screenshot suite is the per-PR design evidence for the UI/UX redesign:
capture before a change, capture after, and compare. Extend the `PAGES` list in
`visual/harness.ts` as the redesign sweep reaches each nav-group.

Requires Playwright browsers: `pnpm exec playwright install chromium`.

See CLAUDE.md › Testing Strategy.
