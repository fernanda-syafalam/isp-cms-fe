# ADR-NNNN: [Short Title in Title Case]

- **Date**: YYYY-MM-DD
- **Status**: Proposed | Accepted | Deprecated | Superseded by ADR-NNNN
- **Deciders**: [list of names or roles]

## Context

What is the issue we're seeing that motivates this decision? What forces are at play (technical, political, social, project)?

State the problem in 2-5 sentences. Be specific. "We need better state management" is not a context. "Our app has 30+ React components passing the same data through 4+ levels of props" is.

## Decision

What did we decide? State it clearly in active voice.

> We will use TanStack Query for all server state.
> We will use Zustand for client-only global state.
> We will not introduce Redux to this codebase.

## Alternatives considered

What did we evaluate but reject? At minimum, list 2 alternatives. For each:

### Alternative 1: [Name]
- **Pros**:
- **Cons**:
- **Why rejected**:

### Alternative 2: [Name]
- **Pros**:
- **Cons**:
- **Why rejected**:

### Alternative 3: Do nothing
- **Pros**:
- **Cons**:
- **Why rejected**:

(Always consider "do nothing" — sometimes status quo is the right answer.)

## Consequences

What becomes easier? Harder? What new constraints does this impose? What's the migration path if we change our mind later?

### Positive
-

### Negative
-

### Neutral / risks
-

## Implementation notes

(Optional) Any specific guidance on how to roll this out, what files/teams are affected, any deprecation timeline.

## Related

- CLAUDE.md sections: [link to sections this affects]
- Related ADRs: [list]
- External references: [docs, articles, RFCs]
