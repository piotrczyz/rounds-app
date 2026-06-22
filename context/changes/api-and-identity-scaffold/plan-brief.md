# API, Identity & Sync Contract Foundation — Plan Brief

- Full plan: `context/changes/api-and-identity-scaffold/plan.md`
- Roadmap slice F-01: `context/foundation/roadmap.md:70-88`
- PRD: `context/prd/prd.md` · ADRs: `context/discovery/discovery-notes.md:237-252`

## What & why

Stand up the Rounds backend from scratch: a Node.js/TypeScript API that signs a
Household Keeper in via Supabase social auth, stores Rounds on a group-ready data
model, serves a read-only Rounds slice, and ships the data contract that makes
offline-first sync (FR-009) possible. This is foundation F-01 — it unlocks S-01
(Rounds CRUD), S-04 (sync), and S-05 (push dispatch). It proves the stack
end-to-end through a real authenticated resource without owning the Rounds write
UX, which belongs to S-01.

## Starting point

Greenfield. The repo holds only planning artifacts under `context/` and a one-line
README — no application code, no `package.json`, no backend. The domain is fully
specified by the PRD, glossary, and two ADRs, so no product decisions are open;
the work is purely to build the scaffold the rest of the roadmap depends on.

## Desired end state

`docker compose up` + the API gives: `GET /health` → 200; Supabase-JWT-protected
routes (401 without a valid token, auto-provisioning a personal Group-of-one on
first sign-in); `GET /rounds` (group-scoped, live rows only); `GET /sync?since=`
(deltas incl. tombstones + a cursor); `GET /tally` (all-time + per-month, derived
from completions). The HTTP contract is documented (OpenAPI) and the sync types
are published as a shared workspace package for the future mobile app. CI is green.

## Key decisions made

| Decision | Choice | Why |
|----------|--------|-----|
| Backend language | **Node.js/TypeScript** (was Python/FastAPI) | Offline-first needs client+server to share one sync-contract type; Supabase retires the auth-maturity reason for Python; pnpm/Vitest house defaults align. Updates tech-stack.md + ADR-0003. |
| Framework + data layer | **NestJS + Prisma** | Structured DI bones that scale as domain logic grows (roles, scheduling, snooze); Prisma = type-safe migrations + generated types. |
| Identity | **Supabase Auth** (Apple/Google) | Offloads the roadmap's headline risk (two-provider token validation) to the provider; backend only verifies the Supabase JWT. |
| Provider coupling | **Auth only, behind a swappable `TokenVerifier`** | Keeper may move off Supabase later; isolating verification makes a swap one adapter, not a rewrite. Own Postgres holds all data. |
| Sync metadata | **UUID PK + `updatedAt` + monotonic `version` + `deletedAt` tombstone + pull-since `/sync`** | Lets F-02 create rows offline and S-04 pick a conflict resolver without a schema change. |
| API scope | **Auth + model + read-only Rounds slice** | Clean foundation/feature boundary; write endpoints (CRUD, complete) are S-01/S-02 — no duplicated work. |
| Tally | **Derived from append-only Completion rows** | Structurally "counts only real completions, only grows" (FR-008); group-ready audit trail. |
| Repo layout | **Monorepo: `/backend` + `/packages/contract`, future `/mobile`** | Single repo with a shared contract package; mobile slots in at F-02 without a reorg. |

## Scope

**In:** monorepo + NestJS scaffold; Dockerized Postgres; Prisma schema (User,
Group, Membership, Round, Completion) + first migration; Supabase JWT verification
+ first-sign-in group provisioning; read-only `/rounds`, `/sync`, `/tally`; shared
contract package; OpenAPI docs; CI.

**Out:** Round write endpoints (S-01/S-02); conflict-resolution logic (F-02);
push notifications (S-05); multi-member/social features (increment 2); domain tags
(S-06); production deployment/infra (parked, OQ #5); the mobile app (F-02).

## Architecture / Approach

The client authenticates with Supabase; the backend never sees provider
credentials and only verifies the Supabase-issued JWT against Supabase's JWKS,
behind a `TokenVerifier` interface (one Supabase adapter, a fake for tests). A
verified token resolves to a `User` (keyed by the JWT `subject`) and, on first
sign-in, provisions a personal Group-of-one with the user as Owner (ADR-0002).
All Rounds data lives in our own Postgres via Prisma. Synced rows carry the
sync-contract fields; `/sync` returns deltas since a cursor, tombstones included.
The read-only vertical slice exercises every layer — auth → group scoping → Prisma
→ contract serialization — through real endpoints while leaving writes to S-01.

## Phases at a glance

| Phase | Delivers | Key risk |
|-------|----------|----------|
| 1 — Scaffold & local env | Bootable NestJS monorepo, Dockerized Postgres, `/health`, CI, stack decision recorded | Monorepo/CI wiring friction; first-time NestJS+Prisma+pnpm setup |
| 2 — Data model & migrations | Group-ready, sync-ready Prisma schema + first migration | Getting the sync columns + group-ready shape right so later slices don't migrate around them |
| 3 — Auth integration | Supabase JWT verification (swappable) + first-sign-in provisioning | JWKS/issuer/expiry verification correctness; idempotent provisioning |
| 4 — Read-only slice + sync | `/rounds`, `/sync`, `/tally` + shared contract package + OpenAPI | Correct tombstone/cursor semantics; airtight cross-group isolation |

**Prerequisites:** none (foundation). Runs in parallel with F-02 (mobile scaffold).

## Open risks & assumptions

- Assumes Supabase JWTs are JWKS-verifiable with a stable `sub` claim, and that
  Expo/React Native can complete the Supabase Apple/Google flow (validated in F-02).
- Deploy target is unchosen (OQ #5) — development and verification are local + CI
  only; production is gated until the target is pinned.
- Conflict-resolution strategy (OQ #4) is deliberately deferred to F-02; this plan
  only guarantees the *contract* can support either resolver without a migration.

## Success criteria (summary)

`GET /health` → 200; CI green against Postgres; first migration applies on a fresh
DB; protected routes 401 without a valid token and 200 with one, provisioning the
Group-of-one once; `/rounds` is group-scoped and isolated; `/sync?since=` returns
tombstone-inclusive deltas + cursor; `/tally` derives correct all-time/per-month
counts ignoring tombstones; the shared contract package and OpenAPI docs agree.
