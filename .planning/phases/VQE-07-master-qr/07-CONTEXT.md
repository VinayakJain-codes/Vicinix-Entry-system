# Phase 7: Master QR - Context

**Gathered:** 2026-05-31
**Status:** Ready for planning
**Source:** PRD Express Path (Vicinix_QR_Entry_System_Blueprint.md)

<domain>
## Phase Boundary

Implement the "Master QR" logic. This involves extending the `/api/scan` endpoint to recognize and process the `master_qr_token` from the `events` table. A master token represents an Event Manager or VIP and acts as a multi-use pass that increments a `master_scan_count` instead of being disabled. We will also display this token and its scan count on the Super Admin Dashboard.
</domain>

<decisions>
## Implementation Decisions

### Core Requirements
- **API Extension**: The `/api/scan` route must first check if the token belongs to a student. If not, it checks if the token belongs to an event's `master_qr_token`.
- **Master Scan Logic**: If it's a master token, increment `events.master_scan_count` by 1 and return a special `MASTER` success result.
- **Dashboard UI**: Provide a way to view/download the Master QR image for each event, and display the `master_scan_count`.

### The Agent's Discretion
- How the Master QR is presented in the dashboard (e.g., a "Show Master QR" button that generates the visual QR on the fly).
</decisions>

<canonical_refs>
## Canonical References
- `.planning/PROJECT.md`
- `.planning/REQUIREMENTS.md`
- `.planning/ROADMAP.md`
</canonical_refs>

<specifics>
## Specific Ideas
- Generate the visual QR code for the master token on the fly in the frontend using a lightweight library like `qrcode.react`, or use the same server-side logic we used for students but present it in the UI.
</specifics>

<deferred>
## Deferred Ideas
None
</deferred>

---

*Phase: 07-master-qr*
