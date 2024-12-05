const { app, BrowserWindow, ipcMain, screen } = require('electron');
const path = require('path');

let mainWindow;
let controlWindow;

// Create the main window (Main App)
function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true, // Ensures a secure environment
      nodeIntegration: false,
    },
  });

  mainWindow.loadFile(path.join(__dirname, '../dist/index.html')); // Main app entry
}

// Create the control window (Controller App)
function createControlWindow() {
  const displays = screen.getAllDisplays();
  const externalDisplay = displays.find((display) => display.bounds.x !== 0);

  controlWindow = new BrowserWindow({
    width: 400,
    height: 600,
    x: externalDisplay ? externalDisplay.bounds.x : 0, // Place on external monitor if available
    y: externalDisplay ? externalDisplay.bounds.y : 0,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true, // Ensures a secure environment
    },
  });

  controlWindow.loadFile(path.join(__dirname, '../dist/control.html')); // Control app entry

    // Open DevTools
  controlWindow.webContents.openDevTools({ mode: 'detach' }); // Opens DevTools in a separate window

  // Log errors to console
  controlWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
    console.error('Control Window failed to load:', errorDescription);
  });
}

// IPC Listener: Forward navigation commands to the main window
ipcMain.on('navigate', (event, page) => {
  if (mainWindow) {
    mainWindow.webContents.send('navigate', page); // Send the navigation command to the main window
  }
});

// Handle app ready event
app.whenReady().then(() => {
  createMainWindow();
  createControlWindow();

  // Re-create windows if the app is activated after being closed (macOS-specific behavior)
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createMainWindow();
      createControlWindow();
    }
  });
});

// Handle window-all-closed event (Quit the app on non-macOS platforms)
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});