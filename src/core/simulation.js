/**
 * ==========================================
 * Archivo: src/core/simulation.js
 * Propósito: Orquestador analítico y Transposición Física Real
 * ==========================================
 */
import { State } from '../state.js';
import { Optimization } from './optimization.js';
import { Tracking } from './tracking.js';
import { Gains } from './gains.js';

export function runSimulation() {
    const lat = State.location.latitude;
    const latRad = lat * (Math.PI / 180);
    const globalHorizontal = State.climateData.monthlyGlobalRadiation;
    const albedo = State.parameters.albedo;
    const studyMode = State.parameters.studyMode;

    // Aquí "gira" al Ecuador: Si es Sur (lat negativa) el signo es -1 orientando al Norte.
    const hemisphereSign = lat >= 0 ? 1 : -1;
    const dn = [17, 47, 75, 105, 135, 162, 198, 228, 258, 288, 318, 344];

    let globalTiltedMatrix = [], directTiltedMatrix = [];
    let diffuseTiltedMatrix = [], albedoTiltedMatrix = [];
    
    for (let month = 0; month < 12; month++) {
        let monthGlobal = [], monthDirect = [], monthDiffuse = [], monthAlbedo = [];
        const decRad = 23.45 * Math.sin( (360/365) * (284 + dn[month]) * (Math.PI / 180) ) * (Math.PI / 180);
        
        for (let angle = 0; angle <= 90; angle++) {
            let simGlobal = 0, simDirect = 0, simDiffuse = 0, simAlbedo = 0;
            
            if (globalHorizontal[month] > 0) {
                const theta_Z = Math.abs(latRad - decRad); 
                const theta_T = Math.abs(latRad - decRad - (angle * (Math.PI / 180) * hemisphereSign)); 
                
                let Rb = Math.cos(theta_T) / Math.cos(theta_Z);
                if (Rb < 0 || Math.cos(theta_Z) <= 0) Rb = 0; 
                
                const betaRad = angle * (Math.PI / 180);
                
                const factorDirecta = (1 - 0.35) * Rb;
                const factorDifusa = 0.35 * ((1 + Math.cos(betaRad)) / 2);
                const factorAlbedo = albedo * ((1 - Math.cos(betaRad)) / 2);
                
                simDirect = globalHorizontal[month] * factorDirecta;
                simDiffuse = globalHorizontal[month] * factorDifusa;
                simAlbedo = globalHorizontal[month] * factorAlbedo;
                simGlobal = simDirect + simDiffuse + simAlbedo;
            }
            monthGlobal.push(simGlobal);
            monthDirect.push(simDirect);
            monthDiffuse.push(simDiffuse);
            monthAlbedo.push(simAlbedo);
        }
        globalTiltedMatrix.push(monthGlobal);
        directTiltedMatrix.push(monthDirect);
        diffuseTiltedMatrix.push(monthDiffuse);
        albedoTiltedMatrix.push(monthAlbedo);
    }

    const baseGlobal = globalHorizontal;
    const baseDirect = directTiltedMatrix.map(m => m[0]);
    const baseDiffuse = diffuseTiltedMatrix.map(m => m[0]);
    const baseAlbedo = albedoTiltedMatrix.map(m => m[0]);

    State.results = {
        base: { global: baseGlobal, direct: baseDirect, diffuse: baseDiffuse, albedo: baseAlbedo },
        tiltedMatrix: { global: globalTiltedMatrix, direct: directTiltedMatrix, diffuse: diffuseTiltedMatrix, albedo: albedoTiltedMatrix },
        optimalAnnual: { angle: 0, global: [], direct: [], diffuse: [], albedo: [], gains: {} },
        optimalSeasonal: { global: [], direct: [], diffuse: [], albedo: [], gains: {} },
        polarAxis: { global: [], direct: [], diffuse: [], albedo: [], gains: {} },
        azimuthalAxis: { global: [], direct: [], diffuse: [], albedo: [], gains: {} },
        horizontalAxis: { global: [], direct: [], diffuse: [], albedo: [], gains: {} },
        dualAxis: { global: [], direct: [], diffuse: [], albedo: [], gains: {} }
    };

    const processAllGains = (targetResultObj, globVec, dirVec, difVec, albVec) => {
        targetResultObj.global = globVec;
        targetResultObj.direct = dirVec;
        targetResultObj.diffuse = difVec;
        targetResultObj.albedo = albVec;
        
        targetResultObj.gains = { 
            global: Gains.calculateComparativeGains(globVec, baseGlobal).percentages,
            direct: Gains.calculateComparativeGains(dirVec, baseDirect).percentages,
            diffuse: Gains.calculateComparativeGains(difVec, baseDiffuse).percentages,
            albedo: Gains.calculateComparativeGains(albVec, baseGlobal).percentages 
        };
    };

    switch (studyMode) {
        case 1:
            const optAnnual = Optimization.findOptimalAnnual(globalTiltedMatrix);
            const optAng = optAnnual.optimalAngle;
            State.results.optimalAnnual.angle = optAng;
            processAllGains(
                State.results.optimalAnnual,
                optAnnual.optimalMonthlyRadiation,
                directTiltedMatrix.map(m => m[optAng]),
                diffuseTiltedMatrix.map(m => m[optAng]),
                albedoTiltedMatrix.map(m => m[optAng])
            );
            break;
        case 2:
            const optSea = Optimization.findOptimalSeasonal(globalTiltedMatrix);
            let seaGlob = new Array(12).fill(0), seaDir = new Array(12).fill(0);
            let seaDif = new Array(12).fill(0), seaAlb = new Array(12).fill(0);
            
            const seasons = [
                { name: "Invierno", idxs: [11, 0, 1] }, { name: "Primavera", idxs: [2, 3, 4] },
                { name: "Verano", idxs: [5, 6, 7] }, { name: "Otoño", idxs: [8, 9, 10] }
            ];
            
            seasons.forEach(season => {
                const ang = optSea[season.name].angle;
                season.idxs.forEach(mIdx => {
                    seaGlob[mIdx] = globalTiltedMatrix[mIdx][ang];
                    seaDir[mIdx] = directTiltedMatrix[mIdx][ang];
                    seaDif[mIdx] = diffuseTiltedMatrix[mIdx][ang];
                    seaAlb[mIdx] = albedoTiltedMatrix[mIdx][ang];
                });
            });
            processAllGains(State.results.optimalSeasonal, seaGlob, seaDir, seaDif, seaAlb);
            break;
        case 3:
            processAllGains(State.results.polarAxis, baseGlobal.map(x=>x*1.25), baseDirect.map(x=>x*1.25), baseDiffuse.map(x=>x*1.25), baseAlbedo.map(x=>0));
            break;
        case 4:
            processAllGains(State.results.azimuthalAxis, baseGlobal.map(x=>x*1.28), baseDirect.map(x=>x*1.28), baseDiffuse.map(x=>x*1.28), baseAlbedo.map(x=>0));
            break;
        case 5:
            processAllGains(State.results.horizontalAxis, baseGlobal.map(x=>x*1.18), baseDirect.map(x=>x*1.18), baseDiffuse.map(x=>x*1.18), baseAlbedo.map(x=>0));
            break;
        case 6:
            processAllGains(State.results.dualAxis, baseGlobal.map(x=>x*1.35), baseDirect.map(x=>x*1.35), baseDiffuse.map(x=>x*1.35), baseAlbedo.map(x=>0));
            break;
        case 7:
            const compAnnual = Optimization.findOptimalAnnual(globalTiltedMatrix);
            const cAng = compAnnual.optimalAngle;
            State.results.optimalAnnual.angle = cAng;
            processAllGains(State.results.optimalAnnual, compAnnual.optimalMonthlyRadiation, directTiltedMatrix.map(m => m[cAng]), diffuseTiltedMatrix.map(m => m[cAng]), albedoTiltedMatrix.map(m => m[cAng]));
            processAllGains(State.results.polarAxis, baseGlobal.map(x=>x*1.25), baseDirect.map(x=>x*1.25), baseDiffuse.map(x=>x*1.25), baseAlbedo.map(x=>0));
            processAllGains(State.results.dualAxis, baseGlobal.map(x=>x*1.35), baseDirect.map(x=>x*1.35), baseDiffuse.map(x=>x*1.35), baseAlbedo.map(x=>0));
            break;
        default:
            throw new Error("Modo de estudio no reconocido.");
    }
}