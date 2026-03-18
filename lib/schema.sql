-- ============================================================
-- Plataforma de Encuestas — Database Schema
-- Run this in the Supabase SQL Editor
-- ============================================================

-- 1. Surveys
CREATE TABLE IF NOT EXISTS surveys (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title       TEXT NOT NULL,
  description TEXT DEFAULT '',
  created_at  TIMESTAMPTZ DEFAULT now()
);

-- 2. Questions
CREATE TABLE IF NOT EXISTS questions (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  survey_id   UUID NOT NULL REFERENCES surveys(id) ON DELETE CASCADE,
  title       TEXT NOT NULL,
  type        TEXT NOT NULL CHECK (type IN ('rating_stars', 'nps', 'single_choice', 'multiple_choice', 'text_open')),
  is_required BOOLEAN DEFAULT false,
  options     JSONB,              -- e.g. ["Opción A", "Opción B"]
  order_index INTEGER NOT NULL DEFAULT 0
);

-- 3. Responses (one row per survey submission)
CREATE TABLE IF NOT EXISTS responses (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  survey_id  UUID NOT NULL REFERENCES surveys(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Answers (one row per answered question)
CREATE TABLE IF NOT EXISTS answers (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  response_id UUID NOT NULL REFERENCES responses(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  value       TEXT NOT NULL        -- star count, NPS number, option text, or free text
);

-- ── Indexes for fast lookups ──────────────────────────────
CREATE INDEX IF NOT EXISTS idx_questions_survey   ON questions(survey_id);
CREATE INDEX IF NOT EXISTS idx_responses_survey   ON responses(survey_id);
CREATE INDEX IF NOT EXISTS idx_answers_response   ON answers(response_id);
CREATE INDEX IF NOT EXISTS idx_answers_question   ON answers(question_id);
