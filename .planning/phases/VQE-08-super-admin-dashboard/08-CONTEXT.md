# Phase 8: Super Admin Dashboard - Context

**Gathered:** 2026-05-31
**Status:** Ready for planning

<domain>
## Phase Boundary

Deliver a real-time admin interface for Super Admins to monitor the entry feed, view aggregate stat cards, and manage the student table (search, filter, export).
</domain>

<decisions>
## Implementation Decisions

### Real-time Feed Design
- Use a Timeline stream (shows history, scrolls infinitely) via Supabase Realtime for the live entry feed.

### Export Format
- Generate student exports in CSV format for lightweight and universal support.

### Stat Card Updates
- Use periodic polling (e.g., refresh every 5 seconds) for stat cards (headcount, master scans) to save on database subscription load for aggregate counts.

### Dashboard Layout Priority
- Design mobile-first, ensuring Super Admins can primarily monitor the event directly from their phones on-site, with a responsive desktop expansion.
</decisions>

<canonical_refs>
## Canonical References
- `.planning/PROJECT.md`
- `.planning/REQUIREMENTS.md`
- `.planning/ROADMAP.md`
</canonical_refs>

<specifics>
## Specific Ideas
- Polling for the stat cards can be implemented using standard interval polling or SWR with a 5-second `refreshInterval`.
- The timeline stream should append new entries dynamically using a Supabase Realtime subscription.
</specifics>

<deferred>
## Deferred Ideas
None
</deferred>

---

*Phase: 08-super-admin-dashboard*
