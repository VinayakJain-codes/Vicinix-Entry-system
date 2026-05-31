# Phase 5: WhatsApp Blast - Context

**Gathered:** 2026-05-31
**Status:** Ready for planning
**Source:** PRD Express Path (Vicinix_QR_Entry_System_Blueprint.md)

<domain>
## Phase Boundary

Implement the WhatsApp delivery mechanism using the Meta WhatsApp API to blast messages containing the unique QR code link to each student in a roster. Ensure strict compliance with Meta's 80 messages/second rate limit by implementing a queue/delay mechanism.
</domain>

<decisions>
## Implementation Decisions

### Core Requirements
- Integrate with the Meta WhatsApp Cloud API to send message templates.
- Implement a throttling mechanism with a 15ms delay between each message dispatch.
- Message payload should include the student's name, event details, and the QR code image link from Supabase Storage.
- Update the student's `qr_status` in Supabase to `sent` upon successful API request.
- Provide real-time delivery status feedback to the Admin Dashboard.

### The Agent's Discretion
- Approach to throttling (e.g., standard Node.js `setTimeout` in an edge function vs. a dedicated queue system).
- The specific UI representation of the "Blast" button and progress bar.
</decisions>

<canonical_refs>
## Canonical References
- `.planning/PROJECT.md`
- `.planning/REQUIREMENTS.md`
- `.planning/ROADMAP.md`
</canonical_refs>

<specifics>
## Specific Ideas
- Next.js Server Action `blastWhatsApp(eventId: string, batchSize: number = 100)` that returns chunked progress to the UI.
</specifics>

<deferred>
## Deferred Ideas
None
</deferred>

---

*Phase: 05-whatsapp-blast*
