# Phase 1: Project Setup - Research

## Goal
Next.js 15 + TS + Tailwind init, Supabase project, SQL migration, Vercel deployment, env vars configured

## Tech Stack & Tooling

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Backend/DB**: Supabase (PostgreSQL + Auth + Storage)
- **Hosting**: Vercel

## Implementation Strategy

### 1. Next.js 15 Initialization
Use the Next.js CLI to scaffold the project with all recommended defaults:
- Command: `npx create-next-app@latest ./ --typescript --tailwind --eslint --app --src-dir --import-alias "@/*" --use-npm`
- Ensure the `src` directory is used to keep the root clean for configuration files.

### 2. Supabase Integration
- Install Supabase packages: `@supabase/supabase-js` and `@supabase/ssr` (for Next.js App Router server-side auth support).
- Create a `.env.local` file with:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- Create utility files in `src/utils/supabase/` for `client.ts`, `server.ts`, and `middleware.ts`.

### 3. Database Schema & Migrations
The blueprint specifies the following schema needed for the project:
1. `users` (handled by Supabase Auth `auth.users`)
2. `user_roles` (custom table referencing `auth.users`)
3. `events` (for tracking event instances)
4. `students` (student data imported from Excel)
5. `master_qr` (master tracking token)

A Supabase migration script should be created to define these tables and set up basic Row Level Security (RLS) policies.
Command: `npx supabase init` and `npx supabase migration new initial_schema`.

### 4. Vercel Deployment Setup
- Ensure `vercel.json` is not needed as Vercel auto-detects Next.js.
- Ensure environment variables are documented in a `.env.example` file for Vercel deployment configuration.

## Risks & Pitfalls
- **Next.js 15 Caching**: Be careful with App Router caching semantics, especially when dealing with Supabase Auth state. Use `unstable_noStore` or dynamic rendering where auth state is read.
- **Supabase SSR**: Ensure cookies are read/written correctly in Next.js Server Components and Server Actions using `@supabase/ssr` to prevent auth desync issues.

## Validation Architecture
- Validate Next.js build (`npm run build`) works without type errors.
- Validate Supabase connection by successfully reading from a table or checking auth state.
