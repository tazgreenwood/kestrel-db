import { create } from 'zustand'
import type { QueryOptions, ColumnInfo, TableInfo } from '../../../preload/index'
import { useSettingsStore } from './useSettingsStore'
import type { ConnectionColor } from './useConnectionsStore'

interface SortState {
  column: string | null
  direction: 'ASC' | 'DESC'
}

/**
 * Calculate optimal chunk size based on total row count
 * Larger tables get bigger chunks to reduce query count
 */
function getChunkSize(totalRows: number): number {
  if (totalRows < 1000) return 500 // Small tables: load half
  if (totalRows < 10000) return 2000 // Medium tables: 5 chunks
  if (totalRows < 100000) return 5000 // Large tables: 20 chunks
  return 10000 // XLarge tables: 10+ chunks
}

interface AppState {
  // Connection Info
  serverName: string | null
  currentUser: string | null
  connectionName: string | null // Display name for connection (used in breadcrumb)
  connectionColor: ConnectionColor | null // Visual identifier for connection

  // Navigation State
  currentDb: string | null
  activeTable: string | null
  viewMode: 'data' | 'structure'

  // Data Cache
  availableDatabases: string[]
  tables: TableInfo[]
  tableData: Record<string, unknown>[]
  tableColumns: ColumnInfo[]

  // Query State
  totalRows: number
  currentOffset: number
  hasMore: boolean
  chunkSize: number // Dynamic chunk size based on table size
  sortState: SortState
  whereClause: string | null
  originalQuery: string | null // Original query syntax (e.g., "id>100&name=john")
  currentRequestId: number // Track active requests to prevent race conditions

  // Command Palette State
  commandPaletteOpen: boolean
  commandPaletteInitialSearch: string | null

  isLoading: boolean
  isLoadingMore: boolean

  // Query timing
  queryStartTime: number | null
  queryDuration: number | null // Final duration in ms

  // Toast callback for error notifications
  showToast: ((message: string, type?: 'success' | 'error') => void) | null

  // Actions
  setShowToast: (callback: (message: string, type?: 'success' | 'error') => void) => void
  setConnection: (
    server: string,
    user: string,
    dbs: string[],
    connectionName?: string,
    connectionColor?: ConnectionColor
  ) => void
  selectDatabase: (dbName: string) => void
  selectTable: (tableName: string) => void
  loadMoreRows: () => void
  setSort: (column: string, direction: 'ASC' | 'DESC') => void
  clearSort: () => void
  setFilter: (whereClause: string | null, originalQuery?: string | null) => void
  setViewMode: (mode: 'data' | 'structure') => void
  openCommandPalette: (initialSearch?: string) => void
  closeCommandPalette: () => void
  cancelQuery: () => void
  disconnect: () => void
}

export const useAppStore = create<AppState>((set, get) => ({
  // Initial state
  serverName: null,
  showToast: null,
  currentUser: null,
  connectionName: null,
  connectionColor: null,
  currentDb: null,
  activeTable: null,
  viewMode: 'data',
  availableDatabases: [],
  tables: [],
  tableData: [],
  tableColumns: [],
  totalRows: 0,
  currentOffset: 0,
  hasMore: false,
  chunkSize: 5000, // Start with larger default for better performance
  sortState: { column: null, direction: 'ASC' },
  whereClause: null,
  originalQuery: null,
  currentRequestId: 0,
  commandPaletteOpen: false,
  commandPaletteInitialSearch: null,
  isLoading: false,
  isLoadingMore: false,
  queryStartTime: null,
  queryDuration: null,

  // Actions
  setShowToast: (callback: (message: string, type?: 'success' | 'error') => void) =>
    set({ showToast: callback }),

  setConnection: (
    server: string,
    user: string,
    dbs: string[],
    connectionName?: string,
    connectionColor?: ConnectionColor
  ) =>
    set({
      serverName: server,
      currentUser: user,
      connectionName: connectionName || null,
      connectionColor: connectionColor || null,
      availableDatabases: dbs,
      currentDb: null,
      tables: [],
      tableData: [],
      tableColumns: [],
      totalRows: 0,
      currentOffset: 0,
      hasMore: false
    }),

  selectDatabase: async (dbName: string) => {
    try {
      set({
        isLoading: true,
        tables: [],
        // Clear filter when switching databases
        whereClause: null,
        originalQuery: null,
        sortState: { column: null, direction: 'ASC' }
      })

      // Call IPC to select database
      const selectResult = await window.api.db.selectDatabase(dbName)
      if (!selectResult.success) {
        console.error('Failed to select database:', selectResult.error)
        set({ isLoading: false })
        return
      }

      // Fetch tables from the selected database
      const tablesResult = await window.api.db.getTables()
      if (tablesResult.success && tablesResult.data) {
        set({
          currentDb: dbName,
          activeTable: null,
          tables: tablesResult.data,
          isLoading: false
        })
      } else {
        const errorMsg = tablesResult.error || 'Unknown error'
        console.error('Failed to fetch tables:', errorMsg)
        get().showToast?.(`Failed to load tables: ${errorMsg}`, 'error')
        set({ isLoading: false })
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error)
      console.error('Failed to switch database:', errorMsg)
      get().showToast?.(`Failed to switch database: ${errorMsg}`, 'error')
      set({ isLoading: false })
    }
  },

  selectTable: async (tableName: string) => {
    const state = get()
    const requestId = state.currentRequestId + 1
    const startTime = Date.now()

    try {
      set({
        activeTable: tableName,
        viewMode: 'data',
        tableData: [],
        tableColumns: [],
        totalRows: 0,
        currentOffset: 0,
        hasMore: false,
        isLoading: true,
        queryStartTime: startTime,
        queryDuration: null,
        currentRequestId: requestId,
        // Clear filter when switching tables
        whereClause: null,
        originalQuery: null,
        sortState: { column: null, direction: 'ASC' }
      })

      // Fetch column metadata first
      const columnsResult = await window.api.db.getTableColumns(tableName)

      // Check if this request is still active
      if (get().currentRequestId !== requestId) return

      if (!columnsResult.success || !columnsResult.data) {
        const errorMsg = columnsResult.error || 'Unknown error'
        console.error('Failed to fetch columns:', errorMsg)
        get().showToast?.(`Failed to load table columns: ${errorMsg}`, 'error')
        set({
          isLoading: false,
          queryStartTime: null,
          queryDuration: null
        })
        return
      }

      // Get settings for chunk size and timeout
      const { defaultChunkSize, queryTimeout } = useSettingsStore.getState()

      // Build query options using settings
      const options: QueryOptions = {
        limit: defaultChunkSize,
        offset: 0,
        timeout: queryTimeout
      }

      // Fetch initial chunk of table data
      const result = await window.api.db.queryTable(tableName, options)

      // Check if this request is still active (user might have cancelled or started a new one)
      if (get().currentRequestId !== requestId) return

      if (result.success && result.data) {
        // Get settings for dynamic sizing
        const { overrideDynamicSizing } = useSettingsStore.getState()

        // Calculate chunk size: use settings or calculate dynamically
        const finalChunkSize = overrideDynamicSizing
          ? defaultChunkSize
          : getChunkSize(result.data.totalCount)

        const duration = Date.now() - startTime

        set({
          tableData: result.data.data,
          tableColumns: columnsResult.data,
          totalRows: result.data.totalCount,
          currentOffset: result.data.data.length,
          hasMore: result.data.hasMore,
          chunkSize: finalChunkSize,
          isLoading: false,
          queryDuration: duration,
          queryStartTime: null
        })
      } else {
        const errorMsg = result.error || 'Unknown error'
        console.error('Failed to query table:', errorMsg)
        get().showToast?.(`Failed to load table data: ${errorMsg}`, 'error')
        set({
          isLoading: false,
          queryStartTime: null,
          queryDuration: null
        })
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error)
      console.error('Failed to query table:', errorMsg)
      get().showToast?.(`Failed to load table: ${errorMsg}`, 'error')
      if (get().currentRequestId === requestId) {
        set({
          isLoading: false,
          queryStartTime: null,
          queryDuration: null
        })
      }
    }
  },

  loadMoreRows: async () => {
    const state = get()
    if (!state.activeTable || !state.hasMore || state.isLoadingMore) {
      return
    }

    try {
      set({ isLoadingMore: true })

      // Get timeout from settings
      const { queryTimeout } = useSettingsStore.getState()

      // Build query options for next chunk - use calculated chunk size
      const options: QueryOptions = {
        limit: state.chunkSize,
        offset: state.currentOffset,
        timeout: queryTimeout
      }

      if (state.sortState.column) {
        options.orderBy = state.sortState.column
        options.orderDirection = state.sortState.direction
      }

      if (state.whereClause) {
        options.whereClause = state.whereClause
      }

      const result = await window.api.db.queryTable(state.activeTable, options)
      if (result.success && result.data) {
        set({
          tableData: [...state.tableData, ...result.data.data],
          currentOffset: state.currentOffset + result.data.data.length,
          hasMore: result.data.hasMore,
          isLoadingMore: false
        })
      } else {
        const errorMsg = result.error || 'Unknown error'
        console.error('Failed to load more rows:', errorMsg)
        get().showToast?.(`Failed to load more rows: ${errorMsg}`, 'error')
        set({ isLoadingMore: false })
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error)
      console.error('Failed to load more rows:', errorMsg)
      get().showToast?.(`Failed to load more rows: ${errorMsg}`, 'error')
      set({ isLoadingMore: false })
    }
  },

  setSort: async (column: string, direction: 'ASC' | 'DESC') => {
    const state = get()
    if (!state.activeTable) return

    try {
      set({
        sortState: { column, direction },
        tableData: [],
        currentOffset: 0,
        isLoading: true
      })

      // Get timeout from settings
      const { queryTimeout } = useSettingsStore.getState()

      const options: QueryOptions = {
        limit: state.chunkSize,
        offset: 0,
        orderBy: column,
        orderDirection: direction,
        timeout: queryTimeout
      }

      if (state.whereClause) {
        options.whereClause = state.whereClause
      }

      const result = await window.api.db.queryTable(state.activeTable, options)
      if (result.success && result.data) {
        set({
          tableData: result.data.data,
          totalRows: result.data.totalCount,
          currentOffset: result.data.data.length,
          hasMore: result.data.hasMore,
          isLoading: false
        })
      } else {
        console.error('Failed to sort table:', result.error)
        set({ isLoading: false })
      }
    } catch (error) {
      console.error('Failed to sort table:', error)
      set({ isLoading: false })
    }
  },

  clearSort: async () => {
    const state = get()
    if (!state.activeTable) return

    try {
      set({
        sortState: { column: null, direction: 'ASC' },
        tableData: [],
        currentOffset: 0,
        isLoading: true
      })

      // Get timeout from settings
      const { queryTimeout } = useSettingsStore.getState()

      const options: QueryOptions = {
        limit: state.chunkSize,
        offset: 0,
        timeout: queryTimeout
      }

      if (state.whereClause) {
        options.whereClause = state.whereClause
      }

      const result = await window.api.db.queryTable(state.activeTable, options)
      if (result.success && result.data) {
        set({
          tableData: result.data.data,
          totalRows: result.data.totalCount,
          currentOffset: result.data.data.length,
          hasMore: result.data.hasMore,
          isLoading: false
        })
      } else {
        console.error('Failed to clear sort:', result.error)
        set({ isLoading: false })
      }
    } catch (error) {
      console.error('Failed to clear sort:', error)
      set({ isLoading: false })
    }
  },

  setFilter: async (whereClause: string | null, originalQuery?: string | null) => {
    const state = get()
    if (!state.activeTable) return

    const requestId = state.currentRequestId + 1

    try {
      set({
        whereClause,
        originalQuery: originalQuery ?? null,
        tableData: [],
        currentOffset: 0,
        currentRequestId: requestId,
        isLoading: true
      })

      // Get timeout from settings
      const { queryTimeout } = useSettingsStore.getState()

      const options: QueryOptions = {
        limit: state.chunkSize,
        offset: 0,
        timeout: queryTimeout
      }

      if (state.sortState.column) {
        options.orderBy = state.sortState.column
        options.orderDirection = state.sortState.direction
      }

      if (whereClause) {
        options.whereClause = whereClause
      }

      const result = await window.api.db.queryTable(state.activeTable, options)

      // Check if this request is still active
      if (get().currentRequestId !== requestId) return

      if (result.success && result.data) {
        set({
          tableData: result.data.data,
          totalRows: result.data.totalCount,
          currentOffset: result.data.data.length,
          hasMore: result.data.hasMore,
          isLoading: false
        })
      } else {
        console.error('Failed to filter table:', result.error)
        set({ isLoading: false })
      }
    } catch (error) {
      console.error('Failed to filter table:', error)
      if (get().currentRequestId === requestId) {
        set({ isLoading: false })
      }
    }
  },

  setViewMode: (mode: 'data' | 'structure') => {
    set({ viewMode: mode })
  },

  openCommandPalette: (initialSearch?: string) => {
    set({
      commandPaletteOpen: true,
      commandPaletteInitialSearch: initialSearch || null
    })
  },

  closeCommandPalette: () => {
    set({
      commandPaletteOpen: false,
      commandPaletteInitialSearch: null
    })
  },

  cancelQuery: () => {
    const state = get()
    set({
      currentRequestId: state.currentRequestId + 1,
      isLoading: false,
      isLoadingMore: false,
      queryStartTime: null,
      queryDuration: null
    })
  },

  disconnect: async () => {
    try {
      await window.api.db.disconnect()
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error)
      console.error('Failed to disconnect:', errorMsg)
      get().showToast?.(`Warning: Disconnect error - ${errorMsg}`, 'error')
    }

    set({
      serverName: null,
      currentUser: null,
      connectionName: null,
      connectionColor: null,
      currentDb: null,
      activeTable: null,
      availableDatabases: [],
      tables: [],
      tableData: [],
      tableColumns: [],
      totalRows: 0,
      currentOffset: 0,
      hasMore: false,
      sortState: { column: null, direction: 'ASC' },
      whereClause: null,
      originalQuery: null
    })
  }
}))
