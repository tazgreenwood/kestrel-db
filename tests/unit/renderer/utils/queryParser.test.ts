import { describe, it, expect } from 'vitest'
import {
  parseQueryCommand,
  parseComplexQuery,
  type ColumnInfo
} from '../../../../src/renderer/src/utils/queryParser'

describe('queryParser.ts', () => {
  const mockColumns: ColumnInfo[] = [
    { name: 'id', type: 'int' },
    { name: 'name', type: 'varchar(255)' },
    { name: 'email', type: 'varchar(255)' },
    { name: 'user_id', type: 'binary(16)' },
    { name: 'created_at', type: 'datetime' },
    { name: 'is_active', type: 'tinyint(1)' },
    { name: 'score', type: 'decimal(10,2)' },
    { name: 'status', type: "enum('active','inactive')" }
  ]

  describe('parseQueryCommand - Basic Operators', () => {
    it('should parse equality operator with number', () => {
      const result = parseQueryCommand('id=123', mockColumns)

      expect(result).toEqual({
        isValid: true,
        whereClause: 'id = 123',
        preview: 'WHERE id equals 123'
      })
    })

    it('should parse equality operator with string', () => {
      const result = parseQueryCommand('name=john', mockColumns)

      expect(result).toEqual({
        isValid: true,
        whereClause: "name = 'john'",
        preview: 'WHERE name equals john'
      })
    })

    it('should parse greater than operator', () => {
      const result = parseQueryCommand('id>100', mockColumns)

      expect(result).toEqual({
        isValid: true,
        whereClause: 'id > 100',
        preview: 'WHERE id greater than 100'
      })
    })

    it('should parse less than operator', () => {
      const result = parseQueryCommand('id<1000', mockColumns)

      expect(result).toEqual({
        isValid: true,
        whereClause: 'id < 1000',
        preview: 'WHERE id less than 1000'
      })
    })

    it('should parse greater than or equal operator', () => {
      const result = parseQueryCommand('id>=100', mockColumns)

      expect(result).toEqual({
        isValid: true,
        whereClause: 'id >= 100',
        preview: 'WHERE id greater than or equal to 100'
      })
    })

    it('should parse less than or equal operator', () => {
      const result = parseQueryCommand('id<=1000', mockColumns)

      expect(result).toEqual({
        isValid: true,
        whereClause: 'id <= 1000',
        preview: 'WHERE id less than or equal to 1000'
      })
    })

    it('should parse not equal operator', () => {
      const result = parseQueryCommand('id!=123', mockColumns)

      expect(result).toEqual({
        isValid: true,
        whereClause: 'id != 123',
        preview: 'WHERE id not equal to 123'
      })
    })

    it('should handle query with leading ?', () => {
      const result = parseQueryCommand('?id=123', mockColumns)

      expect(result.isValid).toBe(true)
      expect(result.whereClause).toBe('id = 123')
    })

    it('should handle query without leading ?', () => {
      const result = parseQueryCommand('id=123', mockColumns)

      expect(result.isValid).toBe(true)
      expect(result.whereClause).toBe('id = 123')
    })
  })

  describe('parseQueryCommand - Text Search Operators', () => {
    it('should parse LIKE contains (*) operator', () => {
      const result = parseQueryCommand('name*john', mockColumns)

      expect(result).toEqual({
        isValid: true,
        whereClause: "name LIKE '%john%'",
        preview: 'WHERE name contains "john"'
      })
    })

    it('should parse LIKE starts with (^) operator', () => {
      const result = parseQueryCommand('name^john', mockColumns)

      expect(result).toEqual({
        isValid: true,
        whereClause: "name LIKE 'john%'",
        preview: 'WHERE name starts with "john"'
      })
    })

    it('should parse LIKE ends with ($) operator', () => {
      const result = parseQueryCommand('name$smith', mockColumns)

      expect(result).toEqual({
        isValid: true,
        whereClause: "name LIKE '%smith'",
        preview: 'WHERE name ends with "smith"'
      })
    })
  })

  describe('parseQueryCommand - String Escaping', () => {
    it('should escape single quotes in strings (equality)', () => {
      const result = parseQueryCommand("name=O'Brien", mockColumns)

      expect(result.isValid).toBe(true)
      expect(result.whereClause).toBe("name = 'O''Brien'")
    })

    it('should escape single quotes in LIKE patterns', () => {
      const result = parseQueryCommand("name*O'Brien", mockColumns)

      expect(result.isValid).toBe(true)
      expect(result.whereClause).toBe("name LIKE '%O''Brien%'")
    })

    it('should handle strings with multiple quotes', () => {
      const result = parseQueryCommand("name=it's a'test", mockColumns)

      expect(result.isValid).toBe(true)
      expect(result.whereClause).toBe("name = 'it''s a''test'")
    })
  })

  describe('parseQueryCommand - UUID Handling', () => {
    it('should convert UUID to UNHEX for binary columns', () => {
      const uuid = '550e8400-e29b-41d4-a716-446655440000'
      const result = parseQueryCommand(`user_id=${uuid}`, mockColumns)

      expect(result.isValid).toBe(true)
      expect(result.whereClause).toBe("user_id = UNHEX('550e8400e29b41d4a716446655440000')")
    })

    it('should handle uppercase UUIDs', () => {
      const uuid = '550E8400-E29B-41D4-A716-446655440000'
      const result = parseQueryCommand(`user_id=${uuid}`, mockColumns)

      expect(result.isValid).toBe(true)
      expect(result.whereClause).toContain('UNHEX')
      // UUID is converted to hex (case may vary)
      expect(result.whereClause.toLowerCase()).toContain('550e8400e29b41d4a716446655440000')
    })

    it('should not convert UUIDs for non-binary columns', () => {
      const uuid = '550e8400-e29b-41d4-a716-446655440000'
      const result = parseQueryCommand(`name=${uuid}`, mockColumns)

      expect(result.isValid).toBe(true)
      // Should be treated as regular string, not UNHEX
      expect(result.whereClause).toBe(`name = '${uuid}'`)
      expect(result.whereClause).not.toContain('UNHEX')
    })
  })

  describe('parseQueryCommand - Date Helpers', () => {
    it('should parse @now helper', () => {
      const result = parseQueryCommand('created_at=@now', mockColumns)

      expect(result).toEqual({
        isValid: true,
        whereClause: 'created_at = NOW()',
        preview: 'WHERE created_at equals @now'
      })
    })

    it('should parse @today helper', () => {
      const result = parseQueryCommand('created_at=@today', mockColumns)

      expect(result).toEqual({
        isValid: true,
        whereClause: 'created_at = CURDATE()',
        preview: 'WHERE created_at equals @today'
      })
    })

    it('should parse @yesterday helper', () => {
      const result = parseQueryCommand('created_at=@yesterday', mockColumns)

      expect(result).toEqual({
        isValid: true,
        whereClause: 'created_at = DATE_SUB(CURDATE(), INTERVAL 1 DAY)',
        preview: 'WHERE created_at equals @yesterday'
      })
    })

    it('should parse @7d (7 days ago) helper', () => {
      const result = parseQueryCommand('created_at>@7d', mockColumns)

      expect(result).toEqual({
        isValid: true,
        whereClause: 'created_at > DATE_SUB(NOW(), INTERVAL 7 DAY)',
        preview: 'WHERE created_at after @7d'
      })
    })

    it('should parse @1h (1 hour ago) helper', () => {
      const result = parseQueryCommand('created_at>@1h', mockColumns)

      expect(result).toEqual({
        isValid: true,
        whereClause: 'created_at > DATE_SUB(NOW(), INTERVAL 1 HOUR)',
        preview: 'WHERE created_at after @1h'
      })
    })

    it('should parse @1w (1 week ago) helper', () => {
      const result = parseQueryCommand('created_at>@1w', mockColumns)

      expect(result).toEqual({
        isValid: true,
        whereClause: 'created_at > DATE_SUB(NOW(), INTERVAL 1 WEEK)',
        preview: 'WHERE created_at after @1w'
      })
    })

    it('should parse @1m (1 month ago) helper', () => {
      const result = parseQueryCommand('created_at>@1m', mockColumns)

      expect(result).toEqual({
        isValid: true,
        whereClause: 'created_at > DATE_SUB(NOW(), INTERVAL 1 MONTH)',
        preview: 'WHERE created_at after @1m'
      })
    })

    it('should parse @1y (1 year ago) helper', () => {
      const result = parseQueryCommand('created_at>@1y', mockColumns)

      expect(result).toEqual({
        isValid: true,
        whereClause: 'created_at > DATE_SUB(NOW(), INTERVAL 1 YEAR)',
        preview: 'WHERE created_at after @1y'
      })
    })

    it('should parse date helpers with different operators', () => {
      const testCases = [
        { query: 'created_at<@7d', expected: 'created_at < DATE_SUB(NOW(), INTERVAL 7 DAY)' },
        { query: 'created_at>=@1w', expected: 'created_at >= DATE_SUB(NOW(), INTERVAL 1 WEEK)' },
        { query: 'created_at<=@1m', expected: 'created_at <= DATE_SUB(NOW(), INTERVAL 1 MONTH)' },
        { query: 'created_at!=@today', expected: 'created_at != CURDATE()' }
      ]

      testCases.forEach(({ query, expected }) => {
        const result = parseQueryCommand(query, mockColumns)
        expect(result.isValid).toBe(true)
        expect(result.whereClause).toBe(expected)
      })
    })

    it('should reject text operators with date helpers', () => {
      const result = parseQueryCommand('created_at*@7d', mockColumns)

      expect(result.isValid).toBe(false)
      expect(result.error).toContain('not supported with date helpers')
    })
  })

  describe('parseQueryCommand - Numeric Detection', () => {
    it('should not quote numeric values', () => {
      const result = parseQueryCommand('id=123', mockColumns)

      expect(result.whereClause).toBe('id = 123')
      expect(result.whereClause).not.toContain("'123'")
    })

    it('should not quote decimal numbers', () => {
      const result = parseQueryCommand('score=99.5', mockColumns)

      expect(result.whereClause).toBe('score = 99.5')
    })

    it('should not quote negative numbers', () => {
      const result = parseQueryCommand('score=-10', mockColumns)

      expect(result.whereClause).toBe('score = -10')
    })

    it('should quote non-numeric values', () => {
      const result = parseQueryCommand('status=active', mockColumns)

      expect(result.whereClause).toBe("status = 'active'")
    })
  })

  describe('parseQueryCommand - Error Handling', () => {
    it('should reject empty query', () => {
      const result = parseQueryCommand('', mockColumns)

      expect(result).toEqual({
        isValid: false,
        error: 'Empty query'
      })
    })

    it('should reject empty query with just ?', () => {
      const result = parseQueryCommand('?', mockColumns)

      expect(result).toEqual({
        isValid: false,
        error: 'Empty query'
      })
    })

    it('should reject invalid format', () => {
      const result = parseQueryCommand('invalid syntax', mockColumns)

      expect(result.isValid).toBe(false)
      expect(result.error).toContain('Invalid format')
    })

    it('should reject unknown operator', () => {
      const result = parseQueryCommand('id~123', mockColumns)

      expect(result.isValid).toBe(false)
      expect(result.error).toContain('Invalid format')
    })
  })

  describe('parseComplexQuery - AND Conditions', () => {
    it('should parse simple AND condition', () => {
      const result = parseComplexQuery('id>100&name=john', mockColumns)

      expect(result).toEqual({
        isValid: true,
        whereClause: "(id > 100 AND name = 'john')",
        preview: 'WHERE id greater than 100 AND WHERE name equals john'
      })
    })

    it('should parse multiple AND conditions', () => {
      const result = parseComplexQuery('id>100&name=john&is_active=1', mockColumns)

      expect(result.isValid).toBe(true)
      expect(result.whereClause).toBe("(id > 100 AND name = 'john' AND is_active = 1)")
    })

    it('should handle whitespace around conditions', () => {
      const result = parseComplexQuery(' id>100 & name=john ', mockColumns)

      expect(result.isValid).toBe(true)
      expect(result.whereClause).toContain('id > 100')
      expect(result.whereClause).toContain("name = 'john'")
    })
  })

  describe('parseComplexQuery - OR Conditions', () => {
    it('should parse simple OR condition', () => {
      const result = parseComplexQuery('id>100|name=john', mockColumns)

      expect(result).toEqual({
        isValid: true,
        whereClause: "id > 100 OR name = 'john'",
        preview: 'WHERE id greater than 100 OR WHERE name equals john'
      })
    })

    it('should parse multiple OR conditions', () => {
      const result = parseComplexQuery('id=1|id=2|id=3', mockColumns)

      expect(result.isValid).toBe(true)
      expect(result.whereClause).toBe('id = 1 OR id = 2 OR id = 3')
    })
  })

  describe('parseComplexQuery - Mixed AND/OR with Precedence', () => {
    it('should group AND before OR (AND has higher precedence)', () => {
      const result = parseComplexQuery('id>100&name=john|id<10&name=jane', mockColumns)

      expect(result.isValid).toBe(true)
      // Should be: (id > 100 AND name = 'john') OR (id < 10 AND name = 'jane')
      expect(result.whereClause).toBe("(id > 100 AND name = 'john') OR (id < 10 AND name = 'jane')")
    })

    it('should handle complex precedence', () => {
      const result = parseComplexQuery('id=1&status=active|id=2&status=inactive', mockColumns)

      expect(result.isValid).toBe(true)
      expect(result.whereClause).toBe(
        "(id = 1 AND status = 'active') OR (id = 2 AND status = 'inactive')"
      )
    })

    it('should not add parentheses for single conditions in OR groups', () => {
      const result = parseComplexQuery('id=1|id=2', mockColumns)

      expect(result.whereClause).toBe('id = 1 OR id = 2')
      expect(result.whereClause).not.toContain('(')
    })
  })

  describe('parseComplexQuery - Date Helpers in Complex Queries', () => {
    it('should handle date helpers in AND conditions', () => {
      const result = parseComplexQuery('created_at>@7d&is_active=1', mockColumns)

      expect(result.isValid).toBe(true)
      expect(result.whereClause).toBe(
        '(created_at > DATE_SUB(NOW(), INTERVAL 7 DAY) AND is_active = 1)'
      )
    })

    it('should handle date helpers in OR conditions', () => {
      const result = parseComplexQuery('created_at<@1d|created_at>@30d', mockColumns)

      expect(result.isValid).toBe(true)
      expect(result.whereClause).toContain('DATE_SUB(NOW(), INTERVAL 1 DAY)')
      expect(result.whereClause).toContain('DATE_SUB(NOW(), INTERVAL 30 DAY)')
    })
  })

  describe('parseComplexQuery - UUID in Complex Queries', () => {
    it('should handle UUIDs in complex conditions', () => {
      const uuid = '550e8400-e29b-41d4-a716-446655440000'
      const result = parseComplexQuery(`user_id=${uuid}&is_active=1`, mockColumns)

      expect(result.isValid).toBe(true)
      expect(result.whereClause).toContain('UNHEX')
      expect(result.whereClause).toContain('is_active = 1')
    })
  })

  describe('parseComplexQuery - Error Handling', () => {
    it('should return error from invalid sub-query', () => {
      const result = parseComplexQuery('id>100&invalid syntax', mockColumns)

      expect(result.isValid).toBe(false)
      expect(result.error).toBeDefined()
    })

    it('should handle empty query', () => {
      const result = parseComplexQuery('', mockColumns)

      expect(result).toEqual({
        isValid: false,
        error: 'Empty query'
      })
    })

    it('should propagate errors from first invalid condition', () => {
      const result = parseComplexQuery('&name=john', mockColumns)

      expect(result.isValid).toBe(false)
    })
  })

  describe('Edge Cases', () => {
    it('should handle column names with underscores', () => {
      const result = parseQueryCommand('user_id=123', mockColumns)

      expect(result.isValid).toBe(true)
      expect(result.whereClause).toContain('user_id')
    })

    it('should handle values with spaces', () => {
      const result = parseQueryCommand('name=John Smith', mockColumns)

      expect(result.isValid).toBe(true)
      expect(result.whereClause).toBe("name = 'John Smith'")
    })

    it('should handle empty column list', () => {
      const result = parseQueryCommand('id=123', [])

      expect(result.isValid).toBe(true)
      expect(result.whereClause).toBe('id = 123')
    })

    it('should handle case-sensitive column matching', () => {
      const result = parseQueryCommand('NAME=john', mockColumns)

      // Should still work even if column is lowercase in schema
      expect(result.isValid).toBe(true)
      expect(result.whereClause).toBe("NAME = 'john'")
    })
  })
})
