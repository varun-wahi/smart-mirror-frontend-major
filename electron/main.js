const { app, BrowserWindow, ipcMain, screen } = require('electron');
const path = require('path');
const fs = require('fs');
const { execFile } = require('child_process');

let mainWindow;
let controlWindow;

// Track renderer process ready states
let mainWindowReady = false;
let controlWindowReady = false;

// Message queues for pending messages
const mainWindowMessageQueue = [];
const controlWindowMessageQueue = [];

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
  mainWindowReady = false; // Reset ready state
  
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
  mainWindow.webContents.openDevTools({ mode: 'detach' });

  mainWindow.on('closed', () => {
    mainWindow = null;
    mainWindowReady = false;
  });
}

// Create the control window (Controller App)
function createControlWindow() {
  controlWindowReady = false; // Reset ready state
  
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
  controlWindow.webContents.openDevTools({ mode: 'detach' });

  controlWindow.on('closed', () => {
    controlWindow = null;
    controlWindowReady = false;
  });
}

// Helper to send messages to main window with queue fallback
function sendToMainWindow(channel, data) {
  if (mainWindow && mainWindowReady) {
    console.log(`[Main] Sending to main window: ${channel}`);
    mainWindow.webContents.send(channel, data);
    return true;
  } else {
    console.log(`[Main] Queueing message for main window: ${channel}`);
    mainWindowMessageQueue.push({ channel, data });
    return false;
  }
}

// Helper to send messages to control window with queue fallback
function sendToControlWindow(channel, data) {
  if (controlWindow && controlWindowReady) {
    console.log(`[Main] Sending to control window: ${channel}`);
    controlWindow.webContents.send(channel, data);
    return true;
  } else {
    console.log(`[Main] Queueing message for control window: ${channel}`);
    controlWindowMessageQueue.push({ channel, data });
    return false;
  }
}

// Process queued messages
function processMessageQueues() {
  // Process main window queue
  if (mainWindow && mainWindowReady) {
    while (mainWindowMessageQueue.length > 0) {
      const { channel, data } = mainWindowMessageQueue.shift();
      console.log(`[Main] Processing queued message for main window: ${channel}`);
      mainWindow.webContents.send(channel, data);
    }
  }
  
  // Process control window queue
  if (controlWindow && controlWindowReady) {
    while (controlWindowMessageQueue.length > 0) {
      const { channel, data } = controlWindowMessageQueue.shift();
      console.log(`[Main] Processing queued message for control window: ${channel}`);
      controlWindow.webContents.send(channel, data);
    }
  }
}

// Setup IPC communication channels
function setupIPCChannels() {
  // Handle renderer process ready signals
  ipcMain.on('renderer-ready', (event, data) => {
    const sender = event.sender;
    
    if (mainWindow && sender === mainWindow.webContents) {
      console.log("[Main] Main window is ready");
      mainWindowReady = true;
    } else if (controlWindow && sender === controlWindow.webContents) {
      console.log("[Main] Control window is ready");
      controlWindowReady = true;
    }
    
    // Process any queued messages now that renderer is ready
    processMessageQueues();
  });

  // Handle navigation requests
  ipcMain.on('navigate', (event, page) => {
    sendToMainWindow('navigate', page);
  });

  ipcMain.on('send-analysis-data', (event, analysisData) => {
  // Handle the analysis data
  mainWindow.webContents.send('analysis-data', analysisData);
});

  // Handle interview screen setup
  ipcMain.on('show-interview-screen', (event, data) => {
    console.log("[Main] Received show-interview-screen with data:", data);
    
    // Store data for retry if needed
    const interviewData = data;
    
    // First navigate to the interview practice page
    sendToMainWindow('navigate', { path: '/interview-practice' });
    
    // Give a slight delay to ensure navigation completes before sending data
    setTimeout(() => {
      // Try to send data, if window isn't ready it will be queued
      if (!sendToMainWindow('show-interview-screen', interviewData)) {
        console.log("[Main] Interview window not ready, data queued");
      }
    }, 500); // Increased delay for slower devices
  });

  // Forward interview data to controller window
  ipcMain.on('interview-data', (event, data) => {
    console.log("[Main] Forwarding interview data to controller:", data);
    sendToControlWindow('interview-data', data);
  });

  // Forward question index from controller to main window
  ipcMain.on('question-index', (event, payload) => {
    console.log("[Main] Forwarding question index:", payload);
    sendToMainWindow('question-index', payload);
  });

  // Forward speak command from controller to main window
  ipcMain.on('speak-question', (event) => {
    console.log("[Main] Forwarding speak command");
    sendToMainWindow('speak-question');
  });

  // Handle requests to resend data (for recovery)
  ipcMain.on('request-interview-data', (event) => {
    console.log("[Main] Received request to resend interview data");
    // Process queued messages - this will send any pending data
    processMessageQueues();
  });

  // Handle control actions from controller
  // Handle analysis data display
ipcMain.on('show-analysis', (event, analysisData) => {
  console.log("[Main] Received analysis data to display");
  console.log(analysisData);
  
  // Navigate to analysis page
  sendToMainWindow('navigate', { path: '/interview-analysis' });
  
  // Send analysis data with a slight delay to ensure navigation completes
  setTimeout(() => {
    if (!sendToMainWindow('analysis-data', analysisData)) {
      console.log("[Main] Analysis window not ready, data queued");
    }
  }, 5000);
});

// Forward tab change request to main window
ipcMain.on('request-tab-change', (event, tabName) => {
  console.log(`[Main] Changing analysis tab to: ${tabName}`);
  sendToMainWindow('change-tab', tabName);
});

// Forward scroll request to main window
ipcMain.on('request-scroll', (event, direction) => {
  console.log(`[Main] Scrolling ${direction}`);
  sendToMainWindow('scroll', direction);
});

// Forward question details request
ipcMain.on('request-question-details', (event, questionIndex) => {
  console.log(`[Main] Showing details for question ${questionIndex}`);
  sendToMainWindow('show-question-details', questionIndex);
});

// Forward close question details request
ipcMain.on('request-close-question-details', () => {
  console.log("[Main] Closing question details");
  sendToMainWindow('close-question-details');
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
      // const transcriptionScript = path.join(__dirname, 'scripts', 'transcription.py');
      const transcriptionScript = '/Users/varunwahi/Development/Interview_Prep/frontend/src/controlApp/scripts/transcription.py';
      // const transcriptionScript = '/home/smartmirror/Desktop/SmartMirror/frontend/src/controlApp/scripts/transcription.py';
      
      // Determine correct Python command based on platform
      // const pythonCommand = process.platform === 'darwin' ? 'python3' : 'python';
      const pythonCommand = 'python3.10';
      // const pythonCommand = 'python';
      
      // Run Python script for transcription
      console.log(`[Main] Running transcription script: ${pythonCommand} ${transcriptionScript} ${audioFilePath}`);
      
      execFile(pythonCommand, [transcriptionScript, audioFilePath, 'tiny.en'], (error, stdout, stderr) => {
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