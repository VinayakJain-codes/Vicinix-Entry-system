# Phase 1: Project Setup - Plan

## 1. Next.js 15 Initialization
- **Action**: Run Next.js CLI to scaffold project
- **Commands**:
  ```bash
  npx -y create-next-app@latest ./ --typescript --tailwind --eslint --app --src-dir --import-alias "@/*" --use-npm
  ```
- **Action**: Clean up default boilerplate in `src/app/page.tsx` and `src/app/globals.css`.

## 2. Supabase SDK Setup
- **Action**: Install Supabase packages
- **Commands**:
  ```bash
  npm install @supabase/supabase-js @supabase/ssr
  ```
- **Action**: Create `.env.local` and `.env.example` with Supabase environment variables placeholder.

## 3. Supabase Local Configuration & Migrations
- **Action**: Initialize Supabase locally
- **Commands**:
  ```bash
  npx supabase init
  npx supabase migration new initial_schema
  ```
- **Action**: Edit the generated migration file to include schemas for `user_roles`, `events`, `students`, and `master_qr`, configuring basic RLS.

## 4. [BLOCKING] Schema Push
- **Action**: Start Supabase and apply migrations to the local database
- **Commands**:
  ```bash
  npx supabase start
  npx supabase db reset
  ```
- *Note: Manual intervention might be required if Docker is not running.*

## 5. Basic UI Verification Page
- **Action**: Update `src/app/page.tsx` to include a simple title: "Marketnera QR Entry System" and basic Tailwind styling to verify frontend works.

## 6. Vercel Preparation
- **Action**: Update `.gitignore` and ensure `package.json` scripts are ready for deployment.
