import { contextBridge, ipcRenderer } from 'electron';
// Expose a minimal API to the renderer in a safe, controlled way.
contextBridge.exposeInMainWorld('electronAPI', {
  openSecondWindow: () => ipcRenderer.send('open-second-window'),
  logout: () => ipcRenderer.send('logout'),
});

