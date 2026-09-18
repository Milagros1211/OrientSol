/**
 * CONTROLADOR DE LA INTERFAZ DE USUARIO (VISTA)
 * Sustituye a: Tabla_OptAnual.m y las rutinas de renderizado estático
 */

// Nombres de los meses (se podrían vincular al archivo de idiomas locales/es.json)
const monthNames = [
    "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", 
    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
];

/**
 * Pinta los resultados numéricos en la tabla HTML
 * @param {Object} optimizationResult - El objeto devuelto por optimizeAnnualTilt
 */
export function renderResultsTable(optimizationResult) {
    const tbody = document.getElementById('resultsTableBody');
    tbody.innerHTML = ''; // Limpiamos la tabla anterior

    let sumHh = 0;
    let sumGtilted = 0;

    // Iteramos sobre los 12 meses
    optimizationResult.monthlyData.forEach((data, index) => {
        sumHh += data.Hh_global;
        sumGtilted += data.G_tilted;

        const tr = document.createElement('tr');
        tr.className = "hover:bg-gray-50 transition-colors";
        
        tr.innerHTML = `
            <td class="p-2 border font-medium">${monthNames[index]}</td>
            <td class="p-2 border text-gray-600">${data.Hh_global.toFixed(2)}</td>
            <td class="p-2 border font-bold text-blue-600">${data.G_tilted.toFixed(2)}</td>
        `;
        tbody.appendChild(tr);
    });

    // Añadir fila de promedios / totales
    const trTotal = document.createElement('tr');
    trTotal.className = "bg-blue-100 font-bold";
    trTotal.innerHTML = `
        <td class="p-2 border">MEDIA/TOTAL</td>
        <td class="p-2 border">${(sumHh / 12).toFixed(2)}</td>
        <td class="p-2 border text-blue-800">${(sumGtilted / 12).toFixed(2)}</td>
    `;
    tbody.appendChild(trTotal);

    // Actualizar el título de la tabla con el ángulo óptimo encontrado
    const tableHeader = document.querySelector('th[data-i18n="opt_annual"]');
    if(tableHeader) {
        tableHeader.innerText = `Óptima Anual (${optimizationResult.optimalAngle}º)`;
    }
}