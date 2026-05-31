# Phase 4: QR Generation - Research

## Goal
Edge function to generate QR per student, store securely, save token to student record.

## Tech Stack & Tooling
- **Token Generation**: Node.js `crypto.randomBytes`.
- **QR Generation**: `qrcode` npm library.
- **Storage**: Supabase Storage (`qrs` bucket).

## Implementation Strategy

### 1. Database Schema
Update `students` table to add `token` and `qr_url` columns.
```sql
ALTER TABLE public.students
ADD COLUMN token TEXT UNIQUE,
ADD COLUMN qr_url TEXT;

-- Create Storage bucket
insert into storage.buckets (id, name, public) values ('qrs', 'qrs', true);
```

### 2. QR Generation Logic
Create an admin action or background job to process students who don't have a token yet:
1. Fetch students where `token IS NULL`.
2. For each student:
   - Generate `crypto.randomBytes(32).toString('hex')` (64 chars).
   - Generate QR code buffer using `qrcode.toBuffer(token)`.
   - Upload buffer to Supabase Storage: `storage.from('qrs').upload(fileName, buffer)`.
   - Update `students` table with `token` and `qr_url`.

## Risks & Pitfalls
- **Vercel Serverless Timeouts**: If generating QRs for 1,000 students synchronously, the Server Action will timeout (Vercel hobby plan has 10s limit, pro has 15s-300s). We should implement it as a batch process, where the UI triggers batches of 50 students at a time, or use a background Edge Function.
- **Storage Policies**: Ensure the `qrs` bucket is public so WhatsApp can access the image URL.

## Validation Architecture
- Verify QR token is exactly 64 characters.
- Verify the generated QR code scans correctly to the exact token string.
- Verify Supabase Storage correctly hosts the public image URL.
