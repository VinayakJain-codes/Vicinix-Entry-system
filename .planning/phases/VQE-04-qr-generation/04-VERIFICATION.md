# Phase 4: QR Generation - Verification

## Release Criteria
- [ ] Admins can trigger QR generation for an event.
- [ ] System generates unique 64-char tokens and QR images.
- [ ] Images are saved in Supabase Storage and URLs are recorded in the DB.
- [ ] Batch processing prevents timeouts for large rosters.

## Verification Steps
1. Navigate to the Admin Dashboard.
2. Click "Generate QRs" for the previously imported test event.
3. Check the Supabase Database to ensure `token` and `qr_url` are populated for the students.
4. Check Supabase Storage to ensure the `qrs` bucket contains the image files.
5. Manually scan one of the generated QR images to verify it decodes to the correct 64-character token.
