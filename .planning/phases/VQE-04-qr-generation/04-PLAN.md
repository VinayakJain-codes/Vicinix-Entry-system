# Phase 4: QR Generation - Plan

## 1. Database & Storage Schema
- **Action**: Create a Supabase migration to add `token` and `qr_url` to the `students` table, and initialize the `qrs` Storage bucket.
- **Commands**: `npx supabase migration new qr_storage_schema`
- **Action**: Apply schema to local DB using `npx supabase db push`. [BLOCKING]

## 2. Dependencies
- **Action**: Install `qrcode`.
- **Commands**: `npm install qrcode`
- **Commands**: `npm install --save-dev @types/qrcode`

## 3. Server Action for Generation
- **Action**: Create `src/app/dashboard/qrAction.ts`.
- **Action**: Implement a function `generateQRsForEvent(eventId: string, batchSize: number = 50)` that:
  - Fetches students without a token for the given event.
  - Generates tokens and QR images.
  - Uploads images to Supabase Storage.
  - Updates the student records.
- **Action**: Return progress stats (e.g., `{ processed: number, remaining: number }`).

## 4. UI Trigger & Progress
- **Action**: Update `src/app/dashboard/page.tsx` or a new component to display the list of events and a "Generate QRs" button.
- **Action**: Implement client-side logic to call the Server Action recursively or iteratively until `remaining === 0` to bypass Vercel timeouts.
