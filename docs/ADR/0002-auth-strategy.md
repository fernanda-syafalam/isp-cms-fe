# ADR-0002: Auth Strategy — In-Memory Access Token + HttpOnly Refresh Cookie

- **Date**: 2026-05-05
- **Status**: Accepted (implemented end-to-end 2026-06-04)
- **Deciders**: sanjit@xprogroup.com.au

> **Implementation note 2026-06-04**: the `boilerplate-nestjs` backend now
> implements this exact cookie model — refresh token delivered as an httpOnly
> cookie, rotated server-side, read from the cookie on `/auth/refresh`. The
> **authoritative, versioned contract** (paths live under `/v1`, identity shape
> `{ id, email, fullName, role }`) is the workspace ADR
> `../../../docs/ADR/0002-shared-auth-contract.md`. Where the endpoint paths in
> this document omit `/v1`, the workspace ADR wins.

## Context

The `saas-clinic-controller` admin app authenticates internal operators of clinic tenants. We need a story for: how the access credential travels with each API call, where it lives between calls, how it survives a hard refresh, and how it gets cleared on logout. The decision shapes every API hook, the route guard, and the backend's session model — it has to be settled before any feature touches `/me`-gated data.

Constraints we are designing under:

- **No public-facing surface**. The app is auth-gated end to end, so we are optimising for internal-operator UX, not anonymous traffic.
- **AI-assisted development**. Patterns must be obvious so generated code falls into the right shape on the first try.
- **CLAUDE.md security baseline**. Tokens must not be reachable from JS via DOM storage; secrets must live where XSS cannot read them.
- **Backend is in our control** but treated as a contract — the frontend has to specify what the backend must deliver.

## Decision

We will use an **in-memory access token** (held in a Zustand store) paired with an **HttpOnly secure refresh cookie** owned by the backend, plus a **single-flight 401 refresh** in the API client.

Concretely:

> 1. **Access token** lives only in `useAuthStore.accessToken` (Zustand, memory-only). It never enters `localStorage`, `sessionStorage`, or any non-HttpOnly cookie.
> 2. **Refresh token** is a `HttpOnly`, `Secure`, `SameSite=Lax` cookie set by the backend on `POST /auth/login`. The frontend cannot read it, only the browser can attach it on requests.
> 3. **Every auth-relevant request** sends `credentials: 'include'` so the refresh cookie travels.
> 4. **`api/client.ts`** injects `Authorization: Bearer <token>` on each outgoing request via a `beforeRequest` hook. On a 401 response (excluding `/auth/login` and `/auth/refresh`), it triggers a **single-flight** `refreshAccessToken()` — concurrent failed requests share one in-flight refresh promise — then replays each original request with the new token.
> 5. **Hard refresh / new tab** triggers a silent `refreshSession()` from `_auth.tsx`'s `beforeLoad`. If the cookie is still valid, the user lands without a login prompt. If not, redirect to `/login?from=<url>`.
> 6. **Logout** clears `useAuthStore` _and_ `queryClient.clear()` even if the server logout call fails (the user has chosen to leave; do not punish them for backend hiccups).

## Alternatives considered

### Alternative 1: Tokens in localStorage / sessionStorage

- **Pros**:
  - Simplest. JS reads/writes directly, survives refresh without a refresh round-trip.
  - Works without backend cookie cooperation — the frontend can be self-sufficient.
- **Cons**:
  - **Reachable by any XSS payload**. One injected script across the app's lifetime exfiltrates every active session.
  - Tokens live as long as the user does not explicitly clear, encouraging long-lived JWTs which compound the leak risk.
- **Why rejected**: CLAUDE.md security NEVER list bans this outright, and the threat model (admin operator access) makes a single XSS catastrophic. Dismissed without further weighing.

### Alternative 2: Cookie-only auth (no Authorization header)

- **Pros**:
  - Cleanest from an XSS standpoint — no JS-readable credential ever exists.
  - Simpler client: every request just inherits the cookie.
- **Cons**:
  - **CSRF surface** opens up. We would need either `SameSite=Strict` (which breaks legitimate cross-site flows like email-link login) or an explicit CSRF token mechanism.
  - Harder to integrate with API gateways, server-side service-to-service calls, or future mobile clients that expect Bearer tokens.
  - Logging and debugging is harder — Bearer in the `Authorization` header is grep-able in logs in a way `Cookie` is not (and `Cookie` shouldn't be logged at all).
- **Why rejected**: We would trade XSS exposure for CSRF exposure plus integration friction. The chosen pattern keeps Bearer for transport but limits the attack window by holding it in memory.

### Alternative 3: OAuth/OIDC via a managed identity provider (Auth0, Clerk, WorkOS)

- **Pros**:
  - Battle-tested. Outsource MFA, password reset, audit logs, anomaly detection.
  - Quick start, robust SDK.
- **Cons**:
  - Vendor lock-in for an internal app where the user list is the clinic operator team — the IdP value is largely wasted.
  - Recurring cost per active user, scaling with growth that should belong to the product.
  - For an app this small, the ceremony of an external IdP (callback URLs, JWT verification key rotation, SDK updates) is more code than the in-house pattern.
  - Compliance: clinic operator identities arguably belong inside the same data boundary as patient-adjacent records.
- **Why rejected**: Build-vs-buy framework — auth is **not commodity here** because the user set is operator-scoped and the data sensitivity argues for staying in-house. Re-evaluate if/when we open self-serve clinic onboarding (then a managed IdP becomes a real candidate).

### Alternative 4: Do nothing — basic auth or shared API key

- **Pros**: Zero effort.
- **Cons**: Catastrophic in production for an app touching clinic data. Off the table.
- **Why rejected**: Not a real option; included for completeness.

## Consequences

### Positive

- **XSS leak window is bounded** by the lifetime of the in-memory store — a script injected into one tab exfiltrates only that tab's current token, not a forever-valid JWT in localStorage.
- **Single-flight refresh** prevents the refresh-storm pattern where N parallel 401s each fire a refresh, the backend accepts the first and rejects the rest, and the user is bounced to login despite a valid cookie.
- **Logout is symmetric** — `useAuthStore.clear()` + `queryClient.clear()` happens unconditionally, so a flaky backend cannot trap a user in a half-logged-out state.
- **The contract with the backend is small and explicit** — four endpoints, documented in `src/api/auth.ts`. Easy to mock (MSW handlers in `src/test/msw/handlers.ts`) and easy to test (single-flight property covered in `src/api/client.test.ts`).

### Negative

- **First navigation after a refresh costs one round-trip** (`/auth/refresh`) before any data fetch starts. Users see a brief blank state on the protected route until the refresh resolves. Mitigation: skeleton loading state in the auth layout once we add one.
- **CORS gets stricter**. The backend must set `Access-Control-Allow-Credentials: true` and the frontend's origin must be on the allowlist — wildcard origins are forbidden. Easy to misconfigure, painful to debug.
- **Refresh cookie bound to a single backend domain**. Cross-subdomain or cross-origin auth needs extra design work (e.g. domain-level cookie or token introspection endpoint).

### Neutral

- The frontend has no visibility into refresh-token expiry. If the backend rotates the refresh token on each refresh (recommended), client behaviour is unchanged; if it does not, an attacker with a stolen refresh cookie has the cookie's full TTL — that is the backend's invariant, not ours.

## Implementation Notes

The pattern landed in PR #3 (`feat/auth-scaffold`) and was hardened in PR #5 (`test/auth-coverage`). Source of truth files:

| File                                   | Role                                                                                     |
| -------------------------------------- | ---------------------------------------------------------------------------------------- |
| `src/features/auth/store/authStore.ts` | Zustand store — accessToken + user, in-memory only                                       |
| `src/api/client.ts`                    | `beforeRequest` Bearer injection, `afterResponse` single-flight refresh                  |
| `src/api/auth.ts`                      | login / logout / refreshSession / getCurrentUser endpoints                               |
| `src/schemas/auth.ts`                  | Zod schemas — `LoginSchema`, `UserSchema`, `SessionSchema`                               |
| `src/routes/_auth.tsx`                 | Pathless layout — silent refresh on entry, redirect on failure                           |
| `src/routes/login.tsx`                 | `/login` with `from` search param via Zod                                                |
| `src/features/auth/hooks/useAuth.ts`   | `useLogin`, `useLogout`, `useCurrentUser`, `useIsAuthenticated`                          |
| `src/test/msw/handlers.ts`             | Mock backend for the four auth endpoints                                                 |
| `src/api/client.test.ts`               | **Property test for single-flight**: 3 concurrent 401s → exactly 1 refresh, all 3 replay |

### Backend contract (frozen by this ADR)

```
POST /auth/login        body { email, password }
                        → 200 { accessToken, user }, sets HttpOnly cookie
                        → 401 on bad credentials

POST /auth/refresh      reads HttpOnly cookie
                        → 200 { accessToken, user }
                        → 401 if cookie missing/expired

POST /auth/logout       clears the HttpOnly cookie
                        → 204

GET  /me                requires Authorization: Bearer
                        → 200 { id, email, name }
                        → 401 if token invalid
```

CORS must allow the frontend origin with `Access-Control-Allow-Credentials: true`. The cookie should be `HttpOnly`, `Secure`, `SameSite=Lax` (or `Strict` if we never need cross-site flows).

## Validation

This decision is validated if, six months from now (2026-11):

- We have **not** added a second token store (no `localStorage.getItem('accessToken')` anywhere)
- We have **not** introduced an `Authorization` injection point outside `api/client.ts`
- The single-flight property test still passes after every refactor
- No security finding (internal review or external audit) has flagged the auth flow
- Refresh round-trip latency is below 200 ms p95

If any of those fail, supersede this ADR with one explaining the new posture (likely directions: split refresh + access token endpoints, move to OIDC, or add device-bound tokens).
