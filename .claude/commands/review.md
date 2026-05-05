---
description: Review recent changes (staged or last commit) against CLAUDE.md
allowed-tools: Bash, Read
---

You are reviewing code changes against the project constitution in CLAUDE.md.

## Steps

1. Run `git diff --staged` to see staged changes. If empty, run `git diff HEAD~1` for the last commit.
2. Read CLAUDE.md to refresh the rules in your context.
3. For each file in the diff, evaluate against:
   - NEVER list violations (highest severity)
   - ALWAYS list omissions (high severity)
   - Architecture rules (layering, naming, file organization)
   - TypeScript rules (`any`, `as`, type safety)
   - React patterns (component anatomy, state hierarchy)
   - Testing coverage for new behavior
   - Accessibility for new UI
   - Security (auth, validation, sanitization)

## Output format

Produce a review with three severity tiers:

### Blockers (must fix before merge)
- File:line — description — suggested fix

### Concerns (should address)
- File:line — description — suggested fix

### Suggestions (nice to have)
- File:line — description — suggested fix

If no issues, say so explicitly with "No issues found per CLAUDE.md."

## Rules

- Be specific. Cite line numbers and exact rules from CLAUDE.md.
- Don't restate the rule — explain why it applies here.
- Don't nitpick formatting (Prettier handles that).
- If you're uncertain, say "Consider:" instead of "Must:".
- Suggest concrete code for fixes when possible.
