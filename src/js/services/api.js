const SUPABASE_URL = 'https://qgrkvjvyiwxmbuyfnqea.supabase.co';
const SUPABASE_KEY = 'sb_publishable_hRIpVDeHHVeAJZaRnSckQQ_szYcmZSn';

class APIService {
    constructor() {
        // Obtenemos el cliente global de supabase
        this.db = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
    }

    // Login seguro via RPC — la contraseña NUNCA llega al cliente
    async login(usuario, password) {
        try {
            const { data, error } = await this.db.rpc('validar_credenciales', {
                p_usuario: usuario,
                p_password: password
            });
            if (error) throw error;
            return data; // Retorna { valido, nombre, rol } o null
        } catch (error) {
            console.error("Error en login RPC:", error);
            return null;
        }
    }

    async getUsuarios() {
        try {
            // Selección explícita — excluye 'password' por seguridad
            const { data, error } = await this.db.from('usuarios').select('id, usuario, nombre, rol');
            if (error) throw error;
            return data;
        } catch (error) {
            console.error("Error fetching usuarios:", error);
            Toast.error("Error cargando usuarios.");
            return [];
        }
    }

    async getRegistros() {
        try {
            // Selección explícita de columnas de registros
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
            // Selección explícita de columnas de auditoría
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
