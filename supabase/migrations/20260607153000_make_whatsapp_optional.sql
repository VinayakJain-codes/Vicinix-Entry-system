-- Make whatsapp_number column optional (nullable)
ALTER TABLE public.students ALTER COLUMN whatsapp_number DROP NOT NULL;
