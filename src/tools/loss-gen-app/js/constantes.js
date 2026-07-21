/**
 * =====================================================================
 * CONSTANTES Y BASE DE DATOS DE DISPOSITIVOS
 * Calculadora de Pérdidas de Señal TDT — SCITIC
 * =====================================================================
 */

const CONSTANTES = {

    // ─── CABLES COAXIALES ────────────────────────────────────────────
    cables: {
        'RG6/100X':   { nombre: 'RG-6 / 100X',    atten_baja: 0.127,  atten_alta: 0.1558 },
        'RG11/T165':  { nombre: 'RG-11 / T-165',  atten_baja: 0.088,  atten_alta: 0.109  }
    },

    // ─── CONECTORES ──────────────────────────────────────────────────
    conectores: {
        'F-Standard':   { nombre: 'Conector F Standard',    atenuacion: 0.2 },
        'F-Compresion': { nombre: 'Conector F Compresión',  atenuacion: 0.1 }
    },

    // ─── REPARTIDORES / SPLITTERS ────────────────────────────────────
    repartidores: {
        'SPL-2':  { nombre: 'Splitter 2 vías (4dB)',   atenuacion: 4,   vias: 2 },
        'SPL-3':  { nombre: 'Splitter 3 vías (6dB)',   atenuacion: 6,   vias: 3 },
        'SPL-4':  { nombre: 'Splitter 4 vías (8dB)',   atenuacion: 8,   vias: 4 },
        'SPL-6':  { nombre: 'Splitter 6 vías (10dB)',  atenuacion: 10,  vias: 6 },
        'SPL-8':  { nombre: 'Splitter 8 vías (12dB)',  atenuacion: 12,  vias: 8 },
    },

    // ─── TOMAS ───────────────────────────────────────────────────────
    tomas: {
        'Standard':  { nombre: 'Toma TV Standard (1dB)',  atenuacion: 1   },
        'Pasante':   { nombre: 'Toma Pasante (0.5dB)',    atenuacion: 0.5 },
        'Final':     { nombre: 'Toma Final (2dB)',        atenuacion: 2   },
    },

    // ─── SISTEMA ─────────────────────────────────────────────────────
    sistema: {
        nivelSalida:    113,      
        nivelIdealMin:  58.5,     
        nivelIdealMax:  80,       
        frecBaja:       470,      
        frecAlta:       698,      
    }
};
