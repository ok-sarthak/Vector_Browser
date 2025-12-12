<div align="center">

<img src="assets/icon.png" alt="Vector Browser Logo" width="150" height="150" style="border-radius: 24px">

# Vector Browser

![Version](https://img.shields.io/badge/version-1.1.1-blue.svg)
![Electron](https://img.shields.io/badge/Electron-28.0.0-47848F.svg)
![Platform](https://img.shields.io/badge/platform-Windows-0078D6.svg)

**A Modern, Feature-Rich Chromium-Based Desktop Web Browser Built with Electron**

[Features](#-features) • [Installation](#-installation) • [Build](#-build-from-source) • [Architecture](#-architecture) • [Contributing](#-contributing)

</div>

---

## 📖 Overview

Vector Browser is a modern, lightweight web browser built on the Electron framework, leveraging Chromium's powerful rendering engine. Designed with user experience and privacy in mind, Vector Browser offers a seamless browsing experience with advanced features like bookmark management, download tracking, and comprehensive cookie control.

This project demonstrates advanced Electron development techniques, including custom UI implementation, IPC (Inter-Process Communication), session management, and webview integration.

## ✨ Features

### 🎯 Core Browsing Features
- **Multi-Tab Support**: Full-featured tab management with unlimited tabs
- **Tab Session Persistence**: Automatically restore your browsing sessions
- **Custom Address Bar**: Intelligent URL/search detection with auto-suggestions
- **Navigation Controls**: Back, forward, reload, home, and fullscreen support
- **Secure Connection Indicators**: Visual HTTPS/HTTP status indicators
- **Error Handling**: Custom error pages with detailed error information

### 🔐 Privacy & Security
- **Cookie Management**: View, inspect, and delete cookies per domain
- **Cache Control**: Clear browser cache on demand
- **Secure Downloads**: Dedicated download folder with progress tracking

### 📚 Data Management
- **Bookmark System**: 
  - Quick bookmark any page with one click
  - Organized bookmark management interface
  - Star indicator for bookmarked pages
  
- **Browsing History**:
  - Comprehensive history tracking with timestamps
  - Search and filter capabilities
  - Individual entry deletion
  - Bulk clear operations

- **Download Manager**:
  - Real-time download progress tracking
  - Download state monitoring (downloading, completed, failed)
  - Custom download directory (Vector Browser folder)
  - Quick access to downloaded files

### 🎨 User Interface
- **Modern Glass-Morphism Design**: Beautiful frosted glass effects throughout the UI
- **Light/Dark Theme Support**: Seamless theme switching
- **Responsive Layout**: Fluid design that adapts to window size
- **Custom Window Controls**: Frameless window with custom minimize/maximize/close buttons
- **Hamburger Menu**: Comprehensive menu with all browser functions
- **Context Menus**: Right-click context menus with relevant actions

### ⚙️ Settings & Customization
- **Homepage Configuration**: Set your preferred homepage
- **Search Engine Selection**: Choose your default search provider
- **Theme Preferences**: Light or dark mode selection
- **Session Restore**: Toggle automatic session restoration
- **Keyboard Shortcuts**: Industry-standard keyboard shortcuts

### 🔧 Advanced Features
- **Webview Integration**: Each tab runs in an isolated webview for security
- **Multi-Window Support**: Create multiple browser windows
- **External Link Handling**: Proper handling of mailto:, tel:, and other protocols
- **Zoom Controls**: Adjust page zoom levels
- **Developer Tools**: Integrated Chromium DevTools access
- **Print Functionality**: Print web pages directly

## 🏗️ Architecture

### Technology Stack
- **Framework**: Electron 28.0.0
- **Renderer**: Chromium (via Electron)
- **Language**: JavaScript (ES6+)
- **UI**: HTML5, CSS3 (Custom Glass-Morphism Design)
- **Build Tool**: electron-builder

### Project Structure
```
Vector/
├── src/
│   ├── main.js          # Main process (Electron backend)
│   └── preload.js       # Preload script (IPC bridge)
├── pages/
│   ├── index.html       # Main browser UI
│   ├── renderer.js      # Renderer process logic
│   ├── styles.css       # Main stylesheet
│   ├── error.html       # Error page template
│   ├── home.html        # Home page (optional)
│   └── icon-enhancements.css  # Icon styling
├── assets/
│   ├── icon.ico         # Windows application icon
│   └── icon.png         # PNG icon for builds
├── package.json         # Project dependencies and scripts
└── README.md           # This file
```

### Core Components

#### 1. **Main Process (`src/main.js`)**
- **Window Management**: Creates and manages browser windows
- **IPC Handlers**: Processes requests from renderer
- **File System Operations**: Manages history, bookmarks, settings, and sessions
- **Download Management**: Handles file downloads from webviews
- **Cookie & Cache Control**: Manages browser data storage
- **Menu System**: Application menu and shortcuts

**Key Functions:**
- `createWindow(isPrivate)`: Creates new browser windows
- Session management handlers
- Download event handlers
- Data persistence (JSON-based storage)

#### 2. **Preload Script (`src/preload.js`)**
- **Context Bridge**: Secure communication channel between main and renderer
- **API Exposure**: Exposes safe Electron APIs to the renderer
- **Event Forwarding**: Handles IPC event subscriptions

**Exposed APIs:**
- History management
- Bookmark operations
- Settings control
- Cookie and cache management
- Window controls
- External link handling

#### 3. **Renderer Process (`pages/renderer.js`)**
- **Tab Management**: Creates, switches, and closes tabs
- **Webview Control**: Manages individual webview instances
- **UI Updates**: Synchronizes UI with browser state
- **Event Handling**: Processes user interactions
- **Session Restoration**: Restores previous browsing sessions

**Key Features:**
- Dynamic tab creation with webview isolation
- Real-time URL/search suggestions
- Context menu implementation
- Modal dialog management
- Theme switching

#### 4. **User Interface (`pages/index.html` + `pages/styles.css`)**
- **Custom Titlebar**: Frameless window with custom controls
- **Tab Bar**: Draggable tabs with close buttons
- **Address Bar**: URL input with suggestions dropdown
- **Toolbar**: Navigation and feature buttons
- **Modal System**: Settings, bookmarks, history, downloads, and cookies
- **Glass-Morphism Styling**: Modern frosted glass effects

### Data Storage

All user data is stored in JSON format in the Electron userData directory:

```
%APPDATA%/vector-browser/
├── history.json        # Browsing history (max 1000 items)
├── bookmarks.json      # Saved bookmarks
├── settings.json       # User preferences
└── sessions.json       # Tab sessions for restoration
```

### Security Model

1. **Context Isolation**: Enabled for all webviews and windows
2. **Node Integration**: Disabled in renderer processes
3. **Preload Script**: Controlled API exposure via contextBridge
4. **Content Security**: Each tab runs in isolated webview

## 🚀 Installation

### Prerequisites
- **Node.js**: Version 14 or higher
- **npm**: Version 6 or higher
- **Windows**: Windows 7 or higher (current build target)

### Quick Start

1. **Clone the repository**
```bash
git clone https://github.com/ok-sarthak/Vector_Browser.git
cd Vector_Browser
```

2. **Install dependencies**
```bash
npm install
```

3. **Run in development mode**
```bash
npm start
```

## 🔨 Build from Source

### Development Build
```bash
npm start
```

### Production Build

**Windows NSIS Installer:**
```bash
npm run build
```
Creates an installer at: `dist/Vector Browser-1.0.0-Setup.exe`

**Windows Portable:**
```bash
npm run build:portable
```
Creates a portable executable at: `dist/Vector Browser-1.0.0.exe`

**All Platforms:**
```bash
npm run build:all
```
Builds for Windows, macOS, and Linux

### Build Configuration

The build is configured in `package.json` under the `build` section:
- **App ID**: `com.vector.browser`
- **Product Name**: Vector Browser
- **Target Platforms**: Windows (x64)
- **Output Formats**: NSIS installer, Portable executable

## 🎮 Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl+T` | New Tab |
| `Ctrl+N` | New Window |
| `Ctrl+D` | Bookmark Current Page |
| `Ctrl+Shift+B` | Show Bookmarks |
| `Ctrl+R` | Reload Page |
| `Ctrl+Shift+R` | Force Reload Page |
| `F11` | Toggle Fullscreen |
| `Alt+F4` | Exit Browser |
| `Ctrl+Plus` | Zoom In |
| `Ctrl+Minus` | Zoom Out |
| `Ctrl+0` | Reset Zoom |


## 🎯 Key Technical Highlights

### 1. **Advanced Webview Management**
- Each tab is an isolated `<webview>` element
- Event-driven architecture for webview lifecycle
- Automatic error handling and recovery
- Download interception from webviews

### 2. **IPC Communication**
- Secure bidirectional communication using `ipcRenderer` and `ipcMain`
- Context isolation with `contextBridge`
- Event-based architecture for real-time updates

### 3. **Session Management**
- Automatic session saving every 30 seconds
- Tab restoration on browser startup
- Configurable session persistence

### 4. **Download Management**
- Intercepts downloads from all webviews
- Real-time progress tracking
- Custom download directory
- Download state management

### 5. **Cookie Control**
- Domain-based cookie grouping
- Individual cookie inspection
- Bulk and individual deletion
- Session cookie isolation

### 6. **Modern UI/UX**
- Glass-morphism design language
- Smooth animations and transitions
- Responsive layout
- Accessibility considerations

## 🔧 Development

### Code Structure

**Main Process (`main.js`):**
- Electron lifecycle management
- Window creation and management
- IPC handler registration
- File system operations
- Download management

**Renderer Process (`renderer.js`):**
- Tab lifecycle management
- DOM manipulation
- Event handling
- UI state management

**Styling (`styles.css`):**
- CSS custom properties for theming
- Glass-morphism effects
- Responsive design
- Dark/Light theme variants

### Adding New Features

1. **Add IPC Handler** (main.js):
```javascript
ipcMain.handle('new-feature', async (event, data) => {
  // Implementation
  return result;
});
```

2. **Expose API** (preload.js):
```javascript
contextBridge.exposeInMainWorld('electronAPI', {
  newFeature: (data) => ipcRenderer.invoke('new-feature', data)
});
```

3. **Use in Renderer** (renderer.js):
```javascript
const result = await window.electronAPI.newFeature(data);
```

## 🐛 Known Issues

- **In Development**: This is a beta version intended for development purposes
- Some advanced features may not work on all websites
- Print functionality requires additional implementation
- There might be many Security Issues
- Save page feature is not yet implemented


## 👨‍💻 Author

**Sarthak Chakraborty**

- Email: sarthak@vacantvectors.com
- GitHub: [@ok-sarthak](https://github.com/ok-sarthak)

## 🤝 Contributing

Contributions, issues, and feature requests are welcome!

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 🙏 Acknowledgments

- Built with [Electron](https://www.electronjs.org/)
- Powered by [Chromium](https://www.chromium.org/)
- Icon design and UI inspiration from modern browser designs

## 📊 Project Stats

- **Lines of Code**: ~3,500+
- **Files**: 11 core files
- **Dependencies**: Minimal (Electron + electron-builder)

## 🔒 Security

If you discover a security vulnerability, please email sarthak@vacantvectors.com.

## 💡 Why Vector Browser?

Vector Browser was created to demonstrate:
- Advanced Electron development techniques
- Chromium integration and webview management
- Modern UI/UX design principles
- Secure IPC communication patterns
- Desktop application architecture
- Browser engine fundamentals

Perfect for learning, portfolio showcasing, or as a foundation for custom browser solutions!

---

<div align="center">

**Made by Sarthak Chakraborty**

[⬆ Back to Top](#vector-browser)

</div>
