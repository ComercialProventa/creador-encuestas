-- ============================================================
-- Migration: Add reward / lead-capture columns
-- Run this in the Supabase SQL Editor
-- ============================================================

-- 1) Reward settings on surveys
ALTER TABLE surveys
  ADD COLUMN IF NOT EXISTS reward_type    TEXT NOT NULL DEFAULT 'none',
  ADD COLUMN IF NOT EXISTS reward_text    TEXT,
  ADD COLUMN IF NOT EXISTS reward_image_url TEXT,
  ADD COLUMN IF NOT EXISTS require_contact BOOLEAN NOT NULL DEFAULT false;

-- 2) Contact info captured on responses
ALTER TABLE responses
  ADD COLUMN IF NOT EXISTS contact_info TEXT;
