import { vi } from 'vitest'
import type { Pool, RowDataPacket, ResultSetHeader } from 'mysql2/promise'

export interface MockPool {
  query: ReturnType<typeof vi.fn>
  end: ReturnType<typeof vi.fn>
  escapeId: ReturnType<typeof vi.fn>
  on: ReturnType<typeof vi.fn>
}

/**
 * Create a mock MySQL connection pool
 */
export function createMockPool(): MockPool {
  return {
    query: vi.fn(),
    end: vi.fn().mockResolvedValue(undefined),
    escapeId: vi.fn((str: string) => `\`${str.replace(/`/g, '``')}\``),
    on: vi.fn()
  }
}

/**
 * Mock mysql2/promise module
 */
export const mockMysql = {
  default: {
    createPool: vi.fn(() => createMockPool())
  },
  createPool: vi.fn(() => createMockPool())
}

/**
 * Helper to mock successful database query
 */
export function mockQuerySuccess<T = RowDataPacket[]>(data: T): [T, unknown] {
  return [data, {}]
}

/**
 * Helper to mock ResultSetHeader for INSERT/UPDATE/DELETE
 */
export function mockResultSetHeader(
  affectedRows = 1,
  insertId = 0
): [ResultSetHeader[], unknown] {
  return [
    [
      {
        affectedRows,
        insertId,
        fieldCount: 0,
        info: '',
        serverStatus: 0,
        warningStatus: 0,
        changedRows: 0
      } as ResultSetHeader
    ],
    {}
  ]
}

/**
 * Helper to mock query error
 */
export function mockQueryError(message: string): Error {
  const error = new Error(message)
  error.name = 'MySQLError'
  return error
}
