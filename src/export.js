// ==========================================
// Archivo: src/export.js
// Propósito: Volcado de datos nativo a archivos externos (CSV y PDF) sin dependencias de servidor
// ==========================================
import { State } from './state.js';
import { showAlert } from './ui.js';

// Exportación a Excel mediante generación al vuelo de cadena CSV
export function exportToCSV() {
    const { ui, results, location } = State;
    const component = ui.activeComponent;
    
    if (!results.base[component]) {
        return showAlert("No hay datos para exportar. Calcule primero.", true);
    }

    let csvContent = "data:text/csv;charset=utf-8,";
    // Cabecera Institucional
    csvContent += `Laboratorio Virtual OrientSol 3.0\n`;
    csvContent += `Ciudad/Loc:,${location.name}\nLatitud:,${location.latitude}\n\n`;
    
    // Nombres de las columnas
    csvContent += "Mes,Plano Horizontal (0º),Estudio Seleccionado,Ganancias (%)\n";
    
    const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    
    for (let i = 0; i < 12; i++) {
        let base = results.base[component][i].toFixed(2);
        let study = results.optimalAnnual[component][i].toFixed(2);
        let gains = results.optimalAnnual.gains[component][i].toFixed(2);
        
        csvContent += `${months[i]},${base},${study},${gains}\n`;
    }

    // Proceso nativo del navegador para forzar descarga
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `OrientSol_Resultados_${component}.csv`);
    document.body.appendChild(link);
    
    link.click();
    link.remove();
}

// Generación de PDF (Se requiere importar jsPDF en index.html)
// <script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js"></script>
export function generatePDF() {
    const { jsPDF } = window.jspdf;
    if (!jsPDF) {
        return showAlert("Librería jsPDF no detectada.", true);
    }
    
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text("OrientSol 3.0 - Informe Técnico Fotovoltaico", 14, 22);
    
    doc.setFontSize(12);
    doc.text(`Latitud: ${State.location.latitude}º`, 14, 32);
    doc.text(`Albedo: ${State.parameters.albedo}`, 14, 40);
    
    doc.text("Los datos generados han sido almacenados correctamente. Visite el CSV para tablas numéricas.", 14, 60);
    
    doc.save("Reporte_OrientSol.pdf");
}