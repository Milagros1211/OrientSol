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
import { Energy } from './core/energy.js';

const energyModal = document.getElementById('energyModal');


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

// Abrir modal
document.getElementById('btnOpenEnergy').addEventListener('click', () => {
    if (!State.results.base.global || State.results.base.global.length === 0) {
        alert("Debe ejecutar primero una simulación de radiación en el panel principal.");
        return;
    }
    document.getElementById('energyCity').textContent = State.location.name;
    document.getElementById('energyLat').textContent = State.location.latitude.toFixed(2);
    // Sincronizar el TONC del panel principal con el del modal si se desea
    document.getElementById('toncModalInput').value = document.getElementById('toncInput').value;
    energyModal.classList.remove('hidden');
});

// Cerrar modal
document.getElementById('btnCloseEnergy').addEventListener('click', () => {
    energyModal.classList.add('hidden');
});

// Ejecutar cálculo de energía dentro del modal
document.getElementById('btnCalcEnergy').addEventListener('click', () => {
    const kwp = parseFloat(document.getElementById('kwpInput').value);
    const gamma = parseFloat(document.getElementById('gammaInput').value);
    const tonc = parseFloat(document.getElementById('toncModalInput').value);
    const temperatures = State.climateData.monthlyTemperature;

    const studyKeys = {
        1: 'optimalAnnual', 2: 'optimalSeasonal', 3: 'polarAxis',
        4: 'azimuthalAxis', 5: 'horizontalAxis', 6: 'dualAxis', 7: 'optimalAnnual'
    };
    const activeKey = studyKeys[State.parameters.studyMode];
    
    const baseGlobalRad = State.results.base.global;
    const studyGlobalRad = State.results[activeKey].global;

    const baseEnergy = Energy.applyOsterwaldModel(baseGlobalRad, temperatures, kwp, tonc, gamma);
    const studyEnergy = Energy.applyOsterwaldModel(studyGlobalRad, temperatures, kwp, tonc, gamma);

    // Renderizar tabla interna
    const tbody = document.getElementById('energyTableBody');
    const months = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
    
    let html = '';
    for(let i=0; i<12; i++) {
        const gain = studyEnergy.monthlyEnergy[i] - baseEnergy.monthlyEnergy[i];
        html += `
            <tr class="hover:bg-blue-50 border-b">
                <td class="p-1 border bg-blue-400 text-white font-semibold">${months[i]}</td>
                <td class="p-1 border">${baseEnergy.monthlyEnergy[i].toFixed(2)}</td>
                <td class="p-1 border font-semibold text-blue-700">${studyEnergy.monthlyEnergy[i].toFixed(2)}</td>
                <td class="p-1 border text-red-700 font-bold">${gain.toFixed(2)}</td>
            </tr>
        `;
    }
    tbody.innerHTML = html;
    
    document.getElementById('energyTableFoot').classList.remove('hidden');
    document.getElementById('baseAnnualEnergy').textContent = baseEnergy.annualEnergy.toFixed(1);
    document.getElementById('studyAnnualEnergy').textContent = studyEnergy.annualEnergy.toFixed(1);
    document.getElementById('gainAnnualEnergy').textContent = (studyEnergy.annualEnergy - baseEnergy.annualEnergy).toFixed(2);
});