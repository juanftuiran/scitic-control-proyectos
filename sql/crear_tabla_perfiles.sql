-- =============================================
-- TABLA: perfiles
-- Vinculada a auth.users via UUID.
-- Almacena nombre y rol de cada usuario.
-- Se crea automáticamente al registrar un usuario en Supabase Auth.
-- =============================================

-- 1. Crear tabla perfiles
CREATE TABLE IF NOT EXISTS public.perfiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    nombre TEXT NOT NULL,
    rol TEXT NOT NULL DEFAULT 'colaborador',
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Activar RLS
ALTER TABLE public.perfiles ENABLE ROW LEVEL SECURITY;

-- 3. Políticas: usuarios autenticados pueden leer todos los perfiles
CREATE POLICY "perfiles_select_authenticated"
    ON public.perfiles FOR SELECT
    TO authenticated
    USING (true);

-- 4. Trigger: crear perfil automáticamente al registrar usuario en Auth
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
    INSERT INTO public.perfiles (id, nombre, rol)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'nombre', split_part(NEW.email, '@', 1)),
        COALESCE(NEW.raw_user_meta_data->>'rol', 'colaborador')
    );
    RETURN NEW;
END;
$$;

-- Eliminar trigger anterior si existe
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
