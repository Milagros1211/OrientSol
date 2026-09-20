const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
    getCsvData: () => ipcRenderer.invoke('get-csv-data'),
    appendCsvRow: (rowString) => ipcRenderer.invoke('append-csv-row', rowString)
});