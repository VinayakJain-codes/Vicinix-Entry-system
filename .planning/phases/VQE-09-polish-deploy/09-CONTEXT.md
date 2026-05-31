# Phase 9: Polish & Deploy - Context

**Gathered:** 2026-05-31
**Status:** Ready for planning

<domain>
## Phase Boundary

Finalize the application for production deployment. This involves adding skeleton loading states, toast notifications for errors, mobile responsiveness QA, and writing the Guard Onboarding document (GUARD_GUIDE.md).
</domain>

<decisions>
## Implementation Decisions

### Loading States
- Implement shimmering skeleton loaders for all data fetching and transitions, replacing simple generic "Loading..." text where appropriate.

### Error Handling
- Use auto-dismissing Toast notifications for unexpected errors (e.g., network failures, failed imports/blasts). We can use a library like `react-hot-toast` or similar, or build a custom lightweight one.

### Documentation
- Create a `GUARD_GUIDE.md` in the repository root containing instructions for guards on how to access and use the scanner.

### Deployment
- Do not initiate the Vercel deployment via CLI. Just prepare the codebase so it is 100% production-ready for manual deployment.
</decisions>

<canonical_refs>
## Canonical References
- `.planning/PROJECT.md`
- `.planning/REQUIREMENTS.md`
- `.planning/ROADMAP.md`
</canonical_refs>

<specifics>
## Specific Ideas
- Integrate `react-hot-toast` to handle global toast notifications easily.
- Update `StudentTable.tsx`, `LiveEntryFeed.tsx`, and `StatCards.tsx` to display skeleton UI while fetching initial data.
</specifics>

<deferred>
## Deferred Ideas
- Automated CLI deployments are deferred to manual execution by the user.
</deferred>

---

*Phase: 09-polish-deploy*
