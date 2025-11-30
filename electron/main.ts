import { app, BrowserWindow, ipcMain } from 'electron';
import path from 'path';

let mainWindow: BrowserWindow | null = null;
let secondWindow: BrowserWindow | null = null;

const createWindow = () => {
  mainWindow = new BrowserWindow({
    width: 700,
    height: 700,
    autoHideMenuBar: true,
    resizable: false,
    title: 'Login Form',
    minimizable: true,
    maximizable: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  mainWindow.setMenu(null);

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  if (!app.isPackaged) {
    const devUrl = process.env.VITE_DEV_SERVER_URL ?? 'http://localhost:5173';
    mainWindow.loadURL(`${devUrl}/first.html`);
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/first.html'));
  }
};

const createSecondWindow = () => {
  if (secondWindow) return;

  secondWindow = new BrowserWindow({
  width: 800,
  height: 600,
  autoHideMenuBar: true,
  resizable: false,
  minimizable: true,
  maximizable: false,
  webPreferences: {
    preload: path.join(__dirname, 'preload.js'),
    contextIsolation: true,
    nodeIntegration: false,
  },
});

  secondWindow.setMenu(null);
  secondWindow.maximize();

  if (!app.isPackaged) {
    const devUrl = process.env.VITE_DEV_SERVER_URL ?? 'http://localhost:5173';
    secondWindow.loadURL(`${devUrl}/second.html`);
  } else {
    secondWindow.loadFile(path.join(__dirname, '../dist/second.html'));
  }

  secondWindow.on('closed', () => {
    secondWindow = null;
  });
};

app.whenReady().then(() => {
  createWindow();

  ipcMain.on('open-second-window', () => {
    createSecondWindow(); // First, create the second window
    if (mainWindow) {
      mainWindow.close(); // Then close the first window
    }

  });

  ipcMain.on('logout', () => {
    // When renderer requests logout, ensure main (first) window is open and close second
    if (!mainWindow) {
      createWindow();
    } else {
      // If mainWindow exists but is minimized/hidden, show and focus it
      try {
        mainWindow.show();
        mainWindow.focus();
      } catch {
        // ignore
      }
    }

    if (secondWindow) {
      secondWindow.close();
      secondWindow = null;
    }
  });

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});