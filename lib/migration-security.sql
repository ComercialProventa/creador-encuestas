-- ============================================================
-- Plataforma de Encuestas — Seguridad y Políticas (RLS)
-- Corre este script en el SQL Editor de Supabase
-- ============================================================

-- 1. Habilitar RLS en todas las tablas
ALTER TABLE surveys ENABLE ROW LEVEL SECURITY;
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE answers ENABLE ROW LEVEL SECURITY;

-- 2. Limpiar políticas existentes (por si acaso corriste esto antes)
DROP POLICY IF EXISTS "Public can read surveys" ON surveys;
DROP POLICY IF EXISTS "Admin can do all on surveys" ON surveys;
DROP POLICY IF EXISTS "Public can read questions" ON questions;
DROP POLICY IF EXISTS "Admin can do all on questions" ON questions;
DROP POLICY IF EXISTS "Public can insert responses" ON responses;
DROP POLICY IF EXISTS "Admin can do all on responses" ON responses;
DROP POLICY IF EXISTS "Public can insert answers" ON answers;
DROP POLICY IF EXISTS "Admin can do all on answers" ON answers;

-- 3. Políticas para: surveys (Encuestas)
-- Los usuarios públicos solo pueden LEER encuestas
CREATE POLICY "Public can read surveys" 
ON surveys FOR SELECT 
USING (true);

-- Los usuarios logueados (Tú - Admin) pueden hacer DE TODO (Insert, Update, Delete)
CREATE POLICY "Admin can do all on surveys" 
ON surveys FOR ALL 
TO authenticated 
USING (true) WITH CHECK (true);

-- 4. Políticas para: questions (Preguntas)
-- Los usuarios públicos solo pueden LEER las preguntas para poder responder la encuesta
CREATE POLICY "Public can read questions" 
ON questions FOR SELECT 
USING (true);

-- Administradores pueden hacer de todo
CREATE POLICY "Admin can do all on questions" 
ON questions FOR ALL 
TO authenticated 
USING (true) WITH CHECK (true);

-- 5. Políticas para: responses (Cabecera de Respuestas)
-- Usuarios anónimos PÚBLICOS pueden CREAR respuestas, pero NO leerlas
CREATE POLICY "Public can insert responses" 
ON responses FOR INSERT 
WITH CHECK (true);

-- Administradores pueden hacer de todo (Ej: Leer para los dashboards)
CREATE POLICY "Admin can do all on responses" 
ON responses FOR ALL 
TO authenticated 
USING (true) WITH CHECK (true);

-- 6. Políticas para: answers (Las respuestas individuales)
-- Usuarios anónimos PÚBLICOS pueden INSERTAR sus respuestas
CREATE POLICY "Public can insert answers" 
ON answers FOR INSERT 
WITH CHECK (true);

-- Administradores pueden hacer de todo
CREATE POLICY "Admin can do all on answers" 
ON answers FOR ALL 
TO authenticated 
USING (true) WITH CHECK (true);
