# Phase 2: Auth & Roles - Context

**Gathered:** 2026-05-31
**Status:** Ready for planning
**Source:** PRD Express Path (Vicinix_QR_Entry_System_Blueprint.md)

<domain>
## Phase Boundary

Set up Supabase Authentication, the `user_roles` mapping table, a simple login page, and the foundational role-based access control (RLS) to distinguish between Super Admin, Admin, and Guard roles.
</domain>

<decisions>
## Implementation Decisions

### Core Requirements
- Use Supabase Auth for user authentication (email/password).
- Implement a `user_roles` table in Postgres that maps a Supabase `auth.uid()` to a specific role enum (`super_admin`, `admin`, `guard`).
- Restrict Guard access completely from dashboard features and only allow them to hit the `/api/scan` route.

### The Agent's Discretion
- The exact layout of the login page, provided it follows the Marketnera styling (zinc-900, clean UI).
- How to structure the route middleware to protect authenticated pages.
</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project Scope
- `.planning/PROJECT.md` — Core value and requirements
- `.planning/REQUIREMENTS.md` — Specific feature IDs
- `.planning/ROADMAP.md` — Phase definitions
</canonical_refs>

<specifics>
## Specific Ideas

- The `user_roles` table should look like: `id` (uuid, primary key, refs auth.users), `role` (text/enum).
- RLS policies must strictly prevent guards from reading other tables directly.
</specifics>

<deferred>
## Deferred Ideas

None — PRD covers phase scope.
</deferred>

---

*Phase: 02-auth-roles*
*Context gathered: 2026-05-31 via PRD Express Path*
