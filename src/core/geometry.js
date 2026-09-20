/**
 * ==========================================
 * Archivo: src/core/geometry.js
 * Propósito: Cálculos de geometría solar (Sustituye matriz_declinacion.m, Angulos.m, Altura_Solar.m, Azimut_Solar.m)
 * ==========================================
 */

export const Geometry = {
    // Días intermedios representativos de Klein para cada mes (Ene-Dic)
    representativeDays: [17, 46, 75, 105, 135, 161, 198, 229, 259, 289, 319, 344],

    /**
     * Calcula la declinación solar (δ) para los días representativos.
     * Fórmula: δ = 23.45 * sin(360 * (284 + n) / 365)
     */
    getDeclinations() {
        return this.representativeDays.map(day => {
            const decDeg = 23.45 * Math.sin((2 * Math.PI * (day + 284)) / 365);
            return decDeg * (Math.PI / 180); // Retorna en radianes
        });
    },

    /**
     * Calcula el ángulo horario de puesta de sol (ωs).
     * Fórmula: cos(ωs) = -tan(φ) * tan(δ)
     */
    getSunsetHourAngles(latitudeRad, declinations) {
        return declinations.map(dec => {
            let cosWs = -Math.tan(latitudeRad) * Math.tan(dec);
            if (cosWs > 1) cosWs = 1;
            if (cosWs < -1) cosWs = -1;
            return Math.acos(cosWs);
        });
    },

    /**
     * Genera la matriz de ángulos horarios (ω) desde la salida hasta la puesta de sol.
     */
    getHourAnglesMatrix(sunsetHourAngles) {
        const hourAnglesMatrix = [];
        sunsetHourAngles.forEach(ws => {
            const dailyAngles = [];
            for (let w = -ws; w <= ws; w += (Math.PI / 12)) {
                dailyAngles.push(w);
            }
            hourAnglesMatrix.push(dailyAngles);
        });
        return hourAnglesMatrix;
    },

    /**
     * Calcula la altura solar (αs) para cada hora de sol útil.
     */
    getSolarAltitude(latitudeRad, declinations, hourAnglesMatrix) {
        return hourAnglesMatrix.map((dailyAngles, monthIdx) => {
            const dec = declinations[monthIdx];
            return dailyAngles.map(w => {
                const sinAlpha = Math.sin(dec) * Math.sin(latitudeRad) + 
                                 Math.cos(dec) * Math.cos(latitudeRad) * Math.cos(w);
                return Math.asin(sinAlpha);
            });
        });
    },

    /**
     * Calcula el azimut solar (ψs) para cada hora de sol útil.
     */
    getSolarAzimuth(solarAltitudeMatrix, latitudeRad, declinations, hourAnglesMatrix) {
        return solarAltitudeMatrix.map((dailyAltitudes, monthIdx) => {
            const dec = declinations[monthIdx];
            return dailyAltitudes.map((alpha, hourIdx) => {
                const w = hourAnglesMatrix[monthIdx][hourIdx];
                let cosPsi = (Math.sin(alpha) * Math.sin(latitudeRad) - Math.sin(dec)) / 
                             (Math.cos(alpha) * Math.cos(latitudeRad));
                
                if (cosPsi > 1) cosPsi = 1;
                if (cosPsi < -1) cosPsi = -1;
                
                let psi = Math.acos(cosPsi);
                if (w > 0) psi = -psi; 
                return psi;
            });
        });
    }
};