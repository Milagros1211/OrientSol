const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
    getLocations: () => ipcRenderer.invoke('get-locations'),
    insertLocation: (locData) => ipcRenderer.invoke('insert-location', locData)
});