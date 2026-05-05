---
description: Refactor a file or function applying a specific principle from CLAUDE.md
argument-hint: <file-path> [principle: srp|dry|composition|extract-hook|extract-component]
allowed-tools: Bash, Read, Edit
---

Apply a focused, conservative refactor to the target file.

## Input

- Target: $1 (file path or function name)
- Principle (optional): $2 — one of:
  - `srp` — Single Responsibility (split mixed concerns)
  - `dry` — De-duplicate (3+ repetitions only)
  - `composition` — Replace boolean prop explosion with composition
  - `extract-hook` — Move logic into a custom hook
  - `extract-component` — Pull subtree into its own component

If principle is omitted, analyze the file and propose the most impactful refactor first — wait for user confirmation before applying.

## Steps

1. Read CLAUDE.md to refresh principles.
2. Read the target file (and direct dependencies if needed for context).
3. Identify violations or improvement opportunities (max 3).
4. Propose changes WITH rationale referencing CLAUDE.md sections.
5. Wait for user confirmation if changes touch >2 files or change public API.
6. Apply changes in small, reviewable edits.
7. Run `pnpm tsc --noEmit && pnpm lint && pnpm test` and report results.

## Rules — non-negotiable

- **Behavior must not change.** A refactor that changes behavior is a feature, not a refactor.
- **No premature abstraction.** If pattern appears 2 times, leave it. Extract on the third.
- **No speculative generality.** Don't add config options "for future flexibility".
- **Tests must still pass.** If they don't, the refactor changed behavior — revert.
- **Small commits.** Multiple atomic refactors > one giant rewrite.
- **Stop and ask** if the refactor reveals a deeper design problem that goes beyond the current scope.

## Output format

After completing:
1. Summary of changes (1-2 sentences each)
2. CLAUDE.md sections that justified the change
3. Test/lint/typecheck results
4. Any follow-up suggestions (don't apply them now)
