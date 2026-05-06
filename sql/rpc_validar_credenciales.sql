-- =============================================
-- RPC: validar_credenciales
-- Valida usuario/password del lado del servidor.
-- Retorna JSON { valido, nombre, rol } — NUNCA expone la contraseña.
-- Ejecutar en Supabase SQL Editor.
-- =============================================

CREATE OR REPLACE FUNCTION public.validar_credenciales(
    p_usuario TEXT,
    p_password TEXT
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER  -- Se ejecuta con privilegios del owner, no del caller
AS $$
DECLARE
    v_record RECORD;
BEGIN
    SELECT usuario, nombre, rol, password
    INTO v_record
    FROM public.usuarios
    WHERE LOWER(usuario) = LOWER(p_usuario);

    -- Usuario no encontrado
    IF NOT FOUND THEN
        RETURN json_build_object('valido', false);
    END IF;

    -- Comparar contraseña (texto plano por ahora — idealmente usar pgcrypto)
    IF v_record.password = p_password THEN
        RETURN json_build_object(
            'valido', true,
            'nombre', v_record.nombre,
            'rol', v_record.rol
        );
    ELSE
        RETURN json_build_object('valido', false);
    END IF;
END;
$$;

-- Permitir que los roles anon/authenticated invoquen la función
GRANT EXECUTE ON FUNCTION public.validar_credenciales(TEXT, TEXT) TO anon, authenticated;
