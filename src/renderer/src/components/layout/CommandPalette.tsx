import React, { useEffect, useRef, useState, useMemo } from 'react'
import {
  Search,
  Database,
  Table,
  CornerDownLeft,
  X,
  Filter,
  History,
  Clock,
  FileDown,
  Copy,
  RefreshCw,
  ListTree,
  Eraser,
  Zap,
  ChevronDown,
  ChevronUp,
  Plus,
  Hash,
  Plug,
  Code
} from 'lucide-react'
import { useDebounce } from 'use-debounce'
import { useAppStore } from '../../store/useAppStore'
import { useSQLStore } from '../../store/useSQLStore'
import { useConnectionsStore, type ConnectionColor } from '../../store/useConnectionsStore'
import { parseComplexQuery } from '../../utils/queryParser'
import { getTableFilterHistory, saveFilterToHistory } from '../../utils/filterHistory'
import { ExportProgressModal } from '../modals/ExportProgressModal'
import kestrelLogo from '@renderer/assets/kestrel-logo.svg'

interface QuickAction {
  id: string
  name: string
  description: string
  icon: React.JSX.Element
  requiresTable: boolean
  requiresData?: boolean
}

interface ConnectionItem {
  id: string
  name: string
  host: string
  user: string
  port: number
  color: ConnectionColor
}

const QUICK_ACTIONS: QuickAction[] = [
  {
    id: 'export-csv',
    name: 'Export as CSV',
    description: 'Export current table data to CSV file',
    icon: <FileDown className="w-4 h-4" />,
    requiresTable: true,
    requiresData: true
  },
  {
    id: 'export-json',
    name: 'Export as JSON',
    description: 'Export current table data to JSON file',
    icon: <FileDown className="w-4 h-4" />,
    requiresTable: true,
    requiresData: true
  },
  {
    id: 'copy-table-name',
    name: 'Copy Table Name',
    description: 'Copy the current table name to clipboard',
    icon: <Copy className="w-4 h-4" />,
    requiresTable: true
  },
  {
    id: 'refresh',
    name: 'Refresh Data',
    description: 'Reload current table data',
    icon: <RefreshCw className="w-4 h-4" />,
    requiresTable: true
  },
  {
    id: 'view-data',
    name: 'View Data',
    description: 'Switch to table data view',
    icon: <Table className="w-4 h-4" />,
    requiresTable: true
  },
  {
    id: 'view-schema',
    name: 'View Structure',
    description: 'Switch to table structure view',
    icon: <ListTree className="w-4 h-4" />,
    requiresTable: true
  },
  {
    id: 'clear-filter',
    name: 'Clear Filter',
    description: 'Remove active filter',
    icon: <Eraser className="w-4 h-4" />,
    requiresTable: true
  },
  {
    id: 'new-connection',
    name: 'New Connection',
    description: 'Connect to a different server',
    icon: <Plus className="w-4 h-4" />,
    requiresTable: false
  },
  {
    id: 'copy-row-count',
    name: 'Copy Row Count',
    description: 'Copy total row count to clipboard',
    icon: <Hash className="w-4 h-4" />,
    requiresTable: true
  },
  {
    id: 'sql-editor',
    name: 'Open SQL Editor',
    description: 'Open SQL query editor',
    icon: <Code className="w-4 h-4" />,
    requiresTable: false
  }
]

const COLOR_MAP: Record<ConnectionColor, string> = {
  red: 'bg-red-500',
  orange: 'bg-orange-500',
  yellow: 'bg-yellow-500',
  green: 'bg-green-500',
  cyan: 'bg-cyan-500',
  blue: 'bg-blue-500',
  purple: 'bg-purple-500',
  pink: 'bg-pink-500',
  gray: 'bg-gray-500'
}

interface CommandPaletteProps {
  isOpen: boolean
  onClose: () => void
  onShowToast?: (message: string, type?: 'success' | 'error') => void
}

// Format bytes to human-readable size
function formatSize(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`
}

// Highlight matching text in search results
function highlightMatch(text: string, search: string): React.JSX.Element {
  if (!search) return <>{text}</>

  const index = text.toLowerCase().indexOf(search.toLowerCase())
  if (index === -1) return <>{text}</>

  return (
    <>
      {text.slice(0, index)}
      <span className="bg-accent-subtle text-accent font-semibold">
        {text.slice(index, index + search.length)}
      </span>
      {text.slice(index + search.length)}
    </>
  )
}

export function CommandPalette({
  isOpen,
  onClose,
  onShowToast
}: CommandPaletteProps): React.JSX.Element | null {
  const availableDatabases = useAppStore((state) => state.availableDatabases)
  const tables = useAppStore((state) => state.tables)
  const currentDb = useAppStore((state) => state.currentDb)
  const disconnect = useAppStore((state) => state.disconnect)
  const activeTable = useAppStore((state) => state.activeTable)
  const tableColumns = useAppStore((state) => state.tableColumns)
  const tableData = useAppStore((state) => state.tableData)
  const totalRows = useAppStore((state) => state.totalRows)
  const isLoading = useAppStore((state) => state.isLoading)
  const commandPaletteInitialSearch = useAppStore((state) => state.commandPaletteInitialSearch)
  const serverName = useAppStore((state) => state.serverName)
  const connectionName = useAppStore((state) => state.connectionName)
  const selectDatabase = useAppStore((state) => state.selectDatabase)
  const selectTable = useAppStore((state) => state.selectTable)
  const setFilter = useAppStore((state) => state.setFilter)
  const setViewMode = useAppStore((state) => state.setViewMode)
  const setConnection = useAppStore((state) => state.setConnection)

  const openDrawer = useSQLStore((state) => state.openDrawer)

  const connections = useConnectionsStore((state) => state.connections)
  const getConnection = useConnectionsStore((state) => state.getConnection)
  const touchConnection = useConnectionsStore((state) => state.touchConnection)

  const [search, setSearch] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [showColumnAutocomplete, setShowColumnAutocomplete] = useState(false)
  const [autocompleteIndex, setAutocompleteIndex] = useState(0)
  const [showQuickReference, setShowQuickReference] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const [exportProgress, setExportProgress] = useState(0)
  const [exportCurrentRow, setExportCurrentRow] = useState(0)
  const [exportFormat, setExportFormat] = useState<'csv' | 'json'>('csv')
  const exportCancelledRef = useRef(false)

  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLDivElement>(null)
  const autocompleteRef = useRef<HTMLDivElement>(null)

  // --- MODE DETERMINATION ---
  type CommandPaletteMode =
    | 'databases'
    | 'tables'
    | 'actions'
    | 'filter'
    | 'filter-history'
    | 'column-autocomplete'
    | 'connections'

  const isQueryCommand = search.startsWith('?')
  const isActionCommand = search.startsWith('/')
  const showDatabases = !currentDb || search.startsWith('>')
  const showConnections = search.startsWith('@')

  // Debounce search to avoid expensive parsing on every keystroke
  const [debouncedSearch] = useDebounce(search, 150)

  // Parse query command with column type information (debounced)
  const parsedQuery = useMemo(
    () =>
      isQueryCommand
        ? parseComplexQuery(
            debouncedSearch,
            tableColumns.map((col) => ({ name: col.name, type: col.type }))
          )
        : null,
    [isQueryCommand, debouncedSearch, tableColumns]
  )

  // Column autocomplete logic - memoized
  const columnSuggestions = useMemo(() => {
    if (!isQueryCommand || !activeTable) return []
    const query = search.slice(1)
    // Split by both & (AND) and | (OR) to get the last condition
    const lastCondition = query.split(/[&|]/).pop() || ''
    const hasOperator = /[=><*^$!]/.test(lastCondition)
    if (hasOperator) return []
    return tableColumns.filter((col) =>
      col.name.toLowerCase().includes(lastCondition.toLowerCase())
    )
  }, [isQueryCommand, activeTable, search, tableColumns])

  const shouldShowAutocomplete = !!(
    isQueryCommand &&
    activeTable &&
    columnSuggestions.length > 0 &&
    !parsedQuery?.isValid
  )

  // Filter history logic - memoized
  const filterHistory = useMemo(
    () => (activeTable ? getTableFilterHistory(activeTable) : []),
    [activeTable]
  )
  const showFilterHistory = search === '?' && filterHistory.length > 0

  // Get current mode - memoized
  const mode = useMemo((): CommandPaletteMode => {
    if (shouldShowAutocomplete) return 'column-autocomplete'
    if (showFilterHistory) return 'filter-history'
    if (isQueryCommand) return 'filter'
    if (isActionCommand) return 'actions'
    if (showConnections) return 'connections'
    if (showDatabases) return 'databases'
    return 'tables'
  }, [
    shouldShowAutocomplete,
    showFilterHistory,
    isQueryCommand,
    isActionCommand,
    showConnections,
    showDatabases
  ])

  // --- FILTERED ITEMS BY MODE --- (all memoized)
  const filteredDbs = useMemo(
    () =>
      availableDatabases
        .filter((dbName) =>
          dbName.toLowerCase().includes(search.replace('>', '').trim().toLowerCase())
        )
        .map((dbName) => ({ id: dbName, name: dbName })),
    [availableDatabases, search]
  )

  const filteredTables = useMemo(
    () => tables.filter((t) => t.name.toLowerCase().includes(search.toLowerCase())),
    [tables, search]
  )

  const filteredActions = useMemo(() => {
    return QUICK_ACTIONS.filter((action) => {
      if (action.requiresTable && !activeTable) return false
      if (action.requiresData && (!tableData || tableData.length === 0)) return false
      const searchTerm = search.slice(1).toLowerCase()
      return (
        action.name.toLowerCase().includes(searchTerm) ||
        action.description.toLowerCase().includes(searchTerm)
      )
    })
  }, [activeTable, tableData, search])

  const filteredConnections = useMemo(() => {
    const searchTerm = search.replace('@', '').trim().toLowerCase()
    const sorted = [...connections].sort((a, b) => b.lastUsed - a.lastUsed)
    return sorted
      .filter(
        (conn) =>
          conn.name.toLowerCase().includes(searchTerm) ||
          conn.host.toLowerCase().includes(searchTerm) ||
          conn.user.toLowerCase().includes(searchTerm)
      )
      .map((conn) => ({
        id: conn.id,
        name: conn.name,
        host: conn.host,
        user: conn.user,
        port: conn.port,
        color: conn.color
      }))
  }, [connections, search])

  // Get current items based on mode - memoized
  const currentItems = useMemo(() => {
    if (mode === 'databases') return filteredDbs
    if (mode === 'tables') return filteredTables
    if (mode === 'actions') return filteredActions
    if (mode === 'connections') return filteredConnections
    return []
  }, [mode, filteredDbs, filteredTables, filteredActions, filteredConnections])

  // Check if we should show the items list (not for filter/column-autocomplete/filter-history modes)
  const showItemsList =
    mode === 'databases' || mode === 'tables' || mode === 'actions' || mode === 'connections'

  // --- EFFECTS ---
  useEffect(() => {
    if (isOpen) {
      // Use initialSearch from store if provided, otherwise empty
      setSearch(commandPaletteInitialSearch || '')
      setSelectedIndex(0)
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [isOpen, commandPaletteInitialSearch])

  useEffect(() => {
    setSelectedIndex(0)
    setAutocompleteIndex(0)
  }, [search, showDatabases])

  // Update autocomplete visibility
  useEffect(() => {
    setShowColumnAutocomplete(shouldShowAutocomplete)
    setAutocompleteIndex(0)
  }, [shouldShowAutocomplete])

  // Auto-scroll logic
  useEffect(() => {
    if (!listRef.current) return
    const activeElement = listRef.current.querySelector(
      `[data-index="${selectedIndex}"]`
    ) as HTMLElement
    if (activeElement) {
      activeElement.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
    }
  }, [selectedIndex])

  const handleColumnSelect = (columnName: string): void => {
    // Get the current query without the ? prefix
    const query = search.slice(1)

    // Find the position of the last condition (after the last & or |)
    const lastSeparatorMatch = query.match(/.*[&|]/)
    const prefix = lastSeparatorMatch ? lastSeparatorMatch[0] : ''

    // Rebuild the search string with the selected column
    setSearch('?' + prefix + columnName)
    setShowColumnAutocomplete(false)
    inputRef.current?.focus()
  }

  const handleActionExecute = (action: QuickAction): void => {
    switch (action.id) {
      case 'export-csv':
        exportTableData('csv')
        onClose()
        break
      case 'export-json':
        exportTableData('json')
        onClose()
        break
      case 'copy-table-name':
        if (activeTable) {
          navigator.clipboard.writeText(activeTable)
          onClose()
          onShowToast?.('Table name copied to clipboard')
        }
        break
      case 'refresh':
        if (activeTable) {
          selectTable(activeTable)
        }
        onClose()
        break
      case 'view-data':
        setViewMode('data')
        onClose()
        break
      case 'view-schema':
        setViewMode('structure')
        onClose()
        break
      case 'clear-filter':
        setFilter(null)
        onClose()
        break
      case 'new-connection':
        disconnect() // Disconnecting will show ConnectionPage
        onClose()
        break
      case 'copy-row-count':
        navigator.clipboard.writeText(totalRows.toLocaleString())
        onClose()
        onShowToast?.('Row count copied to clipboard')
        break
      case 'sql-editor':
        openDrawer()
        onClose()
        break
    }
  }

  const exportTableData = async (format: 'csv' | 'json'): Promise<void> => {
    if (!activeTable || !tableData || tableData.length === 0) return

    // Initialize export state
    exportCancelledRef.current = false
    setIsExporting(true)
    setExportProgress(0)
    setExportCurrentRow(0)
    setExportFormat(format)

    const filename = `${activeTable}_${new Date().toISOString().split('T')[0]}.${format}`
    const totalRows = tableData.length
    const chunkSize = 100 // Process 100 rows at a time

    try {
      if (format === 'csv') {
        // Convert to CSV with progress
        const headers = Object.keys(tableData[0])
        const csvRows: string[] = [headers.join(',')]

        // Process in chunks to allow UI updates
        for (let i = 0; i < totalRows; i += chunkSize) {
          if (exportCancelledRef.current) {
            setIsExporting(false)
            return
          }

          const chunk = tableData.slice(i, Math.min(i + chunkSize, totalRows))
          const chunkRows = chunk.map((row) =>
            headers
              .map((header) => {
                const value = row[header]
                const stringValue = value === null ? '' : String(value)
                // Escape quotes and wrap in quotes if contains comma/quote/newline
                return /[,"\n]/.test(stringValue)
                  ? `"${stringValue.replace(/"/g, '""')}"`
                  : stringValue
              })
              .join(',')
          )
          csvRows.push(...chunkRows)

          // Update progress
          const currentRow = Math.min(i + chunkSize, totalRows)
          setExportCurrentRow(currentRow)
          setExportProgress((currentRow / totalRows) * 100)

          // Allow UI to update
          await new Promise((resolve) => setTimeout(resolve, 0))
        }

        const csvContent = csvRows.join('\n')
        downloadFile(csvContent, filename, 'text/csv')
      } else {
        // Convert to JSON with progress
        const jsonRows: Record<string, unknown>[] = []

        // Process in chunks
        for (let i = 0; i < totalRows; i += chunkSize) {
          if (exportCancelledRef.current) {
            setIsExporting(false)
            return
          }

          const chunk = tableData.slice(i, Math.min(i + chunkSize, totalRows))
          jsonRows.push(...chunk)

          // Update progress
          const currentRow = Math.min(i + chunkSize, totalRows)
          setExportCurrentRow(currentRow)
          setExportProgress((currentRow / totalRows) * 100)

          // Allow UI to update
          await new Promise((resolve) => setTimeout(resolve, 0))
        }

        const jsonContent = JSON.stringify(jsonRows, null, 2)
        downloadFile(jsonContent, filename, 'application/json')
      }

      // Export complete
      setIsExporting(false)
    } catch (error) {
      console.error('Export failed:', error)
      setIsExporting(false)
    }
  }

  const handleCancelExport = (): void => {
    exportCancelledRef.current = true
  }

  const downloadFile = (content: string, filename: string, mimeType: string): void => {
    const blob = new Blob([content], { type: mimeType })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  const handleItemSelection = (): void => {
    if (currentItems.length === 0) return
    const item = currentItems[selectedIndex]

    switch (mode) {
      case 'databases':
        selectDatabase(item.name)
        setSearch('') // Clear the ">" so we instantly see tables
        inputRef.current?.focus()
        break

      case 'tables':
        selectTable(item.name)
        onClose()
        break

      case 'actions':
        handleActionExecute(item as QuickAction)
        break

      case 'connections':
        handleConnectionSwitch((item as ConnectionItem).id)
        break
    }
  }

  const handleConnectionSwitch = async (connectionId: string): Promise<void> => {
    try {
      const conn = connections.find((c) => c.id === connectionId)
      if (!conn) return

      // Load full connection with password
      const fullConn = await getConnection(connectionId)

      // Test connection
      const result = await window.api.db.testConnection({
        host: fullConn.host,
        user: fullConn.user,
        password: fullConn.password || '',
        port: fullConn.port
      })

      if (result.success && result.data) {
        touchConnection(connectionId)
        setConnection(fullConn.host, fullConn.user, result.data, fullConn.name, fullConn.color)
        // Clear search to show database selection mode (don't close palette)
        setSearch('')
        onShowToast?.(`Switched to ${fullConn.name}`)
      } else {
        onShowToast?.(`Connection failed: ${result.error || 'Unknown error'}`, 'error')
      }
    } catch (err) {
      onShowToast?.(`Failed to switch connection: ${String(err)}`, 'error')
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent): void => {
    if (!isOpen) return

    // Handle column autocomplete mode
    if (mode === 'column-autocomplete') {
      if (e.key === 'ArrowDown' || (e.ctrlKey && e.key === 'n')) {
        e.preventDefault()
        setAutocompleteIndex((prev) => (prev + 1) % columnSuggestions.length)
        return
      } else if (e.key === 'ArrowUp' || (e.ctrlKey && e.key === 'p')) {
        e.preventDefault()
        setAutocompleteIndex(
          (prev) => (prev - 1 + columnSuggestions.length) % columnSuggestions.length
        )
        return
      } else if (e.key === 'Enter' || e.key === 'Tab') {
        e.preventDefault()
        handleColumnSelect(columnSuggestions[autocompleteIndex].name)
        return
      } else if (e.key === 'Escape') {
        e.preventDefault()
        setShowColumnAutocomplete(false)
        return
      }
    }

    // Navigation for list modes
    if (e.key === 'ArrowDown' || (e.ctrlKey && e.key === 'n')) {
      e.preventDefault()
      const itemCount = mode === 'filter-history' ? filterHistory.length : currentItems.length
      setSelectedIndex((prev) => (prev + 1) % Math.max(itemCount, 1))
    } else if (e.key === 'ArrowUp' || (e.ctrlKey && e.key === 'p')) {
      e.preventDefault()
      const itemCount = mode === 'filter-history' ? filterHistory.length : currentItems.length
      setSelectedIndex((prev) => (prev - 1 + Math.max(itemCount, 1)) % Math.max(itemCount, 1))
    } else if (e.key === 'Enter') {
      e.preventDefault()

      switch (mode) {
        case 'filter':
          if (parsedQuery?.isValid && activeTable) {
            // Store both the SQL WHERE clause and the original query syntax
            const originalQuery = search.startsWith('?') ? search.slice(1) : search
            setFilter(parsedQuery.whereClause!, originalQuery)
            saveFilterToHistory(activeTable, search)
            onClose()
          }
          break

        case 'filter-history':
          if (filterHistory.length > 0) {
            setSearch(filterHistory[selectedIndex])
          }
          break

        case 'databases':
        case 'tables':
        case 'actions':
        case 'connections':
          handleItemSelection()
          break
      }
    } else if (e.key === 'Escape') {
      e.preventDefault()
      onClose()
    }
  }

  if (!isOpen) return null

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh] bg-overlay backdrop-blur-sm">
        <div className="absolute inset-0" onClick={onClose} />

        <div className="relative w-full max-w-2xl bg-secondary border border-default rounded-xl shadow-2xl overflow-hidden flex flex-col">
          {/* Search Input */}
          <div
            className={`flex items-center px-4 py-4 border-b transition-colors ${
              isQueryCommand && !parsedQuery?.isValid && search.length > 1
                ? 'border-red-500/50 bg-red-500/5'
                : 'border-default'
            }`}
          >
            <Search
              className={`w-5 h-5 mr-3 transition-colors ${
                isQueryCommand && !parsedQuery?.isValid && search.length > 1
                  ? 'text-red-500'
                  : 'text-secondary'
              }`}
            />
            <input
              ref={inputRef}
              type="text"
              className="w-full bg-transparent text-primary text-lg outline-none placeholder-tertiary font-medium"
              placeholder={
                currentDb
                  ? activeTable
                    ? 'Search tables, filter (?), switch DB (>) or connection (@)...'
                    : 'Search tables, switch DB (>) or connection (@)...'
                  : 'Select a database...'
              }
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={handleKeyDown}
              spellCheck={false}
              autoComplete="off"
            />
            <div className="flex items-center gap-2">
              {search === '' && !showDatabases && activeTable && (
                <span className="text-[10px] text-secondary border border-default px-1.5 py-0.5 rounded bg-secondary/50">
                  Type ? to filter
                </span>
              )}
              {search === '' && !showDatabases && !activeTable && (
                <span className="text-[10px] text-secondary border border-default px-1.5 py-0.5 rounded bg-secondary/50">
                  Type &gt; to switch DB
                </span>
              )}
              <button
                onClick={onClose}
                className="text-tertiary hover:text-secondary transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Column Autocomplete Dropdown */}
          {showColumnAutocomplete && columnSuggestions.length > 0 && (
            <div className="border-b border-default bg-primary">
              <div className="px-4 py-2 text-[10px] uppercase text-secondary font-bold tracking-wider">
                Available Columns
              </div>
              <div ref={autocompleteRef} className="max-h-[200px] overflow-y-auto custom-scrollbar">
                {columnSuggestions.map((column, index) => {
                  const isSelected = index === autocompleteIndex
                  // Extract search term for highlighting (same logic as getColumnSuggestions)
                  const query = search.slice(1)
                  const lastCondition = query.split(/[&|]/).pop() || ''
                  return (
                    <button
                      key={column.name}
                      onClick={() => handleColumnSelect(column.name)}
                      onMouseEnter={() => setAutocompleteIndex(index)}
                      className={`w-full flex items-center justify-between px-4 py-2 text-left transition-colors ${
                        isSelected
                          ? 'bg-accent-subtle text-accent'
                          : 'text-secondary hover:bg-secondary'
                      }`}
                    >
                      <span className="font-mono text-sm">
                        {highlightMatch(column.name, lastCondition)}
                      </span>
                      <span className="text-xs text-tertiary font-mono">{column.type}</span>
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {/* Filter History */}
          {showFilterHistory && (
            <div className="border-b border-default bg-primary">
              <div className="px-4 py-2 flex items-center gap-2 text-[10px] uppercase text-secondary font-bold tracking-wider">
                <Clock className="w-3 h-3" />
                Recent Filters
              </div>
              <div className="max-h-[200px] overflow-y-auto custom-scrollbar">
                {filterHistory.map((filter, index) => {
                  const isSelected = index === selectedIndex
                  return (
                    <button
                      key={index}
                      onClick={() => setSearch(filter)}
                      onMouseEnter={() => setSelectedIndex(index)}
                      className={`w-full flex items-center gap-3 px-4 py-2 text-left transition-colors ${
                        isSelected
                          ? 'bg-accent-subtle text-accent'
                          : 'text-secondary hover:bg-secondary'
                      }`}
                    >
                      <History className="w-3 h-3 flex-shrink-0 text-tertiary" />
                      <span className="font-mono text-sm flex-1 truncate">{filter}</span>
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {/* Results List */}
          <div ref={listRef} className="max-h-[60vh] overflow-y-auto custom-scrollbar">
            {/* Query Command Preview */}
            {isQueryCommand && (
              <div className="p-4">
                {!activeTable ? (
                  <div className="p-4 bg-warning-subtle border border-warning rounded-lg text-warning text-sm">
                    <p className="font-medium">No table selected</p>
                    <p className="text-xs text-warning/70 mt-1">
                      Select a table first to filter data
                    </p>
                  </div>
                ) : parsedQuery?.isValid ? (
                  <div className="p-4 bg-accent-subtle border border-accent rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Filter className="w-4 h-4 text-accent" />
                      <span className="text-xs font-bold text-accent uppercase tracking-wider">
                        Filter Query
                      </span>
                    </div>
                    <p className="text-primary text-sm mb-2">{parsedQuery.preview}</p>
                    <div className="bg-primary p-2 rounded font-mono text-xs text-secondary border border-default">
                      <span className="text-tertiary">SQL: </span>
                      SELECT * FROM {activeTable} WHERE {parsedQuery.whereClause}
                    </div>
                    <div className="mt-3 flex items-center gap-2 text-xs text-accent">
                      <CornerDownLeft className="w-3 h-3" />
                      <span>Press Enter to apply filter</span>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg text-sm">
                    <div className="flex items-start gap-2 mb-2">
                      <div className="w-5 h-5 rounded-full bg-red-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-red-400 text-xs font-bold">!</span>
                      </div>
                      <div>
                        <p className="font-medium text-red-400">Invalid query syntax</p>
                        <p className="text-xs text-red-400/70 mt-1">{parsedQuery?.error}</p>
                      </div>
                    </div>
                    <div className="mt-3 pt-3 border-t border-red-500/20 text-xs">
                      <button
                        onClick={() => setShowQuickReference(!showQuickReference)}
                        className="flex items-center gap-2 font-medium text-secondary hover:text-primary transition-colors w-full"
                      >
                        <span>Quick Reference</span>
                        {showQuickReference ? (
                          <ChevronUp className="w-3 h-3" />
                        ) : (
                          <ChevronDown className="w-3 h-3" />
                        )}
                      </button>
                      {showQuickReference && (
                        <div className="grid grid-cols-2 gap-2 mt-2">
                          <div>
                            <p className="text-secondary mb-1 text-[10px] uppercase font-bold">
                              Comparison
                            </p>
                            <ul className="space-y-0.5 text-secondary font-mono">
                              <li>?id=1234</li>
                              <li>?id&gt;1000</li>
                              <li>?price&lt;=50</li>
                            </ul>
                          </div>
                          <div>
                            <p className="text-secondary mb-1 text-[10px] uppercase font-bold">
                              Text Search
                            </p>
                            <ul className="space-y-0.5 text-secondary font-mono">
                              <li>?name*john</li>
                              <li>?email^admin</li>
                              <li>?url$\.com</li>
                            </ul>
                          </div>
                          <div>
                            <p className="text-secondary mb-1 text-[10px] uppercase font-bold">
                              Dates
                            </p>
                            <ul className="space-y-0.5 text-secondary font-mono">
                              <li>?date&gt;@today</li>
                              <li>?created&lt;@7d</li>
                              <li>?time&gt;@1h</li>
                            </ul>
                          </div>
                          <div>
                            <p className="text-secondary mb-1 text-[10px] uppercase font-bold">
                              Multiple
                            </p>
                            <ul className="space-y-0.5 text-secondary font-mono">
                              <li>?status=active</li>
                              <li>&amp;age&gt;18</li>
                            </ul>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Show Loading Skeletons if fetching tables */}
            {!isQueryCommand && isLoading && !showDatabases && tables.length === 0 && (
              <div className="p-2 space-y-1 animate-pulse">
                {[...Array(5)].map((_, i) => (
                  <div
                    key={i}
                    className="px-4 py-3 rounded-lg bg-tertiary/50 flex items-center gap-3"
                  >
                    <div className="w-4 h-4 bg-tertiary rounded" />
                    <div className="flex-1 space-y-2">
                      <div className="h-3 bg-tertiary rounded w-3/4" />
                      <div className="h-2 bg-tertiary/50 rounded w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Section Header */}
            {showItemsList && !isLoading && currentItems.length > 0 && (
              <div className="px-4 py-2 flex items-center gap-2 text-[10px] uppercase text-secondary font-bold tracking-wider">
                {mode === 'databases' && 'Available Databases'}
                {mode === 'tables' && (
                  <span>
                    Tables in <span className="text-database">{currentDb}</span>
                  </span>
                )}
                {mode === 'actions' && (
                  <>
                    <Zap className="w-3 h-3" />
                    Quick Actions
                  </>
                )}
                {mode === 'connections' && (
                  <>
                    <Plug className="w-3 h-3" />
                    Switch Connection
                  </>
                )}
              </div>
            )}

            {/* Unified Items Rendering */}
            {showItemsList &&
              currentItems.map((item, index) => {
                const isSelected = index === selectedIndex
                const baseClasses =
                  'w-full flex items-center px-4 py-3 border-l-2 transition-all text-left cursor-pointer'
                const activeClasses = isSelected
                  ? 'bg-accent-subtle border-accent text-white'
                  : 'border-transparent text-primary hover:bg-tertiary/50'

                return (
                  <button
                    key={mode === 'actions' ? (item as QuickAction).id : item.name}
                    data-index={index}
                    onClick={() => handleItemSelection()}
                    onMouseEnter={() => setSelectedIndex(index)}
                    className={`${baseClasses} ${activeClasses}`}
                  >
                    {/* Icon */}
                    {mode === 'databases' && (
                      <Database
                        className={`w-4 h-4 mr-3 ${isSelected ? 'text-database' : 'text-database/60'}`}
                      />
                    )}
                    {mode === 'tables' && (
                      <Table
                        className={`w-4 h-4 mr-3 ${isSelected ? 'text-accent' : 'text-tertiary'}`}
                      />
                    )}
                    {mode === 'actions' && (
                      <span className={`mr-3 ${isSelected ? 'text-accent' : 'text-tertiary'}`}>
                        {(item as QuickAction).icon}
                      </span>
                    )}
                    {mode === 'connections' && (
                      <div
                        className={`w-2 h-2 rounded-full mr-3 ${COLOR_MAP[(item as ConnectionItem).color || 'gray']}`}
                      />
                    )}

                    {/* Content */}
                    {mode === 'actions' ? (
                      <div className="flex-1">
                        <div className="text-sm font-medium">
                          {highlightMatch(item.name, search.slice(1))}
                        </div>
                        <div className="text-xs text-secondary">
                          {(item as QuickAction).description}
                        </div>
                      </div>
                    ) : mode === 'connections' ? (
                      <div className="flex-1">
                        <div className="text-sm font-medium">
                          {highlightMatch(item.name, search.replace('@', '').trim())}
                        </div>
                        <div className="text-xs text-tertiary">
                          {(item as ConnectionItem).user}@{(item as ConnectionItem).host}:
                          {(item as ConnectionItem).port}
                        </div>
                      </div>
                    ) : (
                      <span className={`font-medium ${mode === 'tables' && 'font-mono text-sm'}`}>
                        {mode === 'databases'
                          ? highlightMatch(item.name, search.replace('>', '').trim())
                          : highlightMatch(item.name, search)}
                      </span>
                    )}

                    {/* Right side info */}
                    {mode === 'actions' && isSelected && (
                      <CornerDownLeft className="w-3 h-3 text-tertiary" />
                    )}
                    {mode === 'databases' && isSelected && (
                      <span className="ml-auto text-xs flex items-center gap-2 opacity-100">
                        Switch Scope <CornerDownLeft className="w-3 h-3" />
                      </span>
                    )}
                    {mode === 'connections' && (
                      <span className="ml-auto text-xs">
                        {(connectionName === item.name ||
                          serverName === (item as ConnectionItem).host) && (
                          <span className="text-accent">Active</span>
                        )}
                        {isSelected &&
                          !(
                            connectionName === item.name ||
                            serverName === (item as ConnectionItem).host
                          ) && <CornerDownLeft className="w-3 h-3 text-tertiary" />}
                      </span>
                    )}
                    {mode === 'tables' && (
                      <span
                        className={`ml-auto text-xs flex items-center gap-3 transition-opacity ${
                          isSelected ? 'opacity-100' : 'opacity-50 text-tertiary'
                        }`}
                      >
                        <span className="text-secondary">{item.rows.toLocaleString()} rows</span>
                        <span className="text-tertiary">
                          {formatSize((item.dataSize || 0) + (item.indexSize || 0))}
                        </span>
                      </span>
                    )}
                  </button>
                )
              })}

            {/* No Results */}
            {showItemsList && !isLoading && currentItems.length === 0 && (
              <div className="p-8 text-center text-tertiary text-sm">
                {mode === 'actions' && !activeTable ? (
                  <div>
                    <p className="mb-1">Select a table first</p>
                    <p className="text-xs text-tertiary">Most actions require an active table</p>
                  </div>
                ) : (
                  <p>
                    No results found for &quot;
                    <span className="text-secondary">{search}</span>&quot;
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Footer - Contextual Hints */}
          <div className="bg-primary px-4 py-2 flex items-center justify-between border-t border-default text-xs text-tertiary">
            <div className="flex gap-3">
              {showColumnAutocomplete ? (
                // Autocomplete mode
                <>
                  <span>
                    <strong className="text-secondary">↑↓</strong> Navigate
                  </span>
                  <span>
                    <strong className="text-secondary">↵ Tab</strong> Select column
                  </span>
                  <span>
                    <strong className="text-secondary">Esc</strong> Cancel
                  </span>
                </>
              ) : isActionCommand ? (
                // Action mode
                <>
                  <span>
                    <strong className="text-secondary">↑↓</strong> Navigate
                  </span>
                  <span>
                    <strong className="text-secondary">↵</strong> Execute action
                  </span>
                  <span className="text-secondary">
                    Actions: <strong className="text-secondary">export, copy, refresh</strong>
                  </span>
                </>
              ) : isQueryCommand ? (
                // Filter mode
                <>
                  <span className="text-secondary">
                    Operators: <strong className="text-secondary">= &gt; &lt; * ^ $</strong>
                  </span>
                  <span className="text-secondary">
                    Dates: <strong className="text-secondary">@today @7d @1h</strong>
                  </span>
                  <span className="text-secondary">
                    Logic: <strong className="text-secondary">&amp; (AND) | (OR)</strong>
                  </span>
                </>
              ) : showDatabases ? (
                // Database switching mode
                <>
                  <span>
                    <strong className="text-secondary">↑↓</strong> Navigate
                  </span>
                  <span>
                    <strong className="text-secondary">↵</strong> Switch database
                  </span>
                  <span>
                    <strong className="text-secondary">Esc</strong> Close
                  </span>
                </>
              ) : (
                // Default mode
                <>
                  <span>
                    <strong className="text-secondary">↑↓</strong> Navigate
                  </span>
                  <span>
                    <strong className="text-secondary">↵</strong> Select
                  </span>
                  {activeTable ? (
                    <>
                      <span className="text-secondary">
                        <strong className="text-secondary">?</strong> Filter
                      </span>
                      <span className="text-secondary">
                        <strong className="text-secondary">/</strong> Actions
                      </span>
                    </>
                  ) : (
                    <span className="text-secondary">
                      <strong className="text-secondary">&gt;</strong> Switch DB
                    </span>
                  )}
                  <span>
                    <strong className="text-secondary">Esc</strong> Close
                  </span>
                </>
              )}
            </div>
            <div className="flex items-center gap-1">
              <img src={kestrelLogo} alt="Kestrel" className="w-4 h-4" />
              <span>Kestrel</span>
            </div>
          </div>
        </div>
      </div>

      {/* Export Progress Modal */}
      <ExportProgressModal
        isOpen={isExporting}
        progress={exportProgress}
        currentRow={exportCurrentRow}
        totalRows={tableData.length}
        format={exportFormat}
        onCancel={handleCancelExport}
      />
    </>
  )
}
