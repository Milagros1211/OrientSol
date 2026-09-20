// ==========================================
// Archivo: src/app.js
// Propósito: Controlador Maestro de Inicialización (SPA)
// ==========================================
import { State } from './state.js';
import { syncInputsToState, renderResultsTable, showAlert } from './ui.js';
import { loadDefaultDatabase, fetchWeatherDataAPI, handleCSVUpload } from './data.js';
import { runSimulation } from './core/simulation.js';
import { updateCharts } from './charts.js';
import { exportToCSV, generatePDF } from './export.js';
import { loadLanguage, updateUIWithLanguage } from '../locales/i18n.js';
import { initEnergyModal } from './ui/energyModal.js'; // Importación del nuevo módulo
import { initLocationModal } from './ui/locationModal.js';

document.addEventListener('DOMContentLoaded', async () => {
    
    // 1. Cargar base de datos predeterminada y diccionario de idioma
    await loadDefaultDatabase();
    initLocationModal(); // <- Inicializa el modal de nueva localización manual
    State.ui.dict = await loadLanguage(State.ui.currentLang || 'es');
    
    if (State.ui.dict) {
        updateUIWithLanguage(State.ui.dict);
        updateSelects(State.ui.dict);
    }

    // 2. Inicializar el controlador del Modal de Energía aislado
    initEnergyModal();

    // 3. Evento de Cambio de Idioma Bilingüe
    const langSelector = document.getElementById('langSelector');
    langSelector.addEventListener('change', async (e) => {
        State.ui.currentLang = e.target.value;
        State.ui.dict = await loadLanguage(State.ui.currentLang);
        
        if (State.ui.dict) {
            updateUIWithLanguage(State.ui.dict);
            updateSelects(State.ui.dict);
            
            if (State.results.base.global && State.results.base.global.length > 0) {
                renderResultsTable();
            }
        }
    });

    function updateSelects(dict) {
        const studySelect = document.getElementById('studyModeSelector');
        if (dict.studies) {
            for (let i = 1; i <= 7; i++) {
                studySelect.options[i - 1].text = dict.studies[String(i)];
            }
        }
        const compSelect = document.getElementById('componentSelector');
        if (dict.components) {
            const keys = ['global', 'direct', 'diffuse', 'albedo'];
            keys.forEach((key, idx) => {
                compSelect.options[idx].text = dict.components[key];
            });
        }
    }

    // 4. Eventos Principales de Interacción
    document.getElementById('btnFetchAPI').addEventListener('click', async () => {
        syncInputsToState();
        await fetchWeatherDataAPI(State.location.latitude, State.location.longitude);
        showAlert("Datos climatológicos obtenidos exitosamente.");
    });

    document.getElementById('csvUpload').addEventListener('change', handleCSVUpload);

    document.getElementById('btnCalculate').addEventListener('click', () => {
        syncInputsToState();
        if (State.climateData.monthlyGlobalRadiation.reduce((a, b) => a + b, 0) === 0) {
            return showAlert("Conecte con PVGIS o suba un CSV primero.", true);
        }
        try {
            runSimulation();
            renderResultsTable();
            updateCharts();
        } catch (error) {
            console.error(error);
            showAlert("Fallo en la resolución matricial. Consulte la consola.", true);
        }
    });

    document.getElementById('componentSelector').addEventListener('change', () => {
        syncInputsToState();
        renderResultsTable();
        updateCharts();
    });

    document.getElementById('btnExportCSV').addEventListener('click', exportToCSV);
    document.getElementById('btnExportPDF').addEventListener('click', generatePDF);
});