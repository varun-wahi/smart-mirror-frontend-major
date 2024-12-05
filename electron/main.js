const { app, BrowserWindow, ipcMain, screen } = require('electron');
const path = require('path');

let mainWindow;
let controlWindow;

// Create the main window (Main App)
function createMainWindow() {
  mainWindow = new BrowserWindow({
    fullscreen: true, // Fullscreen for the main window
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true, // Ensures a secure environment
      nodeIntegration: false, // Prevent Node.js access in the renderer process
      enableWebRTC: true, // Enable WebRTC for camera access
      webSecurity: false, // Allow local resources (only disable for testing)
    },
  });

  mainWindow.loadFile(path.join(__dirname, '../dist/index.html')); // Main app entry

  // Open DevTools for debugging (optional, remove in production)
  mainWindow.webContents.openDevTools({ mode: 'detach' });
}

// Create the control window (Controller App)
function createControlWindow() {
  const displays = screen.getAllDisplays(); // Get all available displays
  const externalDisplay = displays.find((display) => display.bounds.x !== 0); // Find secondary monitor

  controlWindow = new BrowserWindow({
    fullscreen: true, // Fullscreen for the control window
    x: externalDisplay ? externalDisplay.bounds.x : 0, // Place on external monitor if available
    y: externalDisplay ? externalDisplay.bounds.y : 0,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true, // Ensures a secure environment
      nodeIntegration: false,
      enableWebRTC: true, // Enable WebRTC for camera access
      webSecurity: false, // Allow local resources (only disable for testing)
    },
  });

  controlWindow.loadFile(path.join(__dirname, '../dist/control.html')); // Control app entry

  // Open DevTools for debugging
  controlWindow.webContents.openDevTools({ mode: 'detach' });

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