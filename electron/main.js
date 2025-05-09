const { app, BrowserWindow, ipcMain, screen } = require('electron');
const path = require('path');
const fs = require('fs');
const { execFile } = require('child_process');

let mainWindow;
let controlWindow;
// Add this line to track current interview data
let currentInterviewData = null;

// Create directory for recordings if it doesn't exist
const ensureRecordingsDirectory = () => {
  const recordingsDir = path.join(app.getPath('userData'), 'recordings');
  if (!fs.existsSync(recordingsDir)) {
    fs.mkdirSync(recordingsDir, { recursive: true });
  }
  return recordingsDir;
};

// Create the main window (Main App)
function createMainWindow() {
  mainWindow = new BrowserWindow({
    // fullscreen: true, // Fullscreen for the main window
    fullscreen: false, // Set to false for easier testing on same screen
    width: 800,
    height: 800,
    x: 700, // Position within the main display for testing
    y: 50,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      enableWebRTC: true,
      webSecurity: false,
    },
  });

  mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  // mainWindow.webContents.openDevTools({ mode: 'detach' });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// Create the control window (Controller App)
function createControlWindow() {
  // const displays = screen.getAllDisplays();
  // const externalDisplay = displays.find((display) => display.bounds.x !== 0);

  controlWindow = new BrowserWindow({
    fullscreen: false, // Set to false for easier testing on same screen
    width: 600,
    height: 800,
    x: 20, // Position within the main display for testing
    y: 50,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      enableWebRTC: true,
    },
  });

  controlWindow.loadFile(path.join(__dirname, '../dist/control.html'));
  // controlWindow.webContents.openDevTools({ mode: 'detach' });

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
    
    // Store the data for later use (important for reconnections)
    currentInterviewData = data;
    
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
    // Store the data for later use
    currentInterviewData = data;
    
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

  // Handle ready-for-interview event from the interview practice page
  ipcMain.on('ready-for-interview', (event) => {
    console.log("[Main] Received ready-for-interview event");
    // If we have cached interview data, send it immediately
    if (currentInterviewData) {
      console.log("[Main] Sending cached interview data to requester");
      event.sender.send('show-interview-screen', currentInterviewData);
    } else {
      console.log("[Main] No cached interview data available yet");
    }
  });

  // Handle audio transcription requests using Python script
  ipcMain.on('transcribe-audio', async (event, { buffer, questionIndex }) => {
    try {
      const recordingsDir = ensureRecordingsDirectory();
      
      // Generate unique filename with timestamp
      const timestamp = new Date().getTime();
      const audioFilePath = path.join(recordingsDir, `recording_q${questionIndex}_${timestamp}.webm`);
      
      // Write audio buffer to file
      fs.writeFileSync(audioFilePath, Buffer.from(buffer));
      console.log(`[Main] Audio saved to: ${audioFilePath}`);
      
      // Path to Python script
      // WHISPER IMPLEMENTATION (COMMENTED OUT)
      // const transcriptionScript = '/Users/varunwahi/Development/Interview_Prep/frontend/src/controlApp/scripts/transcription.py';
      // const pythonCommand = '/Users/varunwahi/Development/Interview_Prep/frontend/whisper-env/bin/python3';
      
      // VOSK IMPLEMENTATION (NEW)
      const transcriptionScript = '/Users/varunwahi/Development/Interview_Prep/frontend/src/controlApp/scripts/transcription_vosk.py';
      // const pythonCommand = '/Users/varunwahi/Development/Interview_Prep/frontend/vosk-env/bin/python3';
      // const pythonCommand = '/Users/varunwahi/Development/Interview_Prep/frontend/vosk-env/bin/python3';
      const pythonCommand = 'python3.10';
      
      // Get the model path - adjust this to your actual model location
      const voskModelPath = '/Users/varunwahi/Development/Interview_Prep/frontend/src/controlApp/scripts/voice_models/vosk-model-small-en-in-0.4';
      
      // Run Python script for transcription
      console.log(`[Main] Running Vosk transcription script: ${pythonCommand} ${transcriptionScript} ${audioFilePath} ${voskModelPath}`);
      
      execFile(pythonCommand, [transcriptionScript, audioFilePath, voskModelPath], (error, stdout, stderr) => {
        if (error) {
          console.error('[Main] Transcription error:', error);
          console.error('[Main] Stderr:', stderr);
          event.sender.send('transcription-complete', { 
            success: false, 
            error: error.message,
            questionIndex
          });
          return;
        }
        
        // Get transcription text from script output
        const transcriptionText = stdout.trim();
        console.log('[Main] Transcription output:', transcriptionText);
        
        // Send transcription back to renderer
        event.sender.send('transcription-complete', { 
          success: true, 
          text: transcriptionText,
          filePath: audioFilePath,
          questionIndex
        });
        
        console.log(`[Main] Transcription complete for question ${questionIndex}: "${transcriptionText}"`);
      });
      
    } catch (error) {
      console.error('[Main] Error processing audio:', error);
      event.sender.send('transcription-complete', { 
        success: false, 
        error: error.message,
        questionIndex
      });
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