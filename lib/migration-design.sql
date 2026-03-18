-- ============================================================
-- Migration: Add design customization columns to surveys
-- Run this in the Supabase SQL Editor
-- ============================================================

ALTER TABLE surveys
  ADD COLUMN IF NOT EXISTS primary_color TEXT NOT NULL DEFAULT '#6366f1',
  ADD COLUMN IF NOT EXISTS logo_url TEXT;
