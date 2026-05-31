# Walking Skeleton — Marketnera QR Entry System

**Phase:** 1
**Generated:** 2026-05-31

## Capability Proven End-to-End

A user can view the application homepage which validates the database connection, rendering the initial scaffolding of the app successfully deployed to Vercel.

## Architectural Decisions

| Decision | Choice | Rationale |
|---|---|---|
| Framework | Next.js 15 App Router | Rapid deployment and built-in API/realtime capabilities. |
| Data layer | Supabase PostgreSQL | Direct integration with Supabase JS client and server-side fetching. |
| Auth | Supabase Auth (SSR) | Built-in RLS and cookie-based auth via @supabase/ssr. |
| Deployment target | Vercel | Zero-config Next.js hosting. |
| Directory layout | `src/app` | Keeps root configuration separate from app code. |

## Stack Touched in Phase 1

- [x] Project scaffold (framework, build, lint, test runner)
- [x] Routing — at least one real route (homepage)
- [x] Database — schema initialized
- [x] UI — basic tailwind layout
- [x] Deployment — running on dev environment / documented Vercel setup

## Out of Scope (Deferred to Later Slices)

- Auth flows (Phase 2)
- Excel import (Phase 3)
- QR Generation (Phase 4)

## Subsequent Slice Plan

Each later phase adds one vertical slice on top of this skeleton without altering its architectural decisions:

- Phase 2: Auth & Roles
- Phase 3: Excel Import
- Phase 4: QR Generation
- Phase 5: WhatsApp Blast
- Phase 6: Scan Interface
