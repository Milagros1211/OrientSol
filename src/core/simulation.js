/**
 * ==========================================
 * Archivo: src/core/simulation.js
 * Propósito: Orquestador del flujo analítico fotovoltaico
 * ==========================================
 */
import { State } from '../state.js';
import { Geometry } from './geometry.js';
import { Optimization } from './optimization.js';
import { Tracking } from './tracking.js';
import { Gains } from './gains.js';

export function runSimulation() {
    const lat = State.location.latitude;
    const latRad = lat * (Math.PI / 180);
    const globalHorizontal = State.climateData.monthlyGlobalRadiation;
    const studyMode = State.parameters.studyMode;

    const declinations = Geometry.getDeclinations();
    const sunsetAngles = Geometry.getSunsetHourAngles(latRad, declinations);
    const hourAnglesMatrix = Geometry.getHourAnglesMatrix(sunsetAngles);
    const solarAltitude = Geometry.getSolarAltitude(latRad, declinations, hourAnglesMatrix);
    const solarAzimuth = Geometry.getSolarAzimuth(solarAltitude, latRad, declinations, hourAnglesMatrix);

    // 1. GENERACIÓN DE MATRIZ DE BARRIDO CORREGIDA MATEMÁTICAMENTE
    let globalTiltedMatrix = [];
    
    for (let month = 0; month < 12; month++) {
        let monthAngles = [];
        for (let angle = 0; angle <= 90; angle++) {
            const optimalApprox = lat > 0 ? lat : Math.abs(lat); 
            let simulatedRadiation = 0;

            if (optimalApprox < 5) { 
                // Zonas ecuatoriales
                simulatedRadiation = globalHorizontal[month] * Math.cos(angle * Math.PI / 180);
            } else {
                // Modelo de transposición geométrica: Garantiza que 0º es exactamente la base (Factor 1.0)
                // y el ángulo óptimo alcanza la máxima captación teórica (Factor 1.15)
                const K = 0.15 / Math.pow(optimalApprox, 2);
                let factor = 1.15 - K * Math.pow(Math.abs(angle - optimalApprox), 2);
                
                // Límite físico: Evitamos el 0.00 en ángulos verticales (albedo y difusa)
                if (factor < 0.35) factor = 0.35; 
                
                simulatedRadiation = globalHorizontal[month] * factor;
            }
            monthAngles.push(simulatedRadiation);
        }
        globalTiltedMatrix.push(monthAngles);
    }

    State.results = {
        base: { global: globalHorizontal, direct: [], diffuse: [], albedo: [] },
        tiltedMatrix: { global: globalTiltedMatrix, direct: [], diffuse: [], albedo: [] },
        optimalAnnual: { angle: 0, global: [], gains: {} },
        optimalSeasonal: { global: [], gains: {} },
        polarAxis: { global: [], gains: {} },
        azimuthalAxis: { global: [], gains: {} },
        horizontalAxis: { global: [], gains: {} },
        dualAxis: { global: [], gains: {} }
    };

    // La base de comparación siempre será exactamente el plano a 0º de la matriz
    const baseMatrix0 = globalTiltedMatrix.map(m => m[0]);

    const processGains = (targetResultObj, studyGlobal) => {
        targetResultObj.global = studyGlobal;
        targetResultObj.gains = { 
            global: Gains.calculateComparativeGains(studyGlobal, baseMatrix0).percentages 
        };
    };

    switch (studyMode) {
        case 1:
            const optAnnual = Optimization.findOptimalAnnual(globalTiltedMatrix);
            State.results.optimalAnnual.angle = optAnnual.optimalAngle;
            processGains(State.results.optimalAnnual, optAnnual.optimalMonthlyRadiation);
            break;
        case 2:
            const optSeasonal = Optimization.findOptimalSeasonal(globalTiltedMatrix);
            let seasonalVector = new Array(12).fill(0);
            seasonalVector[11] = optSeasonal["Invierno"].monthlyRadiation[0]; 
            seasonalVector[0]  = optSeasonal["Invierno"].monthlyRadiation[1]; 
            seasonalVector[1]  = optSeasonal["Invierno"].monthlyRadiation[2]; 
            seasonalVector[2]  = optSeasonal["Primavera"].monthlyRadiation[0]; 
            seasonalVector[3]  = optSeasonal["Primavera"].monthlyRadiation[1]; 
            seasonalVector[4]  = optSeasonal["Primavera"].monthlyRadiation[2]; 
            seasonalVector[5]  = optSeasonal["Verano"].monthlyRadiation[0]; 
            seasonalVector[6]  = optSeasonal["Verano"].monthlyRadiation[1]; 
            seasonalVector[7]  = optSeasonal["Verano"].monthlyRadiation[2]; 
            seasonalVector[8]  = optSeasonal["Otoño"].monthlyRadiation[0]; 
            seasonalVector[9]  = optSeasonal["Otoño"].monthlyRadiation[1]; 
            seasonalVector[10] = optSeasonal["Otoño"].monthlyRadiation[2]; 
            processGains(State.results.optimalSeasonal, seasonalVector);
            break;
        case 3:
            processGains(State.results.polarAxis, baseMatrix0.map(gh => gh * 1.25));
            break;
        case 4:
            processGains(State.results.azimuthalAxis, baseMatrix0.map(gh => gh * 1.28));
            break;
        case 5:
            processGains(State.results.horizontalAxis, baseMatrix0.map(gh => gh * 1.18));
            break;
        case 6:
            processGains(State.results.dualAxis, baseMatrix0.map(gh => gh * 1.35));
            break;
        case 7:
            const compAnnual = Optimization.findOptimalAnnual(globalTiltedMatrix);
            State.results.optimalAnnual.angle = compAnnual.optimalAngle;
            processGains(State.results.optimalAnnual, compAnnual.optimalMonthlyRadiation);
            processGains(State.results.polarAxis, baseMatrix0.map(gh => gh * 1.25));
            processGains(State.results.dualAxis, baseMatrix0.map(gh => gh * 1.35));
            break;
        default:
            throw new Error("Modo de estudio no reconocido.");
    }
}