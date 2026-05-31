# Phase 7: Master QR - Research

## Goal
Master token generation per event, scan count increment, display on dashboard.

## Tech Stack & Tooling
- **Backend**: Next.js App Router Route Handlers (`app/api/scan/route.ts`).
- **Database**: Supabase SSR Client & SQL (`events` table).
- **Frontend**: React components.

## Implementation Strategy

### 1. Database Schema
The `events` table already includes:
`master_qr_token uuid unique default gen_random_uuid()`
`master_scan_count integer default 0`

We just need to query and update it.

### 2. API Route (`/api/scan/route.ts`)
Update the logic:
```typescript
  // 3. Look up student
  const { data: student } = await supabaseAdmin.from('students').select('*').eq('token', token).single()

  if (!student) {
    // 3b. Look up master token
    const { data: event } = await supabaseAdmin.from('events').select('*').eq('master_qr_token', token).single()
    if (event) {
      // Increment master count
      // Return MASTER success
    } else {
      return NextResponse.json({ error: 'Invalid Token' }, { status: 404 })
    }
  }
```
Wait, we need to handle concurrency for `master_scan_count`. We can use an RPC function or just fetch and increment (small risk of race condition on simple counts, but we can do `update events set master_scan_count = master_scan_count + 1 where id = event.id`). Supabase REST API doesn't support `column = column + 1` directly without RPC.
Alternatively, we can create an RPC:
```sql
CREATE OR REPLACE FUNCTION increment_master_scan(event_uuid UUID)
RETURNS void AS $$
BEGIN
  UPDATE events SET master_scan_count = master_scan_count + 1 WHERE id = event_uuid;
END;
$$ LANGUAGE plpgsql;
```
Or we can just fetch the count and add 1. For this scope, fetching and adding 1 is fine since it's a VIP token not scanned 100 times per second.

### 3. Dashboard UI
Add a "Master QR" section to the dashboard, displaying the `master_scan_count` and a button to view the QR code. We can use a client-side library like `qrcode.react` to render the `master_qr_token` as a scannable image for the Admin to screenshot or print.

## Risks & Pitfalls
- **Token formatting**: Make sure the Master QR token link matches the expected format `https://.../scan?token=UUID` so the scanner reads it exactly like a student token.

## Validation Architecture
- Scan the Master QR -> Expect "Success (Master)" and DB increment.
- Scan again -> Expect "Success (Master)" and DB increment.
