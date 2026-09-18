/**
 * MOTOR DE OPTIMIZACIÓN - OrientSol 3.0 Web
 * Sustituye a: Calculos_optimo.m, Calculo_Optimo_Estacion.m y Tabla_OptAnual.m
 */

import { calculateTiltedRadiation } from './radiation.js';

/**
 * 1. OPTIMIZACIÓN ANUAL (Sustituye a Calculos_optimo.m)
 * Realiza un barrido de inclinaciones de 0º a 90º y devuelve el ángulo 
 * que maximiza la radiación global acumulada anual.
 * 
 * @param {number} latDeg - Latitud en grados
 * @param {number[]} gdmHorizontal - Array de 12 valores de irradiancia global horizontal (Ene-Dic)
 * @param {number} albedo - Coeficiente de reflectividad del suelo (Por defecto 0.2)
 * @returns {Object} Configuración óptima anual y sus datos mensuales
 */
export function optimizeAnnualTilt(latDeg, gdmHorizontal, albedo = 0.2) {
    let bestAngle = 0;
    let maxAnnualRadiation = 0;
    let bestMonthlyData = [];

    // Bucle iterativo de fuerza bruta (barrido discreto de 0º a 90º)
    for (let beta = 0; beta <= 90; beta++) {
        // Por defecto asumimos orientación Sur puro (gamma = 0) para el hemisferio Norte
        // (La lógica de cambio de hemisferio se puede agregar invirtiendo el azimut a 180 si lat < 0)
        let gamma = (latDeg >= 0) ? 0 : 180;
        
        const monthlyResults = calculateTiltedRadiation(latDeg, gdmHorizontal, beta, gamma, albedo);
        
        // Calcular la suma anual para esta inclinación beta
        // Se multiplica por los días del mes para obtener la energía total mensual y luego anual
        const daysInMonth = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
        let annualSum = 0;
        
        for (let i = 0; i < 12; i++) {
            annualSum += monthlyResults[i].G_tilted * daysInMonth[i];
        }

        // Seleccionamos el par que maximiza la función objetivo (energía recibida)
        if (annualSum > maxAnnualRadiation) {
            maxAnnualRadiation = annualSum;
            bestAngle = beta;
            bestMonthlyData = monthlyResults;
        }
    }

    return {
        optimalAngle: bestAngle,
        annualRadiation: maxAnnualRadiation,
        monthlyData: bestMonthlyData
    };
}

/**
 * 2. OPTIMIZACIÓN ESTACIONAL (Sustituye a Calculo_Optimo_Estacion.m)
 * Modula la orientación subdividiendo los meses en periodos estacionales
 * para obtener un ángulo óptimo específico por cada ventana de tiempo.
 */
export function optimizeSeasonalTilt(latDeg, gdmHorizontal, albedo = 0.2) {
    // Definimos las 4 estaciones agrupando los índices de los meses (0 = Enero, 11 = Diciembre)
    const seasons = {
        winter: [11, 0, 1],   // Dic, Ene, Feb
        spring: [2, 3, 4],    // Mar, Abr, May
        summer: [5, 6, 7],    // Jun, Jul, Ago
        autumn: [8, 9, 10]    // Sep, Oct, Nov
    };

    let seasonalOptimums = {};

    // Evaluamos cada estación de manera independiente
    for (const [seasonName, monthsIndices] of Object.entries(seasons)) {
        let bestAngle = 0;
        let maxSeasonalRadiation = 0;
        
        // Barrido de 0º a 90º para esa estación concreta
        for (let beta = 0; beta <= 90; beta++) {
            let gamma = (latDeg >= 0) ? 0 : 180;
            const monthlyResults = calculateTiltedRadiation(latDeg, gdmHorizontal, beta, gamma, albedo);
            
            const daysInMonth = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
            let seasonalSum = 0;
            
            // Sumamos solo los meses correspondientes a la estación actual
            for (const monthIdx of monthsIndices) {
                seasonalSum += monthlyResults[monthIdx].G_tilted * daysInMonth[monthIdx];
            }

            if (seasonalSum > maxSeasonalRadiation) {
                maxSeasonalRadiation = seasonalSum;
                bestAngle = beta;
            }
        }
        
        seasonalOptimums[seasonName] = {
            optimalAngle: bestAngle,
            seasonalRadiation: maxSeasonalRadiation
        };
    }

    return seasonalOptimums;
}