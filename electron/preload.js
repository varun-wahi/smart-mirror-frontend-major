const { contextBridge, ipcRenderer } = require('electron');

console.log('Preload script loaded successfully');

const validSendChannels = [
'navigate',
'control-action',
'show-interview-screen',
'interview-data',
'question-index',
'speak-question',
'transcribe-audio',
'transcription-complete',
// New channels
'send-analysis-data',
'analysis-data',
'show-analysis',
'request-tab-change',
'request-scroll',
'request-question-details',
'request-close-question-details',
'close-question-details',
'analysis-component-ready',
'change-tab',
'scroll',
'show-question-details',





];
const validReceiveChannels = [...validSendChannels];

contextBridge.exposeInMainWorld('api', {
  send: (channel, data) => {
    if (validSendChannels.includes(channel)) {
      if (data !== undefined) {
        console.log(`[Preload] Sending through channel: ${channel} with data:`, data);
      } else {
        console.log(`[Preload] Sending through channel: ${channel}`);
      }
      ipcRenderer.send(channel, data);
    } else {
      console.warn(`[Preload] Attempted to send through invalid channel: ${channel}`);
    }
  },
  on: (channel, callback) => {
    if (validReceiveChannels.includes(channel)) {
      const wrappedCallback = (event, ...args) => {
        console.log(`[Preload] Received on channel: ${channel}`, args);
        callback(...args);
      };
      console.log(`[Preload] Listening to channel: ${channel}`);
      ipcRenderer.on(channel, wrappedCallback);
      
      // Return the wrapped callback for proper removal
      return wrappedCallback;
    } else {
      console.warn(`[Preload] Attempted to listen to invalid channel: ${channel}`);
      return null;
    }
  },
  receive: (channel, func) => {
    if (validReceiveChannels.includes(channel)) {
      ipcRenderer.on(channel, (_event, ...args) => func(...args));
    }
  },
  removeListener: (channel, func) => {
    if (func) {
      ipcRenderer.removeListener(channel, func);
    }
  },
  removeAllListeners: (channel) => {
    if (validReceiveChannels.includes(channel)) {
      console.log(`[Preload] Removing all listeners for channel: ${channel}`);
      ipcRenderer.removeAllListeners(channel);
    }
  },
});

// Signal that renderer is ready
window.addEventListener('DOMContentLoaded', () => {
  console.log('[Renderer] DOM content loaded, sending ready signal');
  ipcRenderer.send('renderer-ready');
});