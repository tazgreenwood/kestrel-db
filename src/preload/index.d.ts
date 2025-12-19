import { ElectronAPI } from '@electron-toolkit/preload'

export interface DbCredentials {
  host: string
  user: string
  password?: string
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

interface DatabaseAPI {
  testConnection: (
    creds: DbCredentials
  ) => Promise<{ success: boolean; data?: string[]; error?: string }>
  selectDatabase: (dbName: string) => Promise<{ success: boolean; error?: string }>
  getTables: () => Promise<{ success: boolean; data?: TableInfo[]; error?: string }>
  getTableColumns: (
    tableName: string
  ) => Promise<{ success: boolean; data?: ColumnInfo[]; error?: string }>
  getTableStructure: (
    tableName: string
  ) => Promise<{ success: boolean; data?: TableStructure; error?: string }>
  queryTable: (
    tableName: string,
    options?: QueryOptions
  ) => Promise<{ success: boolean; data?: QueryResult; error?: string }>
  executeQuery: (
    query: string,
    timeout?: number
  ) => Promise<{ success: boolean; data?: QueryExecutionResult; error?: string }>
  disconnect: () => Promise<{ success: boolean; error?: string }>
}

declare global {
  interface Window {
    electron: ElectronAPI
    api: {
      platform: 'darwin' | 'win32' | 'linux'
      db: DatabaseAPI
      dialog: {
        saveSettings: (defaultPath?: string) => Promise<string | null>
        openSettings: () => Promise<string | null>
      }
      fs: {
        writeSettings: (filePath: string, content: string) => Promise<void>
        readSettings: (filePath: string) => Promise<string>
      }
      keychain: {
        setPassword: (
          account: string,
          password: string
        ) => Promise<{ success: boolean; error?: string }>
        getPassword: (
          account: string
        ) => Promise<{ success: boolean; data?: string | null; error?: string }>
        deletePassword: (
          account: string
        ) => Promise<{ success: boolean; data?: boolean; error?: string }>
        findCredentials: () => Promise<{
          success: boolean
          data?: Array<{ account: string; password: string }>
          error?: string
        }>
      }
      update: {
        checkForUpdates: () => Promise<{ success: boolean; data?: UpdateInfo; error?: string }>
        downloadUpdate: () => Promise<{ success: boolean; error?: string }>
        installUpdate: () => Promise<{ success: boolean; error?: string }>
        getVersion: () => Promise<{ success: boolean; data?: string; error?: string }>
        onChecking: (callback: () => void) => () => void
        onAvailable: (callback: (info: UpdateInfo) => void) => () => void
        onNotAvailable: (callback: (info: UpdateInfo) => void) => () => void
        onError: (callback: (error: string) => void) => () => void
        onDownloadProgress: (callback: (progress: UpdateProgress) => void) => () => void
        onDownloaded: (callback: (info: UpdateInfo) => void) => () => void
      }
    }
  }
}
