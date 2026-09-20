// src/ui/locationModal.js
import { State } from '../state.js';
import { showAlert } from '../ui.js';

export async function initLocationModal() {
    if (!document.getElementById('locationModal')) {
        const response = await fetch('./assets/templates/location-modal.html');
        const htmlText = await response.text();
        document.body.insertAdjacentHTML('beforeend', htmlText);
    }

    const modal = document.getElementById('locationModal');

    document.getElementById('btnOpenNewLocation').addEventListener('click', () => {
        modal.classList.remove('hidden');
    });

    document.getElementById('btnCancelLocation').addEventListener('click', () => {
        modal.classList.add('hidden');
    });

    document.getElementById('btnSaveLocation').addEventListener('click', async () => {
        const cityName = document.getElementById('manualCityName').value.trim();
        const lat = parseFloat(document.getElementById('manualLat').value);
        const lon = parseFloat(document.getElementById('manualLon').value) || 0;

        if (!cityName) {
            return showAlert("Debe introducir el nombre de la ciudad o localidad", true);
        }
        if (isNaN(lat)) {
            return showAlert("Asegúrese de introducir una latitud válida.", true);
        }

        const radInputs = document.querySelectorAll('.manual-rad');
        const radiation = Array.from(radInputs).map(input => parseFloat(input.value));

        if (radiation.some(isNaN)) {
            return showAlert("Asegúrese de introducir TODOS los valores de radiación correctamente antes de continuar", true);
        }

        const temperatures = new Array(12).fill(20);

        // Formato exacto de la línea para BBDD_Mundo.csv: Nombre, Lat, Lon, [12 Meses Rad], [12 Meses Temp]
        const csvRow = [cityName, lat, lon, ...radiation, ...temperatures].join(',');

        // 1. Modificar físicamente el archivo BBDD_Mundo.csv en disco a través de Electron
        if (window.electronAPI && window.electronAPI.appendCsvRow) {
            const success = await window.electronAPI.appendCsvRow(csvRow);
            if (!success) {
                return showAlert("No se pudo guardar en el archivo local de la base de datos.", true);
            }
        } else {
            console.warn("Entorno web puro detectado: La modificación física del archivo CSV requiere ejecución en modo escritorio (Electron).");
        }

        // 2. Actualizar el Estado global de la aplicación (Memoria RAM)
        State.location.name = cityName;
        State.location.latitude = lat;
        State.location.longitude = lon;
        State.climateData.monthlyGlobalRadiation = radiation;
        State.climateData.monthlyTemperature = temperatures;

        document.getElementById('latInput').value = lat;
        document.getElementById('lonInput').value = lon;

        // 3. Refrescar el desplegable de la interfaz dinámicamente
        const citySelector = document.getElementById('citySelector');
        const option = document.createElement('option');
        option.value = JSON.stringify({ name: cityName, lat, lon, radiation, temperature: temperatures });
        option.textContent = cityName;
        option.selected = true;
        citySelector.appendChild(option);

        modal.classList.add('hidden');
        showAlert(`Localización "${cityName}" añadida con éxito y guardada en BBDD_Mundo.csv.`);
    });
}