/**
 * MOTOR DE CÁLCULO DE RADIACIÓN SOLAR - OrientSol 3.0 Web
 * Sustituye a: Gh0.m, Dh0.m, Bh0.m, Bdm0.m, BdBeta.m, DdBeta.m, GdBeta.m y RhBeta.m
 */

const ISC = 1.367; // Constante solar en kW/m2

// Funciones auxiliares de conversión
const deg2rad = (degrees) => degrees * (Math.PI / 180);
const rad2deg = (radians) => radians * (180 / Math.PI);

/**
 * 1. Calcula la declinación solar para el día característico del mes (N)
 */
export function calculateDeclination(n) {
    const angle = (360 / 365) * (n + 284);
    return deg2rad(23.45 * Math.sin(deg2rad(angle)));
}

/**
 * 2. Calcula el ángulo horario de la puesta de sol (ws)
 */
export function calculateSunsetHourAngle(latRad, deltaRad) {
    const val = -Math.tan(latRad) * Math.tan(deltaRad);
    if (val >= 1) return 0;         // Noche polar
    if (val <= -1) return Math.PI;  // Sol de medianoche
    return Math.acos(val);
}

/**
 * 3. Calcula la radiación extraterrestre diaria sobre superficie horizontal (H0)
 */
export function calculateExtraterrestrialRadiation(latRad, n, deltaRad, wsRad) {
    const factor = 1 + 0.033 * Math.cos(deg2rad((360 * n) / 365));
    const term1 = Math.cos(latRad) * Math.cos(deltaRad) * Math.sin(wsRad);
    const term2 = wsRad * Math.sin(latRad) * Math.sin(deltaRad);
    
    // (24 / PI) * ISC convierte la irradiancia a energía diaria (kWh/m2/día)
    return (24 / Math.PI) * ISC * factor * (term1 + term2);
}

/**
 * 4. Calcula la fracción difusa (Kd) según el Modelo de Erbs et al.
 */
export function calculateDiffuseFraction(Kt, wsRad) {
    let Kd = 1.0;
    if (wsRad < 1.4208) { // ws < 81.4 grados
        if (Kt <= 0.715) {
            Kd = 1.0 - 0.2727*Kt + 2.4495*Math.pow(Kt, 2) - 11.9514*Math.pow(Kt, 3) + 9.3879*Math.pow(Kt, 4);
        } else {
            Kd = 0.143;
        }
    } else { // ws >= 81.4 grados
        if (Kt <= 0.722) {
            Kd = 1.0 - 0.2832*Kt + 2.5557*Math.pow(Kt, 2) - 0.8448*Math.pow(Kt, 3);
        } else {
            Kd = 0.175;
        }
    }
    return Math.max(0, Math.min(1, Kd)); // Aseguramos que se mantenga entre 0 y 1
}

/**
 * 5. FUNCIÓN PRINCIPAL: Calcula todas las componentes para un plano inclinado
 * @param {number} latDeg Latitud en grados
 * @param {number[]} gdmHorizontal Array de 12 valores de radiación global horizontal mensual
 * @param {number} betaDeg Inclinación del panel en grados
 * @param {number} gammaDeg Azimut del panel en grados (0 = Sur, -90 = Este, 90 = Oeste)
 * @param {number} albedo Coeficiente de reflectividad del suelo (Por defecto 0.2)
 */
export function calculateTiltedRadiation(latDeg, gdmHorizontal, betaDeg, gammaDeg = 0, albedo = 0.2) {
    const lat = deg2rad(latDeg);
    const beta = deg2rad(betaDeg);
    const gamma = deg2rad(gammaDeg);
    
    // Días intermedios de Klein (representativos de cada mes)
    const n_days = [17, 47, 75, 105, 135, 162, 198, 228, 258, 288, 318, 344];
    
    let results = [];
    
    for (let month = 0; month < 12; month++) {
        const Hh = gdmHorizontal[month]; // Radiación global horizontal diaria
        const n = n_days[month];
        
        const delta = calculateDeclination(n);
        const ws = calculateSunsetHourAngle(lat, delta);
        const H0 = calculateExtraterrestrialRadiation(lat, n, delta, ws);
        
        const Kt = Hh / H0; // Índice de claridad
        const Kd = calculateDiffuseFraction(Kt, ws); // Fracción difusa
        
        const Dh = Hh * Kd; // Difusa horizontal
        const Bh = Hh - Dh; // Directa horizontal
        
        // === INTEGRACIÓN HORARIA ===
        // Dividimos el día en pasos de 1 grado (~4 minutos) para máxima precisión
        const d_omega = deg2rad(1); 
        const dt_hours = 1 / 15; // 1 grado equivale a 1/15 de hora
        
        let G_tilted = 0, B_tilted = 0, D_tilted = 0, R_tilted = 0;
        
        // Coeficientes a y b para el modelo de Collares-Pereira & Rabl
        const a = 0.409 + 0.5016 * Math.sin(ws - deg2rad(60));
        const b = 0.6609 - 0.4767 * Math.sin(ws - deg2rad(60));
        const denom = Math.sin(ws) - ws * Math.cos(ws);
        
        // Bucle desde el amanecer (-ws) hasta el atardecer (ws)
        for (let w = -ws + d_omega/2; w < ws; w += d_omega) {
            
            // Factor de distribución horaria (Liu & Jordan)
            const num = Math.cos(w) - Math.cos(ws);
            const rd = (Math.PI / 24) * (num / denom);
            const rg = (Math.PI / 24) * (a + b * Math.cos(w)) * (num / denom);
            
            // Componentes en esa fracción de hora sobre plano horizontal
            const d_Dh = Dh * rd * dt_hours;
            const d_Gh = Hh * rg * dt_hours;
            const d_Bh = Math.max(0, d_Gh - d_Dh);
            
            // Ángulo cenital (theta_z) y de incidencia (theta)
            const cos_theta_z = Math.sin(lat)*Math.sin(delta) + Math.cos(lat)*Math.cos(delta)*Math.cos(w);
            
            const cos_theta = Math.sin(delta)*Math.sin(lat)*Math.cos(beta) 
                            - Math.sin(delta)*Math.cos(lat)*Math.sin(beta)*Math.cos(gamma)
                            + Math.cos(delta)*Math.cos(lat)*Math.cos(beta)*Math.cos(w)
                            + Math.cos(delta)*Math.sin(lat)*Math.sin(beta)*Math.cos(gamma)*Math.cos(w)
                            + Math.cos(delta)*Math.sin(beta)*Math.sin(gamma)*Math.sin(w);
            
            // Factor geométrico Rb (Con filtro para evitar divisiones por cero o soles bajo el horizonte)
            let Rb = 0;
            if (cos_theta_z > 0.01 && cos_theta > 0) {
                Rb = cos_theta / cos_theta_z;
            }
            
            // Trasposición al plano inclinado (Modelo Isotrópico)
            const d_B_tilted = d_Bh * Rb;
            const d_D_tilted = d_Dh * ((1 + Math.cos(beta)) / 2);
            const d_R_tilted = d_Gh * albedo * ((1 - Math.cos(beta)) / 2);
            
            B_tilted += d_B_tilted;
            D_tilted += d_D_tilted;
            R_tilted += d_R_tilted;
            G_tilted += (d_B_tilted + d_D_tilted + d_R_tilted);
        }
        
        results.push({
            month: month + 1,
            Hh_global: Hh,         // Global Horizontal
            Bh_horiz: Bh,          // Directa Horizontal
            Dh_horiz: Dh,          // Difusa Horizontal
            G_tilted: G_tilted,    // Global Inclinada (Resultado final)
            B_tilted: B_tilted,    // Directa Inclinada
            D_tilted: D_tilted,    // Difusa Inclinada
            R_tilted: R_tilted     // Albedo Inclinada
        });
    }
    
    return results;
}