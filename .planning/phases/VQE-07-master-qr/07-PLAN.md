# Phase 7: Master QR - Plan

## 1. Database Schema (RPC for atomic increment)
- **Action**: Create a new migration to add an RPC function for incrementing the master scan count.
  - `npx supabase migration new increment_master_scan`
  - SQL: `CREATE OR REPLACE FUNCTION increment_master_scan(event_uuid UUID) RETURNS void AS $$ BEGIN UPDATE events SET master_scan_count = COALESCE(master_scan_count, 0) + 1 WHERE id = event_uuid; END; $$ LANGUAGE plpgsql;`

## 2. API Route (`/api/scan/route.ts`)
- **Action**: Modify the POST handler. If a student is not found by token, check the `events` table for `master_qr_token`.
- **Action**: If found, call the `increment_master_scan` RPC.
- **Action**: Return a JSON response indicating a Master Token scan (e.g., `{ success: true, isMaster: true, event: {...} }`).

## 3. Scan Interface (`src/app/scan/page.tsx`)
- **Action**: Update the UI to handle the `isMaster` response.
- **Action**: Display a distinct color/message for Master Token scans (e.g., Blue or Purple "VIP ENTRY GRANTED").

## 4. Dashboard UI (`src/app/dashboard/page.tsx`)
- **Action**: Add `react-qr-code` or similar library.
- **Commands**: `npm install react-qr-code`
- **Action**: In `DashboardPage`, iterate through events and display their `master_scan_count`.
- **Action**: Provide a button or inline view to show the Master QR Code for each event.
