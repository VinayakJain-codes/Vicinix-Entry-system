# Phase 9: Polish & Deploy - Research Notes

## Current State
- `package.json` does not have `react-hot-toast` installed.
- `ImportRosterForm.tsx` and `BlastSection.tsx` use inline error states (e.g. `<div className="text-red-700...">{error}</div>`).
- `StudentTable.tsx`, `StatCards.tsx`, and `LiveEntryFeed.tsx` display generic "Loading..." text or empty states while fetching data.

## To-Do
1. Install `react-hot-toast`.
2. Update `src/app/layout.tsx` to include `<Toaster />`.
3. Replace inline error messages with `toast.error()` in:
   - `ImportRosterForm.tsx`
   - `BlastSection.tsx`
   - `GenerateQRsSection.tsx`
   - `MasterQRSection.tsx`
4. Add Tailwind-based skeleton loaders (`animate-pulse`) to:
   - `StatCards.tsx` (cards with dummy numbers/bars)
   - `LiveEntryFeed.tsx` (shimmering list items)
   - `StudentTable.tsx` (shimmering rows)
5. Create `GUARD_GUIDE.md` containing simple instructions for guards.
6. Conduct a quick manual review for mobile responsiveness.
