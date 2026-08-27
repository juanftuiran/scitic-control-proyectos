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
}

window.API = new APIService();
