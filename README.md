# AI-Assisted Development Setup

This repo is configured for **AI-first development** with [Claude Code](https://claude.com/claude-code). Every AI agent (Claude Code, and compatible tools) reads `CLAUDE.md` and operates under its rules.

## Files in this setup

```
.
├── CLAUDE.md                          # Project constitution — rules for AI agents
├── .claude/
│   ├── settings.json                  # Permissions, model, hooks
│   ├── commands/                      # Custom slash commands
│   │   ├── review.md                  #   /review  - review recent changes
│   │   ├── component.md               #   /component - scaffold new component
│   │   ├── refactor.md                #   /refactor - apply refactor principle
│   │   ├── audit.md                   #   /audit - security/perf/a11y audit
│   │   ├── test.md                    #   /test - generate tests
│   │   └── adr.md                     #   /adr - create ADR
│   └── agents/                        # Subagent definitions
│       ├── code-reviewer.md           #   @code-reviewer
│       ├── refactorer.md              #   @refactorer
│       └── test-writer.md             #   @test-writer
├── docs/ADR/                          # Architecture Decision Records
│   ├── README.md                      # ADR index and guide
│   └── template.md                    # ADR template
├── .github/
│   ├── PULL_REQUEST_TEMPLATE.md       # PR checklist tied to CLAUDE.md
│   └── COMMIT_CONVENTION.md           # Conventional Commits guide
└── .gitignore.additions               # Append to your .gitignore
```

## Getting started (new developer)

1. **Read `CLAUDE.md` once.** It's the single source of truth for how this codebase works.
2. **Skim `docs/ADR/`.** The "why" behind major decisions lives there.
3. **Install Claude Code** (or your AI tool of choice).
4. **Start coding.** When using AI:
   - Use `/review` before opening a PR.
   - Use `/component` to scaffold new components.
   - Use `/test` to generate behavior-focused tests.
   - Use `/audit` periodically for security/perf/a11y health checks.
   - Use `@code-reviewer`, `@refactorer`, or `@test-writer` for focused subagent help.

## How CLAUDE.md works

Claude Code reads `CLAUDE.md` automatically at session start. The file defines:

- **Engineering principles** — boring code wins, optimize for readers, fail loud.
- **Architecture rules** — strict layering, dependency direction, where things live.
- **Conventions** — naming, file organization, component anatomy.
- **NEVER and ALWAYS lists** — the most important sections. AI must not violate NEVER rules.
- **Decision rubrics** — how to choose state location, when to memoize, etc.
- **Communication protocol** — when AI should ask vs proceed.
- **Definition of Done** — checklist before claiming a task is complete.

If you find yourself fighting the AI, the fix is usually one of:

1. CLAUDE.md is missing a rule — add it.
2. CLAUDE.md is contradicting itself — resolve the conflict.
3. The task is genuinely ambiguous — clarify in the prompt.

## When to update CLAUDE.md

Update CLAUDE.md when:

- A new pattern emerges that should be repeated (e.g., "we use X for forms").
- An anti-pattern is spotted that should be banned.
- A rule turns out to be wrong or impractical (delete or revise — don't keep zombie rules).
- A library or convention changes.

**Don't update CLAUDE.md when:**

- The change affects only one file (just fix the file).
- The rule applies only to a specific feature (use the feature's README or ADR instead).
- You're trying to enforce personal style (use ESLint/Prettier instead).

## Slash commands cheat sheet

| Command | When to use |
|---|---|
| `/review` | Before opening a PR, after finishing a feature |
| `/component <Name> [feature]` | Creating a new component |
| `/refactor <file> [principle]` | Cleaning up a file or applying SOLID/DRY |
| `/audit [security\|performance\|a11y\|all]` | Periodic health check, before release |
| `/test <file> [type]` | Adding tests to untested code |
| `/adr <title>` | Documenting a significant decision |

## Subagents cheat sheet

| Agent | Use when |
|---|---|
| `@code-reviewer` | You want a skeptical, principal-engineer-level review |
| `@refactorer` | You want structure improved without behavior change |
| `@test-writer` | You want behavior-focused tests added |

## Discipline expectations

This setup is **opinionated** and **strict**. The bar is high because:

- Code we ship now will be maintained for 5+ years.
- Disciplined input from AI yields disciplined output. Loose rules yield loose code.
- The cost of a NEVER-list violation in production is far higher than the cost of catching it in review.

If a rule feels wrong, **debate it in an ADR**, not by silently breaking it.

## Maintenance

- **Quarterly**: review CLAUDE.md against actual codebase. Delete dead rules. Add missing ones.
- **On every CLAUDE.md change**: bump a small version note (`Last updated: YYYY-MM-DD`).
- **On dependency upgrade**: check if any rule references a deprecated API.

## Questions

If something in CLAUDE.md is unclear or appears wrong, raise it. The constitution is a living document, but it's only useful if everyone trusts it.
