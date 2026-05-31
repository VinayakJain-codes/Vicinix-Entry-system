# Phase 3: Excel Import - Research

## Goal
Parse roster, deduplicate, insert to students & events tables, UI feedback.

## Tech Stack & Tooling
- **File Parsing**: `xlsx` (SheetJS) library for robust Excel file handling in Node.js.
- **Data Action**: Next.js Server Actions with `FormData`.
- **Database**: Supabase JS Client for bulk inserts.

## Implementation Strategy

### 1. Database Schema
Need to ensure the tables `events` and `students` exist. (From blueprint).
The `students` table should have a composite unique constraint on `(event_id, phone_number)` to prevent duplicate imports for the same event.
```sql
CREATE TABLE public.events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.students (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID REFERENCES public.events(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  phone_number TEXT NOT NULL,
  qr_status TEXT DEFAULT 'pending'
);

ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
-- policies for admin access
```

### 2. Next.js Server Action
Create `src/app/dashboard/importAction.ts`.
Read the `File` object from `FormData`, convert to `ArrayBuffer`, then parse with `xlsx.read(buffer, { type: "buffer" })`.
Extract JSON data from the first sheet.
Clean phone numbers: remove all non-numeric characters.
Deduplicate in memory before sending to Supabase, then use Supabase `insert()` which can accept an array for bulk insertion.
Catch uniqueness constraint violations and report them as "skipped duplicates".

## Risks & Pitfalls
- **Payload Limits**: Next.js Server Actions have a default body size limit (usually 1MB). If the Excel roster is large, we may need to increase the body size limit in `next.config.js` (`serverActions.bodySizeLimit: '5mb'`).
- **Memory**: SheetJS can be memory-heavy. Ensure the processing is done synchronously inside the server action but memory is garbage collected quickly.

## Validation Architecture
- Upload a valid Excel file and ensure records appear in the database.
- Upload a file with duplicate phone numbers and verify the stats correctly report skipped records.
