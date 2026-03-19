-- ═══════════════════════════════════════════════════════════
-- MIGRATION: ADD COMPANY CATEGORIZATION
-- ═══════════════════════════════════════════════════════════
-- Copia y pega este script en el editor SQL de tu panel de Supabase
-- para habilitar la subcategorización por negocio/empresa nativamente.

ALTER TABLE public.surveys ADD COLUMN IF NOT EXISTS company text;
