// ==========================================
// Archivo: src/state.js
// Propósito: Gestor centralizado del estado (Sustituye el uso de variables "global" de MATLAB)
// ==========================================

export const State = {
    // 1. Parámetros de Entrada del Usuario
    location: {
        name: "Ubicación Desconocida",
        latitude: null,
        longitude: null
    },
    parameters: {
        albedo: 0.20,
        tonc: 47,
        studyMode: 1 // 1: Anual, 2: Estacional, 3: Polar, 4: Azimutal, 5: Horizontal, 6: 2 Ejes, 7: Comparativa
    },

    // 2. Datos Meteorológicos Base (Extraídos vía API o CSV Local)
    climateData: {
        monthlyGlobalRadiation: new Array(12).fill(0), // Sustituye a DATOS(3) a DATOS(14)
        monthlyTemperature: new Array(12).fill(20)     // Sustituye a DATOS(15) a DATOS(26)
    },

    // 3. Resultados de la Simulación Matemática
    results: {
        base: { // Plano horizontal (0º)
            global: [], direct: [], diffuse: [], albedo: []
        },
        tiltedMatrix: { 
            global: [], direct: [], diffuse: [], albedo: [] 
        }, // <--- NUEVO: Matriz completa de 0º a 90º
        optimalAnnual: {
            angle: 0,
            global: [], direct: [], diffuse: [], albedo: [],
            gains: { global: [], direct: [], diffuse: [], albedo: [] }
        },
        // (Se añaden estructuras similares para seasonal, polar, azimuthal, horizontal, dualAxis)
    },

    // 4. Estado de la Interfaz
    ui: {
        activeComponent: 'global' // Opciones: 'global', 'direct', 'diffuse', 'albedo'
    },

    // Método para limpiar resultados previos antes de una nueva simulación
    resetResults() {
        this.results = { 
            base: {}, 
            optimalAnnual: {}, 
            optimalSeasonal: {},
            polarAxis: {},
            azimuthalAxis: {},
            horizontalAxis: {},
            dualAxis: {}
        };
    }
};