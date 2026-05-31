create extension if not exists "uuid-ossp" with schema public;

CREATE TABLE public.events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.students (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID REFERENCES public.events(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  phone_number TEXT NOT NULL,
  qr_status TEXT DEFAULT 'pending',
  UNIQUE(event_id, phone_number)
);

ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;

-- Admins and super_admins have full access
CREATE POLICY "Admins full access to events" ON public.events FOR ALL USING (
  (select role from public.user_roles where id = auth.uid()) IN ('admin', 'super_admin')
);

CREATE POLICY "Admins full access to students" ON public.students FOR ALL USING (
  (select role from public.user_roles where id = auth.uid()) IN ('admin', 'super_admin')
);
