// ==========================================
// Archivo: src/charts.js
// Propósito: Gestor Gráfico Centralizado (Sustituye a los Grafica_...m)
// ==========================================
import { State } from './state.js';

let currentChart = null; // Variable global para destruir gráficos anteriores

export function updateCharts() {
    const ctx = document.getElementById('solarChart').getContext('2d');
    const { ui, results, parameters } = State;
    
    // Evitar superposición y fugas de memoria gráfica
    if (currentChart) {
        currentChart.destroy();
    }

    const labels = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    const component = ui.activeComponent; 
    
    // Mapeo dinámico para identificar el origen de los datos
    const studyKeys = {
        1: 'optimalAnnual', 2: 'optimalSeasonal', 3: 'polarAxis',
        4: 'azimuthalAxis', 5: 'horizontalAxis', 6: 'dualAxis', 7: 'optimalAnnual'
    };
    const activeKey = studyKeys[parameters.studyMode];
    const studyObj = results[activeKey];
    
    const datasets = [];

    // Trazado de la curva base (Plano Horizontal 0º)
    if (results.base[component] && results.base[component].length > 0) {
        datasets.push({
            label: `Base 0º (${component})`,
            data: results.base[component],
            borderColor: 'rgba(54, 162, 235, 1)',
            backgroundColor: 'rgba(54, 162, 235, 0.1)',
            borderWidth: 2,
            tension: 0.3,
            fill: true
        });
    }

    // Trazado dinámico de la curva del estudio seleccionado
    if (studyObj && studyObj[component] && studyObj[component].length > 0) {
        datasets.push({
            label: `Estudio Seleccionado (${component})`,
            data: studyObj[component],
            borderColor: 'rgba(255, 99, 132, 1)',
            backgroundColor: 'rgba(255, 99, 132, 0.1)',
            borderWidth: 2,
            tension: 0.3,
            fill: true
        });
    }

    // Instanciación del gráfico
    currentChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: datasets
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: {
                    display: true,
                    text: `Comparativa Mensual - Radiación ${component.toUpperCase()}`
                },
                legend: { position: 'bottom' }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    title: { display: true, text: 'Radiación (kWh/m²/día)' }
                }
            }
        }
    });
}