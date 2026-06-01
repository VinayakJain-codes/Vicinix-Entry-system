# Marketnera Entry System — Master Enhancement Plan
### 10x Upgrade Roadmap · Based on repo audit of `VinayakJain-codes/Vicinix-Entry-system`
**Stack:** Next.js 16, TypeScript, Supabase, Tailwind CSS v4 | **May 2026**

---

## Repo Audit Summary — What's Already Built

| File | Status | Quality |
|---|---|---|
| `src/app/page.tsx` | ✅ Landing page | Functional, basic styling |
| `src/app/login/page.tsx` | ✅ Login | Works, light-mode only |
| `src/app/dashboard/page.tsx` | ✅ Dashboard shell | Auth check + event fetch done |
| `src/app/dashboard/EventOverview.tsx` | ✅ Event selector + layout | Good structure |
| `src/app/dashboard/StatCards.tsx` | ✅ 3 stat cards | Polling every 5s (not realtime) |
| `src/app/dashboard/LiveEntryFeed.tsx` | ✅ Realtime feed | Supabase Realtime wired correctly |
| `src/app/dashboard/StudentTable.tsx` | ✅ Student table | Search + filter + CSV export |
| `src/app/dashboard/ImportRosterForm.tsx` | ✅ Excel import | Works, only reads col 0+1 |
| `src/app/dashboard/GenerateQRsSection.tsx` | ✅ QR generation | Batch loop working |
| `src/app/dashboard/BlastSection.tsx` | ✅ WhatsApp blast | Rate-limited correctly |
| `src/app/dashboard/MasterQRSection.tsx` | ✅ Master QR | Renders + shows scan count |
| `src/app/scan/page.tsx` | ✅ Guard scan page | Fully functional, basic UI |
| `src/app/api/scan/route.ts` | ✅ Scan API | Atomic update, race-condition safe |
| `src/app/dashboard/actions.ts` | ✅ Server actions | Clean |
| `src/app/dashboard/qrAction.ts` | ✅ QR action | Sharp + logo compositing works |
| `src/app/dashboard/blastAction.ts` | ✅ WhatsApp action | Batch + rate limit |
| `src/app/dashboard/importAction.ts` | ✅ Import action | Only reads Name + Phone (⚠️) |
| `src/middleware.ts` | ✅ Auth middleware | Correct pattern |
| `supabase/migrations/` | ✅ 8 migrations | Schema is solid |

### Critical Gaps Found in Current Code

1. **Import only reads 2 columns** — `importAction.ts` reads `row[0]` (name) and `row[1]` (phone). No student_id, enrollment_no, or email columns. The DB schema also lacks these fields entirely.
2. **Stats use polling (5s interval)** — `StatCards.tsx` uses `setInterval` instead of Supabase Realtime. Inconsistent with `LiveEntryFeed.tsx` which correctly uses Realtime.
3. **No guard auth on scan page** — `/scan` page has no login/auth check. Anyone with the URL can scan.
4. **`events` table missing `master_qr_token`** — The DB schema has no `master_qr_token` field. `MasterQRSection.tsx` renders `selectedEvent.master_qr_token` which will always be undefined. **Master QR is broken.**
5. **QR card has no student name/ID** — `qrAction.ts` composites logo below QR but adds no text. Students get a plain QR + logo with no name/ID printed.
6. **No event date field** — `events` table has no `date` column. Can't show event date in dashboard or QR card.
7. **Single dashboard page** — All admin actions crammed into one page. No routing separation for guard vs admin vs super_admin.
8. **No guard-specific UI** — Guards who log in go to the same `/dashboard` instead of `/scan`. No role-based redirect.
9. **`user_roles` uses `id` not `user_id`** — The FK column is named `id` (same as PK), not `user_id`. Confusing and inconsistent with the planned schema.
10. **No WhatsApp error recovery UI** — `qr_status: 'error'` students have no way to be retried individually.
11. **globals.css is near-empty** — No Marketnera design tokens, no custom animations, no font setup. Everything is ad-hoc Tailwind.
12. **No `/admin/events` page** — Events can only be created via the import form. No way to view, rename, or deactivate events.
13. **Scan page shows `student.phone_number`** on result screen — Privacy concern. Guards don't need to see phone numbers.
14. **No `scan_logs` table** — All scan history is derived from `students.scanned_at`. Can't track which guard scanned, which gate, or denied attempts.

---

## Enhancement Plan — 9 Phases

---

### PHASE 1 — Database Schema Upgrade
**Priority: CRITICAL — do this first, everything else depends on it**

#### 1.1 — Add missing columns to `students`

```sql
-- Migration: add_student_fields.sql
ALTER TABLE public.students
  ADD COLUMN IF NOT EXISTS student_id TEXT,
  ADD COLUMN IF NOT EXISTS enrollment_no TEXT,
  ADD COLUMN IF NOT EXISTS email TEXT;
```

#### 1.2 — Fix `events` table — add `master_qr_token` + `date`

```sql
-- Migration: fix_events_table.sql
ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS master_qr_token UUID DEFAULT gen_random_uuid() UNIQUE,
  ADD COLUMN IF NOT EXISTS date DATE,
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- Backfill existing events
UPDATE public.events SET master_qr_token = gen_random_uuid() WHERE master_qr_token IS NULL;
```

#### 1.3 — Add `scan_logs` table

```sql
-- Migration: add_scan_logs.sql
CREATE TABLE IF NOT EXISTS public.scan_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES public.students(id) ON DELETE SET NULL,
  event_id UUID REFERENCES public.events(id) ON DELETE CASCADE,
  scanned_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  scan_result TEXT CHECK (scan_result IN ('GRANTED', 'DENIED', 'MASTER')) NOT NULL,
  scanned_at TIMESTAMPTZ DEFAULT NOW(),
  gate_label TEXT DEFAULT 'Main Gate'
);

ALTER TABLE public.scan_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins read scan logs" ON public.scan_logs
  FOR SELECT USING (
    (SELECT role FROM public.user_roles WHERE id = auth.uid()) IN ('admin', 'super_admin')
  );

-- Enable realtime on scan_logs too
ALTER PUBLICATION supabase_realtime ADD TABLE public.scan_logs;
```

#### 1.4 — Rename `user_roles.id` → `user_id` (clarity)

```sql
-- Migration: fix_user_roles_column.sql
-- Note: Supabase FK to auth.users is already correct, just renaming for clarity
ALTER TABLE public.user_roles RENAME COLUMN id TO user_id;
```

#### 1.5 — Updated TypeScript types

Update `src/types/database.types.ts` to reflect all new columns. Run `supabase gen types typescript` after migration.

---

### PHASE 2 — Fix `importAction.ts` — Read All 5 Columns

**Current:** Only reads `row[0]` (name) and `row[1]` (phone). Ignores student_id, enrollment_no, email.

**Fix in `src/app/dashboard/importAction.ts`:**

```typescript
// CURRENT (broken for your Excel format):
const name = row[0]
let rawPhone = row[1]

// REPLACE WITH — reads all 5 columns:
// Expected Excel: Name | Phone | Student ID | Enrollment No | Email
const name        = row[0]
let rawPhone      = row[1]
const studentId   = row[2] ? String(row[2]).trim() : null
const enrollmentNo = row[3] ? String(row[3]).trim() : null
const email       = row[4] ? String(row[4]).trim() : null

// And in the insert:
studentsToInsert.push({
  event_id: event.id,
  name: String(name).trim(),
  phone_number: phone,
  student_id: studentId,
  enrollment_no: enrollmentNo,
  email: email,
})
```

**Also add column header detection** — don't assume fixed positions. Detect headers from row 0:

```typescript
// Smart header detection
const headers = (json[0] as string[]).map(h => String(h).toLowerCase().trim())
const nameIdx    = headers.findIndex(h => h.includes('name'))
const phoneIdx   = headers.findIndex(h => h.includes('phone') || h.includes('whatsapp') || h.includes('mobile'))
const sidIdx     = headers.findIndex(h => h.includes('student') && h.includes('id'))
const enrollIdx  = headers.findIndex(h => h.includes('enroll'))
const emailIdx   = headers.findIndex(h => h.includes('email'))
```

**Also fix event creation** — add `date` field to the form and insert:

```tsx
// ImportRosterForm.tsx — add date input
<input type="date" name="eventDate" required className="..." />
```

---

### PHASE 3 — Fix Master QR (Broken Feature)

**Root cause:** `events.master_qr_token` doesn't exist in DB yet. Fixed by Phase 1.2.

**Additional fixes needed:**

#### 3.1 — `MasterQRSection.tsx` — render correct token URL
The QR should encode the full scannable URL, not just the raw UUID:

```tsx
// CURRENT (broken):
<QRCode value={selectedEvent.master_qr_token} ... />

// FIX:
const scanUrl = `${process.env.NEXT_PUBLIC_APP_URL}/scan?token=${selectedEvent.master_qr_token}`
<QRCode value={scanUrl} ... />
```

#### 3.2 — `api/scan/route.ts` — master token lookup needs URL parsing

```typescript
// CURRENT: looks up raw token string
// But QR now encodes a full URL → extract token from URL param:
let lookupToken = token
try {
  const url = new URL(token)
  lookupToken = url.searchParams.get('token') || token
} catch {
  // token is already a raw UUID, use as-is
}
```

#### 3.3 — Add live master scan count via Realtime
`MasterQRSection.tsx` currently shows a static count from server render. Add Supabase Realtime subscription on the `events` table to update count live.

---

### PHASE 4 — Guard Auth + Role-Based Routing

**Current:** Guards who log in land on `/dashboard` (admin page). Scan page has zero auth.

#### 4.1 — Update `middleware.ts` — role-based redirect

```typescript
// After auth check, check role and redirect accordingly:
const { data: roleData } = await supabase
  .from('user_roles')
  .select('role')
  .eq('user_id', user.id)  // after column rename
  .single()

const role = roleData?.role
const path = request.nextUrl.pathname

// Guards trying to access dashboard → redirect to scan
if (role === 'guard' && path.startsWith('/dashboard')) {
  return NextResponse.redirect(new URL('/scan', request.url))
}

// Non-guards trying to access scan → redirect to dashboard
if (role !== 'guard' && path === '/scan') {
  return NextResponse.redirect(new URL('/dashboard', request.url))
}

// Unauthenticated on any protected route → login
if (!user && !isPublicRoute) {
  return NextResponse.redirect(new URL('/login', request.url))
}
```

#### 4.2 — `scan/page.tsx` — add auth state display

Show the logged-in guard's name/email in the scan header so they know they're authenticated.

#### 4.3 — `login/page.tsx` — redirect based on role after login

```typescript
// login/actions.ts — after successful login:
if (role === 'guard') return { success: true, redirectUrl: '/scan' }
if (role === 'admin' || role === 'super_admin') return { success: true, redirectUrl: '/dashboard' }
```

---

### PHASE 5 — UI Overhaul (10x Design Upgrade)

This is the biggest visual lift. Current UI is functional but generic. Target: **production-grade dark dashboard** with Marketnera identity baked in.

#### 5.1 — `globals.css` — Full Design System

Replace the near-empty `globals.css` with a complete design token system:

```css
/* globals.css — full replacement */
@import "tailwindcss";
@import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;600&display=swap');

@theme {
  /* Marketnera brand */
  --color-marketnera:       #13EC5B;
  --color-marketnera-dark:  #0FBF49;
  --color-marketnera-glow:  rgba(19, 236, 91, 0.15);

  /* Vicinix sponsor */
  --color-vicinix:          #F97316;

  /* Dark surfaces */
  --color-bg:        #0A0F0D;   /* near-black with green undertone */
  --color-surface:   #111918;   /* card bg */
  --color-surface-2: #1A2420;   /* nested card bg */
  --color-border:    #1F2D28;   /* subtle borders */
  --color-muted:     #4B6358;   /* secondary text */
  --color-text:      #E8F5F0;   /* primary text */

  /* Status */
  --color-granted:  #13EC5B;
  --color-denied:   #EF4444;
  --color-pending:  #F59E0B;

  /* Fonts */
  --font-display: 'Space Grotesk', sans-serif;
  --font-mono:    'JetBrains Mono', monospace;
}

body {
  background-color: var(--color-bg);
  color: var(--color-text);
  font-family: var(--font-display);
}

/* Marketnera glow effect for cards */
.card-glow {
  box-shadow: 0 0 0 1px var(--color-border),
              0 4px 24px rgba(19, 236, 91, 0.06);
}

.card-glow:hover {
  box-shadow: 0 0 0 1px rgba(19, 236, 91, 0.3),
              0 8px 32px rgba(19, 236, 91, 0.12);
}

/* Scan frame animation */
@keyframes scan-pulse {
  0%, 100% { border-color: rgba(19, 236, 91, 0.6); }
  50%       { border-color: rgba(19, 236, 91, 1); box-shadow: 0 0 20px rgba(19, 236, 91, 0.4); }
}

.scan-frame { animation: scan-pulse 2s ease-in-out infinite; }

/* Entry feed item animation */
@keyframes slide-in-top {
  from { opacity: 0; transform: translateY(-12px); }
  to   { opacity: 1; transform: translateY(0); }
}

.feed-item { animation: slide-in-top 0.3s ease-out; }

/* Number counter animation */
@keyframes count-up {
  from { opacity: 0; transform: scale(0.8); }
  to   { opacity: 1; transform: scale(1); }
}
```

#### 5.2 — `layout.tsx` — Dark theme, proper fonts

```tsx
import { Space_Grotesk } from 'next/font/google'

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-display',
  weight: ['400', '500', '600', '700', '800']
})

// metadata
export const metadata: Metadata = {
  title: 'Marketnera Entry',
  description: 'Real-time QR entry management by Marketnera × Vicinix',
  themeColor: '#13EC5B',
}

// body: always dark
<html lang="en" className={`${spaceGrotesk.variable} h-full`}>
  <body className="min-h-full flex flex-col bg-[#0A0F0D] text-[#E8F5F0]">
```

#### 5.3 — `page.tsx` (Landing) — Marketnera hero

Replace the basic card with a full dark landing:

```tsx
// Marketnera Entry landing — dark, cinematic
// - Full-viewport dark background with subtle green gradient radial
// - Large "MARKETNERA" wordmark centered
// - "Event Entry System" subtitle in muted
// - Animated green pulsing circle behind logo
// - "Sign In" button: green bg, black text, full width with arrow icon
// - Bottom: "Tech by Vicinix" in tiny orange muted text
// - Background: faint grid pattern overlay for depth
```

**Exact design direction:** Think Vercel dashboard meets Apple dark mode. Clean, premium, functional. No gradients on buttons. No shadows everywhere. Just sharp geometry and the Marketnera green as the single accent color.

#### 5.4 — `login/page.tsx` — Full dark redesign

```tsx
// New login page design:
// - Full dark bg (#0A0F0D)
// - Centered card with #111918 background, 1px green-tinted border
// - MARKETNERA wordmark at top of card in green
// - "Sign in to continue" subtitle in muted
// - Email + password inputs: dark bg, green focus ring
// - Submit button: green bg, black text, loading spinner
// - "Built by Vicinix" footer in tiny orange
```

#### 5.5 — `dashboard/page.tsx` — Sidebar layout

Replace the current single-column page with a proper sidebar layout:

```
┌──────────────────────────────────────────────────────────┐
│ MARKETNERA          [Event: Annual Fest 2026 ▾]  [Logout]│  ← topbar
├─────────────┬────────────────────────────────────────────┤
│             │                                            │
│  📊 Overview│    [STAT CARDS]                            │
│  👥 Students│    [LIVE FEED]    [STUDENT TABLE]          │
│  📤 Import  │                                            │
│  📱 QR Gen  │                                            │
│  💬 Blast   │                                            │
│  🎯 Master  │                                            │
│  🗓️ Events  │                                            │
│             │                                            │
│  Tech by    │                                            │
│  Vicinix 🟠 │                                            │
└─────────────┴────────────────────────────────────────────┘
```

Implement as `src/app/dashboard/layout.tsx` with a persistent sidebar:

```tsx
// src/app/dashboard/layout.tsx
const navItems = [
  { href: '/dashboard',          label: 'Overview',  icon: BarChart3 },
  { href: '/dashboard/students', label: 'Students',  icon: Users },
  { href: '/dashboard/import',   label: 'Import',    icon: Upload },
  { href: '/dashboard/qr',       label: 'Generate QRs', icon: QrCode },
  { href: '/dashboard/blast',    label: 'WA Blast',  icon: MessageCircle },
  { href: '/dashboard/master',   label: 'Master QR', icon: ShieldCheck },
  { href: '/dashboard/events',   label: 'Events',    icon: Calendar },
]
```

#### 5.6 — `StatCards.tsx` — Switch to Supabase Realtime (kill the 5s interval)

```typescript
// Replace setInterval polling with Supabase Realtime channel:
useEffect(() => {
  const supabase = createClient()
  
  const channel = supabase
    .channel(`stats-${eventId}`)
    .on('postgres_changes', {
      event: '*', schema: 'public', table: 'students',
      filter: `event_id=eq.${eventId}`
    }, () => fetchStats())  // refetch on any student change
    .on('postgres_changes', {
      event: 'UPDATE', schema: 'public', table: 'events',
      filter: `id=eq.${eventId}`
    }, () => fetchStats())
    .subscribe()

  fetchStats()
  return () => supabase.removeChannel(channel)
}, [eventId])
```

Also upgrade stat card design:
- Dark surface background `#111918`
- Green `#13EC5B` top border-t-2 on all cards
- Large number: `text-5xl font-black text-marketnera`
- Progress bar for inside/total — animated fill
- Add a 4th card: "QR Delivered" (count of `qr_status = 'sent'`)

#### 5.7 — `LiveEntryFeed.tsx` — Premium feed design

```tsx
// Each feed item:
<div className="feed-item flex items-center gap-3 p-3 rounded-xl bg-surface-2 border border-border hover:border-marketnera/30 transition-all">
  {/* Avatar: first letter of name in green circle */}
  <div className="w-9 h-9 rounded-full bg-marketnera/20 border border-marketnera/40 flex items-center justify-center text-marketnera font-bold text-sm flex-shrink-0">
    {student.name[0].toUpperCase()}
  </div>
  <div className="flex-1 min-w-0">
    <p className="font-semibold text-text truncate">{student.name}</p>
    <p className="text-xs text-muted font-mono">{student.student_id || student.phone_number}</p>
  </div>
  <div className="text-right flex-shrink-0">
    <span className="text-xs font-bold text-marketnera bg-marketnera/10 px-2 py-0.5 rounded-full">GRANTED</span>
    <p className="text-[10px] text-muted mt-1 font-mono">{time}</p>
  </div>
</div>
```

#### 5.8 — `StudentTable.tsx` — Add missing columns + upgrade

Add `student_id` and `enrollment_no` columns to the table (currently missing). Add a "View QR" button per row that opens a modal with the QR image.

```tsx
// Table columns upgrade:
// Name | Student ID | Enrollment No | Phone | QR Status | Entry Status | Scanned At
// + "View QR" icon button per row → modal with QR image
// + "Resend WA" icon button for qr_status === 'error' rows
```

Also: search should cover `student_id` and `enrollment_no`, not just name and phone.

#### 5.9 — `scan/page.tsx` — Full mobile-first redesign

This is the guards' primary interface. Must be flawless on a smartphone.

```tsx
// New scan page structure:
//
// ┌─────────────────────────┐
// │ 🟢 MARKETNERA  Gate A ▾ │  ← sticky header, gate selector
// │    [guard email]        │
// ├─────────────────────────┤
// │                         │
// │  ┌───────────────────┐  │
// │  │                   │  │  ← scan frame, green animated border
// │  │   CAMERA FEED     │  │
// │  │                   │  │
// │  └───────────────────┘  │
// │                         │
// │  [🔦 Torch]  [↺ Reset]  │
// │                         │
// │  Scans today: 47        │  ← session counter
// └─────────────────────────┘
//
// GRANTED overlay (full screen green flash, 2.5s then auto-reset):
// ┌─────────────────────────┐
// │                         │
// │         ✓               │  ← large check icon, white
// │   ENTRY GRANTED         │  ← 48px bold
// │   Vinayak Jain          │  ← student name
// │   ID: VU2025001         │  ← student_id
// │   Enrollment: 2025-CS-1 │  ← enrollment_no
// │                         │
// │   [Scan Next →]         │  ← tap to scan again early
// │                         │
// │   MARKETNERA            │  ← watermark
// └─────────────────────────┘
//
// DENIED overlay (full screen red):
// - Show student name + "Already scanned at HH:MM"
```

**Key UX improvements:**
- Gate selector in header (Gate A / Gate B / Main Gate / VIP) — logs with scan
- Session scan counter (how many this guard has scanned this session)
- Auto-reset after 2.5s — no tap needed for the next scan
- Haptic feedback via `navigator.vibrate()` — 1 short pulse for GRANTED, 3 for DENIED
- Sound feedback: short beep on GRANTED, error tone on DENIED (Web Audio API)
- `qrbox` size increased from 250px to responsive (80% of viewport width)

---

### PHASE 6 — New Pages & Routes

#### 6.1 — `src/app/dashboard/events/page.tsx` (NEW)

Events management page:
- Table of all events: name, date, student count, is_active toggle
- "Create Event" button → modal with name + date fields
- "Archive" / "Activate" toggle per event
- Clicking an event → sets it as the selected event in dashboard

#### 6.2 — `src/app/dashboard/import/page.tsx` (extracted from dashboard)

Move `ImportRosterForm` to its own page. Enhance with:
- Drag-and-drop Excel upload area (not just file input)
- Column mapping UI — let admin map their Excel columns to the system fields
- Preview table showing first 5 rows before import
- Validation errors shown per row before committing

#### 6.3 — `src/app/dashboard/qr/page.tsx` (extracted)

Move `GenerateQRsSection` to its own page. Add:
- Progress bar with percentage (not just "Processed: X. Remaining: Y")
- Per-student QR preview grid after generation

#### 6.4 — `src/app/dashboard/blast/page.tsx` (extracted)

Move `BlastSection` to its own page. Add:
- Delivery stats: sent / failed / pending per event
- "Retry Failed" button for `qr_status = 'error'` students
- Real-time delivery progress bar

#### 6.5 — `src/app/dashboard/master/page.tsx` (extracted)

Move `MasterQRSection` to its own page. Fix the broken feature (Phase 3) and add:
- Large printable QR (800×800px)
- Download button for QR image
- Live scan count with Realtime subscription
- Timestamp of last scan

---

### PHASE 7 — API Upgrades

#### 7.1 — `api/scan/route.ts` — Log to `scan_logs`

After every scan (GRANTED, DENIED, MASTER), insert a row into `scan_logs`:

```typescript
// After successful GRANTED:
await supabaseAdmin.from('scan_logs').insert({
  student_id: updatedStudent.id,
  event_id: updatedStudent.event_id,
  scanned_by: user.id,
  scan_result: 'GRANTED',
  gate_label: gate_label || 'Main Gate'
})

// For DENIED (already scanned):
await supabaseAdmin.from('scan_logs').insert({
  student_id: student.id,
  event_id: student.event_id,
  scanned_by: user.id,
  scan_result: 'DENIED',
  gate_label: gate_label || 'Main Gate'
})

// For MASTER:
await supabaseAdmin.from('scan_logs').insert({
  event_id: event.id,
  scanned_by: user.id,
  scan_result: 'MASTER',
  gate_label: gate_label || 'Main Gate'
})
```

Also accept `gate_label` in the POST body from the scan page.

#### 7.2 — `api/scan/route.ts` — URL token extraction

Handle QR codes that encode a full URL (see Phase 3.2):

```typescript
let lookupToken = token
try {
  const url = new URL(token)
  lookupToken = url.searchParams.get('token') || token
} catch {
  // raw token, use as-is
}
```

#### 7.3 — Add `api/events/route.ts` (NEW)

```typescript
// GET /api/events → list all events with student counts
// POST /api/events → create new event
// PATCH /api/events/[id] → update event (name, date, is_active)
```

---

### PHASE 8 — QR Card Design Upgrade

**Current:** `qrAction.ts` composites a 300×300 QR with the logo pasted below. No text, no branding beyond the logo.

**Target:** The QR card students receive on WhatsApp should look designed — not auto-generated.

#### New QR card layout (using Sharp + SVG text overlay):

```typescript
// Full card: 512 × 620px
// Zone 1 (0-8px):   Green #13EC5B full-width strip
// Zone 2 (8-88px):  Dark #0A0F0D header
//   - "MARKETNERA" wordmark (SVG text, green, 28px bold)
//   - Event name (SVG text, muted, 13px)
// Zone 3 (88-468px): White #FFFFFF QR zone
//   - QR matrix centered (360×360px)
// Zone 4 (468-560px): White info zone
//   - Student name (SVG text, dark, 16px bold)
//   - Student ID + Enrollment (SVG text, muted, 12px)
// Zone 5 (560-620px): Dark footer
//   - "marketnera.in" left (green, 12px)
//   - "Tech: Vicinix" right (orange, 10px muted)

// SVG text overlay generation:
const svgOverlay = Buffer.from(`
<svg width="512" height="620" xmlns="http://www.w3.org/2000/svg">
  <text x="24" y="54" font-family="Arial" font-size="26" font-weight="800"
        fill="#13EC5B" letter-spacing="2">${eventName.toUpperCase()}</text>
  <text x="24" y="74" font-family="Arial" font-size="12"
        fill="#4B6358">${eventDate}</text>
  <text x="256" y="520" font-family="Arial" font-size="16" font-weight="700"
        fill="#111827" text-anchor="middle">${student.name}</text>
  <text x="256" y="540" font-family="Arial" font-size="11"
        fill="#6B7280" text-anchor="middle">
    ID: ${student.student_id || 'N/A'} · Enroll: ${student.enrollment_no || 'N/A'}
  </text>
  <text x="24" y="600" font-family="Arial" font-size="12" font-weight="600"
        fill="#13EC5B">marketnera.in</text>
  <text x="488" y="600" font-family="Arial" font-size="10"
        fill="#F97316" text-anchor="end" opacity="0.7">Tech: Vicinix</text>
</svg>
`)
```

Also: pass `student.name`, `student.student_id`, `student.enrollment_no`, and `eventName` into `generateQRsForEvent` — currently the QR action only fetches `id` and `phone_number`.

---

### PHASE 9 — Polish & Production

#### 9.1 — Error boundaries

Wrap all dashboard sections in React error boundaries. A failed stat fetch shouldn't crash the whole dashboard.

#### 9.2 — Loading states

Every section currently has its own ad-hoc loader. Create a shared `<Skeleton>` component:

```tsx
// src/components/ui/Skeleton.tsx
export function Skeleton({ className }: { className?: string }) {
  return (
    <div className={`animate-pulse rounded-lg bg-surface-2 ${className}`} />
  )
}
```

#### 9.3 — Toast system upgrade

Current `react-hot-toast` works but is unstyled. Override with Marketnera colors:

```tsx
<Toaster
  position="top-right"
  toastOptions={{
    style: {
      background: '#111918',
      color: '#E8F5F0',
      border: '1px solid #1F2D28',
      fontFamily: 'Space Grotesk, sans-serif',
    },
    success: { iconTheme: { primary: '#13EC5B', secondary: '#0A0F0D' } },
    error: { iconTheme: { primary: '#EF4444', secondary: '#0A0F0D' } },
  }}
/>
```

#### 9.4 — Metadata & PWA

```typescript
// layout.tsx metadata upgrade
export const metadata: Metadata = {
  title: { template: '%s | Marketnera Entry', default: 'Marketnera Entry' },
  description: 'Real-time QR event entry management',
  themeColor: '#13EC5B',
  manifest: '/manifest.json',  // PWA manifest
  icons: { icon: '/favicon-marketnera.ico', apple: '/apple-touch-icon.png' },
}
```

Add `/public/manifest.json` for PWA:

```json
{
  "name": "Marketnera Entry",
  "short_name": "MN Entry",
  "start_url": "/scan",
  "display": "fullscreen",
  "background_color": "#0A0F0D",
  "theme_color": "#13EC5B",
  "icons": [{ "src": "/icon-192.png", "sizes": "192x192", "type": "image/png" }]
}
```

This makes the scan page installable as a PWA — guards can add it to their home screen.

#### 9.5 — Vercel deployment checklist

```
☐ Set all env vars in Vercel dashboard
☐ Set NEXT_PUBLIC_APP_URL to production domain
☐ Supabase: enable Realtime for students + scan_logs + events tables
☐ Supabase: confirm RLS policies are active
☐ Meta: get WhatsApp template approved (1-24hr)
☐ Test full flow: import → generate → blast → scan
☐ Create guard accounts in Supabase Auth + assign 'guard' role
☐ Test scan on actual guard smartphone (not just desktop)
```

---

## Complete File Change Map

| File | Action | What Changes |
|---|---|---|
| `supabase/migrations/` | **ADD 4 new migrations** | `master_qr_token`, `scan_logs`, `student_id`, `enrollment_no`, `email`, `date` fields |
| `src/types/database.types.ts` | **REGENERATE** | `supabase gen types typescript` after migrations |
| `src/app/globals.css` | **REWRITE** | Full Marketnera design system, fonts, animations |
| `src/app/layout.tsx` | **UPDATE** | Space Grotesk font, dark theme, PWA metadata |
| `src/app/page.tsx` | **REDESIGN** | Dark Marketnera hero, premium landing |
| `src/app/login/page.tsx` | **REDESIGN** | Full dark, Marketnera identity |
| `src/app/dashboard/layout.tsx` | **CREATE NEW** | Persistent sidebar navigation |
| `src/app/dashboard/page.tsx` | **SIMPLIFY** | Overview only, no admin actions |
| `src/app/dashboard/StatCards.tsx` | **UPDATE** | Realtime (kill polling), 4th card, dark design |
| `src/app/dashboard/LiveEntryFeed.tsx` | **UPDATE** | Avatar initials, premium card design |
| `src/app/dashboard/StudentTable.tsx` | **UPDATE** | Add student_id + enrollment_no columns, View QR button |
| `src/app/dashboard/EventOverview.tsx` | **UPDATE** | Cleaner event selector |
| `src/app/dashboard/ImportRosterForm.tsx` | **UPDATE** | Move to /import page, drag-drop, column mapping |
| `src/app/dashboard/events/page.tsx` | **CREATE NEW** | Events management page |
| `src/app/dashboard/import/page.tsx` | **CREATE NEW** | Dedicated import page |
| `src/app/dashboard/qr/page.tsx` | **CREATE NEW** | Dedicated QR generation page |
| `src/app/dashboard/blast/page.tsx` | **CREATE NEW** | Dedicated blast page + retry |
| `src/app/dashboard/master/page.tsx` | **CREATE NEW** | Master QR fixed + live count |
| `src/app/scan/page.tsx` | **REWRITE** | Mobile-first, gate selector, auto-reset, haptics, sounds |
| `src/app/api/scan/route.ts` | **UPDATE** | scan_logs insert, gate_label, URL token parsing |
| `src/app/api/events/route.ts` | **CREATE NEW** | Events CRUD API |
| `src/app/dashboard/actions.ts` | **UPDATE** | Add scan_logs query for dashboard |
| `src/app/dashboard/importAction.ts` | **UPDATE** | Read 5 columns, smart header detection |
| `src/app/dashboard/qrAction.ts` | **UPDATE** | SVG text overlay, student info on QR card |
| `src/middleware.ts` | **UPDATE** | Role-based redirect (guard→/scan, admin→/dashboard) |
| `src/components/ui/Skeleton.tsx` | **CREATE NEW** | Shared skeleton loader |
| `src/components/ui/Modal.tsx` | **CREATE NEW** | QR preview modal |
| `public/manifest.json` | **CREATE NEW** | PWA manifest for scan page |

---

## Priority Order (What to Build First)

```
Week 1 — CRITICAL FIXES (system correctness)
  ├── Phase 1: DB migrations (master_qr_token, scan_logs, student fields)
  ├── Phase 2: Fix importAction.ts (read all 5 columns)
  ├── Phase 3: Fix Master QR (broken feature)
  └── Phase 4: Guard auth + role-based routing

Week 2 — CORE UI UPGRADE
  ├── Phase 5.1-5.4: globals.css + layout + landing + login
  ├── Phase 5.5: Sidebar dashboard layout
  ├── Phase 5.6: StatCards → Realtime
  └── Phase 5.9: Scan page full mobile redesign

Week 3 — FEATURE COMPLETENESS
  ├── Phase 6: New pages (events, import, qr, blast, master)
  ├── Phase 7: API upgrades (scan_logs, URL parsing)
  └── Phase 8: QR card design (SVG text overlay)

Week 4 — POLISH
  └── Phase 9: Error boundaries, skeletons, toasts, PWA
```

---

## npm Packages to Add

```bash
# Icons (replace ad-hoc emoji with proper icons)
npm install lucide-react

# Animation
npm install framer-motion

# QR image download (for master QR download button)
npm install file-saver @types/file-saver

# Drag-and-drop file upload
npm install react-dropzone

# Date formatting
npm install date-fns
```

---

*Marketnera Entry System — Master Enhancement Plan · Tech by Vicinix*
*Based on repo: VinayakJain-codes/Vicinix-Entry-system · Audited May 2026*
