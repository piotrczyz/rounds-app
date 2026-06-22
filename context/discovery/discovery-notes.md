---
project: Rounds
client: piotr@rocksoft.pl
repository:
  name: Rounds app
  git_url: git@github.com:piotrczyz/rounds-app.git
context_type: greenfield
created: 2026-06-22
updated: 2026-06-22
product_type: mobile
target_scale:
  users: small
checkpoint:
  current_phase: 8
  phases_completed: [1, 2, 3, 4, 5, 6]
  frs-drafted: 10
  quality_check_status: accepted
---

# Rounds — Discovery Notes

## Vision & Problem

**Thesis:** Rounds tracks the recurring commitments people share — to their home
and to their people — and makes completing them feel good, so that neither a
household nor a friendship quietly decays from neglect.

Two pains, one underlying cause:

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
reward.** Existing tools (calendars, reminder apps, to-do lists) fail at this
because they (a) let you snooze infinitely and lie to yourself, (b) treat a
chore identically to a meeting, and (c) frame everything as a solo guilt-list
rather than something a household or a crew pulls off together.

**The moment:** a Saturday morning — "what actually needs doing?" — and the
background anxiety of forgetting, the rest of the week.

**The cost today:** things slip (money, property, missed experiences), the
mental load never lets up, and effort spent goes unrewarded. Relationships and
property both decay quietly.

## User & Persona

**Primary persona — the Household Keeper.** The person who carries the mental
load of keeping a property running *and* wants to do more meaningful things with
the people around them — both of which currently slip. They manage a home with
several maintenance domains (house, garden, one or more cars, a pool), live with
or near others (household members), and have a circle of friends they would see
more if something actually made it happen. They are not a project manager and do
not want to *administer* an app — they want it to quietly tell them what's due,
let them tap it done, and make that feel good.

## Access Control

**Entry:** authenticated accounts, cloud-synced. Sign-in is one-tap Apple /
Google (no password to invent) to minimize onboarding friction. Each Household
Keeper reaches Rounds on phone and tablet, iOS and Android, with the same
synced state — a shared pool of Rounds cannot exist without identity and a
backend, so local-only is ruled out.

**Role model — per-group Owner + Members.** Roles scope *membership*, not the
work:
- **Group Owner** — the person who created the Group. Invites and removes
  members, and can delete the Group. Also has every Member capability.
- **Member** — can view, create, complete, and edit Rounds within the Group.
  Members cannot manage who belongs.
- Both Owner and Members do the actual Rounds — completing tasks is shared by
  design. "Just me" is a Group of one in which the keeper is the Owner.

## Success Criteria

### Primary
A Household Keeper can run the full solo dopamine loop end-to-end: capture a
recurring Round (name + interval, nothing more), open the app to a single "what's
due" list, complete a Round with one tap and watch it vanish and silently
reschedule from the moment of completion, and see a running count of completions
grow over time. State is cloud-synced across their own phone and tablet on both
iOS and Android. The "never miss twice" anti-snooze logic is in effect: a second
snooze on the same Round triggers a gentle intervention rather than another free
deferral, and the cumulative tally counts only real completions. This is the increment
that tests the core bet — does making upkeep satisfying make people do more of
it — and it ships as a genuinely useful single-player app.

### Secondary
Grouping / filtering Rounds by property domain (house, garden, car(s), pool) for
at-a-glance organization. A nice-to-have that improves legibility but is not
required for the loop to deliver value.

### Guardrails
- **Single-list integrity.** The home screen stays one short, uncluttered
  "what's due" list. Completed and not-yet-due Rounds never clutter it — an empty
  list is the reward state.
- **Zero administration.** Beyond a name and an interval, the app never asks the
  keeper to configure scheduling rules, sync, or settings. It must not become
  something to *manage*.
- **Group-ready data model.** A solo keeper is a Group of one. The model must be
  built so the later social layer (multiple members, invites, shared completion)
  is an additive extension, never a rewrite of the solo increment.

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
- FR-008: Household Keeper can see a running cumulative tally of completed Rounds that only ever grows (e.g. all-time and per-month) and counts only real completions, never snoozes. Priority: must-have
> Challenge: A consecutive streak that can break pulls harder but punishes a miss with guilt — the exact failure mode Rounds exists to avoid. Rejected. The reward is pure positive accumulation with no breakable state.

### Sync
- FR-009: Household Keeper has their Rounds and tally cloud-synced across their own phone and tablet, on both iOS and Android. Priority: must-have

### Organization
- FR-010: Household Keeper can tag a Round by property domain (house / garden / car(s) / pool) and filter the due list by domain. Priority: nice-to-have
> Challenge: Domain tagging risks reintroducing administration overhead (the keeper curating categories) — kept as nice-to-have only, off the critical path, so the zero-admin guardrail holds for the core loop.

_FR-001 through FR-006 and FR-009 are mechanical consequences of the locked
first-increment flow (create / view what's due / complete / be reminded / sync).
No counterargument raised; kept as written._

## User Stories

### US-01 — Complete a due Round (the core loop)
- **Given** a Household Keeper with at least one Round due today,
- **When** they open Rounds and tap that Round,
- **Then** the Round disappears from the "what's due" list with immediate positive feedback (no confirmation step), the next occurrence is scheduled N intervals from the moment of completion, and the cumulative tally increments by one.

## Business Logic

Rounds decides when each task next becomes due by counting its interval forward
from the moment the user actually completed it — never from a fixed calendar
date — and governs deferral so the user cannot quietly defer forever.

The user-visible inputs are a Round's recurrence interval, the completion event
(a single tap), and the occasional snooze action. From these the app computes a
next-due moment and a due/overdue state, and increments the cumulative Tally on
each genuine completion. There is exactly one scheduling rule for every Round —
recurs-from-completion — so the user never configures scheduling behavior; the
calendar-bound cases (insurance, inspections) are approximated as long intervals
rather than fixed dates, preserving the single-rule simplicity.

Deferral is governed, not free: the first snooze on a due Round defers it; a
second snooze on the same Round is refused as a deferral and instead surfaces the
fact that the Round has been pushed twice, leaving it as gently overdue. This is
the "never miss twice" principle — the app makes self-deception visible rather
than punishing it. The user meets this logic at two moments only: completing a
Round, and attempting a second snooze.

## Non-Functional Requirements

- **Instant completion feedback.** Tapping Done updates the UI and plays its reward feedback immediately, without waiting on the network (optimistic local update).
- **Offline-first.** The keeper can view what's due and complete or snooze Rounds with no connectivity; changes reconcile automatically when back online.
- **Cross-device convergence.** A change on one of the keeper's devices appears on their other device within seconds when both are online.
- **Reliable reminders.** Due notifications fire even when the app is backgrounded or closed.
- **No silent data loss.** Completions and the Tally survive app restarts, offline periods, and switching devices.
- **Privacy.** A keeper's Rounds and Tally are private to them (and, in the later social layer, only to their Group); never exposed or repurposed.
- **Device coverage.** iOS and Android, phone and tablet form factors.

## Non-Goals
- **Social / group layer** (multiple members, invites, shared completion, real-life-together Rounds) — deferred to increment 2; the MVP proves the solo loop first on a group-ready model.
- **Calendar integration** — rejected; it fights the single-list, low-thinking design and is the most expensive thing to build.
- **Gamification beyond the cumulative Tally** (badges, leaderboards, kudos, levels, breakable streaks) — rejected; Rounds relies on internal and shared reward, not external validation.
- **Mileage- or season-based scheduling triggers** — approximated by intervals to preserve the single scheduling rule.
- **Task-shrinking on second snooze** — parked; revisit after the core loop is validated.
- **Vendor / marketplace actions** (booking a mechanic, ordering pool chemicals) — out; Rounds tracks commitments, it does not transact.
- **Expense tracking & maintenance history log** — out; the only history that matters in the MVP is the Tally.
- **Pre-built task templates / household library** — out; keepers create their own Rounds, keeping the model simple.
- **Web / desktop version** — out; mobile-only (phone + tablet).

## Glossary

# Rounds — Glossary

Shared vocabulary for the Rounds household-and-togetherness app, so code,
conversations, and UI all use one canonical set of terms.

## Language

**Round**:
A single recurring commitment a person tracks in the app — either a household
maintenance task or a real-life shared activity. Recurs from completion on a
fixed interval.
_Avoid_: chore, todo, reminder, item

**Group**:
A set of people who share a pool of Rounds and can each complete them. "Just me"
is a Group of one; a household and a circle of friends are each a Group. One
engine serves all of them.
_Avoid_: team, list, circle (as the canonical term)

**Tally**:
The running, cumulative count of completed Rounds. Only ever grows; never resets
and never breaks. The app's reward signal — positive accumulation, no streak to
lose.
_Avoid_: streak, score, points

**Group Owner**:
The creator of a Group. Controls membership (invite/remove) and can delete the
Group; otherwise has the same task capabilities as a Member.
_Avoid_: admin, manager

**Member**:
A person in a Group who can create, complete, and edit Rounds but cannot manage
membership.
_Avoid_: participant, collaborator

**Household Keeper**:
The primary persona — the person carrying the mental load of property upkeep who
also wants more shared real-life activity.
_Avoid_: user, admin, owner

## Decisions

### ADR-0001: One scheduling rule — recurs-from-completion
All Rounds recur from the moment of completion on a single interval; there are no
fixed-date, mileage-based, or seasonal triggers. Calendar-bound tasks (insurance,
inspections) are approximated as long intervals. **Trade-off:** accepts mild
imprecision for date-locked tasks in exchange for a single, zero-configuration
scheduling model the user never has to manage. Surprising because a reader would
expect insurance to carry a real renewal date; this is a deliberate simplicity
choice. Status: accepted.

### ADR-0002: Solo-first increment on a group-ready model
The first increment ships as a single-player app (Group of one) even though the
"do things together in real life" mission is half the product's reason to exist.
The data model is built groups-first so the social layer is an additive extension,
not a rewrite. **Trade-off:** the first increment does not test the togetherness
thesis, but it validates the core dopamine loop cheaply and de-risks the
expensive multi-user sync work. Status: accepted.

### ADR-0003: Node.js/TypeScript backend (NestJS + Prisma), Supabase for identity
The backend was originally pinned to Python 3.12 / FastAPI. It is now Node.js /
TypeScript on NestJS + Prisma over PostgreSQL, with identity delegated to Supabase
Auth (managed Apple/Google sign-in) and the backend verifying the Supabase-issued
JWT behind a swappable verifier. **Why:** Rounds is offline-first, so client and
server must agree exactly on each synced row's shape, version, and tombstone
semantics; a TypeScript backend lets that sync contract live in one shared package
both the API and the React Native app import. Delegating sign-in to Supabase
retired the main argument for Python (mature two-provider token validation), and
pnpm/Vitest are already the house JS defaults. **Trade-off:** introduces Supabase
as an identity dependency (mitigated by isolating it behind a verifier interface)
and accepts Node's slightly less batteries-included relational tooling versus
FastAPI. Status: accepted.

## Open Questions
- Task "shrinking" on second snooze (Fogg make-it-easy) — deferred from MVP; revisit once the core loop is validated. Needs a per-Round notion of a "smaller version", which not all Rounds have.
- Mileage- or season-based triggers (e.g. oil by km, pool only in summer) — out of scope; approximated by intervals for now. Revisit if interval approximation proves too coarse.
