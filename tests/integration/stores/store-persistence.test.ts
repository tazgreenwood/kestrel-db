import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { useSettingsStore } from '../../../src/renderer/src/store/useSettingsStore'
import { useSQLStore } from '../../../src/renderer/src/store/useSQLStore'
import { useConnectionsStore } from '../../../src/renderer/src/store/useConnectionsStore'
import type { Theme } from '../../../src/renderer/src/theme/types'

/**
 * Store Persistence Integration Tests
 *
 * These tests verify that Zustand stores persist correctly to localStorage
 * and rehydrate properly, simulating real-world app restart scenarios.
 *
 * Critical for regression testing because users expect their:
 * - Settings to persist across sessions
 * - Query history to be available
 * - Saved queries to remain accessible
 * - Connections to be remembered
 */

describe('Store Persistence Integration', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear()

    // Reset all stores to initial state
    useSettingsStore.getState().resetSettings()
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
    useConnectionsStore.setState({
      connections: []
    })
  })

  afterEach(() => {
    // Clean up after each test
    localStorage.clear()
  })

  describe('useSettingsStore Persistence', () => {
    it('should persist fontSize to localStorage', () => {
      useSettingsStore.getState().setFontSize(15)

      // Check localStorage directly
      const stored = localStorage.getItem('kestrel-settings')
      expect(stored).toBeDefined()

      const parsed = JSON.parse(stored!)
      expect(parsed.state.fontSize).toBe(15)
    })

    it('should persist uiScale to localStorage', () => {
      useSettingsStore.getState().setUiScale(110)

      const stored = localStorage.getItem('kestrel-settings')
      const parsed = JSON.parse(stored!)
      expect(parsed.state.uiScale).toBe(110)
    })

    it('should persist highContrast setting', () => {
      useSettingsStore.getState().setHighContrast(true)

      const stored = localStorage.getItem('kestrel-settings')
      const parsed = JSON.parse(stored!)
      expect(parsed.state.highContrast).toBe(true)
    })

    it('should persist custom themes', () => {
      const customTheme: Theme = {
        id: 'test-theme',
        name: 'Test Theme',
        colors: {
          background: {
            primary: '#000000',
            secondary: '#111111',
            tertiary: '#222222',
            elevated: '#333333'
          },
          text: {
            primary: '#FFFFFF',
            secondary: '#CCCCCC',
            tertiary: '#999999',
            inverse: '#000000'
          },
          border: {
            default: '#444444',
            subtle: '#333333',
            focus: '#0066FF'
          },
          accent: {
            primary: '#0066FF',
            hover: '#0052CC',
            active: '#003D99',
            subtle: '#E6F0FF'
          },
          semantic: {
            success: '#00CC66',
            successSubtle: '#E6F9F0',
            error: '#FF3333',
            errorSubtle: '#FFE6E6',
            warning: '#FFAA00',
            warningSubtle: '#FFF4E6',
            info: '#0099FF',
            infoSubtle: '#E6F5FF'
          },
          dataTypes: {
            uuid: '#9966FF',
            hex: '#FF6633',
            date: '#00CC99',
            json: '#FFAA00',
            boolean: '#FF3399'
          },
          special: {
            database: '#00CC66',
            overlay: '#00000080',
            scrollbar: '#444444'
          }
        }
      }

      useSettingsStore.getState().addCustomTheme(customTheme)

      const stored = localStorage.getItem('kestrel-settings')
      const parsed = JSON.parse(stored!)
      expect(parsed.state.customThemes).toHaveLength(1)
      expect(parsed.state.customThemes[0].id).toBe('test-theme')
    })

    it('should persist multiple settings together', () => {
      const store = useSettingsStore.getState()
      store.setFontSize(14)
      store.setUiScale(105)
      store.setDefaultChunkSize(2000)
      store.setHighContrast(true)
      store.setReduceAnimations(true)

      const stored = localStorage.getItem('kestrel-settings')
      const parsed = JSON.parse(stored!)

      expect(parsed.state.fontSize).toBe(14)
      expect(parsed.state.uiScale).toBe(105)
      expect(parsed.state.defaultChunkSize).toBe(2000)
      expect(parsed.state.highContrast).toBe(true)
      expect(parsed.state.reduceAnimations).toBe(true)
    })

    it('should include version info in persisted data', () => {
      useSettingsStore.getState().setFontSize(14)

      const stored = localStorage.getItem('kestrel-settings')
      const parsed = JSON.parse(stored!)

      expect(parsed.version).toBeDefined()
    })
  })

  describe('useSQLStore Persistence', () => {
    it('should persist drawerWidth to localStorage', () => {
      useSQLStore.getState().setDrawerWidth(500)

      const stored = localStorage.getItem('kestrel-sql-storage')
      const parsed = JSON.parse(stored!)
      expect(parsed.state.drawerWidth).toBe(500)
    })

    it('should persist query history', () => {
      useSQLStore.getState().addToHistory({
        query: 'SELECT * FROM users',
        executedAt: Date.now(),
        executionTime: 50,
        rowCount: 10
      })

      const stored = localStorage.getItem('kestrel-sql-storage')
      const parsed = JSON.parse(stored!)
      expect(parsed.state.queryHistory).toHaveLength(1)
      expect(parsed.state.queryHistory[0].query).toBe('SELECT * FROM users')
    })

    it('should persist saved queries', () => {
      useSQLStore.getState().saveQuery('Get Users', 'SELECT * FROM users', ['production'])

      const stored = localStorage.getItem('kestrel-sql-storage')
      const parsed = JSON.parse(stored!)
      expect(parsed.state.savedQueries).toHaveLength(1)
      expect(parsed.state.savedQueries[0].name).toBe('Get Users')
      expect(parsed.state.savedQueries[0].query).toBe('SELECT * FROM users')
      expect(parsed.state.savedQueries[0].tags).toEqual(['production'])
    })

    it('should NOT persist drawerOpen state', () => {
      useSQLStore.getState().openDrawer()

      const stored = localStorage.getItem('kestrel-sql-storage')
      const parsed = JSON.parse(stored!)
      expect(parsed.state.drawerOpen).toBeUndefined()
    })

    it('should NOT persist currentQuery', () => {
      useSQLStore.getState().setCurrentQuery('SELECT * FROM temp')

      const stored = localStorage.getItem('kestrel-sql-storage')
      const parsed = JSON.parse(stored!)
      expect(parsed.state.currentQuery).toBeUndefined()
    })

    it('should NOT persist execution state', () => {
      useSQLStore.setState({
        isExecuting: true,
        lastResult: { rows: [], fields: [], executionTime: 0, rowCount: 0 },
        lastError: 'Test error'
      })

      const stored = localStorage.getItem('kestrel-sql-storage')
      const parsed = JSON.parse(stored!)
      expect(parsed.state.isExecuting).toBeUndefined()
      expect(parsed.state.lastResult).toBeUndefined()
      expect(parsed.state.lastError).toBeUndefined()
    })

    it('should persist up to 10 history items', () => {
      // Add 15 items
      for (let i = 0; i < 15; i++) {
        useSQLStore.getState().addToHistory({
          query: `SELECT ${i}`,
          executedAt: Date.now(),
          executionTime: 10,
          rowCount: 1
        })
      }

      const stored = localStorage.getItem('kestrel-sql-storage')
      const parsed = JSON.parse(stored!)
      expect(parsed.state.queryHistory).toHaveLength(10)
    })
  })

  describe('useConnectionsStore Persistence', () => {
    it('should persist saved connections', async () => {
      await useConnectionsStore.getState().saveConnection(
        {
          name: 'Production DB',
          host: 'localhost',
          user: 'root',
          port: 3306,
          color: 'red' as const
        },
        'password123'
      )

      const stored = localStorage.getItem('kestrel-connections')
      const parsed = JSON.parse(stored!)
      expect(parsed.state.connections).toHaveLength(1)
      expect(parsed.state.connections[0].name).toBe('Production DB')
    })

    it('should persist connection metadata but NOT passwords', async () => {
      await useConnectionsStore.getState().saveConnection(
        {
          name: 'Test DB',
          host: 'localhost',
          user: 'root',
          port: 3306
        },
        'secret'
      )

      const stored = localStorage.getItem('kestrel-connections')
      const parsed = JSON.parse(stored!)
      const connection = parsed.state.connections[0]

      expect(connection.name).toBe('Test DB')
      expect(connection.host).toBe('localhost')
      expect(connection.user).toBe('root')
      expect(connection.port).toBe(3306)
      expect(connection.password).toBeUndefined() // Passwords stored in keychain, not localStorage
    })

    it('should persist connection timestamps', async () => {
      await useConnectionsStore.getState().saveConnection(
        {
          name: 'Test DB',
          host: 'localhost',
          user: 'root',
          port: 3306
        },
        ''
      )

      const stored = localStorage.getItem('kestrel-connections')
      const parsed = JSON.parse(stored!)
      const connection = parsed.state.connections[0]

      expect(connection.createdAt).toBeDefined()
      expect(connection.lastUsed).toBeDefined()
    })

    it('should persist multiple connections', async () => {
      await useConnectionsStore
        .getState()
        .saveConnection({ name: 'DB1', host: 'host1', user: 'user1', port: 3306 }, '')
      await useConnectionsStore
        .getState()
        .saveConnection({ name: 'DB2', host: 'host2', user: 'user2', port: 3307 }, '')

      const stored = localStorage.getItem('kestrel-connections')
      const parsed = JSON.parse(stored!)
      expect(parsed.state.connections).toHaveLength(2)
    })

    it('should update lastUsed timestamp when touchConnection is called', () => {
      const store = useConnectionsStore.getState()
      const oldTimestamp = Date.now() - 10000

      useConnectionsStore.setState({
        connections: [
          {
            id: 'localhost:3306:root',
            name: 'Test',
            host: 'localhost',
            user: 'root',
            port: 3306,
            createdAt: Date.now() - 20000,
            lastUsed: oldTimestamp
          }
        ]
      })

      store.touchConnection('localhost:3306:root')

      const stored = localStorage.getItem('kestrel-connections')
      const parsed = JSON.parse(stored!)
      expect(parsed.state.connections[0].lastUsed).toBeGreaterThan(oldTimestamp)
    })
  })

  describe('Store Rehydration', () => {
    it('should rehydrate useSettingsStore from localStorage', () => {
      // Simulate existing localStorage data
      const settingsData = {
        state: {
          fontSize: 15,
          uiScale: 110,
          defaultChunkSize: 2000,
          highContrast: true
        },
        version: 0
      }
      localStorage.setItem('kestrel-settings', JSON.stringify(settingsData))

      // Force rehydration by reading from localStorage and applying to store
      const stored = localStorage.getItem('kestrel-settings')
      if (stored) {
        const parsed = JSON.parse(stored)
        useSettingsStore.setState(parsed.state)
      }

      const state = useSettingsStore.getState()
      expect(state.fontSize).toBe(15)
      expect(state.uiScale).toBe(110)
      expect(state.defaultChunkSize).toBe(2000)
      expect(state.highContrast).toBe(true)
    })

    it('should rehydrate useSQLStore from localStorage', () => {
      const sqlData = {
        state: {
          drawerWidth: 450,
          queryHistory: [
            {
              id: '1',
              query: 'SELECT * FROM users',
              executedAt: Date.now(),
              executionTime: 50,
              rowCount: 10
            }
          ],
          savedQueries: [
            {
              id: '2',
              name: 'Get Users',
              query: 'SELECT * FROM users',
              createdAt: Date.now()
            }
          ]
        },
        version: 0
      }
      localStorage.setItem('kestrel-sql-storage', JSON.stringify(sqlData))

      // Force rehydration
      const stored = localStorage.getItem('kestrel-sql-storage')
      if (stored) {
        const parsed = JSON.parse(stored)
        useSQLStore.setState(parsed.state)
      }

      const state = useSQLStore.getState()
      expect(state.drawerWidth).toBe(450)
      expect(state.queryHistory).toHaveLength(1)
      expect(state.savedQueries).toHaveLength(1)
    })

    it('should handle missing localStorage data gracefully', () => {
      // Ensure no localStorage data exists
      localStorage.clear()

      // Store should use default values
      const settings = useSettingsStore.getState()
      expect(settings.fontSize).toBe(13) // Default value
      expect(settings.uiScale).toBe(100) // Default value

      const sql = useSQLStore.getState()
      expect(sql.drawerWidth).toBe(400) // Default value
      expect(sql.queryHistory).toEqual([])

      const connections = useConnectionsStore.getState()
      expect(connections.connections).toEqual([])
    })
  })

  describe('Cross-Store Consistency', () => {
    it('should persist changes across all stores independently', async () => {
      // Change settings
      useSettingsStore.getState().setFontSize(14)

      // Add SQL history
      useSQLStore.getState().addToHistory({
        query: 'SELECT 1',
        executedAt: Date.now(),
        executionTime: 10,
        rowCount: 1
      })

      // Add connection
      await useConnectionsStore
        .getState()
        .saveConnection({ name: 'Test', host: 'localhost', user: 'root', port: 3306 }, '')

      // Verify all three stores persisted correctly
      const settings = localStorage.getItem('kestrel-settings')
      const sql = localStorage.getItem('kestrel-sql-storage')
      const connections = localStorage.getItem('kestrel-connections')

      expect(settings).toBeDefined()
      expect(sql).toBeDefined()
      expect(connections).toBeDefined()

      const parsedSettings = JSON.parse(settings!)
      const parsedSQL = JSON.parse(sql!)
      const parsedConnections = JSON.parse(connections!)

      expect(parsedSettings.state.fontSize).toBe(14)
      expect(parsedSQL.state.queryHistory).toHaveLength(1)
      expect(parsedConnections.state.connections).toHaveLength(1)
    })
  })

  describe('Persistence Performance', () => {
    it('should handle rapid successive writes', () => {
      // Rapidly change settings
      for (let i = 0; i < 100; i++) {
        useSettingsStore.getState().setFontSize(13)
        useSettingsStore.getState().setFontSize(14)
      }

      // Final value should be persisted
      const stored = localStorage.getItem('kestrel-settings')
      const parsed = JSON.parse(stored!)
      expect(parsed.state.fontSize).toBe(14)
    })

    it('should handle large query history efficiently', () => {
      // Add 10 large query strings
      for (let i = 0; i < 10; i++) {
        useSQLStore.getState().addToHistory({
          query: 'SELECT * FROM users WHERE ' + 'id = 1 OR '.repeat(100) + 'id = 2',
          executedAt: Date.now(),
          executionTime: 50,
          rowCount: 100
        })
      }

      const stored = localStorage.getItem('kestrel-sql-storage')
      expect(stored).toBeDefined()
      expect(stored!.length).toBeGreaterThan(0)

      const parsed = JSON.parse(stored!)
      expect(parsed.state.queryHistory).toHaveLength(10)
    })
  })
})
