// ==========================================
// Archivo: src/data.js
// Propósito: Gestión asíncrona de datos (API PVGIS y parser CSV local)
// ==========================================
import { State } from './state.js'
import { showAlert } from './ui.js'

export async function loadDefaultDatabase() {
    try {
        const citySelector = document.getElementById('citySelector');
        citySelector.innerHTML = '<option value="">-- Seleccionar Ciudad --</option>';

        if (window.electronAPI && window.electronAPI.getLocations) {
            // Obtenemos TODAS las filas (ej. 12 filas por ciudad)
            const rows = await window.electronAPI.getLocations();

            // Objeto diccionario para agrupar las filas por ciudad
            const citiesMap = {};

            rows.forEach((row) => {
                const cityName = row.nombre_emplazamiento;

                // Si la ciudad no existe aún en el diccionario, la inicializamos
                if (!citiesMap[cityName]) {
                    citiesMap[cityName] = {
                        name: cityName,
                        lat: parseFloat(row.latitud),
                        lon: parseFloat(row.longitud),
                        radiation: [],
                        temperature: []
                    };
                }

                // Añadimos el dato mensual al array de la ciudad
                // ¡Asegúrate de que 'radiacion' y 'temperatura' sean los nombres reales de tus columnas en SQLite!
                citiesMap[cityName].radiation.push(parseFloat(row.radiacion_media) || 0);
                citiesMap[cityName].temperature.push(parseFloat(row.temp_media) || 20);
            });

            // Volcamos las ciudades ya agrupadas en el desplegable HTML
            Object.values(citiesMap).forEach(cityData => {
                const option = document.createElement('option');
                option.value = JSON.stringify(cityData);
                option.textContent = cityData.name;
                citySelector.appendChild(option);
            });
        }

        // Sincronizar selección con el Estado Global
        citySelector.addEventListener('change', (e) => {
            if (!e.target.value) return;
            const data = JSON.parse(e.target.value);
            
            document.getElementById('latInput').value = data.lat;
            document.getElementById('lonInput').value = data.lon;
            
            State.climateData.monthlyGlobalRadiation = data.radiation;
            State.climateData.monthlyTemperature = data.temperature;
            State.location.name = data.name;
            State.location.latitude = data.lat;
            State.location.longitude = data.lon;
        });

    } catch (error) {
        console.error("Error cargando base de datos SQLite: ", error);
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