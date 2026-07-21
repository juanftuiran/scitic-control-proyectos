/**
 * =====================================================================
 * MOTOR DE CÁLCULOS — Pérdidas de Señal TDT
 * Calculadora de Pérdidas de Señal TDT — SCITIC
 * =====================================================================
 */

const MotorCalculo = {

    perdidaCable(distancia_m, atenuacion_por_m) {
        return distancia_m * atenuacion_por_m;
    },

    perdidaConectores(cantidad, atenuacion_unitaria) {
        return cantidad * atenuacion_unitaria;
    },

    /**
     * Calcula la pérdida acumulada del derivador para un piso en una cadena.
     * @param {Array} cadena - Array de { derivacion, paso } (orden: piso más alto al más bajo)
     * @param {number} indice - Posición del piso en la cadena (0 = más alto)
     * @param {string} direccion - 'descendente' (señal viene de arriba) o 'ascendente' (señal viene de abajo)
     */
    calcularPerdidaDerivador(cadena, indice, direccion = 'descendente') {
        if (!cadena || cadena.length === 0 || indice < 0 || indice >= cadena.length) return 0;
        
        let perdida = cadena[indice].derivacion;
        
        if (direccion === 'descendente') {
            // Señal entra por arriba. Sumamos atenuaciones de paso de los pisos superiores.
            for (let i = 0; i < indice; i++) {
                perdida += cadena[i].paso;
            }
        } else {
            // Señal entra por abajo. Sumamos atenuaciones de paso de los pisos inferiores.
            for (let i = cadena.length - 1; i > indice; i--) {
                perdida += cadena[i].paso;
            }
        }
        
        return perdida;
    },

    perdidaTotal(perdidaTroncal, perdidaDist, perdidaConectores, derivador_dB, repartidor_dB, toma_dB, amplificador_dB) {
        return perdidaTroncal + perdidaDist + perdidaConectores +
               derivador_dB + repartidor_dB + toma_dB - amplificador_dB;
    },

    nivelSenal(nivelSalida, perdidaTotal) {
        return nivelSalida - perdidaTotal;
    },

    calcularResumen(filas) {
        if (!filas || filas.length === 0) return null;

        const perdBaja = filas.map(f => f.perdidaBaja);
        const perdAlta = filas.map(f => f.perdidaAlta);
        const nivBaja  = filas.map(f => f.nivelBaja);
        const nivAlta  = filas.map(f => f.nivelAlta);

        return {
            maxPerdidaBaja: Math.max(...perdBaja),
            maxPerdidaAlta: Math.max(...perdAlta),
            minPerdidaBaja: Math.min(...perdBaja),
            minPerdidaAlta: Math.min(...perdAlta),
            maxNivelBaja:   Math.max(...nivBaja),
            maxNivelAlta:   Math.max(...nivAlta),
            minNivelBaja:   Math.min(...nivBaja),
            minNivelAlta:   Math.min(...nivAlta),
            difNivelBaja:   Math.max(...nivBaja) - Math.min(...nivBaja),
            difNivelAlta:   Math.max(...nivAlta) - Math.min(...nivAlta),
        };
    }
};
