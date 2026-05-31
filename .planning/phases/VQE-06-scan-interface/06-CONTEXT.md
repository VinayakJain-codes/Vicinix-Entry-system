# Phase 6: Scan Interface & API - Context

**Gathered:** 2026-05-31
**Status:** Ready for planning
**Source:** PRD Express Path (Vicinix_QR_Entry_System_Blueprint.md)

<domain>
## Phase Boundary

Develop the secure `POST /api/scan` route to validate QR tokens server-side, preventing double-scanning and spoofing. Concurrently, build the Guard interface UI (`src/app/scan/page.tsx`) utilizing a device camera to scan QRs and display real-time entry feedback.
</domain>

<decisions>
## Implementation Decisions

### Core Requirements
- **Security**: Guards must not have direct database querying privileges. All validation must route through `/api/scan`.
- **API Endpoint**: Accepts `{ token: string }`. Returns `{ success: true, student: {...} }` or `{ error: string }`.
- **States**: The endpoint must handle three core states:
  1. Valid token, not scanned -> Mark as `scanned`, return Success (Green).
  2. Valid token, already scanned -> Return Error (Yellow/Red - "Already Scanned").
  3. Invalid token -> Return Error (Red - "Invalid Token").
- **UI**: The `/scan` page should use a robust client-side QR scanner library (e.g., `html5-qrcode`).

### The Agent's Discretion
- Choice of React QR scanner library.
- UI layout for the scanner (fullscreen vs modal) and success/error overlays.
</decisions>

<canonical_refs>
## Canonical References
- `.planning/PROJECT.md`
- `.planning/REQUIREMENTS.md`
- `.planning/ROADMAP.md`
</canonical_refs>

<specifics>
## Specific Ideas
- Use `html5-qrcode` as it supports both mobile and desktop browsers robustly.
- The `/api/scan` route should use Supabase Service Role key (or just the authenticated Guard session) to perform the update securely.
</specifics>

<deferred>
## Deferred Ideas
None
</deferred>

---

*Phase: 06-scan-interface*
