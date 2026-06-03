-- Migration: rename_student_columns.sql

ALTER TABLE public.students RENAME COLUMN phone_number TO whatsapp_number;
ALTER TABLE public.students RENAME COLUMN enrollment_no TO roll_no;
