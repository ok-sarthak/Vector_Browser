// Tab management
let tabs = [];
let activeTabId = null;
let tabIdCounter = 0;

// Settings
let currentSettings = {
  theme: 'light',
  homepage: 'https://www.google.com',
  searchEngine: 'https://www.google.com/search?q=',
  restoreSession: true
};

// History and bookmarks cache
let historyCache = [];
let bookmarksCache = [];

// Downloads
let downloads = [];

// Initialize the browser
async function init() {
  await loadSettings();
  applyTheme(currentSettings.theme);
  setupEventListeners();
  
  // Load session or create new tab
  if (currentSettings.restoreSession) {
    await restoreSession();
  }
  
  if (tabs.length === 0) {
    createTab(currentSettings.homepage);
  }
  
  // Load cached data
  await loadHistory();
  await loadBookmarks();
}

// Load settings
async function loadSettings() {
  try {
    const settings = await window.electronAPI.getSettings();
    currentSettings = { ...currentSettings, ...settings };
  } catch (error) {
    console.error('Error loading settings:', error);
  }
}

// Apply theme
function applyTheme(theme) {
  document.body.className = theme === 'dark' ? 'dark-theme' : 'light-theme';
  currentSettings.theme = theme;
}

// Setup event listeners
function setupEventListeners() {
  // Window controls
  document.getElementById('minimizeBtn').addEventListener('click', () => {
    window.electronAPI.minimizeWindow();
  });
  
  document.getElementById('maximizeBtn').addEventListener('click', () => {
    window.electronAPI.maximizeWindow();
  });
  
  document.getElementById('closeBtn').addEventListener('click', () => {
    window.electronAPI.closeWindow();
  });
  
  // Tab controls
  document.getElementById('newTabBtn').addEventListener('click', () => {
    createTab(currentSettings.homepage);
  });
  
  // Navigation buttons
  document.getElementById('backBtn').addEventListener('click', () => {
    const tab = getActiveTab();
    if (tab && tab.webview) {
      tab.webview.goBack();
    }
  });
  
  document.getElementById('forwardBtn').addEventListener('click', () => {
    const tab = getActiveTab();
    if (tab && tab.webview) {
      tab.webview.goForward();
    }
  });
  
  document.getElementById('reloadBtn').addEventListener('click', () => {
    const tab = getActiveTab();
    if (tab && tab.webview) {
      try {
        tab.webview.reload();
      } catch (error) {
        console.error('Error reloading:', error);
        // Try alternative reload
        const currentUrl = tab.webview.getURL();
        if (currentUrl) {
          tab.webview.loadURL(currentUrl);
        }
      }
    }
  });
  
  document.getElementById('homeBtn').addEventListener('click', () => {
    const tab = getActiveTab();
    if (tab && tab.webview) {
      navigateTo(currentSettings.homepage);
    }
  });
  
  // Address bar
  const urlInput = document.getElementById('urlInput');
  urlInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      handleUrlSubmit(urlInput.value);
    }
  });
  
  urlInput.addEventListener('input', (e) => {
    showSuggestions(e.target.value);
  });
  
  urlInput.addEventListener('focus', () => {
    urlInput.select();
  });
  
  // Click outside suggestions to close
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.address-bar-container')) {
      hideSuggestions();
    }
  });
  
  // Quick bookmark button
  document.getElementById('quickBookmarkBtn').addEventListener('click', () => {
    toggleBookmark();
  });
  
  // Toolbar buttons
  document.getElementById('bookmarksBtn').addEventListener('click', () => {
    showBookmarks();
  });
  
  document.getElementById('downloadsBtn').addEventListener('click', () => {
    showModal('downloadsModal');
  });
  
  document.getElementById('historyBtn').addEventListener('click', () => {
    showHistory();
  });
  
  document.getElementById('settingsBtn').addEventListener('click', () => {
    showSettings();
  });
  
  document.getElementById('themeToggle').addEventListener('click', () => {
    const newTheme = currentSettings.theme === 'light' ? 'dark' : 'light';
    applyTheme(newTheme);
  });
  
  // Hamburger menu
  document.getElementById('hamburgerMenuBtn').addEventListener('click', (e) => {
    e.stopPropagation();
    toggleHamburgerMenu();
  });
  
  // Hamburger menu close button
  document.getElementById('menuCloseBtn').addEventListener('click', () => {
    hideHamburgerMenu();
  });
  
  // Hamburger menu items - File section
  document.getElementById('menuNewTab').addEventListener('click', () => {
    createTab(currentSettings.homepage);
    hideHamburgerMenu();
  });
  
  document.getElementById('menuNewWindow').addEventListener('click', () => {
    window.electronAPI.createNewWindow();
    hideHamburgerMenu();
  });
  
  // Hamburger menu items - Edit section
  document.getElementById('menuUndo').addEventListener('click', () => {
    const tab = getActiveTab();
    if (tab && tab.webview) {
      tab.webview.undo();
    }
    hideHamburgerMenu();
  });
  
  document.getElementById('menuRedo').addEventListener('click', () => {
    const tab = getActiveTab();
    if (tab && tab.webview) {
      tab.webview.redo();
    }
    hideHamburgerMenu();
  });
  
  document.getElementById('menuSelectAll').addEventListener('click', () => {
    const tab = getActiveTab();
    if (tab && tab.webview) {
      tab.webview.selectAll();
    }
    hideHamburgerMenu();
  });
  
  // Hamburger menu items - View section
  document.getElementById('menuReload').addEventListener('click', () => {
    const tab = getActiveTab();
    if (tab && tab.webview) {
      tab.webview.reload();
    }
    hideHamburgerMenu();
  });
  
  document.getElementById('menuForceReload').addEventListener('click', () => {
    const tab = getActiveTab();
    if (tab && tab.webview) {
      tab.webview.reloadIgnoringCache();
    }
    hideHamburgerMenu();
  });
  
  document.getElementById('menuResetZoom').addEventListener('click', () => {
    const tab = getActiveTab();
    if (tab && tab.webview) {
      tab.webview.setZoomLevel(0);
    }
    hideHamburgerMenu();
  });
  
  document.getElementById('menuZoomIn').addEventListener('click', () => {
    const tab = getActiveTab();
    if (tab && tab.webview) {
      const currentZoom = tab.webview.getZoomLevel();
      tab.webview.setZoomLevel(currentZoom + 0.5);
    }
    hideHamburgerMenu();
  });
  
  document.getElementById('menuZoomOut').addEventListener('click', () => {
    const tab = getActiveTab();
    if (tab && tab.webview) {
      const currentZoom = tab.webview.getZoomLevel();
      tab.webview.setZoomLevel(currentZoom - 0.5);
    }
    hideHamburgerMenu();
  });
  
  document.getElementById('menuToggleFullscreen').addEventListener('click', () => {
    window.electronAPI.toggleFullscreen();
    hideHamburgerMenu();
  });
  
  // Hamburger menu items - History section
  document.getElementById('menuShowHistory').addEventListener('click', () => {
    showHistory();
    hideHamburgerMenu();
  });
  
  document.getElementById('menuClearHistory').addEventListener('click', async () => {
    hideHamburgerMenu();
    if (confirm('Are you sure you want to clear all browsing history and cookies?')) {
      await window.electronAPI.clearHistory();
      await window.electronAPI.clearCookies();
      historyCache = [];
    }
  });
  
  // Hamburger menu items - Bookmarks section
  document.getElementById('menuShowBookmarks').addEventListener('click', () => {
    showBookmarks();
    hideHamburgerMenu();
  });
  
  document.getElementById('menuBookmarkPage').addEventListener('click', () => {
    toggleBookmark();
    hideHamburgerMenu();
  });
  
  // Hamburger menu items - Exit
  document.getElementById('menuExit').addEventListener('click', () => {
    window.electronAPI.quitApp();
  });
  
  // Close hamburger menu when clicking outside
  document.addEventListener('click', (e) => {
    const hamburgerMenu = document.getElementById('hamburgerMenu');
    const hamburgerBtn = document.getElementById('hamburgerMenuBtn');
    if (!hamburgerMenu.contains(e.target) && !hamburgerBtn.contains(e.target)) {
      hideHamburgerMenu();
    }
  });
  
  // Modal close buttons
  document.querySelectorAll('.close-modal').forEach(btn => {
    btn.addEventListener('click', () => {
      hideModal(btn.dataset.modal);
    });
  });
  
  // Click outside modal to close
  document.querySelectorAll('.modal').forEach(modal => {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        hideModal(modal.id);
      }
    });
  });
  
  // History controls
  document.getElementById('historySearch').addEventListener('input', (e) => {
    filterHistory(e.target.value);
  });
  
  document.getElementById('clearHistoryBtn').addEventListener('click', async () => {
    if (confirm('Are you sure you want to clear all browsing history and cookies?')) {
      await window.electronAPI.clearHistory();
      await window.electronAPI.clearCookies(); // Also clear cookies automatically
      historyCache = [];
      showHistory();
    }
  });
  
  // Ad blocker controls
  document.getElementById('refreshAdBlockBtn').addEventListener('click', async () => {
    const btn = document.getElementById('refreshAdBlockBtn');
    const status = document.getElementById('adBlockStatus');
    
    btn.disabled = true;
    btn.textContent = '🛡️ Refreshing...';
    status.textContent = 'Downloading latest filter list...';
    status.className = 'adblock-status loading';
    
    try {
      const result = await window.electronAPI.refreshAdBlockList();
      if (result.success) {
        status.textContent = `✓ Successfully loaded ${result.count} blocking rules`;
        status.className = 'adblock-status success';
        setTimeout(() => {
          status.textContent = '';
        }, 5000);
      } else {
        status.textContent = `✗ Failed to refresh: ${result.error}`;
        status.className = 'adblock-status error';
      }
    } catch (error) {
      status.textContent = `✗ Error: ${error.message}`;
      status.className = 'adblock-status error';
    } finally {
      btn.disabled = false;
      btn.textContent = '🛡️ Refresh Ad Blocker';
    }
  });
  
  // Settings controls
  document.getElementById('themeSelect').addEventListener('change', (e) => {
    applyTheme(e.target.value);
  });
  
  document.getElementById('saveSettingsBtn').addEventListener('click', async () => {
    await saveSettings();
  });
  
  document.getElementById('clearCacheBtn').addEventListener('click', async () => {
    if (confirm('Clear browser cache?')) {
      await window.electronAPI.clearCache();
      alert('Cache cleared successfully!');
    }
  });
  
  document.getElementById('clearCookiesBtn').addEventListener('click', async () => {
    if (confirm('Clear all cookies?')) {
      await window.electronAPI.clearCookies();
      alert('Cookies cleared successfully!');
    }
  });
  
  document.getElementById('viewCookiesBtn').addEventListener('click', async () => {
    await showCookies();
  });
  
  // IPC listeners
  window.electronAPI.on('new-tab', () => {
    createTab(currentSettings.homepage);
  });
  
  window.electronAPI.on('show-history', () => {
    showHistory();
  });
  
  window.electronAPI.on('clear-history', async () => {
    if (confirm('Clear all browsing history and cookies?')) {
      await window.electronAPI.clearHistory();
      await window.electronAPI.clearCookies(); // Also clear cookies automatically
      historyCache = [];
    }
  });
  
  window.electronAPI.on('show-bookmarks', () => {
    showBookmarks();
  });
  
  window.electronAPI.on('bookmark-page', () => {
    toggleBookmark();
  });
  
  window.electronAPI.on('open-url-in-new-tab', (url) => {
    console.log('Opening URL in new tab:', url);
    createTab(url);
  });
  
  // Download events
  window.electronAPI.on('download-started', (downloadInfo) => {
    downloads.push({
      ...downloadInfo,
      progress: 0,
      state: 'downloading'
    });
    updateDownloadsList();
  });
  
  window.electronAPI.on('download-progress', (progressInfo) => {
    const download = downloads.find(d => d.id === progressInfo.id);
    if (download) {
      download.progress = progressInfo.progress || 0;
      download.state = progressInfo.state;
      download.receivedBytes = progressInfo.receivedBytes;
      updateDownloadsList();
    }
  });
  
  window.electronAPI.on('download-completed', (completedInfo) => {
    const download = downloads.find(d => d.id === completedInfo.id);
    if (download) {
      download.state = 'completed';
      download.progress = 100;
      updateDownloadsList();
    }
  });
  
  window.electronAPI.on('download-failed', (failedInfo) => {
    const download = downloads.find(d => d.id === failedInfo.id);
    if (download) {
      download.state = 'failed';
      download.error = failedInfo.error;
      updateDownloadsList();
    }
  });
  
  window.electronAPI.on('save-session-before-quit', async () => {
    await saveSession();
  });
}

// Tab functions
function createTab(url = 'vector://home') {
  const tabId = `tab-${tabIdCounter++}`;
  
  const tab = {
    id: tabId,
    title: 'New Tab',
    url: url,
    favicon: '🌐',
    canGoBack: false,
    canGoForward: false,
    isLoading: false,
    webview: null
  };
  
  tabs.push(tab);
  
  // Create tab UI
  const tabElement = document.createElement('div');
  tabElement.className = 'tab';
  tabElement.dataset.tabId = tabId;
  tabElement.innerHTML = `
    <span class="tab-favicon">${tab.favicon}</span>
    <span class="tab-title">${tab.title}</span>
    <button class="tab-close">×</button>
  `;
  
  tabElement.addEventListener('click', (e) => {
    if (!e.target.classList.contains('tab-close')) {
      switchTab(tabId);
    }
  });
  
  tabElement.querySelector('.tab-close').addEventListener('click', (e) => {
    e.stopPropagation();
    closeTab(tabId);
  });
  
  document.getElementById('tabsContainer').appendChild(tabElement);
  
  // Create webview
  const webview = document.createElement('webview');
  webview.id = tabId;
  webview.setAttribute('allowpopups', '');
  webview.setAttribute('webpreferences', 'contextIsolation=yes');
  
  // Handle special URLs
  if (url === 'vector://home') {
    url = 'https://www.google.com'; // Redirect home to Google
  }
  
  webview.src = url;
  
  // Webview event listeners
  webview.addEventListener('did-start-loading', () => {
    tab.isLoading = true;
    updateTabUI(tabId); // Update UI to show loading state
    updateNavigationButtons();
  });
  
  webview.addEventListener('did-stop-loading', () => {
    tab.isLoading = false;
    updateTabUI(tabId); // Update UI to remove loading state
    updateNavigationButtons();
  });
  
  webview.addEventListener('did-fail-load', (e) => {
    // Ignore -3 (ABORTED) errors which happen during normal navigation
    if (e.errorCode === -3) return;
    
    // Ignore if this is a sub-frame or if the error is for a different URL
    if (!e.isMainFrame) return;
    
    tab.isLoading = false;
    updateTabUI(tabId);
    
    // Show error page - construct path relative to current page
    const currentPath = window.location.href.replace('index.html', '');
    const errorUrl = encodeURIComponent(e.validatedURL);
    const errorCode = encodeURIComponent(e.errorDescription);
    const errorPage = `${currentPath}error.html?code=${errorCode}&url=${errorUrl}&desc=${encodeURIComponent(e.errorDescription)}`;
    
    console.log('Loading error page:', errorPage);
    webview.loadURL(errorPage);
  });
  
  webview.addEventListener('did-finish-load', async () => {
    tab.title = webview.getTitle() || 'New Tab';
    tab.url = webview.getURL();
    updateTabUI(tabId);
    updateAddressBar();
    updateNavigationButtons();
    
    // Add to history (if not internal page or error page)
    if (!tab.url.startsWith('vector://') && !tab.url.startsWith('file://')) {
      await window.electronAPI.addHistory({
        title: tab.title,
        url: tab.url
      });
      await loadHistory();
    }
  });
  
  webview.addEventListener('page-title-updated', (e) => {
    tab.title = e.title;
    updateTabUI(tabId);
  });
  
  webview.addEventListener('page-favicon-updated', (e) => {
    if (e.favicons && e.favicons.length > 0) {
      tab.favicon = `<img src="${e.favicons[0]}" class="tab-favicon" alt="">`;
      updateTabUI(tabId);
    }
  });
  
  webview.addEventListener('did-navigate', () => {
    tab.url = webview.getURL();
    tab.canGoBack = webview.canGoBack();
    tab.canGoForward = webview.canGoForward();
    updateAddressBar();
    updateNavigationButtons();
    updateBookmarkButton();
  });
  
  webview.addEventListener('did-navigate-in-page', () => {
    tab.url = webview.getURL();
    updateAddressBar();
    updateBookmarkButton();
  });
  
  // Popups are allowed and will open in separate windows
  
  // Handle external protocol links (mailto, tel, etc.)
  webview.addEventListener('will-navigate', (e) => {
    const url = e.url;
    // Handle external protocols
    if (url.startsWith('mailto:') || url.startsWith('tel:') || url.startsWith('sms:')) {
      e.preventDefault();
      window.electronAPI.openExternal(url);
    }
  });
  
  // Context menu
  webview.addEventListener('context-menu', (e) => {
    e.preventDefault();
    showContextMenu(e.params);
  });
  
  tab.webview = webview;
  document.getElementById('contentArea').appendChild(webview);
  
  switchTab(tabId);
}

function switchTab(tabId) {
  if (activeTabId === tabId) return;
  
  activeTabId = tabId;
  
  // Update tab UI
  document.querySelectorAll('.tab').forEach(t => {
    t.classList.toggle('active', t.dataset.tabId === tabId);
  });
  
  // Update webviews
  document.querySelectorAll('webview').forEach(wv => {
    wv.classList.toggle('active', wv.id === tabId);
  });
  
  updateAddressBar();
  updateNavigationButtons();
  updateBookmarkButton();
}

function closeTab(tabId) {
  const index = tabs.findIndex(t => t.id === tabId);
  if (index === -1) return;
  
  // Remove from array
  tabs.splice(index, 1);
  
  // Remove UI elements
  const tabElement = document.querySelector(`[data-tab-id="${tabId}"]`);
  if (tabElement) tabElement.remove();
  
  const webview = document.getElementById(tabId);
  if (webview) webview.remove();
  
  // If this was the active tab, switch to another
  if (activeTabId === tabId) {
    if (tabs.length > 0) {
      const newIndex = Math.min(index, tabs.length - 1);
      switchTab(tabs[newIndex].id);
    } else {
      activeTabId = null;
      // Optionally create a new tab
      createTab(currentSettings.homepage);
    }
  }
}

function getActiveTab() {
  return tabs.find(t => t.id === activeTabId);
}

function updateTabUI(tabId) {
  const tab = tabs.find(t => t.id === tabId);
  if (!tab) return;
  
  const tabElement = document.querySelector(`[data-tab-id="${tabId}"]`);
  if (!tabElement) return;
  
  const titleElement = tabElement.querySelector('.tab-title');
  let faviconElement = tabElement.querySelector('.tab-favicon');
  
  if (titleElement) titleElement.textContent = tab.title;
  if (faviconElement) {
    if (tab.isLoading) {
      // Show loading spinner
      faviconElement.textContent = '⟳';
      faviconElement.classList.add('loading');
    } else {
      // Show favicon
      faviconElement.classList.remove('loading');
      if (tab.favicon.startsWith('<img')) {
        faviconElement.outerHTML = tab.favicon;
      } else {
        faviconElement.textContent = tab.favicon;
      }
    }
  }
}

function updateAddressBar() {
  const tab = getActiveTab();
  const urlInput = document.getElementById('urlInput');
  const secureIcon = document.getElementById('secureIcon');
  
  if (tab) {
    urlInput.value = tab.url;
    
    // Update secure icon
    if (tab.url.startsWith('https://')) {
      secureIcon.textContent = '🔒';
      secureIcon.title = 'Secure connection';
    } else if (tab.url.startsWith('http://')) {
      secureIcon.textContent = '⚠️';
      secureIcon.title = 'Not secure';
    } else {
      secureIcon.textContent = '🌐';
      secureIcon.title = 'Internal page';
    }
  } else {
    urlInput.value = '';
    secureIcon.textContent = '🌐';
  }
}

function updateNavigationButtons() {
  const tab = getActiveTab();
  
  const backBtn = document.getElementById('backBtn');
  const forwardBtn = document.getElementById('forwardBtn');
  
  if (tab && tab.webview) {
    backBtn.disabled = !tab.webview.canGoBack();
    forwardBtn.disabled = !tab.webview.canGoForward();
  } else {
    backBtn.disabled = true;
    forwardBtn.disabled = true;
  }
}

function handleUrlSubmit(input) {
  let url = input.trim();
  if (!url) return;
  
  // Check if it's a URL or search query
  if (isValidUrl(url)) {
    // Add protocol if missing
    if (!url.match(/^[a-zA-Z]+:\/\//)) {
      url = 'https://' + url;
    }
  } else {
    // Use search engine
    url = currentSettings.searchEngine + encodeURIComponent(url);
  }
  
  navigateTo(url);
  hideSuggestions();
}

function isValidUrl(string) {
  // Check if it looks like a URL
  const urlPattern = /^(https?:\/\/)?([\w-]+(\.[\w-]+)+)(\/.*)?$/;
  const localhostPattern = /^(https?:\/\/)?(localhost|127\.0\.0\.1)(:[0-9]+)?(\/.*)?$/;
  return urlPattern.test(string) || localhostPattern.test(string) || string.startsWith('file://') || string.startsWith('vector://');
}

function navigateTo(url) {
  const tab = getActiveTab();
  if (tab && tab.webview) {
    if (url === 'vector://home') {
      url = 'https://www.google.com'; // Redirect home to Google
    }
    tab.webview.src = url;
  }
}

// Suggestions
function showSuggestions(query) {
  if (!query || query.length < 2) {
    hideSuggestions();
    return;
  }
  
  const suggestions = [];
  const queryLower = query.toLowerCase();
  
  // Search in bookmarks
  bookmarksCache.forEach(bookmark => {
    if (bookmark.title.toLowerCase().includes(queryLower) || 
        bookmark.url.toLowerCase().includes(queryLower)) {
      suggestions.push({
        icon: '⭐',
        text: bookmark.title,
        url: bookmark.url,
        type: 'bookmark'
      });
    }
  });
  
  // Search in history
  historyCache.slice(-50).reverse().forEach(item => {
    if (!suggestions.find(s => s.url === item.url)) {
      if (item.title.toLowerCase().includes(queryLower) || 
          item.url.toLowerCase().includes(queryLower)) {
        suggestions.push({
          icon: '🕐',
          text: item.title || item.url,
          url: item.url,
          type: 'history'
        });
      }
    }
  });
  
  // Limit suggestions
  const limitedSuggestions = suggestions.slice(0, 8);
  
  if (limitedSuggestions.length === 0) {
    hideSuggestions();
    return;
  }
  
  const dropdown = document.getElementById('suggestionsDropdown');
  dropdown.innerHTML = '';
  
  limitedSuggestions.forEach(suggestion => {
    const item = document.createElement('div');
    item.className = 'suggestion-item';
    item.innerHTML = `
      <span class="suggestion-icon">${suggestion.icon}</span>
      <span class="suggestion-text">${escapeHtml(suggestion.text)}</span>
    `;
    item.addEventListener('click', () => {
      navigateTo(suggestion.url);
      document.getElementById('urlInput').value = suggestion.url;
      hideSuggestions();
    });
    dropdown.appendChild(item);
  });
  
  dropdown.classList.add('show');
}

function hideSuggestions() {
  document.getElementById('suggestionsDropdown').classList.remove('show');
}

// Bookmarks
async function loadBookmarks() {
  try {
    bookmarksCache = await window.electronAPI.getBookmarks();
  } catch (error) {
    console.error('Error loading bookmarks:', error);
  }
}

async function toggleBookmark() {
  const tab = getActiveTab();
  if (!tab || tab.url.startsWith('vector://')) return;
  
  const existing = bookmarksCache.find(b => b.url === tab.url);
  
  if (existing) {
    // Remove bookmark
    await window.electronAPI.deleteBookmark(existing.id);
    await loadBookmarks();
    updateBookmarkButton();
  } else {
    // Add bookmark
    await window.electronAPI.addBookmark({
      title: tab.title,
      url: tab.url
    });
    await loadBookmarks();
    updateBookmarkButton();
  }
}

function updateBookmarkButton() {
  const tab = getActiveTab();
  const btn = document.getElementById('quickBookmarkBtn');
  
  if (tab && bookmarksCache.find(b => b.url === tab.url)) {
    btn.textContent = '★';
    btn.classList.add('bookmarked');
  } else {
    btn.textContent = '☆';
    btn.classList.remove('bookmarked');
  }
}

async function showBookmarks() {
  await loadBookmarks();
  
  const list = document.getElementById('bookmarksList');
  list.innerHTML = '';
  
  if (bookmarksCache.length === 0) {
    list.innerHTML = '<p class="empty-state">No bookmarks yet</p>';
  } else {
    bookmarksCache.forEach(bookmark => {
      const item = document.createElement('div');
      item.className = 'bookmark-item';
      item.innerHTML = `
        <span class="bookmark-favicon">⭐</span>
        <div class="bookmark-info">
          <div class="bookmark-title">${escapeHtml(bookmark.title)}</div>
          <div class="bookmark-url">${escapeHtml(bookmark.url)}</div>
        </div>
        <div class="bookmark-actions">
          <button class="btn-small" data-url="${escapeHtml(bookmark.url)}">Open</button>
          <button class="btn-small danger" data-id="${bookmark.id}">Delete</button>
        </div>
      `;
      
      item.querySelector('[data-url]').addEventListener('click', () => {
        navigateTo(bookmark.url);
        hideModal('bookmarksModal');
      });
      
      item.querySelector('[data-id]').addEventListener('click', async () => {
        await window.electronAPI.deleteBookmark(bookmark.id);
        await loadBookmarks();
        showBookmarks();
        updateBookmarkButton(); // Update the star button immediately
      });
      
      list.appendChild(item);
    });
  }
  
  showModal('bookmarksModal');
}

// History
async function loadHistory() {
  try {
    historyCache = await window.electronAPI.getHistory();
  } catch (error) {
    console.error('Error loading history:', error);
  }
}

async function showHistory() {
  await loadHistory();
  filterHistory('');
  showModal('historyModal');
}

function filterHistory(query) {
  const list = document.getElementById('historyList');
  list.innerHTML = '';
  
  let filtered = historyCache;
  
  if (query) {
    const queryLower = query.toLowerCase();
    filtered = historyCache.filter(item => 
      item.title.toLowerCase().includes(queryLower) || 
      item.url.toLowerCase().includes(queryLower)
    );
  }
  
  if (filtered.length === 0) {
    list.innerHTML = '<p class="empty-state">No history found</p>';
    return;
  }
  
  // Sort by timestamp (newest first)
  filtered.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
  
  filtered.forEach(item => {
    const historyItem = document.createElement('div');
    historyItem.className = 'history-item';
    
    const date = new Date(item.timestamp);
    const timeStr = formatTime(date);
    
    historyItem.innerHTML = `
      <div class="history-info">
        <div class="history-title">${escapeHtml(item.title)}</div>
        <div class="history-url">${escapeHtml(item.url)}</div>
        <div class="history-time">${timeStr}</div>
      </div>
      <div class="bookmark-actions">
        <button class="btn-small" data-url="${escapeHtml(item.url)}">Open</button>
        <button class="btn-small danger" data-delete-url="${escapeHtml(item.url)}">Delete</button>
      </div>
    `;
    
    historyItem.querySelector('[data-url]').addEventListener('click', () => {
      navigateTo(item.url);
      hideModal('historyModal');
    });
    
    historyItem.querySelector('[data-delete-url]').addEventListener('click', async () => {
      await window.electronAPI.deleteHistoryItem(item.url);
      await loadHistory();
      filterHistory(document.getElementById('historySearch').value);
    });
    
    list.appendChild(historyItem);
  });
}

// Settings
async function showSettings() {
  await loadSettings();
  
  document.getElementById('themeSelect').value = currentSettings.theme;
  document.getElementById('homepageInput').value = currentSettings.homepage;
  document.getElementById('searchEngineInput').value = currentSettings.searchEngine;
  document.getElementById('restoreSessionCheck').checked = currentSettings.restoreSession;
  
  showModal('settingsModal');
}

async function saveSettings() {
  currentSettings.theme = document.getElementById('themeSelect').value;
  currentSettings.homepage = document.getElementById('homepageInput').value;
  currentSettings.searchEngine = document.getElementById('searchEngineInput').value;
  currentSettings.restoreSession = document.getElementById('restoreSessionCheck').checked;
  
  await window.electronAPI.saveSettings(currentSettings);
  applyTheme(currentSettings.theme);
  
  alert('Settings saved successfully!');
}

// Cookies
async function showCookies() {
  const cookies = await window.electronAPI.getCookies();
  const list = document.getElementById('cookiesList');
  list.innerHTML = '';
  
  if (cookies.length === 0) {
    list.innerHTML = '<p class="empty-state">No cookies found</p>';
  } else {
    // Group by domain
    const groupedCookies = {};
    cookies.forEach(cookie => {
      if (!groupedCookies[cookie.domain]) {
        groupedCookies[cookie.domain] = [];
      }
      groupedCookies[cookie.domain].push(cookie);
    });
    
    Object.keys(groupedCookies).sort().forEach(domain => {
      const item = document.createElement('div');
      item.className = 'cookie-item';
      item.style.cursor = 'pointer';
      item.innerHTML = `
        <div class="cookie-domain">${escapeHtml(domain)}</div>
        <div class="cookie-name">${groupedCookies[domain].length} cookie(s)</div>
        <button class="btn-small danger" data-domain="${escapeHtml(domain)}">Delete All</button>
      `;
      
      // Click on domain to view detailed cookies
      item.addEventListener('click', (e) => {
        if (!e.target.classList.contains('btn-small')) {
          showDetailedCookiesForDomain(domain, groupedCookies[domain]);
        }
      });
      
      item.querySelector('[data-domain]').addEventListener('click', async (e) => {
        e.stopPropagation();
        if (confirm(`Delete all cookies for ${domain}?`)) {
          await window.electronAPI.clearCookies(domain);
          showCookies();
        }
      });
      
      list.appendChild(item);
    });
  }
  
  showModal('cookiesModal');
}

// Show detailed cookies for a specific domain
async function showDetailedCookiesForDomain(domain, domainCookies) {
  // Update modal title and URL
  document.getElementById('siteCookiesTitle').textContent = `Cookies for ${domain}`;
  document.getElementById('siteCookiesUrl').textContent = `${domainCookies.length} cookie(s) stored`;
  
  const list = document.getElementById('siteCookiesList');
  list.innerHTML = '';
  
  domainCookies.forEach(cookie => {
    const item = document.createElement('div');
    item.className = 'cookie-item';
    
    const cookieInfo = document.createElement('div');
    cookieInfo.className = 'cookie-info';
    cookieInfo.innerHTML = `
      <div class="cookie-domain">${escapeHtml(cookie.name)}</div>
      <div class="cookie-name">Domain: ${escapeHtml(cookie.domain)}</div>
    `;
    
    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'btn-small danger';
    deleteBtn.textContent = 'Delete';
    deleteBtn.addEventListener('click', async () => {
      // Delete using the original domain grouping key, not the cookie's domain
      const result = await window.electronAPI.deleteSingleCookie({
        url: `http${cookie.secure ? 's' : ''}://${cookie.domain.replace(/^\./, '')}${cookie.path}`,
        name: cookie.name
      });
      
      // Refresh the detailed view
      const allCookies = await window.electronAPI.getCookies();
      const updatedDomainCookies = allCookies.filter(c => {
        return c.domain === domain || 
               c.domain === `.${domain}` || 
               domain.endsWith(c.domain.replace(/^\./, ''));
      });
      if (updatedDomainCookies.length > 0) {
        showDetailedCookiesForDomain(domain, updatedDomainCookies);
      } else {
        hideModal('siteCookiesModal');
        showCookies(); // Go back to main cookies list
      }
    });
    
    item.appendChild(cookieInfo);
    item.appendChild(deleteBtn);
    list.appendChild(item);
  });
  
  // Add "Clear All" button
  const clearAllBtn = document.createElement('button');
  clearAllBtn.className = 'btn-danger';
  clearAllBtn.textContent = `Clear All Cookies for ${domain}`;
  clearAllBtn.style.marginTop = '12px';
  clearAllBtn.addEventListener('click', async () => {
    if (confirm(`Delete all cookies for ${domain}?`)) {
      await window.electronAPI.clearCookies(domain);
      hideModal('siteCookiesModal');
      showCookies(); // Go back to main cookies list
    }
  });
  list.appendChild(clearAllBtn);
  
  // Close the main cookies modal and show the detailed modal
  hideModal('cookiesModal');
  showModal('siteCookiesModal');
}

// Session management
async function saveSession() {
  const sessionData = {
    tabs: tabs.map(tab => ({
      url: tab.url,
      title: tab.title
    }))
  };
  
  await window.electronAPI.saveSession(sessionData);
}

async function restoreSession() {
  try {
    const sessionData = await window.electronAPI.getSession();
    
    if (sessionData && sessionData.tabs && sessionData.tabs.length > 0) {
      sessionData.tabs.forEach(tabData => {
        createTab(tabData.url);
      });
    }
  } catch (error) {
    console.error('Error restoring session:', error);
  }
}

// Context Menu
function showContextMenu(params) {
  // Remove any existing context menu first to prevent double menus
  const existingMenu = document.querySelector('.context-menu');
  if (existingMenu) {
    existingMenu.remove();
  }
  
  // Create a custom context menu
  const menu = document.createElement('div');
  menu.className = 'context-menu';
  menu.style.position = 'fixed';
  menu.style.left = params.x + 'px';
  menu.style.top = params.y + 'px';
  
  // Add close button
  const closeBtn = document.createElement('div');
  closeBtn.className = 'context-menu-close';
  closeBtn.innerHTML = '×';
  menu.appendChild(closeBtn);
  
  const menuItems = [];
  
  // Link context menu
  if (params.linkURL) {
    menuItems.push(
      { label: 'Open Link in New Tab', action: () => createTab(params.linkURL) },
      { label: 'Copy Link Address', action: () => navigator.clipboard.writeText(params.linkURL) }
    );
  }
  
  // Image context menu
  if (params.hasImageContents) {
    if (params.srcURL) {
      menuItems.push(
        { label: 'Open Image in New Tab', action: () => createTab(params.srcURL) },
        { label: 'Copy Image Address', action: () => navigator.clipboard.writeText(params.srcURL) },
        { label: 'Download Image', action: () => downloadFile(params.srcURL) }
      );
    }
  }
  
  // Text selection context menu
  if (params.selectionText) {
    const searchUrl = currentSettings.searchEngine + encodeURIComponent(params.selectionText);
    menuItems.push(
      { label: 'Copy', action: () => navigator.clipboard.writeText(params.selectionText) },
      { label: 'Search for "' + params.selectionText.substring(0, 20) + (params.selectionText.length > 20 ? '...' : '') + '"', action: () => createTab(searchUrl) }
    );
  }
  
  // Default context menu (if no specific context)
  if (menuItems.length === 0) {
    const tab = getActiveTab();
    menuItems.push(
      { label: 'Back', action: () => tab?.webview?.goBack(), disabled: !tab?.webview?.canGoBack() },
      { label: 'Forward', action: () => tab?.webview?.goForward(), disabled: !tab?.webview?.canGoForward() },
      { label: 'Reload', action: () => tab?.webview?.reload() },
      { separator: true },
      { label: 'Save Page As...', action: () => alert('Save functionality coming soon!') },
      { label: 'Print...', action: () => tab?.webview?.print() },
      { separator: true },
      { label: 'View Page Source', action: () => tab?.webview?.openDevTools() }
    );
  }
  
  // Build menu HTML
  menuItems.forEach(item => {
    if (item.separator) {
      const separator = document.createElement('div');
      separator.className = 'context-menu-separator';
      menu.appendChild(separator);
    } else {
      const menuItem = document.createElement('div');
      menuItem.className = 'context-menu-item' + (item.disabled ? ' disabled' : '');
      menuItem.textContent = item.label;
      
      if (!item.disabled) {
        menuItem.addEventListener('click', (e) => {
          e.stopPropagation();
          item.action();
          closeMenu();
        });
      }
      
      menu.appendChild(menuItem);
    }
  });
  
  document.body.appendChild(menu);
  
  // Adjust position to keep menu within viewport
  const menuRect = menu.getBoundingClientRect();
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;
  
  let left = params.x;
  let top = params.y;
  
  // Adjust horizontal position if menu goes off right edge
  if (left + menuRect.width > viewportWidth) {
    left = viewportWidth - menuRect.width - 10; // 10px padding from edge
  }
  
  // Adjust vertical position if menu goes off bottom edge
  if (top + menuRect.height > viewportHeight) {
    top = viewportHeight - menuRect.height - 10; // 10px padding from edge
  }
  
  // Ensure menu doesn't go off left or top edges
  left = Math.max(10, left);
  top = Math.max(10, top);
  
  menu.style.left = left + 'px';
  menu.style.top = top + 'px';
  
  // Close menu function
  const closeMenu = () => {
    if (menu.parentNode) {
      document.body.removeChild(menu);
    }
    document.removeEventListener('click', handleOutsideClick);
    document.removeEventListener('contextmenu', handleContextMenu);
  };
  
  // Add close button click handler
  closeBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    closeMenu();
  });
  
  // Handle clicks outside the menu
  const handleOutsideClick = (e) => {
    if (!menu.contains(e.target)) {
      closeMenu();
    }
  };
  
  // Handle right-clicks to close menu
  const handleContextMenu = (e) => {
    e.preventDefault();
    closeMenu();
  };
  
  // Add event listeners after a short delay to avoid immediate closing
  setTimeout(() => {
    document.addEventListener('click', handleOutsideClick);
    document.addEventListener('contextmenu', handleContextMenu);
  }, 100);
}

// Download file helper
function downloadFile(url) {
  const tab = getActiveTab();
  if (tab && tab.webview) {
    tab.webview.downloadURL(url);
  }
}

// Modal helpers
function showModal(modalId) {
  document.getElementById(modalId).classList.add('show');
}

function hideModal(modalId) {
  document.getElementById(modalId).classList.remove('show');
}

// Utility functions
function updateDownloadsList() {
  const list = document.getElementById('downloadsList');
  list.innerHTML = '';
  
  if (downloads.length === 0) {
    list.innerHTML = '<p class="empty-state">No downloads yet</p>';
    return;
  }
  
  downloads.slice().reverse().forEach(download => {
    const item = document.createElement('div');
    item.className = 'download-item';
    
    let statusText = '';
    let progressBar = '';
    
    if (download.state === 'downloading' || download.state === 'progressing') {
      statusText = `Downloading... ${Math.round(download.progress || 0)}%`;
      progressBar = `<div class="download-progress-bar"><div class="download-progress-fill" style="width: ${download.progress || 0}%"></div></div>`;
    } else if (download.state === 'completed') {
      statusText = 'Completed';
    } else if (download.state === 'failed') {
      statusText = `Failed: ${download.error || 'Unknown error'}`;
    } else if (download.state === 'paused') {
      statusText = 'Paused';
    }
    
    item.innerHTML = `
      <div class="download-info">
        <div class="download-name">${escapeHtml(download.fileName)}</div>
        <div class="download-status">${statusText}</div>
        <div class="download-path">${download.state === 'completed' ? escapeHtml(download.savePath) : ''}</div>
        ${progressBar}
      </div>
      <div class="download-actions">
        ${download.state === 'completed' ? `<button class="btn-small" onclick="showInFolder('${escapeHtml(download.savePath)}')">Show in Folder</button>` : ''}
      </div>
    `;
    
    list.appendChild(item);
  });
}

function showInFolder(filePath) {
  // Extract directory from full path
  const lastSlash = Math.max(filePath.lastIndexOf('\\'), filePath.lastIndexOf('/'));
  const folderPath = filePath.substring(0, lastSlash);
  window.electronAPI.openExternal(`file:///${folderPath}`);
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function formatTime(date) {
  const now = new Date();
  const diff = now - date;
  
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
  if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  if (days < 7) return `${days} day${days > 1 ? 's' : ''} ago`;
  
  return date.toLocaleDateString();
}

// Hamburger menu functions
function toggleHamburgerMenu() {
  const menu = document.getElementById('hamburgerMenu');
  menu.classList.toggle('show');
}

function hideHamburgerMenu() {
  const menu = document.getElementById('hamburgerMenu');
  menu.classList.remove('show');
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

// Save session periodically
setInterval(async () => {
  if (currentSettings.restoreSession) {
    await saveSession();
  }
}, 30000); // Every 30 seconds
