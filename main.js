const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');

let mainWindow;

function createWindow () {
  // Configuración de la ventana nativa de Windows
  const mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 1024,
    minHeight: 768,
    icon: path.join(__dirname, 'assets/img/ujaen.png'),
    webPreferences: {
      // Medidas de seguridad modernas
      nodeIntegration: false,
      contextIsolation: true
    }
  });

  // Elimina la barra de menú superior (Archivo, Editar, Ver...) para que parezca un software nativo
  mainWindow.setMenuBarVisibility(false);

  // Carga el HTML principal de tu aplicación
  mainWindow.loadFile('index.html');
}

// Cuando Electron esté listo, abre la ventana
app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

// Cierra el proceso cuando el usuario cierra todas las ventanas
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

// Canal IPC para escribir físicamente en BBDD_Mundo.csv
ipcMain.handle('append-csv-row', async (event, rowString) => {
    try {
        const filePath = path.join(__dirname, 'input_data', 'BBDD_Mundo.csv');
        // Añade un salto de línea y la nueva fila al final del archivo CSV
        fs.appendFileSync(filePath, '\n' + rowString, 'utf-8');
        console.log("Archivo BBDD_Mundo.csv actualizado correctamente en disco.");
        return true;
    } catch (error) {
        console.error("Error al escribir en BBDD_Mundo.csv:", error);
        return false;
    }
});