/**
 * =====================================================================
 * CONSTANTES Y BASE DE DATOS DE DISPOSITIVOS ÓPTICOS
 * Calculadora de Pérdidas de Fibra Óptica para TDT / TV — SCITIC
 * =====================================================================
 * Modelo de referencia de cable drop: RO1030 / RO1031 (FOD1 / FOD2)
 * Norma: ITU-T G.657 / IEC 60794-1-2 (Chaqueta LSZH)
 * Sistema: TDT (DVB-T2) sobre fibra óptica pasiva (RF overlay / Micro-nodos TV)
 * Compatible con múltiples sectores y múltiples transmisores ópticos.
 * =====================================================================
 */

const CONSTANTES_FO = {

    // ─── CABLES DE FIBRA ÓPTICA ──────────────────────────────────────
    // Especificaciones basadas en ficha técnica RO1030/RO1031 (FOD1/FOD2)
    // Coeficientes en dB/km (dB/m = dB_km / 1000)
    cables: {
        'FOD1-G657': {
            nombre: 'RO1030 / FOD1 (Drop G.657 1 Hilo LSZH)',
            parte: 'RO1030',
            referencia: 'FOD1',
            tipo: 'G.657 (ITU-T G.657 / IEC 60794-1-2)',
            chaqueta: 'LSZH (Low Smoke Zero Halogen)',
            hilos: 1,
            atten_1550: 0.25, // dB/km (0.00025 dB/m)
            atten_1310: 0.38  // dB/km (0.00038 dB/m)
        },
        'FOD2-G657': {
            nombre: 'RO1031 / FOD2 (Drop G.657 2 Hilos LSZH)',
            parte: 'RO1031',
            referencia: 'FOD2',
            tipo: 'G.657 (ITU-T G.657 / IEC 60794-1-2)',
            chaqueta: 'LSZH (Low Smoke Zero Halogen)',
            hilos: 2,
            atten_1550: 0.25, // dB/km (0.00025 dB/m)
            atten_1310: 0.38  // dB/km (0.00038 dB/m)
        },
        'TRONCAL-G652D': {
            nombre: 'Troncal Dieléctrico G.652.D (6-24 Hilos)',
            parte: 'G652D-TR',
            referencia: 'TR-SM',
            tipo: 'G.652.D (ITU-T G.652.D)',
            chaqueta: 'PE / LSZH Exterior',
            hilos: 12,
            atten_1550: 0.22, // dB/km
            atten_1310: 0.35  // dB/km
        }
    },

    // ─── LONGITUDES DE ONDA ──────────────────────────────────────────
    longitudesOnda: {
        '1550': {
            nombre: '1550 nm (Estándar TDT / TV Óptica / RFoG)',
            descripcion: 'Menor atenuación en fibra, compatible con amplificadores ópticos EDFA'
        },
        '1310': {
            nombre: '1310 nm (Segunda Ventana Óptica)',
            descripcion: 'Uso en enlaces cortos con transmisores DFB 1310 nm'
        }
    },

    // ─── EMPALMES POR FUSIÓN ─────────────────────────────────────────
    // Valor por defecto solicitado: 0.10 dB (Límite normativo RITEL)
    fusiones: {
        'FUSION-DEFECTO': {
            nombre: 'Empalme por Fusión Estándar / RITEL (0.10 dB)',
            atenuacion: 0.10,
            normaRitelMax: 0.10
        },
        'FUSION-LAB': {
            nombre: 'Empalme Fusión Alta Precisión (0.05 dB)',
            atenuacion: 0.05,
            normaRitelMax: 0.10
        },
        'FUSION-CONSERV': {
            nombre: 'Empalme Fusión Conservador (0.12 dB)',
            atenuacion: 0.12,
            normaRitelMax: 0.15
        }
    },

    // ─── CONECTORES MECÁNICOS Y ADAPTADORES ──────────────────────────
    // Valor por defecto solicitado: 1.00 dB por conector mecánico
    conectores: {
        'SC-APC-MEC-1DB': {
            nombre: 'Conector Mecánico SC/APC Rápido en Campo (1.00 dB)',
            atenuacion: 1.00,
            normaRitelMax: 1.00
        },
        'SC-APC-MEC-STD': {
            nombre: 'Conector Mecánico SC/APC Estándar (0.50 dB)',
            atenuacion: 0.50,
            normaRitelMax: 0.50
        },
        'SC-APC-PRE': {
            nombre: 'Conector SC/APC Pulido de Fábrica / Pigtail (0.25 dB)',
            atenuacion: 0.25,
            normaRitelMax: 0.50
        }
    },

    // ─── SPLITTERS ÓPTICOS BALANCEADOS (PLC) ─────────────────────────
    splittersPLC: {
        'DIRECTO':  { nombre: 'Directo (0.0 dB - Sin Splitter)', atenuacion: 0.0,  vias: 1 },
        'PLC-1x2':  { nombre: 'Splitter PLC 1x2 (3.6 dB)',       atenuacion: 3.6,  vias: 2 },
        'PLC-1x4':  { nombre: 'Splitter PLC 1x4 (7.2 dB)',       atenuacion: 7.2,  vias: 4 },
        'PLC-1x8':  { nombre: 'Splitter PLC 1x8 (10.4 dB)',      atenuacion: 10.4, vias: 8 },
        'PLC-1x16': { nombre: 'Splitter PLC 1x16 (13.6 dB)',     atenuacion: 13.6, vias: 16 },
        'PLC-1x32': { nombre: 'Splitter PLC 1x32 (16.9 dB)',     atenuacion: 16.9, vias: 32 },
        'PLC-1x64': { nombre: 'Splitter PLC 1x64 (20.3 dB)',     atenuacion: 20.3, vias: 64 }
    },

    // ─── ACOPLADORES DESBALANCEADOS FBT ──────────────────────────────
    acopladoresFBT: {
        'DIRECTO':   { nombre: 'Directo (0 dB - Sin Tap)',                          paso: 0.0, derivacion: 0.0 },
        'FBT-95-5':  { nombre: 'Acoplador FBT 95/5 (Paso: 0.3 dB / Tap: 13.5 dB)', paso: 0.3, derivacion: 13.5 },
        'FBT-90-10': { nombre: 'Acoplador FBT 90/10 (Paso: 0.6 dB / Tap: 10.5 dB)', paso: 0.6, derivacion: 10.5 },
        'FBT-85-15': { nombre: 'Acoplador FBT 85/15 (Paso: 0.8 dB / Tap: 8.6 dB)',  paso: 0.8, derivacion: 8.6 },
        'FBT-80-20': { nombre: 'Acoplador FBT 80/20 (Paso: 1.1 dB / Tap: 7.3 dB)',  paso: 1.1, derivacion: 7.3 },
        'FBT-70-30': { nombre: 'Acoplador FBT 70/30 (Paso: 1.7 dB / Tap: 5.5 dB)',  paso: 1.7, derivacion: 5.5 },
        'FBT-60-40': { nombre: 'Acoplador FBT 60/40 (Paso: 2.4 dB / Tap: 4.2 dB)',  paso: 2.4, derivacion: 4.2 },
        'FBT-50-50': { nombre: 'Acoplador FBT 50/50 (Paso: 3.5 dB / Tap: 3.5 dB)',  paso: 3.5, derivacion: 3.5 }
    },

    // ─── SISTEMA Y RANGOS DE TRANSMISIÓN / RECEPCIÓN TDT ─────────────
    sistema: {
        potenciaTxDefecto: 16.0, // +16.0 dBm por defecto para urbanizaciones horizontales
        longitudOndaDefecto: '1550',
        fusionDefecto: 0.10,     // 0.1 dB por fusión
        conectorDefecto: 1.00,   // 1.0 dB por conector mecánico
        attenTroncalDefecto: 0.22,
        attenDropDefecto: 0.25,
        rangoTxSugeridos: [6, 8, 10, 13, 16, 18, 20, 22] // dBm
    },

    // ─── PARÁMETROS DEL MICRO-NODO ÓPTICO RECEPTOR TDT ───────────────
    // Rango solicitado: -15.0 dBm a +4.0 dBm
    receptor: {
        rangoMinimoDefecto: -15.0, // dBm (Sensibilidad mínima aceptable)
        rangoMaximoDefecto: 4.0,   // dBm (Saturación de fotodiodo)
        optimoMinDefecto:   -10.0, // dBm (Rango óptimo para alta relación portadora/ruido)
        optimoMaxDefecto:   0.0    // dBm
    }
};
