# Phase 5: WhatsApp Blast - Plan

## 1. Environment Setup
- **Action**: Define required environment variables for Meta WhatsApp API in `.env.example` and documentation.
  - `WHATSAPP_TOKEN`
  - `WHATSAPP_PHONE_NUMBER_ID`
  - `WHATSAPP_TEMPLATE_NAME`

## 2. Server Action for Blasting
- **Action**: Create `src/app/dashboard/blastAction.ts`.
- **Action**: Implement `blastWhatsAppForEvent(eventId: string, batchSize: number = 50)`:
  - Fetch up to `batchSize` students where `qr_status = 'pending'` and `token IS NOT NULL`.
  - Create a staggered execution pool (15ms delay between each dispatch) for the batch.
  - Send the Meta API request containing the `qr_url`.
  - Update `qr_status` to `sent` (or `error`) based on the API response.
- **Action**: Return progress `{ processed: number, remaining: number, errors: number }`.

## 3. Dashboard UI Integration
- **Action**: Update `src/app/dashboard/page.tsx` (or a new component `BlastSection.tsx`).
- **Action**: Add a "Blast QRs via WhatsApp" button for an event.
- **Action**: Implement client-side loop calling the Server Action until `remaining === 0`.
- **Action**: Display a progress bar or text indicating the blast progress in real-time.
