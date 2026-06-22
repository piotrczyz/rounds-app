---
project: Rounds
context_type: greenfield
created: 2026-06-22
updated: 2026-06-22
source: picked-from-palette
---

# Rounds — Tech Stack

## Languages & Runtimes
- TypeScript (React Native / Expo — mobile; Node.js — backend)
- Node.js 22 (backend API runtime)

## Mobile
- Framework: React Native + Expo (extends the React palette entry; cross-platform iOS + Android)
  > Deviation note: React Native / Expo is not listed explicitly in tech-palette.md (which lists React for web). Recorded here so the palette can be updated to include it.
- Styling: React Native StyleSheet / NativeWind (Tailwind-compatible utility classes for React Native)

## Backend
- Node.js / TypeScript on **NestJS** — REST API for auth, cloud sync, and push-notification dispatch
- ORM / migrations: **Prisma** (type-safe data access, first-class migrations)
- Auth: **Supabase Auth** (managed Apple/Google social sign-in); the backend verifies the Supabase-issued JWT behind a swappable verifier and owns all Rounds data in its own PostgreSQL
  > Deviation note: the backend was originally pinned to Python 3.12 / FastAPI. Switched to Node.js/TypeScript so the API shares one language and a single sync-contract package with the React Native app, and because delegating sign-in to Supabase retired the auth-validation rationale for Python. See ADR-0003.

## Data & Storage
- Database: PostgreSQL (house default)

## Testing
- Unit (JS/TS): Vitest (house default JS/TS unit runner)
- E2E: Playwright (web/API layer); Detox or Maestro for native mobile E2E (off-palette — no house standard yet)

## CI/CD
- GitHub Actions (matches GitHub-hosted repo)

## Issue Tracker
- GitHub Issues (matches GitHub-hosted repo)

## Tooling
- Package manager (JS): pnpm (house default)

## Open Stack Questions
1. **Deploy target** — Docker + Terraform (house IaC); concrete VPS/cloud target not chosen yet. Pin before first infra provisioning. Candidates: AWS ECS, Hetzner VPS, Railway.
2. **Mobile E2E runner** — Detox vs Maestro not decided. Revisit when the first automated mobile UI test is needed.
3. **Push notification service** — Expo Push Notifications (managed) vs APNs/FCM direct. Likely Expo Push for simplicity; confirm before implementing FR-006.
