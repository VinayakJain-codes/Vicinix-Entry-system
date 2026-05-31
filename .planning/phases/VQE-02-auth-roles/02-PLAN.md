# Phase 2: Auth & Roles - Plan

## 1. Supabase Utils & Middleware
- **Action**: Create Supabase utility files in `src/utils/supabase/` for `client.ts`, `server.ts`, and `middleware.ts`.
- **Action**: Create `src/middleware.ts` to protect routes (redirect unauthenticated users to `/login`).

## 2. Database Migration for Roles
- **Action**: Create a new migration file via Supabase CLI for the `user_roles` table and RLS policies.
- **Commands**:
  ```bash
  npx supabase migration new auth_roles
  ```
- **Action**: Edit the migration file to define the enum `user_role`, the `user_roles` table, and the RLS policies as defined in the research document.
- **Action**: Run `npx supabase db push` (or `supabase start` + `supabase db reset`) to apply the schema. [BLOCKING]

## 3. Login Page UI
- **Action**: Build `src/app/login/page.tsx` with a clean, Marketnera-styled login form (Email and Password inputs).
- **Action**: Implement Server Actions in `src/app/login/actions.ts` for handling login via `supabase.auth.signInWithPassword()`.

## 4. Role-Based Routing
- **Action**: Update login success handler to fetch the user's role from `user_roles` table.
- **Action**: Redirect `guard` to `/scan` and `admin`/`super_admin` to `/dashboard`.
- **Action**: Create basic placeholder pages for `/scan/page.tsx` and `/dashboard/page.tsx`.
