// ==========================================
// Archivo: src/data.js
// Propósito: Gestión asíncrona de datos (API PVGIS y parser CSV local)
// ==========================================
import { State } from './state.js'
import { showAlert } from './ui.js'

// 1. Carga de la Base de Datos Predeterminada (Offline / Contingencia)
export async function loadDefaultDatabase() {
    try {

        const response = await fetch('./input_data/BBDD_Mundo.csv'); 
        
        if (!response.ok) throw new Error("Archivo de base de datos no encontrado.");
        
        const csvText = await response.text();
        const rows = csvText.split('\n');
        const citySelector = document.getElementById('citySelector');
        
        // Iteramos omitiendo la cabecera
        rows.slice(1).forEach((row, index) => {
            if (!row.trim()) return;
            const cols = row.split(',');
            
            // Creamos las opciones dinámicamente en el select de la UI
            const option = document.createElement('option');
            option.value = JSON.stringify({
                name: cols[0],
                lat: parseFloat(cols[1]),
                lon: parseFloat(cols[2]),
                radiation: cols.slice(3, 15).map(Number), // Meses 1 a 12
                temperature: cols.slice(15, 27).map(Number) // Temperaturas
            });
            option.textContent = cols[0];
            citySelector.appendChild(option);
        });

        // Evento: Al seleccionar ciudad, inyectar en el Estado
        citySelector.addEventListener('change', (e) => {
            if (!e.target.value) return;
            const data = JSON.parse(e.target.value);
            
            document.getElementById('latInput').value = data.lat;
            document.getElementById('lonInput').value = data.lon;
            
            State.climateData.monthlyGlobalRadiation = data.radiation;
            State.climateData.monthlyTemperature = data.temperature;
            State.location.name = data.name;
        });

    } catch (error) {
        console.error("Modo Offline Activo: ", error);
    }
}

// 2. Conexión a la API Satelital PVGIS
export async function fetchWeatherDataAPI(lat, lon) {
    try {
        // Endpoint oficial PVGIS - Extrae irradiancia mensual horizontal
        const url = `https://re.jrc.ec.europa.eu/api/MRcalc?lat=${lat}&lon=${lon}&horirrad=1&outputformat=json`;
        const response = await fetch(url);
        
        if (!response.ok) throw new Error("Fallo de red o coordenadas fuera del alcance de PVGIS.");
        
        const rawData = await response.json();
        
        // Parsear los 12 meses (extrayendo radiación H(h) y Temperatura T24h)
        const monthlyData = rawData.outputs.monthly.default;
        State.climateData.monthlyGlobalRadiation = monthlyData.map(m => m.H_m); // kWh/m2
        State.climateData.monthlyTemperature = monthlyData.map(m => m.T24h);    // ºC
        State.location.name = `Coordenadas: ${lat}, ${lon}`;
        
    } catch (error) {
        throw error;
    }
}

export function handleCSVUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async function(e) {
        try {
            const rows = e.target.result.split('\n');
            const citySelector = document.getElementById('citySelector');
            let count = 0;

            // Omitir cabecera e iterar todas las filas
            for (let i = 1; i < rows.length; i++) {
                const row = rows[i].trim();
                if (!row) continue;
                const cols = row.split(',');

                const name = cols[0];
                const lat = parseFloat(cols[1]);
                const lon = parseFloat(cols[2]);
                const radiation = cols.slice(3, 15).map(Number);
                const temperature = cols.slice(15, 27).map(Number);

                // Crear opción dinámica en el desplegable
                const option = document.createElement('option');
                option.value = JSON.stringify({ name, lat, lon, radiation, temperature });
                option.textContent = name;
                citySelector.appendChild(option);
                count++;
            }

            showAlert(`Se han cargado ${count} nuevos emplazamientos masivamente desde el CSV.`);
        } catch (err) {
            showAlert("Error al parsear el archivo CSV masivo. Compruebe el formato.", true);
        }
    };
    reader.readAsText(file);
}