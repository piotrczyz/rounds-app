# rs-skills Changelog

All notable changes to this project will be documented in this file.

## [0.6.0] - 2026-06-22

### Added
- New skill `rs-change-from-pr` — reconstructs an **as-built** change record
  (`context/changes/<id>/change.md` + `plan.md`) from a PR or local diff when the
  planning step was skipped. The inverse of `rs-plan`: it reads the code that
  already exists plus the linked issue and writes the SDD trail so review and
  archive have something to stand on. The plan is marked `AS-BUILT`, its
  `## Progress` boxes stay unchecked (rs-impl_review verifies them), and the
  change enters at `status: implemented`. Idempotent — a no-op if the folder
  already exists.

### Changed
- `rs-impl_review` now **checks for the change record first**. If the change
  under review has no `context/changes/<id>/`, it invokes `rs-change-from-pr` to
  backfill an as-built record, then reviews against it (instead of only being
  able to review against the issue's acceptance criteria).

### Why
Spec-driven development needs every implemented change recorded under `context/`.
But code can land without `rs-plan` — a hotfix, or (in the Koda pipeline) a PR
that skipped "Plan a Slice". Those changes left no `context/changes/<id>/` trail,
so `rs-archive` had nothing to archive and the roadmap slice never closed. This
adds the catch-up step and wires the review stage to use it.

### Skills Affected
- `rs-change-from-pr` — new
- `rs-impl_review` — check-and-backfill before review

---

## [0.5.0] - 2026-06-22

### Changed
- `change.md` `title` frontmatter must now be written in English
  - `rs-change` (Creation step) and `rs-plan` (Step 4, when it creates `change.md`) now require the title in English, translating the source slice / issue / roadmap title when it is in another language

### Why
`change.md` is the canonical change-identity file; its `title` previously inherited the source language (e.g. a Polish roadmap/issue title), producing mixed-language internal identities. `change_id` was already English kebab-case — this aligns the human-readable title.

### Migration
No action needed for existing changes. New `change.md` files get English titles; to normalize an existing one, edit its `title:` frontmatter.

### Skills Affected
- `rs-change`, `rs-plan` — title-language rule

---

## [0.4.0] - 2026-06-18

### Changed
- Renamed the `rs-shape` skill to `rs-discovery`
  - Directory `rs-shape/` → `rs-discovery/`
  - Updated all cross-references in `rs-prd`, `rs-init`, README, and ORDERING-AND-CASES

### Why
`rs-discovery` more clearly names what the skill does — the facilitated discovery conversation that captures problem, persona, success criteria, FRs, constraints, glossary, and ADRs.

### Migration
Invoke the skill as `rs-discovery` instead of `rs-shape`. Existing `context/discovery/` artifacts are unaffected — only the skill name changed, not its output paths.

### Skills Affected
- `rs-discovery` (formerly `rs-shape`) — renamed
- `rs-prd`, `rs-init` — updated references

---

## [0.3.0] - 2026-06-17

### Changed
- Renamed the `rs-new` skill to `rs-change`

### Skills Affected
- `rs-change` (formerly `rs-new`) — renamed

---

## [0.2.0] - 2026-06-16

### Removed
- Removed time estimate questions from discovery workflow
  - Removed `estimated_effort` field from discovery-notes schema
  - Removed effort estimation from rs-discovery skill
  - Removed estimated_effort from PRD schema and generation
  - Removed Estimated effort column from plan-brief template

### Why
Estimation is unnecessary when working on different tasks and adds friction to the workflow. The discovery process focuses on product definition, not timeline predictions.

### Migration
If your projects have existing discovery-notes files with `estimated_effort` field, they can remain unchanged — the field is simply no longer requested during `rs-discovery`. Existing PRD files will not be affected.

### Skills Affected
- `rs-discovery` — no longer asks for rough time estimate
- `rs-prd` — no longer copies/validates estimated_effort field
- `rs-plan` — plan-brief template no longer includes effort column

---

## [0.1.0] - 2026-05-XX

### Added
- Initial release of rs-skills plugin
- 12 skills: rs-init, rs-discovery, rs-prd, rs-roadmap, rs-change, rs-research, rs-frame, rs-plan, rs-implement, rs-impl-review, rs-archive, rs-test-plan
- Full discovery → planning → implementation → review workflow
- Greenfield and brownfield support
- Risk-driven test planning via rs-test-plan
