const SUPABASE_URL = 'https://qgrkvjvyiwxmbuyfnqea.supabase.co';
const SUPABASE_KEY = 'sb_publishable_hRIpVDeHHVeAJZaRnSckQQ_szYcmZSn';

class APIService {
    constructor() {
        this.db = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
    }

    // ==========================================
    // AUTH — Supabase Authentication nativo
    // ==========================================

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

            return { usuario: email, name: perfil.nombre, role: perfil.rol };
        } catch (error) {
            console.error("Error en login:", error);
            return null;
        }
    }

    // Cerrar sesión
    async logout() {
        await this.db.auth.signOut();
    }

    // Verificar sesión activa al cargar la app
    async getSession() {
        try {
            const { data: { session } } = await this.db.auth.getSession();
            if (!session) return null;

            const { data: perfil, error } = await this.db
                .from('perfiles')
                .select('nombre, rol')
                .eq('id', session.user.id)
                .single();
            if (error) throw error;

            return { usuario: session.user.email, name: perfil.nombre, role: perfil.rol };
        } catch (error) {
            console.error("Error verificando sesión:", error);
            return null;
        }
    }

    // ==========================================
    // USUARIOS — Lista de perfiles (sin password)
    // ==========================================

    async getUsuarios() {
        try {
            // Lee perfiles (nombre + rol) — sin acceso a password
            const { data, error } = await this.db.from('perfiles').select('nombre, rol');
            if (error) throw error;
            return data;
        } catch (error) {
            console.error("Error fetching usuarios:", error);
            Toast.error("Error cargando usuarios.");
            return [];
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
}

window.API = new APIService();
