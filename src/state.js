// Objeto que almacena el estado reactivo de la aplicación
export const State = {
    latitude: null,
    longitude: null,
    monthlyGlobalRadiation: [], // Equivale a Gdm(0º)
    temperatureData: [],
    albedo: 0.2, // Valor por defecto
    selectedStudy: 'annual_optimum', 
    results: {}
};