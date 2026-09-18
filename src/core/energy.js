/**
 * MOTOR ENERGÉTICO (MODELO DE OSTERWALD) - OrientSol 3.0 Web
 * Sustituye a: Energia.m y Energia_Osterwald.m
 */

/**
 * Calcula la energía eléctrica mensual y anual generada por el sistema.
 * 
 * @param {Array} radiationResults - Array de objetos con la radiación (G_tilted) de cada mes (obtenido de radiation.js o tracking.js)
 * @param {Array} ambientTemperatures - Array de 12 valores con la temperatura media mensual (ºC)
 * @param {Object} systemParams - Parámetros técnicos del panel
 * @returns {Object} Energía generada mensualmente y el total anual
 */
export function calculateOsterwaldEnergy(radiationResults, ambientTemperatures, systemParams = {}) {
    // Valores por defecto para Silicio Monocristalino si el usuario no los especifica
    const P_stc = systemParams.P_stc || 1000;         // Potencia pico instalada (W)
    const gamma = systemParams.gamma || -0.0035;      // Coeficiente de temperatura (1/ºC)
    const tonc = systemParams.tonc || 47;             // Temperatura de Operación Nominal de la Célula (ºC)
    
    // Condiciones Estándar de Medida (STC)
    const G_stc = 1000; // W/m2
    const T_stc = 25;   // ºC

    const daysInMonth = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
    
    let energyResults = [];
    let totalAnnualEnergy = 0;

    for (let i = 0; i < 12; i++) {
        const T_amb = ambientTemperatures[i];
        
        // La irradiancia media G (W/m2) se estima a partir de la radiación diaria (kWh/m2/día)
        // Para simplificar el modelo mensual, asumimos unas 10 horas de sol pico equivalentes
        // En un modelo horario estricto, esto se calcularía en el bucle de integración.
        // Aquí adaptamos la fórmula de Osterwald promediada mensualmente:
        const G_mean = (radiationResults[i].G_tilted * 1000) / 10; 
        
        // 1. Calcular la temperatura de la célula (Tc)
        const T_c = T_amb + ((tonc - 20) / 800) * G_mean;
        
        // 2. Aplicar el Modelo de Osterwald para obtener la Potencia Máxima (Pm)
        // P_m = P_stc * (G / G_stc) * [1 + gamma * (T_c - T_stc)]
        const P_m = P_stc * (G_mean / G_stc) * (1 + gamma * (T_c - T_stc));
        
        // 3. Convertir la Potencia a Energía Diaria y luego Mensual
        // E = P_m * (horas_equivalentes) * dias_del_mes / 1000 (para pasar a kWh)
        const dailyEnergy_kWh = (P_m * 10) / 1000; 
        const monthlyEnergy_kWh = dailyEnergy_kWh * daysInMonth[i];
        
        totalAnnualEnergy += monthlyEnergy_kWh;

        energyResults.push({
            month: i + 1,
            T_cell: T_c,
            P_max: P_m,
            monthlyEnergy: monthlyEnergy_kWh
        });
    }

    return {
        monthlyData: energyResults,
        totalAnnualEnergy: totalAnnualEnergy
    };
}