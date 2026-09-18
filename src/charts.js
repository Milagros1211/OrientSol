// ==========================================
// Archivo: src/charts.js
// Propósito: Gestor Gráfico Centralizado (Sustituye a los Grafica_...m)
// ==========================================
import { State } from './state.js';

let currentChart = null; // Variable global para destruir gráficos anteriores

export function updateCharts() {
    const ctx = document.getElementById('solarChart').getContext('2d');
    const { ui, results, climateData } = State;
    
    // Si ya existe un gráfico previo, lo destruimos para evitar superposición (fuga de memoria de MATLAB)
    if (currentChart) {
        currentChart.destroy();
    }

    const labels = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    const component = ui.activeComponent; // 'global', 'direct', 'diffuse' o 'albedo'
    
    const datasets = [];

    // Añadimos siempre la curva base (Plano Horizontal 0º)
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

    // Añadimos la curva del estudio seleccionado
    if (results.optimalAnnual[component] && results.optimalAnnual[component].length > 0) {
        datasets.push({
            label: `Estudio Seleccionado (${component})`,
            data: results.optimalAnnual[component],
            borderColor: 'rgba(255, 99, 132, 1)',
            backgroundColor: 'rgba(255, 99, 132, 0.1)',
            borderWidth: 2,
            tension: 0.3,
            fill: true
        });
    }

    // Renderizamos el gráfico con Chart.js
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
                    title: { display: true, text: 'Energía / Radiación' }
                }
            }
        }
    });
}