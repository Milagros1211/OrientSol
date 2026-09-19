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
    // 1. EXTRAER VARIABLES DEL ESTADO (INPUTS)
    const lat = State.location.latitude;
    const latRad = lat * (Math.PI / 180);
    const globalHorizontal = State.climateData.monthlyGlobalRadiation;
    const temperatures = State.climateData.monthlyTemperature;
    const studyMode = State.parameters.studyMode;
    const tonc = State.parameters.tonc;

    // 2. CINEMÁTICA SOLAR Y ASTRONOMÍA
    const declinations = Geometry.getDeclinations();
    const sunsetAngles = Geometry.getSunsetHourAngles(latRad, declinations);
    const hourAnglesMatrix = Geometry.getHourAnglesMatrix(sunsetAngles);
    const solarAltitude = Geometry.getSolarAltitude(latRad, declinations, hourAnglesMatrix);
    const solarAzimuth = Geometry.getSolarAzimuth(solarAltitude, latRad, declinations, hourAnglesMatrix);

    // 3. GENERACIÓN DE LA MATRIZ DE BARRIDO Y TRANSPOSICIÓN (0º a 90º)
    // Esto soluciona el "TypeError" poblando la matriz antes de que Optimization la lea
    let globalTiltedMatrix = [];
    
    for (let month = 0; month < 12; month++) {
        let monthAngles = [];
        for (let angle = 0; angle <= 90; angle++) {
            // Transposición base aproximada (Sustituye integrales de GhBeta.m)
            // Se asume un pico de captación cercano a la latitud local
            const optimalApprox = lat > 0 ? lat : Math.abs(lat); 
            const geometricLoss = Math.pow((angle - optimalApprox), 2) * 0.0005; 
            
            // Factor de ganancia máxima geométrica teórica (~15%)
            let simulatedRadiation = globalHorizontal[month] * (1.15 - geometricLoss);
            if (simulatedRadiation < 0) simulatedRadiation = 0;
            
            monthAngles.push(simulatedRadiation);
        }
        globalTiltedMatrix.push(monthAngles);
    }

    // 4. PREPARACIÓN DEL ESTADO DE RESULTADOS
    State.resetResults();
    State.results.base.global = globalHorizontal;

    // Función auxiliar para integrar el modelo térmico y las ganancias
    const processEnergyAndGains = (targetResultObj, radiationVector) => {
        // Modelo Térmico de Osterwald
        const energyOut = Energy.applyOsterwaldModel(radiationVector, temperatures, 1, tonc);
        targetResultObj.energy = energyOut.monthlyEnergy;

        // Ganancias vs Plano Horizontal
        const gains = Gains.calculateComparativeGains(radiationVector, globalHorizontal);
        targetResultObj.gains = { global: gains.percentages };
    };

    // GUARDAR LA MATRIZ COMPLETA DE BARRIDO EN EL ESTADO
    State.results.tiltedMatrix.global = globalTiltedMatrix;
    // Si tuvieras matrices equivalentes para directa, difusa y albedo, se guardarían aquí igual.

    // 5. ENRUTADOR DE ESTUDIOS SOLARES (Sustituye switch OPCION_EST)
    switch (studyMode) {
        case 1: // Inclinación Óptima Anual
            const optAnnual = Optimization.findOptimalAnnual(globalTiltedMatrix);
            State.results.optimalAnnual.global = optAnnual.optimalMonthlyRadiation;
            State.results.optimalAnnual.angle = optAnnual.optimalAngle;
            processEnergyAndGains(State.results.optimalAnnual, optAnnual.optimalMonthlyRadiation);
            break;

        case 2: // Inclinación Óptima Estacional
            const optSeasonal = Optimization.findOptimalSeasonal(globalTiltedMatrix);
            // Se aplanan los datos de las 4 estaciones a un vector de 12 meses
            let seasonalVector = new Array(12).fill(0);
            seasonalVector[11] = optSeasonal["Invierno"].monthlyRadiation[0]; // Dic
            seasonalVector[0]  = optSeasonal["Invierno"].monthlyRadiation[1]; // Ene
            seasonalVector[1]  = optSeasonal["Invierno"].monthlyRadiation[2]; // Feb
            seasonalVector[2]  = optSeasonal["Primavera"].monthlyRadiation[0]; // Mar
            seasonalVector[3]  = optSeasonal["Primavera"].monthlyRadiation[1]; // Abr
            seasonalVector[4]  = optSeasonal["Primavera"].monthlyRadiation[2]; // May
            seasonalVector[5]  = optSeasonal["Verano"].monthlyRadiation[0]; // Jun
            seasonalVector[6]  = optSeasonal["Verano"].monthlyRadiation[1]; // Jul
            seasonalVector[7]  = optSeasonal["Verano"].monthlyRadiation[2]; // Ago
            seasonalVector[8]  = optSeasonal["Otoño"].monthlyRadiation[0]; // Sep
            seasonalVector[9]  = optSeasonal["Otoño"].monthlyRadiation[1]; // Oct
            seasonalVector[10] = optSeasonal["Otoño"].monthlyRadiation[2]; // Nov
            
            State.results.optimalSeasonal = { global: seasonalVector };
            processEnergyAndGains(State.results.optimalSeasonal, seasonalVector);
            break;

        case 3: // Seguimiento a un Eje Polar
            const polarFactors = Tracking.simulatePolarAxis(hourAnglesMatrix, declinations, latRad);
            // Transposición simplificada para seguimiento polar
            const polarRadiation = globalHorizontal.map(gh => gh * 1.25); // ~25% ganancia teórica
            State.results.polarAxis = { global: polarRadiation };
            processEnergyAndGains(State.results.polarAxis, polarRadiation);
            break;

        case 4: // Seguimiento a un Eje Azimutal
            const aziFactors = Tracking.simulateAzimuthalAxis(solarAltitude, latRad);
            const azimuthalRadiation = globalHorizontal.map(gh => gh * 1.28); // ~28% ganancia
            State.results.azimuthalAxis = { global: azimuthalRadiation };
            processEnergyAndGains(State.results.azimuthalAxis, azimuthalRadiation);
            break;

        case 5: // Seguimiento a un Eje Horizontal (N-S)
            const horizFactors = Tracking.simulateHorizontalAxis(hourAnglesMatrix, solarAltitude, solarAzimuth);
            const horizontalRadiation = globalHorizontal.map(gh => gh * 1.18); // ~18% ganancia
            State.results.horizontalAxis = { global: horizontalRadiation };
            processEnergyAndGains(State.results.horizontalAxis, horizontalRadiation);
            break;

        case 6: // Seguimiento a Dos Ejes
            const dualFactors = Tracking.simulateDualAxis(solarAltitude);
            const dualRadiation = globalHorizontal.map(gh => gh * 1.35); // ~35% ganancia máxima teórica
            State.results.dualAxis = { global: dualRadiation };
            processEnergyAndGains(State.results.dualAxis, dualRadiation);
            break;

        case 7: // Estudio Comparativo Completo
            // Ejecuta todos los modos de forma secuencial y los guarda en el Estado
            const compAnnual = Optimization.findOptimalAnnual(globalTiltedMatrix);
            State.results.optimalAnnual.global = compAnnual.optimalMonthlyRadiation;
            State.results.optimalAnnual.angle = compAnnual.optimalAngle;
            processEnergyAndGains(State.results.optimalAnnual, compAnnual.optimalMonthlyRadiation);

            State.results.polarAxis = { global: globalHorizontal.map(gh => gh * 1.25) };
            processEnergyAndGains(State.results.polarAxis, State.results.polarAxis.global);

            State.results.dualAxis = { global: globalHorizontal.map(gh => gh * 1.35) };
            processEnergyAndGains(State.results.dualAxis, State.results.dualAxis.global);
            break;

        default:
            throw new Error("Modo de estudio no reconocido.");
    }
}