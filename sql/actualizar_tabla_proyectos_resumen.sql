-- ========================================================
-- ACTUALIZACIÓN: Soporte de columna 'resumen' en proyectos_calculadoras
-- Ejecuta esto en el SQL Editor de Supabase
-- ========================================================

ALTER TABLE public.proyectos_calculadoras 
ADD COLUMN IF NOT EXISTS resumen JSONB DEFAULT '{}'::jsonb;
