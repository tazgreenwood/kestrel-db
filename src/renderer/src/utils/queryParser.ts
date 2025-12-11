/**
 * Parse command palette query syntax into SQL WHERE clauses
 *
 * Supported formats:
 * - ?id=1234          → id = 1234
 * - ?name=john        → name = 'john'
 * - ?id>1000          → id > 1000
 * - ?id>=1000         → id >= 1000
 * - ?id<1000          → id < 1000
 * - ?id<=1000         → id <= 1000
 * - ?id!=1000         → id != 1000
 * - ?name*john        → name LIKE '%john%'
 * - ?name^john        → name LIKE 'john%'
 * - ?name$john        → name LIKE '%john'
 *
 * Date helpers:
 * - @now              → NOW()
 * - @today            → CURDATE()
 * - @yesterday        → DATE_SUB(CURDATE(), INTERVAL 1 DAY)
 * - @7d               → DATE_SUB(NOW(), INTERVAL 7 DAY)
 * - @1h               → DATE_SUB(NOW(), INTERVAL 1 HOUR)
 * - @1w               → DATE_SUB(NOW(), INTERVAL 1 WEEK)
 * - @1m               → DATE_SUB(NOW(), INTERVAL 1 MONTH)
 * - @1y               → DATE_SUB(NOW(), INTERVAL 1 YEAR)
 */

/**
 * Convert date helper to SQL expression
 */
function parseDateHelper(value: string): string | null {
  if (!value.startsWith('@')) return null

  const helper = value.slice(1).toLowerCase()

  // Special cases
  if (helper === 'now') return 'NOW()'
  if (helper === 'today') return 'CURDATE()'
  if (helper === 'yesterday') return 'DATE_SUB(CURDATE(), INTERVAL 1 DAY)'

  // Pattern: number + unit (e.g., 7d, 1h, 2w, 3m, 1y)
  const match = helper.match(/^(\d+)(h|d|w|m|y)$/)
  if (!match) return null

  const [, amount, unit] = match
  const unitMap: { [key: string]: string } = {
    h: 'HOUR',
    d: 'DAY',
    w: 'WEEK',
    m: 'MONTH',
    y: 'YEAR'
  }

  const sqlUnit = unitMap[unit]
  if (!sqlUnit) return null

  return `DATE_SUB(NOW(), INTERVAL ${amount} ${sqlUnit})`
}

export interface ParsedQuery {
  isValid: boolean
  whereClause?: string
  error?: string
  preview?: string
}

export interface ColumnInfo {
  name: string
  type: string
}

export function parseQueryCommand(input: string, columns: ColumnInfo[] = []): ParsedQuery {
  // Remove leading ? if present
  const query = input.startsWith('?') ? input.slice(1) : input

  if (!query) {
    return { isValid: false, error: 'Empty query' }
  }

  // Match pattern: column [operator] value
  // Operators: =, >, <, >=, <=, !=, *, ^, $
  const operatorRegex = /^(\w+)(>=|<=|!=|>|<|=|\*|\^|\$)(.+)$/
  const match = query.match(operatorRegex)

  if (!match) {
    return {
      isValid: false,
      error: 'Invalid format. Use: ?column=value or ?column>value'
    }
  }

  const [, column, operator, rawValue] = match
  const value = rawValue.trim()

  // Check for date helper first
  const dateExpression = parseDateHelper(value)
  if (dateExpression) {
    // Date helpers don't need quotes, use the SQL expression directly
    let whereClause: string
    let preview: string

    switch (operator) {
      case '=':
        whereClause = `${column} = ${dateExpression}`
        preview = `WHERE ${column} equals ${value}`
        break
      case '>':
        whereClause = `${column} > ${dateExpression}`
        preview = `WHERE ${column} after ${value}`
        break
      case '<':
        whereClause = `${column} < ${dateExpression}`
        preview = `WHERE ${column} before ${value}`
        break
      case '>=':
        whereClause = `${column} >= ${dateExpression}`
        preview = `WHERE ${column} on or after ${value}`
        break
      case '<=':
        whereClause = `${column} <= ${dateExpression}`
        preview = `WHERE ${column} on or before ${value}`
        break
      case '!=':
        whereClause = `${column} != ${dateExpression}`
        preview = `WHERE ${column} not equal to ${value}`
        break
      default:
        return { isValid: false, error: `Operator ${operator} not supported with date helpers` }
    }

    return {
      isValid: true,
      whereClause,
      preview
    }
  }

  // Find column type
  const columnInfo = columns.find((col) => col.name === column)
  const columnType = columnInfo?.type?.toLowerCase() || ''

  // Check if value is a UUID
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  const isUuid = uuidRegex.test(value)

  // Determine if value should be quoted (strings vs numbers)
  const isNumeric = /^-?\d+(\.\d+)?$/.test(value)

  // Smart value conversion based on column type
  let quotedValue: string
  if (isUuid && columnType.includes('binary')) {
    // Convert UUID to UNHEX for BINARY columns
    const hexValue = value.replace(/-/g, '')
    quotedValue = `UNHEX('${hexValue}')`
  } else if (isNumeric) {
    quotedValue = value
  } else {
    quotedValue = `'${value.replace(/'/g, "''")}'` // Escape single quotes
  }

  let whereClause: string
  let preview: string

  switch (operator) {
    case '=':
      whereClause = `${column} = ${quotedValue}`
      preview = `WHERE ${column} equals ${value}`
      break
    case '>':
      whereClause = `${column} > ${quotedValue}`
      preview = `WHERE ${column} greater than ${value}`
      break
    case '<':
      whereClause = `${column} < ${quotedValue}`
      preview = `WHERE ${column} less than ${value}`
      break
    case '>=':
      whereClause = `${column} >= ${quotedValue}`
      preview = `WHERE ${column} greater than or equal to ${value}`
      break
    case '<=':
      whereClause = `${column} <= ${quotedValue}`
      preview = `WHERE ${column} less than or equal to ${value}`
      break
    case '!=':
      whereClause = `${column} != ${quotedValue}`
      preview = `WHERE ${column} not equal to ${value}`
      break
    case '*':
      // Contains (LIKE %value%)
      whereClause = `${column} LIKE '%${value.replace(/'/g, "''")}%'`
      preview = `WHERE ${column} contains "${value}"`
      break
    case '^':
      // Starts with (LIKE value%)
      whereClause = `${column} LIKE '${value.replace(/'/g, "''")}%'`
      preview = `WHERE ${column} starts with "${value}"`
      break
    case '$':
      // Ends with (LIKE %value)
      whereClause = `${column} LIKE '%${value.replace(/'/g, "''")}'`
      preview = `WHERE ${column} ends with "${value}"`
      break
    default:
      return { isValid: false, error: `Unknown operator: ${operator}` }
  }

  return {
    isValid: true,
    whereClause,
    preview
  }
}

/**
 * Parse multiple query conditions separated by & (AND) or | (OR)
 * Example: ?id>100&name=john → id > 100 AND name = 'john'
 * Example: ?id>100|name=john → id > 100 OR name = 'john'
 * Example: ?id>100&status=active|name=john → (id > 100 AND status = 'active') OR (name = 'john')
 */
export function parseComplexQuery(input: string, columns: ColumnInfo[] = []): ParsedQuery {
  const query = input.startsWith('?') ? input.slice(1) : input

  if (!query) {
    return { isValid: false, error: 'Empty query' }
  }

  // Split by | (OR) first - OR has lower precedence
  const orGroups = query.split('|').map((g) => g.trim())

  const parsedOrGroups: string[] = []
  const previewOrGroups: string[] = []

  for (const orGroup of orGroups) {
    // Split each OR group by & (AND)
    const andConditions = orGroup.split('&').map((c) => c.trim())

    const parsedAndConditions: string[] = []
    const previewAndConditions: string[] = []

    for (const condition of andConditions) {
      const parsed = parseQueryCommand(condition, columns)
      if (!parsed.isValid) {
        return parsed // Return first error
      }
      if (parsed.whereClause && parsed.preview) {
        parsedAndConditions.push(parsed.whereClause)
        previewAndConditions.push(parsed.preview)
      }
    }

    if (parsedAndConditions.length === 0) {
      continue // Skip empty groups
    }

    // If group has multiple conditions, wrap in parentheses
    const groupClause =
      parsedAndConditions.length > 1
        ? `(${parsedAndConditions.join(' AND ')})`
        : parsedAndConditions[0]

    const groupPreview = previewAndConditions.join(' AND ')

    parsedOrGroups.push(groupClause)
    previewOrGroups.push(groupPreview)
  }

  if (parsedOrGroups.length === 0) {
    return { isValid: false, error: 'No valid conditions found' }
  }

  return {
    isValid: true,
    whereClause: parsedOrGroups.join(' OR '),
    preview: previewOrGroups.join(' OR ')
  }
}
