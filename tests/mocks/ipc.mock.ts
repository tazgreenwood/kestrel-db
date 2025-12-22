import { vi } from 'vitest'

/**
 * Mock window.api for renderer process tests
 * This mirrors the API exposed in src/preload/index.ts
 */
export const mockWindowApi = {
  db: {
    testConnection: vi.fn(),
    selectDatabase: vi.fn(),
    getTables: vi.fn(),
    getTableColumns: vi.fn(),
    getTableStructure: vi.fn(),
    queryTable: vi.fn(),
    executeQuery: vi.fn(),
    getTableRowCount: vi.fn(),
    getAllTableSchemas: vi.fn(),
    disconnect: vi.fn()
  },
  keychain: {
    setPassword: vi.fn(),
    getPassword: vi.fn(),
    deletePassword: vi.fn(),
    findCredentials: vi.fn()
  },
  dialog: {
    showSaveDialog: vi.fn(),
    showOpenDialog: vi.fn()
  },
  fs: {
    writeSettings: vi.fn(),
    readSettings: vi.fn()
  },
  update: {
    check: vi.fn(),
    download: vi.fn(),
    install: vi.fn(),
    getVersion: vi.fn(() => '1.0.0'),
    onChecking: vi.fn(),
    onAvailable: vi.fn(),
    onNotAvailable: vi.fn(),
    onError: vi.fn(),
    onDownloadProgress: vi.fn(),
    onDownloaded: vi.fn()
  },
  window: {
    createNew: vi.fn()
  }
}

/**
 * Helper to mock successful IPC response
 */
export function mockIpcSuccess<T>(data: T): { success: true; data: T } {
  return { success: true, data }
}

/**
 * Helper to mock failed IPC response
 */
export function mockIpcError(error: string): { success: false; error: string } {
  return { success: false, error }
}

/**
 * Reset all IPC mocks
 */
export function resetIpcMocks(): void {
  Object.values(mockWindowApi).forEach((namespace) => {
    Object.values(namespace).forEach((fn) => {
      if (typeof fn === 'function' && 'mockClear' in fn) {
        fn.mockClear()
      }
    })
  })
}
