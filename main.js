const { app, BrowserWindow } = require('electron');
const path = require('path');

function createWindow () {
  // Crea la ventana del navegador de escritorio.
  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    icon: path.join(__dirname, 'assets/img/icon.png'),
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });

  // Carga el index.html de la aplicación (100% offline)
  mainWindow.loadFile('index.html');
  
  // Ocultar el menú superior por defecto para dar aspecto de App nativa
  mainWindow.setMenuBarVisibility(false);
}

// Cuando Electron esté listo, inicializa la ventana
app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});