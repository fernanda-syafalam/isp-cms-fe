---
description: Create a new Architecture Decision Record
argument-hint: <decision-title>
allowed-tools: Bash, Read, Write
---

Create a new ADR (Architecture Decision Record) documenting an important technical decision.

## Input

- Title: $1 (short kebab-case slug, e.g., "use-tanstack-query-for-server-state")

## Steps

1. List existing ADRs in `docs/ADR/` to determine the next number.
2. Read `docs/ADR/template.md` for the structure.
3. Create `docs/ADR/NNNN-$1.md` where NNNN is the next zero-padded number.
4. Pre-fill: date (today), status ("Proposed"), title (from $1, prettified).
5. Ask the user to fill in:
   - Context (what problem are we solving)
   - Decision (what we decided)
   - Alternatives considered (what we rejected and why)
   - Consequences (what changes because of this — good and bad)
6. After user fills in, update `docs/ADR/README.md` index with the new entry.

## When to write an ADR

Write an ADR when:
- Choosing between multiple viable libraries/frameworks for the same job.
- Adopting a new architectural pattern (state mgmt, data fetching, auth flow).
- Deciding to NOT do something widely recommended (with reasons).
- Setting a policy that constrains future code (e.g., "no class components").
- Adopting/dropping a tool that affects build, deploy, or team workflow.

## When NOT to write an ADR

- Routine library updates (use changelog).
- Small bug fixes or features.
- Decisions that affect only one file.
- Personal style preferences (use CLAUDE.md instead).

## Status lifecycle

- **Proposed** -> under discussion
- **Accepted** -> agreed and in effect
- **Deprecated** -> no longer recommended but tolerated for legacy code
- **Superseded by ADR-NNNN** -> replaced by another decision (link the new one)

ADRs are immutable once Accepted. To change a decision, write a new ADR that supersedes the old one.
