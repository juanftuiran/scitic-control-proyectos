class AppStore {
    constructor() {
        this.state = {
            datos: [],
            auditoria: [],
            listaFiltradaGlobal: [],
            alertasDetalladasGlobales: [],
            editId: null,
            usuarioActual: null,
            trabajadoresActivosParaPendientes: [],
            config: {
                meses: []
            }
        };
        this.listeners = [];
    }

    setState(newState) {
        this.state = { ...this.state, ...newState };
        this.notify();
    }

    subscribe(listener) {
        this.listeners.push(listener);
        return () => {
            this.listeners = this.listeners.filter(l => l !== listener);
        };
    }

    notify() {
        this.listeners.forEach(listener => listener(this.state));
    }

    // Selectors
    getDatos() { return this.state.datos; }
    getUsuario() { return this.state.usuarioActual; }
    getFiltrados() { return this.state.listaFiltradaGlobal; }
}

window.Store = new AppStore();
