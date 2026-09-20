// ==========================================
// Archivo: src/ui.js
// Propósito: Interacción con el DOM y control principal de vistas de tablas
// ==========================================
import { State } from './state.js';
import { Tables } from './ui/tables.js';

const elements = {
    latInput: document.getElementById('latInput'),
    lonInput: document.getElementById('lonInput'),
    albedoInput: document.getElementById('albedoInput'),
    toncInput: document.getElementById('toncInput'),
    studySelector: document.getElementById('studyModeSelector'),
    componentSelector: document.getElementById('componentSelector'),
    resultsTableBody: document.getElementById('resultsTableBody')
};

export function syncInputsToState() {
    State.location.latitude = parseFloat(elements.latInput.value);
    State.location.longitude = parseFloat(elements.lonInput.value);
    State.parameters.albedo = parseFloat(elements.albedoInput.value);
    State.parameters.tonc = parseFloat(elements.toncInput.value);
    State.parameters.studyMode = parseInt(elements.studySelector.value);
    State.ui.activeComponent = elements.componentSelector.value;
}

export function renderResultsTable() {
    const { ui, results, parameters, climateData } = State;

    // Delegación limpia según el estudio seleccionado
    if (parameters.studyMode === 1) {
        Tables.renderAnnualTable(results, parameters, climateData, ui, elements);
    } else {
        Tables.renderStandardTable(results, parameters, ui, elements);
    }
}

export function showAlert(message, isError = false) {
    alert(`${isError ? '❌ ERROR:' : '✅ INFO:'} ${message}`);
}