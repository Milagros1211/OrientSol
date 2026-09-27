/**
 * ==========================================
 * Archivo: src/ui/tables.js
 * Propósito: Fragmentación y renderizado de tablas bilingües (Sustituye a Tabla_*.m de MATLAB)
 * ==========================================
 */

const monthsEs = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
const monthsEn = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

export const Tables = {
    
    /**
     * Renderiza la tabla avanzada para el Modo 1 (Óptimo Anual con matriz de 0º a 90º)
     */
    renderAnnualTable(results, parameters, climateData, ui, elements) {
        const t = ui.dict || {};
        const months = ui.currentLang === 'en' ? monthsEn : monthsEs;
        const comp = ui.activeComponent;
        const prefixes = { global: 'Gdm', direct: 'Bdm', diffuse: 'Ddm', albedo: 'Rdm' };
        const px = prefixes[comp];

        const activeKey = 'optimalAnnual';
        const studyObj = results[activeKey];
        const matrix = results.tiltedMatrix[comp];
        const optimalAngle = studyObj.angle !== undefined ? studyObj.angle : '-';
        const studyData = studyObj[comp] || [];
        const temperatures = climateData.monthlyTemperature;

        const tbody = elements.resultsTableBody;
        const thead = tbody.previousElementSibling;

        thead.innerHTML = `
            <tr class="bg-blue-500 text-white text-xs text-center border-b border-white">
                <th class="p-2 bg-blue-400 border border-white font-normal w-24 bg-white"></th>
                <th class="p-2 bg-blue-400 border border-white font-normal">${px} (0º)</th>
                <th class="p-2 bg-blue-400 border border-white font-normal">${px} (15º)</th>
                <th class="p-2 bg-blue-400 border border-white font-normal">${px} (30º)</th>
                <th class="p-2 bg-blue-400 border border-white font-normal">${px} (45º)</th>
                <th class="p-2 bg-blue-400 border border-white font-normal">${px} (60º)</th>
                <th class="p-2 bg-blue-400 border border-white font-normal">${px} (75º)</th>
                <th class="p-2 bg-blue-400 border border-white font-normal">${px} (90º)</th>
                <th class="p-2 border border-white font-bold bg-blue-600 flex flex-col justify-center items-center">
                    <span class="text-[11px] text-blue-200 leading-none">${optimalAngle}º</span>
                    <span>${px} óptimo</span>
                </th>
                <th class="p-2 bg-blue-400 border border-white font-normal">Tª media</th>
                <th class="p-1 border border-white bg-[#102A5B] font-normal" colspan="2">${t.tableGain || 'Ganancia'}</th>
            </tr>
            <tr class="bg-blue-500 text-white text-xs text-center">
                <th colspan="10" class="border border-white bg-transparent"></th>
                <th class="p-1 border border-white bg-[#3B82F6] font-normal">Factor</th>
                <th class="p-1 border border-white bg-[#3B82F6] font-normal">%</th>
            </tr>
        `;

        let html = '';
        let sumV0 = 0, sumV15 = 0, sumV30 = 0, sumV45 = 0, sumV60 = 0, sumV75 = 0, sumV90 = 0;
        let sumOpt = 0, sumTemp = 0, sumFactor = 0, sumGainPct = 0;

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

        html += `
            <tr class="text-center text-xs font-bold text-gray-800 bg-white">
                <td class="p-1.5 border border-white bg-[#1E293B] text-white">MEDIA</td>
                <td class="p-1.5 border border-gray-200">${(sumV0/12).toFixed(2)}</td>
                <td class="p-1.5 border border-gray-200">${(sumV15/12).toFixed(2)}</td>
                <td class="p-1.5 border border-gray-200">${(sumV30/12).toFixed(2)}</td>
                <td class="p-1.5 border border-gray-200">${(sumV45/12).toFixed(2)}</td>
                <td class="p-1.5 border border-gray-200">${(sumV60/12).toFixed(2)}</td>
                <td class="p-1.5 border border-gray-200">${(sumV75/12).toFixed(2)}</td>
                <td class="p-1.5 border border-gray-200">${(sumV90/12).toFixed(2)}</td>
                <td class="p-1.5 border border-gray-200">${(sumOpt/12).toFixed(2)}</td>
                <td class="p-1.5 border border-gray-200">${(sumTemp/12).toFixed(2)}</td>
                <td class="p-1.5 border border-gray-200">${comp !== 'albedo' ? (sumFactor/12).toFixed(2) : '-'}</td>
                <td class="p-1.5 border border-gray-200">${comp !== 'albedo' ? (sumGainPct/12).toFixed(2) : '-'}</td>
            </tr>
        `;
        tbody.innerHTML = html;
    },

    /**
     * Renderiza la tabla avanzada para el Modo 2 (Óptimo Estacional)
     * Reproduce la tabla de la Figura 5.2.40 (Ordenada desde Diciembre y con rowspans)
     */
    renderSeasonalTable(results, parameters, climateData, ui, elements) {
        const t = ui.dict || {};
        const months = ui.currentLang === 'en' ? monthsEn : monthsEs;
        const comp = ui.activeComponent;
        const prefixes = { global: 'Gdm', direct: 'Bdm', diffuse: 'Ddm', albedo: 'Rdm' };
        const px = prefixes[comp];

        const matrix = results.tiltedMatrix[comp];
        const studyData = results.optimalSeasonal[comp] || [];
        const baseData = results.base[comp] || [];
        const annualData = results.optimalAnnual[comp] || [];
        
        // Extraer los ángulos óptimos estacionales desde la simulación
        const seasonalAngles = {
            'Invierno': results.optimalSeasonal.angle_Invierno ?? '-',
            'Primavera': results.optimalSeasonal.angle_Primavera ?? '-',
            'Verano': results.optimalSeasonal.angle_Verano ?? '-',
            'Otoño': results.optimalSeasonal.angle_Otoño ?? '-'
        };

        const tbody = elements.resultsTableBody;
        const thead = tbody.previousElementSibling;

        // 1. Renderizar Cabecera
        thead.innerHTML = `
            <tr class="bg-blue-500 text-white text-[11px] text-center border-b border-white">
                <th class="p-1 bg-blue-400 border border-white font-normal bg-white" rowspan="2"></th>
                <th class="p-1 bg-blue-400 border border-white font-normal">${px} (0º)</th>
                <th class="p-1 bg-blue-400 border border-white font-normal">${px} (15º)</th>
                <th class="p-1 bg-blue-400 border border-white font-normal">${px} (30º)</th>
                <th class="p-1 bg-blue-400 border border-white font-normal">${px} (45º)</th>
                <th class="p-1 bg-blue-400 border border-white font-normal">${px} (60º)</th>
                <th class="p-1 bg-blue-400 border border-white font-normal">${px} (75º)</th>
                <th class="p-1 bg-blue-400 border border-white font-normal">${px} (90º)</th>
                <th class="p-1 bg-blue-500 border border-white font-normal bg-[#5C85D6] w-16">Ángulos óptimos (º)</th>
                <th class="p-1 bg-blue-500 border border-white font-normal bg-[#5C85D6]">${px} óptimo</th>
                <th class="p-1 bg-blue-600 border border-white font-normal bg-[#102A5B]" colspan="2">Ganancias (%)</th>
            </tr>
            <tr class="bg-blue-500 text-white text-[11px] text-center">
                <th colspan="7" class="border border-white bg-transparent"></th>
                <th colspan="2" class="border border-white bg-transparent"></th>
                <th class="p-1 border border-white bg-[#3B82F6] font-normal w-20">Plano horizontal</th>
                <th class="p-1 border border-white bg-[#3B82F6] font-normal w-20">Inclinación ópt. anual</th>
            </tr>
        `;

        let html = '';
        
        // Orden específico para Estacional: Inicia en Diciembre (índice 11)
        const monthOrder = [11, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
        
        // Colores de las estaciones para la primera columna
        const seasonColors = [
            'bg-[#5C7392] text-white', // Invierno (Dic, Ene, Feb)
            'bg-[#34D399] text-white', // Primavera (Mar, Abr, May)
            'bg-[#F97316] text-white', // Verano (Jun, Jul, Ago)
            'bg-[#B45309] text-white'  // Otoño (Sep, Oct, Nov)
        ];
        const seasonKeys = ['Invierno', 'Primavera', 'Verano', 'Otoño'];

        let sums = { v0:0, v15:0, v30:0, v45:0, v60:0, v75:0, v90:0, opt:0, gainHoriz:0, gainAnnual:0 };

        monthOrder.forEach((mIdx, loopIdx) => {
            const isAlbedo = comp === 'albedo';
            let v0 = isAlbedo ? 0 : (matrix[mIdx] ? matrix[mIdx][0] : 0);
            let v15 = matrix[mIdx] ? matrix[mIdx][15] : 0;
            let v30 = matrix[mIdx] ? matrix[mIdx][30] : 0;
            let v45 = matrix[mIdx] ? matrix[mIdx][45] : 0;
            let v60 = matrix[mIdx] ? matrix[mIdx][60] : 0;
            let v75 = matrix[mIdx] ? matrix[mIdx][75] : 0;
            let v90 = matrix[mIdx] ? matrix[mIdx][90] : 0;
            
            let vOpt = studyData[mIdx] || 0;
            let vBase = isAlbedo ? 0 : (baseData[mIdx] || 0);
            let vAnn = annualData[mIdx] || 0;

            // Ganancias
            let baseRef = comp === 'global' ? climateData.monthlyGlobalRadiation[mIdx] : vBase;
            let gainHoriz = baseRef > 0 ? ((vOpt / baseRef) - 1) * 100 : 0;
            let gainAnnual = vAnn > 0 ? ((vOpt / vAnn) - 1) * 100 : 0;

            sums.v0 += v0; sums.v15 += v15; sums.v30 += v30; sums.v45 += v45;
            sums.v60 += v60; sums.v75 += v75; sums.v90 += v90; sums.opt += vOpt;
            sums.gainHoriz += gainHoriz; sums.gainAnnual += gainAnnual;

            const seasonIdx = Math.floor(loopIdx / 3);
            const isFirstMonthOfSeason = loopIdx % 3 === 0;

            html += `<tr class="text-center text-[11px] text-gray-700 bg-white">`;
            
            // Columna Mes (con color de estación)
            html += `<td class="p-1.5 border border-white ${seasonColors[seasonIdx]}">${months[mIdx]}</td>`;
            
            // Ángulos fijos
            html += `
                <td class="p-1.5 border border-gray-200">${v0.toFixed(2)}</td>
                <td class="p-1.5 border border-gray-200">${v15.toFixed(2)}</td>
                <td class="p-1.5 border border-gray-200">${v30.toFixed(2)}</td>
                <td class="p-1.5 border border-gray-200">${v45.toFixed(2)}</td>
                <td class="p-1.5 border border-gray-200">${v60.toFixed(2)}</td>
                <td class="p-1.5 border border-gray-200">${v75.toFixed(2)}</td>
                <td class="p-1.5 border border-gray-200">${v90.toFixed(2)}</td>
            `;

            // Columna de Ángulo Óptimo (Rowspan de 3)
            if (isFirstMonthOfSeason) {
                html += `<td rowspan="3" class="p-1.5 border border-gray-200 align-middle font-bold text-green-600">${seasonalAngles[seasonKeys[seasonIdx]]}</td>`;
            }

            // Gdm óptimo y Ganancias
            html += `
                <td class="p-1.5 border border-gray-200 font-semibold text-green-600">${vOpt.toFixed(2)}</td>
                <td class="p-1.5 border border-gray-200">${isAlbedo ? '-' : gainHoriz.toFixed(2)}</td>
                <td class="p-1.5 border border-gray-200">${isAlbedo ? '-' : gainAnnual.toFixed(2)}</td>
            </tr>`;
        });

        // Fila MEDIA
        html += `
            <tr class="text-center text-[11px] font-bold text-gray-800 bg-white">
                <td class="p-1.5 border border-white bg-[#1E293B] text-white">MEDIA</td>
                <td class="p-1.5 border border-gray-200">${(sums.v0/12).toFixed(2)}</td>
                <td class="p-1.5 border border-gray-200">${(sums.v15/12).toFixed(2)}</td>
                <td class="p-1.5 border border-gray-200">${(sums.v30/12).toFixed(2)}</td>
                <td class="p-1.5 border border-gray-200">${(sums.v45/12).toFixed(2)}</td>
                <td class="p-1.5 border border-gray-200">${(sums.v60/12).toFixed(2)}</td>
                <td class="p-1.5 border border-gray-200">${(sums.v75/12).toFixed(2)}</td>
                <td class="p-1.5 border border-gray-200">${(sums.v90/12).toFixed(2)}</td>
                <td class="p-1.5 border border-gray-200 bg-gray-100"></td>
                <td class="p-1.5 border border-gray-200">${(sums.opt/12).toFixed(2)}</td>
                <td class="p-1.5 border border-gray-200">${comp !== 'albedo' ? (sums.gainHoriz/12).toFixed(2) : '-'}</td>
                <td class="p-1.5 border border-gray-200">${comp !== 'albedo' ? (sums.gainAnnual/12).toFixed(2) : '-'}</td>
            </tr>
        `;
        tbody.innerHTML = html;
    },

    /**
     * Renderiza la tabla para Seguimiento Polar (6 columnas de ganancias)
     */
    renderPolarTable(results, parameters, climateData, ui, elements) {
        const months = ui.currentLang === 'en' ? monthsEn : monthsEs;
        const comp = ui.activeComponent;
        const px = { global: 'Gdm', direct: 'Bdm', diffuse: 'Ddm', albedo: 'Rdm' }[comp];
        const tbody = elements.resultsTableBody;
        const isAlbedo = comp === 'albedo';

        const vBase = isAlbedo ? new Array(12).fill(0) : (results.base[comp] || []);
        const vPolar = results.polarAxis[comp] || [];
        const vOptAnnual = results.optimalAnnual[comp] || [];
        const vOptSeasonal = results.optimalSeasonal[comp] || [];
        const vAzim = results.azimuthalAxis[comp] || [];
        const vHoriz = results.horizontalAxis[comp] || [];
        const vDual = results.dualAxis[comp] || [];
        const temperatures = climateData.monthlyTemperature || [];

        tbody.previousElementSibling.innerHTML = `
            <tr class="bg-blue-500 text-white text-[11px] text-center border-b border-white">
                <th class="p-1 border border-white font-normal bg-white" rowspan="2"></th>
                <th class="p-1 bg-blue-400 border border-white font-normal">${px} (0º)</th>
                <th class="p-1 bg-blue-400 border border-white font-normal">${px}</th>
                <th class="p-1 bg-blue-400 border border-white font-normal">Tª media</th>
                <th class="p-1 border border-white font-normal bg-[#102A5B]" colspan="6">Ganancias (%)</th>
            </tr>
            <tr class="bg-blue-500 text-white text-[11px] text-center">
                <th colspan="3" class="border border-white bg-transparent"></th>
                <th class="p-1 border border-white bg-[#3B82F6] font-normal">Plano horizontal</th>
                <th class="p-1 border border-white bg-[#3B82F6] font-normal">Inclinación ópt. anual</th>
                <th class="p-1 border border-white bg-[#3B82F6] font-normal">Inclin. ópt. estacional</th>
                <th class="p-1 border border-white bg-[#3B82F6] font-normal">Seg. a un eje azimutal</th>
                <th class="p-1 border border-white bg-[#3B82F6] font-normal">Seg. a un eje horizontal</th>
                <th class="p-1 border border-white bg-[#3B82F6] font-normal">Seg. a dos ejes</th>
            </tr>
        `;

        let html = '';
        let sums = { base:0, pol:0, temp:0, gHoriz:0, gAnn:0, gSea:0, gAzim:0, gHTrack:0, gDual:0 };

        for (let i = 0; i < 12; i++) {
            const b = vBase[i] || 0, pol = vPolar[i] || 0, temp = temperatures[i] || 0;
            const ann = vOptAnnual[i] || 0, sea = vOptSeasonal[i] || 0, az = vAzim[i] || 0, hz = vHoriz[i] || 0, dl = vDual[i] || 0;

            const gHoriz = (!isAlbedo && b > 0) ? ((pol / b) - 1) * 100 : 0;
            const gAnn = (!isAlbedo && ann > 0) ? ((pol / ann) - 1) * 100 : 0;
            const gSea = (!isAlbedo && sea > 0) ? ((pol / sea) - 1) * 100 : 0;
            const gAzim = (!isAlbedo && az > 0) ? ((pol / az) - 1) * 100 : 0;
            const gHTrack = (!isAlbedo && hz > 0) ? ((pol / hz) - 1) * 100 : 0;
            const gDual = (!isAlbedo && dl > 0) ? ((pol / dl) - 1) * 100 : 0;

            sums.base+=b; sums.pol+=pol; sums.temp+=temp; sums.gHoriz+=gHoriz; sums.gAnn+=gAnn; sums.gSea+=gSea; sums.gAzim+=gAzim; sums.gHTrack+=gHTrack; sums.gDual+=gDual;

            html += `<tr class="text-center text-[11px] text-gray-700 bg-white hover:bg-blue-50">
                <td class="p-1.5 border border-white bg-blue-500 text-white font-medium">${months[i]}</td>
                <td class="p-1.5 border border-gray-200">${b.toFixed(2)}</td>
                <td class="p-1.5 border border-gray-200 font-semibold text-blue-700">${pol.toFixed(2)}</td>
                <td class="p-1.5 border border-gray-200">${temp.toFixed(1)}</td>
                <td class="p-1.5 border border-gray-200">${isAlbedo ? '-' : gHoriz.toFixed(2)}</td>
                <td class="p-1.5 border border-gray-200">${isAlbedo ? '-' : gAnn.toFixed(2)}</td>
                <td class="p-1.5 border border-gray-200">${isAlbedo ? '-' : gSea.toFixed(2)}</td>
                <td class="p-1.5 border border-gray-200">${isAlbedo ? '-' : gAzim.toFixed(2)}</td>
                <td class="p-1.5 border border-gray-200">${isAlbedo ? '-' : gHTrack.toFixed(2)}</td>
                <td class="p-1.5 border border-gray-200">${isAlbedo ? '-' : gDual.toFixed(2)}</td>
            </tr>`;
        }

        html += `<tr class="text-center text-[11px] font-bold text-gray-800 bg-white">
            <td class="p-1.5 border border-white bg-[#1E293B] text-white">MEDIA</td>
            <td class="p-1.5 border border-gray-200">${(sums.base/12).toFixed(2)}</td>
            <td class="p-1.5 border border-gray-200 text-blue-800">${(sums.pol/12).toFixed(2)}</td>
            <td class="p-1.5 border border-gray-200">${(sums.temp/12).toFixed(1)}</td>
            <td class="p-1.5 border border-gray-200">${isAlbedo ? '-' : (sums.gHoriz/12).toFixed(2)}</td>
            <td class="p-1.5 border border-gray-200">${isAlbedo ? '-' : (sums.gAnn/12).toFixed(2)}</td>
            <td class="p-1.5 border border-gray-200">${isAlbedo ? '-' : (sums.gSea/12).toFixed(2)}</td>
            <td class="p-1.5 border border-gray-200">${isAlbedo ? '-' : (sums.gAzim/12).toFixed(2)}</td>
            <td class="p-1.5 border border-gray-200">${isAlbedo ? '-' : (sums.gHTrack/12).toFixed(2)}</td>
            <td class="p-1.5 border border-gray-200">${isAlbedo ? '-' : (sums.gDual/12).toFixed(2)}</td>
        </tr>`;
        tbody.innerHTML = html;
    },

    /**
     * Renderiza la tabla para Seguimiento Azimutal (6 columnas de ganancias)
     */
    renderAzimuthalTable(results, parameters, climateData, ui, elements) {
        const months = ui.currentLang === 'en' ? monthsEn : monthsEs;
        const comp = ui.activeComponent;
        const px = { global: 'Gdm', direct: 'Bdm', diffuse: 'Ddm', albedo: 'Rdm' }[comp];
        const tbody = elements.resultsTableBody;
        const isAlbedo = comp === 'albedo';

        const vBase = isAlbedo ? new Array(12).fill(0) : (results.base[comp] || []);
        const vAzim = results.azimuthalAxis[comp] || [];
        const vOptAnnual = results.optimalAnnual[comp] || [];
        const vOptSeasonal = results.optimalSeasonal[comp] || [];
        const vPolar = results.polarAxis[comp] || [];
        const vHoriz = results.horizontalAxis[comp] || [];
        const vDual = results.dualAxis[comp] || [];
        const temperatures = climateData.monthlyTemperature || [];

        tbody.previousElementSibling.innerHTML = `
            <tr class="bg-blue-500 text-white text-[11px] text-center border-b border-white">
                <th class="p-1 border border-white font-normal bg-white" rowspan="2"></th>
                <th class="p-1 bg-blue-400 border border-white font-normal">${px} (0º)</th>
                <th class="p-1 bg-blue-400 border border-white font-normal">${px}</th>
                <th class="p-1 bg-blue-400 border border-white font-normal">Tª media</th>
                <th class="p-1 border border-white font-normal bg-[#102A5B]" colspan="6">Ganancias (%)</th>
            </tr>
            <tr class="bg-blue-500 text-white text-[11px] text-center">
                <th colspan="3" class="border border-white bg-transparent"></th>
                <th class="p-1 border border-white bg-[#3B82F6] font-normal">Plano horizontal</th>
                <th class="p-1 border border-white bg-[#3B82F6] font-normal">Inclinación ópt. anual</th>
                <th class="p-1 border border-white bg-[#3B82F6] font-normal">Inclin. ópt. estacional</th>
                <th class="p-1 border border-white bg-[#3B82F6] font-normal">Seg. a un eje polar</th>
                <th class="p-1 border border-white bg-[#3B82F6] font-normal">Seg. a un eje horizontal</th>
                <th class="p-1 border border-white bg-[#3B82F6] font-normal">Seg. a dos ejes</th>
            </tr>
        `;

        let html = '';
        let sums = { base:0, azim:0, temp:0, gHoriz:0, gAnn:0, gSea:0, gPolar:0, gHTrack:0, gDual:0 };

        for (let i = 0; i < 12; i++) {
            const b = vBase[i] || 0, az = vAzim[i] || 0, temp = temperatures[i] || 0;
            const ann = vOptAnnual[i] || 0, sea = vOptSeasonal[i] || 0, pol = vPolar[i] || 0, hz = vHoriz[i] || 0, dl = vDual[i] || 0;

            const gHoriz = (!isAlbedo && b > 0) ? ((az / b) - 1) * 100 : 0;
            const gAnn = (!isAlbedo && ann > 0) ? ((az / ann) - 1) * 100 : 0;
            const gSea = (!isAlbedo && sea > 0) ? ((az / sea) - 1) * 100 : 0;
            const gPolar = (!isAlbedo && pol > 0) ? ((az / pol) - 1) * 100 : 0;
            const gHTrack = (!isAlbedo && hz > 0) ? ((az / hz) - 1) * 100 : 0;
            const gDual = (!isAlbedo && dl > 0) ? ((az / dl) - 1) * 100 : 0;

            sums.base+=b; sums.azim+=az; sums.temp+=temp; sums.gHoriz+=gHoriz; sums.gAnn+=gAnn; sums.gSea+=gSea; sums.gPolar+=gPolar; sums.gHTrack+=gHTrack; sums.gDual+=gDual;

            html += `<tr class="text-center text-[11px] text-gray-700 bg-white hover:bg-blue-50">
                <td class="p-1.5 border border-white bg-blue-500 text-white font-medium">${months[i]}</td>
                <td class="p-1.5 border border-gray-200">${b.toFixed(2)}</td>
                <td class="p-1.5 border border-gray-200 font-semibold text-blue-700">${az.toFixed(2)}</td>
                <td class="p-1.5 border border-gray-200">${temp.toFixed(1)}</td>
                <td class="p-1.5 border border-gray-200">${isAlbedo ? '-' : gHoriz.toFixed(2)}</td>
                <td class="p-1.5 border border-gray-200">${isAlbedo ? '-' : gAnn.toFixed(2)}</td>
                <td class="p-1.5 border border-gray-200">${isAlbedo ? '-' : gSea.toFixed(2)}</td>
                <td class="p-1.5 border border-gray-200">${isAlbedo ? '-' : gPolar.toFixed(2)}</td>
                <td class="p-1.5 border border-gray-200">${isAlbedo ? '-' : gHTrack.toFixed(2)}</td>
                <td class="p-1.5 border border-gray-200">${isAlbedo ? '-' : gDual.toFixed(2)}</td>
            </tr>`;
        }

        html += `<tr class="text-center text-[11px] font-bold text-gray-800 bg-white">
            <td class="p-1.5 border border-white bg-[#1E293B] text-white">MEDIA</td>
            <td class="p-1.5 border border-gray-200">${(sums.base/12).toFixed(2)}</td>
            <td class="p-1.5 border border-gray-200 text-blue-800">${(sums.azim/12).toFixed(2)}</td>
            <td class="p-1.5 border border-gray-200">${(sums.temp/12).toFixed(1)}</td>
            <td class="p-1.5 border border-gray-200">${isAlbedo ? '-' : (sums.gHoriz/12).toFixed(2)}</td>
            <td class="p-1.5 border border-gray-200">${isAlbedo ? '-' : (sums.gAnn/12).toFixed(2)}</td>
            <td class="p-1.5 border border-gray-200">${isAlbedo ? '-' : (sums.gSea/12).toFixed(2)}</td>
            <td class="p-1.5 border border-gray-200">${isAlbedo ? '-' : (sums.gPolar/12).toFixed(2)}</td>
            <td class="p-1.5 border border-gray-200">${isAlbedo ? '-' : (sums.gHTrack/12).toFixed(2)}</td>
            <td class="p-1.5 border border-gray-200">${isAlbedo ? '-' : (sums.gDual/12).toFixed(2)}</td>
        </tr>`;
        tbody.innerHTML = html;
    },

    /**
     * Renderiza la tabla para Seguimiento Horizontal (6 columnas de ganancias)
     */
    renderHorizontalTable(results, parameters, climateData, ui, elements) {
        const months = ui.currentLang === 'en' ? monthsEn : monthsEs;
        const comp = ui.activeComponent;
        const px = { global: 'Gdm', direct: 'Bdm', diffuse: 'Ddm', albedo: 'Rdm' }[comp];
        const tbody = elements.resultsTableBody;
        const isAlbedo = comp === 'albedo';

        const vBase = isAlbedo ? new Array(12).fill(0) : (results.base[comp] || []);
        const vHoriz = results.horizontalAxis[comp] || [];
        const vOptAnnual = results.optimalAnnual[comp] || [];
        const vOptSeasonal = results.optimalSeasonal[comp] || [];
        const vPolar = results.polarAxis[comp] || [];
        const vAzim = results.azimuthalAxis[comp] || [];
        const vDual = results.dualAxis[comp] || [];
        const temperatures = climateData.monthlyTemperature || [];

        tbody.previousElementSibling.innerHTML = `
            <tr class="bg-blue-500 text-white text-[11px] text-center border-b border-white">
                <th class="p-1 border border-white font-normal bg-white" rowspan="2"></th>
                <th class="p-1 bg-blue-400 border border-white font-normal">${px} (0º)</th>
                <th class="p-1 bg-blue-400 border border-white font-normal">${px}</th>
                <th class="p-1 bg-blue-400 border border-white font-normal">Tª media</th>
                <th class="p-1 border border-white font-normal bg-[#102A5B]" colspan="6">Ganancias (%)</th>
            </tr>
            <tr class="bg-blue-500 text-white text-[11px] text-center">
                <th colspan="3" class="border border-white bg-transparent"></th>
                <th class="p-1 border border-white bg-[#3B82F6] font-normal">Plano horizontal</th>
                <th class="p-1 border border-white bg-[#3B82F6] font-normal">Inclinación ópt. anual</th>
                <th class="p-1 border border-white bg-[#3B82F6] font-normal">Inclin. ópt. estacional</th>
                <th class="p-1 border border-white bg-[#3B82F6] font-normal">Seg. a un eje polar</th>
                <th class="p-1 border border-white bg-[#3B82F6] font-normal">Seg. a un eje azimutal</th>
                <th class="p-1 border border-white bg-[#3B82F6] font-normal">Seg. a dos ejes</th>
            </tr>
        `;

        let html = '';
        let sums = { base:0, hz:0, temp:0, gHoriz:0, gAnn:0, gSea:0, gPolar:0, gAzim:0, gDual:0 };

        for (let i = 0; i < 12; i++) {
            const b = vBase[i] || 0, hz = vHoriz[i] || 0, temp = temperatures[i] || 0;
            const ann = vOptAnnual[i] || 0, sea = vOptSeasonal[i] || 0, pol = vPolar[i] || 0, az = vAzim[i] || 0, dl = vDual[i] || 0;

            const gHoriz = (!isAlbedo && b > 0) ? ((hz / b) - 1) * 100 : 0;
            const gAnn = (!isAlbedo && ann > 0) ? ((hz / ann) - 1) * 100 : 0;
            const gSea = (!isAlbedo && sea > 0) ? ((hz / sea) - 1) * 100 : 0;
            const gPolar = (!isAlbedo && pol > 0) ? ((hz / pol) - 1) * 100 : 0;
            const gAzim = (!isAlbedo && az > 0) ? ((hz / az) - 1) * 100 : 0;
            const gDual = (!isAlbedo && dl > 0) ? ((hz / dl) - 1) * 100 : 0;

            sums.base+=b; sums.hz+=hz; sums.temp+=temp; sums.gHoriz+=gHoriz; sums.gAnn+=gAnn; sums.gSea+=gSea; sums.gPolar+=gPolar; sums.gAzim+=gAzim; sums.gDual+=gDual;

            html += `<tr class="text-center text-[11px] text-gray-700 bg-white hover:bg-blue-50">
                <td class="p-1.5 border border-white bg-blue-500 text-white font-medium">${months[i]}</td>
                <td class="p-1.5 border border-gray-200">${b.toFixed(2)}</td>
                <td class="p-1.5 border border-gray-200 font-semibold text-blue-700">${hz.toFixed(2)}</td>
                <td class="p-1.5 border border-gray-200">${temp.toFixed(1)}</td>
                <td class="p-1.5 border border-gray-200">${isAlbedo ? '-' : gHoriz.toFixed(2)}</td>
                <td class="p-1.5 border border-gray-200">${isAlbedo ? '-' : gAnn.toFixed(2)}</td>
                <td class="p-1.5 border border-gray-200">${isAlbedo ? '-' : gSea.toFixed(2)}</td>
                <td class="p-1.5 border border-gray-200">${isAlbedo ? '-' : gPolar.toFixed(2)}</td>
                <td class="p-1.5 border border-gray-200">${isAlbedo ? '-' : gAzim.toFixed(2)}</td>
                <td class="p-1.5 border border-gray-200">${isAlbedo ? '-' : gDual.toFixed(2)}</td>
            </tr>`;
        }

        html += `<tr class="text-center text-[11px] font-bold text-gray-800 bg-white">
            <td class="p-1.5 border border-white bg-[#1E293B] text-white">MEDIA</td>
            <td class="p-1.5 border border-gray-200">${(sums.base/12).toFixed(2)}</td>
            <td class="p-1.5 border border-gray-200 text-blue-800">${(sums.hz/12).toFixed(2)}</td>
            <td class="p-1.5 border border-gray-200">${(sums.temp/12).toFixed(1)}</td>
            <td class="p-1.5 border border-gray-200">${isAlbedo ? '-' : (sums.gHoriz/12).toFixed(2)}</td>
            <td class="p-1.5 border border-gray-200">${isAlbedo ? '-' : (sums.gAnn/12).toFixed(2)}</td>
            <td class="p-1.5 border border-gray-200">${isAlbedo ? '-' : (sums.gSea/12).toFixed(2)}</td>
            <td class="p-1.5 border border-gray-200">${isAlbedo ? '-' : (sums.gPolar/12).toFixed(2)}</td>
            <td class="p-1.5 border border-gray-200">${isAlbedo ? '-' : (sums.gAzim/12).toFixed(2)}</td>
            <td class="p-1.5 border border-gray-200">${isAlbedo ? '-' : (sums.gDual/12).toFixed(2)}</td>
        </tr>`;
        tbody.innerHTML = html;
    },

    /**
     * Renderiza la tabla para el Modo 7: Comparativa de todos los tipos de estudios (Figura 6.3.20)
     */
    renderComparativeTable(results, parameters, climateData, ui, elements) {
        const months = ui.currentLang === 'en' ? monthsEn : monthsEs;
        const comp = ui.activeComponent;
        const px = { global: 'Gdm', direct: 'Bdm', diffuse: 'Ddm', albedo: 'Rdm' }[comp];
        const tbody = elements.resultsTableBody;
        const isAlbedo = comp === 'albedo';

        const vBase = isAlbedo ? new Array(12).fill(0) : (results.base[comp] || []);
        const vAnn = results.optimalAnnual[comp] || [];
        const vSea = results.optimalSeasonal[comp] || [];
        const vPol = results.polarAxis[comp] || [];
        const vAzi = results.azimuthalAxis[comp] || [];
        const vHz = results.horizontalAxis[comp] || [];
        const vDual = results.dualAxis[comp] || [];
        const temperatures = climateData.monthlyTemperature || [];

        // Cabecera basada en la Figura 6.3.20 (Valores absolutos)
        tbody.previousElementSibling.innerHTML = `
            <tr class="bg-blue-500 text-white text-[11px] text-center border-b border-white">
                <th class="p-1.5 border border-white font-normal bg-white"></th>
                <th class="p-1.5 border border-white font-normal">${px} (0º)</th>
                <th class="p-1.5 border border-white font-normal">${px} (Inclinación ópt. anual)</th>
                <th class="p-1.5 border border-white font-normal">${px} (Inclinación ópt. estacional)</th>
                <th class="p-1.5 border border-white font-normal">${px} (Seguim. a un eje polar)</th>
                <th class="p-1.5 border border-white font-normal">${px} (Seguim. a un eje azimutal)</th>
                <th class="p-1.5 border border-white font-normal">${px} (Seguim. a un eje horizontal)</th>
                <th class="p-1.5 border border-white font-normal">${px} (Seguim. a dos ejes)</th>
                <th class="p-1.5 border border-white font-normal">Temperatura media</th>
            </tr>
        `;

        let html = '';
        let sums = { b:0, an:0, se:0, po:0, az:0, hz:0, du:0, t:0 };

        for (let i = 0; i < 12; i++) {
            const b = vBase[i] || 0, an = vAnn[i] || 0, se = vSea[i] || 0, po = vPol[i] || 0;
            const az = vAzi[i] || 0, hz = vHz[i] || 0, du = vDual[i] || 0, t = temperatures[i] || 0;

            sums.b+=b; sums.an+=an; sums.se+=se; sums.po+=po; sums.az+=az; sums.hz+=hz; sums.du+=du; sums.t+=t;

            html += `<tr class="text-center text-[11px] text-gray-700 bg-white hover:bg-blue-50">
                <td class="p-1.5 border border-white bg-blue-500 text-white font-medium">${months[i]}</td>
                <td class="p-1.5 border border-gray-200">${b.toFixed(2)}</td>
                <td class="p-1.5 border border-gray-200">${an.toFixed(2)}</td>
                <td class="p-1.5 border border-gray-200">${se.toFixed(2)}</td>
                <td class="p-1.5 border border-gray-200">${po.toFixed(2)}</td>
                <td class="p-1.5 border border-gray-200">${az.toFixed(2)}</td>
                <td class="p-1.5 border border-gray-200">${hz.toFixed(2)}</td>
                <td class="p-1.5 border border-gray-200">${du.toFixed(2)}</td>
                <td class="p-1.5 border border-gray-200">${t.toFixed(1)}</td>
            </tr>`;
        }

        html += `<tr class="text-center text-[11px] font-bold text-gray-800 bg-white">
            <td class="p-1.5 border border-white bg-[#1E293B] text-white">MEDIA</td>
            <td class="p-1.5 border border-gray-200">${(sums.b/12).toFixed(2)}</td>
            <td class="p-1.5 border border-gray-200">${(sums.an/12).toFixed(2)}</td>
            <td class="p-1.5 border border-gray-200">${(sums.se/12).toFixed(2)}</td>
            <td class="p-1.5 border border-gray-200">${(sums.po/12).toFixed(2)}</td>
            <td class="p-1.5 border border-gray-200">${(sums.az/12).toFixed(2)}</td>
            <td class="p-1.5 border border-gray-200">${(sums.hz/12).toFixed(2)}</td>
            <td class="p-1.5 border border-gray-200">${(sums.du/12).toFixed(2)}</td>
            <td class="p-1.5 border border-gray-200">${(sums.t/12).toFixed(1)}</td>
        </tr>`;
        tbody.innerHTML = html;
    },

    /**
     * Renderiza la tabla para el Modo 6: Seguimiento a dos ejes (Figura 6.3.19)
     */
    renderDualAxisTable(results, parameters, climateData, ui, elements) {
        const monthsEs = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
        const monthsEn = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
        const months = ui.currentLang === 'en' ? monthsEn : monthsEs;
        
        const comp = ui.activeComponent;
        const prefixes = { global: 'Gdm', direct: 'Bdm', diffuse: 'Ddm', albedo: 'Rdm' };
        const px = prefixes[comp];

        const tbody = elements.resultsTableBody;
        const thead = tbody.previousElementSibling;
        const isAlbedo = comp === 'albedo';

        // Extraer vectores de datos desde el Estado
        const vBase = isAlbedo ? new Array(12).fill(0) : (results.base[comp] || []);
        const vDual = results.dualAxis[comp] || [];
        const vOptAnnual = results.optimalAnnual[comp] || [];
        const vOptSeasonal = results.optimalSeasonal[comp] || [];
        const vPolar = results.polarAxis[comp] || [];
        const vAzim = results.azimuthalAxis[comp] || [];
        const vHoriz = results.horizontalAxis[comp] || [];
        const temperatures = climateData.monthlyTemperature || [];

        // Cabecera basada en la Figura 6.3.19 (6 columnas de ganancias)
        thead.innerHTML = `
            <tr class="bg-blue-500 text-white text-[11px] text-center border-b border-white">
                <th class="p-1 border border-white font-normal bg-white" rowspan="2"></th>
                <th class="p-1 bg-blue-400 border border-white font-normal">${px} (0º)</th>
                <th class="p-1 bg-blue-400 border border-white font-normal">${px}</th>
                <th class="p-1 bg-blue-400 border border-white font-normal">Tª media</th>
                <th class="p-1 border border-white font-normal bg-[#102A5B]" colspan="6">Ganancias (%)</th>
            </tr>
            <tr class="bg-blue-500 text-white text-[11px] text-center">
                <th colspan="3" class="border border-white bg-transparent"></th>
                <th class="p-1 border border-white bg-[#3B82F6] font-normal">Plano horizontal</th>
                <th class="p-1 border border-white bg-[#3B82F6] font-normal">Inclinación ópt. anual</th>
                <th class="p-1 border border-white bg-[#3B82F6] font-normal">Inclin. ópt. estacional</th>
                <th class="p-1 border border-white bg-[#3B82F6] font-normal">Seg. a un eje polar</th>
                <th class="p-1 border border-white bg-[#3B82F6] font-normal">Seg. a un eje azimutal</th>
                <th class="p-1 border border-white bg-[#3B82F6] font-normal">Seg. a un eje horizontal</th>
            </tr>
        `;

        let html = '';
        let sums = { base: 0, dual: 0, temp: 0, gHoriz: 0, gAnnual: 0, gSea: 0, gPolar: 0, gAzim: 0, gHTrack: 0 };

        for (let i = 0; i < 12; i++) {
            const b = vBase[i] || 0;
            const dl = vDual[i] || 0;
            const temp = temperatures[i] || 0;
            const ann = vOptAnnual[i] || 0;
            const sea = vOptSeasonal[i] || 0;
            const pol = vPolar[i] || 0;
            const az = vAzim[i] || 0;
            const hz = vHoriz[i] || 0;

            // Fórmulas de ganancias relativas porcentuales
            const gHoriz = (!isAlbedo && b > 0) ? ((dl / b) - 1) * 100 : 0;
            const gAnnual = (!isAlbedo && ann > 0) ? ((dl / ann) - 1) * 100 : 0;
            const gSea = (!isAlbedo && sea > 0) ? ((dl / sea) - 1) * 100 : 0;
            const gPolar = (!isAlbedo && pol > 0) ? ((dl / pol) - 1) * 100 : 0;
            const gAzim = (!isAlbedo && az > 0) ? ((dl / az) - 1) * 100 : 0;
            const gHTrack = (!isAlbedo && hz > 0) ? ((dl / hz) - 1) * 100 : 0;

            sums.base += b; sums.dual += dl; sums.temp += temp;
            sums.gHoriz += gHoriz; sums.gAnnual += gAnnual; sums.gSea += gSea;
            sums.gPolar += gPolar; sums.gAzim += gAzim; sums.gHTrack += gHTrack;

            html += `
                <tr class="text-center text-[11px] text-gray-700 bg-white hover:bg-blue-50">
                    <td class="p-1.5 border border-white bg-blue-500 text-white font-medium">${months[i]}</td>
                    <td class="p-1.5 border border-gray-200">${b.toFixed(2)}</td>
                    <td class="p-1.5 border border-gray-200 font-semibold text-blue-700">${dl.toFixed(2)}</td>
                    <td class="p-1.5 border border-gray-200">${temp.toFixed(1)}</td>
                    <td class="p-1.5 border border-gray-200">${isAlbedo ? '-' : gHoriz.toFixed(2)}</td>
                    <td class="p-1.5 border border-gray-200">${isAlbedo ? '-' : gAnnual.toFixed(2)}</td>
                    <td class="p-1.5 border border-gray-200">${isAlbedo ? '-' : gSea.toFixed(2)}</td>
                    <td class="p-1.5 border border-gray-200">${isAlbedo ? '-' : gPolar.toFixed(2)}</td>
                    <td class="p-1.5 border border-gray-200">${isAlbedo ? '-' : gAzim.toFixed(2)}</td>
                    <td class="p-1.5 border border-gray-200">${isAlbedo ? '-' : gHTrack.toFixed(2)}</td>
                </tr>
            `;
        }

        html += `
            <tr class="text-center text-[11px] font-bold text-gray-800 bg-white">
                <td class="p-1.5 border border-white bg-[#1E293B] text-white">MEDIA</td>
                <td class="p-1.5 border border-gray-200">${(sums.base / 12).toFixed(2)}</td>
                <td class="p-1.5 border border-gray-200 text-blue-800">${(sums.dual / 12).toFixed(2)}</td>
                <td class="p-1.5 border border-gray-200">${(sums.temp / 12).toFixed(2)}</td>
                <td class="p-1.5 border border-gray-200">${isAlbedo ? '-' : (sums.gHoriz / 12).toFixed(2)}</td>
                <td class="p-1.5 border border-gray-200">${isAlbedo ? '-' : (sums.gAnnual / 12).toFixed(2)}</td>
                <td class="p-1.5 border border-gray-200">${isAlbedo ? '-' : (sums.gSea / 12).toFixed(2)}</td>
                <td class="p-1.5 border border-gray-200">${isAlbedo ? '-' : (sums.gPolar / 12).toFixed(2)}</td>
                <td class="p-1.5 border border-gray-200">${isAlbedo ? '-' : (sums.gAzim / 12).toFixed(2)}</td>
                <td class="p-1.5 border border-gray-200">${isAlbedo ? '-' : (sums.gHTrack / 12).toFixed(2)}</td>
            </tr>
        `;
        tbody.innerHTML = html;
    },

    /**
     * Renderiza la tabla estándar para los modos 2 al 7 (Estacional, Seguimientos, etc.)
     */
    renderStandardTable(results, parameters, ui, elements) {
        const t = ui.dict || {};
        const months = ui.currentLang === 'en' ? monthsEn : monthsEs;
        const comp = ui.activeComponent;
        
        const studyKeys = {
            2: 'optimalSeasonal', 3: 'polarAxis',
            4: 'azimuthalAxis', 5: 'horizontalAxis', 6: 'dualAxis', 7: 'optimalAnnual'
        };

        const activeKey = studyKeys[parameters.studyMode];
        const studyObj = results[activeKey];
        const tbody = elements.resultsTableBody;
        const thead = tbody.previousElementSibling;

        if (!studyObj || !studyObj[comp] || studyObj[comp].length === 0) {
            tbody.innerHTML = `<tr><td colspan="4" class="text-center p-4 text-gray-500">${t.emptyTableMsg || 'Ejecute la simulación.'}</td></tr>`;
            return;
        }

        let baseData = results.base[comp];
        let studyData = studyObj[comp];
        let gainsPercentages = studyObj.gains ? studyObj.gains[comp] : null;

        thead.innerHTML = `
            <tr class="bg-gray-800 text-white text-xs">
                <th class="p-2 border border-gray-400">${t.tableMonth || 'Mes'}</th>
                <th class="p-2 border border-gray-400">${t.tableHorizontal || 'Plano Horizontal (0°)'}</th>
                <th class="p-2 border border-gray-400">${t.tableStudy || 'Estudio Seleccionado'}</th>
                <th class="p-2 border border-gray-400">${t.tableGain || 'Ganancia (%)'}</th>
            </tr>
        `;

        let html = '';
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
        tbody.innerHTML = html;
    }
};