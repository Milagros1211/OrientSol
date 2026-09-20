// ==========================================
// Archivo: src/app.js
// ==========================================
import { State } from './state.js';
import { syncInputsToState, renderResultsTable, showAlert } from './ui.js';
import { loadDefaultDatabase, fetchWeatherDataAPI, handleCSVUpload } from './data.js';
import { runSimulation } from './core/simulation.js';
import { updateCharts } from './charts.js';
import { exportToCSV, generatePDF } from './export.js';
import { Energy } from './core/energy.js';
import { loadLanguage, updateUIWithLanguage } from '../locales/i18n.js';

document.addEventListener('DOMContentLoaded', async () => {
    
    // 1. Cargamos la base de datos (Esto activa el citySelector)
    await loadDefaultDatabase();

    // 2. Cargamos el diccionario de idioma
    State.ui.dict = await loadLanguage(State.ui.currentLang || 'es');
    if (State.ui.dict) {
        updateUIWithLanguage(State.ui.dict);
        updateSelects(State.ui.dict);
    }

    // 3. Evento de Cambio de Idioma Bilingüe
    const langSelector = document.getElementById('langSelector');
    langSelector.addEventListener('change', async (e) => {
        State.ui.currentLang = e.target.value;
        State.ui.dict = await loadLanguage(State.ui.currentLang);
        
        if (State.ui.dict) {
            updateUIWithLanguage(State.ui.dict);
            updateSelects(State.ui.dict);
            
            // Refresca la tabla si ya hay datos calculados
            if (State.results.base.global && State.results.base.global.length > 0) {
                renderResultsTable();
            }
        }
    });

    function updateSelects(dict) {
        const studySelect = document.getElementById('studyModeSelector');
        if (dict.studies) {
            studySelect.options[0].text = dict.studies["1"];
            studySelect.options[1].text = dict.studies["2"];
            studySelect.options[2].text = dict.studies["3"];
            studySelect.options[3].text = dict.studies["4"];
            studySelect.options[4].text = dict.studies["5"];
            studySelect.options[5].text = dict.studies["6"];
            studySelect.options[6].text = dict.studies["7"];
        }
        const compSelect = document.getElementById('componentSelector');
        if (dict.components) {
            compSelect.options[0].text = dict.components["global"];
            compSelect.options[1].text = dict.components["direct"];
            compSelect.options[2].text = dict.components["diffuse"];
            compSelect.options[3].text = dict.components["albedo"];
        }
    }

    // ==========================================
    // EVENTOS PRINCIPALES
    // ==========================================
    document.getElementById('btnFetchAPI').addEventListener('click', async () => {
        syncInputsToState();
        await fetchWeatherDataAPI(State.location.latitude, State.location.longitude);
        showAlert("Datos climatológicos obtenidos exitosamente.");
    });

    document.getElementById('csvUpload').addEventListener('change', handleCSVUpload);

    document.getElementById('btnCalculate').addEventListener('click', () => {
        syncInputsToState();
        if (State.climateData.monthlyGlobalRadiation.reduce((a,b) => a+b, 0) === 0) {
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

    // ==========================================
    // EVENTOS DEL MODAL DE ENERGÍA
    // ==========================================
    const energyModal = document.getElementById('energyModal');

    document.getElementById('btnOpenEnergy').addEventListener('click', () => {
        if (!State.results.base.global || State.results.base.global.length === 0) {
            return showAlert("Ejecute primero una simulación matemática de radiación.", true);
        }
        document.getElementById('energyCity').textContent = State.location.name;
        document.getElementById('energyLat').textContent = State.location.latitude.toFixed(2);
        energyModal.classList.remove('hidden');
    });

    document.getElementById('btnCloseEnergy').addEventListener('click', () => { energyModal.classList.add('hidden'); });
    document.getElementById('btnExitEnergy').addEventListener('click', () => { energyModal.classList.add('hidden'); });

    document.getElementById('btnCalcEnergy').addEventListener('click', () => {
        const kwp = parseFloat(document.getElementById('kwpInput').value);
        const gamma = parseFloat(document.getElementById('gammaInput').value);
        const tonc = parseFloat(document.getElementById('toncModalInput').value); 
        const temperatures = State.climateData.monthlyTemperature;

        if (isNaN(kwp) || isNaN(gamma) || isNaN(tonc)) {
            return showAlert("Por favor, revise que los valores del panel sean numéricos.", true);
        }

        const studyKeys = {
            1: 'optimalAnnual', 2: 'optimalSeasonal', 3: 'polarAxis',
            4: 'azimuthalAxis', 5: 'horizontalAxis', 6: 'dualAxis', 7: 'optimalAnnual'
        };
        const activeKey = studyKeys[State.parameters.studyMode];
        
        const baseGlobalRad = State.results.base.global;
        const studyGlobalRad = State.results[activeKey].global;

        if (!studyGlobalRad || studyGlobalRad.length === 0) {
            return showAlert("No se han encontrado resultados de radiación.", true);
        }

        const baseEnergy = Energy.applyOsterwaldModel(baseGlobalRad, temperatures, kwp, tonc, gamma);
        const studyEnergy = Energy.applyOsterwaldModel(studyGlobalRad, temperatures, kwp, tonc, gamma);

        const tbody = document.getElementById('energyTableBody');
        const months = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
        
        let html = '';
        for(let i=0; i<12; i++) {
            const gain = studyEnergy.monthlyEnergy[i] - baseEnergy.monthlyEnergy[i];
            html += `
                <tr class="border-b">
                    <td class="p-1 border bg-blue-500 text-white font-semibold">${months[i]}</td>
                    <td class="p-1 border text-center">${baseEnergy.monthlyEnergy[i].toFixed(2)}</td>
                    <td class="p-1 border text-center font-semibold text-blue-700">${studyEnergy.monthlyEnergy[i].toFixed(2)}</td>
                    <td class="p-1 border text-center text-red-700 font-bold">${gain.toFixed(2)}</td>
                </tr>
            `;
        }
        tbody.innerHTML = html;
        document.getElementById('energyTableFoot').classList.remove('hidden');
        document.getElementById('baseAnnualEnergy').textContent = baseEnergy.annualEnergy.toFixed(1);
        document.getElementById('studyAnnualEnergy').textContent = studyEnergy.annualEnergy.toFixed(1);
        document.getElementById('gainAnnualEnergy').textContent = (studyEnergy.annualEnergy - baseEnergy.annualEnergy).toFixed(2);
    });

    document.getElementById('btnExportEnergyCSV').addEventListener('click', () => {
        showAlert("Exportando CSV de Energía...");
        exportToCSV(); 
    });
    document.getElementById('btnExportEnergyPDF').addEventListener('click', () => {
        generatePDF(); 
    });
});