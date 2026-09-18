/**
 * Calcula la declinación solar mensual.
 * Sustituye a: matriz_declinacion.m
 * @param {number} latitude - Latitud en grados
 * @returns {Array} Array con las declinaciones calculadas
 */
export function calculateSolarGeometry(latitude) {
    // Días característicos de Klein para cada mes (15 de cada mes aprox)
    const n_days = [17, 47, 75, 105, 135, 162, 198, 228, 258, 288, 318, 344];
    
    let declinationArray = [];

    // Bucle equivalente al de MATLAB
    for (let i = 0; i < 12; i++) {
        let n = n_days[i];
        // Ecuación de Cooper para la declinación (en radianes)
        let delta = 23.45 * Math.sin((360 / 365) * (n + 284) * (Math.PI / 180));
        declinationArray.push(delta);
    }

    return {
        declinations: declinationArray,
        // Aquí añadiremos el azimut y altura solar en el futuro
    };
}