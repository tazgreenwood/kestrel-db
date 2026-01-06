import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { useAppStore } from '../../../../src/renderer/src/store/useAppStore'
import { useSettingsStore } from '../../../../src/renderer/src/store/useSettingsStore'
import { mockWindowApi, mockIpcSuccess, mockIpcError } from '../../../mocks/ipc.mock'

// Helper to wait for async state updates
const waitForState = async (checkFn: () => boolean, timeout = 2000): Promise<void> => {
  const startTime = Date.now()
  while (!checkFn()) {
    if (Date.now() - startTime > timeout) {
      throw new Error('Timeout waiting for state update')
    }
    await new Promise((resolve) => setTimeout(resolve, 10))
  }
}

// TODO: Fix window.api availability in test environment
// These tests are skipped until we resolve the test environment setup
describe.skip('useAppStore', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    // Reset stores to initial state
    useAppStore.setState({
      serverName: null,
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
      chunkSize: 5000,
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
      showToast: null
    })

    // Reset settings store
    useSettingsStore.setState({
      defaultChunkSize: 5000,
      queryTimeout: 0,
      overrideDynamicSizing: false
    })
  })

  afterEach(() => {
    vi.clearAllTimers()
  })

  describe('setConnection', () => {
    it('should set connection info and reset state', () => {
      useAppStore
        .getState()
        .setConnection('localhost', 'root', ['db1', 'db2', 'db3'], 'Local MySQL', 'blue')

      const state = useAppStore.getState()
      expect(state.serverName).toBe('localhost')
      expect(state.currentUser).toBe('root')
      expect(state.availableDatabases).toEqual(['db1', 'db2', 'db3'])
      expect(state.connectionName).toBe('Local MySQL')
      expect(state.connectionColor).toBe('blue')
      expect(state.currentDb).toBeNull()
      expect(state.tables).toEqual([])
    })

    it('should handle optional connectionName and color', () => {
      useAppStore.getState().setConnection('localhost', 'root', ['db1'])

      const state = useAppStore.getState()
      expect(state.connectionName).toBeNull()
      expect(state.connectionColor).toBeNull()
    })
  })

  describe('selectDatabase', () => {
    beforeEach(() => {
      useAppStore.getState().setConnection('localhost', 'root', ['testdb'])
    })

    it('should successfully select database and load tables', async () => {
      mockWindowApi.db.selectDatabase.mockResolvedValueOnce(mockIpcSuccess(true))
      mockWindowApi.db.getTables.mockResolvedValueOnce(
        mockIpcSuccess([
          { name: 'users', rows: 100, dataSize: 1024, indexSize: 512 },
          { name: 'orders', rows: 200, dataSize: 2048, indexSize: 1024 }
        ])
      )

      await useAppStore.getState().selectDatabase('testdb')

      await waitForState(() => !useAppStore.getState().isLoading, 5000)

      const state = useAppStore.getState()
      expect(state.currentDb).toBe('testdb')
      expect(state.tables).toHaveLength(2)
      expect(state.isLoading).toBe(false)
    })

    it('should handle database selection failure', async () => {
      const mockToast = vi.fn()
      useAppStore.getState().setShowToast(mockToast)

      mockWindowApi.db.selectDatabase.mockResolvedValueOnce(mockIpcError('Database not found'))

      await useAppStore.getState().selectDatabase('nonexistent')

      await waitForState(() => !useAppStore.getState().isLoading)

      const state = useAppStore.getState()
      expect(state.currentDb).toBeNull()
      expect(state.isLoading).toBe(false)
    })

    it('should clear filters when switching databases', async () => {
      // Set some filters
      useAppStore.setState({
        whereClause: 'id > 100',
        originalQuery: 'id>100',
        sortState: { column: 'id', direction: 'DESC' }
      })

      mockWindowApi.db.selectDatabase.mockResolvedValueOnce(mockIpcSuccess(true))
      mockWindowApi.db.getTables.mockResolvedValueOnce(mockIpcSuccess([]))

      await useAppStore.getState().selectDatabase('testdb')

      await waitForState(() => !useAppStore.getState().isLoading)

      const state = useAppStore.getState()
      expect(state.whereClause).toBeNull()
      expect(state.originalQuery).toBeNull()
      expect(state.sortState).toEqual({ column: null, direction: 'ASC' })
    })
  })

  describe('selectTable - Race Condition Prevention', () => {
    beforeEach(() => {
      useAppStore.setState({
        serverName: 'localhost',
        currentDb: 'testdb',
        activeTable: null
      })
    })

    it('should increment requestId on each call', async () => {
      mockWindowApi.db.getTableColumns.mockResolvedValue(
        mockIpcSuccess([
          { name: 'id', type: 'int', nullable: false, key: 'PRI', default: null, extra: '' }
        ])
      )
      mockWindowApi.db.queryTable.mockResolvedValue(
        mockIpcSuccess({ data: [], totalCount: 0, hasMore: false })
      )

      const initialRequestId = useAppStore.getState().currentRequestId

      await useAppStore.getState().selectTable('users')

      await waitForState(() => !useAppStore.getState().isLoading)

      expect(useAppStore.getState().currentRequestId).toBe(initialRequestId + 1)
    })

    it('should ignore results from stale requests', async () => {
      mockWindowApi.db.getTableColumns.mockResolvedValue(
        mockIpcSuccess([
          { name: 'id', type: 'int', nullable: false, key: 'PRI', default: null, extra: '' }
        ])
      )

      // First request (slow)
      let resolveFirst: ((value: unknown) => void) | undefined
      const firstQuery = new Promise((resolve) => {
        resolveFirst = resolve
      })
      mockWindowApi.db.queryTable.mockReturnValueOnce(firstQuery as never)

      // Start first request (don't await)
      void useAppStore.getState().selectTable('users')

      // Wait a bit for first request to start
      await new Promise((resolve) => setTimeout(resolve, 50))

      const firstRequestId = useAppStore.getState().currentRequestId

      // Start second request (fast) - should supersede first
      mockWindowApi.db.queryTable.mockResolvedValueOnce(
        mockIpcSuccess({
          data: [{ id: 2, name: 'second' }],
          totalCount: 1,
          hasMore: false
        })
      )

      await useAppStore.getState().selectTable('orders')

      // Wait for second request to complete
      await waitForState(() => !useAppStore.getState().isLoading, 5000)

      // Verify second request completed
      let state = useAppStore.getState()
      expect(state.activeTable).toBe('orders')
      expect(state.currentRequestId).toBe(firstRequestId + 1)

      // Now resolve first request (stale)
      resolveFirst?.(
        mockIpcSuccess({
          data: [{ id: 1, name: 'first' }],
          totalCount: 1,
          hasMore: false
        })
      )

      // Wait a bit for any potential updates
      await new Promise((resolve) => setTimeout(resolve, 100))

      // First request data should be ignored
      state = useAppStore.getState()
      expect(state.tableData).toEqual([{ id: 2, name: 'second' }])
      expect(state.activeTable).toBe('orders')
    })

    it('should use dynamic chunk sizing by default', async () => {
      mockWindowApi.db.getTableColumns.mockResolvedValueOnce(
        mockIpcSuccess([
          { name: 'id', type: 'int', nullable: false, key: 'PRI', default: null, extra: '' }
        ])
      )
      mockWindowApi.db.queryTable.mockResolvedValueOnce(
        mockIpcSuccess({
          data: [],
          totalCount: 50000, // Large table
          hasMore: true
        })
      )

      await useAppStore.getState().selectTable('large_table')

      await waitForState(() => !useAppStore.getState().isLoading)

      // For 50000 rows, chunk size should be 5000
      expect(useAppStore.getState().chunkSize).toBe(5000)
    })

    it('should respect overrideDynamicSizing setting', async () => {
      // Enable override
      useSettingsStore.setState({
        overrideDynamicSizing: true,
        defaultChunkSize: 1000
      })

      mockWindowApi.db.getTableColumns.mockResolvedValueOnce(
        mockIpcSuccess([
          { name: 'id', type: 'int', nullable: false, key: 'PRI', default: null, extra: '' }
        ])
      )
      mockWindowApi.db.queryTable.mockResolvedValueOnce(
        mockIpcSuccess({
          data: [],
          totalCount: 50000,
          hasMore: true
        })
      )

      await useAppStore.getState().selectTable('large_table')

      await waitForState(() => !useAppStore.getState().isLoading)

      // Should use settings value, not dynamic
      expect(useAppStore.getState().chunkSize).toBe(1000)
    })
  })

  describe('getChunkSize - Dynamic Sizing', () => {
    // Testing the internal getChunkSize function behavior through selectTable

    beforeEach(() => {
      // Ensure dynamic sizing is enabled
      useSettingsStore.setState({
        overrideDynamicSizing: false,
        defaultChunkSize: 5000
      })
    })

    const testChunkSizeForRows = async (
      totalRows: number,
      expectedChunkSize: number
    ): Promise<void> => {
      useAppStore.setState({
        serverName: 'localhost',
        currentDb: 'testdb'
      })

      mockWindowApi.db.getTableColumns.mockResolvedValueOnce(
        mockIpcSuccess([
          { name: 'id', type: 'int', nullable: false, key: 'PRI', default: null, extra: '' }
        ])
      )
      mockWindowApi.db.queryTable.mockResolvedValueOnce(
        mockIpcSuccess({
          data: [],
          totalCount: totalRows,
          hasMore: false
        })
      )

      useAppStore.getState().selectTable('test_table')

      // Wait for chunkSize to be updated
      await waitForState(() => useAppStore.getState().chunkSize === expectedChunkSize, 2000)

      expect(useAppStore.getState().chunkSize).toBe(expectedChunkSize)
    }

    it('should return 500 for small tables (<1000 rows)', async () => {
      await testChunkSizeForRows(500, 500)
    })

    it('should return 2000 for medium tables (1000-10000 rows)', async () => {
      await testChunkSizeForRows(5000, 2000)
    })

    it('should return 5000 for large tables (10000-100000 rows)', async () => {
      await testChunkSizeForRows(50000, 5000)
    })

    it('should return 10000 for XL tables (>100000 rows)', async () => {
      await testChunkSizeForRows(500000, 10000)
    })

    it('should handle boundary at 1000 rows', async () => {
      await testChunkSizeForRows(999, 500)
      await testChunkSizeForRows(1000, 2000)
    })

    it('should handle boundary at 10000 rows', async () => {
      await testChunkSizeForRows(9999, 2000)
      await testChunkSizeForRows(10000, 5000)
    })

    it('should handle boundary at 100000 rows', async () => {
      await testChunkSizeForRows(99999, 5000)
      await testChunkSizeForRows(100000, 10000)
    })
  })

  describe('loadMoreRows - Pagination', () => {
    beforeEach(() => {
      useAppStore.setState({
        serverName: 'localhost',
        currentDb: 'testdb',
        activeTable: 'users',
        tableData: [{ id: 1, name: 'first' }],
        currentOffset: 1,
        hasMore: true,
        chunkSize: 100,
        isLoadingMore: false
      })
    })

    it('should append data to existing tableData', async () => {
      mockWindowApi.db.queryTable.mockResolvedValueOnce(
        mockIpcSuccess({
          data: [{ id: 2, name: 'second' }],
          totalCount: 2,
          hasMore: false
        })
      )

      // Call loadMoreRows (don't await - it returns void)
      useAppStore.getState().loadMoreRows()

      // Wait for data to be appended
      await waitForState(() => useAppStore.getState().tableData.length === 2, 2000)

      const state = useAppStore.getState()
      expect(state.tableData).toEqual([
        { id: 1, name: 'first' },
        { id: 2, name: 'second' }
      ])
      expect(state.currentOffset).toBe(2)
      expect(state.hasMore).toBe(false)
    })

    it('should not load if hasMore is false', async () => {
      useAppStore.setState({ hasMore: false })

      await useAppStore.getState().loadMoreRows()

      expect(mockWindowApi.db.queryTable).not.toHaveBeenCalled()
    })

    it('should not load if already loading', async () => {
      useAppStore.setState({ isLoadingMore: true })

      await useAppStore.getState().loadMoreRows()

      expect(mockWindowApi.db.queryTable).not.toHaveBeenCalled()
    })

    it('should include sort state in query options', async () => {
      useAppStore.setState({
        sortState: { column: 'id', direction: 'DESC' }
      })

      mockWindowApi.db.queryTable.mockResolvedValueOnce(
        mockIpcSuccess({ data: [], totalCount: 1, hasMore: false })
      )

      useAppStore.getState().loadMoreRows()

      // Wait for hasMore to become false (indicating operation completed)
      await waitForState(() => !useAppStore.getState().hasMore, 2000)

      expect(mockWindowApi.db.queryTable).toHaveBeenCalledWith(
        'users',
        expect.objectContaining({
          orderBy: 'id',
          orderDirection: 'DESC'
        })
      )
    })

    it('should include whereClause in query options', async () => {
      useAppStore.setState({
        whereClause: 'id > 100'
      })

      mockWindowApi.db.queryTable.mockResolvedValueOnce(
        mockIpcSuccess({ data: [], totalCount: 0, hasMore: false })
      )

      useAppStore.getState().loadMoreRows()

      // Wait for hasMore to become false (indicating operation completed)
      await waitForState(() => !useAppStore.getState().hasMore, 2000)

      expect(mockWindowApi.db.queryTable).toHaveBeenCalledWith(
        'users',
        expect.objectContaining({
          whereClause: 'id > 100'
        })
      )
    })
  })

  describe('setSort', () => {
    beforeEach(() => {
      useAppStore.setState({
        serverName: 'localhost',
        currentDb: 'testdb',
        activeTable: 'users',
        tableData: [{ id: 1 }, { id: 2 }],
        currentOffset: 2,
        chunkSize: 100,
        isLoading: false
      })
    })

    it('should reset offset to 0 and clear existing data', async () => {
      mockWindowApi.db.queryTable.mockResolvedValueOnce(
        mockIpcSuccess({
          data: [{ id: 3 }, { id: 2 }, { id: 1 }],
          totalCount: 3,
          hasMore: false
        })
      )

      useAppStore.getState().setSort('id', 'DESC')

      // Wait for tableData to be updated with sorted data
      await waitForState(() => useAppStore.getState().tableData.length === 3, 2000)

      const state = useAppStore.getState()
      expect(state.sortState).toEqual({ column: 'id', direction: 'DESC' })
      expect(state.currentOffset).toBe(3)
      expect(state.tableData).toEqual([{ id: 3 }, { id: 2 }, { id: 1 }])
    })

    it('should not execute if no active table', async () => {
      useAppStore.setState({ activeTable: null })

      await useAppStore.getState().setSort('id', 'ASC')

      expect(mockWindowApi.db.queryTable).not.toHaveBeenCalled()
    })
  })

  describe('setFilter', () => {
    beforeEach(() => {
      useAppStore.setState({
        currentDb: 'testdb',
        activeTable: 'users',
        chunkSize: 100
      })
    })

    it('should update whereClause and originalQuery', async () => {
      mockWindowApi.db.queryTable.mockResolvedValueOnce(
        mockIpcSuccess({ data: [], totalCount: 0, hasMore: false })
      )

      await useAppStore.getState().setFilter('id > 100', 'id>100')

      await waitForState(() => !useAppStore.getState().isLoading)

      const state = useAppStore.getState()
      expect(state.whereClause).toBe('id > 100')
      expect(state.originalQuery).toBe('id>100')
    })

    it('should clear filter when passed null', async () => {
      // Set filter first
      mockWindowApi.db.queryTable.mockResolvedValueOnce(
        mockIpcSuccess({ data: [], totalCount: 0, hasMore: false })
      )
      await useAppStore.getState().setFilter('id > 100', 'id>100')

      await waitForState(() => !useAppStore.getState().isLoading)

      // Clear filter
      mockWindowApi.db.queryTable.mockResolvedValueOnce(
        mockIpcSuccess({ data: [], totalCount: 0, hasMore: false })
      )
      await useAppStore.getState().setFilter(null)

      await waitForState(() => !useAppStore.getState().isLoading)

      const state = useAppStore.getState()
      expect(state.whereClause).toBeNull()
      expect(state.originalQuery).toBeNull()
    })
  })

  describe('cancelQuery', () => {
    it('should increment requestId to cancel in-flight requests', () => {
      const initialRequestId = useAppStore.getState().currentRequestId

      useAppStore.getState().cancelQuery()

      expect(useAppStore.getState().currentRequestId).toBe(initialRequestId + 1)
    })
  })

  describe('disconnect', () => {
    it('should reset all state to initial values', async () => {
      // Set up some state first
      useAppStore.setState({
        serverName: 'localhost',
        currentUser: 'root',
        currentDb: 'testdb',
        activeTable: 'users',
        tables: [{ name: 'users', rows: 100, dataSize: 1024, indexSize: 512 }],
        tableData: [{ id: 1 }],
        availableDatabases: ['db1', 'db2']
      })

      mockWindowApi.db.disconnect.mockResolvedValueOnce(mockIpcSuccess(true))

      useAppStore.getState().disconnect()

      // Wait for state to reset
      await waitForState(() => useAppStore.getState().serverName === null, 2000)

      const state = useAppStore.getState()
      expect(state.serverName).toBeNull()
      expect(state.currentDb).toBeNull()
      expect(state.activeTable).toBeNull()
      expect(state.tables).toEqual([])
      expect(state.tableData).toEqual([])
      expect(state.availableDatabases).toEqual([])
      expect(mockWindowApi.db.disconnect).toHaveBeenCalled()
    })
  })

  describe('Command Palette', () => {
    it('should open command palette', () => {
      useAppStore.getState().openCommandPalette()

      expect(useAppStore.getState().commandPaletteOpen).toBe(true)
    })

    it('should open with initial search', () => {
      useAppStore.getState().openCommandPalette('test search')

      const state = useAppStore.getState()
      expect(state.commandPaletteOpen).toBe(true)
      expect(state.commandPaletteInitialSearch).toBe('test search')
    })

    it('should close command palette', () => {
      // Open first
      useAppStore.getState().openCommandPalette('test')

      // Close
      useAppStore.getState().closeCommandPalette()

      const state = useAppStore.getState()
      expect(state.commandPaletteOpen).toBe(false)
      expect(state.commandPaletteInitialSearch).toBeNull()
    })
  })

  describe('View Mode', () => {
    it('should switch to data view', () => {
      useAppStore.getState().setViewMode('data')

      expect(useAppStore.getState().viewMode).toBe('data')
    })

    it('should switch to structure view', () => {
      useAppStore.getState().setViewMode('structure')

      expect(useAppStore.getState().viewMode).toBe('structure')
    })
  })
})
