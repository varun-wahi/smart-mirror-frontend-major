const { contextBridge, ipcRenderer } = require('electron');

console.log('Preload script loaded successfully');

const validSendChannels = ['navigate', 'control-action', 'show-interview-screen', 'interview-data', 'question-index'];
const validReceiveChannels = ['navigate', 'control-action', 'show-interview-screen', 'interview-data', 'question-index'];

contextBridge.exposeInMainWorld('api', {
  send: (channel, data) => {
    if (validSendChannels.includes(channel)) {
      console.log(`[Preload] Sending through channel: ${channel}`, data);
      ipcRenderer.send(channel, data);
    } else {
      console.warn(`[Preload] Attempted to send through invalid channel: ${channel}`);
    }
  },
  on: (channel, callback) => {
    if (validReceiveChannels.includes(channel)) {
      console.log(`[Preload] Listening to channel: ${channel}`);
      ipcRenderer.on(channel, (event, ...args) => callback(...args));
    } else {
      console.warn(`[Preload] Attempted to listen to invalid channel: ${channel}`);
    }
  },
  receive: (channel, func) => {
    ipcRenderer.on(channel, (_event, ...args) => func(...args));
  },
  removeListener: (channel, func) => ipcRenderer.removeListener(channel, func),
  removeAllListeners: (channel) => {
    console.log(`[Preload] Removing all listeners for channel: ${channel}`);
    ipcRenderer.removeAllListeners(channel);
  },
});
