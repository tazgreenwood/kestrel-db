import { useState, useRef, useEffect } from 'react'
import Editor, { loader } from '@monaco-editor/react'
import {
  Play,
  Save,
  X,
  Clock,
  BarChart3,
  ChevronDown,
  ChevronRight,
  History,
  Star
} from 'lucide-react'
import { useSQLStore } from '../../store/useSQLStore'
import { useAppStore } from '../../store/useAppStore'
import { useSettingsStore } from '../../store/useSettingsStore'
import type { editor } from 'monaco-editor'
import type { ColumnInfo } from '../../../../preload/index'
import type { Theme } from '../../theme/types'
import * as monaco from 'monaco-editor'

// Configure Monaco to use local files instead of CDN
loader.config({ monaco })

/**
 * Convert hex color to Monaco-compatible format (without #)
 */
function toMonacoColor(hex: string): string {
  return hex.replace('#', '')
}

/**
 * Create a Monaco theme from a Kestrel theme
 */
function createMonacoTheme(theme: Theme): monaco.editor.IStandaloneThemeData {
  const { colors } = theme

  return {
    base: theme.isDark ? 'vs-dark' : 'vs',
    inherit: true,
    rules: [
      // SQL Keywords (SELECT, FROM, WHERE, etc.)
      { token: 'keyword.sql', foreground: toMonacoColor(colors.accent.primary), fontStyle: 'bold' },
      { token: 'keyword', foreground: toMonacoColor(colors.accent.primary) },

      // Strings
      { token: 'string.sql', foreground: toMonacoColor(colors.semantic.success) },
      { token: 'string', foreground: toMonacoColor(colors.semantic.success) },

      // Numbers
      { token: 'number', foreground: toMonacoColor(colors.dataTypes.hex) },

      // Comments
      { token: 'comment', foreground: toMonacoColor(colors.text.tertiary), fontStyle: 'italic' },

      // Operators
      { token: 'operator.sql', foreground: toMonacoColor(colors.text.secondary) },
      { token: 'delimiter.sql', foreground: toMonacoColor(colors.text.secondary) },

      // Identifiers (table/column names)
      { token: 'identifier', foreground: toMonacoColor(colors.text.primary) },

      // Types
      { token: 'type', foreground: toMonacoColor(colors.dataTypes.date) },

      // Functions
      { token: 'predefined.sql', foreground: toMonacoColor(colors.accent.hover) }
    ],
    colors: {
      // Editor background and foreground
      'editor.background': colors.background.primary,
      'editor.foreground': colors.text.primary,

      // Line numbers
      'editorLineNumber.foreground': colors.text.tertiary,
      'editorLineNumber.activeForeground': colors.text.secondary,

      // Cursor
      'editorCursor.foreground': colors.accent.primary,

      // Selection
      'editor.selectionBackground': colors.accent.subtle,
      'editor.inactiveSelectionBackground': colors.background.tertiary,

      // Line highlight
      'editor.lineHighlightBackground': colors.background.secondary,
      'editor.lineHighlightBorder': colors.border.subtle,

      // Brackets
      'editorBracketMatch.background': colors.accent.subtle,
      'editorBracketMatch.border': colors.accent.primary,

      // Gutter
      'editorGutter.background': colors.background.primary,

      // Scrollbar
      'scrollbarSlider.background': colors.special.scrollbar,
      'scrollbarSlider.hoverBackground': colors.special.scrollbarHover,
      'scrollbarSlider.activeBackground': colors.accent.primary,

      // Widget (autocomplete)
      'editorWidget.background': colors.background.elevated,
      'editorWidget.border': colors.border.default,
      'editorSuggestWidget.background': colors.background.elevated,
      'editorSuggestWidget.border': colors.border.default,
      'editorSuggestWidget.foreground': colors.text.primary,
      'editorSuggestWidget.selectedBackground': colors.accent.subtle,
      'editorSuggestWidget.highlightForeground': colors.accent.primary,

      // Hover widget
      'editorHoverWidget.background': colors.background.elevated,
      'editorHoverWidget.border': colors.border.default,

      // Find/replace
      'editor.findMatchBackground': colors.accent.subtle,
      'editor.findMatchHighlightBackground': colors.accent.subtle + '80',

      // Whitespace
      'editorWhitespace.foreground': colors.border.subtle
    }
  }
}

interface SQLDrawerProps {
  onResultsChange: (hasResults: boolean) => void
}

export function SQLDrawer({ onResultsChange }: SQLDrawerProps) {
  const drawerOpen = useSQLStore((state) => state.drawerOpen)
  const drawerWidth = useSQLStore((state) => state.drawerWidth)
  const currentQuery = useSQLStore((state) => state.currentQuery)
  const lastResult = useSQLStore((state) => state.lastResult)
  const lastError = useSQLStore((state) => state.lastError)
  const isExecuting = useSQLStore((state) => state.isExecuting)
  const queryHistory = useSQLStore((state) => state.queryHistory)
  const savedQueries = useSQLStore((state) => state.savedQueries)

  const setCurrentQuery = useSQLStore((state) => state.setCurrentQuery)
  const setExecuting = useSQLStore((state) => state.setExecuting)
  const setLastResult = useSQLStore((state) => state.setLastResult)
  const setLastError = useSQLStore((state) => state.setLastError)
  const addToHistory = useSQLStore((state) => state.addToHistory)
  const loadFromHistory = useSQLStore((state) => state.loadFromHistory)
  const saveQuery = useSQLStore((state) => state.saveQuery)
  const loadSavedQuery = useSQLStore((state) => state.loadSavedQuery)
  const deleteSavedQuery = useSQLStore((state) => state.deleteSavedQuery)
  const setDrawerWidth = useSQLStore((state) => state.setDrawerWidth)
  const closeDrawer = useSQLStore((state) => state.closeDrawer)

  const showToast = useAppStore((state) => state.showToast)
  const tables = useAppStore((state) => state.tables)
  const currentDb = useAppStore((state) => state.currentDb)

  const getCurrentTheme = useSettingsStore((state) => state.getCurrentTheme)
  const activeTheme = useSettingsStore((state) => state.activeTheme)
  const fontSize = useSettingsStore((state) => state.fontSize)
  const fontFamily = useSettingsStore((state) => state.fontFamily)

  const [historyExpanded, setHistoryExpanded] = useState(false)
  const [savedExpanded, setSavedExpanded] = useState(false)
  const [showSaveModal, setShowSaveModal] = useState(false)
  const [saveQueryName, setSaveQueryName] = useState('')
  const [tableSchemas, setTableSchemas] = useState<Map<string, ColumnInfo[]>>(new Map())
  const [monacoThemeName, setMonacoThemeName] = useState<string>('kestrel-theme')

  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null)
  const resizerRef = useRef<HTMLDivElement>(null)
  const [isResizing, setIsResizing] = useState(false)
  const completionProviderRef = useRef<monaco.IDisposable | null>(null)

  // Handle editor mount
  const handleEditorMount = (editor: editor.IStandaloneCodeEditor) => {
    editorRef.current = editor

    // Add Cmd+Enter keyboard shortcut to execute query
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, () => {
      handleExecuteQuery()
    })

    // Add Cmd+S keyboard shortcut to save query
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
      handleSaveQuery()
    })
  }

  // Execute query
  const handleExecuteQuery = async () => {
    // Get query from editor if available (for Cmd+Enter), otherwise use state
    const query = editorRef.current ? editorRef.current.getValue().trim() : currentQuery.trim()
    if (!query) {
      showToast?.('Query cannot be empty', 'error')
      return
    }

    setExecuting(true)
    setLastError(null)
    setLastResult(null)

    try {
      const result = await window.api.db.executeQuery(query, 30)

      if (result.success && result.data) {
        setLastResult(result.data)
        onResultsChange(true)

        // Add to history
        addToHistory({
          query,
          executedAt: Date.now(),
          executionTime: result.data.executionTime,
          rowCount: result.data.rowCount
        })

        showToast?.(
          `Query executed successfully: ${result.data.rowCount} rows in ${result.data.executionTime.toFixed(3)}s`,
          'success'
        )
      } else {
        setLastError(result.error || 'Unknown error')
        onResultsChange(false)
        showToast?.(result.error || 'Query execution failed', 'error')

        // Add error to history
        addToHistory({
          query,
          executedAt: Date.now(),
          executionTime: 0,
          rowCount: 0,
          error: result.error
        })
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      setLastError(errorMessage)
      onResultsChange(false)
      showToast?.(errorMessage, 'error')
    } finally {
      setExecuting(false)
    }
  }

  // Save query modal
  const handleSaveQuery = () => {
    if (!currentQuery.trim()) {
      showToast?.('Query cannot be empty', 'error')
      return
    }
    setShowSaveModal(true)
  }

  const handleConfirmSave = () => {
    if (!saveQueryName.trim()) {
      showToast?.('Query name cannot be empty', 'error')
      return
    }

    saveQuery(saveQueryName.trim(), currentQuery)
    showToast?.(`Query "${saveQueryName}" saved`, 'success')
    setShowSaveModal(false)
    setSaveQueryName('')
  }

  // Define and apply Monaco theme when app theme changes
  useEffect(() => {
    const theme = getCurrentTheme()
    const themeName = `kestrel-${activeTheme}`

    // Define the theme
    monaco.editor.defineTheme(themeName, createMonacoTheme(theme))

    // Apply it to the editor if it's already mounted
    if (editorRef.current) {
      monaco.editor.setTheme(themeName)
    }

    setMonacoThemeName(themeName)
  }, [activeTheme, getCurrentTheme])

  // Fetch table schemas for autocomplete when drawer opens or database changes
  useEffect(() => {
    if (!drawerOpen || !currentDb || tables.length === 0) return

    const fetchSchemas = async () => {
      const schemas = new Map<string, ColumnInfo[]>()

      // Fetch columns for all tables in parallel
      const promises = tables.map(async (table) => {
        try {
          const result = await window.api.db.getTableColumns(table.name)
          if (result.success && result.data) {
            schemas.set(table.name, result.data)
          }
        } catch (error) {
          console.warn(`Failed to fetch columns for ${table.name}:`, error)
        }
      })

      await Promise.all(promises)
      setTableSchemas(schemas)
    }

    fetchSchemas()
  }, [drawerOpen, currentDb, tables])

  // Register Monaco autocomplete provider
  useEffect(() => {
    if (!editorRef.current) return

    // Dispose previous provider if it exists
    if (completionProviderRef.current) {
      completionProviderRef.current.dispose()
    }

    // Common SQL keywords
    const SQL_KEYWORDS = [
      'SELECT',
      'FROM',
      'WHERE',
      'JOIN',
      'LEFT',
      'RIGHT',
      'INNER',
      'OUTER',
      'ON',
      'AND',
      'OR',
      'NOT',
      'IN',
      'LIKE',
      'BETWEEN',
      'IS',
      'NULL',
      'AS',
      'GROUP BY',
      'HAVING',
      'ORDER BY',
      'ASC',
      'DESC',
      'LIMIT',
      'OFFSET',
      'INSERT',
      'INTO',
      'VALUES',
      'UPDATE',
      'SET',
      'DELETE',
      'CREATE',
      'ALTER',
      'DROP',
      'TABLE',
      'INDEX',
      'VIEW',
      'DISTINCT',
      'COUNT',
      'SUM',
      'AVG',
      'MIN',
      'MAX',
      'CASE',
      'WHEN',
      'THEN',
      'ELSE',
      'END',
      'UNION',
      'ALL',
      'EXISTS',
      'ANY',
      'CROSS',
      'NATURAL'
    ]

    // Register new completion provider
    const provider = monaco.languages.registerCompletionItemProvider('sql', {
      provideCompletionItems: (model, position) => {
        const suggestions: monaco.languages.CompletionItem[] = []

        const word = model.getWordUntilPosition(position)
        const range = {
          startLineNumber: position.lineNumber,
          endLineNumber: position.lineNumber,
          startColumn: word.startColumn,
          endColumn: word.endColumn
        }

        // SQL Keywords
        SQL_KEYWORDS.forEach((keyword) => {
          suggestions.push({
            label: keyword,
            kind: monaco.languages.CompletionItemKind.Keyword,
            detail: 'SQL Keyword',
            insertText: keyword,
            range: range,
            sortText: `0_${keyword}` // Sort keywords first
          })
        })

        // Table name suggestions
        tables.forEach((table) => {
          suggestions.push({
            label: table.name,
            kind: monaco.languages.CompletionItemKind.Class,
            detail: `Table (${table.rows.toLocaleString()} rows)`,
            insertText: table.name,
            range: range,
            sortText: `1_${table.name}`
          })
        })

        // Column suggestions for all tables
        tableSchemas.forEach((columns, tableName) => {
          columns.forEach((column) => {
            suggestions.push({
              label: `${tableName}.${column.name}`,
              kind: monaco.languages.CompletionItemKind.Field,
              detail: `${column.type}${column.key === 'PRI' ? ' (Primary Key)' : ''}`,
              insertText: `${tableName}.${column.name}`,
              range: range,
              sortText: `2_${tableName}.${column.name}` // Sort after table names
            })

            // Also suggest just the column name
            suggestions.push({
              label: column.name,
              kind: monaco.languages.CompletionItemKind.Field,
              detail: `${tableName}.${column.type}`,
              insertText: column.name,
              range: range,
              sortText: `3_${column.name}` // Sort after qualified names
            })
          })
        })

        return { suggestions }
      }
    })

    completionProviderRef.current = provider

    // Cleanup on unmount
    return () => {
      if (completionProviderRef.current) {
        completionProviderRef.current.dispose()
        completionProviderRef.current = null
      }
    }
  }, [tables, tableSchemas])

  // Focus editor when drawer opens
  useEffect(() => {
    if (!drawerOpen || !editorRef.current) return

    // Longer delay to ensure editor is fully rendered and mounted
    const timer = setTimeout(() => {
      if (editorRef.current) {
        editorRef.current.focus()
      }
    }, 200)

    return () => clearTimeout(timer)
  }, [drawerOpen])

  // Resize handling
  useEffect(() => {
    if (!isResizing) return

    const handleMouseMove = (e: MouseEvent) => {
      // For right-side drawer, calculate width from right edge
      const newWidth = window.innerWidth - e.clientX
      setDrawerWidth(newWidth)
    }

    const handleMouseUp = () => {
      setIsResizing(false)
    }

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)

    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isResizing, setDrawerWidth])

  if (!drawerOpen) return null

  return (
    <>
      <div
        className="relative bg-secondary border-l border-default flex flex-col"
        style={{ width: drawerWidth, minWidth: 300, maxWidth: 600 }}
      >
        {/* Header */}
        <div className="shrink-0 px-4 py-3 border-b border-default flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="text-sm font-semibold text-primary">SQL Editor</div>
          </div>
          <button
            onClick={closeDrawer}
            className="p-1 hover:bg-tertiary rounded transition-colors text-tertiary hover:text-primary"
            title="Close (Esc)"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Monaco Editor */}
        <div className="flex-1 min-h-0">
          <Editor
            height="100%"
            defaultLanguage="sql"
            value={currentQuery}
            onChange={(value) => setCurrentQuery(value || '')}
            onMount={handleEditorMount}
            theme={monacoThemeName}
            options={{
              minimap: { enabled: false },
              fontSize: fontSize,
              fontFamily: fontFamily,
              lineNumbers: 'on',
              scrollBeyondLastLine: false,
              automaticLayout: true,
              tabSize: 2,
              wordWrap: 'on',
              lineHeight: fontSize * 1.5 // Good line height ratio
            }}
          />
        </div>

        {/* Actions */}
        <div className="shrink-0 p-3 border-t border-default space-y-2">
          <button
            onClick={handleExecuteQuery}
            disabled={isExecuting || !currentQuery.trim()}
            className="w-full flex items-center justify-center gap-2 bg-accent hover:bg-accent/80 disabled:bg-accent/50 text-white px-3 py-2 rounded text-sm font-medium transition-colors disabled:cursor-not-allowed"
          >
            {isExecuting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Executing...</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4" />
                <span>Execute Query</span>
                <span className="text-xs opacity-70">⌘↵</span>
              </>
            )}
          </button>

          <button
            onClick={handleSaveQuery}
            disabled={!currentQuery.trim()}
            className="w-full flex items-center justify-center gap-2 bg-tertiary hover:bg-tertiary/80 disabled:bg-tertiary/50 text-primary px-3 py-2 rounded text-sm transition-colors disabled:cursor-not-allowed"
          >
            <Save className="w-4 h-4" />
            <span>Save Query</span>
            <span className="text-xs text-tertiary">⌘S</span>
          </button>
        </div>

        {/* Query Info */}
        {(lastResult || lastError) && (
          <div className="shrink-0 px-4 py-3 border-t border-default bg-primary">
            {lastResult && (
              <div className="space-y-1.5 text-xs">
                <div className="flex items-center gap-2 text-secondary">
                  <Clock className="w-3.5 h-3.5" />
                  <span>Execution: {lastResult.executionTime.toFixed(3)}s</span>
                </div>
                <div className="flex items-center gap-2 text-secondary">
                  <BarChart3 className="w-3.5 h-3.5" />
                  <span>
                    Rows: {lastResult.rowCount.toLocaleString()}
                    {lastResult.rowCount >= 1000 && ' (limited to 1000)'}
                  </span>
                </div>
              </div>
            )}
            {lastError && (
              <div className="text-xs text-error">
                <div className="font-medium mb-1">Error:</div>
                <div className="opacity-90">{lastError}</div>
              </div>
            )}
          </div>
        )}

        {/* History */}
        <div className="shrink-0 border-t border-default">
          <button
            onClick={() => setHistoryExpanded(!historyExpanded)}
            className="w-full px-4 py-2 flex items-center gap-2 hover:bg-tertiary transition-colors text-left"
          >
            {historyExpanded ? (
              <ChevronDown className="w-4 h-4 text-tertiary" />
            ) : (
              <ChevronRight className="w-4 h-4 text-tertiary" />
            )}
            <History className="w-4 h-4 text-tertiary" />
            <span className="text-sm font-medium text-secondary">
              History ({queryHistory.length})
            </span>
          </button>

          {historyExpanded && (
            <div className="max-h-48 overflow-y-auto custom-scrollbar">
              {queryHistory.length === 0 ? (
                <div className="px-4 py-3 text-xs text-tertiary text-center">No query history</div>
              ) : (
                <div className="space-y-1 px-2 pb-2">
                  {queryHistory.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => loadFromHistory(item.id)}
                      className="w-full text-left px-2 py-1.5 rounded hover:bg-tertiary transition-colors group"
                    >
                      <div className="text-xs text-primary font-mono truncate group-hover:text-accent transition-colors">
                        {item.query.split('\n')[0]}
                      </div>
                      <div className="text-xs text-tertiary mt-0.5">
                        {item.error ? (
                          <span className="text-error">Error</span>
                        ) : (
                          <>
                            {item.rowCount} rows • {item.executionTime.toFixed(2)}s
                          </>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Saved Queries */}
        <div className="shrink-0 border-t border-default">
          <button
            onClick={() => setSavedExpanded(!savedExpanded)}
            className="w-full px-4 py-2 flex items-center gap-2 hover:bg-tertiary transition-colors text-left"
          >
            {savedExpanded ? (
              <ChevronDown className="w-4 h-4 text-tertiary" />
            ) : (
              <ChevronRight className="w-4 h-4 text-tertiary" />
            )}
            <Star className="w-4 h-4 text-tertiary" />
            <span className="text-sm font-medium text-secondary">
              Saved ({savedQueries.length})
            </span>
          </button>

          {savedExpanded && (
            <div className="max-h-48 overflow-y-auto custom-scrollbar">
              {savedQueries.length === 0 ? (
                <div className="px-4 py-3 text-xs text-tertiary text-center">No saved queries</div>
              ) : (
                <div className="space-y-1 px-2 pb-2">
                  {savedQueries.map((query) => (
                    <div
                      key={query.id}
                      className="flex items-center gap-1 px-2 py-1.5 rounded hover:bg-tertiary transition-colors group"
                    >
                      <button
                        onClick={() => loadSavedQuery(query.id)}
                        className="flex-1 text-left min-w-0"
                      >
                        <div className="text-xs text-primary font-medium truncate group-hover:text-accent transition-colors">
                          {query.name}
                        </div>
                        <div className="text-xs text-tertiary font-mono truncate">
                          {query.query.split('\n')[0]}
                        </div>
                      </button>
                      <button
                        onClick={() => deleteSavedQuery(query.id)}
                        className="p-1 opacity-0 group-hover:opacity-100 hover:bg-error/20 hover:text-error rounded transition-all"
                        title="Delete query"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Resize handle */}
        <div
          ref={resizerRef}
          onMouseDown={() => setIsResizing(true)}
          className="absolute top-0 left-0 w-1 h-full cursor-col-resize hover:bg-accent/50 transition-colors"
          style={{ transform: 'translateX(-50%)' }}
        />
      </div>

      {/* Save Query Modal */}
      {showSaveModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
          onClick={() => setShowSaveModal(false)}
        >
          <div
            className="bg-secondary border border-default rounded-lg p-6 w-96 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold text-primary mb-4">Save Query</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-secondary mb-1.5">
                  Query Name
                </label>
                <input
                  type="text"
                  value={saveQueryName}
                  onChange={(e) => setSaveQueryName(e.target.value)}
                  placeholder="e.g., Active Users Report"
                  className="w-full px-3 py-2 bg-primary border border-default rounded text-primary placeholder-tertiary text-sm focus:border-accent focus:outline-none"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleConfirmSave()
                    if (e.key === 'Escape') setShowSaveModal(false)
                  }}
                />
              </div>

              <div className="flex gap-2 justify-end">
                <button
                  onClick={() => setShowSaveModal(false)}
                  className="px-4 py-2 bg-tertiary hover:bg-tertiary/80 text-primary rounded text-sm transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmSave}
                  disabled={!saveQueryName.trim()}
                  className="px-4 py-2 bg-accent hover:bg-accent/80 disabled:bg-accent/50 text-white rounded text-sm transition-colors disabled:cursor-not-allowed"
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
