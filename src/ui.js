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

// Renderiza dinámicamente la tabla de resultados (Sustituye la rigidez de GUIDE)
export function renderResultsTable() {
    const { ui, results, climateData } = State;
    const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    
    elements.resultsTableBody.innerHTML = ''; // Limpiar tabla

    // Identificar qué datos pintar según el componente activo (global, directa...)
    let baseData = results.base[ui.activeComponent];
    let studyData = results.optimalAnnual[ui.activeComponent]; // Ejemplo estático
    let gainsData = results.optimalAnnual.gains[ui.activeComponent];

    // Generar las 12 filas mensuales iterativamente
    let html = '';
    for (let i = 0; i < 12; i++) {
        html += `
            <tr class="hover:bg-blue-50 text-center">
                <td class="p-2 border border-gray-300 font-bold">${months[i]}</td>
                <td class="p-2 border border-gray-300">${baseData ? baseData[i].toFixed(2) : '-'}</td>
                <td class="p-2 border border-gray-300 text-blue-700 font-semibold">${studyData ? studyData[i].toFixed(2) : '-'}</td>
                <td class="p-2 border border-gray-300 text-green-600">${gainsData ? gainsData[i].toFixed(2) : '-'}</td>
            </tr>
        `;
    }
    elements.resultsTableBody.innerHTML = html;
}

export function showAlert(message, isError = false) {
    // Alerta web moderna (Sustituye a los errordlg de MATLAB)
    alert(`${isError ? '❌ ERROR:' : '✅ INFO:'} ${message}`);
}