# Architecture Decision Records

This directory contains the Architecture Decision Records (ADRs) for this project. ADRs document significant technical decisions — what was decided, what alternatives were considered, and why.

## Index

| #                                          | Title                                                            | Status   | Date       |
| ------------------------------------------ | ---------------------------------------------------------------- | -------- | ---------- |
| [0001](./0001-frontend-stack-selection.md) | Frontend Stack Selection                                         | Accepted | 2026-05-05 |
| [0002](./0002-auth-strategy.md)            | Auth Strategy — In-Memory Access Token + HttpOnly Refresh Cookie | Accepted | 2026-05-05 |

(Add new entries here as ADRs are created. Newest at the bottom.)

## How to write an ADR

1. Copy `template.md` to `NNNN-short-title-in-kebab-case.md` where NNNN is the next zero-padded number.
2. Fill in the sections. Be specific. Vague ADRs are useless.
3. Submit as a PR. ADRs are reviewed and discussed like code.
4. After acceptance, update this index.

You can also use the slash command `/adr <title>` to create an ADR with the template pre-filled.

## When to write an ADR

Write an ADR when the decision:

- Constrains future code (e.g., "no class components allowed").
- Picks one of several viable libraries/frameworks for a job.
- Adopts a new architectural pattern (state management, auth flow, data fetching).
- Rejects something that's commonly recommended (with reasons).
- Affects build, deploy, or team workflow.

Don't write an ADR for:

- Routine library updates (changelog covers it).
- Single-file refactors.
- Personal style preferences (use CLAUDE.md instead).

## Status lifecycle

- **Proposed** — under discussion, not yet in effect.
- **Accepted** — agreed upon and applies to all new code.
- **Deprecated** — no longer recommended; existing code may still use it.
- **Superseded by ADR-NNNN** — replaced by a newer decision (link to it).

ADRs are immutable once Accepted. To change a decision, write a new ADR that supersedes the old one. Don't edit history.

## Tips

- **Be specific.** Name actual files, libraries, versions, dates.
- **Show your work.** Document alternatives even if rejected — future readers benefit.
- **Future-you is the reader.** In 18 months, will you remember why?
- **Link to CLAUDE.md.** Many ADRs result in CLAUDE.md updates — link them.
