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

    // ─── DERIVADORES NORMALIZADOS (PRESETS PDF / RITEL) ──────────────
    derivadores: {
        'DER-24-2.3': { nombre: 'Derivador 24 / 2.3 dB (PDF)', derivacion: 24, paso: 2.3 },
        'DER-20-2.2': { nombre: 'Derivador 20 / 2.2 dB (PDF)', derivacion: 20, paso: 2.2 },
        'DER-16-2.5': { nombre: 'Derivador 16 / 2.5 dB (PDF)', derivacion: 16, paso: 2.5 },
        'DER-12-2.5': { nombre: 'Derivador 12 / 2.5 dB (PDF)', derivacion: 12, paso: 2.5 },
        'DER-24-1.5': { nombre: 'Derivador 24 / 1.5 dB (Bajo paso)', derivacion: 24, paso: 1.5 },
        'DER-20-1.5': { nombre: 'Derivador 20 / 1.5 dB (Bajo paso)', derivacion: 20, paso: 1.5 },
        'DER-16-2.0': { nombre: 'Derivador 16 / 2.0 dB', derivacion: 16, paso: 2.0 },
        'DER-12-2.3': { nombre: 'Derivador 12 / 2.3 dB', derivacion: 12, paso: 2.3 },
        'DER-FINAL':  { nombre: 'Derivador 12 dB Terminal (Carga 75Ω)', derivacion: 12, paso: 0, esTerminal: true }
    },

    // ─── ELEMENTOS INTERMEDIOS DE BIFURCACIÓN TRONCAL ────────────────
    elementosIntermedios: {
        'DIRECTO':   { nombre: 'Directo (Sin elemento)',       bifurcacion: 0,   paso: 0   },
        'COUPLER-8': { nombre: 'Acoplador Troncal 8.0 dB (PDF)', bifurcacion: 8.0, paso: 1.8 },
        'SPL-2-4.5': { nombre: 'Splitter Troncal 2 vías 4.5 dB (PDF)', bifurcacion: 4.5, paso: 4.5 },
        'SPL-3-6.0': { nombre: 'Splitter Troncal 3 vías 6.0 dB', bifurcacion: 6.0, paso: 6.0 }
    },

    // ─── AMPLIFICADORES DE LÍNEA ─────────────────────────────────────
    amplificadores: {
        'AMP-25': { nombre: 'Amplificador Línea +25 dB (PDF)', ganancia: 25, alimentacion: '12V DC / 200mA' },
        'AMP-20': { nombre: 'Amplificador Línea +20 dB',       ganancia: 20, alimentacion: '12V DC / 150mA' },
        'AMP-30': { nombre: 'Amplificador Línea +30 dB',       ganancia: 30, alimentacion: '24V DC / 250mA' }
    },

    // ─── SISTEMA Y NORMATIVA RITEL ───────────────────────────────────
    sistema: {
        nivelSalida:    115, // 115 dBµV habitual en central selectiva programable de cubierta
        nivelIdealMin:  58.5,
        nivelIdealMax:  80,
        frecBaja:       470,
        frecAlta:       698,
    },

    ritel: {
        nivelMinimoLegal: 47.0, // dBµV mínimo en toma de usuario (RITEL Res. CRC 5405)
        nivelMaximoLegal: 70.0, // dBµV máximo en toma de usuario
        nivelOptimoMin:   55.0, // dBµV diseño recomendado
        nivelOptimoMax:   65.0, // dBµV diseño recomendado
        desbalanceMaxCanal: 3.0,
        desbalanceMaxTomas: 12.0
    }
};
