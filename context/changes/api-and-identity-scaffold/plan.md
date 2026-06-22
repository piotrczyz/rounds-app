# API, Identity & Sync Contract Foundation — Implementation Plan

## Overview

This change stands up the Rounds backend from nothing: a Node.js/TypeScript
(NestJS + Prisma) REST API on PostgreSQL that authenticates a Household Keeper
via Supabase social sign-in, persists Rounds on a **group-ready** relational model
(ADR-0002), serves a **read-only** Rounds vertical slice, and ships the **data
contract for offline-first sync** (FR-009) that F-02 and S-04 build on. It is a
foundation: it proves the stack end-to-end through a real authenticated resource
without owning the Rounds write UX (that is S-01).

## Current State Analysis

- **Greenfield.** The repository contains only `context/` (planning artifacts) and
  a one-line `README.md`. No application code, no `package.json`, no `/backend`
  directory exists yet.
- **Stack baseline** (`context/foundation/tech-stack.md`): PostgreSQL is the house
  database; pnpm and Vitest are the house JS defaults; GitHub Actions is CI. The
  backend language is recorded there as Python/FastAPI — **this plan changes that
  to Node.js/TypeScript** (see Implementation Approach) and Phase 1 updates the
  file.
- **Domain is well-specified** by the PRD, glossary, and ADRs — no domain
  invention is needed:
  - Group-ready model required: a solo keeper is a **Group of one**
    (`context/discovery/discovery-notes.md` ADR-0002).
  - Single scheduling rule: **recurs-from-completion** (ADR-0001) — F-01 stores
    the data that makes this computable; it does not yet implement completion
    writes.
  - Role model: **Group Owner** + **Member** (PRD Access Control).
  - The **Tally** counts only real completions and only ever grows (FR-008).
- **Assumptions to verify during build:** Supabase issues a standard JWT whose
  signature is verifiable from its public JWKS endpoint and whose `sub` claim is a
  stable per-user identifier; Expo/React Native can complete the Supabase
  Apple/Google flow client-side (validated in F-02, not here).

## Desired End State

A developer can clone the repo, run `docker compose up` + the API, and:

- `GET /health` returns `200`.
- A request bearing a valid Supabase JWT is accepted; a missing/invalid/expired
  token is rejected with `401`. First valid sign-in **auto-provisions** the user's
  personal Group-of-one with the user as Owner.
- `GET /rounds` returns only the caller's group's non-deleted Rounds; a caller
  cannot see another group's Rounds.
- `GET /sync?since=<cursor>` returns all rows (Rounds + Completions) changed since
  the cursor, **including tombstones**, with a next cursor.
- `GET /tally` returns the caller's all-time and per-month completion counts,
  derived from Completion rows.
- The HTTP contract is documented (OpenAPI) and the shared sync-contract types are
  published from a workspace package importable by the future mobile app.
- CI runs lint + tests against a Postgres service and is green.

### Key discoveries

- No code exists — every path below is a new file; there is no legacy to integrate
  with.
- The offline-first NFR (`context/prd/prd.md`) makes the **sync metadata shape
  load-bearing**: client-generatable UUID PKs + `updatedAt` + monotonic `version`
  + `deletedAt` tombstones are required so F-02 can create rows offline and S-04
  can pick a conflict resolver **without a schema migration**.
- ADR-0002 forces the group-ready model now; retrofitting groups later would be
  the rewrite it explicitly exists to prevent.
- The roadmap's headline risk — two-provider token validation — is **retired by
  delegating sign-in to Supabase**; the residual risk is verifying one provider's
  JWT, isolated behind a swappable boundary in Phase 3.

## What we're NOT doing

- **No Round write endpoints** — create / edit / delete / complete / snooze are
  S-01 and S-02. F-01 is auth + model + read-only slice + sync contract only. (Dev
  seed/fixtures supply data to read.)
- **No conflict-resolution logic** — F-01 provides the sync *contract* (the
  metadata); the resolver (last-write-wins vs merge) is decided and implemented in
  F-02 (Open Roadmap Question #4).
- **No push notifications** — S-05; provider undecided (OQ #3).
- **No social/group features** beyond the group-ready schema — invites, multi-member
  groups, shared completion are increment 2 (ADR-0002). The schema supports them;
  no API exposes them.
- **No production deployment** — deploy target is parked (OQ #5); this is local +
  CI only. No Terraform/infra provisioning.
- **No mobile app** — that is F-02. This change only publishes the shared contract
  package the app will later consume.
- **No domain tags** — S-06.

## Implementation Approach

**Language switch — Node.js/TypeScript over the originally-pinned Python/FastAPI.**
The decisive factor is the **shared sync contract**: this is an offline-first app
where client and server must agree exactly on each row's shape, `version`, and
tombstone semantics. With a TypeScript backend, that contract lives in one
workspace package both the API and the React Native app import — a correctness
guarantee, not just convenience. The original Python pick was justified largely by
mature auth libraries for two-provider token validation; delegating sign-in to
**Supabase** retires that rationale. The house JS defaults (pnpm, Vitest) already
align with Node. This deviates from `tech-stack.md`, so Phase 1 updates that file
and records **ADR-0003 (Node/TypeScript backend on NestJS + Prisma)**.

**NestJS + Prisma.** NestJS gives opinionated module/DI structure that pays off as
the domain logic grows across S-01…S-06 (roles, recurs-from-completion, snooze
governance). Prisma gives a type-safe data layer with first-class migrations and
generated types that feed the contract package.

**Supabase for identity, behind a swappable boundary.** The client signs in with
Supabase (Apple/Google); the backend never sees provider credentials — it only
**verifies the Supabase-issued JWT** against Supabase's JWKS. Because the user
flagged a possible later move off Supabase, verification sits behind a
`TokenVerifier` interface; `SupabaseTokenVerifier` is the only implementation that
touches Supabase, so a future swap is one adapter, not a rewrite. A
`FakeTokenVerifier` backs tests so the suite needs no live Supabase.

**Group-ready, sync-ready model from day one.** `User` (mapped from the Supabase
`sub`), `Group`, `Membership` (role: OWNER | MEMBER), `Round` (belongs to a Group),
`Completion` (belongs to a Round + the Member who completed it). Every synced row
(`Round`, `Completion`) carries `id: uuid` (client-generatable), `createdAt`,
`updatedAt`, `version` (monotonic int), `deletedAt` (nullable tombstone). The
**Tally is derived** by counting non-deleted Completion rows — never a stored
counter — so it structurally "only counts real completions and only grows"
(FR-008).

**Read-only vertical slice proves the stack.** Building `GET /rounds`, `/sync`,
`/tally` end-to-end (auth → group scoping → Prisma → serialized contract types)
validates every layer through a real resource while leaving writes cleanly to S-01.

## Critical Implementation Details

### Sync contract (load-bearing)

- Synced entities expose: `id` (UUID, client-supplied on create later), `createdAt`,
  `updatedAt`, `version` (integer, incremented on every write), `deletedAt`
  (null = live; timestamp = tombstone).
- `GET /sync?since=<cursor>` returns every synced row of the caller's group with
  `updatedAt > cursor` (tombstones included so deletes propagate), plus a
  `nextCursor`. Cursor is the max `updatedAt` of the returned set (an opaque ISO
  timestamp to the client).
- These types are defined **once** in the shared contract package and imported by
  both the API serializers and (later) the mobile client.

### Auth boundary

- `TokenVerifier.verify(token): Promise<VerifiedIdentity>` where `VerifiedIdentity`
  carries at least `{ subject, email? }`. Verification failures throw → mapped to
  `401`.
- `get_current_member`-style guard: verify token → upsert `User` by `subject` →
  ensure a personal Group-of-one + OWNER `Membership` exists → attach the resolved
  member/group to the request. First-ever request for a subject provisions the
  group transactionally.

## Phase 1: Project scaffold & local dev environment

### Overview
A bootable NestJS app in a pnpm monorepo, talking to a local Dockerized Postgres,
with CI green and the stack decision recorded.

### Required changes

#### 1. pnpm workspace + monorepo layout
- **File**: `package.json` (root), `pnpm-workspace.yaml`, `/backend`, `/packages/contract`
- **Goal**: establish the monorepo so the backend and the shared contract package
  coexist and the future `/mobile` app slots in without a reorg.
- **Contract**: workspaces `backend`, `packages/*`; pnpm as the package manager.

#### 2. NestJS application skeleton
- **File**: `/backend` (NestJS project: `main.ts`, `app.module.ts`, config module)
- **Goal**: a running HTTP server with typed configuration from environment
  variables (Nest `ConfigModule` + a validated schema).
- **Contract**: server boots on a configured port; config validates required env
  vars (`DATABASE_URL`, Supabase JWT settings) at startup and fails fast if missing.

#### 3. Health endpoint
- **File**: `/backend` health controller
- **Goal**: a dependency-free liveness check.
- **Contract**: `GET /health` → `200` with a small JSON body.

#### 4. Prisma + Postgres wiring
- **File**: `/backend/prisma/schema.prisma`, Prisma client provider/module
- **Goal**: connect Prisma to Postgres; establish the migration workflow (empty
  baseline is fine here — models land in Phase 2).
- **Contract**: `prisma migrate` runs against `DATABASE_URL`; the app exposes an
  injectable Prisma client.

#### 5. Local dev environment
- **File**: `docker-compose.yml`, `.env.example`, README run instructions
- **Goal**: one command brings up Postgres for local development.
- **Contract**: `docker compose up` yields a Postgres reachable at the documented
  `DATABASE_URL`.

#### 6. Tooling, CI, and the stack decision
- **File**: ESLint/Prettier config, `.github/workflows/ci.yml`,
  `context/foundation/tech-stack.md`, an ADR entry (ADR-0003)
- **Goal**: lint + Vitest run in CI against a Postgres service; record the
  Node/TypeScript stack switch.
- **Contract**: CI workflow runs `pnpm install`, lint, and tests with a Postgres
  service container; `tech-stack.md` reflects Node/NestJS/Prisma and references
  ADR-0003.

### Success criteria
#### Automated
- `pnpm install` and `pnpm -C backend build` succeed.
- `GET /health` returns `200` (test via Nest e2e/supertest).
- The CI workflow runs lint + tests against a Postgres service and passes.
#### Manual
- `docker compose up` followed by starting the API serves `GET /health` locally.
- `tech-stack.md` reads as Node/TypeScript + NestJS + Prisma and links ADR-0003.

<!-- After each phase, STOP for human confirmation of the manual checks before
the next phase. -->

## Phase 2: Data model & migrations (group-ready, sync-ready)

### Overview
The group-ready, sync-ready relational schema and its first applied migration.

### Required changes

#### 1. Prisma schema — identity & groups
- **File**: `/backend/prisma/schema.prisma`
- **Goal**: model identity and membership so a solo keeper is a Group of one
  (ADR-0002) and the social layer is additive.
- **Contract**: `User { id, subject (unique), email?, createdAt, updatedAt }`;
  `Group { id, name?, createdAt, updatedAt }`; `Membership { id, userId, groupId,
  role: OWNER|MEMBER, createdAt }` with a unique `(userId, groupId)`.

#### 2. Prisma schema — Rounds & Completions (synced entities)
- **File**: `/backend/prisma/schema.prisma`
- **Goal**: the core domain rows carrying the sync contract.
- **Contract**: `Round { id: uuid, groupId, name, intervalUnit (DAY|WEEK|MONTH),
  intervalCount, nextDueAt, createdAt, updatedAt, version, deletedAt? }`;
  `Completion { id: uuid, roundId, memberId, completedAt, createdAt, updatedAt,
  version, deletedAt? }`. UUID PKs are client-generatable; `version` is a
  monotonic integer; `deletedAt` is the tombstone.

#### 3. First migration
- **File**: `/backend/prisma/migrations/*`
- **Goal**: a reproducible schema on a fresh database.
- **Contract**: `prisma migrate deploy` applies cleanly to an empty Postgres.

#### 4. Repository/access layer
- **File**: `/backend` data-access modules for Group, Round, Completion
- **Goal**: typed read access used by Phase 4 endpoints (group-scoped queries,
  tombstone-aware filters).
- **Contract**: queries always filter by the caller's group; "live" reads exclude
  `deletedAt != null`; sync reads include them.

### Success criteria
#### Automated
- `prisma migrate deploy` applies cleanly on a fresh database in CI.
- Unit tests assert: `(userId, groupId)` uniqueness; default `version` and null
  `deletedAt` on insert; group-scoped query excludes other groups' rows.
#### Manual
- Inspecting the migrated database shows the five tables with the sync columns
  (`id`, `createdAt`, `updatedAt`, `version`, `deletedAt`) on `Round` and
  `Completion`.

## Phase 3: Auth integration (the de-risked spike)

### Overview
Supabase JWT verification behind a swappable boundary, plus first-sign-in
provisioning of the personal Group-of-one.

### Required changes

#### 1. TokenVerifier boundary
- **File**: `/backend` auth module (`token-verifier.ts` interface + Supabase impl)
- **Goal**: isolate the provider so a later move off Supabase is one adapter.
- **Contract**: `interface TokenVerifier { verify(token: string):
  Promise<VerifiedIdentity> }`; `VerifiedIdentity = { subject: string; email?: string }`.
  `SupabaseTokenVerifier` validates the JWT signature against Supabase JWKS and
  checks issuer/expiry.

#### 2. Test verifier
- **File**: `/backend` auth test support
- **Goal**: deterministic auth in tests without a live Supabase.
- **Contract**: `FakeTokenVerifier` returns a configured `VerifiedIdentity` for a
  known token and throws for anything else.

#### 3. Auth guard + member resolution
- **File**: `/backend` auth guard / request-scoped current-member provider
- **Goal**: turn a verified token into the caller's `Membership`/`Group`, creating
  them on first sign-in (ADR-0002).
- **Contract**: guard verifies the bearer token (401 on missing/invalid/expired),
  upserts `User` by `subject`, and ensures a personal Group + OWNER membership
  exist (transactional, idempotent). Resolved member/group attached to the request.

### Success criteria
#### Automated
- A protected probe route returns `401` for missing, malformed, and expired tokens
  and `200` for a valid one (via `FakeTokenVerifier`).
- First authenticated request for a new subject creates exactly one `User`, one
  `Group`, and one OWNER `Membership`; a second request for the same subject
  creates no duplicates.
- A unit test verifies `SupabaseTokenVerifier` rejects a token with a bad
  signature/issuer.
#### Manual
- Using a real Supabase-issued JWT against a protected route returns `200` and
  provisions the keeper's group (smoke test with a token from the Supabase project).

## Phase 4: Read-only Rounds vertical slice + sync contract

### Overview
The authenticated read endpoints — `GET /rounds`, `GET /sync`, `GET /tally` —
serialized through the shared contract package, with dev seed data to read.

### Required changes

#### 1. Shared contract package
- **File**: `/packages/contract` (TypeScript types + zod schemas)
- **Goal**: define the wire shapes once for both API and future mobile client.
- **Contract**: exports `RoundDTO`, `CompletionDTO`, `SyncResponse` (`{ rounds,
  completions, nextCursor }`), `TallyDTO` (`{ allTime, perMonth }`), each carrying
  the sync fields. Published as a workspace package importable by `/backend`.

#### 2. GET /rounds
- **File**: `/backend` rounds controller (read-only)
- **Goal**: list the caller's group's live Rounds.
- **Contract**: `GET /rounds` → `200` with non-deleted Rounds for the caller's
  group, ordered overdue/soonest-first by `nextDueAt`; never returns another
  group's rows. Requires auth.

#### 3. GET /sync
- **File**: `/backend` sync controller
- **Goal**: deliver the offline-sync delta contract.
- **Contract**: `GET /sync?since=<cursor>` → `200` with all of the caller's group's
  Rounds and Completions where `updatedAt > since` (tombstones included), plus
  `nextCursor`. Omitted `since` returns the full current set.

#### 4. GET /tally
- **File**: `/backend` tally controller
- **Goal**: serve the reward signal derived from Completions (FR-008).
- **Contract**: `GET /tally` → `200` with `allTime` (count of the group's
  non-deleted Completions) and `perMonth` (counts grouped by completion month).
  Derived, never stored.

#### 5. Dev seed / test fixtures
- **File**: `/backend` seed script + test fixtures
- **Goal**: provide Rounds/Completions to read, since writes are out of scope.
- **Contract**: a seed creates a sample group with Rounds and Completions for local
  dev; integration tests build their own fixtures.

#### 6. OpenAPI documentation
- **File**: `/backend` Nest Swagger setup
- **Goal**: publish the HTTP contract.
- **Contract**: `/docs` (or equivalent) serves an OpenAPI spec covering the three
  endpoints and their DTOs.

### Success criteria
#### Automated
- Integration tests (seeded fixtures, `FakeTokenVerifier`): `GET /rounds` returns
  only the caller's group's live Rounds; a second group's keeper sees only theirs.
- `GET /sync?since=<t>` returns rows changed after `t` including a tombstoned row,
  and a `nextCursor`; with no `since`, returns the full set.
- `GET /tally` returns correct `allTime` and `perMonth` counts and ignores
  tombstoned Completions.
- All three endpoints return `401` without a valid token.
#### Manual
- Open the OpenAPI docs and confirm the three endpoints and DTOs are documented and
  match the shared contract package.

## Testing Strategy

- **Unit (Vitest, house default):** scheduling/serialization helpers, sync-cursor
  filtering, Tally derivation, `SupabaseTokenVerifier` signature/issuer checks,
  provisioning idempotency.
- **Integration (Vitest + supertest against a real Postgres):** auth guard
  behavior, group scoping, the three read endpoints, sync deltas with tombstones —
  using `FakeTokenVerifier`.
- **CI:** GitHub Actions runs lint + the full suite against a Postgres service
  container on every push.
- **Manual smoke:** one real Supabase JWT against a protected route (Phase 3) and
  the OpenAPI docs review (Phase 4). E2E API coverage (Playwright per tech-stack)
  is deferred until write endpoints exist (S-01).

## Migration Notes

- Phase 2 introduces the first Prisma migration against an empty database; there is
  no existing data, so no data migration or rollback plan is required beyond
  `prisma migrate` forward/reset. All later slices extend this baseline additively.

## References

- Roadmap slice F-01: `context/foundation/roadmap.md:70-88`
- PRD — Access Control, Business Logic, NFRs, FR-008/FR-009: `context/prd/prd.md`
- Glossary + ADR-0001 (recurs-from-completion), ADR-0002 (solo-first on group-ready
  model): `context/discovery/discovery-notes.md:193-252`
- Tech stack (to be updated to Node/TypeScript in Phase 1):
  `context/foundation/tech-stack.md`
- Plan brief: `context/changes/api-and-identity-scaffold/plan-brief.md`

## Progress

### Phase 1: Project scaffold & local dev environment
#### Automated
- [x] 1.1 `pnpm install` and `pnpm -C backend build` succeed — 936c9fc
- [x] 1.2 `GET /health` returns 200 — 936c9fc
- [ ] 1.3 CI workflow runs lint + tests against a Postgres service and passes
#### Manual
- [ ] 1.4 `docker compose up` + starting the API serves `GET /health` locally
- [ ] 1.5 tech-stack.md reads as Node/TypeScript + NestJS + Prisma and links ADR-0003

### Phase 2: Data model & migrations (group-ready, sync-ready)
#### Automated
- [ ] 2.1 `prisma migrate deploy` applies cleanly on a fresh database in CI
- [ ] 2.2 Unit tests assert (userId, groupId) uniqueness, default version/null deletedAt, group-scoped exclusion
#### Manual
- [ ] 2.3 Migrated database shows five tables with sync columns on Round and Completion

### Phase 3: Auth integration (the de-risked spike)
#### Automated
- [ ] 3.1 Protected route returns 401 for missing/malformed/expired tokens and 200 for a valid one
- [ ] 3.2 First request for a new subject provisions one User + Group + OWNER Membership; repeat creates no duplicates
- [ ] 3.3 SupabaseTokenVerifier rejects a token with a bad signature/issuer
#### Manual
- [ ] 3.4 A real Supabase-issued JWT against a protected route returns 200 and provisions the group

### Phase 4: Read-only Rounds vertical slice + sync contract
#### Automated
- [ ] 4.1 GET /rounds returns only the caller's group's live Rounds; cross-group isolation holds
- [ ] 4.2 GET /sync?since returns post-cursor rows incl. a tombstone + nextCursor; no since returns full set
- [ ] 4.3 GET /tally returns correct allTime/perMonth counts and ignores tombstoned Completions
- [ ] 4.4 All three endpoints return 401 without a valid token
#### Manual
- [ ] 4.5 OpenAPI docs show the three endpoints and DTOs matching the shared contract package
