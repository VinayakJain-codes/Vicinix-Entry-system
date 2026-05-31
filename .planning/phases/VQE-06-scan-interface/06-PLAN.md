# Phase 6: Scan Interface & API - Plan

## 1. Database Schema
- **Action**: Add `scanned_at` column to `students` table.
- **Commands**: `npx supabase migration new add_scanned_at`
- **Action**: Apply schema to local DB using `npx supabase db push`. [BLOCKING]

## 2. API Route (`/api/scan/route.ts`)
- **Action**: Implement the `POST` handler.
- **Action**: Perform an atomic update: `UPDATE students SET qr_status = 'scanned', scanned_at = NOW() WHERE token = ? AND qr_status != 'scanned' RETURNING *;` (using Supabase `.update().eq().neq()`).
- **Action**: Use the Supabase Service Role Key (`@supabase/supabase-js` `createClient`) to bypass RLS since the Guard role shouldn't have direct table access.

## 3. Scanner UI Component
- **Action**: Install `html5-qrcode`.
- **Commands**: `npm install html5-qrcode`
- **Action**: Update `src/app/scan/page.tsx` to include the scanner interface.
- **Action**: Handle camera permissions and rendering the video feed.
- **Action**: On successful decode, pause scanner, call `/api/scan`, and display the result overlay (Success/Already Scanned/Invalid).
- **Action**: Provide a "Next Scan" button or auto-resume after 3 seconds.
