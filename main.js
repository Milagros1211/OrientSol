const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');

let mainWindow;

// Obtener la ruta persistente del usuario en el sistema operativo
const getUserDataPath = () => {
    const userDataDir = app.getPath('userData');
    const userCsvPath = path.join(userDataDir, 'BBDD_Mundo.csv');
    
    // Si el archivo no existe en el userData del usuario, copiarlo desde los recursos originales
    if (!fs.existsSync(userCsvPath)) {
        const defaultCsvPath = path.join(app.getAppPath(), 'input_data', 'BBDD_Mundo.csv');
        if (fs.existsSync(defaultCsvPath)) {
            fs.copyFileSync(defaultCsvPath, userCsvPath);
        }
    }
    return userCsvPath;
};

function createWindow () {
  const mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 1024,
    minHeight: 768,
    icon: path.join(__dirname, 'assets/img/ujaen.png'),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js') // Asegúrate de tener tu preload configurado
    }
  });

  mainWindow.setMenuBarVisibility(false);
  mainWindow.loadFile('index.html');
}

app.whenReady().then(() => {
  createWindow();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

// 1. Canal IPC para LEER el CSV persistente del usuario
ipcMain.handle('get-csv-data', async () => {
    try {
        const filePath = getUserDataPath();
        return fs.readFileSync(filePath, 'utf-8');
    } catch (error) {
        console.error("Error al leer BBDD_Mundo.csv:", error);
        return "";
    }
});

// 2. Canal IPC para ESCRIBIR y añadir filas de manera persistente
ipcMain.handle('append-csv-row', async (event, rowString) => {
    try {
        const filePath = getUserDataPath();
        fs.appendFileSync(filePath, '\n' + rowString, 'utf-8');
        console.log("BBDD_Mundo.csv actualizado de forma persistente en:", filePath);
        return true;
    } catch (error) {
        console.error("Error al escribir en BBDD_Mundo.csv:", error);
        return false;
    }
});