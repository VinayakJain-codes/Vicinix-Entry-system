-- Migration: Add created_at column to students table to track upload order
ALTER TABLE public.students 
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();
