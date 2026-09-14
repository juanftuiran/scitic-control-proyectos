const SUPABASE_URL = 'https://qgrkvjvyiwxmbuyfnqea.supabase.co';
const SUPABASE_KEY = 'sb_publishable_hRIpVDeHHVeAJZaRnSckQQ_szYcmZSn';

class APIService {
    constructor() {
        this.db = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
    }

    // ==========================================
    // AUTH — Supabase Authentication nativo
    // ==========================================

    // Obtener perfil cacheado de forma síncrona/instantánea
    getCachedSession() {
        try {
            const cached = localStorage.getItem('scitic_user_profile');
            if (cached) {
                return JSON.parse(cached);
            }
        } catch (e) {
            console.error("Error leyendo perfil cacheado:", e);
        }
        return null;
    }

    // Login con Supabase Auth (email + password)
    async login(email, password) {
        try {
            const { data, error } = await this.db.auth.signInWithPassword({
                email: email,
                password: password
            });
            if (error) throw error;

            // Obtener perfil (nombre, rol) de la tabla perfiles
            const { data: perfil, error: perfilError } = await this.db
                .from('perfiles')
                .select('nombre, rol')
                .eq('id', data.user.id)
                .single();
            if (perfilError) throw perfilError;

            const userProfile = { usuario: email, name: perfil.nombre, role: perfil.rol };
            localStorage.setItem('scitic_user_profile', JSON.stringify(userProfile));
            return userProfile;
        } catch (error) {
            console.error("Error en login:", error);
            return null;
        }
    }

    // Cerrar sesión
    async logout() {
        try {
            localStorage.removeItem('scitic_user_profile');
            await this.db.auth.signOut();
        } catch (error) {
            console.error("Error en logout:", error);
        }
    }

    // Verificar sesión activa al cargar la app
    async getSession() {
        try {
            const { data: { session }, error: sessionError } = await this.db.auth.getSession();
            if (sessionError || !session) {
                localStorage.removeItem('scitic_user_profile');
                return null;
            }

            const cached = this.getCachedSession();

            const { data: perfil, error } = await this.db
                .from('perfiles')
                .select('nombre, rol')
                .eq('id', session.user.id)
                .single();
            if (error) {
                if (cached) return cached;
                throw error;
            }

            const userProfile = { usuario: session.user.email, name: perfil.nombre, role: perfil.rol };
            localStorage.setItem('scitic_user_profile', JSON.stringify(userProfile));
            return userProfile;
        } catch (error) {
            console.error("Error verificando sesión:", error);
            return this.getCachedSession();
        }
    }

    // ==========================================
    // USUARIOS — Lista de perfiles (sin password)
    // ==========================================

    async getUsuarios() {
        try {
            // Lee perfiles (nombre + rol + saldo_favor) — sin acceso a password
            const { data, error } = await this.db.from('perfiles').select('nombre, rol, saldo_favor');
            if (error) throw error;
            return data;
        } catch (error) {
            console.error("Error fetching usuarios:", error);
            Toast.error("Error cargando usuarios.");
            return [];
        }
    }

    async actualizarSaldoFavor(nombreTrabajador, nuevoSaldo) {
        try {
            const { error } = await this.db.from('perfiles').update({ saldo_favor: nuevoSaldo }).eq('nombre', nombreTrabajador);
            if (error) throw error;
            return true;
        } catch (error) {
            console.error("Error updating saldo_favor:", error);
            return false;
        }
    }

    // ==========================================
    // GASTOS (Viáticos y extras)
    // ==========================================

    async getGastos() {
        try {
            const { data, error } = await this.db.from('gastos').select('*').order('created_at', { ascending: false });
            if (error) throw error;
            return data;
        } catch (error) {
            console.error("Error fetching gastos:", error);
            Toast.error("Error cargando gastos.");
            return [];
        }
    }

    async crearGasto(gasto) {
        try {
            const { error } = await this.db.from('gastos').insert([gasto]);
            if (error) throw error;
            return true;
        } catch (error) {
            console.error("Error creating gasto:", error);
            Toast.error("Error al registrar el gasto: " + error.message);
            return false;
        }
    }

    async actualizarGasto(id, updates) {
        try {
            const { error } = await this.db.from('gastos').update(updates).eq('id', id);
            if (error) throw error;
            return true;
        } catch (error) {
            console.error("Error updating gasto:", error);
            Toast.error("Error al actualizar gasto: " + error.message);
            return false;
        }
    }

    async eliminarGasto(id) {
        try {
            const { error } = await this.db.from('gastos').delete().eq('id', id);
            if (error) throw error;
            return true;
        } catch (error) {
            console.error("Error deleting gasto:", error);
            Toast.error("Error al eliminar gasto: " + error.message);
            return false;
        }
    }

    // ==========================================
    // REGISTROS & AUDITORIA — Sin cambios
    // ==========================================

    async getRegistros() {
        try {
            const { data, error } = await this.db.from('registros').select('id, cliente, proyecto, trabajador, fecha, horas, actividad, horas_pres, valor, pago');
            if (error) throw error;
            return data;
        } catch (error) {
            console.error("Error fetching registros:", error);
            Toast.error("Error cargando registros.");
            return [];
        }
    }

    async getAuditoria() {
        try {
            const { data, error } = await this.db.from('auditoria').select('id, fecha_hora, usuario, rol, accion, detalle, created_at').order('created_at', { ascending: false });
            if (error) throw error;
            return data;
        } catch (error) {
            console.error("Error fetching auditoria:", error);
            return [];
        }
    }

    async registrarAuditoria(log) {
        try {
            await this.db.from('auditoria').insert([log]);
        } catch (error) {
            console.error("Error registrando auditoria:", error);
        }
    }

    async crearRegistro(registro) {
        try {
            const { error } = await this.db.from('registros').insert([registro]);
            if (error) throw error;
            return true;
        } catch (error) {
            console.error("Error creating registro:", error);
            Toast.error("Error al crear el registro: " + error.message);
            return false;
        }
    }

    async actualizarRegistro(id, registro) {
        try {
            const { error } = await this.db.from('registros').update(registro).eq('id', id);
            if (error) throw error;
            return true;
        } catch (error) {
            console.error("Error updating registro:", error);
            Toast.error("Error al actualizar: " + error.message);
            return false;
        }
    }

    async eliminarRegistro(id) {
        try {
            const { error } = await this.db.from('registros').delete().eq('id', id);
            if (error) throw error;
            return true;
        } catch (error) {
            console.error("Error deleting registro:", error);
            Toast.error("Error al eliminar: " + error.message);
            return false;
        }
    }

    async importarRegistros(registros) {
        try {
            const { error } = await this.db.from('registros').insert(registros);
            if (error) throw error;
            return true;
        } catch (error) {
            console.error("Error importando registros:", error);
            Toast.error("Error en base de datos: " + error.message);
            return false;
        }
    }

    // ==========================================
    // PROYECTOS DE CALCULADORAS Y HERRAMIENTAS
    // ==========================================

    async getProyectosCalculadora(herramienta) {
        try {
            const { data, error } = await this.db
                .from('proyectos_calculadoras')
                .select('id, nombre_proyecto, modo, usuario_nombre, usuario_email, user_id, updated_at, created_at, resumen, datos_json')
                .eq('herramienta', herramienta)
                .order('updated_at', { ascending: false });

            if (error) throw error;
            return (data || []).map(p => ({
                ...p,
                resumen: p.resumen || (p.datos_json && p.datos_json.resumen) || {}
            }));
        } catch (error) {
            console.error("Error al obtener proyectos de calculadora:", error);
            if (typeof Toast !== 'undefined') Toast.error("Error cargando proyectos guardados.");
            return [];
        }
    }

    async getProyectoPorId(id) {
        try {
            const { data, error } = await this.db
                .from('proyectos_calculadoras')
                .select('*')
                .eq('id', id)
                .single();

            if (error) throw error;
            return data;
        } catch (error) {
            console.error("Error al cargar detalle del proyecto:", error);
            if (typeof Toast !== 'undefined') Toast.error("No se pudo cargar el proyecto seleccionado.");
            return null;
        }
    }

    async getProyectoCalculadoraPorId(id) {
        return await this.getProyectoPorId(id);
    }

    async guardarProyectoCalculadora({ id = null, herramienta, nombreProyecto, modo = '', datosJson, resumen = {} }) {
        try {
            const session = await this.getSession();
            if (!session) {
                if (typeof Toast !== 'undefined') Toast.error("Debes iniciar sesión para guardar proyectos.");
                return { exito: false, mensaje: "Sin sesión activa" };
            }

            // Asegurar que el resumen también esté dentro de datosJson como respaldo
            if (datosJson && typeof datosJson === 'object') {
                datosJson.resumen = resumen;
            }

            if (id) {
                // Actualizar proyecto existente (Sobrescribir)
                let updatePayload = {
                    nombre_proyecto: nombreProyecto,
                    modo: modo,
                    datos_json: datosJson,
                    resumen: resumen,
                    updated_at: new Date().toISOString()
                };

                let resUpdate = await this.db
                    .from('proyectos_calculadoras')
                    .update(updatePayload)
                    .eq('id', id)
                    .select()
                    .single();

                if (resUpdate.error && resUpdate.error.message && resUpdate.error.message.includes('resumen')) {
                    delete updatePayload.resumen;
                    resUpdate = await this.db
                        .from('proyectos_calculadoras')
                        .update(updatePayload)
                        .eq('id', id)
                        .select()
                        .single();
                }

                if (resUpdate.error) throw resUpdate.error;
                if (typeof Toast !== 'undefined') Toast.success("Proyecto actualizado correctamente.");
                const saved = resUpdate.data || {};
                return { exito: true, data: saved, ...saved };
            } else {
                // Insertar nuevo proyecto
                let insertPayload = {
                    usuario_nombre: session.name || session.usuario || 'Usuario',
                    usuario_email: session.usuario,
                    herramienta: herramienta,
                    nombre_proyecto: nombreProyecto,
                    modo: modo,
                    datos_json: datosJson,
                    resumen: resumen
                };

                let resInsert = await this.db
                    .from('proyectos_calculadoras')
                    .insert([insertPayload])
                    .select()
                    .single();

                if (resInsert.error && resInsert.error.message && resInsert.error.message.includes('resumen')) {
                    delete insertPayload.resumen;
                    resInsert = await this.db
                        .from('proyectos_calculadoras')
                        .insert([insertPayload])
                        .select()
                        .single();
                }

                if (resInsert.error) throw resInsert.error;
                if (typeof Toast !== 'undefined') Toast.success("Proyecto guardado en el servidor.");
                const saved = resInsert.data || {};
                return { exito: true, data: saved, ...saved };
            }
        } catch (error) {
            console.error("Error al guardar proyecto:", error);
            if (typeof Toast !== 'undefined') Toast.error("Error al guardar: " + error.message);
            return { exito: false, mensaje: error.message };
        }
    }

    async eliminarProyectoCalculadora(id) {
        try {
            const { error } = await this.db
                .from('proyectos_calculadoras')
                .delete()
                .eq('id', id);

            if (error) throw error;
            if (typeof Toast !== 'undefined') Toast.success("Proyecto eliminado.");
            return true;
        } catch (error) {
            console.error("Error al eliminar proyecto:", error);
            if (typeof Toast !== 'undefined') Toast.error("No se pudo eliminar el proyecto.");
            return false;
        }
    }
}

window.API = new APIService();
