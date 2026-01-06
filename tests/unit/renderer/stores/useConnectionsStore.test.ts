import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  useConnectionsStore,
  type SavedConnection
} from '../../../../src/renderer/src/store/useConnectionsStore'
import { mockWindowApi, mockIpcSuccess } from '../../../mocks/ipc.mock'

describe('useConnectionsStore', () => {
  beforeEach(() => {
    // Clear all connections before each test
    useConnectionsStore.setState({ connections: [] })
    vi.clearAllMocks()
  })

  describe('saveConnection', () => {
    it('should save a new connection with generated ID', async () => {
      const conn = {
        name: 'Production DB',
        host: 'localhost',
        user: 'root',
        port: 3306,
        color: 'red' as const
      }

      mockWindowApi.keychain.setPassword.mockResolvedValueOnce(mockIpcSuccess(undefined))

      await useConnectionsStore.getState().saveConnection(conn, 'password123')

      const connections = useConnectionsStore.getState().connections
      expect(connections).toHaveLength(1)
      expect(connections[0]).toMatchObject({
        name: 'Production DB',
        host: 'localhost',
        user: 'root',
        port: 3306,
        color: 'red',
        id: 'localhost:3306:root'
      })
      expect(connections[0].createdAt).toBeDefined()
      expect(connections[0].lastUsed).toBeDefined()
      expect(mockWindowApi.keychain.setPassword).toHaveBeenCalledWith(
        'localhost:3306:root',
        'password123'
      )
    })

    it('should update existing connection and preserve createdAt', async () => {
      const originalCreatedAt = Date.now() - 10000

      // Set up existing connection
      useConnectionsStore.setState({
        connections: [
          {
            id: 'localhost:3306:root',
            name: 'Old Name',
            host: 'localhost',
            user: 'root',
            port: 3306,
            createdAt: originalCreatedAt,
            lastUsed: Date.now() - 5000
          }
        ]
      })

      mockWindowApi.keychain.setPassword.mockResolvedValueOnce(mockIpcSuccess(undefined))

      await useConnectionsStore.getState().saveConnection(
        {
          name: 'Updated Name',
          host: 'localhost',
          user: 'root',
          port: 3306,
          color: 'blue' as const
        },
        'newpassword'
      )

      const connections = useConnectionsStore.getState().connections
      expect(connections).toHaveLength(1)
      expect(connections[0].name).toBe('Updated Name')
      expect(connections[0].color).toBe('blue')
      expect(connections[0].createdAt).toBe(originalCreatedAt) // Preserved
      expect(connections[0].lastUsed).toBeGreaterThan(originalCreatedAt)
    })

    it('should handle empty password', async () => {
      const conn = {
        name: 'Test DB',
        host: 'localhost',
        user: 'root',
        port: 3306
      }

      await useConnectionsStore.getState().saveConnection(conn, '')

      expect(mockWindowApi.keychain.setPassword).not.toHaveBeenCalled()
      expect(useConnectionsStore.getState().connections).toHaveLength(1)
    })

    it('should add new connection at the beginning', async () => {
      // Add first connection
      useConnectionsStore.setState({
        connections: [
          {
            id: 'old:3306:user',
            name: 'Old',
            host: 'old',
            user: 'user',
            port: 3306,
            createdAt: Date.now() - 10000,
            lastUsed: Date.now() - 10000
          }
        ]
      })

      mockWindowApi.keychain.setPassword.mockResolvedValueOnce(mockIpcSuccess(undefined))

      // Add new connection
      await useConnectionsStore.getState().saveConnection(
        {
          name: 'New',
          host: 'new',
          user: 'user',
          port: 3306
        },
        'pass'
      )

      const connections = useConnectionsStore.getState().connections
      expect(connections).toHaveLength(2)
      expect(connections[0].name).toBe('New') // New connection first
      expect(connections[1].name).toBe('Old')
    })
  })

  describe('getConnection', () => {
    beforeEach(() => {
      useConnectionsStore.setState({
        connections: [
          {
            id: 'localhost:3306:root',
            name: 'Test DB',
            host: 'localhost',
            user: 'root',
            port: 3306,
            color: 'blue' as const,
            createdAt: Date.now(),
            lastUsed: Date.now()
          }
        ]
      })
    })

    it('should retrieve connection with password from keychain', async () => {
      mockWindowApi.keychain.getPassword.mockResolvedValueOnce(mockIpcSuccess('password123'))

      const result = await useConnectionsStore.getState().getConnection('localhost:3306:root')

      expect(result).toMatchObject({
        name: 'Test DB',
        host: 'localhost',
        user: 'root',
        port: 3306,
        color: 'blue',
        password: 'password123'
      })
      expect(mockWindowApi.keychain.getPassword).toHaveBeenCalledWith('localhost:3306:root')
    })

    it('should handle missing password in keychain', async () => {
      mockWindowApi.keychain.getPassword.mockResolvedValueOnce(mockIpcSuccess(null))

      const result = await useConnectionsStore.getState().getConnection('localhost:3306:root')

      expect(result.password).toBeNull()
    })

    it('should throw error for non-existent connection', async () => {
      await expect(
        useConnectionsStore.getState().getConnection('nonexistent:3306:user')
      ).rejects.toThrow('Connection not found')
    })
  })

  describe('updateConnection', () => {
    beforeEach(() => {
      useConnectionsStore.setState({
        connections: [
          {
            id: 'localhost:3306:root',
            name: 'Test DB',
            host: 'localhost',
            user: 'root',
            port: 3306,
            color: 'blue' as const,
            createdAt: Date.now() - 10000,
            lastUsed: Date.now() - 5000
          }
        ]
      })
    })

    it('should update connection metadata', async () => {
      await useConnectionsStore.getState().updateConnection('localhost:3306:root', {
        name: 'Updated Name',
        color: 'red' as const,
        tags: ['production', 'critical']
      })

      const conn = useConnectionsStore.getState().connections[0]
      expect(conn.name).toBe('Updated Name')
      expect(conn.color).toBe('red')
      expect(conn.tags).toEqual(['production', 'critical'])
    })

    it('should update password in keychain when provided', async () => {
      mockWindowApi.keychain.setPassword.mockResolvedValueOnce(mockIpcSuccess(undefined))

      await useConnectionsStore
        .getState()
        .updateConnection('localhost:3306:root', { name: 'Updated' }, 'newpassword')

      expect(mockWindowApi.keychain.setPassword).toHaveBeenCalledWith(
        'localhost:3306:root',
        'newpassword'
      )
    })

    it('should delete password when empty string provided', async () => {
      mockWindowApi.keychain.deletePassword.mockResolvedValueOnce(mockIpcSuccess(true))

      await useConnectionsStore
        .getState()
        .updateConnection('localhost:3306:root', { name: 'Updated' }, '')

      expect(mockWindowApi.keychain.deletePassword).toHaveBeenCalledWith('localhost:3306:root')
    })

    it('should not touch keychain when password not provided', async () => {
      await useConnectionsStore.getState().updateConnection('localhost:3306:root', {
        name: 'Updated'
      })

      expect(mockWindowApi.keychain.setPassword).not.toHaveBeenCalled()
      expect(mockWindowApi.keychain.deletePassword).not.toHaveBeenCalled()
    })
  })

  describe('deleteConnection', () => {
    beforeEach(() => {
      useConnectionsStore.setState({
        connections: [
          {
            id: 'localhost:3306:root',
            name: 'Test DB',
            host: 'localhost',
            user: 'root',
            port: 3306,
            createdAt: Date.now(),
            lastUsed: Date.now()
          },
          {
            id: 'remote:3307:admin',
            name: 'Remote DB',
            host: 'remote',
            user: 'admin',
            port: 3307,
            createdAt: Date.now(),
            lastUsed: Date.now()
          }
        ]
      })
    })

    it('should delete connection and password from keychain', async () => {
      mockWindowApi.keychain.deletePassword.mockResolvedValueOnce(mockIpcSuccess(true))

      await useConnectionsStore.getState().deleteConnection('localhost:3306:root')

      const connections = useConnectionsStore.getState().connections
      expect(connections).toHaveLength(1)
      expect(connections[0].id).toBe('remote:3307:admin')
      expect(mockWindowApi.keychain.deletePassword).toHaveBeenCalledWith('localhost:3306:root')
    })

    it('should handle deleting last connection', async () => {
      mockWindowApi.keychain.deletePassword.mockResolvedValue(mockIpcSuccess(true))

      await useConnectionsStore.getState().deleteConnection('localhost:3306:root')
      await useConnectionsStore.getState().deleteConnection('remote:3307:admin')

      expect(useConnectionsStore.getState().connections).toHaveLength(0)
    })
  })

  describe('listConnections', () => {
    it('should return empty array when no connections', () => {
      const connections = useConnectionsStore.getState().listConnections()
      expect(connections).toEqual([])
    })

    it('should return all connections', () => {
      const mockConnections: SavedConnection[] = [
        {
          id: 'localhost:3306:root',
          name: 'Local',
          host: 'localhost',
          user: 'root',
          port: 3306,
          createdAt: Date.now(),
          lastUsed: Date.now()
        },
        {
          id: 'remote:3307:admin',
          name: 'Remote',
          host: 'remote',
          user: 'admin',
          port: 3307,
          createdAt: Date.now(),
          lastUsed: Date.now()
        }
      ]

      useConnectionsStore.setState({ connections: mockConnections })

      const connections = useConnectionsStore.getState().listConnections()
      expect(connections).toHaveLength(2)
      expect(connections).toEqual(mockConnections)
    })
  })

  describe('touchConnection', () => {
    it('should update lastUsed timestamp', () => {
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

      useConnectionsStore.getState().touchConnection('localhost:3306:root')

      const conn = useConnectionsStore.getState().connections[0]
      expect(conn.lastUsed).toBeGreaterThan(oldTimestamp)
    })

    it('should only update the specified connection', () => {
      const timestamp1 = Date.now() - 10000
      const timestamp2 = Date.now() - 5000

      useConnectionsStore.setState({
        connections: [
          {
            id: 'conn1:3306:user',
            name: 'Conn1',
            host: 'conn1',
            user: 'user',
            port: 3306,
            createdAt: Date.now() - 20000,
            lastUsed: timestamp1
          },
          {
            id: 'conn2:3306:user',
            name: 'Conn2',
            host: 'conn2',
            user: 'user',
            port: 3306,
            createdAt: Date.now() - 15000,
            lastUsed: timestamp2
          }
        ]
      })

      useConnectionsStore.getState().touchConnection('conn1:3306:user')

      const connections = useConnectionsStore.getState().connections
      expect(connections[0].lastUsed).toBeGreaterThan(timestamp1)
      expect(connections[1].lastUsed).toBe(timestamp2) // Unchanged
    })
  })

  describe('ID Generation', () => {
    it('should generate consistent IDs from host:port:user', async () => {
      mockWindowApi.keychain.setPassword.mockResolvedValue(mockIpcSuccess(undefined))

      await useConnectionsStore.getState().saveConnection(
        {
          name: 'Test',
          host: 'db.example.com',
          user: 'admin',
          port: 3307
        },
        'pass'
      )

      const conn = useConnectionsStore.getState().connections[0]
      expect(conn.id).toBe('db.example.com:3307:admin')
    })

    it('should treat same host:port:user as same connection', async () => {
      mockWindowApi.keychain.setPassword.mockResolvedValue(mockIpcSuccess(undefined))

      // Save first time
      await useConnectionsStore.getState().saveConnection(
        {
          name: 'First',
          host: 'localhost',
          user: 'root',
          port: 3306,
          color: 'red' as const
        },
        'pass1'
      )

      expect(useConnectionsStore.getState().connections).toHaveLength(1)

      // Save again with different name but same host/port/user
      await useConnectionsStore.getState().saveConnection(
        {
          name: 'Second',
          host: 'localhost',
          user: 'root',
          port: 3306,
          color: 'blue' as const
        },
        'pass2'
      )

      // Should still be 1 connection (updated, not added)
      const connections = useConnectionsStore.getState().connections
      expect(connections).toHaveLength(1)
      expect(connections[0].name).toBe('Second')
      expect(connections[0].color).toBe('blue')
    })
  })
})
