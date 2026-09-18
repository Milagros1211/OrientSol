/**
 * ==========================================
 * Archivo: src/core/simulation.js
 * Propósito: Orquestador del flujo analítico fotovoltaico (Sustituye a CoeficienteCalculos.m)
 * ==========================================
 */
import { State } from '../state.js';
import { Geometry } from './geometry.js';
import { Radiation } from './radiation.js';
import { Tracking } from './tracking.js';
import { Optimization } from './optimization.js';
import { Energy } from './energy.js';
import { Gains } from './gains.js';

export function runSimulation() {
    // 1. Extraer variables de entrada del Estado Global
    const latRad = State.location.latitude * (Math.PI / 180);
    const albedo = State.parameters.albedo;
    const globalHorizontal = State.climateData.monthlyGlobalRadiation;
    const temperatures = State.climateData.monthlyTemperature;
    const studyMode = State.parameters.studyMode;

    // 2. Cinemática Solar y Astronomía
    const declinations = Geometry.getDeclinations();
    const sunsetAngles = Geometry.getSunsetHourAngles(latRad, declinations);
    const hourAnglesMatrix = Geometry.getHourAnglesMatrix(sunsetAngles);
    const solarAltitude = Geometry.getSolarAltitude(latRad, declinations, hourAnglesMatrix);
    const solarAzimuth = Geometry.getSolarAzimuth(solarAltitude, latRad, declinations, hourAnglesMatrix);

    // 3. Fraccionamiento y Transposición de la Radiación Base
    // (Simplificación de la abstracción: En un caso real se requerirían los índices de claridad Kt)
    const diffuseFraction = Radiation.calculateDiffuseHourlyFraction(hourAnglesMatrix, sunsetAngles);
    
    // Generación de matrices maestras de barrido (0º a 90º)
    let globalTiltedMatrix = []; // [mes][ángulo]
    // Rellenado de la matriz mediante iteración de tilt (β) para la radiación directa, difusa y albedo...
    
    // 4. Ejecución Condicional según el Tipo de Estudio (OPCION_EST de MATLAB)
    State.resetResults();
    
    // Guardar siempre el caso base (0º - Plano Horizontal)
    State.results.base.global = globalHorizontal;
    // Cálculos de Directa, Difusa y Albedo a 0º irían aquí...

    switch (studyMode) {
        case 1: // Inclinación Óptima Anual
            const optAnnual = Optimization.findOptimalAnnual(globalTiltedMatrix);
            State.results.optimalAnnual.global = optAnnual.optimalMonthlyRadiation;
            State.results.optimalAnnual.angle = optAnnual.optimalAngle;
            
            // Modelo de Osterwald para Energía
            const energyOut = Energy.applyOsterwaldModel(
                State.results.optimalAnnual.global, 
                temperatures, 
                1, // kWp por defecto
                State.parameters.tonc
            );
            State.results.optimalAnnual.energy = energyOut.monthlyEnergy;

            // Cálculo de Ganancias Relativas frente al plano horizontal
            const gains = Gains.calculateComparativeGains(
                State.results.optimalAnnual.global, 
                State.results.base.global
            );
            State.results.optimalAnnual.gains.global = gains.percentages;
            break;

        case 3: // Seguimiento Eje Polar
            // Lógica de tracking.js y posterior evaluación de ganancias
            break;

        // Implementación del resto de casos (Estacional, Azimutal, Horizontal, 2 Ejes)...
    }

    // El flujo termina aquí de forma síncrona. La UI recogerá los datos de State.results.
}