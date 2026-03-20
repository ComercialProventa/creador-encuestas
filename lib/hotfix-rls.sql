-- ═══════════════════════════════════════════════════════════
-- HOTFIX: RLS PARA RESPUESTAS (SURVEY SUBMISSION)
-- ═══════════════════════════════════════════════════════════

-- 1. Asegurar INSERT para el público
DROP POLICY IF EXISTS "Public can insert responses" ON responses;
CREATE POLICY "Public can insert responses" ON responses FOR INSERT WITH CHECK (true);

-- 2. Permitir SELECT al público (necesario para el RETURNING/select('id'))
DROP POLICY IF EXISTS "Public can select responses" ON responses;
CREATE POLICY "Public can select responses" ON responses FOR SELECT USING (true);

-- 3. Asegurar INSERT para respuestas individuales
DROP POLICY IF EXISTS "Public can insert answers" ON answers;
CREATE POLICY "Public can insert answers" ON answers FOR INSERT WITH CHECK (true);

-- 4. Permitir SELECT al público en respuestas (necesario para validaciones de base de datos internas)
DROP POLICY IF EXISTS "Public can select answers" ON answers;
CREATE POLICY "Public can select answers" ON answers FOR SELECT USING (true);
