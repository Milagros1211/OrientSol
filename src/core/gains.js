/**
 * ==========================================
 * Archivo: src/core/gains.js
 * Propósito: Centralizador de ganancias relativas (Sustituye a todos los archivos Ganancias_X_Y.m)
 * ==========================================
 */

export const Gains = {
    /**
     * Calcula el factor de ganancia y el porcentaje relativo entre dos vectores de radiación.
     * Gestiona las indeterminaciones (división por cero) devolviendo nulo o cero.
     * 
     * @param {Array} studyVector - Vector de radiación mensual del sistema evaluado (ej. Seguidor 2 Ejes).
     * @param {Array} baseVector - Vector de radiación mensual de referencia (ej. Plano Horizontal 0º).
     * @returns {Object} - Contiene { factors, percentages, meanFactor, meanPercentage }
     */
    calculateComparativeGains(studyVector, baseVector) {
        let factors = [];
        let percentages = [];
        let sumFactor = 0;
        let sumPercentage = 0;
        let validMonths = 0;

        for (let i = 0; i < 12; i++) {
            const studyVal = studyVector[i];
            const baseVal = baseVector[i];

            // Prevención de división por cero (ej. Albedo en horizontal)
            if (baseVal === 0) {
                factors.push(null);
                percentages.push(null);
            } else {
                const factor = studyVal / baseVal;
                const percentage = (factor - 1) * 100;

                factors.push(factor);
                percentages.push(percentage);

                sumFactor += factor;
                sumPercentage += percentage;
                validMonths++;
            }
        }

        const meanFactor = validMonths > 0 ? (sumFactor / validMonths) : null;
        const meanPercentage = validMonths > 0 ? (sumPercentage / validMonths) : null;

        return { factors, percentages, meanFactor, meanPercentage };
    }
};