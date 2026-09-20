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
    const imgContainer = document.getElementById('studyImageContainer');

    // Mostrar u ocultar la imagen según el estudio seleccionado
    if (parameters.studyMode === 3) {
        imgContainer.classList.remove('hidden');
        imgContainer.innerHTML = `
            <div class="flex flex-col items-center">
                <!-- Se inyecta la imagen física solicitada -->
                <img src="./assets/img/SeguimientoPolar.JPG" alt="Seguimiento a un eje polar" class="w-40 h-auto drop-shadow-md rounded">
            </div>
        `;
    } else {
        imgContainer.classList.add('hidden');
        imgContainer.innerHTML = '';
    }

    // Delegación del renderizado a la tabla correspondiente
    if (parameters.studyMode === 1) {
        Tables.renderAnnualTable(results, parameters, climateData, ui, elements);
    } else if (parameters.studyMode === 2) {
        Tables.renderSeasonalTable(results, parameters, climateData, ui, elements);
    } else if (parameters.studyMode === 3) {
        Tables.renderPolarTable(results, parameters, climateData, ui, elements);
    } else {
        Tables.renderStandardTable(results, parameters, ui, elements);
    }
}

export function showAlert(message, isError = false) {
    alert(`${isError ? '❌ ERROR:' : '✅ INFO:'} ${message}`);
}