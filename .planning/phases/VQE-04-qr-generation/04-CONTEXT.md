# Phase 4: QR Generation - Context

**Gathered:** 2026-05-31
**Status:** Ready for planning
**Source:** PRD Express Path (Vicinix_QR_Entry_System_Blueprint.md)

<domain>
## Phase Boundary

Implement an edge function (or Server Action) that triggers after an Excel import to generate a unique 64-character token for each student, encode it into a QR code image, store the image in Supabase Storage, and save the token to the `students` table.
</domain>

<decisions>
## Implementation Decisions

### Core Requirements
- Generate a secure 64-char crypto token for each student.
- Generate a QR code image encoding the token.
- Store the QR code in Supabase Storage (`qrs` bucket).
- Save the token and storage URL to the student record in the database.

### The Agent's Discretion
- Background processing mechanism vs inline synchronous processing.
- The `qrcode` NPM library can be used.
</decisions>

<canonical_refs>
## Canonical References
- `.planning/PROJECT.md`
- `.planning/REQUIREMENTS.md`
- `.planning/ROADMAP.md`
</canonical_refs>

<specifics>
## Specific Ideas
- Table `students`: Needs a `token` column (TEXT, UNIQUE) and a `qr_url` column (TEXT).
</specifics>

<deferred>
## Deferred Ideas
None
</deferred>

---

*Phase: 04-qr-generation*
