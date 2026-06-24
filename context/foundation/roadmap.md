---
project: Rounds
version: 1
status: draft
created: 2026-06-22
updated: 2026-06-22
prd_version: 1
main_goal: market-feedback
top_blocker: decisions
---

# Rounds — Roadmap

## Vision recap

Rounds tracks recurring commitments — household upkeep and shared real-life
activities — and makes completing them feel good, so that neither a property nor a
friendship quietly decays from neglect. The product's first increment tests a
single bet: does framing household maintenance as satisfying completions (rather
than a guilt list) make people actually do more of it? A Household Keeper who
captures their Rounds, sees what's due, and completes them with one tap is the
core loop. Every slice in this roadmap either enables or extends that loop.

## North star

**S-02 — Core due loop** is the north star: the single most valuable end-to-end,
user-visible increment. A Household Keeper opens the app to a single "what's due"
list, taps a Round to complete it, watches it vanish with positive feedback, sees
the cumulative Tally grow by one, and watches the Round silently reschedule from
the moment of completion.

This increment (PRD Primary Success Criterion; US-01) is where the core
hypothesis is proven or falsified. Everything upstream (F-01, F-02, S-01) builds
toward it; everything downstream (S-03–S-06) extends it.

## At a glance

| ID | Change ID | Outcome | Prerequisites | PRD refs | Status |
|----|-----------|---------|---------------|----------|--------|
| F-01 | `api-and-identity-scaffold` | Backend API, auth, and data contract operational | — | FR-009, Access Control | ready |
| F-02 | `mobile-app-scaffold` | App is navigable, signed in, and talks to the backend | — | Access Control, NFR offline-first | ready |
| S-01 | `capture-and-manage-rounds` | User can create, edit, and delete Rounds | F-01, F-02 | FR-001, FR-002, FR-003 | ready |
| S-02 ★ | `core-due-loop` | User can view what's due, complete a Round, see it reschedule and Tally grow | S-01 | US-01, FR-004, FR-005, FR-008 | ready |
| S-03 | `honest-deferral` | User can snooze; a second snooze triggers intervention, not deferral | S-02 | FR-007 | ready |
| S-04 | `cloud-sync` | Rounds and Tally sync offline-first across phone and tablet | S-01 | FR-009, NFR offline-first, NFR cross-device | blocked |
| S-05 | `due-notifications` | User receives a push notification when a Round comes due | S-01 | FR-006, NFR reliable-reminders | blocked |
| S-06 | `domain-tags` | User can tag Rounds by domain and filter the due list | S-01 | FR-010 | ready |

## Streams

| Stream | Theme | Chain | Note |
|--------|-------|-------|------|
| Loop | Core hypothesis test | F-02 → S-01 → S-02 ★ → S-03 | Critical path; north star lives here |
| Sync | Multi-device and offline reliability | F-01 → S-01 → S-04 | Runs parallel to Loop after S-01; S-04 blocked on conflict-resolution decision |
| Reach | Extending value after the core loop | S-01 → {S-05, S-06} | S-05 blocked on push-provider decision; S-06 nice-to-have, unblocked |

## Baseline

| Layer | Status | Evidence |
|-------|--------|----------|
| Frontend (Mobile) | absent | per tech-stack.md: React Native + Expo. Greenfield; no source code exists yet. |
| Backend/API | absent | per tech-stack.md: Python FastAPI. Greenfield; no source code exists yet. |
| Data | absent | per tech-stack.md: PostgreSQL. Greenfield; no source code exists yet. |
| Auth | absent | Social auth declared in PRD Access Control; no provider decision in tech-stack.md. |
| Deployment/infra | absent | Docker + Terraform declared in tech-stack.md; deploy target is an open question (Open Stack Q1). |
| Observability | absent | Not declared in tech-stack.md; not a PRD must-have. No foundation opened. |

## Foundations

### F-01 — API, identity, and sync contract

- **Outcome**: A running backend that authenticates a Household Keeper via social
  sign-in, stores and serves their Rounds via a REST API, and provides the data
  contract for offline sync.
- **Change ID**: `api-and-identity-scaffold`
- **PRD refs**: FR-009 (sync contract), Access Control (identity and role model),
  Business Logic (recurs-from-completion rule, snooze governance)
- **Prerequisites**: —
- **Unlocks**: S-01 (Rounds data API), S-04 (sync production-readiness), S-05
  (push-notification dispatch endpoint)
- **Parallel with**: F-02
- **Blockers**: Deploy target not chosen (tech-stack.md Open Stack Q1) — development
  proceeds locally; production deployment is gated until the target is pinned.
- **Unknowns**: None that block F-01 itself. Push notification provider needed for
  S-05 (see Open Roadmap Question #3). Owner: product team. Block: no (for F-01).
- **Risk**: Social sign-in token validation against two providers (Apple and
  Google) in a new backend stack is the highest-effort unknown; spike it first.
- **Status**: ready

### F-02 — Mobile app scaffold and auth flow

- **Outcome**: A navigable mobile app that signs the Household Keeper in with one
  tap via social auth, maintains an authenticated session, and holds a local data
  layer that queues changes for sync.
- **Change ID**: `mobile-app-scaffold`
- **PRD refs**: Access Control (role model, social sign-in), NFR offline-first,
  NFR instant-completion-feedback
- **Prerequisites**: —
- **Unlocks**: S-01 (first user-visible slice), S-02 (core due-loop UI)
- **Parallel with**: F-01
- **Blockers**: —
- **Unknowns**: Offline sync reconciliation approach (last-write-wins vs
  server-authoritative merge). Owner: engineering. Block: no — F-02 proceeds
  with a simple placeholder; the final strategy must be pinned before S-04 ships
  (see Open Roadmap Question #4).
- **Risk**: The local-first data layer is the highest-complexity choice in F-02;
  the wrong abstraction forces a rewrite at S-04. Decide the sync strategy before
  closing F-02.
- **Status**: ready

## Slices

### S-01 — Capture & manage Rounds

- **Outcome**: User can create a Round with a name and interval, edit its name
  and interval, and delete it.
- **Change ID**: `capture-and-manage-rounds`
- **PRD refs**: FR-001, FR-002, FR-003
- **Prerequisites**: F-01, F-02
- **Parallel with**: —
- **Blockers**: —
- **Unknowns**: —
- **Risk**: Low. Simple CRUD on a bounded data model over a working backend and
  app scaffold.
- **Status**: ready

### S-02 — Core due loop ★

The **north star** (PRD Primary Success Criterion; US-01) — the increment that
tests the core hypothesis.

- **Outcome**: User can open a single "what's due" list, tap a Round to complete
  it with immediate positive feedback, watch the Tally grow by one, and see the
  Round silently reschedule from the moment of completion.
- **Change ID**: `core-due-loop`
- **PRD refs**: US-01, FR-004, FR-005, FR-008
- **Prerequisites**: S-01
- **Parallel with**: S-04, S-06 (can begin as soon as S-01 is done, without
  waiting for S-02)
- **Blockers**: —
- **Unknowns**: —
- **Risk**: The reward mechanic — immediate positive feedback on completion — is
  easy to under-deliver. The interaction must feel good, not feel like a
  checkbox. Plan for iteration on the feedback design.
- **Status**: ready

### S-03 — Honest deferral

- **Outcome**: User can snooze a due Round. A first snooze defers it freely. A
  second snooze on the same Round is declined; the app surfaces that the Round
  has been pushed twice and leaves it gently overdue ("never miss twice").
- **Change ID**: `honest-deferral`
- **PRD refs**: FR-007
- **Prerequisites**: S-02
- **Parallel with**: S-04, S-05, S-06 (once S-02 is done)
- **Blockers**: —
- **Unknowns**: —
- **Risk**: Low technical risk. The "gentle intervention" copy and tone must not
  feel punitive — moderate design risk.
- **Status**: ready

### S-04 — Cloud sync

- **Outcome**: A Household Keeper's Rounds and Tally sync automatically across
  their phone and tablet; changes made offline reconcile when connectivity is
  restored; cross-device convergence happens within seconds when both devices are
  online.
- **Change ID**: `cloud-sync`
- **PRD refs**: FR-009, NFR offline-first, NFR cross-device-convergence,
  NFR no-silent-data-loss
- **Prerequisites**: S-01
- **Parallel with**: S-02, S-03, S-06
- **Blockers**: Deploy target not chosen (Open Roadmap Question #5) — development
  proceeds locally; production verification is gated.
- **Unknowns**: Conflict resolution strategy for concurrent edits from multiple
  devices (last-write-wins vs server-authoritative merge). Owner: engineering.
  Block: yes — must be decided and implemented in F-02 before this slice ships.
- **Risk**: Offline-first sync is the highest-complexity work in this roadmap.
  The strategy decided in F-02 becomes load-bearing; choosing the wrong one
  forces a rewrite.
- **Status**: blocked

### S-05 — Due notifications

- **Outcome**: A Household Keeper receives a push notification when a Round comes
  due, even when the app is backgrounded or closed.
- **Change ID**: `due-notifications`
- **PRD refs**: FR-006, NFR reliable-reminders
- **Prerequisites**: S-01
- **Parallel with**: S-02, S-03, S-04, S-06
- **Blockers**: Push notification service not chosen (Open Roadmap Question #3).
- **Unknowns**: Push notification provider not decided. Owner: product team.
  Block: yes — the implementation cannot begin without committing to a provider.
- **Risk**: Background notification reliability varies significantly by platform
  (iOS vs Android battery-optimization policies). Requires real-device testing.
- **Status**: blocked

### S-06 — Domain tags & filter

- **Outcome**: User can tag a Round with a property domain (house / garden /
  car(s) / pool) and filter the "what's due" list to show only one domain.
- **Change ID**: `domain-tags`
- **PRD refs**: FR-010
- **Prerequisites**: S-01
- **Parallel with**: S-02, S-03, S-04, S-05
- **Blockers**: —
- **Unknowns**: —
- **Risk**: Low. Additive optional tag on Rounds. Guardrail: tags must be
  optional; the zero-admin principle means the app must never require a domain
  to be set.
- **Status**: ready

## Backlog Handoff

| Roadmap ID | Change ID | Suggested issue title | ★ | Ready for rs-plan | Notes |
|------------|-----------|-----------------------|---|-------------------|-------|
| F-01 | `api-and-identity-scaffold` | [F-01] API, identity, and sync contract | | Yes | Spike social sign-in token validation first |
| F-02 | `mobile-app-scaffold` | [F-02] Mobile app scaffold and auth flow | | Yes | Pin sync reconciliation approach before closing |
| S-01 | `capture-and-manage-rounds` | [S-01] Capture & manage Rounds (create, edit, delete) | | After F-01 + F-02 | |
| S-02 | `core-due-loop` | [S-02] Core due loop (due list, complete, reschedule, Tally) | ★ | After S-01 | North star — proves the core bet |
| S-03 | `honest-deferral` | [S-03] Honest deferral (snooze + never-miss-twice) | | After S-02 | |
| S-04 | `cloud-sync` | [S-04] Cloud sync (offline-first, cross-device convergence) | | After S-01; blocked | Unblocks when sync strategy decided (OQ #4) |
| S-05 | `due-notifications` | [S-05] Due notifications (push when Round comes due) | | After S-01; blocked | Unblocks when push provider chosen (OQ #3) |
| S-06 | `domain-tags` | [S-06] Domain tags & filter (nice-to-have) | | After S-01 | |

## Open Roadmap Questions

_(PRD Open Questions, verbatim, plus new cross-slice questions surfaced during
decomposition.)_

1. **Task-shrinking on second snooze (Fogg make-it-easy)** — Deferred from MVP;
   revisit once the core loop is validated. Needs a per-Round notion of a
   "smaller version", which not all Rounds have. Owner: product team. Block: no.

2. **Mileage- or season-based triggers** (e.g. oil by km, pool only in summer) —
   Out of scope for MVP; approximated by intervals. Revisit if interval
   approximation proves too coarse in real use. Owner: product team. Block: no.

3. **Push notification provider** — Expo Push Notifications (managed) vs APNs /
   FCM direct. Must be decided before S-05 can begin. Owner: product team.
   Block: yes (gates S-05).

4. **Offline conflict resolution strategy** — How the app resolves edits made on
   two devices while offline (last-write-wins vs server-authoritative merge).
   Must be pinned in F-02 and will not change after S-04 ships. Owner:
   engineering. Block: yes (gates S-04 production quality; F-02 proceeds with a
   safe default).

5. **Deploy target** — Concrete production host for the backend (candidates:
   Hetzner VPS, AWS ECS, Railway). Needed before any slice ships to real users.
   Owner: product team. Block: no (development proceeds locally).

## Parked

_(PRD Non-Goals plus items deferred during decomposition.)_

- **Social / group layer** — multiple Members, invites, shared completion,
  real-life-together Rounds. Increment 2; deferred until the solo loop is
  validated (ADR-0002: Solo-first increment on a group-ready model).
- **Calendar integration** — rejected; fights the single-list design and carries
  the highest build cost.
- **Gamification beyond the Tally** — badges, leaderboards, kudos, levels,
  breakable streaks; rejected (internal reward only, no breakable state).
- **Mileage- / season-based scheduling triggers** — approximated by intervals
  (ADR-0001); revisit if imprecision proves problematic.
- **Task-shrinking on second snooze** — parked; revisit post-core-loop
  validation.
- **Vendor / marketplace actions** — out; Rounds tracks commitments, does not
  transact.
- **Expense tracking & maintenance history log** — out; only the Tally matters
  in the MVP.
- **Pre-built task templates / household library** — out; Household Keepers
  create their own Rounds.
- **Web / desktop version** — out; mobile-only (phone + tablet).

## Done

_(Empty at generation. Only an archive step writes here.)_
