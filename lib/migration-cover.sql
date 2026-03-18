-- ============================================================
-- Migration: Add cover_image_url column
-- Run this in the Supabase SQL Editor
-- ============================================================

ALTER TABLE surveys
  ADD COLUMN IF NOT EXISTS cover_image_url TEXT;
