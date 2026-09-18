// =========================================================================
// CONTROLADOR PRINCIPAL - OrientSol 3.0 Web
// Coordina la Interfaz (UI), los Datos Híbridos (API/CSV) y el Motor Matemático
// =========================================================================

import { State } from './state.js';
import { fetchWeatherDataAPI, handleLocalCSVUpload } from './data.js';
import { optimizeAnnualTilt } from './core/optimizacion.js';
import { renderResultsTable } from './ui.js';
import { loadLanguage, updateUIWithLanguage } from '../locales/i18n.js';

document.addEventListener('DOMContentLoaded', async () => {
    
    // --- 1. SISTEMA BILINGÜE INICIAL ---
    let currentLangDict = await loadLanguage('es');
    updateUIWithLanguage(currentLangDict);

    document.getElementById('langSelector').addEventListener('change', async (e) => {
        currentLangDict = await loadLanguage(e.target.value);
        updateUIWithLanguage(currentLangDict);
    });

    // --- 2. CARGA DUAL: MODO ONLINE (API CLIMÁTICA) ---
    document.getElementById('btnFetchAPI').addEventListener('click', async () => {
        const lat = parseFloat(document.getElementById('latInput').value);
        const lon = parseFloat(document.getElementById('lonInput').value); // LECTURA DE LONGITUD

        if (isNaN(lat) || isNaN(lon)) {
            alert(currentLangDict.error_lat_lon);
            return;
        }

        try {
            // Llamamos a la API usando Latitud y Longitud
            const apiData = await fetchWeatherDataAPI(lat, lon);
            
            // Guardamos los datos meteorológicos en el Gestor de Estado (Sustituye variables globales)
            State.latitude = lat;
            State.longitude = lon;
            State.monthlyGlobalRadiation = apiData.radiation; 
            State.temperatureData = apiData.temperature;
            
            alert(currentLangDict.success_api);
        } catch (error) {
            alert("Error de conexión. Puede usar el modo Offline subiendo un CSV.");
        }
    });

    // --- 3. CARGA DUAL: MODO OFFLINE (ARCHIVO LOCAL CSV) ---
    document.getElementById('csvUpload').addEventListener('change', (event) => {
        const file = event.target.files[0];
        if (!file) return;

        handleLocalCSVUpload(file, (extractedData) => {
            // Inyectamos los datos del Excel/CSV directamente al Estado
            State.monthlyGlobalRadiation = extractedData.radiation;
            State.temperatureData = extractedData.temperature;
            alert("Datos locales cargados correctamente. Ya puede ejecutar la simulación.");
        });
    });

    // --- 4. MOTOR MATEMÁTICO Y VISUALIZACIÓN ---
    document.getElementById('btnCalculate').addEventListener('click', () => {
        const lat = parseFloat(document.getElementById('latInput').value);
        
        if (isNaN(lat)) {
            alert(currentLangDict.error_lat_lon);
            return;
        }

        // Verificamos que existan datos cargados (por API o por CSV) antes de calcular
        if (!State.monthlyGlobalRadiation || State.monthlyGlobalRadiation.length !== 12) {
            alert(currentLangDict.error_no_data);
            return;
        }

        // Actualizamos latitud en el estado por si el usuario la modificó a mano
        State.latitude = lat;

        // EJECUCIÓN DEL CÁLCULO: Se envía Latitud y Datos de Radiación (Gdm0)
        // Esto sustituye la llamada rígida a Calculos_optimo.m
        const optimizationResults = optimizeAnnualTilt(State.latitude, State.monthlyGlobalRadiation);
        
        // PINTAR RESULTADOS: Actualizamos la tabla dinámicamente sin recargar la web
        renderResultsTable(optimizationResults);
    });

});