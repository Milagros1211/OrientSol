// ==========================================
// Archivo: src/ui.js
// Propósito: Interacción con el DOM y actualización de la vista
// ==========================================
import { State } from './state.js';

// Captura de elementos del DOM
const elements = {
    latInput: document.getElementById('latInput'),
    lonInput: document.getElementById('lonInput'),
    albedoInput: document.getElementById('albedoInput'),
    toncInput: document.getElementById('toncInput'),
    studySelector: document.getElementById('studyModeSelector'),
    componentSelector: document.getElementById('componentSelector'),
    resultsTableBody: document.getElementById('resultsTableBody')
};

// Lee los inputs del usuario y los guarda en el Estado
export function syncInputsToState() {
    State.location.latitude = parseFloat(elements.latInput.value);
    State.location.longitude = parseFloat(elements.lonInput.value);
    State.parameters.albedo = parseFloat(elements.albedoInput.value);
    State.parameters.tonc = parseFloat(elements.toncInput.value);
    State.parameters.studyMode = parseInt(elements.studySelector.value);
    State.ui.activeComponent = elements.componentSelector.value;
}

// Renderiza dinámicamente la tabla de resultados
export function renderResultsTable() {
    const { ui, results, parameters } = State;
    const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    
    elements.resultsTableBody.innerHTML = ''; // Limpiar tabla

    // Mapa para enlazar el modo de estudio con la variable correcta en memoria
    const studyKeys = {
        1: 'optimalAnnual',
        2: 'optimalSeasonal',
        3: 'polarAxis',
        4: 'azimuthalAxis',
        5: 'horizontalAxis',
        6: 'dualAxis',
        7: 'optimalAnnual' // Base por defecto para la comparativa
    };

    const activeKey = studyKeys[parameters.studyMode];
    const studyObj = results[activeKey];

    // Seguridad: Evitar el renderizado si el motor aún no ha calculado el estudio
    if (!studyObj || !studyObj[ui.activeComponent] || studyObj[ui.activeComponent].length === 0) {
        elements.resultsTableBody.innerHTML = '<tr><td colspan="4" class="text-center p-4 text-gray-500">No hay datos calculados para este estudio.</td></tr>';
        return;
    }

    // Extracción dinámica de datos
    let baseData = results.base[ui.activeComponent];
    let studyData = studyObj[ui.activeComponent];
    let gainsData = studyObj.gains ? studyObj.gains[ui.activeComponent] : null;

    // Generar las 12 filas mensuales iterativamente
    let html = '';
    for (let i = 0; i < 12; i++) {
        html += `
            <tr class="hover:bg-blue-50 text-center">
                <td class="p-2 border border-gray-300 font-bold">${months[i]}</td>
                <td class="p-2 border border-gray-300">${baseData && baseData[i] !== undefined ? baseData[i].toFixed(2) : '-'}</td>
                <td class="p-2 border border-gray-300 text-blue-700 font-semibold">${studyData && studyData[i] !== undefined ? studyData[i].toFixed(2) : '-'}</td>
                <td class="p-2 border border-gray-300 text-green-600">${gainsData && gainsData[i] !== null && gainsData[i] !== undefined ? gainsData[i].toFixed(2) : '-'}</td>
            </tr>
        `;
    }
    elements.resultsTableBody.innerHTML = html;
}

export function showAlert(message, isError = false) {
    // Alerta web moderna (Sustituye a los errordlg de MATLAB)
    alert(`${isError ? '❌ ERROR:' : '✅ INFO:'} ${message}`);
}