/**
 * =====================================================================
 * MOTOR DE CÁLCULO — Balance de Potencia y Pérdidas de Fibra Óptica TDT
 * Calculadora de Pérdidas de Fibra Óptica para TDT / TV — SCITIC
 * =====================================================================
 * Soporta cálculos independientes por Sector / Transmisor y
 * consolidación global de toda la urbanización de casas.
 * =====================================================================
 */

const MotorCalculoFO = {

    /**
     * Calcula la atenuación de un tramo de fibra en dB.
     * @param {number} distancia_m - Longitud del tramo en metros
     * @param {number} atenuacion_db_km - Coeficiente de atenuación en dB/km (ej. 0.25 para G.657 a 1550nm)
     * @returns {number} Atenuación en dB
     */
    perdidaFibra(distancia_m, atenuacion_db_km) {
        const d = parseFloat(distancia_m) || 0;
        const a = parseFloat(atenuacion_db_km) || 0;
        return (d / 1000.0) * a;
    },

    /**
     * Calcula la pérdida acumulada por empalmes de fusión óptica.
     * @param {number} cantidad - Número de fusiones en la trayectoria
     * @param {number} atenuacion_unitaria - Pérdida por fusión en dB (por defecto 0.1 dB)
     */
    perdidaFusiones(cantidad, atenuacion_unitaria = 0.10) {
        return (parseFloat(cantidad) || 0) * (parseFloat(atenuacion_unitaria) || 0);
    },

    /**
     * Calcula la pérdida por conectores mecánicos y adaptadores.
     * @param {number} cantidad - Número de conectores mecánicos / acoplamientos
     * @param {number} atenuacion_unitaria - Pérdida por conector en dB (por defecto 1.0 dB)
     */
    perdidaConectores(cantidad, atenuacion_unitaria = 1.00) {
        return (parseFloat(cantidad) || 0) * (parseFloat(atenuacion_unitaria) || 0);
    },

    /**
     * Calcula la pérdida total del enlace óptico hasta el micro-nodo de la casa.
     * @returns {number} Pérdida total acumulada en dB
     */
    perdidaTotal(perdidaFibraTroncal, perdidaFibraDrop, perdidaFusiones, perdidaConectores, splitterCabecera_dB = 0, splitterNap_dB = 0, atenuador_dB = 0) {
        return (parseFloat(perdidaFibraTroncal) || 0) +
               (parseFloat(perdidaFibraDrop) || 0) +
               (parseFloat(perdidaFusiones) || 0) +
               (parseFloat(perdidaConectores) || 0) +
               (parseFloat(splitterCabecera_dB) || 0) +
               (parseFloat(splitterNap_dB) || 0) +
               (parseFloat(atenuador_dB) || 0);
    },

    /**
     * Calcula la potencia óptica recibida en el micro-nodo de la casa (dBm).
     * P_rx (dBm) = P_tx_sector (dBm) - Pérdida Total (dB)
     */
    potenciaRecibida(potenciaTx_dBm, perdidaTotal_dB) {
        return (parseFloat(potenciaTx_dBm) || 0) - (parseFloat(perdidaTotal_dB) || 0);
    },

    /**
     * Evalúa el nivel de señal frente al rango de sensibilidad del micro-nodo óptico TDT.
     * Rango por defecto solicitado: -15.0 dBm a +4.0 dBm
     * @param {number} potenciaRx_dBm - Potencia óptica incidente en el receptor
     * @param {number} minLegal - Mínima potencia aceptable (ej. -15.0 dBm)
     * @param {number} maxLegal - Máxima potencia aceptable antes de saturación (ej. +4.0 dBm)
     * @param {number} optMin - Límite inferior del rango óptimo (ej. -10.0 dBm)
     * @param {number} optMax - Límite superior del rango óptimo (ej. 0.0 dBm)
     */
    evaluarReceptor(potenciaRx_dBm, minLegal = -15.0, maxLegal = 4.0, optMin = -10.0, optMax = 0.0) {
        const p = parseFloat(potenciaRx_dBm) || 0;
        const minL = parseFloat(minLegal);
        const maxL = parseFloat(maxLegal);
        const oMin = parseFloat(optMin);
        const oMax = parseFloat(optMax);

        if (p < minL) {
            return {
                estado: 'BAJO',
                label: `Bajo Nivel (< ${minL.toFixed(1)} dBm)`,
                clase: 'nivel-bad',
                badgeClase: 'badge-danger',
                cumple: false,
                motivo: 'Potencia óptica insuficiente: riesgo de congelamiento o pérdida de canales TDT.'
            };
        }
        if (p > maxL) {
            return {
                estado: 'ALTO',
                label: `Alto Nivel (> +${maxL.toFixed(1)} dBm)`,
                clase: 'nivel-bad',
                badgeClase: 'badge-danger',
                cumple: false,
                motivo: 'Saturación del receptor: distorsión por no linealidad óptica.'
            };
        }
        if (p >= oMin && p <= oMax) {
            return {
                estado: 'OPTIMO',
                label: `Óptimo (${oMin.toFixed(1)} a ${oMax.toFixed(1)} dBm)`,
                clase: 'nivel-ok',
                badgeClase: 'badge-success',
                cumple: true,
                motivo: 'Rango óptimo para alta relación portadora/ruido (CNR > 48 dB).'
            };
        }
        return {
            estado: 'CUMPLE',
            label: `Cumple (${minL.toFixed(1)} a ${maxL.toFixed(1)} dBm)`,
            clase: 'nivel-warn',
            badgeClase: 'badge-warning',
            cumple: true,
            motivo: 'Dentro del rango operativo de recepción del micro-nodo TV.'
        };
    },

    /**
     * Calcula métricas de balance óptico para un sector específico.
     */
    calcularResumenSector(filas, configReceptor = {}) {
        if (!filas || filas.length === 0) return null;

        const potencias = filas.map(f => parseFloat(f.potenciaRx));
        const perdidas = filas.map(f => parseFloat(f.perdidaTotal));
        const margenes = filas.map(f => parseFloat(f.margenOptico));

        const minPot = Math.min(...potencias);
        const maxPot = Math.max(...potencias);
        const minPerd = Math.min(...perdidas);
        const maxPerd = Math.max(...perdidas);
        const minMargen = Math.min(...margenes);

        const desbalanceOptico = maxPot - minPot;

        const minRango = parseFloat(configReceptor.rangoMinimo !== undefined ? configReceptor.rangoMinimo : -15.0);
        const maxRango = parseFloat(configReceptor.rangoMaximo !== undefined ? configReceptor.rangoMaximo : 4.0);

        const cumpleTodo = minPot >= minRango && maxPot <= maxRango;

        let totalMetrosDrop = 0;
        let totalFusiones = 0;
        let totalConectores = 0;

        filas.forEach(f => {
            totalMetrosDrop += (parseFloat(f.distDrop) || 0);
            totalFusiones += (parseFloat(f.numFusiones) || 0);
            totalConectores += (parseFloat(f.numConectores) || 0);
        });

        return {
            totalCasas: filas.length,
            minPotencia: minPot,
            maxPotencia: maxPot,
            minPerdida: minPerd,
            maxPerdida: maxPerd,
            desbalanceOptico: desbalanceOptico,
            minMargenSeguridad: minMargen,
            cumpleTodo: cumpleTodo,
            totalMetrosDrop: totalMetrosDrop,
            totalFusiones: totalFusiones,
            totalConectores: totalConectores
        };
    },

    /**
     * Calcula la consolidación global de todos los sectores / transmisores del proyecto.
     * Suma las casas de todos los sistemas al final y evalúa peor/mejor nivel de todo el desarrollo.
     * @param {Array} resultadosSectores - Array de { sector, resumen, filas, naps }
     * @param {Object} configReceptor - { rangoMinimo, rangoMaximo }
     */
    calcularResumenGlobal(resultadosSectores, configReceptor = {}) {
        if (!resultadosSectores || resultadosSectores.length === 0) return null;

        let totalCasasGlobal = 0;
        let totalNapsGlobal = 0;
        let totalMetrosDropGlobal = 0;
        let totalMetrosTroncalGlobal = 0;
        let totalFusionesGlobal = 0;
        let totalConectoresGlobal = 0;

        const todasPotencias = [];
        const todasPerdidas = [];
        const todosMargenes = [];
        let cumpleTodoGlobal = true;

        resultadosSectores.forEach(s => {
            totalCasasGlobal += (s.resumen?.totalCasas || 0);
            totalNapsGlobal += (s.naps?.length || 0);
            totalMetrosDropGlobal += (s.resumen?.totalMetrosDrop || 0);
            totalFusionesGlobal += (s.resumen?.totalFusiones || 0);
            totalConectoresGlobal += (s.resumen?.totalConectores || 0);

            // Metros de cable troncal por sector
            (s.naps || []).forEach(n => {
                totalMetrosTroncalGlobal += (parseFloat(n.distTroncal) || 0);
            });

            if (s.resumen) {
                if (!s.resumen.cumpleTodo) cumpleTodoGlobal = false;
                todasPotencias.push(s.resumen.minPotencia, s.resumen.maxPotencia);
                todasPerdidas.push(s.resumen.minPerdida, s.resumen.maxPerdida);
                todosMargenes.push(s.resumen.minMargenSeguridad);
            }
        });

        const minPotGlobal = todasPotencias.length > 0 ? Math.min(...todasPotencias) : 0;
        const maxPotGlobal = todasPotencias.length > 0 ? Math.max(...todasPotencias) : 0;
        const minPerdGlobal = todasPerdidas.length > 0 ? Math.min(...todasPerdidas) : 0;
        const maxPerdGlobal = todasPerdidas.length > 0 ? Math.max(...todasPerdidas) : 0;
        const minMargenGlobal = todosMargenes.length > 0 ? Math.min(...todosMargenes) : 0;

        const minRango = parseFloat(configReceptor.rangoMinimo !== undefined ? configReceptor.rangoMinimo : -15.0);
        const maxRango = parseFloat(configReceptor.rangoMaximo !== undefined ? configReceptor.rangoMaximo : 4.0);

        return {
            totalSectores: resultadosSectores.length,
            totalNaps: totalNapsGlobal,
            totalCasas: totalCasasGlobal,
            minPotencia: minPotGlobal,
            maxPotencia: maxPotGlobal,
            minPerdida: minPerdGlobal,
            maxPerdida: maxPerdGlobal,
            desbalanceOptico: maxPotGlobal - minPotGlobal,
            minMargenSeguridad: minMargenGlobal,
            cumpleTodo: (minPotGlobal >= minRango && maxPotGlobal <= maxRango),
            totalMetrosTroncal: totalMetrosTroncalGlobal,
            totalMetrosDrop: totalMetrosDropGlobal,
            totalMetrosFibra: totalMetrosTroncalGlobal + totalMetrosDropGlobal,
            totalFusiones: totalFusionesGlobal,
            totalConectores: totalConectoresGlobal
        };
    }
};
