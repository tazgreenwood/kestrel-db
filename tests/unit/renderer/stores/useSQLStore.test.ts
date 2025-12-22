import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useSQLStore, type QueryHistoryItem, type SavedQuery } from '../../../../src/renderer/src/store/useSQLStore'
import type { QueryExecutionResult } from '../../../../src/preload/index'

describe('useSQLStore', () => {
  beforeEach(() => {
    // Reset store to initial state
    useSQLStore.setState({
      drawerOpen: false,
      drawerWidth: 400,
      currentQuery: '',
      lastResult: null,
      lastError: null,
      isExecuting: false,
      queryHistory: [],
      savedQueries: []
    })
    vi.clearAllMocks()
  })

  describe('Drawer State Management', () => {
    describe('toggleDrawer', () => {
      it('should toggle drawer from closed to open', () => {
        expect(useSQLStore.getState().drawerOpen).toBe(false)

        useSQLStore.getState().toggleDrawer()

        expect(useSQLStore.getState().drawerOpen).toBe(true)
      })

      it('should toggle drawer from open to closed', () => {
        useSQLStore.setState({ drawerOpen: true })

        useSQLStore.getState().toggleDrawer()

        expect(useSQLStore.getState().drawerOpen).toBe(false)
      })

      it('should toggle multiple times correctly', () => {
        useSQLStore.getState().toggleDrawer()
        expect(useSQLStore.getState().drawerOpen).toBe(true)

        useSQLStore.getState().toggleDrawer()
        expect(useSQLStore.getState().drawerOpen).toBe(false)

        useSQLStore.getState().toggleDrawer()
        expect(useSQLStore.getState().drawerOpen).toBe(true)
      })
    })

    describe('openDrawer', () => {
      it('should open drawer when closed', () => {
        useSQLStore.getState().openDrawer()

        expect(useSQLStore.getState().drawerOpen).toBe(true)
      })

      it('should keep drawer open when already open', () => {
        useSQLStore.setState({ drawerOpen: true })

        useSQLStore.getState().openDrawer()

        expect(useSQLStore.getState().drawerOpen).toBe(true)
      })
    })

    describe('closeDrawer', () => {
      it('should close drawer when open', () => {
        useSQLStore.setState({ drawerOpen: true })

        useSQLStore.getState().closeDrawer()

        expect(useSQLStore.getState().drawerOpen).toBe(false)
      })

      it('should keep drawer closed when already closed', () => {
        useSQLStore.getState().closeDrawer()

        expect(useSQLStore.getState().drawerOpen).toBe(false)
      })
    })

    describe('setDrawerWidth', () => {
      it('should set drawer width within valid range', () => {
        useSQLStore.getState().setDrawerWidth(450)

        expect(useSQLStore.getState().drawerWidth).toBe(450)
      })

      it('should clamp to minimum 300', () => {
        useSQLStore.getState().setDrawerWidth(200)

        expect(useSQLStore.getState().drawerWidth).toBe(300)
      })

      it('should clamp to maximum 600', () => {
        useSQLStore.getState().setDrawerWidth(800)

        expect(useSQLStore.getState().drawerWidth).toBe(600)
      })

      it('should handle boundary values', () => {
        useSQLStore.getState().setDrawerWidth(300)
        expect(useSQLStore.getState().drawerWidth).toBe(300)

        useSQLStore.getState().setDrawerWidth(600)
        expect(useSQLStore.getState().drawerWidth).toBe(600)
      })
    })
  })

  describe('Query State', () => {
    describe('setCurrentQuery', () => {
      it('should set current query', () => {
        useSQLStore.getState().setCurrentQuery('SELECT * FROM users')

        expect(useSQLStore.getState().currentQuery).toBe('SELECT * FROM users')
      })

      it('should update existing query', () => {
        useSQLStore.setState({ currentQuery: 'SELECT * FROM users' })

        useSQLStore.getState().setCurrentQuery('SELECT * FROM orders')

        expect(useSQLStore.getState().currentQuery).toBe('SELECT * FROM orders')
      })

      it('should handle empty string', () => {
        useSQLStore.setState({ currentQuery: 'SELECT * FROM users' })

        useSQLStore.getState().setCurrentQuery('')

        expect(useSQLStore.getState().currentQuery).toBe('')
      })
    })
  })

  describe('Execution State', () => {
    describe('setExecuting', () => {
      it('should set executing to true', () => {
        useSQLStore.getState().setExecuting(true)

        expect(useSQLStore.getState().isExecuting).toBe(true)
      })

      it('should set executing to false', () => {
        useSQLStore.setState({ isExecuting: true })

        useSQLStore.getState().setExecuting(false)

        expect(useSQLStore.getState().isExecuting).toBe(false)
      })
    })

    describe('setLastResult', () => {
      it('should set result and clear error', () => {
        const result: QueryExecutionResult = {
          rows: [{ id: 1, name: 'Test' }],
          fields: [{ name: 'id' }, { name: 'name' }],
          executionTime: 50,
          rowCount: 1
        }

        useSQLStore.setState({ lastError: 'Previous error' })

        useSQLStore.getState().setLastResult(result)

        expect(useSQLStore.getState().lastResult).toEqual(result)
        expect(useSQLStore.getState().lastError).toBeNull()
      })

      it('should set result to null', () => {
        const result: QueryExecutionResult = {
          rows: [{ id: 1 }],
          fields: [{ name: 'id' }],
          executionTime: 50,
          rowCount: 1
        }

        useSQLStore.setState({ lastResult: result })

        useSQLStore.getState().setLastResult(null)

        expect(useSQLStore.getState().lastResult).toBeNull()
      })
    })

    describe('setLastError', () => {
      it('should set error and clear result', () => {
        const result: QueryExecutionResult = {
          rows: [{ id: 1 }],
          fields: [{ name: 'id' }],
          executionTime: 50,
          rowCount: 1
        }

        useSQLStore.setState({ lastResult: result })

        useSQLStore.getState().setLastError('Query failed')

        expect(useSQLStore.getState().lastError).toBe('Query failed')
        expect(useSQLStore.getState().lastResult).toBeNull()
      })

      it('should set error to null', () => {
        useSQLStore.setState({ lastError: 'Previous error' })

        useSQLStore.getState().setLastError(null)

        expect(useSQLStore.getState().lastError).toBeNull()
      })
    })
  })

  describe('Query History', () => {
    describe('addToHistory', () => {
      it('should add item to history with generated ID', () => {
        const historyItem: Omit<QueryHistoryItem, 'id'> = {
          query: 'SELECT * FROM users',
          executedAt: Date.now(),
          executionTime: 50,
          rowCount: 10
        }

        useSQLStore.getState().addToHistory(historyItem)

        const history = useSQLStore.getState().queryHistory
        expect(history).toHaveLength(1)
        expect(history[0]).toMatchObject(historyItem)
        expect(history[0].id).toBeDefined()
      })

      it('should add new items at the beginning', () => {
        const item1: Omit<QueryHistoryItem, 'id'> = {
          query: 'SELECT 1',
          executedAt: Date.now() - 1000,
          executionTime: 10,
          rowCount: 1
        }

        const item2: Omit<QueryHistoryItem, 'id'> = {
          query: 'SELECT 2',
          executedAt: Date.now(),
          executionTime: 20,
          rowCount: 1
        }

        useSQLStore.getState().addToHistory(item1)
        useSQLStore.getState().addToHistory(item2)

        const history = useSQLStore.getState().queryHistory
        expect(history).toHaveLength(2)
        expect(history[0].query).toBe('SELECT 2') // Most recent first
        expect(history[1].query).toBe('SELECT 1')
      })

      it('should keep only last 10 items', () => {
        // Add 15 items
        for (let i = 0; i < 15; i++) {
          useSQLStore.getState().addToHistory({
            query: `SELECT ${i}`,
            executedAt: Date.now(),
            executionTime: 10,
            rowCount: 1
          })
        }

        const history = useSQLStore.getState().queryHistory
        expect(history).toHaveLength(10)
        expect(history[0].query).toBe('SELECT 14') // Most recent
        expect(history[9].query).toBe('SELECT 5') // 10th most recent
      })

      it('should handle items with errors', () => {
        const errorItem: Omit<QueryHistoryItem, 'id'> = {
          query: 'INVALID SQL',
          executedAt: Date.now(),
          executionTime: 5,
          rowCount: 0,
          error: 'Syntax error'
        }

        useSQLStore.getState().addToHistory(errorItem)

        const history = useSQLStore.getState().queryHistory
        expect(history[0].error).toBe('Syntax error')
      })
    })

    describe('loadFromHistory', () => {
      it('should load query from history into currentQuery', () => {
        const historyItem: Omit<QueryHistoryItem, 'id'> = {
          query: 'SELECT * FROM users',
          executedAt: Date.now(),
          executionTime: 50,
          rowCount: 10
        }

        useSQLStore.getState().addToHistory(historyItem)
        const id = useSQLStore.getState().queryHistory[0].id

        useSQLStore.getState().loadFromHistory(id)

        expect(useSQLStore.getState().currentQuery).toBe('SELECT * FROM users')
      })

      it('should not change currentQuery for non-existent ID', () => {
        useSQLStore.setState({ currentQuery: 'SELECT * FROM orders' })

        useSQLStore.getState().loadFromHistory('nonexistent')

        expect(useSQLStore.getState().currentQuery).toBe('SELECT * FROM orders')
      })

    })

    describe('clearHistory', () => {
      it('should clear all history', () => {
        // Add some history items
        for (let i = 0; i < 5; i++) {
          useSQLStore.getState().addToHistory({
            query: `SELECT ${i}`,
            executedAt: Date.now(),
            executionTime: 10,
            rowCount: 1
          })
        }

        expect(useSQLStore.getState().queryHistory).toHaveLength(5)

        useSQLStore.getState().clearHistory()

        expect(useSQLStore.getState().queryHistory).toEqual([])
      })

      it('should not error when clearing empty history', () => {
        useSQLStore.getState().clearHistory()

        expect(useSQLStore.getState().queryHistory).toEqual([])
      })
    })
  })

  describe('Saved Queries', () => {
    describe('saveQuery', () => {
      it('should save query with generated ID and createdAt', () => {
        useSQLStore.getState().saveQuery('Get Users', 'SELECT * FROM users')

        const savedQueries = useSQLStore.getState().savedQueries
        expect(savedQueries).toHaveLength(1)
        expect(savedQueries[0]).toMatchObject({
          name: 'Get Users',
          query: 'SELECT * FROM users'
        })
        expect(savedQueries[0].id).toBeDefined()
        expect(savedQueries[0].createdAt).toBeDefined()
      })

      it('should save query with tags', () => {
        useSQLStore.getState().saveQuery('Get Users', 'SELECT * FROM users', ['production', 'critical'])

        const savedQueries = useSQLStore.getState().savedQueries
        expect(savedQueries[0].tags).toEqual(['production', 'critical'])
      })

      it('should save query without tags', () => {
        useSQLStore.getState().saveQuery('Get Users', 'SELECT * FROM users')

        const savedQueries = useSQLStore.getState().savedQueries
        expect(savedQueries[0].tags).toBeUndefined()
      })

      it('should add multiple saved queries', () => {
        useSQLStore.getState().saveQuery('Query 1', 'SELECT 1')
        useSQLStore.getState().saveQuery('Query 2', 'SELECT 2')
        useSQLStore.getState().saveQuery('Query 3', 'SELECT 3')

        const savedQueries = useSQLStore.getState().savedQueries
        expect(savedQueries).toHaveLength(3)
        expect(savedQueries[0].name).toBe('Query 1')
        expect(savedQueries[1].name).toBe('Query 2')
        expect(savedQueries[2].name).toBe('Query 3')
      })
    })

    describe('loadSavedQuery', () => {
      it('should load saved query into currentQuery', () => {
        useSQLStore.getState().saveQuery('Get Users', 'SELECT * FROM users')
        const id = useSQLStore.getState().savedQueries[0].id

        useSQLStore.getState().loadSavedQuery(id)

        expect(useSQLStore.getState().currentQuery).toBe('SELECT * FROM users')
      })

      it('should not change currentQuery for non-existent ID', () => {
        useSQLStore.setState({ currentQuery: 'SELECT * FROM orders' })

        useSQLStore.getState().loadSavedQuery('nonexistent')

        expect(useSQLStore.getState().currentQuery).toBe('SELECT * FROM orders')
      })

    })

    describe('deleteSavedQuery', () => {

      it('should delete last saved query', () => {
        useSQLStore.getState().saveQuery('Query 1', 'SELECT 1')
        const id = useSQLStore.getState().savedQueries[0].id

        useSQLStore.getState().deleteSavedQuery(id)

        expect(useSQLStore.getState().savedQueries).toHaveLength(0)
      })

      it('should not error when deleting non-existent query', () => {
        useSQLStore.getState().saveQuery('Query 1', 'SELECT 1')

        useSQLStore.getState().deleteSavedQuery('nonexistent')

        expect(useSQLStore.getState().savedQueries).toHaveLength(1)
      })
    })

    describe('updateSavedQuery', () => {
      it('should update query name', () => {
        useSQLStore.getState().saveQuery('Old Name', 'SELECT 1')
        const id = useSQLStore.getState().savedQueries[0].id

        useSQLStore.getState().updateSavedQuery(id, { name: 'New Name' })

        expect(useSQLStore.getState().savedQueries[0].name).toBe('New Name')
        expect(useSQLStore.getState().savedQueries[0].query).toBe('SELECT 1')
      })

      it('should update query SQL', () => {
        useSQLStore.getState().saveQuery('Test Query', 'SELECT 1')
        const id = useSQLStore.getState().savedQueries[0].id

        useSQLStore.getState().updateSavedQuery(id, { query: 'SELECT 2' })

        expect(useSQLStore.getState().savedQueries[0].query).toBe('SELECT 2')
        expect(useSQLStore.getState().savedQueries[0].name).toBe('Test Query')
      })

      it('should update query tags', () => {
        useSQLStore.getState().saveQuery('Test Query', 'SELECT 1', ['old-tag'])
        const id = useSQLStore.getState().savedQueries[0].id

        useSQLStore.getState().updateSavedQuery(id, { tags: ['new-tag', 'another-tag'] })

        expect(useSQLStore.getState().savedQueries[0].tags).toEqual(['new-tag', 'another-tag'])
      })

      it('should update multiple fields at once', () => {
        useSQLStore.getState().saveQuery('Old Name', 'SELECT 1')
        const id = useSQLStore.getState().savedQueries[0].id

        useSQLStore.getState().updateSavedQuery(id, {
          name: 'New Name',
          query: 'SELECT 2',
          tags: ['updated']
        })

        const query = useSQLStore.getState().savedQueries[0]
        expect(query.name).toBe('New Name')
        expect(query.query).toBe('SELECT 2')
        expect(query.tags).toEqual(['updated'])
      })


      it('should not error when updating non-existent query', () => {
        useSQLStore.getState().saveQuery('Query 1', 'SELECT 1')

        useSQLStore.getState().updateSavedQuery('nonexistent', { name: 'New Name' })

        expect(useSQLStore.getState().savedQueries[0].name).toBe('Query 1') // Unchanged
      })
    })
  })

  describe('Persistence', () => {
    it('should have correct initial state', () => {
      const state = useSQLStore.getState()

      expect(state.drawerOpen).toBe(false)
      expect(state.drawerWidth).toBe(400)
      expect(state.currentQuery).toBe('')
      expect(state.lastResult).toBeNull()
      expect(state.lastError).toBeNull()
      expect(state.isExecuting).toBe(false)
      expect(state.queryHistory).toEqual([])
      expect(state.savedQueries).toEqual([])
    })

    it('should maintain separate instances for different tests', () => {
      // This test ensures beforeEach properly resets state
      useSQLStore.setState({ currentQuery: 'SELECT 1' })
      expect(useSQLStore.getState().currentQuery).toBe('SELECT 1')

      // In next test, it should be reset
    })
  })

  describe('Edge Cases', () => {
    it('should handle very long queries', () => {
      const longQuery = 'SELECT * FROM users WHERE ' + 'id = 1 OR '.repeat(1000) + 'id = 2'

      useSQLStore.getState().setCurrentQuery(longQuery)

      expect(useSQLStore.getState().currentQuery).toBe(longQuery)
    })

    it('should handle queries with special characters', () => {
      const specialQuery = "SELECT * FROM users WHERE name = 'O\\'Reilly' AND email LIKE '%@test.com'"

      useSQLStore.getState().setCurrentQuery(specialQuery)

      expect(useSQLStore.getState().currentQuery).toBe(specialQuery)
    })

    it('should handle rapid state changes', () => {
      for (let i = 0; i < 100; i++) {
        useSQLStore.getState().toggleDrawer()
      }

      expect(useSQLStore.getState().drawerOpen).toBe(false) // 100 toggles = back to false
    })
  })
})
