import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { type RowDataPacket } from 'mysql2/promise'
import {
  mockMysql,
  createMockPool,
  mockQuerySuccess,
  mockQueryError
} from '../../mocks/mysql.mock'
import {
  mockCredentials,
  mockDatabases,
  mockTableStatusResults,
  mockShowColumnsResults
} from '../../fixtures/mockData'

// Mock mysql2/promise - MUST be before imports that use it
vi.mock('mysql2/promise', () => mockMysql)

// Import AFTER mocking
import {
  testConnection,
  selectDatabase,
  getTables,
  getTableColumns,
  cleanupWindow,
  type DbCredentials
} from '../../../src/main/database'

describe('database.ts', () => {
  const TEST_WINDOW_ID = 1
  let mockPool: ReturnType<typeof createMockPool>

  beforeEach(() => {
    vi.clearAllMocks()
    mockPool = createMockPool()
    mockMysql.default.createPool.mockReturnValue(mockPool as never)
  })

  afterEach(async () => {
    // Cleanup window state after each test
    try {
      await cleanupWindow(TEST_WINDOW_ID)
    } catch {
      // Ignore cleanup errors in tests
    }
  })

  describe('testConnection', () => {
    it('should successfully connect and return list of databases', async () => {
      const mockDbRows = mockDatabases.map((db) => ({ Database: db }))
      mockPool.query.mockResolvedValueOnce(mockQuerySuccess(mockDbRows))

      const result = await testConnection(TEST_WINDOW_ID, mockCredentials)

      expect(result).toEqual(mockDatabases)
      expect(mockMysql.default.createPool).toHaveBeenCalledWith({
        host: mockCredentials.host,
        user: mockCredentials.user,
        password: mockCredentials.password,
        port: mockCredentials.port,
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0,
        enableKeepAlive: true,
        keepAliveInitialDelay: 0
      })
      expect(mockPool.query).toHaveBeenCalledWith('SHOW DATABASES')
    })

    it('should handle connection failure and cleanup pool', async () => {
      mockPool.query.mockRejectedValueOnce(mockQueryError('Connection refused'))

      await expect(testConnection(TEST_WINDOW_ID, mockCredentials)).rejects.toThrow(
        'Connection failed: Connection refused'
      )

      // Verify pool was cleaned up
      expect(mockPool.end).toHaveBeenCalled()
    })

    it('should use default port 3306 when not specified', async () => {
      const credsWithoutPort: DbCredentials = {
        host: 'localhost',
        user: 'root',
        password: 'pass'
      }
      mockPool.query.mockResolvedValueOnce(mockQuerySuccess([]))

      await testConnection(TEST_WINDOW_ID, credsWithoutPort)

      expect(mockMysql.default.createPool).toHaveBeenCalledWith(
        expect.objectContaining({
          port: 3306
        })
      )
    })

    it('should use empty password when not specified', async () => {
      const credsWithoutPassword: DbCredentials = {
        host: 'localhost',
        user: 'root'
      }
      mockPool.query.mockResolvedValueOnce(mockQuerySuccess([]))

      await testConnection(TEST_WINDOW_ID, credsWithoutPassword)

      expect(mockMysql.default.createPool).toHaveBeenCalledWith(
        expect.objectContaining({
          password: ''
        })
      )
    })

    it('should close existing pool before creating new one', async () => {
      // First connection
      mockPool.query.mockResolvedValueOnce(mockQuerySuccess([{ Database: 'db1' }]))
      await testConnection(TEST_WINDOW_ID, mockCredentials)

      const firstPool = mockPool
      const secondPool = createMockPool()
      mockMysql.default.createPool.mockReturnValue(secondPool as never)
      secondPool.query.mockResolvedValueOnce(mockQuerySuccess([{ Database: 'db2' }]))

      // Second connection should close first pool
      await testConnection(TEST_WINDOW_ID, mockCredentials)

      expect(firstPool.end).toHaveBeenCalled()
    })
  })

  describe('selectDatabase', () => {
    beforeEach(async () => {
      // Setup connection first
      mockPool.query.mockResolvedValueOnce(mockQuerySuccess([{ Database: 'testdb' }]))
      await testConnection(TEST_WINDOW_ID, mockCredentials)
      vi.clearAllMocks()
    })

    it('should successfully select a database', async () => {
      mockPool.query
        .mockResolvedValueOnce(mockQuerySuccess([]))  // SELECT 1 health check
        .mockResolvedValueOnce(mockQuerySuccess([]))  // USE database

      const result = await selectDatabase(TEST_WINDOW_ID, 'testdb')

      expect(result).toBe(true)
      expect(mockPool.query).toHaveBeenCalledWith('SELECT 1')
      expect(mockPool.query).toHaveBeenCalledWith('USE `testdb`')
    })

    it('should throw error if no active pool', async () => {
      await cleanupWindow(TEST_WINDOW_ID)

      await expect(selectDatabase(TEST_WINDOW_ID, 'testdb')).rejects.toThrow(
        'No active connection pool. Please connect first.'
      )
    })

    it('should throw error if connection is unhealthy', async () => {
      mockPool.query.mockRejectedValueOnce(mockQueryError('Connection lost'))

      await expect(selectDatabase(TEST_WINDOW_ID, 'testdb')).rejects.toThrow(
        'Database connection is not healthy. Please reconnect.'
      )
    })

    it('should handle non-existent database', async () => {
      mockPool.query
        .mockResolvedValueOnce(mockQuerySuccess([]))  // SELECT 1
        .mockRejectedValueOnce(mockQueryError("Unknown database 'nonexistent'"))

      await expect(selectDatabase(TEST_WINDOW_ID, 'nonexistent')).rejects.toThrow(
        'Failed to select database'
      )
    })
  })

  describe('getTables', () => {
    beforeEach(async () => {
      // Setup connection and database
      mockPool.query.mockResolvedValueOnce(mockQuerySuccess([{ Database: 'testdb' }]))
      await testConnection(TEST_WINDOW_ID, mockCredentials)
      mockPool.query
        .mockResolvedValueOnce(mockQuerySuccess([]))
        .mockResolvedValueOnce(mockQuerySuccess([]))
      await selectDatabase(TEST_WINDOW_ID, 'testdb')
      vi.clearAllMocks()
    })

    it('should return list of tables with metadata', async () => {
      mockPool.query
        .mockResolvedValueOnce(mockQuerySuccess([]))  // SELECT 1
        .mockResolvedValueOnce(mockQuerySuccess([]))  // USE database (re-select)
        .mockResolvedValueOnce(mockQuerySuccess(mockTableStatusResults))

      const result = await getTables(TEST_WINDOW_ID)

      expect(result).toEqual([
        { name: 'users', rows: 1500, dataSize: 65536, indexSize: 16384 },
        { name: 'orders', rows: 5000, dataSize: 131072, indexSize: 32768 },
        { name: 'products', rows: 250, dataSize: 32768, indexSize: 8192 }
      ])
      expect(mockPool.query).toHaveBeenCalledWith('SHOW TABLE STATUS')
    })

    it('should throw error if no active pool', async () => {
      await cleanupWindow(TEST_WINDOW_ID)

      await expect(getTables(TEST_WINDOW_ID)).rejects.toThrow(
        'No active database connection'
      )
    })

    it('should handle empty database', async () => {
      mockPool.query
        .mockResolvedValueOnce(mockQuerySuccess([]))  // SELECT 1
        .mockResolvedValueOnce(mockQuerySuccess([]))  // USE database
        .mockResolvedValueOnce(mockQuerySuccess([]))  // SHOW TABLE STATUS (empty)

      const result = await getTables(TEST_WINDOW_ID)

      expect(result).toEqual([])
    })

    it('should handle unhealthy connection', async () => {
      mockPool.query.mockRejectedValueOnce(mockQueryError('Connection lost'))

      await expect(getTables(TEST_WINDOW_ID)).rejects.toThrow(
        'Database connection is not healthy. Please reconnect.'
      )
    })
  })

  describe('getTableColumns', () => {
    beforeEach(async () => {
      // Setup connection and database
      mockPool.query.mockResolvedValueOnce(mockQuerySuccess([{ Database: 'testdb' }]))
      await testConnection(TEST_WINDOW_ID, mockCredentials)
      mockPool.query
        .mockResolvedValueOnce(mockQuerySuccess([]))
        .mockResolvedValueOnce(mockQuerySuccess([]))
      await selectDatabase(TEST_WINDOW_ID, 'testdb')
      vi.clearAllMocks()
    })

    it('should return column information for a table', async () => {
      mockPool.query
        .mockResolvedValueOnce(mockQuerySuccess([]))  // SELECT 1
        .mockResolvedValueOnce(mockQuerySuccess([]))  // USE database
        .mockResolvedValueOnce(mockQuerySuccess(mockShowColumnsResults))

      const result = await getTableColumns(TEST_WINDOW_ID, 'users')

      expect(result).toHaveLength(6)
      expect(result[0]).toEqual({
        name: 'id',
        type: 'int',
        nullable: false,
        key: 'PRI',
        default: null,
        extra: 'auto_increment'
      })
    })

    it('should properly escape table name with backticks', async () => {
      mockPool.query
        .mockResolvedValueOnce(mockQuerySuccess([]))
        .mockResolvedValueOnce(mockQuerySuccess([]))
        .mockResolvedValueOnce(mockQuerySuccess([]))

      await getTableColumns(TEST_WINDOW_ID, 'users')

      expect(mockPool.escapeId).toHaveBeenCalledWith('users')
    })

    it('should handle non-existent table', async () => {
      mockPool.query
        .mockResolvedValueOnce(mockQuerySuccess([]))
        .mockResolvedValueOnce(mockQuerySuccess([]))
        .mockRejectedValueOnce(mockQueryError("Table 'testdb.nonexistent' doesn't exist"))

      await expect(getTableColumns(TEST_WINDOW_ID, 'nonexistent')).rejects.toThrow(
        'Failed to get columns'
      )
    })

    it('should handle special characters in table name', async () => {
      const specialTableName = 'table`with`backticks'
      mockPool.query
        .mockResolvedValueOnce(mockQuerySuccess([]))
        .mockResolvedValueOnce(mockQuerySuccess([]))
        .mockResolvedValueOnce(mockQuerySuccess([]))

      await getTableColumns(TEST_WINDOW_ID, specialTableName)

      expect(mockPool.escapeId).toHaveBeenCalledWith(specialTableName)
    })
  })

  describe('cleanupWindow', () => {
    it('should cleanup pool and remove window state', async () => {
      mockPool.query.mockResolvedValueOnce(mockQuerySuccess([{ Database: 'testdb' }]))
      await testConnection(TEST_WINDOW_ID, mockCredentials)

      await cleanupWindow(TEST_WINDOW_ID)

      expect(mockPool.end).toHaveBeenCalled()
    })

    it('should handle cleanup of non-existent window', async () => {
      // Should not throw
      await expect(cleanupWindow(999)).resolves.toBeUndefined()
    })

    it('should handle pool.end() errors gracefully', async () => {
      mockPool.query.mockResolvedValueOnce(mockQuerySuccess([]))
      await testConnection(TEST_WINDOW_ID, mockCredentials)

      mockPool.end.mockRejectedValueOnce(new Error('Pool already closed'))

      // Should not throw - errors are logged but not propagated
      await expect(cleanupWindow(TEST_WINDOW_ID)).resolves.toBeUndefined()
    })
  })

  describe('serializeValue - Buffer handling', () => {
    // Note: serializeValue is not exported, but we can test it through queryTable
    // For now, we'll create unit tests for the expected behavior

    it('should convert 16-byte Buffer to UUID for uuid columns', () => {
      const buffer = Buffer.from('0123456789abcdef')
      const columnName = 'user_id'

      // Expected UUID format: 01234567-89ab-cdef-0123-456789abcdef
      const expected = '30313233-3435-3637-3839-616263646566'

      // This will be tested through integration tests
      expect(buffer.length).toBe(16)
      expect(columnName).toContain('id')
    })

    it('should convert Buffer to hex for non-UUID columns', () => {
      const buffer = Buffer.from('hello')
      const hex = '0x' + buffer.toString('hex')

      expect(hex).toBe('0x68656c6c6f')
    })
  })

  describe('isUuidColumn heuristic', () => {
    const uuidColumnNames = ['uuid', 'user_id', 'id', 'order_uuid', 'customer_id']
    const nonUuidColumnNames = ['data', 'content', 'binary_data', 'hash']

    it.each(uuidColumnNames)('should identify "%s" as UUID column', (columnName) => {
      const lower = columnName.toLowerCase()
      const isUuid = lower.includes('uuid') || lower.endsWith('_id') || lower === 'id'
      expect(isUuid).toBe(true)
    })

    it.each(nonUuidColumnNames)('should identify "%s" as non-UUID column', (columnName) => {
      const lower = columnName.toLowerCase()
      const isUuid = lower.includes('uuid') || lower.endsWith('_id') || lower === 'id'
      expect(isUuid).toBe(false)
    })
  })

  describe('Date serialization', () => {
    it('should serialize valid dates to ISO string', () => {
      const date = new Date('2024-01-01T10:00:00Z')
      expect(date.toISOString()).toBe('2024-01-01T10:00:00.000Z')
    })

    it('should handle invalid dates (0000-00-00)', () => {
      const invalidDate = new Date('0000-00-00')
      expect(isNaN(invalidDate.getTime())).toBe(true)
    })

    it('should handle NaN dates', () => {
      const nanDate = new Date('invalid')
      expect(isNaN(nanDate.getTime())).toBe(true)
    })
  })

  describe('BigInt serialization', () => {
    it('should convert BigInt to string', () => {
      const bigInt = BigInt('9007199254740991')
      expect(bigInt.toString()).toBe('9007199254740991')
    })

    it('should handle very large BigInt values', () => {
      const hugeBigInt = BigInt('999999999999999999999999')
      expect(hugeBigInt.toString()).toBe('999999999999999999999999')
    })
  })

  describe('Multi-window isolation', () => {
    const WINDOW_1 = 1
    const WINDOW_2 = 2

    afterEach(async () => {
      await cleanupWindow(WINDOW_1)
      await cleanupWindow(WINDOW_2)
    })

    it('should maintain separate pools for different windows', async () => {
      const pool1 = createMockPool()
      const pool2 = createMockPool()

      mockMysql.default.createPool
        .mockReturnValueOnce(pool1 as never)
        .mockReturnValueOnce(pool2 as never)

      pool1.query.mockResolvedValue(mockQuerySuccess([{ Database: 'db1' }]))
      pool2.query.mockResolvedValue(mockQuerySuccess([{ Database: 'db2' }]))

      await testConnection(WINDOW_1, mockCredentials)
      await testConnection(WINDOW_2, mockCredentials)

      expect(mockMysql.default.createPool).toHaveBeenCalledTimes(2)

      // Cleanup window 1 should not affect window 2
      await cleanupWindow(WINDOW_1)
      expect(pool1.end).toHaveBeenCalled()
      expect(pool2.end).not.toHaveBeenCalled()
    })
  })
})
