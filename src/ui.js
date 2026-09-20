// ==========================================
// Archivo: src/ui.js
// Propósito: Interacción con el DOM y renderizado de tablas bilingües
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
    const t = ui.dict || {}; // Carga el diccionario bilingüe seguro

    // Meses en español e inglés
    const monthsEs = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
    const monthsEn = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    const months = ui.currentLang === 'en' ? monthsEn : monthsEs;
    
    const tbody = elements.resultsTableBody;
    const thead = tbody.previousElementSibling;

    const studyKeys = {
        1: 'optimalAnnual', 2: 'optimalSeasonal', 3: 'polarAxis',
        4: 'azimuthalAxis', 5: 'horizontalAxis', 6: 'dualAxis', 7: 'optimalAnnual'
    };

    const activeKey = studyKeys[parameters.studyMode];
    const studyObj = results[activeKey];
    const comp = ui.activeComponent;

    const prefixes = { global: 'Gdm', direct: 'Bdm', diffuse: 'Ddm', albedo: 'Rdm' };
    const px = prefixes[comp];

    if (!studyObj || !studyObj[comp] || studyObj[comp].length === 0) {
        tbody.innerHTML = `<tr><td colspan="12" class="text-center p-4 text-gray-500">${t.emptyTableMsg || 'Ejecute la simulación.'}</td></tr>`;
        return;
    }

    let baseData = results.base[comp];
    let studyData = studyObj[comp];
    let gainsPercentages = studyObj.gains ? studyObj.gains[comp] : null;
    let temperatures = climateData.monthlyTemperature;

    let html = '';

    // ==========================================
    // RENDERIZADO MODO 1: ÓPTIMO ANUAL (MATLAB Clone)
    // ==========================================
    if (parameters.studyMode === 1) {
        let matrix = results.tiltedMatrix[comp];
        let optimalAngle = studyObj.angle !== undefined ? studyObj.angle : '-';

        // bg-white introducido en la primera celda para tapar el color de fondo
        thead.innerHTML = `
            <tr class="bg-blue-500 text-white text-xs text-center border-b border-white">
                <th class="p-2 border border-white font-normal w-24 bg-white"></th>
                <th class="p-2 border border-white font-normal">${px} (0º)</th>
                <th class="p-2 border border-white font-normal">${px} (15º)</th>
                <th class="p-2 border border-white font-normal">${px} (30º)</th>
                <th class="p-2 border border-white font-normal">${px} (45º)</th>
                <th class="p-2 border border-white font-normal">${px} (60º)</th>
                <th class="p-2 border border-white font-normal">${px} (75º)</th>
                <th class="p-2 border border-white font-normal">${px} (90º)</th>
                <th class="p-2 border border-white font-bold bg-blue-600 flex flex-col justify-center items-center">
                    <span class="text-[11px] text-blue-200 leading-none">${optimalAngle}º</span>
                    <span>${px} óptimo</span>
                </th>
                <th class="p-2 border border-white font-normal">Tª media</th>
                <th class="p-1 border border-white bg-[#102A5B] font-normal" colspan="2">${t.tableGain || 'Ganancia'}</th>
            </tr>
            <tr class="bg-blue-500 text-white text-xs text-center">
                <th colspan="10" class="border border-white bg-transparent"></th>
                <th class="p-1 border border-white bg-[#3B82F6] font-normal">Factor</th>
                <th class="p-1 border border-white bg-[#3B82F6] font-normal">%</th>
            </tr>
        `;

        let sumV0=0, sumV15=0, sumV30=0, sumV45=0, sumV60=0, sumV75=0, sumV90=0;
        let sumOpt=0, sumTemp=0, sumFactor=0, sumGainPct=0;

        for (let i = 0; i < 12; i++) {
            let v0 = comp === 'albedo' ? 0 : (matrix && matrix[i] ? matrix[i][0] : 0);
            let v15 = matrix && matrix[i] ? matrix[i][15] : 0;
            let v30 = matrix && matrix[i] ? matrix[i][30] : 0;
            let v45 = matrix && matrix[i] ? matrix[i][45] : 0;
            let v60 = matrix && matrix[i] ? matrix[i][60] : 0;
            let v75 = matrix && matrix[i] ? matrix[i][75] : 0;
            let v90 = matrix && matrix[i] ? matrix[i][90] : 0;
            
            let vOpt = studyData[i] || 0;
            let temp = temperatures[i] || 0;
            
            // CORRECCIÓN MATEMÁTICA PARA EL % DE GANANCIA
            let vDatabaseBase = comp === 'global' ? (climateData.monthlyGlobalRadiation[i] || 0) : v0;
            
            let factorNum = vDatabaseBase > 0 ? (vOpt / vDatabaseBase) : 0;
            let gainPctNum = vDatabaseBase > 0 ? ((factorNum - 1) * 100) : 0;

            sumV0 += v0; sumV15 += v15; sumV30 += v30; sumV45 += v45; 
            sumV60 += v60; sumV75 += v75; sumV90 += v90;
            sumOpt += vOpt; sumTemp += temp;
            sumFactor += factorNum; sumGainPct += gainPctNum;

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
                    <td class="p-1.5 border border-gray-200">${vDatabaseBase > 0 ? factorNum.toFixed(2) : '-'}</td>
                    <td class="p-1.5 border border-gray-200">${vDatabaseBase > 0 ? gainPctNum.toFixed(2) : '-'}</td>
                </tr>
            `;
        }

        let avgV0 = sumV0 / 12, avgV15 = sumV15 / 12, avgV30 = sumV30 / 12;
        let avgV45 = sumV45 / 12, avgV60 = sumV60 / 12, avgV75 = sumV75 / 12;
        let avgV90 = sumV90 / 12, avgOpt = sumOpt / 12, avgTemp = sumTemp / 12;
        let avgFactor = sumFactor / 12, avgGainPct = sumGainPct / 12;

        html += `
            <tr class="text-center text-xs font-bold text-gray-800 bg-white">
                <td class="p-1.5 border border-white bg-[#1E293B] text-white">MEDIA</td>
                <td class="p-1.5 border border-gray-200">${avgV0.toFixed(2)}</td>
                <td class="p-1.5 border border-gray-200">${avgV15.toFixed(2)}</td>
                <td class="p-1.5 border border-gray-200">${avgV30.toFixed(2)}</td>
                <td class="p-1.5 border border-gray-200">${avgV45.toFixed(2)}</td>
                <td class="p-1.5 border border-gray-200">${avgV60.toFixed(2)}</td>
                <td class="p-1.5 border border-gray-200">${avgV75.toFixed(2)}</td>
                <td class="p-1.5 border border-gray-200">${avgV90.toFixed(2)}</td>
                <td class="p-1.5 border border-gray-200">${avgOpt.toFixed(2)}</td>
                <td class="p-1.5 border border-gray-200">${avgTemp.toFixed(2)}</td>
                <td class="p-1.5 border border-gray-200">${comp !== 'albedo' ? avgFactor.toFixed(2) : '-'}</td>
                <td class="p-1.5 border border-gray-200">${comp !== 'albedo' ? avgGainPct.toFixed(2) : '-'}</td>
            </tr>
        `;

    } else {
        
        // ==========================================
        // RENDERIZADO PARA LOS DEMÁS ESTUDIOS
        // ==========================================
        thead.innerHTML = `
            <tr class="bg-gray-800 text-white text-xs">
                <th class="p-2 border border-gray-400">${t.tableMonth || 'Mes'}</th>
                <th class="p-2 border border-gray-400">${t.tableHorizontal || 'Plano Horizontal (0°)'}</th>
                <th class="p-2 border border-gray-400">${t.tableStudy || 'Estudio Seleccionado'}</th>
                <th class="p-2 border border-gray-400">${t.tableGain || 'Ganancia (%)'}</th>
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