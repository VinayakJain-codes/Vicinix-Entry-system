# Phase 3: Excel Import - Plan

## 1. Database Schema Update
- **Action**: Create a new Supabase migration for `events` and `students` tables.
- **Commands**: `npx supabase migration new excel_import_tables`
- **Action**: Define tables with RLS policies allowing Admins/Super Admins full access, and Guards no access to read/write these directly.
- **Action**: Apply schema to local DB using `npx supabase db push`. [BLOCKING]

## 2. Dependencies
- **Action**: Install `xlsx`.
- **Commands**: `npm install xlsx`

## 3. Server Action for File Processing
- **Action**: Create `src/app/dashboard/importAction.ts`.
- **Action**: Implement the logic to receive `FormData`, parse the Excel file with `xlsx`, deduplicate based on phone numbers, create a new Event record, and bulk insert the student records.
- **Action**: Return an object with stats: `{ imported: number, skipped: number, error?: string }`.

## 4. Dashboard UI Components
- **Action**: Update `src/app/dashboard/page.tsx` to include an "Upload Roster" form.
- **Action**: Add a file input (`accept=".xlsx, .xls, .csv"`) and a submit button.
- **Action**: Use React's `useActionState` (or similar pattern) to display the returned stats/feedback to the user after processing.
