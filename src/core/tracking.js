/**
 * MOTOR DE SEGUIMIENTO SOLAR (TRACKING) - OrientSol 3.0 Web
 * Sustituye a: Bd_2Ejes.m, Rh_EjePolar.m, Dd_EjeAzimutal.m y homólogos.
 */

import { 
    calculateDeclination, 
    calculateSunsetHourAngle, 
    calculateExtraterrestrialRadiation, 
    calculateDiffuseFraction 
} from './radiation.js';

const ISC = 1.367; // Constante solar en kW/m2
const deg2rad = (degrees) => degrees * (Math.PI / 180);
const rad2deg = (radians) => radians * (180 / Math.PI);

/**
 * FUNCIÓN UNIFICADA DE SEGUIMIENTO SOLAR
 * @param {number} latDeg - Latitud en grados
 * @param {number[]} gdmHorizontal - Array de 12 valores de radiación global horizontal mensual
 * @param {string} trackingMode - 'two-axis', 'polar', 'azimuthal', 'horizontal'
 * @param {number} albedo - Coeficiente de reflectividad (Por defecto 0.2)
 * @param {number} fixedTilt - Inclinación fija para el eje azimutal (si es null, usa la latitud)
 */
export function calculateTrackingRadiation(latDeg, gdmHorizontal, trackingMode, albedo = 0.2, fixedTilt = null) {
    const lat = deg2rad(latDeg);
    const n_days = [17, 47, 75, 105, 135, 162, 198, 228, 258, 288, 318, 344];
    
    let results = [];
    
    for (let month = 0; month < 12; month++) {
        const Hh = gdmHorizontal[month]; 
        const n = n_days[month];
        
        const delta = calculateDeclination(n);
        const ws = calculateSunsetHourAngle(lat, delta);
        const H0 = calculateExtraterrestrialRadiation(lat, n, delta, ws);
        
        const Kt = Hh / H0; 
        const Kd = calculateDiffuseFraction(Kt, ws); 
        
        const Dh = Hh * Kd; 
        const Bh = Hh - Dh; 
        
        // Integración horaria (Pasos de 1 grado = 4 minutos)
        const d_omega = deg2rad(1); 
        const dt_hours = 1 / 15; 
        
        let G_track = 0, B_track = 0, D_track = 0, R_track = 0;
        
        const a = 0.409 + 0.5016 * Math.sin(ws - deg2rad(60));
        const b = 0.6609 - 0.4767 * Math.sin(ws - deg2rad(60));
        const denom = Math.sin(ws) - ws * Math.cos(ws);
        
        for (let w = -ws + d_omega/2; w < ws; w += d_omega) {
            // Distribución horaria
            const num = Math.cos(w) - Math.cos(ws);
            const rd = (Math.PI / 24) * (num / denom);
            const rg = (Math.PI / 24) * (a + b * Math.cos(w)) * (num / denom);
            
            const d_Dh = Dh * rd * dt_hours;
            const d_Gh = Hh * rg * dt_hours;
            const d_Bh = Math.max(0, d_Gh - d_Dh);
            
            // 1. Calcular posición astronómica del Sol (Zenit y Azimut solar)
            const cos_theta_z = Math.sin(lat)*Math.sin(delta) + Math.cos(lat)*Math.cos(delta)*Math.cos(w);
            const theta_z = Math.acos(cos_theta_z);
            
            // Azimut solar (gamma_s)
            let cos_gamma_s = (Math.cos(theta_z)*Math.sin(lat) - Math.sin(delta)) / (Math.sin(theta_z)*Math.cos(lat));
            cos_gamma_s = Math.max(-1, Math.min(1, cos_gamma_s)); // Filtro de seguridad
            const gamma_s = (w > 0) ? Math.acos(cos_gamma_s) : -Math.acos(cos_gamma_s);

            // 2. Cinemática del Seguidor (Panel tilt 'beta' e incidencia 'cos_theta')
            let beta = 0;
            let cos_theta = 0;

            switch (trackingMode) {
                case 'two-axis':
                    // Dos ejes: El panel mira directamente al sol.
                    beta = theta_z;
                    cos_theta = 1.0; 
                    break;
                    
                case 'azimuthal':
                    // Eje vertical: Inclinación fija, azimut sigue al sol.
                    beta = fixedTilt !== null ? deg2rad(fixedTilt) : Math.abs(lat);
                    cos_theta = Math.cos(theta_z)*Math.cos(beta) + Math.sin(theta_z)*Math.sin(beta);
                    break;
                    
                case 'polar':
                    // Eje polar: Inclinado a la latitud, sigue el ángulo horario.
                    beta = Math.acos(Math.cos(lat)*Math.cos(delta)*Math.cos(w) + Math.sin(lat)*Math.sin(delta));
                    cos_theta = Math.cos(delta);
                    break;

                case 'horizontal':
                    // Eje horizontal N-S: Seguimiento E-O.
                    beta = Math.atan(Math.tan(theta_z) * Math.abs(Math.cos(gamma_s)));
                    cos_theta = Math.sqrt(1 - Math.pow(Math.sin(theta_z)*Math.sin(gamma_s), 2));
                    break;
            }

            // 3. Control de indeterminaciones (sol bajo el horizonte o panel detrás del sol)
            let Rb = 0;
            if (cos_theta_z > 0.01 && cos_theta > 0) {
                Rb = cos_theta / cos_theta_z;
            }
            
            // 4. Transposición Isotrópica
            const d_B_track = d_Bh * Rb;
            const d_D_track = d_Dh * ((1 + Math.cos(beta)) / 2);
            const d_R_track = d_Gh * albedo * ((1 - Math.cos(beta)) / 2);
            
            B_track += d_B_track;
            D_track += d_D_track;
            R_track += d_R_track;
            G_track += (d_B_track + d_D_track + d_R_track);
        }
        
        results.push({
            month: month + 1,
            Hh_global: Hh,         
            G_tilted: G_track,    
            B_tilted: B_track,    
            D_tilted: D_track,    
            R_tilted: R_track     
        });
    }
    
    return results;
}