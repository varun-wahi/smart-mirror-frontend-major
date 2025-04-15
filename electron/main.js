const { app, BrowserWindow, ipcMain, screen } = require('electron');
const path = require('path');

let mainWindow;
let controlWindow;
// In your main.js or preload.js file

const { ipcMain } = require('electron');
const { transcribeAudio, initializeVOSK } = require('./transcriptionHandler');

// Initialize VOSK when the app starts
app.whenReady().then(() => {
  // Other initialization code...
  
  // Initialize VOSK
  initializeVOSK();
});

// Set up IPC handler for transcription
ipcMain.on('transcribe-audio', async (event, { audio, questionIndex, language }) => {
  try {
    console.log(`Transcribing audio for question ${questionIndex}`);
    const result = await transcribeAudio(audio, language || 'en-IN');
    
    // Send transcription result back to renderer
    event.sender.send('transcription-result', { 
      text: result.text,
      questionIndex: questionIndex
    });
  } catch (error) {
    console.error('Transcription error:', error);
    event.sender.send('transcription-result', { 
      text: "Error transcribing audio: " + error.message,
      questionIndex: questionIndex,
      error: true
    });
  }
});

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
  
  mainWindow.on('closed', () => {
    mainWindow = null;
  });
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
    },
  });

  controlWindow.loadFile(path.join(__dirname, '../dist/control.html')); // Control app entry

  // Open DevTools for debugging
  controlWindow.webContents.openDevTools({ mode: 'detach' });

  controlWindow.on('closed', () => {
    controlWindow = null;
  });
}

// Setup IPC communication channels
function setupIPCChannels() {
  // Handle navigation requests
  ipcMain.on('navigate', (event, page) => {
    if (mainWindow) {
      console.log("[Main] Forwarding navigation command:", page);
      mainWindow.webContents.send('navigate', page);
    }
  });

  // Handle interview screen setup
  ipcMain.on('show-interview-screen', (event, data) => {
    console.log("[Main] Received show-interview-screen with data:", data);
    
    if (mainWindow) {
      // First navigate to the interview practice page
      mainWindow.webContents.send('navigate', { path: '/interview-practice' });
      
      // Give a slight delay to ensure navigation completes
      setTimeout(() => {
        mainWindow.webContents.send('show-interview-screen', data);
      }, 100);
    }
  });

  // Forward interview data to controller window
  ipcMain.on('interview-data', (event, data) => {
    console.log("[Main] Forwarding interview data to controller:", data);
    if (controlWindow) {
      controlWindow.webContents.send('interview-data', data);
    }
  });

  // Forward question index from controller to main window
  ipcMain.on('question-index', (event, payload) => {
    console.log("[Main] Forwarding question index:", payload);
    if (mainWindow) {
      mainWindow.webContents.send('question-index', payload);
    }
  });

  // Forward speak command from controller to main window
  ipcMain.on('speak-question', (event) => {
    console.log("[Main] Forwarding speak command");
    if (mainWindow) {
      mainWindow.webContents.send('speak-question');
    }
  });
}

// Handle app ready event
app.whenReady().then(() => {
  createMainWindow();
  createControlWindow();
  setupIPCChannels();

  // Re-create windows if the app is activated after being closed (macOS-specific behavior)
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createMainWindow();
      createControlWindow();
      setupIPCChannels();
    }
  });
});

// Handle window-all-closed event (Quit the app on non-macOS platforms)
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});