const SUPABASE_URL = 'https://qgrkvjvyiwxmbuyfnqea.supabase.co';
const SUPABASE_KEY = 'sb_publishable_hRIpVDeHHVeAJZaRnSckQQ_szYcmZSn';

class APIService {
    constructor() {
        // Obtenemos el cliente global de supabase
        this.db = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
    }

    async getUsuarios() {
        try {
            const { data, error } = await this.db.from('usuarios').select('*');
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
            const { data, error } = await this.db.from('registros').select('*');
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
            const { data, error } = await this.db.from('auditoria').select('*').order('created_at', { ascending: false });
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
