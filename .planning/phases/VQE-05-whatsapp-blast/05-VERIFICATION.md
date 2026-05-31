# Phase 5: WhatsApp Blast - Verification

## Release Criteria
- [ ] Admin can trigger a WhatsApp blast from the dashboard.
- [ ] System sends messages using the Meta WhatsApp API.
- [ ] Staggered 15ms delays are enforced to prevent rate limit blocks.
- [ ] System handles invalid numbers gracefully.
- [ ] DB `qr_status` updates to `sent`.

## Verification Steps
1. Add test phone numbers (including your own valid WhatsApp number) to a test event.
2. Generate QRs for the event.
3. Click "Blast QRs" on the dashboard.
4. Verify the client updates progress iteratively without timing out.
5. Verify you receive the WhatsApp template message with the QR image attached.
6. Verify the Supabase database reflects `qr_status = 'sent'` for the test records.
