# Phase 2: Auth & Roles - Verification

## Release Criteria
- [ ] Users can log in using email and password.
- [ ] Unauthenticated users are redirected to `/login` when accessing `/dashboard` or `/scan`.
- [ ] Users with the `guard` role are redirected to `/scan` upon login.
- [ ] Users with the `admin` or `super_admin` role are redirected to `/dashboard` upon login.

## Verification Steps
1. Insert test users into `auth.users` and `public.user_roles` via Supabase local studio.
2. Visit `http://localhost:3000/dashboard` in an incognito window; verify redirect to `/login`.
3. Log in as a guard and verify redirect to `/scan`.
4. Log in as an admin and verify redirect to `/dashboard`.
