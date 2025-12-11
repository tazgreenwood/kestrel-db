import { app, shell, BrowserWindow, ipcMain, Menu, dialog } from 'electron'
import { join } from 'path'
import { promises as fs } from 'fs'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import { autoUpdater } from 'electron-updater'
import icon from '../../resources/icon.png?asset'
import * as db from './database'
import * as keytar from 'keytar'

// Track all windows
const windows = new Map<number, BrowserWindow>()

function createWindow(): BrowserWindow {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    show: false,
    transparent: true,
    titleBarStyle: 'hidden',
    icon: icon,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })

  // Track this window
  const windowId = mainWindow.webContents.id
  windows.set(windowId, mainWindow)

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
  })

  // Clean up when window closes
  mainWindow.on('closed', async () => {
    windows.delete(windowId)
    await db.cleanupWindow(windowId)
    console.log(`Window ${windowId} closed and cleaned up`)
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // HMR for renderer base on electron-vite cli.
  // Load the remote URL for development or the local html file for production.
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }

  return mainWindow
}

// Create native application menu for macOS (enables Cmd+C, Cmd+V, etc.)
function createApplicationMenu(): void {
  const isMac = process.platform === 'darwin'

  const template: Electron.MenuItemConstructorOptions[] = [
    // App Menu (macOS only)
    ...(isMac
      ? [
          {
            label: app.name,
            submenu: [
              { role: 'about' as const },
              { type: 'separator' as const },
              { role: 'services' as const },
              { type: 'separator' as const },
              { role: 'hide' as const },
              { role: 'hideOthers' as const },
              { role: 'unhide' as const },
              { type: 'separator' as const },
              { role: 'quit' as const }
            ]
          }
        ]
      : []),

    // Edit Menu (critical for copy/paste)
    {
      label: 'Edit',
      submenu: [
        { role: 'undo' as const },
        { role: 'redo' as const },
        { type: 'separator' as const },
        { role: 'cut' as const },
        { role: 'copy' as const },
        { role: 'paste' as const },
        ...(isMac
          ? [
              { role: 'pasteAndMatchStyle' as const },
              { role: 'delete' as const },
              { role: 'selectAll' as const }
            ]
          : [
              { role: 'delete' as const },
              { type: 'separator' as const },
              { role: 'selectAll' as const }
            ])
      ]
    },

    // View Menu
    {
      label: 'View',
      submenu: [
        { role: 'reload' as const },
        { role: 'forceReload' as const },
        { role: 'toggleDevTools' as const },
        { type: 'separator' as const },
        { role: 'resetZoom' as const },
        { role: 'zoomIn' as const },
        { role: 'zoomOut' as const },
        { type: 'separator' as const },
        { role: 'togglefullscreen' as const }
      ]
    },

    // Window Menu
    {
      label: 'Window',
      submenu: [
        {
          label: 'New Window',
          accelerator: 'CmdOrCtrl+N',
          click: () => {
            createWindow()
          }
        },
        { type: 'separator' as const },
        { role: 'minimize' as const },
        { role: 'zoom' as const },
        ...(isMac
          ? [
              { type: 'separator' as const },
              { role: 'front' as const },
              { type: 'separator' as const },
              { role: 'window' as const },
              { type: 'separator' as const },
              { role: 'close' as const }
            ]
          : [{ role: 'close' as const }])
      ]
    }
  ]

  const menu = Menu.buildFromTemplate(template)
  Menu.setApplicationMenu(menu)
}

// Setup database IPC handlers
function setupDatabaseHandlers(): void {
  // Test connection and get list of databases
  ipcMain.handle('db:test-connection', async (event, creds: db.DbCredentials) => {
    const windowId = event.sender.id
    try {
      const databases = await db.testConnection(windowId, creds)
      return { success: true, data: databases }
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : String(error) }
    }
  })

  // Select a database
  ipcMain.handle('db:select-database', async (event, dbName: string) => {
    const windowId = event.sender.id
    try {
      await db.selectDatabase(windowId, dbName)
      return { success: true }
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : String(error) }
    }
  })

  // Get tables from current database
  ipcMain.handle('db:get-tables', async (event) => {
    const windowId = event.sender.id
    try {
      const tables = await db.getTables(windowId)
      return { success: true, data: tables }
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : String(error) }
    }
  })

  // Get column information for a table
  ipcMain.handle('db:get-table-columns', async (event, tableName: string) => {
    const windowId = event.sender.id
    try {
      const columns = await db.getTableColumns(windowId, tableName)
      return { success: true, data: columns }
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : String(error) }
    }
  })

  // Get complete table structure (columns + indexes)
  ipcMain.handle('db:get-table-structure', async (event, tableName: string) => {
    const windowId = event.sender.id
    try {
      const structure = await db.getTableStructure(windowId, tableName)
      return { success: true, data: structure }
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : String(error) }
    }
  })

  // Query a table
  ipcMain.handle('db:query-table', async (event, tableName: string, options?: db.QueryOptions) => {
    const windowId = event.sender.id
    try {
      const result = await db.queryTable(windowId, tableName, options)
      return { success: true, data: result }
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : String(error) }
    }
  })

  // Execute raw SQL query
  ipcMain.handle('db:execute-query', async (event, query: string, timeout?: number) => {
    const windowId = event.sender.id
    try {
      const result = await db.executeQuery(windowId, query, timeout)
      return { success: true, data: result }
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : String(error) }
    }
  })

  // Disconnect
  ipcMain.handle('db:disconnect', async (event) => {
    const windowId = event.sender.id
    try {
      await db.disconnect(windowId)
      return { success: true }
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : String(error) }
    }
  })
}

// Setup file dialog handlers
function setupFileDialogHandlers(): void {
  // Show save dialog for exporting settings
  ipcMain.handle('dialog:save-settings', async (_, defaultPath?: string) => {
    try {
      const result = await dialog.showSaveDialog({
        title: 'Export Settings',
        defaultPath: defaultPath || 'kestrel-settings.json',
        filters: [{ name: 'JSON Files', extensions: ['json'] }],
        properties: ['createDirectory', 'showOverwriteConfirmation']
      })

      return { success: true, data: result }
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : String(error) }
    }
  })

  // Show open dialog for importing settings
  ipcMain.handle('dialog:open-settings', async () => {
    try {
      const result = await dialog.showOpenDialog({
        title: 'Import Settings',
        filters: [{ name: 'JSON Files', extensions: ['json'] }],
        properties: ['openFile']
      })

      return { success: true, data: result }
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : String(error) }
    }
  })

  // Write settings to file
  ipcMain.handle('fs:write-settings', async (_, filePath: string, content: string) => {
    try {
      await fs.writeFile(filePath, content, 'utf-8')
      return { success: true }
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : String(error) }
    }
  })

  // Read settings from file
  ipcMain.handle('fs:read-settings', async (_, filePath: string) => {
    try {
      const content = await fs.readFile(filePath, 'utf-8')
      return { success: true, data: content }
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : String(error) }
    }
  })
}

// Setup keychain handlers for secure credential storage
function setupKeychainHandlers(): void {
  const SERVICE_NAME = 'velocity-db'

  // Save password to keychain
  ipcMain.handle('keychain:set-password', async (_, account: string, password: string) => {
    try {
      await keytar.setPassword(SERVICE_NAME, account, password)
      return { success: true }
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : String(error) }
    }
  })

  // Get password from keychain
  ipcMain.handle('keychain:get-password', async (_, account: string) => {
    try {
      const password = await keytar.getPassword(SERVICE_NAME, account)
      return { success: true, data: password }
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : String(error) }
    }
  })

  // Delete password from keychain
  ipcMain.handle('keychain:delete-password', async (_, account: string) => {
    try {
      const deleted = await keytar.deletePassword(SERVICE_NAME, account)
      return { success: true, data: deleted }
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : String(error) }
    }
  })

  // Find all credentials (for listing saved connections)
  ipcMain.handle('keychain:find-credentials', async () => {
    try {
      const credentials = await keytar.findCredentials(SERVICE_NAME)
      return { success: true, data: credentials }
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : String(error) }
    }
  })
}

// Setup auto-updater (call once during app initialization)
function setupAutoUpdater(): void {
  // Configure auto-updater
  // In development, auto-updater is disabled to prevent errors
  if (is.dev) {
    autoUpdater.updateConfigPath = join(__dirname, '../../dev-app-update.yml')
  }

  // Disable auto-download - we'll let the user trigger it
  autoUpdater.autoDownload = false
  autoUpdater.autoInstallOnAppQuit = true

  // Update events - forward to ALL windows
  autoUpdater.on('checking-for-update', () => {
    windows.forEach((win) => {
      win.webContents.send('update:checking')
    })
  })

  autoUpdater.on('update-available', (info) => {
    windows.forEach((win) => {
      win.webContents.send('update:available', info)
    })
  })

  autoUpdater.on('update-not-available', (info) => {
    windows.forEach((win) => {
      win.webContents.send('update:not-available', info)
    })
  })

  autoUpdater.on('error', (error) => {
    windows.forEach((win) => {
      win.webContents.send('update:error', error.message)
    })
  })

  autoUpdater.on('download-progress', (progress) => {
    windows.forEach((win) => {
      win.webContents.send('update:download-progress', progress)
    })
  })

  autoUpdater.on('update-downloaded', (info) => {
    windows.forEach((win) => {
      win.webContents.send('update:downloaded', info)
    })
  })

  // IPC handlers for update actions (only register once!)
  ipcMain.handle('update:check', async () => {
    try {
      const result = await autoUpdater.checkForUpdates()
      return { success: true, data: result }
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : String(error) }
    }
  })

  ipcMain.handle('update:download', async () => {
    try {
      await autoUpdater.downloadUpdate()
      return { success: true }
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : String(error) }
    }
  })

  ipcMain.handle('update:install', () => {
    // This will quit the app and install the update
    autoUpdater.quitAndInstall(false, true)
    return { success: true }
  })

  ipcMain.handle('update:get-version', () => {
    return { success: true, data: app.getVersion() }
  })
}

// Set app name early (must be before app.whenReady() for development)
app.setName('Kestrel DB')

// Force userData to use consistent directory name (without spaces)
// This prevents data loss when app name changes
app.setPath('userData', join(app.getPath('appData'), 'kestrel-db'))

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  // Set app user model id for windows
  electronApp.setAppUserModelId('com.kestreldb.app')

  // Set dock icon for macOS
  if (process.platform === 'darwin' && app.dock) {
    app.dock.setIcon(icon)
  }

  // Create application menu (essential for Cmd+C/Cmd+V on macOS)
  createApplicationMenu()

  // Default open or close DevTools by F12 in development
  // and ignore CommandOrControl + R in production.
  // see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  // New window handler
  ipcMain.handle('window:create-new', () => {
    createWindow()
    return { success: true }
  })

  // Database IPC handlers
  setupDatabaseHandlers()

  // File dialog IPC handlers
  setupFileDialogHandlers()

  // Keychain IPC handlers
  setupKeychainHandlers()

  // Create initial window
  createWindow()

  // Setup auto-updater (call once for all windows)
  setupAutoUpdater()

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
