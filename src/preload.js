const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods to renderer
contextBridge.exposeInMainWorld('electronAPI', {
  // History
  getHistory: () => ipcRenderer.invoke('get-history'),
  addHistory: (item) => ipcRenderer.invoke('add-history', item),
  deleteHistoryItem: (url) => ipcRenderer.invoke('delete-history-item', url),
  clearHistory: () => ipcRenderer.invoke('clear-history'),
  
  // Bookmarks
  getBookmarks: () => ipcRenderer.invoke('get-bookmarks'),
  addBookmark: (bookmark) => ipcRenderer.invoke('add-bookmark', bookmark),
  deleteBookmark: (id) => ipcRenderer.invoke('delete-bookmark', id),
  
  // Settings
  getSettings: () => ipcRenderer.invoke('get-settings'),
  saveSettings: (settings) => ipcRenderer.invoke('save-settings', settings),
  
  // Session
  getSession: () => ipcRenderer.invoke('get-session'),
  saveSession: (sessionData) => ipcRenderer.invoke('save-session', sessionData),
  
  // Cache & Cookies
  clearCache: () => ipcRenderer.invoke('clear-cache'),
  clearCookies: (domain) => ipcRenderer.invoke('clear-cookies', domain),
  deleteSingleCookie: (cookie) => ipcRenderer.invoke('delete-single-cookie', cookie),
  getCookies: () => ipcRenderer.invoke('get-cookies'),
  
  // Window controls
  minimizeWindow: () => ipcRenderer.send('minimize-window'),
  maximizeWindow: () => ipcRenderer.send('maximize-window'),
  closeWindow: () => ipcRenderer.send('close-window'),
  toggleFullscreen: () => ipcRenderer.send('toggle-fullscreen'),
  
  // Window creation
  createNewWindow: () => ipcRenderer.send('create-new-window'),
  createPrivateWindow: () => ipcRenderer.send('create-private-window'),
  
  // App control
  quitApp: () => ipcRenderer.send('quit-app'),
  
  // External
  openExternal: (url) => ipcRenderer.invoke('open-external', url),
  
  // Events
  on: (channel, callback) => {
    const validChannels = [
      'new-tab', 'show-history', 'clear-history', 
      'show-bookmarks', 'bookmark-page', 'save-session-before-quit',
      'open-url-in-new-tab', 'download-started', 'download-progress',
      'download-completed', 'download-failed'
    ];
    if (validChannels.includes(channel)) {
      // Wrap callback to properly pass arguments
      ipcRenderer.on(channel, (event, ...args) => callback(...args));
    }
  },
  
  removeListener: (channel, callback) => {
    ipcRenderer.removeListener(channel, callback);
  }
});
