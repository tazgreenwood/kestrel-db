import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  createColumnHelper
} from '@tanstack/react-table'
import { useVirtualizer } from '@tanstack/react-virtual'
import { useMemo, useState, useRef, useEffect, useCallback, memo } from 'react'
import throttle from 'lodash.throttle'
import {
  Database,
  FileJson,
  Hash,
  Calendar,
  ChevronUp,
  ChevronDown,
  Loader2,
  Filter,
  X,
  Table,
  ListTree
} from 'lucide-react'
import { CellDetailModal } from './CellDetailModal'
import { Toast } from '../ui/Toast'
import { useAppStore } from '../../store/useAppStore'
import { useSettingsStore } from '../../store/useSettingsStore'

interface DataGridProps {
  data: any[]
  tableName: string
  isLoading?: boolean
  totalRows?: number // Override totalRows from store (for custom queries)
  hasMore?: boolean // Override hasMore from store (for custom queries)
}

interface CellPosition {
  rowIndex: number
  colIndex: number
  value: any
}

export function DataGrid({
  data,
  tableName,
  isLoading,
  totalRows: totalRowsProp,
  hasMore: hasMoreProp
}: DataGridProps) {
  const [selectedCellPos, setSelectedCellPos] = useState<CellPosition | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [showCopyToast, setShowCopyToast] = useState(false)
  const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set())
  const [lastSelectedRow, setLastSelectedRow] = useState<number | null>(null)
  const [columnWidths, setColumnWidths] = useState<Record<string, number>>({})
  const [_resizingColumn, setResizingColumn] = useState<string | null>(null)
  const [elapsedTime, setElapsedTime] = useState<number>(0)
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const selectedCellPosRef = useRef<CellPosition | null>(null)
  const selectedRowsRef = useRef<Set<number>>(new Set())
  const rowsRef = useRef<any[]>([])
  const {
    sortState,
    hasMore: hasMoreFromStore,
    isLoadingMore,
    totalRows: totalRowsFromStore,
    whereClause,
    originalQuery,
    tableColumns,
    tables,
    viewMode,
    isLoading: isQueryLoading,
    queryStartTime,
    queryDuration,
    loadMoreRows,
    setSort,
    clearSort,
    setFilter,
    setViewMode,
    openCommandPalette,
    cancelQuery
  } = useAppStore()

  // Get display settings
  const { showDataTypeColors, dateFormat, numberFormat } = useSettingsStore()

  // Use prop values if provided (for custom queries), otherwise use store values
  const totalRows = totalRowsProp !== undefined ? totalRowsProp : totalRowsFromStore
  const hasMore = hasMoreProp !== undefined ? hasMoreProp : hasMoreFromStore

  // Get metadata for the current table
  const tableMetadata = useMemo(() => {
    return tables.find((t) => t.name === tableName)
  }, [tables, tableName])

  // Format bytes to human-readable size
  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`
  }

  // Create a map of column names to types for quick lookup
  const columnTypeMap = useMemo(() => {
    const map = new Map<string, string>()
    tableColumns.forEach((col) => map.set(col.name, col.type))
    return map
  }, [tableColumns])

  // Memoize column helper (only created once)
  const columnHelper = useMemo(() => createColumnHelper<any>(), [])

  // Memoize columns based on column names, not entire data array
  const columns = useMemo(() => {
    if (!data || data.length === 0) return []

    const firstRow = data[0]
    const keys = Object.keys(firstRow).filter((k) => {
      if (typeof k !== 'string') return false
      if (k === '') return false
      return true
    })

    return keys.map((key) =>
      columnHelper.accessor(key, {
        header: key,
        cell: (info) => info.getValue()
      })
    )
  }, [data.length > 0 ? Object.keys(data[0]).join(',') : '', columnHelper])

  // Calculate minimum width needed for header (text + icons + padding + resize handle)
  const calculateMinHeaderWidth = (headerText: string): number => {
    // Header text (8px per char) + icon (12px) + sort arrows (24px) + padding (32px) + resize handle (8px)
    return headerText.length * 8 + 12 + 24 + 32 + 8
  }

  // Calculate initial column widths based on content
  useEffect(() => {
    if (!data || data.length === 0) return

    const widths: Record<string, number> = {}
    const sampleSize = Math.min(100, data.length) // Sample first 100 rows for performance
    const firstRow = data[0]
    const keys = Object.keys(firstRow)

    keys.forEach((key) => {
      // Start with header width as minimum
      const minHeaderWidth = calculateMinHeaderWidth(key)
      let maxWidth = minHeaderWidth

      // Check content in sample rows
      for (let i = 0; i < sampleSize; i++) {
        const value = data[i][key]
        const stringValue = value === null ? 'NULL' : String(value)
        const contentWidth = stringValue.length * 7 + 32 // Roughly 7px per char in mono font

        maxWidth = Math.max(maxWidth, contentWidth)
      }

      // Apply max constraint (min is already applied via minHeaderWidth)
      widths[key] = Math.min(500, maxWidth)
    })

    setColumnWidths(widths)
  }, [data.length > 0 ? Object.keys(data[0]).join(',') : ''])

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel()
  })

  const { rows } = table.getRowModel()

  // Virtualization setup
  const rowVirtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => scrollContainerRef.current,
    estimateSize: () => 41, // Estimated row height in pixels (py-2 = 8px top/bottom + content)
    overscan: 10 // Render 10 extra rows above/below viewport for smoother scrolling
  })

  const virtualRows = rowVirtualizer.getVirtualItems()
  const totalSize = rowVirtualizer.getTotalSize()

  // Handle scroll for infinite loading (throttled to 200ms)
  useEffect(() => {
    const container = scrollContainerRef.current
    if (!container) return

    const handleScroll = throttle(
      () => {
        const { scrollTop, scrollHeight, clientHeight } = container
        const scrollPercentage = (scrollTop + clientHeight) / scrollHeight

        // Load more when scrolled 80% down
        if (scrollPercentage > 0.8 && hasMore && !isLoadingMore) {
          loadMoreRows()
        }
      },
      200,
      { leading: true, trailing: true }
    )

    container.addEventListener('scroll', handleScroll)
    return () => {
      handleScroll.cancel()
      container.removeEventListener('scroll', handleScroll)
    }
  }, [hasMore, isLoadingMore, loadMoreRows])

  // Update elapsed time while query is running
  useEffect(() => {
    if (!queryStartTime) {
      setElapsedTime(0)
      return
    }

    const interval = setInterval(() => {
      setElapsedTime(Date.now() - queryStartTime)
    }, 100)

    return () => clearInterval(interval)
  }, [queryStartTime])

  // Handle column resizing
  const [resizeState, setResizeState] = useState<{
    columnId: string
    startX: number
    startWidth: number
  } | null>(null)

  useEffect(() => {
    if (!resizeState) return

    // Prevent text selection while resizing
    document.body.style.userSelect = 'none'
    document.body.style.cursor = 'col-resize'

    const handleMouseMove = (e: MouseEvent) => {
      const deltaX = e.clientX - resizeState.startX
      const minWidth = calculateMinHeaderWidth(resizeState.columnId)
      const newWidth = Math.max(minWidth, resizeState.startWidth + deltaX)

      setColumnWidths((prev) => ({
        ...prev,
        [resizeState.columnId]: newWidth
      }))
    }

    const handleMouseUp = () => {
      setResizeState(null)
      setResizingColumn(null)
      document.body.style.userSelect = ''
      document.body.style.cursor = ''
    }

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)

    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
      document.body.style.userSelect = ''
      document.body.style.cursor = ''
    }
  }, [resizeState])

  // Sync refs with state
  useEffect(() => {
    selectedCellPosRef.current = selectedCellPos
  }, [selectedCellPos])

  useEffect(() => {
    selectedRowsRef.current = selectedRows
  }, [selectedRows])

  useEffect(() => {
    rowsRef.current = rows
  }, [rows])

  // Handle keyboard shortcuts (single listener, no memory leak)
  useEffect(() => {
    let lastGPressTime = 0 // Track 'g' key press for 'gg' sequence

    const handleKeyDown = (e: KeyboardEvent) => {
      const cellPos = selectedCellPosRef.current
      const selectedRowIndices = selectedRowsRef.current
      const currentRows = rowsRef.current

      // Don't handle navigation if user is typing in an input/textarea or Monaco editor
      const target = e.target as HTMLElement
      const activeElement = document.activeElement as HTMLElement
      const isInMonaco =
        activeElement?.closest('.monaco-editor') !== null ||
        activeElement?.closest('[class*="monaco"]') !== null ||
        target.closest('.monaco-editor') !== null ||
        target.closest('[class*="monaco"]') !== null
      const isTyping = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || isInMonaco

      // Shift+Enter: Open modal (only if cell is selected)
      if (cellPos && e.shiftKey && e.key === 'Enter') {
        e.preventDefault()
        setIsModalOpen(true)
      }

      // Cmd+C / Ctrl+C: Copy to clipboard
      if ((e.metaKey || e.ctrlKey) && e.key === 'c') {
        e.preventDefault()

        // If rows are selected, copy them as TSV
        if (selectedRowIndices.size > 0) {
          const sortedIndices = Array.from(selectedRowIndices).sort((a, b) => a - b)
          // Get the actual row data from TanStack Table rows
          const selectedRowsData = sortedIndices
            .map((idx) => currentRows[idx]?.original)
            .filter((row) => row != null)

          if (selectedRowsData.length > 0) {
            // Get column names
            const columns = Object.keys(selectedRowsData[0])

            // Build TSV: header + rows
            const header = columns.join('\t')
            const rowsText = selectedRowsData
              .map((row) =>
                columns
                  .map((col) => {
                    const value = row[col]
                    return value === null ? 'NULL' : String(value)
                  })
                  .join('\t')
              )
              .join('\n')

            const tsvText = `${header}\n${rowsText}`
            navigator.clipboard.writeText(tsvText)
            setShowCopyToast(true)
          }
        } else if (cellPos) {
          // If only a cell is selected, copy the cell value
          const value = cellPos.value
          const textValue = value === null ? 'NULL' : String(value)
          navigator.clipboard.writeText(textValue)
          setShowCopyToast(true)
        }
      }

      // Grid navigation shortcuts (vim keys + arrows)
      if (!isTyping && currentRows.length > 0 && columns.length > 0) {
        const numRows = currentRows.length
        const numCols = columns.length

        // Helper to move cell selection
        const moveCell = (newRow: number, newCol: number) => {
          // Clamp to grid boundaries (stay at edge, don't wrap)
          const clampedRow = Math.max(0, Math.min(numRows - 1, newRow))
          const clampedCol = Math.max(0, Math.min(numCols - 1, newCol))

          const row = currentRows[clampedRow]
          const cells = row.getVisibleCells()
          const cell = cells[clampedCol]
          const value = cell?.getValue()

          setSelectedCellPos({ rowIndex: clampedRow, colIndex: clampedCol, value })

          // Scroll to keep cell visible (vertical)
          setTimeout(() => {
            rowVirtualizer.scrollToIndex(clampedRow, { align: 'auto' })
          }, 0)

          // Scroll to keep cell visible (horizontal)
          if (scrollContainerRef.current && cell) {
            const container = scrollContainerRef.current
            const cellElement = container.querySelector(
              `tbody tr:nth-child(${clampedRow + 2}) td:nth-child(${clampedCol + 2})`
            ) as HTMLElement

            if (cellElement) {
              const containerRect = container.getBoundingClientRect()
              const cellRect = cellElement.getBoundingClientRect()

              // Check if cell is out of view horizontally
              if (cellRect.left < containerRect.left) {
                // Scroll left
                container.scrollLeft += cellRect.left - containerRect.left - 20
              } else if (cellRect.right > containerRect.right) {
                // Scroll right
                container.scrollLeft += cellRect.right - containerRect.right + 20
              }
            }
          }
        }

        // Initialize cell position if not set (start at 0,0)
        if (!cellPos && !e.metaKey && !e.ctrlKey) {
          if (
            ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'h', 'j', 'k', 'l'].includes(e.key)
          ) {
            e.preventDefault()
            moveCell(0, 0)
            return
          }
        }

        if (cellPos) {
          const currentRow = cellPos.rowIndex
          const currentCol = cellPos.colIndex

          // Arrow keys and vim navigation (h/j/k/l)
          if (e.key === 'ArrowLeft' || e.key === 'h') {
            e.preventDefault()
            moveCell(currentRow, currentCol - 1)
          } else if (e.key === 'ArrowDown' || e.key === 'j') {
            e.preventDefault()
            moveCell(currentRow + 1, currentCol)
          } else if (e.key === 'ArrowUp' || e.key === 'k') {
            e.preventDefault()
            moveCell(currentRow - 1, currentCol)
          } else if (e.key === 'ArrowRight' || e.key === 'l') {
            e.preventDefault()
            moveCell(currentRow, currentCol + 1)
          }
          // Home or 0: Jump to first column
          else if (e.key === 'Home' || e.key === '0') {
            e.preventDefault()
            moveCell(currentRow, 0)
          }
          // End or $: Jump to last column
          else if (e.key === 'End' || (e.shiftKey && e.key === '$')) {
            e.preventDefault()
            moveCell(currentRow, numCols - 1)
          }
          // G (Shift+g): Jump to last row
          else if (e.shiftKey && e.key === 'G') {
            e.preventDefault()
            moveCell(numRows - 1, currentCol)
          }
          // Ctrl+D: Page down
          else if (e.ctrlKey && e.key === 'd') {
            e.preventDefault()
            // Calculate page size from virtualizer range (visible rows)
            const visibleRowCount =
              rowVirtualizer.range?.endIndex && rowVirtualizer.range?.startIndex
                ? rowVirtualizer.range.endIndex - rowVirtualizer.range.startIndex
                : 20
            moveCell(currentRow + visibleRowCount, currentCol)
          }
          // Ctrl+U: Page up
          else if (e.ctrlKey && e.key === 'u') {
            e.preventDefault()
            // Calculate page size from virtualizer range (visible rows)
            const visibleRowCount =
              rowVirtualizer.range?.endIndex && rowVirtualizer.range?.startIndex
                ? rowVirtualizer.range.endIndex - rowVirtualizer.range.startIndex
                : 20
            moveCell(currentRow - visibleRowCount, currentCol)
          }
        }

        // gg: Jump to first row (two-key sequence)
        if (e.key === 'g' && !e.metaKey && !e.ctrlKey && !e.shiftKey) {
          e.preventDefault()
          const now = Date.now()
          if (now - lastGPressTime < 500) {
            // Second 'g' within 500ms - trigger jump to first row
            const currentCol = cellPos?.colIndex || 0
            moveCell(0, currentCol)
            lastGPressTime = 0 // Reset
          } else {
            // First 'g' press
            lastGPressTime = now
          }
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [columns, rowVirtualizer]) // Add dependencies for navigation

  const handleSortAsc = useCallback(
    (columnId: string, e: React.MouseEvent) => {
      e.stopPropagation()
      // Toggle: if already sorted ASC, clear sort; otherwise sort ASC
      if (sortState.column === columnId && sortState.direction === 'ASC') {
        clearSort()
      } else {
        setSort(columnId, 'ASC')
      }
    },
    [setSort, clearSort, sortState]
  )

  const handleSortDesc = useCallback(
    (columnId: string, e: React.MouseEvent) => {
      e.stopPropagation()
      // Toggle: if already sorted DESC, clear sort; otherwise sort DESC
      if (sortState.column === columnId && sortState.direction === 'DESC') {
        clearSort()
      } else {
        setSort(columnId, 'DESC')
      }
    },
    [setSort, clearSort, sortState]
  )

  const handleRowSelection = useCallback(
    (rowIndex: number, e: React.MouseEvent) => {
      e.stopPropagation()

      if (e.shiftKey && lastSelectedRow !== null) {
        // Shift+Click: Select range
        const start = Math.min(lastSelectedRow, rowIndex)
        const end = Math.max(lastSelectedRow, rowIndex)
        const newSelection = new Set<number>()
        for (let i = start; i <= end; i++) {
          newSelection.add(i)
        }
        setSelectedRows(newSelection)
        setSelectedCellPos(null) // Clear cell selection
      } else {
        // Regular click: Toggle single row
        const newSelection = new Set(selectedRows)
        if (newSelection.has(rowIndex)) {
          newSelection.delete(rowIndex)
          setLastSelectedRow(null)
        } else {
          newSelection.clear() // Only one row at a time unless shift-clicking
          newSelection.add(rowIndex)
          setLastSelectedRow(rowIndex)
        }
        setSelectedRows(newSelection)
        setSelectedCellPos(null) // Clear cell selection
      }
    },
    [lastSelectedRow, selectedRows]
  )

  if (isLoading) {
    return (
      <div className="h-full w-full flex flex-col bg-primary animate-pulse">
        {/* Fake Header with Cancel Button */}
        <div className="h-14 border-b border-default bg-secondary/50 flex items-center px-6 justify-between">
          <div className="flex items-center gap-4">
            <div className="h-4 w-32 bg-tertiary rounded"></div>
            {/* Elapsed Time */}
            {queryStartTime && (
              <div className="flex items-center gap-2 text-xs text-secondary animate-none">
                <Loader2 className="w-3 h-3 animate-spin" />
                <span>{(elapsedTime / 1000).toFixed(1)}s</span>
              </div>
            )}
          </div>

          {/* Cancel Query Button */}
          {isQueryLoading && (
            <button
              onClick={cancelQuery}
              className="flex items-center gap-2 px-3 py-1.5 bg-error-subtle border border-error rounded text-xs text-error hover:bg-red-500/20 hover:text-red-300 transition-colors animate-none"
              title="Cancel query"
            >
              <X className="w-3 h-3" />
              <span>Cancel Query</span>
            </button>
          )}
        </div>
        {/* Fake Rows */}
        <div className="p-4 space-y-4">
          {[...Array(15)].map((_, i) => (
            <div key={i} className="flex gap-4">
              <div className="h-4 w-12 bg-secondary rounded"></div>
              <div className="h-4 w-48 bg-secondary rounded"></div>
              <div className="h-4 w-24 bg-secondary rounded"></div>
              <div className="h-4 w-full bg-secondary rounded"></div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (!data || data.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-secondary">
        <Database className="w-12 h-12 mb-4 opacity-20" />
        {whereClause ? (
          <div className="text-center space-y-3">
            <p className="text-secondary">No results found</p>
            <div className="flex items-center gap-2 px-3 py-2 bg-accent-subtle border border-accent rounded">
              <Filter className="w-3 h-3 text-accent" />
              <span className="text-accent font-mono text-sm">{whereClause}</span>
            </div>
            <button
              onClick={() => setFilter(null)}
              className="text-sm text-accent hover:text-accent-hover underline"
            >
              Clear filter
            </button>
          </div>
        ) : (
          <p>Table is empty</p>
        )}
      </div>
    )
  }

  return (
    <>
      <div className="h-full w-full flex flex-col bg-primary">
        {/* Toolbar */}
        <div className="h-14 border-b border-default bg-secondary/50 flex items-center px-6 justify-between shrink-0 backdrop-blur-sm">
          <div className="flex items-center gap-4">
            {/* View Mode Buttons */}
            <div className="flex items-center gap-1">
              <button
                onClick={() => setViewMode('data')}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded text-xs font-medium transition-colors ${
                  viewMode === 'data'
                    ? 'bg-accent-subtle text-accent border border-accent'
                    : 'text-secondary hover:text-primary hover:bg-tertiary'
                }`}
              >
                <Table className="w-3.5 h-3.5" />
                <span>Data</span>
              </button>
              <button
                onClick={() => setViewMode('structure')}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded text-xs font-medium transition-colors ${
                  viewMode === 'structure'
                    ? 'bg-accent-subtle text-accent border border-accent'
                    : 'text-secondary hover:text-primary hover:bg-tertiary'
                }`}
              >
                <ListTree className="w-3.5 h-3.5" />
                <span>Structure</span>
              </button>
            </div>

            {/* Divider */}
            <div className="h-6 w-px bg-border-default" />

            {/* Table Info */}
            <div className="flex items-center gap-3">
              <h2 className="font-mono font-bold text-primary text-sm">{tableName}</h2>
              <div className="flex items-center gap-2">
                <span className="text-xs text-tertiary">
                  {data.length.toLocaleString()} of {totalRows.toLocaleString()}{' '}
                  {totalRows === 1 ? 'row' : 'rows'}
                  {hasMore && <span className="text-tertiary ml-1">(loading...)</span>}
                </span>
                {tableMetadata && (tableMetadata.dataSize > 0 || tableMetadata.indexSize > 0) && (
                  <>
                    <span className="text-tertiary">•</span>
                    <span className="text-xs text-tertiary" title="Data + Index size">
                      {formatBytes(tableMetadata.dataSize + tableMetadata.indexSize)}
                    </span>
                  </>
                )}
                {queryDuration !== null && (
                  <>
                    <span className="text-tertiary">•</span>
                    <span className="text-xs text-tertiary" title="Query execution time">
                      {(queryDuration / 1000).toFixed(2)}s
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Cancel Query Button */}
          {isQueryLoading && (
            <button
              onClick={cancelQuery}
              className="flex items-center gap-2 px-3 py-1.5 bg-error-subtle border border-error rounded text-xs text-error hover:bg-red-500/20 hover:text-red-300 transition-colors"
              title="Cancel query"
            >
              <X className="w-3 h-3" />
              <span>Cancel Query</span>
            </button>
          )}

          {/* Active Filter Badge */}
          {whereClause && !isQueryLoading && (
            <div className="flex items-center gap-1.5 px-2 py-1 bg-accent-subtle border border-accent rounded text-xs">
              <Filter className="w-3 h-3 text-accent" />
              <button
                onClick={() => openCommandPalette('?' + (originalQuery || whereClause))}
                className="text-accent font-mono hover:text-accent-hover transition-colors"
                title="Edit filter"
              >
                {whereClause}
              </button>
              <button
                onClick={() => setFilter(null)}
                className="ml-1 text-accent hover:text-accent-hover transition-colors"
                title="Clear filter"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          )}
        </div>

        {/* Table */}
        <div ref={scrollContainerRef} className="flex-1 overflow-auto custom-scrollbar">
          <table className="w-full text-left border-collapse" style={{ tableLayout: 'fixed' }}>
            <thead className="sticky top-0 z-10 bg-secondary shadow-sm">
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id}>
                  <th className="w-12 px-4 py-3 text-[10px] uppercase text-secondary font-bold border-b border-default border-r border-default bg-secondary text-center select-none">
                    #
                  </th>
                  {headerGroup.headers.map((header) => (
                    <th
                      key={header.id}
                      className="px-4 py-3 text-[10px] uppercase text-secondary font-bold tracking-wider border-b border-default border-r border-default last:border-r-0 whitespace-nowrap bg-secondary hover:bg-tertiary transition-colors select-none relative"
                      style={{ width: columnWidths[header.id] || 150 }}
                    >
                      <div className="flex items-start justify-between gap-3">
                        {/* Block 1: Column Info */}
                        <div className="flex flex-col gap-0.5">
                          <div className="flex items-center gap-2">
                            {header.id.includes('id') && <Hash className="w-3 h-3 text-tertiary" />}
                            {header.id.includes('_at') && (
                              <Calendar className="w-3 h-3 text-tertiary" />
                            )}
                            {flexRender(header.column.columnDef.header, header.getContext())}
                          </div>
                          {/* Column Type */}
                          {columnTypeMap.has(header.id) && (
                            <span className="text-[9px] text-tertiary font-normal lowercase">
                              {columnTypeMap.get(header.id)}
                            </span>
                          )}
                        </div>

                        {/* Block 2: Sort Arrows */}
                        <div className="flex flex-col gap-0.5">
                          <button
                            onClick={(e) => handleSortAsc(header.id, e)}
                            className={`transition-colors cursor-pointer ${
                              sortState.column === header.id && sortState.direction === 'ASC'
                                ? 'text-accent'
                                : 'text-tertiary hover:text-accent'
                            }`}
                          >
                            <ChevronUp className="w-3 h-3" />
                          </button>
                          <button
                            onClick={(e) => handleSortDesc(header.id, e)}
                            className={`transition-colors cursor-pointer ${
                              sortState.column === header.id && sortState.direction === 'DESC'
                                ? 'text-accent'
                                : 'text-tertiary hover:text-accent'
                            }`}
                          >
                            <ChevronDown className="w-3 h-3" />
                          </button>
                        </div>
                      </div>

                      {/* Resize Handle */}
                      <div
                        className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-accent transition-colors group/resize"
                        onMouseDown={(e) => {
                          e.stopPropagation()
                          e.preventDefault()
                          setResizingColumn(header.id)
                          setResizeState({
                            columnId: header.id,
                            startX: e.clientX,
                            startWidth: columnWidths[header.id] || 150
                          })
                        }}
                      >
                        <div className="absolute inset-y-0 -left-1 -right-1" />
                      </div>
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody
              style={{
                fontSize: 'var(--font-size-data)',
                fontFamily: 'var(--font-family-data)'
              }}
            >
              {/* Top padding to push visible rows to correct scroll position */}
              {virtualRows.length > 0 && (
                <tr style={{ height: `${virtualRows[0].start}px` }}>
                  <td></td>
                </tr>
              )}

              {virtualRows.map((virtualRow) => {
                const row = rows[virtualRow.index]
                const index = virtualRow.index
                const isRowSelected = selectedRows.has(index)
                return (
                  <tr
                    key={row.id}
                    className={`group hover:bg-white/5 border-l-2 transition-colors border-b border-default ${
                      isRowSelected
                        ? 'bg-accent-subtle border-l-accent'
                        : 'border-l-transparent hover:border-l-accent'
                    }`}
                  >
                    <td
                      onClick={(e) => handleRowSelection(index, e)}
                      className="w-12 px-4 py-2 text-tertiary border-r border-subtle text-xs text-center select-none cursor-pointer hover:text-accent hover:bg-tertiary transition-colors"
                    >
                      {index + 1}
                    </td>
                    {row.getVisibleCells().map((cell, colIndex) => {
                      const isSelected =
                        selectedCellPos?.rowIndex === index &&
                        selectedCellPos?.colIndex === colIndex
                      return (
                        <td
                          key={cell.id}
                          onClick={() => {
                            setSelectedCellPos({
                              rowIndex: index,
                              colIndex,
                              value: cell.getValue()
                            })
                            setSelectedRows(new Set()) // Clear row selection
                          }}
                          className={`px-4 py-2 border-r border-subtle last:border-r-0 max-w-[300px] overflow-hidden truncate cursor-pointer hover:text-primary ${
                            isSelected ? 'bg-accent-subtle ring-1 ring-accent' : ''
                          }`}
                        >
                          <CellRenderer
                            value={cell.getValue()}
                            showDataTypeColors={showDataTypeColors}
                            dateFormat={dateFormat}
                            numberFormat={numberFormat}
                          />
                        </td>
                      )
                    })}
                  </tr>
                )
              })}

              {/* Bottom padding to maintain scroll height */}
              {virtualRows.length > 0 && (
                <tr
                  style={{
                    height: `${totalSize - (virtualRows[virtualRows.length - 1]?.end || 0)}px`
                  }}
                >
                  <td></td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Loading More Indicator - Fixed at bottom, centered horizontally */}
        {isLoadingMore && (
          <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50">
            <div className="bg-secondary border border-default rounded-lg shadow-2xl px-6 py-3 flex items-center gap-3">
              <Loader2 className="w-4 h-4 animate-spin text-accent" />
              <span className="text-sm text-primary">Loading more rows...</span>
            </div>
          </div>
        )}
      </div>

      {/* Modal Render */}
      {isModalOpen && selectedCellPos && (
        <CellDetailModal value={selectedCellPos.value} onClose={() => setIsModalOpen(false)} />
      )}

      {/* Copy Toast */}
      {showCopyToast && (
        <Toast message="Copied to clipboard" onClose={() => setShowCopyToast(false)} />
      )}
    </>
  )
}

interface CellRendererProps {
  value: any
  showDataTypeColors: boolean
  dateFormat: 'iso' | 'local' | 'relative'
  numberFormat: 'raw' | 'formatted'
}

const CellRenderer = memo(
  ({ value, showDataTypeColors, dateFormat, numberFormat }: CellRendererProps) => {
    if (value === null) {
      return <span className="text-secondary text-xs italic">NULL</span>
    }
    if (typeof value === 'boolean') {
      return (
        <span
          className={
            showDataTypeColors && value
              ? 'text-success'
              : showDataTypeColors
                ? 'text-database'
                : 'text-primary'
          }
        >
          {String(value)}
        </span>
      )
    }
    if (typeof value === 'number') {
      const formatted = numberFormat === 'formatted' ? value.toLocaleString() : String(value)
      return <span className="text-primary">{formatted}</span>
    }
    if (typeof value === 'string') {
      // Check if it's a UUID (format: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx)
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
      if (uuidRegex.test(value)) {
        return (
          <span className={showDataTypeColors ? 'text-data-uuid' : 'text-primary'}>{value}</span>
        )
      }
      // Check if it's hex data (starts with 0x)
      if (value.startsWith('0x')) {
        return (
          <span className={showDataTypeColors ? 'text-data-hex' : 'text-primary'}>{value}</span>
        )
      }
      // Check if it's an ISO date string
      if (value.match(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/)) {
        const date = new Date(value)
        let formattedDate: string

        if (dateFormat === 'iso') {
          formattedDate = value
        } else if (dateFormat === 'relative') {
          const now = new Date()
          const diff = now.getTime() - date.getTime()
          const seconds = Math.floor(diff / 1000)
          const minutes = Math.floor(seconds / 60)
          const hours = Math.floor(minutes / 60)
          const days = Math.floor(hours / 24)

          if (days > 0) formattedDate = `${days} day${days > 1 ? 's' : ''} ago`
          else if (hours > 0) formattedDate = `${hours} hour${hours > 1 ? 's' : ''} ago`
          else if (minutes > 0) formattedDate = `${minutes} minute${minutes > 1 ? 's' : ''} ago`
          else formattedDate = 'just now'
        } else {
          formattedDate = date.toLocaleString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
          })
        }

        return (
          <span className={showDataTypeColors ? 'text-data-date text-xs' : 'text-primary text-xs'}>
            {formattedDate}
          </span>
        )
      }
      // Check if it's a JSON string (starts with { or [)
      if (
        (value.startsWith('{') && value.endsWith('}')) ||
        (value.startsWith('[') && value.endsWith(']'))
      ) {
        try {
          JSON.parse(value) // Validate it's actually JSON
          return (
            <div
              className={`flex items-center gap-2 text-xs ${showDataTypeColors ? 'text-data-json' : 'text-primary'}`}
            >
              <FileJson className="w-3 h-3" />
              <span className="truncate">{value}</span>
            </div>
          )
        } catch {
          // Not valid JSON, treat as regular string
        }
      }
    }
    if (typeof value === 'object') {
      return (
        <div
          className={`flex items-center gap-2 text-xs ${showDataTypeColors ? 'text-data-json' : 'text-primary'}`}
        >
          <FileJson className="w-3 h-3" />
          <span className="truncate">{JSON.stringify(value)}</span>
        </div>
      )
    }
    return <span className="text-primary truncate block">{String(value)}</span>
  }
)
