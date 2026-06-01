-- Migration: phase1_schema_upgrade.sql

-- 1.1 Add missing columns to students
ALTER TABLE public.students
  ADD COLUMN IF NOT EXISTS student_id TEXT,
  ADD COLUMN IF NOT EXISTS enrollment_no TEXT,
  ADD COLUMN IF NOT EXISTS email TEXT;

-- 1.2 Fix events table — add master_qr_token + date
ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS master_qr_token UUID DEFAULT gen_random_uuid() UNIQUE,
  ADD COLUMN IF NOT EXISTS date DATE,
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- Backfill existing events
UPDATE public.events SET master_qr_token = gen_random_uuid() WHERE master_qr_token IS NULL;

-- 1.4 Rename user_roles.id -> user_id (doing this first so the policy below can use it safely)
ALTER TABLE public.user_roles RENAME COLUMN id TO user_id;

-- 1.3 Add scan_logs table
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
    (SELECT role FROM public.user_roles WHERE user_id = auth.uid()) IN ('admin', 'super_admin')
  );

-- Enable realtime on scan_logs too
ALTER PUBLICATION supabase_realtime ADD TABLE public.scan_logs;
