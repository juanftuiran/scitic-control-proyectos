/**
 * ritel-formulas.js
 * 
 * Este archivo contiene las constantes y fórmulas matemáticas basadas en la norma RITEL 2025.
 * Centralizar esto facilita las actualizaciones si la norma cambia en el futuro.
 */

// ==========================================
// 1. CONSTANTES PARA TUBERÍAS (CABLES) - NORMA RITEL 2025
// Aplicable tanto a Edificios/Torres como a Parcelaciones/Casas
// ==========================================
const CONSTANTES = {
    // Red Base SETI: 3 cables coaxiales (diámetro mínimo 6.75 mm)
    // Área de 1 Coaxial = PI * (6.75/2)^2 = 35.7847 mm2 => 3 * 35.78 = 107.34 mm2
    BASE_SETI: 107.34,  
    
    // Por cada PAU hacia SETI: 1 Fibra Óptica (3.7 mm) + 1 Coaxial (6.75 mm)
    // Área de 1 Fibra (3.7 mm) = PI * (3.7/2)^2 = 10.75 mm2. Área Coaxial = 35.78 mm2
    // Total = 1 * 10.75 + 35.78 = 46.53 mm2
    FACTOR_SETI: 46.53, 

    // Red Base SETS: 10 cables coaxiales (diámetro mínimo 6.75 mm)
    // 10 * 35.7847 = 357.8 mm2
    BASE_SETS: 357.8,
    
    // Por cada PAU hacia SETS: 1 Fibra Óptica (3.7 mm)
    // 1 * 10.75 = 10.75 mm2
    FACTOR_SETS: 10.75
};

// Alias por compatibilidad
const CONSTANTES_PARCELACION = CONSTANTES;

// ==========================================
// 2. ÁREA TOTAL (AT) DE LAS TUBERÍAS (mm²)
// ==========================================
// Se definen las áreas internas útiles de los distintos tipos de tubería según su diámetro comercial (RETIE 20.6 / RITEL).
const TABLA_AT = {
    "SCH40": { '1/2"': 187.72, '3/4"': 322.38, '1"': 540.78, '1 1/4"': 955.53, '1 1/2"': 1297.17, '2"': 2138.44, '2 1/2"': 3085.66, '3"': 4659.05 },
    "PVC":   { '1/2"': 253.34, '3/4"': 414.03, '1"': 704.97, '1 1/4"': 1160.53, '1 1/2"': 1516.39, '2"': 2368.92, '2 1/2"': 3567.88, '3"': 5234.75 },
    "EMT":   { '1/2"': 279.37, '3/4"': 434.47, '1"': 711.58, '1 1/4"': 1176.28, '1 1/2"': 1569.30, '2"': 2524.97, '2 1/2"': 3776.22, '3"': 5586.72 }
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
     * Base SETI = 107.34 (3 coax 6.75mm) + (PAUs * 46.53 [1 FO 3.7mm + 1 Coax 6.75mm])
     * Base SETS = 357.80 (10 coax 6.75mm) + (PAUs * 10.75 [1 FO 3.7mm])
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
     * Redondeo normativo de tubos (decimal >= 0.1 redondea hacia arriba)
     * @param {number} valor 
     * @returns {number}
     */
    redondearTubos: function(valor) {
        if (!valor || valor <= 0) return 0;
        let v = Math.round(valor * 1000) / 1000;
        let entero = Math.floor(v);
        let decimal = v - entero;
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
     * @param {number} pauSeti Cantidad de PAUs acumulados hacia el SETI.
     * @param {number} pauSets Cantidad de PAUs acumulados hacia el SETS.
     * @param {number} altoBandeja Altura de la bandeja en mm.
     * @returns {Object} { calcBanSeti, calcBanSets, anchoSeti, anchoSets, anchoTotal }
     */
    calcularBandejas: function(pauSeti, pauSets, altoBandeja) {
        // Cálculo de áreas (se asume base fija + incremento por cada PAU)
        let areaCirculoSeti = pauSeti === 0 ? 0 : (273.34 + (pauSeti * 208.60714));
        let areaCirculoSets = pauSets === 0 ? 0 : (911.25 + (pauSets * 91.125));

        // Factor de conversión cuadrado según la norma (aprox 1.273)
        let factorConversionCuadrado = 4 / Math.PI; 
        
        let calcBanSeti = areaCirculoSeti * factorConversionCuadrado;
        let calcBanSets = areaCirculoSets * factorConversionCuadrado;

        // Ancho requerido dividiendo el área calculada por el alto de la bandeja
        let anchoSeti = calcBanSeti / altoBandeja;
        let anchoSets = calcBanSets / altoBandeja;
        let anchoTotal = anchoSeti + anchoSets;

        return { calcBanSeti, calcBanSets, anchoSeti, anchoSets, anchoTotal };
    }
};
