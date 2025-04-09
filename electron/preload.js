const { contextBridge, ipcRenderer } = require('electron');

console.log('Preload script loaded successfully'); // Debugging log

contextBridge.exposeInMainWorld('api', {
  // Send messages to the main process
  send: (channel, data) => {
    console.log(`Sending: ${channel}, Data:`, data); // Debug log
    const validChannels = ['navigate', 'control-action'];
    // const validChannels = ['navigate', 'control-action', 'show-interview-screen'];
    if (validChannels.includes(channel)) {
      ipcRenderer.send(channel, data);
    }
  },
  // Listen for messages from the main process
  on: (channel, callback) => {
    console.log(`Listening for: ${channel}`); // Debug log
    const validChannels = ['navigate', 'control-action'];
    // const validChannels = ['navigate', 'control-action', 'show-interview-screen'];

    if (validChannels.includes(channel)) {
      ipcRenderer.on(channel, (event, ...args) => callback(...args));
    }
  },
  // Remove all listeners for a channel
  removeAllListeners: (channel) => {
    console.log(`Removing all listeners for: ${channel}`); // Debug log
    ipcRenderer.removeAllListeners(channel);
  },
});