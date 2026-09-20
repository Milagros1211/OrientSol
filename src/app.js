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

document.addEventListener('DOMContentLoaded', async () => {
    
    // Carga de base de datos
    await loadDefaultDatabase();

    // ==========================================
    // LÓGICA DE TRADUCCIÓN BILINGÜE
    // ==========================================
    const langSelector = document.getElementById('langSelector');
    langSelector.addEventListener('change', async (e) => {
        State.ui.currentLang = e.target.value;
        try {
            // Llama a los archivos locales/es.json o locales/en.json
            const response = await fetch(`./locales/${State.ui.currentLang}.json`);
            if(!response.ok) throw new Error("Diccionario no encontrado");
            const t = await response.json();
            
            // Actualizar etiquetas estáticas
            document.getElementById('lblAppTitle').textContent = t.appTitle || "OrientSol 3.0";
            document.getElementById('lblInputPanel').textContent = t.panelInputTitle || "1. Entrada de Parámetros";
            document.getElementById('lblCity').textContent = t.defaultDbLabel || "Base de Datos";
            document.getElementById('lblLat').textContent = t.latitudeLabel || "Latitud (°)";
            document.getElementById('lblLon').textContent = t.longitudeLabel || "Longitud (°)";
            document.getElementById('btnFetchAPI').textContent = t.btnFetchApi || "Conectar con API";
            document.getElementById('lblUpload').textContent = t.lblUploadCsv || "O cargar CSV:";
            document.getElementById('lblStudy').textContent = t.studyTypeLabel || "Tipo de Estudio";
            document.getElementById('btnCalculate').textContent = t.btnCalculate || "Calcular";
            document.getElementById('lblResultsPanel').textContent = t.panelOutputTitle || "2. Análisis";
            document.getElementById('lblComponent').textContent = t.componentLabel || "Componente:";
            document.getElementById('btnExportCSV').textContent = t.btnExportCsv || "Exportar CSV";
            document.getElementById('btnExportPDF').textContent = t.btnExportPdf || "Generar PDF";
            
            // Actualizar selector de estudios
            const studySelect = document.getElementById('studyModeSelector');
            if(t.studies) {
                studySelect.options[0].text = t.studies["1"];
                studySelect.options[1].text = t.studies["2"];
                studySelect.options[2].text = t.studies["3"];
                studySelect.options[3].text = t.studies["4"];
                studySelect.options[4].text = t.studies["5"];
                studySelect.options[5].text = t.studies["6"];
                studySelect.options[6].text = t.studies["7"];
            }

            // Actualizar componentes
            const compSelect = document.getElementById('componentSelector');
            if(t.components) {
                compSelect.options[0].text = t.components["global"];
                compSelect.options[1].text = t.components["direct"];
                compSelect.options[2].text = t.components["diffuse"];
                compSelect.options[3].text = t.components["albedo"];
            }
        } catch (error) {
            console.error("Error al traducir:", error);
        }
    });

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

    // Botones de cerrado (Volver y Salir)
    document.getElementById('btnCloseEnergy').addEventListener('click', () => { energyModal.classList.add('hidden'); });
    document.getElementById('btnExitEnergy').addEventListener('click', () => { energyModal.classList.add('hidden'); });

    // Ejecutar Osterwald
    // 4. Calcular Energía de Osterwald
    document.getElementById('btnCalcEnergy').addEventListener('click', () => {
        const kwp = parseFloat(document.getElementById('kwpInput').value);
        const gamma = parseFloat(document.getElementById('gammaInput').value);
        
        // CORRECCIÓN: Leemos específicamente el input de la TONC que está dentro del Modal
        const tonc = parseFloat(document.getElementById('toncModalInput').value); 
        const temperatures = State.climateData.monthlyTemperature;

        // Validación de seguridad
        if (isNaN(kwp) || isNaN(gamma) || isNaN(tonc)) {
            return showAlert("Por favor, revise que los valores del panel (kWp, γ, TONC) sean numéricos.", true);
        }

        // Identificar el estudio activo en el panel principal
        const studyKeys = {
            1: 'optimalAnnual', 2: 'optimalSeasonal', 3: 'polarAxis',
            4: 'azimuthalAxis', 5: 'horizontalAxis', 6: 'dualAxis', 7: 'optimalAnnual'
        };
        const activeKey = studyKeys[State.parameters.studyMode];
        
        const baseGlobalRad = State.results.base.global;
        const studyGlobalRad = State.results[activeKey].global;

        if (!studyGlobalRad || studyGlobalRad.length === 0) {
            return showAlert("No se han encontrado resultados de radiación para el estudio seleccionado.", true);
        }

        // Ejecutar modelo térmico de Osterwald importado desde core
        const baseEnergy = Energy.applyOsterwaldModel(baseGlobalRad, temperatures, kwp, tonc, gamma);
        const studyEnergy = Energy.applyOsterwaldModel(studyGlobalRad, temperatures, kwp, tonc, gamma);

        // Renderizar Tabla de Energía en el Modal
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
        
        // Renderizar Fila de Totales Anuales
        document.getElementById('energyTableFoot').classList.remove('hidden');
        document.getElementById('baseAnnualEnergy').textContent = baseEnergy.annualEnergy.toFixed(1);
        document.getElementById('studyAnnualEnergy').textContent = studyEnergy.annualEnergy.toFixed(1);
        document.getElementById('gainAnnualEnergy').textContent = (studyEnergy.annualEnergy - baseEnergy.annualEnergy).toFixed(2);
    });

    // Botones de Exportación dentro del modal
    document.getElementById('btnExportEnergyCSV').addEventListener('click', () => {
        showAlert("Exportando CSV de Energía...");
        exportToCSV(); // Conectado temporalmente al motor genérico de exportación
    });
    document.getElementById('btnExportEnergyPDF').addEventListener('click', () => {
        generatePDF(); // Conectado al generador global de informes
    });
});