/**
 * ==========================================
 * Archivo: src/ui/energyModal.js
 * Propósito: Carga dinámica del template y gestión del modal de energía
 * ==========================================
 */
import { State } from '../state.js';
import { Energy } from '../core/energy.js';
import { showAlert } from '../ui.js';
import { exportToCSV, generatePDF } from '../export.js';

export async function initEnergyModal() {
    try {
        // Cargar dinámicamente la plantilla HTML externa si no existe aún en el DOM
        if (!document.getElementById('energyModal')) {
            const response = await fetch('./assets/templates/energy-modal.html');
            const htmlText = await response.text();
            document.body.insertAdjacentHTML('beforeend', htmlText);
        }

        const energyModal = document.getElementById('energyModal');

        // 1. Abrir modal
        document.getElementById('btnOpenEnergy').addEventListener('click', () => {
            if (!State.results.base.global || State.results.base.global.length === 0) {
                return showAlert("Ejecute primero una simulación matemática de radiación.", true);
            }
            document.getElementById('energyCity').textContent = State.location.name;
            document.getElementById('energyLat').textContent = State.location.latitude.toFixed(2);
            energyModal.classList.remove('hidden');
        });

        // 2. Cerrar modal
        document.getElementById('btnCloseEnergy').addEventListener('click', () => { energyModal.classList.add('hidden'); });
        document.getElementById('btnExitEnergy').addEventListener('click', () => { energyModal.classList.add('hidden'); });

        // 3. Ejecutar cálculo energético por el Modelo de Osterwald
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
            for(let i = 0; i < 12; i++) {
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

        // 4. Exportaciones desde el modal
        document.getElementById('btnExportEnergyCSV').addEventListener('click', () => {
            showAlert("Exportando CSV de Energía...");
            exportToCSV(); 
        });
        document.getElementById('btnExportEnergyPDF').addEventListener('click', () => {
            generatePDF(); 
        });

    } catch (error) {
        console.error("Error al cargar la plantilla del modal de energía:", error);
    }
}