const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');
const Database = require('better-sqlite3');

let mainWindow;
let db;

function initDatabase() {
    const userDataPath = app.getPath('userData');
    const persistentDbPath = path.join(userDataPath, 'pvgis_datos.db'); 
    const templateDbPath = path.join(app.getAppPath(), 'input_data', 'pvgis_datos.db');

    if (!fs.existsSync(persistentDbPath)) {
        console.log("Copiando base de datos a la ruta del usuario...");
        if (fs.existsSync(templateDbPath)) {
            fs.copyFileSync(templateDbPath, persistentDbPath);
        }
    }

    db = new Database(persistentDbPath);
    console.log("Base de datos SQLite conectada con éxito.");
}

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1280,
        height: 800,
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            preload: path.join(__dirname, 'preload.js') // <-- Comprueba que esta ruta sea exacta
        }
    });
    mainWindow.loadFile('index.html');
}

app.whenReady().then(() => {
    initDatabase();
    createWindow();
});

app.on('window-all-closed', () => {
    if (db) db.close();
    if (process.platform !== 'darwin') app.quit();
});

// ==========================================
// CANALES IPC
// ==========================================

ipcMain.handle('get-locations', async () => {
    try {
        // CORREGIDO: La columna se llama 'mes' según tu esquema SQL
        const stmt = db.prepare('SELECT * FROM datos_mensuales ORDER BY nombre_emplazamiento ASC, mes ASC'); 
        return stmt.all();
    } catch (error) {
        console.error("Error leyendo SQLite:", error);
        return [];
    }
});

ipcMain.handle('insert-location', async (event, locData) => {
    try {
        const stmt = db.prepare(`
            INSERT INTO datos_mensuales (nombre_emplazamiento, latitud, longitud, radiacion_media, temp_media)
            VALUES (?, ?, ?, ?, ?)
        `);
        stmt.run(
            locData.name, 
            locData.lat, 
            locData.lon, 
            JSON.stringify(locData.radiacion_media), 
            JSON.stringify(locData.temp_media)
        );
        return true;
    } catch (error) {
        console.error("Error insertando en SQLite:", error);
        return false;
    }
});