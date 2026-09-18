/**
 * ==========================================
 * Archivo: src/core/tracking.js
 * Propósito: Dinámica y cinemática de seguidores solares (Sustituye Bh_...m, Dh_...m, Rh_...m, Gd_...m)
 * ==========================================
 */

export const Tracking = {
    /**
     * Seguimiento a un eje polar (o ecuatorial).
     * El eje de rotación es paralelo al eje de la Tierra (inclinación = latitud, azimut = 0º).
     */
    simulatePolarAxis(hourAnglesMatrix, declinations, latitudeRad) {
        // En un seguidor polar, el ángulo de incidencia equivale a la declinación solar.
        return hourAnglesMatrix.map((dailyAngles, monthIdx) => {
            const dec = declinations[monthIdx];
            return dailyAngles.map(w => {
                // Factor geométrico cos(theta) = cos(delta)
                return Math.cos(dec);
            });
        });
    },

    /**
     * Seguimiento a un eje horizontal (Norte-Sur).
     * El eje de rotación es paralelo al suelo. Sustituye la lógica de Bh_EjeHorizontal.m.
     */
    simulateHorizontalAxis(hourAnglesMatrix, solarAltitudeMatrix, solarAzimuthMatrix) {
        return hourAnglesMatrix.map((dailyAngles, monthIdx) => {
            return dailyAngles.map((w, hourIdx) => {
                const alpha = solarAltitudeMatrix[monthIdx][hourIdx];
                const psi = solarAzimuthMatrix[monthIdx][hourIdx];
                
                // Cálculo del ángulo óptimo de giro (beta_tracking)
                // Fórmula: beta = arctan(sin(psi) / tan(alpha))
                const betaTracking = Math.atan(Math.sin(psi) / Math.tan(alpha));
                
                // Retorna el coseno del ángulo de incidencia
                return Math.cos(betaTracking) * Math.cos(alpha) * Math.cos(psi) + 
                       Math.sin(betaTracking) * Math.sin(alpha);
            });
        });
    },

    /**
     * Seguimiento a un eje azimutal (Vertical).
     * Mantiene una inclinación constante (usualmente la colatitud) y gira siguiendo el azimut.
     */
    simulateAzimuthalAxis(solarAltitudeMatrix, latitudeRad) {
        const betaAzimuthal = latitudeRad; // Inclinación fija igual a la latitud
        return solarAltitudeMatrix.map(dailyAltitudes => {
            return dailyAltitudes.map(alpha => {
                // Al seguir perfectamente el azimut, cos(theta) = cos(abs(alpha - beta))
                return Math.cos(Math.abs(alpha - betaAzimuthal));
            });
        });
    },

    /**
     * Seguimiento a dos ejes.
     * La superficie se mantiene permanentemente perpendicular a la radiación directa.
     * Absorbe Calulo_Beta_2Ejes.m y derivados.
     */
    simulateDualAxis(solarAltitudeMatrix) {
        return solarAltitudeMatrix.map(dailyAltitudes => {
            return dailyAltitudes.map(alpha => {
                // Perpendicularidad perfecta: beta = 90º - alpha
                const betaDual = (Math.PI / 2) - alpha;
                // El coseno del ángulo de incidencia es máximo (1) para la componente directa
                return { betaDynamic: betaDual, incidenceFactor: 1.0 };
            });
        });
    }
};