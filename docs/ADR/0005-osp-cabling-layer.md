# ADR-0005: OSP cabling layer + node-meta projection

- **Date**: 2026-06-14
- **Status**: Accepted
- **Deciders**: ASHNET engineering

## Context

The topology feature (ADR-0004) models the network as `NetworkNode`s
(`{id,name,type,status,lat,lng,parentId}`) with edges derived from `parentId`,
and stashes fiber facts ad-hoc in `node.meta` (`splitter`, `portsUsed`,
`portsTotal`, `coreNo`). That left two real defects: (1) **two conflicting
fiber-core models** — the seed assigned `coreNo = poleIndex*12 + coreInTube`
while onboarding assigned `coreNo = ODP.portsUsed+1` and hand-incremented
`portsUsed`, which never equalled the true customer count; and (2) **no physical
cabling records** at all (no cable/strand/splitter/closure/splice/circuit), so
the add-customer flow could not allocate a fiber, capacity could not be enforced,
and a real OSP/FTTH documentation model could not be represented. We need one
coherent fiber model without breaking the existing map UI.

## Decision

We introduce an **OSP cabling layer** as the physical source of truth, modelled
as mock-first Zod entities (ADR-0003): `Cable` + `StrandAssignment`
(`schemas/cable.ts`), `Splitter` (`schemas/splitter.ts`), `Closure` + `Splice`
(`schemas/closure.ts`), `Circuit` (`schemas/circuit.ts`).

- **`node.meta` becomes a projection of the cabling layer, not authoritative
  state.** `features/topology/lib/projection.ts#projectNodeMeta` MERGES the
  cabling-derived fields — `splitter`, `portsTotal`, `portsUsed` (for ODC/ODP),
  and customer `coreNo` — onto each node's existing meta, preserving every
  pass-through fact (`model`, `ipAddress`, `uptimePct`, `planName`, `phone`,
  `onuSerial`, `ponPort`, `rxPowerDbm`, `customerId`). It runs inside
  `GET /api/topology`, so `TopologySchema`, `api/topology.ts`, the hooks, and all
  components are unchanged. **A real backend is expected to compute this same
  projection server-side** — "delete the MSW handler to go live" (ADR-0003) still
  holds because the wire shape (`NetworkNode` with projected meta) is identical.
- **One unified core rule:** _core = a splitter output port → one strand
  (tube/core, TIA-598)._ `portsUsed` is the count of occupied splitter ports
  (never hand-set). A customer's `meta.coreNo` is the strand's global fiber
  number `(tubeNo-1)*12 + coreNo` — the exact inverse of `fiberId()` — so colors
  render identically. Existing seed customers keep their colors because their
  strand is derived by decomposing their current `coreNo` via `fiberId()`.
- **Cabling fixtures are DERIVED from `TOPOLOGY_FIXTURES`** (`test/msw/cablingFixtures.ts`)
  so the node graph and cabling are consistent by construction. A single shared
  `allocateDrop()/freeDrop()` is the only capacity mutator; onboarding and the
  install flow both use it.
- **Network status and billing lifecycle are separate facts on a customer node.**
  `NetworkNode.status` (`up`/`down`/`unknown`) is the OPTICAL/network state — what
  the map color means — while `meta.lifecycle`
  (`prospek`/`instalasi`/`aktif`/`isolir`/`berhenti`) is the billing/service state.
  A suspended (isolir) customer is still optically `up` (the fiber is not cut), so
  the map must not paint it red; it renders slate (`SUSPEND_COLOR`) and the detail
  panel shows both badges. `berhenti` (disconnected) reads `unknown`, not `down`.
  This keeps dispatch from mistaking "belum bayar" for "fiber putus" and keeps the
  blast-radius alert (`status === 'down'`) measuring real faults only. The mock's
  `setTopoCustomerLifecycle()` is the single writer that keeps the two in sync.

As a consequence, **projected `portsUsed` now reflects true occupancy**, so the
seed's previously arbitrary values change to the real customer/child counts. This
is the intended fix, not a regression.

## Alternatives considered

### Alternative 1: Keep meta authoritative, just fix the two core models in place

- **Pros**: smallest change.
- **Cons**: leaves `portsUsed` hand-maintained and drift-prone; no path to a real
  cabling/strand model; the add-customer flow still can't allocate a fiber.
- **Why rejected**: doesn't deliver the requested OSP model or durable consistency.

### Alternative 2: Cabling entities authoritative; compute meta in a hook/selector (client-side)

- **Pros**: keeps the mock GET trivial.
- **Cons**: diverges from the backend contract (the FE would own logic the server
  should), and every component reading `node.meta` would need rewiring.
- **Why rejected**: violates ADR-0003's "the api layer mirrors the real backend";
  the handler-side projection is the honest mock.

### Alternative 3: Do nothing

- **Pros**: no work.
- **Cons**: the core bug and the incomplete install flow remain.
- **Why rejected**: explicitly the thing we set out to fix.

## Consequences

### Positive

- One fiber model; `portsUsed`/`coreNo` are correct and consistent across seed,
  onboarding, and the install flow. Capacity can be enforced. A real OSP data
  model (cables, strands, splitters, closures, splices, circuits) now exists.

### Negative

- More entities + MSW collections to maintain; `handlers.ts` grows (mitigated by
  putting fixtures + allocate/free in `cablingFixtures.ts`).
- Projected port counts differ from the old seed numbers — dashboards/tests that
  pinned the old values must be rebaselined.

### Neutral / risks

- The projection runs on every `GET /api/topology` (O(nodes+ports); trivial at
  fixture scale). Closure/Splice fixtures, cable route waypoints, persisted
  circuit hops, and the rehome endpoint are deferred OSP extras (schemas exist,
  fixtures/UI land only if a concrete use case is confirmed).

## Implementation notes

Phased delivery (see the plan): PR1 = model + projection + seed reconciliation
(this ADR); PR2 = cabling api/hooks/CRUD + capacity; PR3–5 = physical map layer,
detail panels, circuit tracing (optional); PR6 = pick-a-subscriber install flow +
type-aware infra add/edit. `.size-limit.json` gates the topology lazy chunk
(Leaflet is a separate shared chunk); `lib/selection.ts` (PR3) stays Leaflet-free.

## Related

- CLAUDE.md: Data Fetching (Zod at boundary), State Management Hierarchy, NEVER #14 (no `as`).
- Related ADRs: ADR-0003 (mock-first), ADR-0004 (topology map).
- External: TIA-598-C fiber color code; ITU-T G.984 (GPON Class B+ budget).
