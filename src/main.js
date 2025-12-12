const { app, BrowserWindow, ipcMain, session, dialog, Menu, shell } = require('electron');
const path = require('path');
const fs = require('fs');

// Data storage paths
const userDataPath = app.getPath('userData');
const historyPath = path.join(userDataPath, 'history.json');
const bookmarksPath = path.join(userDataPath, 'bookmarks.json');
const settingsPath = path.join(userDataPath, 'settings.json');
const sessionsPath = path.join(userDataPath, 'sessions.json');

let mainWindow;
let privateWindows = [];

// Initialize data files
function initializeDataFiles() {
  if (!fs.existsSync(historyPath)) {
    fs.writeFileSync(historyPath, JSON.stringify([]));
  }
  if (!fs.existsSync(bookmarksPath)) {
    fs.writeFileSync(bookmarksPath, JSON.stringify([]));
  }
  if (!fs.existsSync(settingsPath)) {
    fs.writeFileSync(settingsPath, JSON.stringify({
      theme: 'light',
      homepage: 'https://www.google.com',
      searchEngine: 'https://www.google.com/search?q=',
      restoreSession: true
    }));
  }
  if (!fs.existsSync(sessionsPath)) {
    fs.writeFileSync(sessionsPath, JSON.stringify({ tabs: [] }));
  }
}

function createWindow(isPrivate = false) {
  const win = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    frame: false,
    icon: path.join(__dirname, '../assets/icon.ico'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      webviewTag: true,
      partition: isPrivate ? 'private-session' : 'persist:main'
    }
  });

  win.loadFile(path.join(__dirname, '../pages/index.html'));

  // Set up menu
  const menuTemplate = [
    {
      label: 'File',
      submenu: [
        {
          label: 'New Tab',
          accelerator: 'CmdOrCtrl+T',
          click: () => { win.webContents.send('new-tab'); }
        },
        {
          label: 'New Window',
          accelerator: 'CmdOrCtrl+N',
          click: () => { createWindow(); }
        },
        {
          label: 'New Private Window',
          accelerator: 'CmdOrCtrl+Shift+N',
          click: () => { createWindow(true); }
        },
        { type: 'separator' },
        {
          label: 'Exit',
          accelerator: 'Alt+F4',
          click: () => { app.quit(); }
        }
      ]
    },
    {
      label: 'Edit',
      submenu: [
        { role: 'undo' },
        { role: 'redo' },
        { type: 'separator' },
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' },
        { role: 'selectAll' }
      ]
    },
    {
      label: 'View',
      submenu: [
        {
          label: 'Reload',
          accelerator: 'CmdOrCtrl+R',
          click: () => { win.webContents.send('reload-page'); }
        },
        {
          label: 'Force Reload',
          accelerator: 'CmdOrCtrl+Shift+R',
          click: () => { win.webContents.send('force-reload-page'); }
        },
        { role: 'toggleDevTools' },
        { type: 'separator' },
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { type: 'separator' },
        { role: 'togglefullscreen' }
      ]
    },
    {
      label: 'History',
      submenu: [
        {
          label: 'Show History',
          click: () => { win.webContents.send('show-history'); }
        },
        {
          label: 'Clear History',
          click: () => { win.webContents.send('clear-history'); }
        }
      ]
    },
    {
      label: 'Bookmarks',
      submenu: [
        {
          label: 'Show Bookmarks',
          accelerator: 'CmdOrCtrl+Shift+B',
          click: () => { win.webContents.send('show-bookmarks'); }
        },
        {
          label: 'Bookmark This Page',
          accelerator: 'CmdOrCtrl+D',
          click: () => { win.webContents.send('bookmark-page'); }
        }
      ]
    }
  ];

  const menu = Menu.buildFromTemplate(menuTemplate);
  Menu.setApplicationMenu(menu);

  if (isPrivate) {
    privateWindows.push(win);
    win.on('closed', () => {
      privateWindows = privateWindows.filter(w => w !== win);
    });
  } else {
    if (!mainWindow) {
      mainWindow = win;
    }
  }

  win.on('closed', () => {
    if (win === mainWindow) {
      mainWindow = null;
    }
  });

  // Handle downloads from webviews
  win.webContents.on('did-attach-webview', (event, webContents) => {
    webContents.session.on('will-download', (event, item, webContents) => {
      // Set custom download path - Vector Browser Downloads folder
      const vectorDownloadsPath = path.join(app.getPath('downloads'), 'Vector Browser');
      
      // Create directory if it doesn't exist
      if (!fs.existsSync(vectorDownloadsPath)) {
        fs.mkdirSync(vectorDownloadsPath, { recursive: true });
      }
      
      const fileName = item.getFilename();
      const savePath = path.join(vectorDownloadsPath, fileName);
      
      item.setSavePath(savePath);
      
      win.webContents.send('download-started', {
        id: item.getStartTime(),
        fileName: fileName,
        totalBytes: item.getTotalBytes(),
        savePath: savePath
      });
      
      item.on('updated', (event, state) => {
        if (state === 'interrupted') {
          win.webContents.send('download-progress', {
            id: item.getStartTime(),
            state: 'interrupted'
          });
        } else if (state === 'progressing') {
          if (item.isPaused()) {
            win.webContents.send('download-progress', {
              id: item.getStartTime(),
              state: 'paused'
            });
          } else {
            const progress = (item.getReceivedBytes() / item.getTotalBytes()) * 100;
            win.webContents.send('download-progress', {
              id: item.getStartTime(),
              state: 'progressing',
              progress: progress,
              receivedBytes: item.getReceivedBytes(),
              totalBytes: item.getTotalBytes()
            });
          }
        }
      });
      
      item.once('done', (event, state) => {
        if (state === 'completed') {
          win.webContents.send('download-completed', {
            id: item.getStartTime(),
            fileName: fileName,
            savePath: savePath
          });
        } else {
          win.webContents.send('download-failed', {
            id: item.getStartTime(),
            fileName: fileName,
            error: state
          });
        }
      });
    });
  });

  return win;
}

// IPC Handlers
ipcMain.handle('get-history', async () => {
  try {
    const data = fs.readFileSync(historyPath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    return [];
  }
});

ipcMain.handle('add-history', async (event, item) => {
  try {
    const data = fs.readFileSync(historyPath, 'utf8');
    const history = JSON.parse(data);
    
    // Limit history to 1000 items
    if (history.length >= 1000) {
      history.shift();
    }
    
    history.push({
      ...item,
      timestamp: Date.now()
    });
    
    fs.writeFileSync(historyPath, JSON.stringify(history, null, 2));
    return true;
  } catch (error) {
    console.error('Error adding history:', error);
    return false;
  }
});

ipcMain.handle('delete-history-item', async (event, url) => {
  try {
    const data = fs.readFileSync(historyPath, 'utf8');
    let history = JSON.parse(data);
    history = history.filter(item => item.url !== url);
    fs.writeFileSync(historyPath, JSON.stringify(history, null, 2));
    return true;
  } catch (error) {
    return false;
  }
});

ipcMain.handle('clear-history', async () => {
  try {
    fs.writeFileSync(historyPath, JSON.stringify([]));
    return true;
  } catch (error) {
    return false;
  }
});

ipcMain.handle('get-bookmarks', async () => {
  try {
    const data = fs.readFileSync(bookmarksPath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    return [];
  }
});

ipcMain.handle('add-bookmark', async (event, bookmark) => {
  try {
    const data = fs.readFileSync(bookmarksPath, 'utf8');
    const bookmarks = JSON.parse(data);
    bookmarks.push({
      ...bookmark,
      id: Date.now().toString()
    });
    fs.writeFileSync(bookmarksPath, JSON.stringify(bookmarks, null, 2));
    return true;
  } catch (error) {
    return false;
  }
});

ipcMain.handle('delete-bookmark', async (event, id) => {
  try {
    const data = fs.readFileSync(bookmarksPath, 'utf8');
    let bookmarks = JSON.parse(data);
    bookmarks = bookmarks.filter(b => b.id !== id);
    fs.writeFileSync(bookmarksPath, JSON.stringify(bookmarks, null, 2));
    return true;
  } catch (error) {
    return false;
  }
});

ipcMain.handle('get-settings', async () => {
  try {
    const data = fs.readFileSync(settingsPath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    return {
      theme: 'light',
      homepage: 'vector://home',
      searchEngine: 'https://www.google.com/search?q=',
      restoreSession: true
    };
  }
});

ipcMain.handle('save-settings', async (event, settings) => {
  try {
    fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2));
    return true;
  } catch (error) {
    return false;
  }
});

ipcMain.handle('get-session', async () => {
  try {
    const data = fs.readFileSync(sessionsPath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    return { tabs: [] };
  }
});

ipcMain.handle('save-session', async (event, sessionData) => {
  try {
    fs.writeFileSync(sessionsPath, JSON.stringify(sessionData, null, 2));
    return true;
  } catch (error) {
    return false;
  }
});

ipcMain.handle('clear-cache', async () => {
  try {
    const ses = session.defaultSession;
    await ses.clearCache();
    return true;
  } catch (error) {
    return false;
  }
});

ipcMain.handle('clear-cookies', async (event, domain) => {
  try {
    const ses = session.defaultSession;
    if (domain) {
      // Remove cookies for specific domain (including subdomains)
      const cookies = await ses.cookies.get({});
      const cookiesToRemove = cookies.filter(cookie => {
        return cookie.domain === domain || 
               cookie.domain === `.${domain}` || 
               domain.includes(cookie.domain.replace(/^\./, ''));
      });
      
      for (const cookie of cookiesToRemove) {
        const url = `http${cookie.secure ? 's' : ''}://${cookie.domain.replace(/^\./, '')}${cookie.path}`;
        await ses.cookies.remove(url, cookie.name);
      }
    } else {
      // Clear all cookies
      await ses.clearStorageData({ storages: ['cookies'] });
    }
    return true;
  } catch (error) {
    console.error('Error clearing cookies:', error);
    return false;
  }
});

ipcMain.handle('delete-single-cookie', async (event, cookieData) => {
  try {
    const ses = session.defaultSession;
    await ses.cookies.remove(cookieData.url, cookieData.name);
    return true;
  } catch (error) {
    console.error('Error deleting single cookie:', error);
    return false;
  }
});

ipcMain.handle('get-cookies', async () => {
  try {
    const ses = session.defaultSession;
    const cookies = await ses.cookies.get({});
    return cookies;
  } catch (error) {
    return [];
  }
});

ipcMain.on('minimize-window', (event) => {
  BrowserWindow.fromWebContents(event.sender).minimize();
});

ipcMain.on('maximize-window', (event) => {
  const win = BrowserWindow.fromWebContents(event.sender);
  if (win.isMaximized()) {
    win.unmaximize();
  } else {
    win.maximize();
  }
});

ipcMain.on('close-window', (event) => {
  BrowserWindow.fromWebContents(event.sender).close();
});

ipcMain.on('toggle-fullscreen', (event) => {
  const win = BrowserWindow.fromWebContents(event.sender);
  win.setFullScreen(!win.isFullScreen());
});

ipcMain.on('create-new-window', () => {
  createWindow(false);
});

ipcMain.on('create-private-window', () => {
  createWindow(true);
});

ipcMain.on('quit-app', () => {
  app.quit();
});

ipcMain.handle('open-external', async (event, url) => {
  await shell.openExternal(url);
});

// App lifecycle
app.whenReady().then(() => {
  initializeDataFiles();
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('before-quit', () => {
  // Save current session if enabled
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send('save-session-before-quit');
  }
});
