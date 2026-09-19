// ==========================================
// Archivo: src/ui.js
// Propósito: Interacción con el DOM y renderizado de tablas dinámicas clonando MATLAB
// ==========================================
import { State } from './state.js';

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
    const months = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
    
    const tbody = elements.resultsTableBody;
    const thead = tbody.previousElementSibling; // Capturamos el thead para reconstruirlo

    const studyKeys = {
        1: 'optimalAnnual', 2: 'optimalSeasonal', 3: 'polarAxis',
        4: 'azimuthalAxis', 5: 'horizontalAxis', 6: 'dualAxis', 7: 'optimalAnnual'
    };

    const activeKey = studyKeys[parameters.studyMode];
    const studyObj = results[activeKey];
    const comp = ui.activeComponent;

    if (!studyObj || !studyObj[comp] || studyObj[comp].length === 0) {
        tbody.innerHTML = '<tr><td colspan="12" class="text-center p-4 text-gray-500">No hay datos. Ejecute la simulación.</td></tr>';
        return;
    }

    let baseData = results.base[comp];
    let studyData = studyObj[comp];
    let gainsPercentages = studyObj.gains ? studyObj.gains[comp] : null;
    let temperatures = climateData.monthlyTemperature;

    let html = '';

    // ==========================================
    // RENDERIZADO IDÉNTICO A MATLAB: MODO 1 (Óptimo Anual)
    // ==========================================
    if (parameters.studyMode === 1) {
        let matrix = results.tiltedMatrix[comp];
        let optimalAngle = studyObj.angle !== undefined ? studyObj.angle : '-';

        // Reconstruir la cabecera idéntica a MATLAB
        thead.innerHTML = `
            <tr class="bg-blue-500 text-white text-xs text-center border-b border-white">
                <th class="p-2 border border-white font-normal w-24 bg-transparent"></th>
                <th class="p-2 border border-white font-normal">Gdm (0º)</th>
                <th class="p-2 border border-white font-normal">Gdm (15º)</th>
                <th class="p-2 border border-white font-normal">Gdm (30º)</th>
                <th class="p-2 border border-white font-normal">Gdm (45º)</th>
                <th class="p-2 border border-white font-normal">Gdm (60º)</th>
                <th class="p-2 border border-white font-normal">Gdm (75º)</th>
                <th class="p-2 border border-white font-normal">Gdm (90º)</th>
                <th class="p-2 border border-white font-bold bg-blue-600 flex flex-col justify-center items-center">
                    <span class="text-[10px] text-blue-200">${optimalAngle}º</span>
                    <span>Gdm óptimo</span>
                </th>
                <th class="p-2 border border-white font-normal">Tª media</th>
                <th class="p-1 border border-white bg-[#102A5B] font-normal" colspan="2">Ganancia</th>
            </tr>
            <tr class="bg-blue-500 text-white text-xs text-center">
                <th colspan="10" class="border border-white bg-transparent"></th>
                <th class="p-1 border border-white bg-[#3B82F6] font-normal">Factor</th>
                <th class="p-1 border border-white bg-[#3B82F6] font-normal">%</th>
            </tr>
        `;

        // Generar filas
        let sumBase=0, sumOpt=0, sumTemp=0;

        for (let i = 0; i < 12; i++) {
            let v0 = matrix && matrix[i] ? matrix[i][0] : 0;
            let v15 = matrix && matrix[i] ? matrix[i][15] : 0;
            let v30 = matrix && matrix[i] ? matrix[i][30] : 0;
            let v45 = matrix && matrix[i] ? matrix[i][45] : 0;
            let v60 = matrix && matrix[i] ? matrix[i][60] : 0;
            let v75 = matrix && matrix[i] ? matrix[i][75] : 0;
            let v90 = matrix && matrix[i] ? matrix[i][90] : 0;
            
            let vOpt = studyData[i] || 0;
            let temp = temperatures[i] || 0;
            
            // Factor = (Óptimo / Base)
            let factor = v0 > 0 ? (vOpt / v0).toFixed(2) : '-';
            let gainPct = gainsPercentages && gainsPercentages[i] !== null ? gainsPercentages[i].toFixed(2) : '-';

            sumBase += v0; sumOpt += vOpt; sumTemp += temp;

            html += `
                <tr class="text-center text-xs text-gray-700 bg-white">
                    <td class="p-1.5 border border-white bg-blue-500 text-white">${months[i]}</td>
                    <td class="p-1.5 border border-gray-200">${v0.toFixed(2)}</td>
                    <td class="p-1.5 border border-gray-200">${v15.toFixed(2)}</td>
                    <td class="p-1.5 border border-gray-200">${v30.toFixed(2)}</td>
                    <td class="p-1.5 border border-gray-200">${v45.toFixed(2)}</td>
                    <td class="p-1.5 border border-gray-200">${v60.toFixed(2)}</td>
                    <td class="p-1.5 border border-gray-200">${v75.toFixed(2)}</td>
                    <td class="p-1.5 border border-gray-200">${v90.toFixed(2)}</td>
                    <td class="p-1.5 border border-gray-200 font-semibold">${vOpt.toFixed(2)}</td>
                    <td class="p-1.5 border border-gray-200">${temp.toFixed(1)}</td>
                    <td class="p-1.5 border border-gray-200">${factor}</td>
                    <td class="p-1.5 border border-gray-200">${gainPct}</td>
                </tr>
            `;
        }

        // Fila de MEDIAS
        let avgBase = sumBase / 12;
        let avgOpt = sumOpt / 12;
        let avgTemp = sumTemp / 12;
        let avgFactor = avgBase > 0 ? (avgOpt / avgBase).toFixed(2) : '-';
        let avgGainPct = avgBase > 0 ? (((avgOpt / avgBase) - 1) * 100).toFixed(2) : '-';

        html += `
            <tr class="text-center text-xs font-bold text-gray-800 bg-white">
                <td class="p-1.5 border border-white bg-[#1E293B] text-white">MEDIA</td>
                <td class="p-1.5 border border-gray-200">${avgBase.toFixed(2)}</td>
                <td class="p-1.5 border border-gray-200">-</td>
                <td class="p-1.5 border border-gray-200">-</td>
                <td class="p-1.5 border border-gray-200">-</td>
                <td class="p-1.5 border border-gray-200">-</td>
                <td class="p-1.5 border border-gray-200">-</td>
                <td class="p-1.5 border border-gray-200">-</td>
                <td class="p-1.5 border border-gray-200">${avgOpt.toFixed(2)}</td>
                <td class="p-1.5 border border-gray-200">${avgTemp.toFixed(2)}</td>
                <td class="p-1.5 border border-gray-200">${avgFactor}</td>
                <td class="p-1.5 border border-gray-200">${avgGainPct}</td>
            </tr>
        `;
    } else {
        // ==========================================
        // RENDERIZADO PARA LOS DEMÁS ESTUDIOS (Seguidores, etc.)
        // ==========================================
        thead.innerHTML = `
            <tr class="bg-gray-800 text-white text-xs">
                <th class="p-2 border border-gray-400">Mes</th>
                <th class="p-2 border border-gray-400">Plano Horizontal (0°)</th>
                <th class="p-2 border border-gray-400">Estudio Seleccionado</th>
                <th class="p-2 border border-gray-400">Ganancia (%)</th>
            </tr>
        `;

        for (let i = 0; i < 12; i++) {
            let vBase = baseData && baseData[i] !== undefined ? baseData[i].toFixed(2) : '-';
            let vStudy = studyData && studyData[i] !== undefined ? studyData[i].toFixed(2) : '-';
            let vGain = gainsPercentages && gainsPercentages[i] !== null && gainsPercentages[i] !== undefined ? gainsPercentages[i].toFixed(2) : '-';

            if (comp === 'albedo') vBase = '0.00';

            html += `
                <tr class="hover:bg-blue-50 text-center text-xs">
                    <td class="p-2 border border-gray-300 font-bold bg-gray-100">${months[i]}</td>
                    <td class="p-2 border border-gray-300">${vBase}</td>
                    <td class="p-2 border border-gray-300 text-blue-700 font-semibold">${vStudy}</td>
                    <td class="p-2 border border-gray-300 text-green-600 font-medium">${vGain}</td>
                </tr>
            `;
        }
    }

    tbody.innerHTML = html;
}

export function showAlert(message, isError = false) {
    alert(`${isError ? '❌ ERROR:' : '✅ INFO:'} ${message}`);
}