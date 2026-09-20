// preload.js
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
    appendCsvRow: (rowString) => ipcRenderer.invoke('append-csv-row', rowString)
});