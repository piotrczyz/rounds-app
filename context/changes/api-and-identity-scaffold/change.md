---
change_id: api-and-identity-scaffold
title: API, identity, and sync contract foundation
status: planned
created: 2026-06-22
updated: 2026-06-22
archived_at: null
---

## Notes

Foundation slice F-01 from the roadmap. Establishes the backend: a running
Node.js/TypeScript (NestJS + Prisma) API on PostgreSQL that authenticates a
Household Keeper via Supabase social sign-in (Apple/Google), stores Rounds on a
group-ready data model, serves a read-only Rounds vertical slice, and ships the
data contract for offline sync (FR-009).

Stack decision: switched the backend from the originally-pinned Python/FastAPI to
Node.js/TypeScript (NestJS + Prisma) so the backend shares one language and a
shared sync-contract package with the React Native app, and because the headline
auth-validation risk is now offloaded to Supabase. This deviates from
tech-stack.md as written — Phase 1 updates that file and records the decision as
an ADR.
