# lib/

Pure utilities. **No React, no DOM, no side effects.**

## Layout

Group by domain — never a catch-all `utils.ts`.

```
lib/
├── errors.ts       # AppError, getErrorMessage
├── format/         # formatCurrency, formatDate (per file)
└── date/           # parseISO, addDays
```

## Rules

- Pure functions only. Same input → same output.
- No imports from `components/`, `hooks/`, `api/`, `features/`.
- Easy to unit test in isolation — aim for 80%+ coverage here.
