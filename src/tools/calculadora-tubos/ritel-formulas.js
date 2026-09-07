/**
 * ritel-formulas.js
 * 
 * Este archivo contiene las constantes y fórmulas matemáticas basadas en la norma RITEL 2025.
 * Centralizar esto facilita las actualizaciones si la norma cambia en el futuro.
 */

// ==========================================
// 1. CONSTANTES PARA CABLES (TUBERÍAS Y BANDEJAS) - NORMA RITEL 2025
// Actualizadas con todos los decimales para máxima precisión
// ==========================================
const CONSTANTES = {
    // Parámetros geométricos unitarios de cables
    PI: 3.141592654,
    RADIO_COAX: 3.375,       // mm (Diámetro = 6.75 mm)
    RADIO_FIBRA: 1.85,       // mm (Diámetro = 3.70 mm)

    // Áreas circulares unitarias de cables (mm²)
    // 1 Coaxial = PI * (3.375)^2 = 35.78470382 mm²
    AREA_COAX: 35.78470382,
    // 1 Fibra Óptica = PI * (1.85)^2 = 10.75210086 mm²
    AREA_FIBRA: 10.75210086,

    // Áreas rectangulares unitarias de cables (mm²) para Bandejas
    // Area Coax Rect = (6.75)^2 = 45.5625 mm²
    AREA_COAX_RECT: 45.5625,
    // Area FO Rec = (3.70)^2 = 13.69 mm²
    AREA_FO_REC: 13.69,

    // ==========================================
    // CANALIZACIONES / TUBERÍAS (Áreas Circulares)
    // ==========================================
    // Red Base SETI: 3 cables coaxiales = 3 * 35.78470382 = 107.3541115 mm²
    BASE_SETI: 107.3541115,  
    
    // Por cada PAU hacia SETI: 1 Coaxial + 1 Fibra Óptica = 35.78470382 + 10.75210086 = 46.53680468 mm²
    FACTOR_SETI: 46.53680468, 

    // Red Base SETS: 10 cables coaxiales = 10 * 35.78470382 = 357.8470382 mm²
    BASE_SETS: 357.8470382,
    
    // Por cada PAU hacia SETS: 1 Fibra Óptica = 10.75210086 mm²
    FACTOR_SETS: 10.75210086,

    // ==========================================
    // BANDEJAS PORTACABLES (Áreas Rectangulares)
    // ==========================================
    // Base SETI en Bandeja: 3 cables coaxiales rectangulares = 3 * 45.5625 = 136.6875 mm²
    BANDEJA_BASE_SETI: 136.6875,
    // Por cada PAU hacia SETI en Bandeja: 1 Coax Rect + 1 FO Rec = 45.5625 + 13.69 = 59.2525 mm²
    BANDEJA_FACTOR_SETI: 59.2525,

    // Base SETS en Bandeja: 10 cables coaxiales rectangulares = 10 * 45.5625 = 455.625 mm²
    BANDEJA_BASE_SETS: 455.625,
    // Por cada PAU hacia SETS en Bandeja: 1 FO Rec = 13.69 mm²
    BANDEJA_FACTOR_SETS: 13.69
};

// Alias por compatibilidad
const CONSTANTES_PARCELACION = CONSTANTES;

// ==========================================
// 3. DIÁMETRO INTERIOR Y ÁREA TOTAL (AT) DE LAS TUBERÍAS (mm²)
// Basado en tablas normativas de tuberías RITEL (PVC Tipo A Conduit, SCH40, EMT)
// ==========================================
const TABLA_DIAMETROS_INTERNOS = {
    "SCH40": { '1/2"': 15.3, '3/4"': 20.4, '1"': 26.1, '1 1/4"': 34.5, '1 1/2"': 40.4, '2"': 52.0, '2 1/2"': 62.68, '3"': 77.02 },
    "PVC":   { '1/2"': 17.8, '3/4"': 23.1, '1"': 29.8, '1 1/4"': 38.1, '1 1/2"': 43.7, '2"': 54.7, '2 1/2"': 67.4,  '3"': 81.64 },
    "EMT":   { '1/2"': 15.8, '3/4"': 20.9, '1"': 26.6, '1 1/4"': 35.1, '1 1/2"': 40.9, '2"': 52.5, '2 1/2"': 69.34, '3"': 84.34 }
};

// Área Total útil interna (mm²): Valores normativos de tabla técnica (concordantes con PI * (D/2)^2)
const TABLA_AT = {
    "SCH40": {
        '1/2"':   183.85,
        '3/4"':   326.85,
        '1"':     535.02,
        '1 1/4"': 934.82,
        '1 1/2"': 1281.90,
        '2"':     2123.72,
        '2 1/2"': 3085.66,
        '3"':     4659.05
    },
    "PVC": {
        '1/2"':   248.85,
        '3/4"':   419.10,
        '1"':     697.46,
        '1 1/4"': 1140.09,
        '1 1/2"': 1499.87,
        '2"':     2349.98,
        '2 1/2"': 3567.88,
        '3"':     5234.75
    },
    "EMT": {
        '1/2"':   196.07,
        '3/4"':   343.07,
        '1"':     555.72,
        '1 1/4"': 967.62,
        '1 1/2"': 1313.82,
        '2"':     2164.75,
        '2 1/2"': 3776.22,
        '3"':     5586.72
    }
};

// ==========================================
// 3. FÓRMULAS MATEMÁTICAS PRINCIPALES
// ==========================================
const RitelFormulas = {
    /**
     * Calcula la suma del área de la sección transversal (CNC) de los cables que van hacia SETI y SETS.
     * @param {number} pauSeti Cantidad de PAUs hacia el SETI.
     * @param {number} pauSets Cantidad de PAUs hacia el SETS.
     * @returns {Object} { cncSeti, cncSets }
     */
    calcularCNC: function(pauSeti, pauSets) {
        let cncSeti = CONSTANTES.BASE_SETI + (pauSeti * CONSTANTES.FACTOR_SETI);
        let cncSets = CONSTANTES.BASE_SETS + (pauSets * CONSTANTES.FACTOR_SETS);
        return { cncSeti, cncSets };
    },

    /**
     * Calcula CNC para Parcelaciones / Casas (SETU) usando el número de PAUs del tramo.
     * Base SETI = 107.3541115 (3 coax 6.75mm) + (PAUs * 46.53680468 [1 FO 3.7mm + 1 Coax 6.75mm])
     * Base SETS = 357.8470382 (10 coax 6.75mm) + (PAUs * 10.75210086 [1 FO 3.7mm])
     * @param {number} paus Cantidad de PAUs en el tramo.
     * @returns {Object} { cncSeti, cncSets }
     */
    calcularCNCParcelacion: function(paus) {
        if (!paus || paus <= 0) return { cncSeti: 0, cncSets: 0 };
        let cncSeti = CONSTANTES.BASE_SETI + (paus * CONSTANTES.FACTOR_SETI);
        let cncSets = CONSTANTES.BASE_SETS + (paus * CONSTANTES.FACTOR_SETS);
        return { cncSeti, cncSets };
    },

    /**
     * Redondeo normativo de tubos físicos (SETI y SETS):
     * 1. Si valor <= 0: 0 tubos.
     * 2. Si 0 < valor <= 1 (ej: 0.05, 0.157, 0.345): siempre se requiere mínimo 1 tubo físico.
     * 3. Si valor > 1:
     *    - Si el decimal empieza por 0 después del punto (.0x, ej: 1.01, 1.02, 2.05), se mantiene el mismo entero (1, 2, etc.).
     *    - Para redondear al siguiente entero (2, 3, etc.), el decimal debe ser >= 0.1 (ej: 1.10, 1.15, 2.10).
     * @param {number} valor 
     * @returns {number}
     */
    redondearTubos: function(valor) {
        if (!valor || valor <= 0) return 0;
        let v = Math.round(valor * 10000) / 10000;
        let entero = Math.floor(v);
        let decimal = Math.round((v - entero) * 10000) / 10000;

        // Si es menor o igual a 1 (pero > 0), requiere mínimo 1 tubo físico
        if (entero === 0) {
            return 1;
        }

        // Si valor > 1:
        // Si el decimal empieza por 0 (.01 a .09, es decir < 0.1), se conserva el mismo entero.
        // Si el decimal es >= 0.1 (.10 en adelante), pasa al siguiente entero.
        return (decimal >= 0.1) ? entero + 1 : entero;
    },

    redondearTubosParcelacion: function(valor) {
        return this.redondearTubos(valor);
    },

    /**
     * Calcula la cantidad de tubos fraccionados necesarios considerando el área del tubo y el factor de llenado.
     * @param {number} cncSeti Área total de los cables hacia SETI.
     * @param {number} cncSets Área total de los cables hacia SETS.
     * @param {number} areaTubo Área interna (AT) del tubo seleccionado.
     * @param {number} curvas Número de curvas mayores a 60 grados.
     * @returns {Object} { tubCalcSeti, tubCalcSets }
     */
    calcularTubos: function(cncSeti, cncSets, areaTubo, curvas) {
        // Factor de llenado de la norma (0.5 al 50% con reducción del 15% por curva)
        let factorLlenado = (1 - 0.15 * curvas) * 0.5;
        if (factorLlenado <= 0) factorLlenado = 0.05; // Evitar divisiones por cero o negativos
        
        let denominador = areaTubo * factorLlenado;

        let tubCalcSeti = cncSeti / denominador;
        let tubCalcSets = cncSets / denominador;
        
        return { tubCalcSeti, tubCalcSets };
    },

    /**
     * Calcula completamente los tubos de un tramo para Parcelaciones / Casas (SETU).
     * @param {number} paus Cantidad de PAUs en el tramo.
     * @param {string} material SCH40, PVC, EMT
     * @param {string} diametro 1/2", 3/4", 1", 1 1/4", 1 1/2", 2", 2 1/2", 3"
     * @param {number} curvas Número de curvas >60°
     * @returns {Object}
     */
    calcularTramoParcelacion: function(paus, material, diametro, curvas) {
        let mat = TABLA_AT[material] ? material : "PVC";
        let dia = TABLA_AT[mat][diametro] ? diametro : '2"';
        let areaTubo = TABLA_AT[mat][dia];

        let factorLlenado = (1 - 0.15 * curvas) * 0.5;
        if (factorLlenado <= 0) factorLlenado = 0.05;
        let denominador = areaTubo * factorLlenado;

        if (!paus || paus <= 0) {
            return {
                areaTubo,
                denominador,
                cncSeti: 0,
                cncSets: 0,
                tubCalcSeti: 0,
                tubFisSeti: 0,
                tubCalcSets: 0,
                tubFisSets: 0,
                totalTubos: 0
            };
        }

        let cnc = this.calcularCNCParcelacion(paus);
        let tubCalcSeti = cnc.cncSeti / denominador;
        let tubCalcSets = cnc.cncSets / denominador;
        let tubFisSeti = this.redondearTubos(tubCalcSeti);
        let tubFisSets = this.redondearTubos(tubCalcSets);
        let totalTubos = tubFisSeti + tubFisSets;

        return {
            areaTubo,
            denominador,
            cncSeti: cnc.cncSeti,
            cncSets: cnc.cncSets,
            tubCalcSeti,
            tubFisSeti,
            tubCalcSets,
            tubFisSets,
            totalTubos
        };
    },

    /**
     * Fórmulas para calcular el área requerida y el ancho de las bandejas portacables.
     * Basado en la envolvente rectangular de los cables (Norma RITEL 2025):
     * Area Coax Rect = 45.5625 mm², Area FO Rec = 13.69 mm²
     * @param {number} pauSeti Cantidad de PAUs acumulados hacia el SETI.
     * @param {number} pauSets Cantidad de PAUs acumulados hacia el SETS.
     * @param {number} altoBandeja Altura de la bandeja en mm.
     * @returns {Object} { calcBanSeti, calcBanSets, anchoSeti, anchoSets, anchoTotal }
     */
    calcularBandejas: function(pauSeti, pauSets, altoBandeja) {
        if (!altoBandeja || altoBandeja <= 0) altoBandeja = 80;

        // Cálculo de áreas rectangulares de cables (mm²)
        let calcBanSeti = pauSeti === 0 ? 0 : (CONSTANTES.BANDEJA_BASE_SETI + (pauSeti * CONSTANTES.BANDEJA_FACTOR_SETI));
        let calcBanSets = pauSets === 0 ? 0 : (CONSTANTES.BANDEJA_BASE_SETS + (pauSets * CONSTANTES.BANDEJA_FACTOR_SETS));

        // Ancho requerido dividiendo el área calculada por el alto de la bandeja
        let anchoSeti = calcBanSeti / altoBandeja;
        let anchoSets = calcBanSets / altoBandeja;
        let anchoTotal = anchoSeti + anchoSets;

        return { calcBanSeti, calcBanSets, anchoSeti, anchoSets, anchoTotal };
    }
};
