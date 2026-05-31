# Marketnera — QR Entry Management System
### Complete Product Blueprint & Technical Plan
**Brand:** Marketnera (primary) × Vicinix (tech sponsor) | **Author:** Vinayak Jain | **Version:** 1.2 | **May 2026**

---

## Quick Reference

| Attribute | Detail |
|---|---|
| System Name | QR Entry Management System |
| Brand | Marketnera (primary) × Vicinix (tech sponsor) |
| Stack | Next.js 15, TypeScript, Supabase, Tailwind CSS |
| Target Scale | 300 – 1,000 students per event |
| WhatsApp API | Meta Cloud API (free tier) |
| QR Delivery | Individual QR per student via WhatsApp |
| Deployment | Vercel |
| Author Contact | vinayakjain@vicinix.co.in |

---

## Table of Contents

1. [System Overview](#01--system-overview)
2. [Backend Decision](#02--backend-decision)
3. [Tech Stack](#03--tech-stack)
4. [User Roles](#04--user-roles)
5. [Database Schema](#05--database-schema)
6. [Feature Modules](#06--feature-modules)
7. [Pages & Routes](#07--pages--routes)
8. [Build Phases](#08--build-phases)
9. [Security Model](#09--security-model)
10. [Dual-Brand Identity Spec](#10--dual-brand-identity-spec-vicinix--marketnera)
11. [Environment Variables](#11--environment-variables)
12. [Future Scope](#12--future-scope)

---

## 01 — System Overview

The QR Entry Management System is a full-stack, real-time event access control platform built under the **Marketnera** brand — the hyperlocal commerce platform for Tier 2/3 India. Vicinix provides the tech infrastructure and development sponsorship in the background. Every student-facing touchpoint is Marketnera-first. It replaces manual attendance sheets with a fully digital, WhatsApp-delivered, scan-and-validate QR workflow — designed for college and institutional events at the 300–1,000 student scale.

### Core Problem Solved

- Manual gate checks are slow, error-prone, and ungovernable at scale
- No real-time headcount visibility for organizers
- No digital audit trail of who entered, when, and through which gate
- QR re-entry fraud (screenshot sharing) is a common issue at events

### What This System Does

1. Ingests student data from an uploaded Excel sheet
2. Generates a unique, signed QR code per student with Marketnera-first branding (Vicinix credited as tech sponsor)
3. Sends each student their QR via WhatsApp using Meta Cloud API
4. Guards scan QRs on their smartphones — real-time validation in the browser
5. One-time use: QR is disabled immediately after the first valid scan
6. Super admin dashboard shows live entry feed, headcount, and all student statuses
7. Master QR code tracks total headcount (multi-scan, never disabled)

---

## 02 — Backend Decision

> **TL;DR — No custom backend server needed. Supabase IS the backend.**

A pure no-backend approach is not possible because:

- Persistent data (student records, scan logs) requires a database
- Secure QR validation requires server-side logic — client-side validation can be bypassed
- WhatsApp API calls require a secret token that must never be exposed to the browser
- Role-based access (admin/guard/super admin) requires server-enforced auth

**The solution:** Supabase handles everything — PostgreSQL database, Row Level Security, Auth, Realtime subscriptions, Storage, and Edge Functions for WhatsApp calls. Next.js API routes handle the WhatsApp blast and QR generation. You write zero custom server infrastructure.

---

## 03 — Tech Stack

| Layer | Technology | Why |
|---|---|---|
| Frontend | Next.js 15 (App Router) | File-based routing, SSR, API routes built-in |
| Language | TypeScript | Type safety across QR, student, and scan data |
| Styling | Tailwind CSS | Fast UI, mobile-first, dark theme ready |
| Database | Supabase (PostgreSQL) | RLS, real-time subscriptions, auth |
| Auth | Supabase Auth | Role-based: super_admin, admin, guard |
| QR Generation | `qrcode` (npm) | Server-side QR with embedded student UUID |
| QR Scanning | `html5-qrcode` | Camera access on mobile/desktop browsers |
| Excel Parsing | `xlsx` (SheetJS) | Parse uploaded .xlsx on the server |
| WhatsApp | Meta Cloud API | Send QR image + message template to students |
| Real-time | Supabase Realtime | Live scan feed on super admin dashboard |
| Storage | Supabase Storage | QR code images stored per student |
| Deployment | Vercel | Zero-config Next.js deployment |

---

## 04 — User Roles

| Role | Access Level | Capabilities |
|---|---|---|
| Super Admin | Full access | Upload Excel, trigger WhatsApp blast, view all dashboards, manage users, see master QR headcount |
| Admin | Event management | View dashboard, export data, monitor entry feed, see student list |
| Guard | Scan only | Open scan interface on smartphone, scan QRs at gate, see pass/fail result |

### Guard Login Flow

Guards receive a shared event password (rotated per event). They open the scan URL on their phone — no app install required. The browser camera activates and they begin scanning. The interface shows a large green **ENTRY GRANTED** or red **ALREADY USED / INVALID** result with the student's name.

---

## 05 — Database Schema

### `students`

| Column | Type | Description |
|---|---|---|
| `id` | `uuid PRIMARY KEY` | Auto-generated unique student ID |
| `student_id` | `text NOT NULL` | College-issued student ID |
| `enrollment_no` | `text NOT NULL` | Enrollment number |
| `name` | `text NOT NULL` | Full student name |
| `email` | `text` | Student email |
| `whatsapp_number` | `text NOT NULL` | WhatsApp phone with country code |
| `qr_token` | `uuid UNIQUE` | Signed token embedded in QR code |
| `qr_image_url` | `text` | Supabase Storage URL of QR image |
| `whatsapp_sent` | `boolean DEFAULT false` | Whether WA message was sent |
| `is_inside` | `boolean DEFAULT false` | Current entry status |
| `scanned_at` | `timestamptz` | Timestamp of first valid scan |
| `scanned_by` | `uuid` | Guard user ID who scanned |
| `event_id` | `uuid` | Foreign key to events table |
| `created_at` | `timestamptz` | Row creation timestamp |

### `events`

| Column | Type | Description |
|---|---|---|
| `id` | `uuid PRIMARY KEY` | Event ID |
| `name` | `text NOT NULL` | Event name |
| `date` | `date` | Event date |
| `master_qr_token` | `uuid UNIQUE` | Token for master headcount QR |
| `master_scan_count` | `integer DEFAULT 0` | Total master QR scans |
| `is_active` | `boolean DEFAULT true` | Event active status |
| `created_by` | `uuid` | Super admin who created it |

### `scan_logs`

| Column | Type | Description |
|---|---|---|
| `id` | `uuid PRIMARY KEY` | Log entry ID |
| `student_id` | `uuid` | FK to students table |
| `event_id` | `uuid` | FK to events table |
| `scanned_by` | `uuid` | Guard user ID |
| `scan_result` | `text` | `GRANTED` / `DENIED` / `MASTER` |
| `scanned_at` | `timestamptz DEFAULT now()` | Exact scan timestamp |
| `gate_label` | `text` | Which gate (Gate A, Gate B, etc.) |

### `user_roles`

| Column | Type | Description |
|---|---|---|
| `user_id` | `uuid` | FK to Supabase auth.users |
| `role` | `text` | `super_admin` / `admin` / `guard` |
| `event_id` | `uuid` | Which event this role applies to |

### SQL Migration

```sql
-- students
create table students (
  id uuid primary key default gen_random_uuid(),
  student_id text not null,
  enrollment_no text not null,
  name text not null,
  email text,
  whatsapp_number text not null,
  qr_token uuid unique default gen_random_uuid(),
  qr_image_url text,
  whatsapp_sent boolean default false,
  is_inside boolean default false,
  scanned_at timestamptz,
  scanned_by uuid references auth.users(id),
  event_id uuid references events(id),
  created_at timestamptz default now()
);

-- events
create table events (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  date date,
  master_qr_token uuid unique default gen_random_uuid(),
  master_scan_count integer default 0,
  is_active boolean default true,
  created_by uuid references auth.users(id)
);

-- scan_logs
create table scan_logs (
  id uuid primary key default gen_random_uuid(),
  student_id uuid references students(id),
  event_id uuid references events(id),
  scanned_by uuid references auth.users(id),
  scan_result text check (scan_result in ('GRANTED', 'DENIED', 'MASTER')),
  scanned_at timestamptz default now(),
  gate_label text
);

-- user_roles
create table user_roles (
  user_id uuid references auth.users(id),
  role text check (role in ('super_admin', 'admin', 'guard')),
  event_id uuid references events(id),
  primary key (user_id, event_id)
);

-- RLS: Guards can only call API routes, not query DB directly
alter table students enable row level security;
alter table scan_logs enable row level security;

-- Only service role (API routes) can write to students
create policy "Service role only" on students
  using (auth.role() = 'service_role');
```

---

## 06 — Feature Modules

---

### MODULE 1 — Excel Upload & Student Import

#### Expected Excel Columns

| Column Header | Field | Required |
|---|---|---|
| Student ID | `student_id` | Yes |
| Enrollment No | `enrollment_no` | Yes |
| Name | `name` | Yes |
| Email | `email` | Optional |
| WhatsApp Number | `whatsapp_number` | Yes (with country code, e.g. `919876543210`) |

#### Flow

1. Super admin opens the Upload page
2. Selects event from dropdown (or creates a new event)
3. Uploads `.xlsx` file — parsed with SheetJS on the server via `/api/import`
4. Preview table shown: name, ID, WhatsApp, enrollment number
5. Admin confirms — all rows inserted into `students` table in Supabase
6. System generates a unique `qr_token` (UUID v4) for each student
7. QR image generated server-side using `qrcode` npm package
8. QR image uploaded to Supabase Storage — URL saved to student row

#### Validation Rules

- Skip rows with missing `student_id`, `enrollment_no`, `name`, or `whatsapp_number`
- Validate phone format — must be 10–15 digits, strip spaces/dashes
- Duplicate `student_id` within same event → skip with warning
- Return an error report CSV listing all skipped rows with reasons

---

### MODULE 2 — QR Code Design & Branding

#### QR Content

Each QR encodes a signed URL:

```
https://entry.vicinix.co.in/scan?token=UUID
```

The UUID maps to exactly one student in the DB. The QR itself reveals no personal data — just the token.

#### QR Visual Design

The QR card is the primary branded touchpoint students see. It must carry **both** Vicinix and Marketnera identities cleanly without clutter.

**QR Card Layout (512×620px PNG):**

```
┌────────────────────────────────────────┐  ← 8px full-width green top strip
│  🟢 MARKETNERA                         │  ← Marketnera wordmark, large, green
│  Hyperlocal Commerce Platform          │  ← tagline, muted
│  [Event Name]                          │  ← event label, bold white
├────────────────────────────────────────┤
│                                        │
│         ┌──────────────────┐           │
│         │                  │           │
│         │    QR MATRIX     │           │  ← QR code, dark on white
│         │                  │           │
│         └──────────────────┘           │
│                                        │
│         Vinayak Jain                   │  ← student name, bold
│         ID: VU2025001 · Enroll: XXXX   │  ← IDs, muted
├────────────────────────────────────────┤
│  marketnera.in       Tech: Vicinix 🟠  │  ← Marketnera URL dominant, Vicinix small right
└────────────────────────────────────────┘
```

**Design tokens applied to the QR card:**
- **Top strip:** Full-width Marketnera green `#13EC5B` — 8px
- **Background:** Dark `#111827` for the header zone, white `#FFFFFF` for the QR zone
- **Marketnera wordmark:** Green `#13EC5B`, large (28px), top-left — dominant
- **Tagline:** Muted `#6B7280`, small italic
- **Event name:** Bold white, 16px
- **QR matrix:** Dark `#111827` on white — high contrast, scannable
- **Student name:** Bold `#111827`, 14px
- **Student ID / Enrollment:** Muted `#6B7280`, 12px
- **Footer left:** `marketnera.in` in green — large, dominant
- **Footer right:** `Tech by Vicinix` in orange `#F97316` — small, subordinate
- **Size:** 512×620px PNG, uploaded to Supabase Storage

#### QR Generation Code (Next.js API Route)

```typescript
// /api/qr/generate/route.ts
import QRCode from 'qrcode';

const qrDataUrl = await QRCode.toDataURL(
  `${process.env.NEXT_PUBLIC_APP_URL}/scan?token=${student.qr_token}`,
  {
    width: 512,
    margin: 2,
    color: { dark: '#111827', light: '#FFFFFF' },
    errorCorrectionLevel: 'H', // High — allows logo overlay
  }
);
```

---

### MODULE 3 — WhatsApp Delivery

#### API: Meta Cloud API (Free Tier)

| Parameter | Value |
|---|---|
| Endpoint | `https://graph.facebook.com/v19.0/{phone_number_id}/messages` |
| Auth | `Bearer {ACCESS_TOKEN}` from Meta for Developers |
| Message Type | Template (required for first outbound contact) |
| Free Tier | ~1,000 conversations/month free; 80 msg/sec max |
| QR Delivery | Image message with QR PNG as media + caption |

#### Message Template Structure

Define this template in Meta Business Manager first, then reference it by name in the API call.

```
Sender:  Marketnera (your registered WA business name)
Header:  [QR Image — Marketnera-branded card]
Body:    Hey {{1}}, your entry pass for {{2}} is here!
         This is your personal QR code — show it at the
         gate for instant entry. Valid for one scan only.
         See you there! 🎉
Footer:  marketnera.in · Tech powered by Vicinix
```

Variables: `{{1}}` = student name, `{{2}}` = event name.

#### API Call Example

```typescript
// /api/blast/route.ts
const response = await fetch(
  `https://graph.facebook.com/v19.0/${process.env.META_PHONE_NUMBER_ID}/messages`,
  {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.META_WHATSAPP_API_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      messaging_product: 'whatsapp',
      to: student.whatsapp_number,
      type: 'template',
      template: {
        name: process.env.META_TEMPLATE_NAME,
        language: { code: 'en' },
        components: [
          {
            type: 'header',
            parameters: [{ type: 'image', image: { link: student.qr_image_url } }]
          },
          {
            type: 'body',
            parameters: [
              { type: 'text', text: student.name },
              { type: 'text', text: eventName },
            ]
          }
        ]
      }
    })
  }
);
```

#### Delivery Flow

1. Super admin clicks **Send WhatsApp Blast** button
2. Next.js API route fetches all students where `whatsapp_sent = false` for the event
3. For each student: POST to Meta Graph API with QR image URL + template
4. On `200` response: update `whatsapp_sent = true` in Supabase
5. Progress bar shown on admin UI — "Sent X / Total Y"
6. Failed sends logged — retry button available per failed student
7. Rate limiting: 80 requests/second max — add 15ms delay between calls

---

### MODULE 4 — QR Scanning Interface (Guard View)

#### Design Principles

- PWA-ready: opens in mobile browser, zero app install
- Full-screen camera view optimized for one-handed phone use
- Large scan area, auto-focus, flashlight/torch toggle button
- Result display: full-screen green **(GRANTED)** or red **(DENIED)** for 2.5 seconds
- Auto-returns to scan mode after result — continuous scanning loop
- Shows student name + ID on GRANTED screen so guard can visual-verify

#### Guard UI Layout

```
┌─────────────────────────────────────────┐
│  🟢 MARKETNERA          Gate A ▾        │  ← Marketnera logo dominant, gate selector
│  Tech by Vicinix 🟠                     │  ← Vicinix small, subordinate
├─────────────────────────────────────────┤
│                                         │
│    ┌─────────────────────┐              │
│    │                     │              │
│    │      SCAN AREA      │              │  ← green scan frame (Marketnera)
│    │                     │              │
│    └─────────────────────┘              │
│                                         │
│    🔦  Torch        ⟳ Reset            │
└─────────────────────────────────────────┘
```

**GRANTED screen (full green flash):**
```
✅ ENTRY GRANTED
Vinayak Jain
ID: VU2025001
```

**DENIED screen (full red flash):**
```
❌ ALREADY SCANNED
Vinayak Jain
Entered at 10:32 AM via Gate A
```

#### Scan Validation Logic

```typescript
// POST /api/scan
export async function POST(req: Request) {
  const { token, gate_label, guard_user_id } = await req.json();

  // 1. Look up token
  const { data: student } = await supabase
    .from('students')
    .select('*')
    .eq('qr_token', token)
    .single();

  // 2. Token not found
  if (!student) return Response.json({ result: 'INVALID' }, { status: 404 });

  // 3. Check master QR
  const { data: event } = await supabase
    .from('events')
    .select('master_qr_token')
    .eq('master_qr_token', token)
    .single();

  if (event) {
    await supabase.from('events')
      .update({ master_scan_count: event.master_scan_count + 1 })
      .eq('id', event.id);
    await supabase.from('scan_logs').insert({ scan_result: 'MASTER', event_id: event.id, scanned_by: guard_user_id, gate_label });
    return Response.json({ result: 'MASTER', count: event.master_scan_count + 1 });
  }

  // 4. Already scanned
  if (student.is_inside) {
    return Response.json({ result: 'DENIED', student, scanned_at: student.scanned_at });
  }

  // 5. Valid — grant entry
  await supabase.from('students')
    .update({ is_inside: true, scanned_at: new Date().toISOString(), scanned_by: guard_user_id })
    .eq('id', student.id);

  await supabase.from('scan_logs').insert({
    student_id: student.id,
    event_id: student.event_id,
    scanned_by: guard_user_id,
    scan_result: 'GRANTED',
    gate_label
  });

  return Response.json({ result: 'GRANTED', student });
}
```

---

### MODULE 5 — Master QR Code

- One QR code per event, generated automatically when the event is created
- Encodes a special `master_qr_token` — **never disabled after scan**
- Each scan increments `master_scan_count` in the `events` table
- Use cases: exit gate headcount, re-entry tracking, sponsor desk foot traffic
- Super admin dashboard shows live master scan count via Supabase Realtime

---

### MODULE 6 — Super Admin Dashboard

#### Stat Cards (top row)

| Card | Data Source |
|---|---|
| Total Registered | `COUNT(students) WHERE event_id = X` |
| Inside Now | `COUNT(students) WHERE is_inside = true` |
| Not Yet Entered | Total minus Inside |
| Master QR Scans | `events.master_scan_count` |
| WhatsApp Sent | `COUNT WHERE whatsapp_sent = true` |
| Failed Deliveries | `COUNT WHERE whatsapp_sent = false` (after blast) |

#### Live Entry Feed (Supabase Realtime)

Scrolling table of the last 50 scan events, updating live without page refresh:

| Column | Data |
|---|---|
| Time | `HH:MM:SS` of scan |
| Student Name | Full name |
| Student ID | College-issued ID |
| Enrollment No | Enrollment number |
| Email | Student email |
| WhatsApp | Masked: `+91 98765 *****` |
| Gate | Gate label |
| Status | `GRANTED` / `DENIED` badge |
| Guard | Guard username |

#### Realtime Subscription Code

```typescript
// In dashboard component
useEffect(() => {
  const channel = supabase
    .channel('scan-feed')
    .on('postgres_changes', {
      event: 'INSERT',
      schema: 'public',
      table: 'scan_logs',
    }, (payload) => {
      setScanFeed(prev => [payload.new, ...prev].slice(0, 50));
    })
    .subscribe();

  return () => { supabase.removeChannel(channel); };
}, []);
```

#### Full Student Table

Paginated, filterable, searchable table with columns: Name, Student ID, Enrollment No, Email, WhatsApp, QR Sent, Is Inside, Scanned At, Scanned By.

- **Filter by:** Inside / Not Inside / QR Not Sent / All
- **Search by:** Name, Student ID, Enrollment No
- **Per row actions:** View QR (modal), Resend WhatsApp, Mark as Exited
- **Bulk actions:** Export to Excel (current view or full list)

---

## 07 — Pages & Routes

| Route | Page | Access |
|---|---|---|
| `/` | Landing / Event Selector | Public |
| `/login` | Auth — Marketnera-branded login for Super Admin / Admin / Guard | Public |
| `/admin/upload` | Excel upload + student import | Super Admin |
| `/admin/blast` | WhatsApp QR blast trigger + progress | Super Admin |
| `/admin/dashboard` | Super admin live dashboard | Super Admin / Admin |
| `/admin/students` | Full student table + QR preview | Super Admin / Admin |
| `/admin/events` | Event management (create, activate, archive) | Super Admin |
| `/admin/users` | Guard & admin user management | Super Admin |
| `/scan` | Guard QR scan interface (mobile camera) | Guard |
| `/api/scan` | `POST` — validate QR token, update DB | Server (guarded) |
| `/api/import` | `POST` — parse Excel, insert students | Server (guarded) |
| `/api/blast` | `POST` — trigger WhatsApp delivery loop | Server (guarded) |
| `/api/qr/generate` | `POST` — generate + upload QR for a student | Server (guarded) |

---

## 08 — Build Phases

| Phase | Name | Deliverables | Est. Days |
|---|---|---|---|
| 1 | Project Setup | Next.js 15 + TS + Tailwind init, Supabase project, SQL migration, Vercel deployment, env vars configured | 1 |
| 2 | Auth & Roles | Supabase Auth setup, `user_roles` table, middleware for route protection, login page, guard/admin/super_admin flows | 1 |
| 3 | Excel Import | Upload UI, SheetJS parsing, student insert API, preview table, row validation, error report | 2 |
| 4 | QR Generation | Server-side QR with `qrcode` npm, Marketnera-first card design via `sharp` (green header strip, Marketnera wordmark dominant, Vicinix small footer credit), Supabase Storage upload, URL save to student row | 2 |
| 5 | WhatsApp Blast | Meta Cloud API integration, template send, progress bar UI, retry logic, `whatsapp_sent` update | 2 |
| 6 | Scan Interface | `html5-qrcode` setup, full-screen mobile UI, scan API, one-time use logic, GRANTED/DENIED full-screen display | 2 |
| 7 | Master QR | Master token generation per event, scan count increment, display on dashboard | 1 |
| 8 | Super Admin Dashboard | Realtime entry feed, stat cards, full student table, search/filter/export, QR preview modal, resend button | 3 |
| 9 | Polish & Deploy | Mobile responsiveness QA, error states, loading skeletons, final Vercel deploy, guard onboarding doc | 1 |

**Total estimated: 15 working days (solo developer)**

---

## 09 — Security Model

| Threat | Mitigation |
|---|---|
| QR screenshot reuse | One-time token: `is_inside = true` after first scan. Subsequent scans return `DENIED` with timestamp of original entry. |
| QR token guessing | Token is UUID v4 (122 bits of entropy) — statistically unguessable. No sequential IDs. |
| Guard misuse | All scans logged with `guard_user_id`, `gate_label`, and `scanned_at`. Super admin can audit full log. |
| Unauthorized dashboard access | Supabase RLS policies + Next.js middleware checks JWT role claim on every server-side request. |
| WhatsApp API key exposure | `META_WHATSAPP_API_TOKEN` stored in Vercel environment variables — never in client-side code. |
| Mass import errors | Server validates every row before insert — returns structured error report for bad rows without aborting the batch. |
| Direct DB access by guards | Supabase RLS: guards can only call the `/api/scan` route — zero direct table access granted. |
| Replay attacks on `/api/scan` | Scan endpoint is idempotent — a second scan of a used token always returns `DENIED`, never re-grants entry. |

---

## 10 — Brand Identity Spec: Marketnera (Primary) × Vicinix (Sponsor)

### Brand Hierarchy — The Rule

> **Marketnera is the product. Vicinix is the builder.**
> Every student-facing surface is Marketnera. Vicinix appears only as a small "Tech by Vicinix" credit — never competing with Marketnera for visual weight.

| Brand | Role | Presence Level | Primary Color |
|---|---|---|---|
| **Marketnera** | The product. Owns the event experience. | **Dominant** — large logo, primary colors everywhere | Green `#13EC5B` |
| **Vicinix** | Tech infrastructure sponsor. Builds it, doesn't own it. | **Subordinate** — small credit text, footer only | Orange `#F97316` |

---

### Brand Colors

```css
/* ── MARKETNERA (dominant) ─────────────────────────── */
--marketnera:          #13EC5B;   /* Primary — CTAs, borders, logo, scan frame */
--marketnera-dark:     #0FBF49;   /* Hover, active states */
--marketnera-light:    #DCFCE7;   /* Chip backgrounds, subtle fills */
--marketnera-glow:     rgba(19, 236, 91, 0.15); /* Card glow, focus rings */

/* ── VICINIX (sponsor credit only) ─────────────────── */
--vicinix:             #F97316;   /* Used only in "Tech by Vicinix" credit lines */
--vicinix-muted:       #9A4B10;   /* Even more subdued, for very small credits */

/* ── Shared neutrals ───────────────────────────────── */
--dark:       #111827;   /* Page background, QR matrix */
--surface:    #1F2937;   /* Card backgrounds */
--surface-2:  #374151;   /* Nested cards, inputs */
--muted:      #6B7280;   /* Secondary text, metadata */
--white:      #FFFFFF;   /* QR card white zone, text on dark */

/* ── Status colors (Marketnera-aligned) ─────────────── */
--granted:    #13EC5B;   /* ENTRY GRANTED — Marketnera green owns success */
--denied:     #EF4444;   /* DENIED — neutral red, no brand association */
--pending:    #F59E0B;   /* Pending/warning states */
```

---

### Typography

```css
--font-display: 'Inter', 'SF Pro Display', sans-serif;  /* All headings */
--font-body:    'Inter', system-ui, sans-serif;          /* UI text */
--font-mono:    'JetBrains Mono', 'Fira Code', monospace; /* IDs, tokens */
```

---

### Logo Usage Rules

| Context | Rule |
|---|---|
| All student-facing pages | Marketnera logo only — no Vicinix logo |
| Admin/guard interface header | Marketnera wordmark large + `Tech by Vicinix` in small muted text below |
| QR card header | `MARKETNERA` wordmark large in green — dominant |
| QR card footer | `marketnera.in` large left + `Tech: Vicinix` tiny right |
| WhatsApp sender name | Register as `Marketnera` in Meta Business Manager |
| WhatsApp message footer | `marketnera.in · Tech by Vicinix` |
| Browser tab | `Marketnera Entry — [Event Name]` |
| Favicon | Marketnera `M` icon in green |
| Error pages | Marketnera logo only |
| Export files | `Marketnera QR Entry System` in header |

**Never:** Vicinix logo at the same size as Marketnera. Never Vicinix before Marketnera in any lockup.

---

### Touchpoint-by-Touchpoint Spec

| Touchpoint | Marketnera (dominant) | Vicinix (subordinate) |
|---|---|---|
| **QR Code Card — top strip** | Full-width green `#13EC5B` — 8px | None |
| **QR Code Card — header** | `MARKETNERA` wordmark, 28px bold, green | None |
| **QR Code Card — tagline** | `Hyperlocal Commerce Platform` in muted | None |
| **QR Code Card — footer left** | `marketnera.in` in green, 14px | None |
| **QR Code Card — footer right** | None | `Tech: Vicinix` in orange, 10px, muted |
| **WhatsApp sender** | Business name: `Marketnera` | None |
| **WhatsApp message body** | Warm, community-first copy (see template) | None |
| **WhatsApp footer** | `marketnera.in` | `· Tech by Vicinix` small suffix |
| **Scan interface — header** | `MARKETNERA` wordmark, green, large | `Tech by Vicinix` — 10px, muted, below wordmark |
| **Scan interface — scan frame** | Green `#13EC5B` animated scan border | None |
| **Scan interface — buttons** | Green primary buttons | None |
| **GRANTED screen** | Full green `#13EC5B` background — Marketnera owns success | `Marketnera` watermark (not Vicinix) bottom-center, 20% opacity |
| **DENIED screen** | Red `#EF4444` background — neutral | None |
| **Admin dashboard sidebar** | `MARKETNERA` in green, large in sidebar | `Tech by Vicinix` — 10px, muted, below |
| **Dashboard stat cards** | Green `#13EC5B` top border on all stat cards | None |
| **Dashboard primary CTA buttons** | Green — `Send Blast`, `Upload Excel`, `Export` | None |
| **Login page** | `MARKETNERA` centered, large logo, tagline | `Built by Vicinix` — footer only, small |
| **Browser tab / favicon** | `M` favicon in green. Title: `Marketnera Entry` | None |
| **Excel export header** | `Marketnera QR Entry System` | `Powered by Vicinix` in small footer cell |
| **404 / error pages** | Marketnera logo + `We're on it.` | None |

---

### Tailwind Config

```typescript
// tailwind.config.ts
export default {
  theme: {
    extend: {
      colors: {
        // Marketnera — primary everywhere
        marketnera: {
          DEFAULT: '#13EC5B',
          dark:    '#0FBF49',
          light:   '#DCFCE7',
          glow:    'rgba(19, 236, 91, 0.15)',
        },
        // Vicinix — sponsor credit only
        vicinix: {
          DEFAULT: '#F97316',
          muted:   '#9A4B10',
        },
        // Neutrals
        surface:   '#1F2937',
        surface2:  '#374151',
        dark:      '#111827',
      },
      fontFamily: {
        display: ['Inter', 'SF Pro Display', 'sans-serif'],
        mono:    ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      boxShadow: {
        'marketnera': '0 0 0 3px rgba(19, 236, 91, 0.3)',
        'marketnera-lg': '0 0 24px rgba(19, 236, 91, 0.2)',
      },
    },
  },
};
```

---

### React Component Patterns

**Page header (all interfaces):**
```tsx
<header className="flex flex-col px-4 py-3 bg-dark border-b border-surface">
  <span className="font-bold text-marketnera text-xl tracking-wide">MARKETNERA</span>
  <span className="text-vicinix text-[10px] font-medium opacity-60 mt-0.5">
    Tech by Vicinix
  </span>
</header>
```

**GRANTED screen — Marketnera owns success:**
```tsx
<div className="fixed inset-0 bg-marketnera flex flex-col items-center justify-center">
  <CheckCircle size={100} className="text-dark mb-6" />
  <h1 className="text-dark text-5xl font-black tracking-tight">ENTRY GRANTED</h1>
  <p className="text-dark/80 text-2xl font-semibold mt-3">{student.name}</p>
  <p className="text-dark/60 text-base mt-1">ID: {student.student_id}</p>
  <p className="text-dark/40 text-sm mt-0.5">Enrollment: {student.enrollment_no}</p>
  {/* Marketnera watermark — not Vicinix */}
  <div className="absolute bottom-8 opacity-20">
    <span className="text-dark text-sm font-bold tracking-widest">MARKETNERA</span>
  </div>
</div>
```

**Stat card — Marketnera green border:**
```tsx
<div className="bg-surface rounded-xl p-5 border-t-4 border-marketnera shadow-marketnera-lg">
  <p className="text-muted text-xs uppercase tracking-wider">{label}</p>
  <p className="text-white text-4xl font-black mt-2">{value}</p>
  <p className="text-marketnera text-sm mt-1">{sublabel}</p>
</div>
```

**Primary button — Marketnera green:**
```tsx
<button className="bg-marketnera hover:bg-marketnera-dark text-dark font-bold
                   px-6 py-3 rounded-lg transition-all shadow-marketnera
                   active:scale-95">
  {label}
</button>
```

**Scan frame — green animated border:**
```tsx
<div className="relative border-4 border-marketnera rounded-xl overflow-hidden
                shadow-marketnera-lg animate-pulse-slow">
  {/* camera feed */}
</div>
```

**Login page:**
```tsx
<div className="min-h-screen bg-dark flex flex-col items-center justify-center">
  <h1 className="text-marketnera text-5xl font-black tracking-tight mb-1">
    MARKETNERA
  </h1>
  <p className="text-muted text-sm mb-10">
    Hyperlocal Commerce · Event Entry System
  </p>
  {/* ...login form... */}
  <p className="text-muted/40 text-xs mt-8">Built by Vicinix</p>
</div>
```

---

### QR Card Generation — Marketnera-First (Sharp)

```typescript
// /api/qr/generate/route.ts
import sharp from 'sharp';
import QRCode from 'qrcode';

async function generateBrandedQR(student: Student, eventName: string): Promise<Buffer> {
  // 1. Raw QR buffer — dark on white, high error correction for logo overlay
  const qrBuffer = await QRCode.toBuffer(
    `${process.env.NEXT_PUBLIC_APP_URL}/scan?token=${student.qr_token}`,
    { width: 360, margin: 2, errorCorrectionLevel: 'H',
      color: { dark: '#111827', light: '#FFFFFF' } }
  );

  // 2. Full-width Marketnera green top strip (512 × 8px)
  const greenStrip = await sharp({
    create: { width: 512, height: 8, channels: 4,
      background: { r: 19, g: 236, b: 91, alpha: 1 } }   // #13EC5B
  }).png().toBuffer();

  // 3. Dark header zone (512 × 80px) for wordmark + event name
  const headerZone = await sharp({
    create: { width: 512, height: 80, channels: 4,
      background: { r: 17, g: 24, b: 39, alpha: 1 } }    // #111827
  }).png().toBuffer();

  // 4. White QR zone (512 × 420px) for QR + student info
  const qrZone = await sharp({
    create: { width: 512, height: 420, channels: 4,
      background: { r: 255, g: 255, b: 255, alpha: 1 } }
  }).png().toBuffer();

  // 5. Dark footer zone (512 × 50px)
  const footerZone = await sharp({
    create: { width: 512, height: 50, channels: 4,
      background: { r: 17, g: 24, b: 39, alpha: 1 } }
  }).png().toBuffer();

  // 6. Compose full card: strip(8) + header(80) + qrZone(420) + footer(50) = 558px
  const card = await sharp({
    create: { width: 512, height: 558, channels: 4,
      background: { r: 17, g: 24, b: 39, alpha: 1 } }
  })
  .composite([
    { input: greenStrip,  top: 0,   left: 0 },  // Marketnera green strip
    { input: headerZone,  top: 8,   left: 0 },  // dark header
    { input: qrZone,      top: 88,  left: 0 },  // white QR zone
    { input: qrBuffer,    top: 118, left: 76 }, // QR centered in white zone
    { input: footerZone,  top: 508, left: 0 },  // dark footer
    // Text overlays (wordmark, student name, URLs) added via SVG layer
  ])
  .png()
  .toBuffer();

  return card;
}
```

> **Note:** Use an SVG text overlay composite layer for the `MARKETNERA` wordmark, student name, `marketnera.in`, and `Tech: Vicinix` footer text — `sharp` supports SVG input natively.

---

### Brand Voice

| Context | Voice | Example |
|---|---|---|
| Student WhatsApp | Marketnera — warm, hyperlocal, community | `"Hey Vinayak, your Marketnera entry pass is here! See you at the event 🎉"` |
| Guard scan result | Clear, fast, no branding friction | `"ENTRY GRANTED — Vinayak Jain"` |
| Admin dashboard | Professional, data-forward | `"312 students registered · 208 inside · 14 pending delivery"` |
| Error messages | Honest, action-oriented | `"Scan failed. Check your connection and try again."` |
| Login page tagline | Marketnera identity | `"Hyperlocal Commerce · Event Entry System"` |
| Footer credit | Minimal Vicinix mention | `"Built by Vicinix"` or `"Tech by Vicinix"` — never `"Powered by"` (too prominent) |

---

## 11 — Environment Variables

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...

# Meta WhatsApp Cloud API
META_WHATSAPP_API_TOKEN=EAABz...
META_PHONE_NUMBER_ID=123456789012345
META_TEMPLATE_NAME=event_entry_qr

# App
NEXT_PUBLIC_APP_URL=https://entry.marketnera.in
NEXT_PUBLIC_BRAND_NAME=Marketnera Entry System
```

### Where to Get These

| Variable | Source |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase Dashboard → Project Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase Dashboard → Project Settings → API |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase Dashboard → Project Settings → API (secret) |
| `META_WHATSAPP_API_TOKEN` | Meta for Developers → WhatsApp → API Setup |
| `META_PHONE_NUMBER_ID` | Meta for Developers → WhatsApp → API Setup |
| `META_TEMPLATE_NAME` | Meta Business Manager → Message Templates |

---

## 12 — Future Scope

| Feature | Description | Priority |
|---|---|---|
| Multi-gate Analytics | Per-gate entry counts, peak time heatmap on dashboard | High |
| SMS Fallback | Auto-SMS via Fast2SMS if WhatsApp delivery fails | High |
| Check-out Scan | Second scan marks student as exited — track dwell time | Medium |
| Offline Guard Mode | PWA caching so guards can scan if WiFi drops, sync when back online | Medium |
| Email Delivery | QR also sent to student email as fallback channel | Medium |
| Marketnera Shop QR | Embed a Marketnera discovery QR on the entry pass — students scan to browse local shops at the event venue | **High** — core to Marketnera's hyperlocal mission |
| White-label Licensing | License this system to other colleges as a Marketnera product — expand Marketnera's institutional footprint in Tier 2/3 cities | Strategic |
| Facial Recognition Gate | face-api.js layer for premium events with camera at gate | Future |

---

## Appendix — npm Dependencies

```bash
# Core
npx create-next-app@latest --typescript --tailwind --app

# QR
npm install qrcode @types/qrcode
npm install html5-qrcode

# Excel
npm install xlsx

# Supabase
npm install @supabase/supabase-js @supabase/ssr

# Image processing (QR branding overlay)
npm install sharp

# UI utilities
npm install lucide-react clsx tailwind-merge
```

---

*Marketnera QR Entry System — Confidential Blueprint · Tech by Vicinix*
*vinayakjain@vicinix.co.in | marketnera.in | vicinix.co.in*
