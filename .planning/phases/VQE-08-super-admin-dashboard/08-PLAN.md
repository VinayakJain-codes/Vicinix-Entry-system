# Phase 8: Super Admin Dashboard - Plan

## Phase Goal
Realtime entry feed, stat cards, full student table, search/filter/export

## 1. Dashboard Layout Reorganization
- **File:** `src/app/dashboard/page.tsx`
- **Action:** Refactor the layout to be mobile-first and organized. 
- **Details:** 
  - Move the existing administrative actions (Import, Generate, Blast, Master QR) into an expandable or stacked "Administrative Actions" section.
  - Make room at the top for `<StatCards />`.
  - Add a main area with tabs or stacked views for `<LiveEntryFeed />` and `<StudentTable />`.

## 2. Server Actions for Data Fetching
- **File:** `src/app/dashboard/actions.ts` (New)
- **Action:** Create Server Actions to fetch dashboard data.
- **Details:**
  - `getDashboardStats(eventId: string)`: Returns total students, total entered (`scanned_at != null`), and master scans.
  - `getStudents(eventId: string)`: Returns the full list of students for the table.

## 3. Stat Cards Component (Polling)
- **File:** `src/app/dashboard/StatCards.tsx` (New)
- **Action:** Create a Client Component for displaying aggregate stats.
- **Details:**
  - Use `useEffect` and `setInterval` to poll `getDashboardStats` every 5 seconds.
  - Display modern, Tailwind-styled metric cards for Headcount and Master Scans.

## 4. Live Entry Feed Component (Real-time)
- **File:** `src/app/dashboard/LiveEntryFeed.tsx` (New)
- **Action:** Create a Client Component for the infinite scrolling timeline.
- **Details:**
  - Instantiate the Supabase client using `@supabase/ssr` browser client.
  - Subscribe to `postgres_changes` on the `students` table (`event: 'UPDATE'`).
  - When a student's `scanned_at` is updated, append them to the top of the feed timeline.

## 5. Student Table Component (Search, Filter, Export)
- **File:** `src/app/dashboard/StudentTable.tsx` (New)
- **Action:** Create a Client Component for managing the roster.
- **Details:**
  - Display student rows (Name, Phone, QR Status, Entry Time).
  - Add text input for searching by name/phone.
  - Add a dropdown for filtering by Entry Status.
  - Implement CSV Export: Provide a button that converts the currently filtered dataset into a CSV string and triggers a standard browser download via `URL.createObjectURL`.

## 6. Real-time Setup & Security
- **File:** Database
- **Action:** Enable Real-time for `students` table.
- **Details:**
  - Verify that the `students` table has Real-time enabled in the Supabase dashboard or via a migration. Since we applied migrations recently, ensure the table is added to the `supabase_realtime` publication. (We will add a new migration to enable real-time on `students`).

## 7. Migration for Real-time
- **File:** `supabase/migrations/20260531174000_enable_realtime.sql` (New)
- **Action:** Create migration to enable real-time publication.
- **Details:**
  - `alter publication supabase_realtime add table students;`
  - Push this migration.
