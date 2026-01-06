import type { ColumnInfo, TableInfo } from '../../src/preload/index'
import type { RowDataPacket } from 'mysql2/promise'

/**
 * Mock database credentials
 */
export const mockCredentials = {
  host: 'localhost',
  user: 'testuser',
  password: 'testpass',
  port: 3306
}

/**
 * Mock database list
 */
export const mockDatabases = ['testdb', 'users_db', 'analytics_db']

/**
 * Mock table information
 */
export const mockTables: TableInfo[] = [
  {
    name: 'users',
    rows: 1500,
    dataSize: 65536,
    indexSize: 16384
  },
  {
    name: 'orders',
    rows: 5000,
    dataSize: 131072,
    indexSize: 32768
  },
  {
    name: 'products',
    rows: 250,
    dataSize: 32768,
    indexSize: 8192
  }
]

/**
 * Mock column information for users table
 */
export const mockUsersColumns: ColumnInfo[] = [
  {
    name: 'id',
    type: 'int',
    nullable: false,
    key: 'PRI',
    default: null,
    extra: 'auto_increment'
  },
  {
    name: 'user_id',
    type: 'binary(16)',
    nullable: false,
    key: 'UNI',
    default: null,
    extra: ''
  },
  {
    name: 'username',
    type: 'varchar(255)',
    nullable: false,
    key: '',
    default: null,
    extra: ''
  },
  {
    name: 'email',
    type: 'varchar(255)',
    nullable: false,
    key: 'UNI',
    default: null,
    extra: ''
  },
  {
    name: 'created_at',
    type: 'datetime',
    nullable: false,
    key: '',
    default: 'CURRENT_TIMESTAMP',
    extra: ''
  },
  {
    name: 'is_active',
    type: 'tinyint(1)',
    nullable: false,
    key: '',
    default: '1',
    extra: ''
  }
]

/**
 * Mock table data for users table
 */
export const mockUsersData: Record<string, unknown>[] = [
  {
    id: 1,
    user_id: Buffer.from('0123456789abcdef'),
    username: 'john_doe',
    email: 'john@example.com',
    created_at: new Date('2024-01-01T10:00:00Z'),
    is_active: 1
  },
  {
    id: 2,
    user_id: Buffer.from('fedcba9876543210'),
    username: "jane_o'brien",
    email: 'jane@example.com',
    created_at: new Date('2024-01-02T11:30:00Z'),
    is_active: 1
  },
  {
    id: 3,
    user_id: Buffer.from('1111222233334444'),
    username: 'bob_smith',
    email: 'bob@example.com',
    created_at: new Date('2024-01-03T09:15:00Z'),
    is_active: 0
  }
]

/**
 * Mock column information for orders table
 */
export const mockOrdersColumns: ColumnInfo[] = [
  {
    name: 'id',
    type: 'int',
    nullable: false,
    key: 'PRI',
    default: null,
    extra: 'auto_increment'
  },
  {
    name: 'order_number',
    type: 'varchar(50)',
    nullable: false,
    key: 'UNI',
    default: null,
    extra: ''
  },
  {
    name: 'user_id',
    type: 'int',
    nullable: false,
    key: 'MUL',
    default: null,
    extra: ''
  },
  {
    name: 'total_amount',
    type: 'decimal(10,2)',
    nullable: false,
    key: '',
    default: null,
    extra: ''
  },
  {
    name: 'status',
    type: "enum('pending','processing','completed','cancelled')",
    nullable: false,
    key: '',
    default: 'pending',
    extra: ''
  },
  {
    name: 'created_at',
    type: 'datetime',
    nullable: false,
    key: '',
    default: 'CURRENT_TIMESTAMP',
    extra: ''
  }
]

/**
 * Mock SHOW TABLE STATUS results
 */
export const mockTableStatusResults: RowDataPacket[] = mockTables.map((table) => ({
  Name: table.name,
  Rows: table.rows,
  Data_length: table.dataSize,
  Index_length: table.indexSize,
  Engine: 'InnoDB',
  Collation: 'utf8mb4_unicode_ci'
})) as RowDataPacket[]

/**
 * Mock SHOW COLUMNS results for users table
 */
export const mockShowColumnsResults: RowDataPacket[] = mockUsersColumns.map((col) => ({
  Field: col.name,
  Type: col.type,
  Null: col.nullable ? 'YES' : 'NO',
  Key: col.key,
  Default: col.default,
  Extra: col.extra
})) as RowDataPacket[]

/**
 * Mock saved connections
 */
export const mockSavedConnections = [
  {
    id: 'localhost:3306:root',
    name: 'Local MySQL',
    host: 'localhost',
    user: 'root',
    port: 3306,
    color: 'blue' as const,
    tags: ['local', 'development'],
    createdAt: '2024-01-01T10:00:00Z',
    lastUsed: '2024-01-10T15:30:00Z'
  },
  {
    id: 'prod-db.example.com:3306:admin',
    name: 'Production DB',
    host: 'prod-db.example.com',
    user: 'admin',
    port: 3306,
    color: 'red' as const,
    tags: ['production', 'important'],
    createdAt: '2024-01-05T09:00:00Z',
    lastUsed: '2024-01-09T14:20:00Z'
  }
]

/**
 * Mock saved SQL queries
 */
export const mockSavedQueries = [
  {
    id: '1704110400000-abc123',
    name: 'Active Users',
    query: 'SELECT * FROM users WHERE is_active = 1',
    createdAt: '2024-01-01T10:00:00Z',
    tags: ['users', 'active']
  },
  {
    id: '1704196800000-def456',
    name: 'Recent Orders',
    query:
      'SELECT * FROM orders WHERE created_at > DATE_SUB(NOW(), INTERVAL 7 DAY) ORDER BY created_at DESC',
    createdAt: '2024-01-02T10:00:00Z',
    tags: ['orders', 'recent']
  }
]

/**
 * Mock query history
 */
export const mockQueryHistory = [
  {
    id: '1704283200000-1',
    query: 'SELECT COUNT(*) FROM users',
    executedAt: '2024-01-03T10:00:00Z',
    executionTime: 15,
    rowCount: 1,
    error: null
  },
  {
    id: '1704283260000-2',
    query: 'SELECT * FROM orders LIMIT 10',
    executedAt: '2024-01-03T10:01:00Z',
    executionTime: 42,
    rowCount: 10,
    error: null
  },
  {
    id: '1704283320000-3',
    query: 'SELECT * FROM invalid_table',
    executedAt: '2024-01-03T10:02:00Z',
    executionTime: 5,
    rowCount: 0,
    error: "Table 'testdb.invalid_table' doesn't exist"
  }
]

/**
 * Large dataset for testing virtualization and pagination
 */
export function generateLargeDataset(count: number): Record<string, unknown>[] {
  return Array.from({ length: count }, (_, i) => ({
    id: i + 1,
    name: `User ${i + 1}`,
    email: `user${i + 1}@example.com`,
    score: Math.floor(Math.random() * 100),
    created_at: new Date(2024, 0, 1 + (i % 365))
  }))
}
