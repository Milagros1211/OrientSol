/**
 * ==========================================
 * Archivo: src/core/radiation.js
 * Propósito: Modelado de componentes de radiación y transposición (Sustituye Dh0.m, DhBeta.m, RhBeta.m, Gh0.m)
 * ==========================================
 */

export const Radiation = {
    /**
     * Calcula el factor de conversión r_d (fracción horaria difusa) de Collares-Pereira y Rabl.
     * Reemplaza el núcleo matemático de Dh0.m
     * Fórmula: rd = (π/24) * (cos(ω) - cos(ωs)) / (sin(ωs) - ωs*cos(ωs))
     */
    calculateDiffuseHourlyFraction(hourAnglesMatrix, sunsetAngles) {
        return hourAnglesMatrix.map((dailyAngles, monthIdx) => {
            const ws = sunsetAngles[monthIdx];
            const denominator = Math.sin(ws) - (ws * Math.cos(ws));
            
            return dailyAngles.map(w => {
                const numerator = Math.cos(w) - Math.cos(ws);
                return (Math.PI / 24) * (numerator / denominator);
            });
        });
    },

    /**
     * Transpone la radiación difusa horaria desde el plano horizontal al plano inclinado (Isotrópico de Liu y Jordan).
     * Sustituye a DhBeta.m
     * Fórmula: Dh(β) = Dh(0) * (1 + cos(β)) / 2
     */
    calculateDiffuseTilted(diffuseHourlyHorizontalMatrix, betaRad) {
        const tiltFactor = (1 + Math.cos(betaRad)) / 2;
        return diffuseHourlyHorizontalMatrix.map(monthlyData => 
            monthlyData.map(dh0 => dh0 * tiltFactor)
        );
    },

    /**
     * Calcula la radiación de albedo (reflejada) en un plano inclinado β.
     * Sustituye a RhBeta.m 
     * Fórmula: Rh(β) = Gh(0) * ρ * (1 - cos(β)) / 2
     * @param globalHourlyHorizontalMatrix: Matriz horaria de radiación global horizontal
     * @param betaRad: Ángulo de inclinación en radianes
     * @param albedo: Coeficiente de reflexión del terreno (ρ)
     */
    calculateAlbedoTilted(globalHourlyHorizontalMatrix, betaRad, albedo) {
        const reflectionFactor = albedo * (1 - Math.cos(betaRad)) / 2;
        return globalHourlyHorizontalMatrix.map(monthlyData => 
            monthlyData.map(gh0 => gh0 * reflectionFactor)
        );
    },

    /**
     * Agrega las componentes horarias para obtener la radiación mensual en un plano inclinado.
     * Simula los ciclos for que acumulaban y multiplicaban por 2 en MATLAB.
     */
    aggregateHourlyToDaily(tiltedHourlyMatrix) {
        return tiltedHourlyMatrix.map(monthlyData => {
            // Se suman todos los valores horarios y se multiplica por 2 (simetría)
            const sum = monthlyData.reduce((acc, val) => acc + val, 0);
            return sum * 2; 
        });
    }
};