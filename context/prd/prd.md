---
project: Rounds
version: 1
status: draft
created: 2026-06-22
context_type: greenfield
product_type: mobile
target_scale:
  users: small
---

# Rounds — Product Requirements

## Vision & Problem Statement

**Thesis:** Rounds tracks the recurring commitments people share — to their home
and to their people — and makes completing them feel good, so that neither a
household nor a friendship quietly decays from neglect.

Two pains share one underlying cause:

1. **Invisible, thankless household upkeep.** A property (house, garden, car(s),
   pool) generates dozens of recurring maintenance tasks on wildly different
   rhythms — oil changes, insurance renewals, pool dosing, lawn prep, terrace
   cleaning. They have no single home, they slip through the cracks (lapsed
   insurance, skipped service, a green pool), and even when done they produce no
   satisfaction. The person carrying this load feels a constant low hum of "am I
   forgetting something?"

2. **Fewer shared real-life activities.** Modern life has eroded the things
   people do *together* in person. Intentions to take a trip, share a dinner, or
   hold a football evening keep slipping for the same two reasons household tasks
   do: nobody is accountable, and there is no payoff when the thing actually
   happens.

Both are **recurring shared commitments that die from no accountability and no
reward.** Existing tools (calendars, reminder apps, to-do lists) fail because they
(a) let you snooze infinitely and lie to yourself, (b) treat a chore identically
to a meeting, and (c) frame everything as a solo guilt-list rather than something
a household or a crew pulls off together.

**The moment:** a Saturday morning — "what actually needs doing?" — and the
background anxiety of forgetting, the rest of the week.

**The cost today:** things slip (money, property, missed experiences), the mental
load never lets up, and effort spent goes unrewarded. Relationships and property
both decay quietly.

## User & Persona

**Primary persona — the Household Keeper.** The person who carries the mental
load of keeping a property running *and* wants to do more meaningful things with
the people around them — both of which currently slip. They manage a home with
several maintenance domains (house, garden, one or more cars, a pool), live with
or near others (household Members), and have a circle of friends they would see
more if something actually made it happen. They are not a project manager and do
not want to *administer* an app — they want it to quietly tell them what's due,
let them tap it done, and make that feel good.

## Success Criteria

### Primary

A Household Keeper can run the full solo dopamine loop end-to-end: capture a
recurring Round (name + interval, nothing more), open the app to a single "what's
due" list, complete a Round with one tap and watch it vanish and silently
reschedule from the moment of completion, and see a running count of completions
grow over time. State is cloud-synced across their own phone and tablet on both
iOS and Android. The "never miss twice" anti-snooze logic is in effect: a second
snooze on the same Round triggers a gentle intervention rather than another free
deferral, and the cumulative Tally counts only real completions. This is the
increment that tests the core bet — does making upkeep satisfying make people do
more of it — and it ships as a genuinely useful single-player app.

### Secondary

Grouping / filtering Rounds by property domain (house, garden, car(s), pool) for
at-a-glance organization. A nice-to-have that improves legibility but is not
required for the loop to deliver value.

### Guardrails

- **Single-list integrity.** The home screen stays one short, uncluttered "what's
  due" list. Completed and not-yet-due Rounds never clutter it — an empty list is
  the reward state.
- **Zero administration.** Beyond a name and an interval, the app never asks the
  Household Keeper to configure scheduling rules, sync, or settings. It must not
  become something to *manage*.
- **Group-ready data model.** A solo Household Keeper is a Group of one. The model
  must be built so the later social layer (multiple Members, invites, shared
  completion) is an additive extension, never a rewrite of the solo increment
  (see ADR-0002: Solo-first increment on a group-ready model).

## User Stories

### US-01: Complete a due Round (the core loop)

- **Given** a Household Keeper with at least one Round due today,
- **When** they open Rounds and tap that Round,
- **Then** the Round disappears from the "what's due" list with immediate positive
  feedback (no confirmation step), the next occurrence is scheduled N intervals
  from the moment of completion, and the cumulative Tally increments by one.

#### Acceptance Criteria

- The Round is removed from the "what's due" list immediately on tap, without a
  confirmation step.
- Positive feedback is displayed to the Household Keeper before any network
  round-trip completes.
- The Round's next-due date is set to the moment of completion plus its interval.
- The cumulative Tally increments by exactly one.

## Functional Requirements

### Capturing Rounds

- FR-001: Household Keeper can create a Round with a name and a recurrence interval (every N days / weeks / months). Priority: must-have
- FR-002: Household Keeper can edit a Round's name and interval. Priority: must-have
- FR-003: Household Keeper can delete a Round. Priority: must-have

### The due loop

- FR-004: Household Keeper can see a single "what's due" list showing only Rounds that are due or overdue, ordered overdue/soonest first. Priority: must-have
- FR-005: Household Keeper can complete a Round with one tap, which removes it from the due list and schedules the next occurrence counting from the moment of completion. Priority: must-have
- FR-006: Household Keeper receives a notification when a Round comes due. Priority: must-have

### Honest deferral & reward

- FR-007: Household Keeper can snooze a due Round. The first snooze defers it freely; a second snooze on the same Round does NOT defer again — instead the app honestly surfaces that the Round has been pushed twice and leaves it as gently overdue. (Atomic Habits "never miss twice".) Priority: must-have
> Challenge: A second snooze could offer a shrunk version of the task (Fogg "make it easy"). Rejected for the MVP — many household Rounds (insurance renewal, inspection) have no natural smaller form, and defining one per Round adds real complexity. MVP intervention is honest surfacing only; shrink is deferred (see Open Questions).
- FR-008: Household Keeper can see a running cumulative Tally of completed Rounds that only ever grows (e.g. all-time and per-month) and counts only real completions, never snoozes. Priority: must-have
> Challenge: A consecutive streak that can break pulls harder but punishes a miss with guilt — the exact failure mode Rounds exists to avoid. Rejected. The reward is pure positive accumulation with no breakable state.

### Sync

- FR-009: Household Keeper has their Rounds and Tally cloud-synced across their own phone and tablet, on both iOS and Android. Priority: must-have

### Organization

- FR-010: Household Keeper can tag a Round by property domain (house / garden / car(s) / pool) and filter the due list by domain. Priority: nice-to-have
> Challenge: Domain tagging risks reintroducing administration overhead (the Household Keeper curating categories) — kept as nice-to-have only, off the critical path, so the zero-admin guardrail holds for the core loop.

_FR-001 through FR-006 and FR-009 are mechanical consequences of the locked
first-increment flow (create / view what's due / complete / be reminded / sync).
No counterargument raised; kept as written._

## Non-Functional Requirements

- **Instant completion feedback.** Tapping a completed Round removes it from the
  due list and plays reward feedback immediately, before any network round-trip
  completes.
- **Offline-first.** The Household Keeper can view what's due and complete or
  snooze Rounds with no connectivity; changes reconcile automatically when back
  online.
- **Cross-device convergence.** A change on one of the Household Keeper's devices
  appears on their other device within seconds when both are online.
- **Reliable reminders.** Due notifications fire even when the app is backgrounded
  or closed.
- **No silent data loss.** Completions and the Tally survive app restarts, offline
  periods, and switching devices.
- **Privacy.** A Household Keeper's Rounds and Tally are private to them (and, in
  the later social layer, only to their Group); never exposed or repurposed.
- **Device coverage.** iOS and Android, phone and tablet form factors.

## Business Logic

Rounds decides when each Round next becomes due by counting its interval forward
from the moment the Household Keeper actually completed it — never from a fixed
calendar date — and governs deferral so the Household Keeper cannot quietly defer
forever (see ADR-0001: One scheduling rule — recurs-from-completion).

The Household Keeper's inputs are a Round's recurrence interval, the completion
event (a single tap), and the occasional snooze action. From these the app
computes a next-due moment and a due/overdue state, and increments the cumulative
Tally on each genuine completion. There is exactly one scheduling rule for every
Round — recurs-from-completion — so the Household Keeper never configures
scheduling behavior; the calendar-bound cases (insurance, inspections) are
approximated as long intervals rather than fixed dates, preserving the single-rule
simplicity.

Deferral is governed, not free: the first snooze on a due Round defers it; a
second snooze on the same Round is refused as a deferral and instead surfaces the
fact that the Round has been pushed twice, leaving it as gently overdue. This is
the "never miss twice" principle — the app makes self-deception visible rather
than punishing it. The Household Keeper meets this logic at two moments only:
completing a Round, and attempting a second snooze.

## Access Control

**Entry:** authenticated accounts, cloud-synced. Sign-in is one-tap social auth
(Apple or Google; no password to invent) to minimize onboarding friction. Each
Household Keeper reaches Rounds on phone and tablet, iOS and Android, with the
same synced state — a shared pool of Rounds cannot exist without identity and a
backend, so local-only is ruled out.

**Role model — per-Group Owner + Members.** Roles scope *membership*, not the
work:

- **Group Owner** — the person who created the Group. Invites and removes Members,
  and can delete the Group. Also has every Member capability.
- **Member** — can view, create, complete, and edit Rounds within the Group.
  Members cannot manage who belongs.
- Both Group Owner and Members do the actual Rounds — completing tasks is shared
  by design. "Just me" is a Group of one in which the Household Keeper is the
  Group Owner.

## Non-Goals

- **Social / group layer** (multiple Members, invites, shared completion,
  real-life-together Rounds) — deferred to increment 2; the MVP proves the solo
  loop first on a group-ready model (ADR-0002).
- **Calendar integration** — rejected; it fights the single-list, low-thinking
  design and is the most expensive thing to build.
- **Gamification beyond the cumulative Tally** (badges, leaderboards, kudos,
  levels, breakable streaks) — rejected; Rounds relies on internal and shared
  reward, not external validation.
- **Mileage- or season-based scheduling triggers** — approximated by intervals to
  preserve the single scheduling rule (ADR-0001).
- **Task-shrinking on second snooze** — parked; revisit after the core loop is
  validated (see Open Questions #1).
- **Vendor / marketplace actions** (booking a mechanic, ordering pool chemicals)
  — out; Rounds tracks commitments, it does not transact.
- **Expense tracking & maintenance history log** — out; the only history that
  matters in the MVP is the Tally.
- **Pre-built task templates / household library** — out; Household Keepers create
  their own Rounds, keeping the model simple.
- **Web / desktop version** — out; mobile-only (phone + tablet).

## Open Questions

1. **Task-shrinking on second snooze (Fogg make-it-easy)** — Deferred from MVP;
   revisit once the core loop is validated. Needs a per-Round notion of a "smaller
   version", which not all Rounds have (e.g. insurance renewal has no natural
   smaller form). Owner: product team. Block: no.
2. **Mileage- or season-based triggers** (e.g. oil by km, pool only in summer) —
   Out of scope; approximated by intervals for now. Revisit if interval
   approximation proves too coarse in real use. Owner: product team. Block: no.
