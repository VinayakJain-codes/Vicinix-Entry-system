# Roadmap

## Phase 1: Project Setup

**Goal:** Next.js 15 + TS + Tailwind init, Supabase project, SQL migration, Vercel deployment, env vars configured
**Mode:** mvp
**Requirements:** None
**Success Criteria:**

1. Next.js App Router project runs successfully with Tailwind CSS
2. Supabase connection is established and SQL schema is applied
3. Environment variables are configured locally

## Phase 2: Auth & Roles

**Goal:** Supabase Auth setup, `user_roles` table, login page, guard/admin/super_admin flows
**Mode:** mvp
**Requirements:** AUTH-01, AUTH-02
**Success Criteria:**

1. Users can log in using Supabase Auth
2. Users are correctly identified as Super Admin, Admin, or Guard
3. Guards are restricted by RLS to only access the scan API

## Phase 3: Excel Import

**Goal:** Upload UI, SheetJS parsing, student insert API, preview table, validation
**Mode:** mvp
**Requirements:** IMPORT-01, IMPORT-02, IMPORT-03
**Success Criteria:**

1. Super Admin can select an event and upload a .xlsx file
2. Data is parsed, validated, and successfully inserted into the `students` table
3. Skipped rows generate a downloadable error report

## Phase 4: QR Generation

**Goal:** Server-side QR with `qrcode` npm, Marketnera-first card design, Supabase Storage upload
**Mode:** mvp
**Requirements:** QR-01, QR-02, QR-03
**Success Criteria:**

1. A unique `qr_token` (UUID v4) is generated for each student
2. A customized, dual-branded QR card is generated combining Marketnera and Vicinix branding
3. QR cards are uploaded to Supabase Storage and URLs are linked to students

## Phase 5: WhatsApp Blast

**Goal:** Meta Cloud API integration, template send, progress bar, retry logic
**Mode:** mvp
**Requirements:** WA-01, WA-02, WA-03
**Success Criteria:**

1. Super Admin can trigger message blasts via Meta Cloud API
2. Messages contain the student's branded QR card image
3. Failed deliveries are logged and can be retried

## Phase 6: Scan Interface

**Goal:** `html5-qrcode` setup, mobile UI, scan API, one-time use logic
**Mode:** mvp
**Requirements:** SCAN-01, SCAN-02, SCAN-03
**Success Criteria:**

1. Guard interface opens camera and successfully scans QRs
2. Scanning a valid QR shows a green GRANTED full-screen and updates the student record
3. Scanning an already used QR shows a red DENIED full-screen with the original entry timestamp

## Phase 7: Master QR

**Goal:** Master token generation per event, scan count increment, display on dashboard
**Mode:** mvp
**Requirements:** SCAN-04
**Success Criteria:**

1. System generates a `master_qr_token` for the event
2. Scanning the master token increments `master_scan_count` without expiring
3. Guard interface handles master scans natively

## Phase 8: Super Admin Dashboard

**Goal:** Realtime entry feed, stat cards, full student table, search/filter/export
**Mode:** mvp
**Requirements:** ADMIN-01, ADMIN-02, ADMIN-03
**Success Criteria:**

1. Dashboard stat cards update accurately
2. Entry feed scrolls with live updates via Supabase Realtime without page refreshes
3. Admins can view, search, filter, and export the full student list

## Phase 9: Polish & Deploy

**Goal:** Mobile responsiveness QA, error states, loading skeletons, final Vercel deploy
**Mode:** mvp
**Requirements:** None
**Success Criteria:**

1. UI functions smoothly across all mobile form factors
2. All loading and error states are properly handled
3. Application is successfully deployed to Vercel and fully operational
