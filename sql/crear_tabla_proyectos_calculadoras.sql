-- ========================================================
-- TABLA: proyectos_calculadoras
-- Almacena cálculos y tablas de las herramientas en formato JSONB.
-- Control de acceso basado en roles (RLS):
-- - Colaborador: solo accede a sus propios proyectos.
-- - Admin y Moderador: acceso completo a todos los proyectos.
-- ========================================================

-- 1. Crear la tabla para almacenar los proyectos de las calculadoras
CREATE TABLE IF NOT EXISTS public.proyectos_calculadoras (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL DEFAULT auth.uid(),
    usuario_nombre TEXT NOT NULL,
    usuario_email TEXT NOT NULL,
    herramienta TEXT NOT NULL,         -- 'calculadora-tubos', 'loss-gen-app', 'informes-obra'
    nombre_proyecto TEXT NOT NULL,     -- Ej: "Torre Barcelona Fase 2"
    modo TEXT,                          -- Ej: 'torres' o 'parcelaciones'
    datos_json JSONB NOT NULL,          -- Estructura completa de las tablas en JSON
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Habilitar Row Level Security (RLS)
ALTER TABLE public.proyectos_calculadoras ENABLE ROW LEVEL SECURITY;

-- 3. Función auxiliar para verificar si el usuario es admin o moderador
CREATE OR REPLACE FUNCTION public.es_admin_o_moderador()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.perfiles
    WHERE id = auth.uid()
      AND rol IN ('admin', 'moderador')
  );
$$;

-- 4. POLÍTICA DE LECTURA (SELECT):
-- Los admin y moderadores leen TODO. Los colaboradores solo leen sus propios proyectos.
CREATE POLICY "proyectos_select_policy"
    ON public.proyectos_calculadoras
    FOR SELECT
    TO authenticated
    USING (
        user_id = auth.uid() 
        OR public.es_admin_o_moderador()
    );

-- 5. POLÍTICA DE INSERCIÓN (INSERT):
-- Cualquier usuario autenticado puede guardar, siempre que el user_id sea el suyo.
CREATE POLICY "proyectos_insert_policy"
    ON public.proyectos_calculadoras
    FOR INSERT
    TO authenticated
    WITH CHECK (
        user_id = auth.uid()
    );

-- 6. POLÍTICA DE ACTUALIZACIÓN (UPDATE):
-- Puedes sobrescribir tu propio proyecto. Admin y moderador pueden actualizar cualquiera.
CREATE POLICY "proyectos_update_policy"
    ON public.proyectos_calculadoras
    FOR UPDATE
    TO authenticated
    USING (
        user_id = auth.uid() 
        OR public.es_admin_o_moderador()
    );

-- 7. POLÍTICA DE ELIMINACIÓN (DELETE):
-- Solo puedes borrar tus proyectos, o si eres admin/moderador puedes borrar cualquiera.
CREATE POLICY "proyectos_delete_policy"
    ON public.proyectos_calculadoras
    FOR DELETE
    TO authenticated
    USING (
        user_id = auth.uid() 
        OR public.es_admin_o_moderador()
    );

-- 8. Permisos a usuarios autenticados
GRANT SELECT, INSERT, UPDATE, DELETE ON public.proyectos_calculadoras TO authenticated;

-- 9. Índices de rendimiento
CREATE INDEX IF NOT EXISTS idx_proyectos_calculadoras_herramienta 
    ON public.proyectos_calculadoras(herramienta, updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_proyectos_calculadoras_user 
    ON public.proyectos_calculadoras(user_id);
