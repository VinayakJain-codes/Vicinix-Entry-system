# Phase 7: Master QR - Verification

## Release Criteria
- [ ] Scanning a Master QR token returns a successful "VIP" or "Master" response.
- [ ] Scanning the same Master QR multiple times succeeds every time.
- [ ] Dashboard displays the `master_scan_count` accurately.
- [ ] Admin can view/download the Master QR from the dashboard.

## Verification Steps
1. Navigate to the Admin Dashboard.
2. View the Master QR code for an active event.
3. Open the `/scan` interface on a mobile device or separate window.
4. Scan the Master QR code.
5. Verify the scanner UI shows a distinct "VIP" success state.
6. Verify the dashboard's master scan count increments by 1.
7. Scan the Master QR code again.
8. Verify it succeeds again and increments the count to 2.
