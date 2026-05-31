# Phase 9: Polish & Deploy - Execution Plan

## 1. Global Setup
- Run `npm install react-hot-toast`.
- Modify `src/app/layout.tsx` to add the `<Toaster />` component for global toast notifications.

## 2. Skeleton Loaders
- **`StatCards.tsx`**: When `loading` is true, render a grid of 3 cards with `animate-pulse` and gray background rectangles instead of text.
- **`StudentTable.tsx`**: When `loading` is true, render 5 table rows with `animate-pulse` placeholders.
- **`LiveEntryFeed.tsx`**: Add a local loading state (e.g., while fetching the initial 50 scans) and render `animate-pulse` skeleton rows.

## 3. Error Handling (Toasts)
- **`ImportRosterForm.tsx`**: Replace the inline error `div` with `toast.error()` and use `toast.success()` for successful imports.
- **`BlastSection.tsx`**: Replace the inline error `div` with `toast.error()`. Use `toast.success()` when the blast loop completes successfully.
- **`GenerateQRsSection.tsx`**: Replace inline error with `toast.error()`.
- **`MasterQRSection.tsx`**: Add `toast.error()` for any potential generation errors.

## 4. Documentation
- Create `GUARD_GUIDE.md` in the repository root. Include sections on:
  1. Accessing the scan interface via mobile browser.
  2. Logging in with the shared event password.
  3. Scanning rules (one-time use, master QR).
  4. Understanding GRANTED vs DENIED screens.

## 5. Deployment Prep
- Ensure code builds cleanly (`npm run build`). No CLI deployment command will be run per the user's request.
