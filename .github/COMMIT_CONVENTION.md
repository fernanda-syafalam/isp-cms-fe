# Commit Convention

We follow [Conventional Commits](https://www.conventionalcommits.org/) v1.0.0.

## Format

```
<type>(<scope>): <subject>

[optional body]

[optional footer(s)]
```

## Examples

```
feat(tenants): add bulk suspend action

fix(auth): refresh token race condition during concurrent requests

refactor(tenants): split TenantPage into TenantHeader and TenantBody

test(api): cover error mapping for 422 responses

docs(adr): add ADR-0008 for state management hierarchy

chore(deps): bump @tanstack/react-query from 5.60 to 5.61
```

## Type

| Type | When to use |
|---|---|
| `feat` | New feature for the user |
| `fix` | Bug fix for the user |
| `docs` | Documentation only changes |
| `style` | Formatting, missing semicolons, etc. (no logic change) |
| `refactor` | Code change that neither fixes a bug nor adds a feature |
| `perf` | Performance improvement |
| `test` | Adding or updating tests |
| `build` | Changes to build system or dependencies |
| `ci` | Changes to CI configuration |
| `chore` | Maintenance, dependency bumps, repo hygiene |
| `revert` | Reverts a previous commit |

## Scope

Optional but recommended. Use the area of the codebase:
- Feature folder name: `tenants`, `auth`, `metrics`, `onboarding`
- Layer: `api`, `hooks`, `ui`, `lib`
- Tooling: `deps`, `ci`, `eslint`, `vite`

## Subject

- Imperative, present tense ("add" not "added" or "adds").
- No capital letter at start.
- No period at end.
- Max 72 characters.

## Body

- Use to explain **what** and **why**, not how.
- Wrap at 72 characters.
- Separate from subject with blank line.

## Footer

- Reference issues: `Closes #123`, `Refs #456`.
- Breaking changes: start with `BREAKING CHANGE:` and explain migration.

```
feat(auth): change login to require 2FA

BREAKING CHANGE: All users must enroll in 2FA before next login.
Migration: existing users will be prompted on first login after deploy.

Closes #234
```

## Why bother?

- **Automated changelogs** — tools like `standard-version` or `release-please` generate releases automatically.
- **Searchable history** — `git log --grep "fix(tenants)"` finds all tenant bug fixes.
- **Code review signal** — reviewers know what to expect before reading the diff.
- **Discipline** — forces you to think about *what kind of change* this actually is.

## Anti-patterns

```
# BAD
git commit -m "wip"
git commit -m "fixed bug"
git commit -m "Update TenantPage.tsx"
git commit -m "stuff"

# GOOD
git commit -m "fix(tenants): prevent double-submit on suspend dialog"
```

A good commit message is a gift to your future self and your team.
