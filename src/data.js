/**
 * MÓDULO DE GESTIÓN DE DATOS HÍBRIDA (Carga Dual)
 * Gestiona la conexión a APIs (Online) y la lectura de archivos locales (Offline)
 */

// 1. Carga Offline: Lectura de archivos locales (CSV)
/**
 * src/data.js
 * MÓDULO DE GESTIÓN DE DATOS HÍBRIDA (Carga Local CSV)
 */

export function handleLocalCSVUpload(file, callback) {
    const reader = new FileReader();
    
    reader.onload = (event) => {
        const text = event.target.result;
        const rows = text.split('\n');
        
        let monthlyRadiation = [];
        let monthlyTemp = [];
        
        // Asumimos un CSV donde las filas son meses y las columnas son: Mes, Gdm(0º), Temperatura
        for(let i = 0; i < 12; i++) {
            if(rows[i]) {
                const columns = rows[i].split(',');
                if(columns.length >= 2) {
                    monthlyRadiation.push(parseFloat(columns[1])); // Columna 2: Radiación
                    // Si existe la columna de temperatura, la guardamos
                    if(columns[2]) monthlyTemp.push(parseFloat(columns[2])); 
                }
            }
        }
        
        console.log("Archivo Local Procesado exitosamente.");
        callback({
            radiation: monthlyRadiation,
            temperature: monthlyTemp.length === 12 ? monthlyTemp : null
        });
    };
    
    reader.onerror = (error) => {
        console.error("Error al leer el archivo CSV local:", error);
        alert("Ocurrió un error al procesar el archivo. Verifique el formato.");
    };
    
    reader.readAsText(file);
}

// 2. Carga Online: Consumo de API en tiempo real (PVGIS)
export async function fetchWeatherDataAPI(lat, lon) {
    // 1. Comprobación de conectividad (Arquitectura Híbrida)
    if (!navigator.onLine) {
        throw new Error("No hay conexión a internet. Use el modo de carga manual (offline).");
    }

    console.log(`📡 Conectando a la API de PVGIS para Lat: ${lat}, Lon: ${lon}...`);

    // 2. Construcción dinámica de la URL
    // Parámetros: lat/lon (coordenadas numéricas), horirrad=1 (Irradiación horizontal), outputformat=json
    const pvgisURL = `https://re.jrc.ec.europa.eu/api/MRcalc?lat=${lat}&lon=${lon}&horirrad=1&outputformat=json`;

    try {
        // 3. Petición Asíncrona (Fetch)
        const response = await fetch(pvgisURL);
        
        if (!response.ok) {
             throw new Error(`Error HTTP: ${response.status} - El servidor de PVGIS rechazó la consulta.`);
        }

        // 4. Extracción de los datos en formato JSON
        const rawData = await response.json();
        
        let monthlyRadiation = [];
        let monthlyTemp = [];

        // 5. Mapeo de la estructura de PVGIS a nuestro State
        // PVGIS devuelve los datos mensuales dentro del array: rawData.outputs.monthly
        if (rawData.outputs && rawData.outputs.monthly) {
            rawData.outputs.monthly.forEach(monthData => {
                // "H(h)_d" es el promedio de irradiación global horizontal diaria mensual (kWh/m2/día)
                monthlyRadiation.push(monthData['H(h)_d']); 
                
                // "T2m" es la temperatura media mensual a 2 metros de altura
                monthlyTemp.push(monthData['T2m'] || 20); // Valor por defecto por seguridad
            });
        } else {
             throw new Error("El formato de respuesta de PVGIS no es el esperado.");
        }

        console.log("✅ Datos descargados con éxito de PVGIS:");
        console.log("- Radiación (Gdm0):", monthlyRadiation);
        console.log("- Temperatura:", monthlyTemp);

        // 6. Retornamos los vectores limpios para que app.js los inyecte en el State
        return {
            radiation: monthlyRadiation,
            temperature: monthlyTemp
        };

    } catch (error) {
        console.error("❌ Fallo en la conexión a la API:", error);
        throw error; // Lanzamos el error para que app.js lo atrape y muestre la alerta al usuario
    }
}