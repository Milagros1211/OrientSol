/**
 * ==========================================
 * Archivo: src/core/energy.js
 * Propósito: Transición a potencia real mediante el Modelo Térmico de Osterwald (Sustituye Energia_Osterwald.m)
 * ==========================================
 */

export const Energy = {
    /**
     * Aplica el modelo de Osterwald para determinar la energía eléctrica producida (kWh).
     * Considera la temperatura ambiente y la Temperatura de Operación Nominal de la Célula (TONC).
     * 
     * @param {Array} radiationVector - Radiación global diaria mensual (kWh/m2/día).
     * @param {Array} temperatureVector - Temperaturas medias mensuales (ºC).
     * @param {Number} installedPowerKw - Potencia pico instalada (kWp).
     * @param {Number} tonc - TONC del panel (por defecto ~47ºC).
     * @param {Number} gamma - Coeficiente de temperatura (ej. -0.0035 ºC^-1).
     */
    applyOsterwaldModel(radiationVector, temperatureVector, installedPowerKw = 1, tonc = 47, gamma = -0.0035) {
        const daysInMonth = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
        let monthlyEnergy = [];
        let annualEnergy = 0;

        for (let i = 0; i < 12; i++) {
            const G_diaria = radiationVector[i]; // Irradiación (kWh/m2/día)
            const T_amb = temperatureVector[i];

            // 1. Irradiancia media horaria asumiendo sol plano de 24h (Metodología de OrientSol)
            // G (W/m2) = G_diaria (kWh/m2/día) * 1000 / 24
            const G_wm2 = (G_diaria * 1000) / 24;

            // 2. Temperatura de la Célula (Tc)
            // Fórmula: Tc = T_amb + [(TONC - 20) / 800] * G_wm2
            const T_celula = T_amb + (((tonc - 20) / 800) * G_wm2);

            // 3. Potencia media ajustada por pérdidas térmicas (Modelo Osterwald)
            // P = P_pico * (G / 1000) * [1 + gamma * (Tc - 25)]
            const P_media = (installedPowerKw * 1000) * (G_wm2 / 1000) * (1 + (gamma * (T_celula - 25)));

            // 4. Energía generada en el mes (kWh)
            // E_mes = P_media(W) * 24h * dias_del_mes / 1000
            const E_mes = (P_media * 24 * daysInMonth[i]) / 1000;
            
            monthlyEnergy.push(E_mes);
            annualEnergy += E_mes;
        }

        return { monthlyEnergy, annualEnergy };
    }
};