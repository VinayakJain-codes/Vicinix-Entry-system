# Phase 3: Excel Import - Context

**Gathered:** 2026-05-31
**Status:** Ready for planning
**Source:** PRD Express Path (Vicinix_QR_Entry_System_Blueprint.md)

<domain>
## Phase Boundary

Implement the Super Admin / Admin dashboard feature to upload an Excel file containing a student roster, parse the rows into `[Name, Phone Number]`, deduplicate based on phone numbers, and insert the valid rows into the `events` and `students` tables in Supabase.
</domain>

<decisions>
## Implementation Decisions

### Core Requirements
- Use a Server Action to process the uploaded file securely.
- Parse the Excel file using the `xlsx` library.
- Deduplicate student records using the phone number column.
- Create an event record in `events` table to associate the imported students with a specific event.
- Return success/error stats (e.g. "Imported 350, Skipped 10 duplicates") to the UI.

### The Agent's Discretion
- The UI component for the drag-and-drop file uploader on the dashboard.
- Phone number normalization rules (e.g. stripping spaces or formatting to E.164).
</decisions>

<canonical_refs>
## Canonical References
- `.planning/PROJECT.md`
- `.planning/REQUIREMENTS.md`
- `.planning/ROADMAP.md`
</canonical_refs>

<specifics>
## Specific Ideas
- Table `events`: `id`, `name`, `date`, `created_at`
- Table `students`: `id`, `event_id`, `name`, `phone_number`, `qr_status` (pending, sent, scanned)
</specifics>

<deferred>
## Deferred Ideas
None
</deferred>

---

*Phase: 03-excel-import*
