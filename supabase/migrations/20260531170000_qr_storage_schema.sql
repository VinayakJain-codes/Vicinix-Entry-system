ALTER TABLE public.students
ADD COLUMN token TEXT UNIQUE,
ADD COLUMN qr_url TEXT;

-- Initialize storage bucket for QRs
INSERT INTO storage.buckets (id, name, public) VALUES ('qrs', 'qrs', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
USING ( bucket_id = 'qrs' );

CREATE POLICY "Admin Upload Access"
ON storage.objects FOR INSERT
WITH CHECK ( bucket_id = 'qrs' AND (select role from public.user_roles where id = auth.uid()) IN ('admin', 'super_admin') );
