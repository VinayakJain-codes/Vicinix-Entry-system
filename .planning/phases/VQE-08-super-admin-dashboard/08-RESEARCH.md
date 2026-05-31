# Phase 8: Super Admin Dashboard - Research

## Context
This phase builds the Super Admin Dashboard featuring a real-time entry feed, stat cards, and a full student table with search/filter/export capabilities.

## Codebase Context
- The current dashboard (`src/app/dashboard/page.tsx`) is a Server Component with a 2-column grid displaying administrative actions (Import, Generate QRs, Blast, Master QR). 
- `xlsx` is already installed, but since the decision is CSV export, we can use native JavaScript `Blob` and `URL.createObjectURL` to generate and download the CSV without adding extra libraries, or use `xlsx`'s CSV export functionality.
- There are no icon libraries like `lucide-react` or data-fetching libraries like `swr` installed yet.

## Key Findings for Implementation

1. **Real-time Feed (Timeline Stream)**:
   - Supabase Realtime must be used.
   - In a Client Component, we can instantiate the Supabase client and subscribe to `postgres_changes` on the `students` table (e.g., `event: 'UPDATE'`).
   - The feed will display recent entry scans (where `scanned_at` is updated).

2. **Stat Cards (Polling)**:
   - Since the decision is to use periodic polling (every 5 seconds), a dedicated Client Component can use `useEffect` with `setInterval` to periodically call a Next.js Server Action to fetch aggregate counts.
   - Stats to track: Total Students, Total Entered (students with `scanned_at != null`), and Master Scans (sum of `master_scan_count` from `events`).

3. **Student Table & CSV Export**:
   - The table needs client-side state for search (by name/phone) and filtering (by `scanned_at` status).
   - Export logic: Generate a CSV string dynamically from the currently filtered data and trigger a browser download.

4. **Layout & Mobile-First Approach**:
   - The dashboard `page.tsx` will become quite crowded if we just append these new features.
   - We should reorganize the dashboard:
     - Keep the Administrative Actions in an "Actions" section (stacked on mobile, grid on desktop).
     - Add the Stat Cards at the top (highly visible).
     - Place the Real-time Feed and Student Table in tabs or stacked sections below.
   - Ensure all tables and feeds have proper `overflow-x-auto` for mobile screens.

## Next Steps for Planning
- Plan the creation of Client Components: `<StatCards />`, `<LiveEntryFeed />`, and `<StudentTable />`.
- Plan the Server Actions needed for fetching stats and the initial student list.
- Reorganize `src/app/dashboard/page.tsx` to integrate these new components elegantly.
