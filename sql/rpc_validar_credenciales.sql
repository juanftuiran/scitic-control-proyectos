-- =============================================
-- RPC: validar_credenciales
-- Valida email/password del lado del servidor.
-- Retorna JSON { valido, nombre, rol } — NUNCA expone la contraseña.
-- SECURITY DEFINER salta RLS para acceder a la tabla usuarios.
-- =============================================

CREATE OR REPLACE FUNCTION public.validar_credenciales(
    p_email TEXT,
    p_password TEXT
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_record RECORD;
BEGIN
    SELECT nombre, rol, password
    INTO v_record
    FROM public.usuarios
    WHERE LOWER(usuario) = LOWER(p_email);

    IF NOT FOUND THEN
        RETURN json_build_object('valido', false);
    END IF;

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

-- =============================================
-- RPC: obtener_usuarios
-- Retorna lista de usuarios SIN la columna password.
-- SECURITY DEFINER salta RLS.
-- =============================================

CREATE OR REPLACE FUNCTION public.obtener_usuarios()
RETURNS TABLE(id TEXT, usuario TEXT, nombre TEXT, rol TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT u.id::TEXT, u.usuario, u.nombre, u.rol
    FROM public.usuarios u;
END;
$$;

-- Permisos para que anon/authenticated puedan invocar las funciones
GRANT EXECUTE ON FUNCTION public.validar_credenciales(TEXT, TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.obtener_usuarios() TO anon, authenticated;
