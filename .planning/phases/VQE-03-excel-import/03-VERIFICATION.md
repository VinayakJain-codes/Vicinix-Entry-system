# Phase 3: Excel Import - Verification

## Release Criteria
- [ ] Admins can upload an Excel file via the dashboard.
- [ ] The system parses the file, deduplicates rows, and saves to the database.
- [ ] UI displays correct feedback on the number of rows imported vs. skipped.

## Verification Steps
1. Create a test Excel file with 3 rows (2 unique, 1 duplicate phone number).
2. Log in as an Admin.
3. Upload the file via the Dashboard form.
4. Verify the success message says "Imported 2, Skipped 1".
5. Check Supabase Studio to ensure 1 new event and 2 new students were created.
