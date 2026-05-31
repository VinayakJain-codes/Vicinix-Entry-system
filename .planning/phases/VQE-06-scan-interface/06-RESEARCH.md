# Phase 6: Scan Interface & API - Research

## Goal
`POST /api/scan` route, verifies token securely via Edge Function, prevents double-scanning.

## Tech Stack & Tooling
- **Backend**: Next.js App Router Route Handlers (`app/api/scan/route.ts`).
- **Database**: Supabase SSR Client.
- **Frontend QR Scanner**: `html5-qrcode` library for robust camera access across iOS/Android.

## Implementation Strategy

### 1. API Route (`/api/scan/route.ts`)
The API should:
1. Verify the requester is authenticated (Guard, Admin, or Super Admin).
2. Look up the student by `token`.
3. If not found, return `404` (Invalid Token).
4. If found, check `qr_status`. If `scanned`, return `400` (Already Scanned).
5. If valid, update `qr_status` to `scanned` and `scanned_at` (need to add column or just rely on updated_at). Return `200` with student details.

### 2. Database Schema
No schema updates strictly required, but adding a `scanned_at` timestamp is helpful for analytics. We will add `scanned_at TIMESTAMPTZ` to the `students` table.
The RLS policies currently restrict Guards from reading/writing `students`. The API route will run on the server, so it can use the authenticated user's session. But since the RLS policy for `students` restricts access to `admin` and `super_admin`, the API route must use the Service Role Key to bypass RLS, OR we must update the RLS policy to allow Guards to update specific rows.
Given the Blueprint constraint: "Guards must not have direct DB query access; all validation runs securely through server-side `/api/scan`", using the Service Role Key on the server-side API is the cleanest approach, as it prevents any client-side tampering by Guards.

### 3. Client UI
- A full-screen or prominent camera view.
- A cooldown mechanism (e.g., pause scanning for 2 seconds after a scan) to prevent spamming the API with the same QR code.
- Clear visual and audio feedback (Green checkmark, Red cross).

## Risks & Pitfalls
- **Concurrency (Double Scans)**: If two guards scan the same token at the exact same millisecond, we could have a race condition. Since Supabase is Postgres, we can do a targeted atomic update: `UPDATE students SET qr_status = 'scanned' WHERE token = 'X' AND qr_status != 'scanned' RETURNING *`. If no rows are returned, it means it was already scanned or invalid.
- **Camera Permissions**: iOS Safari requires HTTPS or localhost for camera access. Must handle permission denial gracefully.

## Validation Architecture
- Scan an invalid token -> Expect "Invalid".
- Scan a valid token -> Expect "Success".
- Scan the same valid token again immediately -> Expect "Already Scanned".
