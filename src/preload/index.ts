import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

export interface DbCredentials {
  host: string
  user: string
  password: string
  port?: number
}

export interface TableInfo {
  name: string
  rows: number
  dataSize: number
  indexSize: number
}

export interface ColumnInfo {
  name: string
  type: string
  nullable: boolean
  key: string
  default: string | null
  extra: string
}

export interface IndexInfo {
  name: string
  columnName: string
  unique: boolean
  primary: boolean
  type: string
}

export interface TableStructure {
  columns: ColumnInfo[]
  indexes: IndexInfo[]
}

export interface QueryOptions {
  limit?: number
  offset?: number
  orderBy?: string
  orderDirection?: 'ASC' | 'DESC'
  whereClause?: string
  timeout?: number // Query timeout in seconds (0 = no timeout)
}

export interface QueryResult {
  data: Record<string, unknown>[]
  totalCount: number
  hasMore: boolean
}

export interface QueryExecutionResult {
  data: Record<string, unknown>[]
  fields: string[]
  rowCount: number
  executionTime: number
}

export interface UpdateInfo {
  version: string
  releaseDate?: string
  releaseNotes?: string
}

export interface UpdateProgress {
  percent?: number
  bytesPerSecond?: number
  transferred?: number
  total?: number
}

// Custom APIs for renderer
const api = {
  // System information
  platform: process.platform as 'darwin' | 'win32' | 'linux',

  // Database operations
  db: {
    testConnection: (creds: DbCredentials) => ipcRenderer.invoke('db:test-connection', creds),
    selectDatabase: (dbName: string) => ipcRenderer.invoke('db:select-database', dbName),
    getTables: () => ipcRenderer.invoke('db:get-tables'),
    getTableColumns: (tableName: string) => ipcRenderer.invoke('db:get-table-columns', tableName),
    getTableStructure: (tableName: string) =>
      ipcRenderer.invoke('db:get-table-structure', tableName),
    queryTable: (tableName: string, options?: QueryOptions) =>
      ipcRenderer.invoke('db:query-table', tableName, options),
    executeQuery: (query: string, timeout?: number) =>
      ipcRenderer.invoke('db:execute-query', query, timeout),
    disconnect: () => ipcRenderer.invoke('db:disconnect')
  },

  // File dialog operations
  dialog: {
    saveSettings: (defaultPath?: string) => ipcRenderer.invoke('dialog:save-settings', defaultPath),
    openSettings: () => ipcRenderer.invoke('dialog:open-settings')
  },

  // File system operations
  fs: {
    writeSettings: (filePath: string, content: string) =>
      ipcRenderer.invoke('fs:write-settings', filePath, content),
    readSettings: (filePath: string) => ipcRenderer.invoke('fs:read-settings', filePath)
  },

  // Keychain operations (secure credential storage)
  keychain: {
    setPassword: (account: string, password: string) =>
      ipcRenderer.invoke('keychain:set-password', account, password),
    getPassword: (account: string) => ipcRenderer.invoke('keychain:get-password', account),
    deletePassword: (account: string) => ipcRenderer.invoke('keychain:delete-password', account),
    findCredentials: () => ipcRenderer.invoke('keychain:find-credentials')
  },

  // Auto-update operations
  update: {
    checkForUpdates: () => ipcRenderer.invoke('update:check'),
    downloadUpdate: () => ipcRenderer.invoke('update:download'),
    installUpdate: () => ipcRenderer.invoke('update:install'),
    getVersion: () => ipcRenderer.invoke('update:get-version'),

    // Event listeners for update status
    onChecking: (callback: () => void): (() => void) => {
      const handler = (): void => callback()
      ipcRenderer.on('update:checking', handler)
      return (): void => {
        ipcRenderer.removeListener('update:checking', handler)
      }
    },
    onAvailable: (callback: (info: UpdateInfo) => void): (() => void) => {
      const handler = (_event: Electron.IpcRendererEvent, info: UpdateInfo): void => callback(info)
      ipcRenderer.on('update:available', handler)
      return (): void => {
        ipcRenderer.removeListener('update:available', handler)
      }
    },
    onNotAvailable: (callback: (info: UpdateInfo) => void): (() => void) => {
      const handler = (_event: Electron.IpcRendererEvent, info: UpdateInfo): void => callback(info)
      ipcRenderer.on('update:not-available', handler)
      return (): void => {
        ipcRenderer.removeListener('update:not-available', handler)
      }
    },
    onError: (callback: (error: string) => void): (() => void) => {
      const handler = (_event: Electron.IpcRendererEvent, error: string): void => callback(error)
      ipcRenderer.on('update:error', handler)
      return (): void => {
        ipcRenderer.removeListener('update:error', handler)
      }
    },
    onDownloadProgress: (callback: (progress: UpdateProgress) => void): (() => void) => {
      const handler = (_event: Electron.IpcRendererEvent, progress: UpdateProgress): void =>
        callback(progress)
      ipcRenderer.on('update:download-progress', handler)
      return (): void => {
        ipcRenderer.removeListener('update:download-progress', handler)
      }
    },
    onDownloaded: (callback: (info: UpdateInfo) => void): (() => void) => {
      const handler = (_event: Electron.IpcRendererEvent, info: UpdateInfo): void => callback(info)
      ipcRenderer.on('update:downloaded', handler)
      return (): void => {
        ipcRenderer.removeListener('update:downloaded', handler)
      }
    }
  }
}

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore (define in dts)
  window.electron = electronAPI
  // @ts-ignore (define in dts)
  window.api = api
}
