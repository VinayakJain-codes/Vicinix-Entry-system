# Phase 2: Auth & Roles - Research

## Goal
Supabase Auth setup, `user_roles` table, login page, guard/admin/super_admin flows.

## Tech Stack & Tooling
- **Auth**: `@supabase/ssr` (Cookie-based auth for Next.js App Router)
- **Middleware**: Next.js Middleware for route protection
- **Database**: PostgreSQL (Supabase) + Row Level Security (RLS)

## Implementation Strategy

### 1. Database Schema & RLS
We need a table to store roles:
```sql
create type user_role as enum ('super_admin', 'admin', 'guard');

create table public.user_roles (
  id uuid references auth.users on delete cascade primary key,
  role user_role default 'guard'::user_role not null
);

-- RLS
alter table public.user_roles enable row level security;
-- Only super_admins can manage roles
create policy "Super admins can manage roles" on public.user_roles for all using (
  (select role from public.user_roles where id = auth.uid()) = 'super_admin'
);
-- Users can read their own role
create policy "Users can read own role" on public.user_roles for select using (
  id = auth.uid()
);
```

### 2. Next.js Middleware
Create `src/middleware.ts` to check `supabase.auth.getUser()`.
If the user is not authenticated and trying to access protected routes (e.g. `/dashboard`, `/scan`), redirect them to `/login`.

### 3. Login Flow
Build `src/app/login/page.tsx` with a simple email/password form.
Submit to a Server Action that calls `supabase.auth.signInWithPassword()`.
On success, redirect to the appropriate route depending on their role (Guards go to `/scan`, Admins to `/dashboard`).

## Risks & Pitfalls
- **Middleware Performance**: Avoid heavy database calls in middleware. Fetch the user role on the specific pages or rely on RLS where possible, rather than blocking the middleware.
- **RLS Bypass**: Make sure the backend Supabase client used in Server Actions uses the user's cookies (via `@supabase/ssr`), not the `service_role` key, to ensure RLS is enforced.

## Validation Architecture
- Verify that a non-logged in user is redirected to `/login`.
- Verify a Guard cannot access `/dashboard`.
- Verify a Super Admin can log in successfully.
