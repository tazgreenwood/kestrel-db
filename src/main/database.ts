import mysql from 'mysql2/promise'

export interface DbCredentials {
  host: string
  user: string
  password: string
  port?: number
}

export interface TableInfo {
  name: string
  rows: number
  dataSize: number // in bytes
  indexSize: number // in bytes
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

interface AppState {
  pool: mysql.Pool | null
  currentDatabase: string | null
  currentCreds: DbCredentials | null
}

// Multi-window state management
const windowStates = new Map<number, AppState>()

/**
 * Get or create state for a specific window
 */
function getWindowState(windowId: number): AppState {
  if (!windowStates.has(windowId)) {
    windowStates.set(windowId, {
      pool: null,
      currentDatabase: null,
      currentCreds: null
    })
  }
  return windowStates.get(windowId)!
}

/**
 * Clean up state for a window when it closes
 */
export async function cleanupWindow(windowId: number): Promise<void> {
  const state = windowStates.get(windowId)
  if (state?.pool) {
    try {
      await state.pool.end()
    } catch (error) {
      console.warn(`Error closing pool for window ${windowId}:`, error)
    }
  }
  windowStates.delete(windowId)
  console.log(`Cleaned up state for window ${windowId}`)
}

/**
 * Test connection and return list of available databases
 */
export async function testConnection(windowId: number, creds: DbCredentials): Promise<string[]> {
  const state = getWindowState(windowId)

  // Close existing pool if any
  if (state.pool) {
    try {
      await state.pool.end()
    } catch (error) {
      // Pool might already be closed, ignore the error
      console.warn('Error closing existing pool:', error)
    } finally {
      // Always set to null to prevent reuse of closed pool
      state.pool = null
      state.currentDatabase = null
    }
  }

  try {
    // Create connection pool
    state.pool = mysql.createPool({
      host: creds.host,
      user: creds.user,
      password: creds.password,
      port: creds.port || 3306,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
      enableKeepAlive: true,
      keepAliveInitialDelay: 0
    })

    // Test the pool by getting databases
    const [rows] = await state.pool.query<mysql.RowDataPacket[]>('SHOW DATABASES')
    const databases = rows.map((row) => row.Database as string)

    // Store credentials for later use
    state.currentCreds = creds

    return databases
  } catch (error) {
    // Clean up pool on error
    if (state.pool) {
      try {
        await state.pool.end()
      } catch (endError) {
        // Ignore errors when cleaning up
        console.warn('Error cleaning up pool:', endError)
      } finally {
        state.pool = null
      }
    }
    throw new Error(`Connection failed: ${error instanceof Error ? error.message : String(error)}`)
  }
}

/**
 * Select a database using USE command (instant with connection pooling)
 */
export async function selectDatabase(windowId: number, dbName: string): Promise<boolean> {
  const state = getWindowState(windowId)

  if (!state.pool) {
    throw new Error('No active connection pool. Please connect first.')
  }

  // Ensure connection is healthy
  const isHealthy = await ensureConnection(windowId)
  if (!isHealthy) {
    throw new Error('Database connection is not healthy. Please reconnect.')
  }

  try {
    // Use the database (much faster than creating new connection)
    await state.pool.query(`USE \`${dbName}\``)
    state.currentDatabase = dbName
    return true
  } catch (error) {
    throw new Error(
      `Failed to select database: ${error instanceof Error ? error.message : String(error)}`
    )
  }
}

/**
 * Get list of tables in the current database with metadata
 */
export async function getTables(windowId: number): Promise<TableInfo[]> {
  const state = getWindowState(windowId)

  if (!state.pool) {
    throw new Error('No active database connection')
  }

  // Ensure connection is healthy
  const isHealthy = await ensureConnection(windowId)
  if (!isHealthy) {
    throw new Error('Database connection is not healthy. Please reconnect.')
  }

  try {
    // Use SHOW TABLE STATUS to get table metadata including row counts and sizes
    const [rows] = await state.pool.query<mysql.RowDataPacket[]>('SHOW TABLE STATUS')

    const tables = rows.map((row) => ({
      name: row.Name as string,
      rows: (row.Rows as number) || 0,
      dataSize: (row.Data_length as number) || 0,
      indexSize: (row.Index_length as number) || 0
    }))

    return tables
  } catch (error) {
    throw new Error(
      `Failed to get tables: ${error instanceof Error ? error.message : String(error)}`
    )
  }
}

/**
 * Get column information for a specific table
 */
export async function getTableColumns(windowId: number, tableName: string): Promise<ColumnInfo[]> {
  const state = getWindowState(windowId)

  if (!state.pool) {
    throw new Error('No active database connection')
  }

  // Ensure connection is healthy
  const isHealthy = await ensureConnection(windowId)
  if (!isHealthy) {
    throw new Error('Database connection is not healthy. Please reconnect.')
  }

  try {
    const escapedTable = state.pool.escapeId(tableName)
    const [rows] = await state.pool.query<mysql.RowDataPacket[]>(
      `SHOW COLUMNS FROM ${escapedTable}`
    )

    return rows.map((row) => ({
      name: row.Field as string,
      type: row.Type as string,
      nullable: row.Null === 'YES',
      key: row.Key as string,
      default: row.Default as string | null,
      extra: row.Extra as string
    }))
  } catch (error) {
    throw new Error(
      `Failed to get columns: ${error instanceof Error ? error.message : String(error)}`
    )
  }
}

/**
 * Get complete table structure including columns and indexes
 */
export async function getTableStructure(
  windowId: number,
  tableName: string
): Promise<TableStructure> {
  const state = getWindowState(windowId)

  if (!state.pool) {
    throw new Error('No active database connection')
  }

  // Ensure connection is healthy
  const isHealthy = await ensureConnection(windowId)
  if (!isHealthy) {
    throw new Error('Database connection is not healthy. Please reconnect.')
  }

  try {
    const escapedTable = state.pool.escapeId(tableName)

    // Get columns
    const columns = await getTableColumns(windowId, tableName)

    // Get indexes
    const [indexRows] = await state.pool.query<mysql.RowDataPacket[]>(
      `SHOW INDEX FROM ${escapedTable}`
    )

    // Group indexes by name
    const indexMap = new Map<string, IndexInfo>()
    for (const row of indexRows) {
      const indexName = row.Key_name as string
      if (!indexMap.has(indexName)) {
        indexMap.set(indexName, {
          name: indexName,
          columnName: row.Column_name as string,
          unique: row.Non_unique === 0,
          primary: indexName === 'PRIMARY',
          type: row.Index_type as string
        })
      }
    }

    return {
      columns,
      indexes: Array.from(indexMap.values())
    }
  } catch (error) {
    throw new Error(
      `Failed to get table structure: ${error instanceof Error ? error.message : String(error)}`
    )
  }
}

/**
 * Convert a Buffer to UUID string format if it's 16 bytes
 */
function bufferToUuid(buffer: Buffer): string {
  const hex = buffer.toString('hex')
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20, 32)}`
}

/**
 * Check if a column name suggests it contains a UUID
 */
function isUuidColumn(columnName: string): boolean {
  const lower = columnName.toLowerCase()
  return lower.includes('uuid') || lower.endsWith('_id') || lower === 'id'
}

/**
 * Serialize database values for JSON transmission
 * Handles: Buffers (UUIDs, hex), Dates (ISO strings), BigInt, etc.
 */
function serializeValue(value: any, columnName: string): any {
  // Handle null/undefined
  if (value === null || value === undefined) {
    return value
  }

  // Handle Buffers (binary data)
  if (Buffer.isBuffer(value)) {
    // If it's 16 bytes and looks like a UUID column, convert to UUID format
    if (value.length === 16 && isUuidColumn(columnName)) {
      return bufferToUuid(value)
    }
    // Otherwise, convert to hex string
    return '0x' + value.toString('hex')
  }

  // Handle Dates
  if (value instanceof Date) {
    // Check if date is valid (MySQL sometimes returns invalid dates like 0000-00-00)
    if (isNaN(value.getTime())) {
      return null
    }
    try {
      return value.toISOString()
    } catch (error) {
      // If toISOString() fails for any reason, return null
      return null
    }
  }

  // Handle BigInt
  if (typeof value === 'bigint') {
    return value.toString()
  }

  // Return everything else as-is
  return value
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
  data: any[]
  totalCount: number
  hasMore: boolean
}

/**
 * Verify the connection pool is healthy and database is selected
 * Helps recover from timeout-related connection issues
 */
async function ensureConnection(windowId: number): Promise<boolean> {
  const state = getWindowState(windowId)

  if (!state.pool) {
    return false
  }

  try {
    // Quick health check - if this fails, connection is dead
    await state.pool.query('SELECT 1')

    // Verify database is still selected if we had one
    if (state.currentDatabase) {
      await state.pool.query(`USE \`${state.currentDatabase}\``)
    }

    return true
  } catch (error) {
    console.warn('Connection health check failed:', error)
    return false
  }
}

/**
 * Execute a query with optional timeout
 * Uses MySQL's built-in timeout to properly cancel queries
 */
async function queryWithTimeout<T>(
  windowId: number,
  query: string,
  timeoutSeconds: number
): Promise<T> {
  const state = getWindowState(windowId)

  if (!state.pool) {
    throw new Error('No active database connection')
  }

  // Verify connection is healthy before executing query
  const isHealthy = await ensureConnection(windowId)
  if (!isHealthy) {
    throw new Error('Database connection is not healthy. Please reconnect.')
  }

  try {
    // Use MySQL's built-in timeout mechanism
    // This properly cancels the query on the server side
    const queryOptions = {
      sql: query,
      timeout: timeoutSeconds === 0 ? undefined : timeoutSeconds * 1000 // Convert to milliseconds
    }

    const [rows] = await state.pool.query(queryOptions)
    return rows as T
  } catch (error: any) {
    // MySQL timeout errors have a specific code
    if (error.code === 'PROTOCOL_SEQUENCE_TIMEOUT' || error.sqlState === 'HY000') {
      throw new Error(`Query timeout: exceeded ${timeoutSeconds} seconds`)
    }
    throw error
  }
}

/**
 * Get total row count for a table with optional WHERE clause
 */
export async function getTableRowCount(
  windowId: number,
  tableName: string,
  whereClause?: string,
  timeout: number = 0
): Promise<number> {
  const state = getWindowState(windowId)

  if (!state.pool) {
    throw new Error('No active database connection')
  }

  try {
    const escapedTable = state.pool.escapeId(tableName)
    let query = `SELECT COUNT(*) as count FROM ${escapedTable}`

    if (whereClause) {
      query += ` WHERE ${whereClause}`
    }

    const rows = await queryWithTimeout<mysql.RowDataPacket[]>(windowId, query, timeout)
    return rows[0].count as number
  } catch (error) {
    throw new Error(
      `Failed to count rows: ${error instanceof Error ? error.message : String(error)}`
    )
  }
}

/**
 * Query a table with advanced options
 *
 * Security notes:
 * - Table names and column names are escaped using connection.escapeId()
 * - orderDirection is validated to only allow 'ASC' or 'DESC'
 * - whereClause is generated by queryParser.ts which escapes user input
 * - LIMIT and OFFSET are coerced to numbers
 */
export async function queryTable(
  windowId: number,
  tableName: string,
  options: QueryOptions = {}
): Promise<QueryResult> {
  const state = getWindowState(windowId)

  if (!state.pool) {
    throw new Error('No active database connection')
  }

  const {
    limit = 100,
    offset = 0,
    orderBy,
    orderDirection = 'ASC',
    whereClause,
    timeout = 0
  } = options

  try {
    // Validate orderDirection to prevent SQL injection
    const validDirection = orderDirection.toUpperCase()
    if (validDirection !== 'ASC' && validDirection !== 'DESC') {
      throw new Error(`Invalid order direction: ${orderDirection}. Must be ASC or DESC.`)
    }

    // Validate numeric parameters
    const safeLimit = Math.max(1, Math.min(10000, Number(limit) || 100))
    const safeOffset = Math.max(0, Number(offset) || 0)

    // Get total count with timeout
    const totalCount = await getTableRowCount(windowId, tableName, whereClause, timeout)

    // Build query
    const escapedTable = state.pool.escapeId(tableName)
    let query = `SELECT * FROM ${escapedTable}`

    // Add WHERE clause (generated by queryParser.ts which handles escaping)
    if (whereClause) {
      query += ` WHERE ${whereClause}`
    }

    // Add ORDER BY
    if (orderBy) {
      const escapedColumn = state.pool.escapeId(orderBy)
      query += ` ORDER BY ${escapedColumn} ${validDirection}`
    }

    // Add LIMIT and OFFSET (using safe numeric values)
    query += ` LIMIT ${safeLimit} OFFSET ${safeOffset}`

    // Execute query with timeout
    const rows = await queryWithTimeout<any[]>(windowId, query, timeout)

    // Serialize each row to handle Buffers, Dates, etc.
    const data = rows.map((row) => {
      const serialized: any = {}
      for (const [key, value] of Object.entries(row)) {
        serialized[key] = serializeValue(value, key)
      }
      return serialized
    })

    return {
      data,
      totalCount,
      hasMore: offset + data.length < totalCount
    }
  } catch (error) {
    throw new Error(
      `Failed to query table: ${error instanceof Error ? error.message : String(error)}`
    )
  }
}

export interface QueryExecutionResult {
  data: any[]
  fields: string[]
  rowCount: number
  executionTime: number
}

/**
 * Execute a raw SQL query and return results
 *
 * Security note: This function executes raw SQL from user input.
 * It relies on MySQL's permission system for security - users can only
 * execute queries they have permissions for. No additional escaping is needed
 * as we're passing the query directly to MySQL which handles it safely.
 */
export async function executeQuery(
  windowId: number,
  query: string,
  timeout: number = 30
): Promise<QueryExecutionResult> {
  const state = getWindowState(windowId)

  if (!state.pool) {
    throw new Error('No active database connection')
  }

  if (!query || !query.trim()) {
    throw new Error('Query cannot be empty')
  }

  const startTime = Date.now()

  try {
    // Execute the query with timeout
    const rows = await queryWithTimeout<any[]>(windowId, query.trim(), timeout)
    const executionTime = (Date.now() - startTime) / 1000 // Convert to seconds

    // If no rows returned (e.g., INSERT, UPDATE, DELETE), return empty result
    if (!Array.isArray(rows) || rows.length === 0) {
      return {
        data: [],
        fields: [],
        rowCount: 0,
        executionTime
      }
    }

    // Get field names from first row
    const fields = Object.keys(rows[0])

    // Serialize each row to handle Buffers, Dates, etc.
    const data = rows.map((row) => {
      const serialized: any = {}
      for (const [key, value] of Object.entries(row)) {
        serialized[key] = serializeValue(value, key)
      }
      return serialized
    })

    return {
      data,
      fields,
      rowCount: data.length,
      executionTime
    }
  } catch (error) {
    throw new Error(
      `Query execution failed: ${error instanceof Error ? error.message : String(error)}`
    )
  }
}

/**
 * Disconnect from database
 */
export async function disconnect(windowId: number): Promise<void> {
  const state = getWindowState(windowId)

  if (state.pool) {
    try {
      await state.pool.end()
    } catch (error) {
      // Pool might already be closed, log but don't throw
      console.warn('Error disconnecting pool:', error)
    } finally {
      state.pool = null
    }
  }
  state.currentDatabase = null
  state.currentCreds = null
}

/**
 * Get current connection state
 */
export function getConnectionState(windowId: number): {
  isConnected: boolean
  hasCredentials: boolean
} {
  const state = getWindowState(windowId)

  return {
    isConnected: state.pool !== null,
    hasCredentials: state.currentCreds !== null
  }
}

export interface TableSchema {
  tableName: string
  columns: ColumnInfo[]
}

/**
 * Get schema information for all tables in the current database
 * Useful for SQL autocomplete
 */
export async function getAllTableSchemas(windowId: number): Promise<TableSchema[]> {
  const state = getWindowState(windowId)

  if (!state.pool) {
    throw new Error('No active database connection')
  }

  if (!state.currentDatabase) {
    throw new Error('No database selected')
  }

  // Ensure connection is healthy
  const isHealthy = await ensureConnection(windowId)
  if (!isHealthy) {
    throw new Error('Database connection is not healthy. Please reconnect.')
  }

  try {
    // Get all tables
    const tables = await getTables(windowId)

    // Fetch columns for each table in parallel
    const schemaPromises = tables.map(async (table) => {
      const columns = await getTableColumns(windowId, table.name)
      return {
        tableName: table.name,
        columns
      }
    })

    return await Promise.all(schemaPromises)
  } catch (error) {
    throw new Error(
      `Failed to get table schemas: ${error instanceof Error ? error.message : String(error)}`
    )
  }
}
