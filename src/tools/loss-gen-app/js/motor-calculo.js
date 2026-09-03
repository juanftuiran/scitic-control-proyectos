/**
 * =====================================================================
 * MOTOR DE CÁLCULOS — Pérdidas de Señal TDT
 * Calculadora de Pérdidas de Señal TDT — SCITIC
 * =====================================================================
 */

const MotorCalculo = {

    perdidaCable(distancia_m, atenuacion_por_m) {
        return (parseFloat(distancia_m) || 0) * (parseFloat(atenuacion_por_m) || 0);
    },

    perdidaConectores(cantidad, atenuacion_unitaria) {
        return (parseFloat(cantidad) || 0) * (parseFloat(atenuacion_unitaria) || 0);
    },

    /**
     * Calcula la pérdida acumulada del derivador para un piso en una cadena.
     * Soporta valores manuales directos o desde catálogo.
     * @param {Array} cadena - Array de { derivacion, paso } (orden: piso más alto al más bajo)
     * @param {number} indice - Posición del piso en la cadena (0 = más alto)
     * @param {string} direccion - 'descendente' (señal viene de arriba) o 'ascendente' (señal viene de abajo)
     */
    calcularPerdidaDerivador(cadena, indice, direccion = 'descendente') {
        if (!cadena || cadena.length === 0 || indice < 0 || indice >= cadena.length) return 0;
        
        let perdida = parseFloat(cadena[indice].derivacion) || 0;
        
        if (direccion === 'descendente') {
            // Señal entra por arriba. Sumamos atenuaciones de paso de los pisos superiores.
            for (let i = 0; i < indice; i++) {
                perdida += (parseFloat(cadena[i].paso) || 0);
            }
        } else {
            // Señal entra por abajo. Sumamos atenuaciones de paso de los pisos inferiores.
            for (let i = cadena.length - 1; i > indice; i--) {
                perdida += (parseFloat(cadena[i].paso) || 0);
            }
        }
        
        return perdida;
    },

    /**
     * Pérdida total de la toma en dB.
     * Se resta la ganancia del amplificador de línea si aplica.
     */
    perdidaTotal(perdidaTroncal, perdidaDist, perdidaConectores, derivador_dB, repartidor_dB, toma_dB, amplificador_dB = 0, perdidaIntermedia_dB = 0) {
        return (parseFloat(perdidaTroncal) || 0) +
               (parseFloat(perdidaDist) || 0) +
               (parseFloat(perdidaConectores) || 0) +
               (parseFloat(derivador_dB) || 0) +
               (parseFloat(repartidor_dB) || 0) +
               (parseFloat(toma_dB) || 0) +
               (parseFloat(perdidaIntermedia_dB) || 0) -
               (parseFloat(amplificador_dB) || 0);
    },

    nivelSenal(nivelSalida, perdidaTotal) {
        return (parseFloat(nivelSalida) || 0) - (parseFloat(perdidaTotal) || 0);
    },

    /**
     * Evaluación normativa según RITEL (Resolución CRC 5405 / Anexo 8.1)
     * Rango Legal: 47 a 70 dBµV en toma de usuario
     * Rango Óptimo Recomendado: 55 a 65 dBµV
     */
    evaluarRITEL(nivelBaja, nivelAlta) {
        const minLegal = (CONSTANTES.ritel && CONSTANTES.ritel.nivelMinimoLegal) || 47.0;
        const maxLegal = (CONSTANTES.ritel && CONSTANTES.ritel.nivelMaximoLegal) || 70.0;
        const optMin   = (CONSTANTES.ritel && CONSTANTES.ritel.nivelOptimoMin) || 55.0;
        const optMax   = (CONSTANTES.ritel && CONSTANTES.ritel.nivelOptimoMax) || 65.0;

        const minNivel = Math.min(nivelBaja, nivelAlta);
        const maxNivel = Math.max(nivelBaja, nivelAlta);

        if (minNivel < minLegal) {
            return { estado: 'BAJO', label: 'Bajo Nivel (<47dBµV)', clase: 'nivel-bad', cumpleLegal: false };
        }
        if (maxNivel > maxLegal) {
            return { estado: 'ALTO', label: 'Alto Nivel (>70dBµV)', clase: 'nivel-bad', cumpleLegal: false };
        }
        if (minNivel >= optMin && maxNivel <= optMax) {
            return { estado: 'OPTIMO', label: 'Óptimo RITEL (55-65dBµV)', clase: 'nivel-ok', cumpleLegal: true };
        }
        return { estado: 'CUMPLE', label: 'Cumple RITEL (47-70dBµV)', clase: 'nivel-warn', cumpleLegal: true };
    },

    calcularResumen(filas) {
        if (!filas || filas.length === 0) return null;

        const perdBaja = filas.map(f => f.perdidaBaja);
        const perdAlta = filas.map(f => f.perdidaAlta);
        const nivBaja  = filas.map(f => f.nivelBaja);
        const nivAlta  = filas.map(f => f.nivelAlta);

        const minNivBaja = Math.min(...nivBaja);
        const minNivAlta = Math.min(...nivAlta);
        const maxNivBaja = Math.max(...nivBaja);
        const maxNivAlta = Math.max(...nivAlta);

        const difBaja = maxNivBaja - minNivBaja;
        const difAlta = maxNivAlta - minNivAlta;
        const desbalanceTotal = Math.max(maxNivBaja, maxNivAlta) - Math.min(minNivBaja, minNivAlta);
        const cumpleRitel = (minNivBaja >= 47.0 && minNivAlta >= 47.0 && maxNivBaja <= 70.0 && maxNivAlta <= 70.0);

        return {
            maxPerdidaBaja: Math.max(...perdBaja),
            maxPerdidaAlta: Math.max(...perdAlta),
            minPerdidaBaja: Math.min(...perdBaja),
            minPerdidaAlta: Math.min(...perdAlta),
            maxNivelBaja:   maxNivBaja,
            maxNivelAlta:   maxNivAlta,
            minNivelBaja:   minNivBaja,
            minNivelAlta:   minNivAlta,
            difNivelBaja:   difBaja,
            difNivelAlta:   difAlta,
            desbalanceTotal: desbalanceTotal,
            cumpleRitel:    cumpleRitel
        };
    }
};
