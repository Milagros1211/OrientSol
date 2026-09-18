// ==========================================
// Archivo: src/app.js
// Propósito: Controlador principal. Conecta eventos de la UI con el Motor Matemático.
// ==========================================
import { State } from './state.js';
import { syncInputsToState, renderResultsTable, showAlert } from './ui.js';
// Módulos importados conceptualmente para la arquitectura:
import { loadDefaultDatabase, fetchWeatherDataAPI, handleCSVUpload } from './data.js';
import { runSimulation } from './core/simulation.js';
import { updateCharts } from './charts.js';
import { exportToCSV, generatePDF } from './export.js';

document.addEventListener('DOMContentLoaded', async () => {
    
    // 1. Inicialización: Carga silenciosa de la base de datos offline (datos_mundo.csv)
    await loadDefaultDatabase();

    // 2. Evento: Conexión Híbrida (API Online)
    document.getElementById('btnFetchAPI').addEventListener('click', async () => {
        syncInputsToState();
        if (isNaN(State.location.latitude) || isNaN(State.location.longitude)) {
            return showAlert("Por favor, introduzca valores numéricos válidos para Latitud y Longitud.", true);
        }
        await fetchWeatherDataAPI(State.location.latitude, State.location.longitude);
        showAlert("Datos climatológicos obtenidos exitosamente desde PVGIS.");
    });

    // 3. Evento: Archivo CSV Manual (Modo Offline Backup)
    document.getElementById('csvUpload').addEventListener('change', (event) => {
        handleCSVUpload(event);
    });

    // 4. Evento Maestro: Ejecución del Motor Matemático
    document.getElementById('btnCalculate').addEventListener('click', () => {
        syncInputsToState();
        
        // Validación de seguridad (antes provocaba cuelgues en MATLAB)
        if (State.climateData.monthlyGlobalRadiation.reduce((a,b) => a+b, 0) === 0) {
            return showAlert("No hay datos de radiación en memoria. Conecte con la API o suba un archivo CSV primero.", true);
        }

        try {
            // Inyección al orquestador matemático
            runSimulation();
            
            // Actualización del DOM y Gráficos (Sin abrir ventanas secundarias)
            renderResultsTable();
            updateCharts();
            
        } catch (error) {
            console.error(error);
            showAlert("Fallo en la resolución matricial.", true);
        }
    });

    // 5. Evento: Cambio de componente a visualizar (Interactividad instantánea)
    document.getElementById('componentSelector').addEventListener('change', () => {
        syncInputsToState();
        renderResultsTable();
        updateCharts();
    });

    // 6. Eventos de Exportación
    document.getElementById('btnExportCSV').addEventListener('click', exportToCSV);
    document.getElementById('btnExportPDF').addEventListener('click', generatePDF);
});