/**
 * ==========================================
 * Archivo: src/core/optimization.js
 * Propósito: Algoritmos de búsqueda óptima anual y estacional (Sustituye Calculos_optimo.m y Calculo_Optimo_Estacion.m)
 * ==========================================
 */

export const Optimization = {
    /**
     * Encuentra la inclinación fija anual que maximiza la captación energética.
     * Sustituye a Calculos_optimo.m
     * @param {Array} gdMatrix - Matriz [meses][grados 0-90] con la radiación global.
     * @returns {Object} - Ángulo óptimo y vector de radiación mensual.
     */
    findOptimalAnnual(gdMatrix) {
        let maxYield = 0;
        let optimalAngle = 0;
        const totalAngles = 91; // de 0º a 90º

        // Barrido de 0º a 90º
        for (let angle = 0; angle < totalAngles; angle++) {
            let annualSum = 0;
            for (let month = 0; month < 12; month++) {
                annualSum += gdMatrix[month][angle];
            }

            if (annualSum > maxYield) {
                maxYield = annualSum;
                optimalAngle = angle;
            }
        }

        // Extracción del vector mensual para el ángulo óptimo
        const optimalMonthlyRadiation = gdMatrix.map(monthData => monthData[optimalAngle]);

        return { optimalAngle, optimalMonthlyRadiation, maxYield };
    },

    /**
     * Calcula los ángulos óptimos discretizados por estaciones climáticas.
     * Sustituye a Calculo_Optimo_Estacion.m
     * Invierno (Dic, Ene, Feb), Primavera (Mar, Abr, May), Verano (Jun, Jul, Ago), Otoño (Sep, Oct, Nov).
     */
    findOptimalSeasonal(gdMatrix) {
        const seasons = [
            { name: "Invierno", months: [11, 0, 1] }, // Dic, Ene, Feb (índices 0-based)
            { name: "Primavera", months: [2, 3, 4] },
            { name: "Verano", months: [5, 6, 7] },
            { name: "Otoño", months: [8, 9, 10] }
        ];

        let seasonalResults = {};

        seasons.forEach(season => {
            let maxSeasonalYield = 0;
            let bestSeasonalAngle = 0;

            for (let angle = 0; angle < 91; angle++) {
                let currentYield = season.months.reduce((sum, monthIdx) => sum + gdMatrix[monthIdx][angle], 0);
                if (currentYield > maxSeasonalYield) {
                    maxSeasonalYield = currentYield;
                    bestSeasonalAngle = angle;
                }
            }

            seasonalResults[season.name] = {
                angle: bestSeasonalAngle,
                monthlyRadiation: season.months.map(monthIdx => gdMatrix[monthIdx][bestSeasonalAngle])
            };
        });

        return seasonalResults;
    }
};