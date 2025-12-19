/**
 * Manage filter history in localStorage
 */

const STORAGE_KEY = 'kestrel_filter_history'
const MAX_HISTORY_PER_TABLE = 10

interface FilterHistory {
  [tableName: string]: string[] // Array of recent filter queries
}

/**
 * Get filter history from localStorage
 */
export function getFilterHistory(): FilterHistory {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    return stored ? JSON.parse(stored) : {}
  } catch {
    return {}
  }
}

/**
 * Get recent filters for a specific table
 */
export function getTableFilterHistory(tableName: string): string[] {
  const history = getFilterHistory()
  return history[tableName] || []
}

/**
 * Save a filter to history for a table
 */
export function saveFilterToHistory(tableName: string, filter: string): void {
  if (!filter || !tableName) return

  const history = getFilterHistory()
  const tableHistory = history[tableName] || []

  // Remove if already exists (to move it to top)
  const filtered = tableHistory.filter((f) => f !== filter)

  // Add to beginning
  filtered.unshift(filter)

  // Limit to MAX_HISTORY_PER_TABLE
  history[tableName] = filtered.slice(0, MAX_HISTORY_PER_TABLE)

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(history))
  } catch (error) {
    console.error('Failed to save filter history:', error)
  }
}

/**
 * Clear history for a specific table
 */
export function clearTableFilterHistory(tableName: string): void {
  const history = getFilterHistory()
  delete history[tableName]

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(history))
  } catch (error) {
    console.error('Failed to clear filter history:', error)
  }
}

/**
 * Clear all filter history
 */
export function clearAllFilterHistory(): void {
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch (error) {
    console.error('Failed to clear all filter history:', error)
  }
}
