import { useState, useEffect, useRef } from 'react'
import { Layout } from './components/layout/Layout'
import { Header } from './components/layout/Header'
import { CommandPalette } from './components/layout/CommandPalette'
import { ConnectionPage } from './components/pages/ConnectionPage'
import { SettingsModal } from './components/modals/SettingsModal'
import { OnboardingModal } from './components/onboarding/OnboardingModal'
import { TableViewer } from './components/data/TableViewer'
import { SQLDrawer } from './components/sql/SQLDrawer'
import { Toast } from './components/ui/Toast'
import { useAppStore } from './store/useAppStore'
import { useSQLStore } from './store/useSQLStore'
import { useSettingsStore } from './store/useSettingsStore'
import { ThemeProvider } from './theme'
import type { ConnectionColor } from './store/useConnectionsStore'
import { getModifierKey } from './utils/platform'

function App(): React.JSX.Element {
  // Use granular selectors to prevent unnecessary re-renders
  const serverName = useAppStore((state) => state.serverName)
  const currentDb = useAppStore((state) => state.currentDb)
  const activeTable = useAppStore((state) => state.activeTable)
  const tableData = useAppStore((state) => state.tableData)
  const isLoading = useAppStore((state) => state.isLoading)
  const setConnection = useAppStore((state) => state.setConnection)
  const commandPaletteOpen = useAppStore((state) => state.commandPaletteOpen)
  const openCommandPalette = useAppStore((state) => state.openCommandPalette)
  const closeCommandPalette = useAppStore((state) => state.closeCommandPalette)
  const selectTable = useAppStore((state) => state.selectTable)
  const viewMode = useAppStore((state) => state.viewMode)
  const setViewMode = useAppStore((state) => state.setViewMode)
  const setShowToast = useAppStore((state) => state.setShowToast)

  const hasCompletedOnboarding = useSettingsStore((state) => state.hasCompletedOnboarding)
  const setOnboardingCompleted = useSettingsStore((state) => state.setOnboardingCompleted)

  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [showOnboarding, setShowOnboarding] = useState(false)
  const [toastMessage, setToastMessage] = useState<string | null>(null)
  const [toastType, setToastType] = useState<'success' | 'error'>('success')
  const [showingSQLResults, setShowingSQLResults] = useState(false)

  const drawerOpen = useSQLStore((state) => state.drawerOpen)
  const lastResult = useSQLStore((state) => state.lastResult)
  const openDrawer = useSQLStore((state) => state.openDrawer)
  const closeDrawer = useSQLStore((state) => state.closeDrawer)

  // Track previous command palette state to detect transitions
  const prevCommandPaletteOpen = useRef(commandPaletteOpen)

  // Set toast callback in store for error notifications
  useEffect(() => {
    setShowToast((message: string, type?: 'success' | 'error') => {
      setToastMessage(message)
      setToastType(type || 'success')
    })
  }, [setShowToast])

  // Show onboarding on first run
  useEffect(() => {
    if (!hasCompletedOnboarding) {
      // Small delay to let the app render first
      const timer = setTimeout(() => {
        setShowOnboarding(true)
      }, 500)
      return () => clearTimeout(timer)
    }
    return undefined
  }, [hasCompletedOnboarding])

  const handleOnboardingComplete = (): void => {
    setShowOnboarding(false)
    setOnboardingCompleted()
  }

  // Reset SQL results when switching tables or re-selecting the same table
  useEffect(() => {
    if (activeTable) {
      setShowingSQLResults(false)
    }
  }, [activeTable])

  // Reset when command palette transitions from open to closed with a table selected
  // (handles re-selecting the same table)
  useEffect(() => {
    const wasOpen = prevCommandPaletteOpen.current
    const isNowClosed = !commandPaletteOpen

    if (wasOpen && isNowClosed && activeTable && showingSQLResults) {
      setShowingSQLResults(false)
    }

    // Update ref for next render
    prevCommandPaletteOpen.current = commandPaletteOpen
  }, [commandPaletteOpen, activeTable, showingSQLResults])

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent): void => {
      // Don't handle shortcuts if user is typing in an input/textarea
      const target = e.target as HTMLElement
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
        return
      }

      // Escape: Close SQL drawer (only close, don't toggle)
      if (e.key === 'Escape' && drawerOpen) {
        e.preventDefault()
        closeDrawer()
        return
      }

      // Check if Monaco editor has focus (be specific - only the editor itself)
      const activeElement = document.activeElement as HTMLElement
      const isInMonaco = activeElement?.closest('.monaco-editor') !== null

      // Don't handle non-Cmd shortcuts if user is typing in Monaco editor
      // (Allow Cmd+ shortcuts to work, but block single-key shortcuts like hjkl)
      if (isInMonaco && !e.metaKey && !e.ctrlKey) {
        return
      }

      // Cmd+K: Toggle command palette
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        if (commandPaletteOpen) {
          closeCommandPalette()
        } else {
          openCommandPalette()
        }
      }

      // Cmd+, : Open settings
      if ((e.metaKey || e.ctrlKey) && e.key === ',') {
        e.preventDefault()
        setIsSettingsOpen(true)
      }

      // Cmd+R: Refresh current table
      if ((e.metaKey || e.ctrlKey) && e.key === 'r' && activeTable) {
        e.preventDefault()
        selectTable(activeTable)
      }

      // Cmd+E: Export (open command palette with '/export' action)
      if ((e.metaKey || e.ctrlKey) && e.key === 'e' && activeTable) {
        e.preventDefault()
        openCommandPalette('/export')
      }

      // Cmd+T: Toggle between Data and Structure view
      if ((e.metaKey || e.ctrlKey) && e.key === 't' && activeTable) {
        e.preventDefault()
        setViewMode(viewMode === 'data' ? 'structure' : 'data')
      }

      // Cmd+/: Open SQL drawer (when closed)
      if ((e.metaKey || e.ctrlKey) && e.key === '/' && !drawerOpen) {
        e.preventDefault()
        openDrawer()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [
    commandPaletteOpen,
    openCommandPalette,
    closeCommandPalette,
    activeTable,
    selectTable,
    viewMode,
    setViewMode,
    drawerOpen,
    openDrawer,
    closeDrawer
  ])

  const handleOpenPalette = (): void => {
    openCommandPalette()
  }

  const handleOpenSettings = (): void => {
    setIsSettingsOpen(true)
  }

  const handleConnectionSuccess = (
    databases: string[],
    host: string,
    connectionName?: string,
    connectionColor?: ConnectionColor
  ): void => {
    setConnection(host, 'root', databases, connectionName, connectionColor)
    openCommandPalette() // Open palette to select a database
  }

  const handleShowToast = (message: string, type: 'success' | 'error' = 'success'): void => {
    setToastMessage(message)
    setToastType(type)
  }

  const handleOpenSQLEditor = (): void => {
    openDrawer()
  }

  return (
    <ThemeProvider>
      {/* If no connection, show ConnectionPage */}
      {!serverName ? (
        <ConnectionPage onSuccess={handleConnectionSuccess} />
      ) : (
        // Otherwise show main app
        <Layout>
          <Header
            serverName={serverName}
            dbName={currentDb}
            onOpenPalette={handleOpenPalette}
            onOpenSettings={handleOpenSettings}
            onOpenSQLEditor={handleOpenSQLEditor}
            onShowToast={handleShowToast}
          />

          <main className="flex-1 flex relative overflow-hidden">
            {/* Main content area */}
            <div className="flex-1 flex flex-col relative overflow-hidden">
              {showingSQLResults && lastResult ? (
                <TableViewer
                  data={lastResult.data}
                  tableName="Custom Query"
                  isLoading={false}
                  totalRows={lastResult.rowCount}
                  hasMore={false}
                />
              ) : activeTable ? (
                <TableViewer data={tableData} tableName={activeTable} isLoading={isLoading} />
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-tertiary">
                  <div className="text-center space-y-4">
                    <h2 className="text-xl font-medium text-secondary">
                      {currentDb
                        ? `Connected to ${currentDb}`
                        : serverName
                          ? 'Select a Database'
                          : 'No Connection'}
                    </h2>
                    <p className="text-sm">
                      Press{' '}
                      <span className="text-primary bg-tertiary px-1.5 py-0.5 rounded border border-default font-mono mx-1">
                        {getModifierKey()} + K
                      </span>{' '}
                      to {currentDb ? 'search tables' : 'select a database'}
                    </p>
                    {currentDb && (
                      <p className="text-xs text-tertiary mt-2">
                        Tip: Type &gt; in the palette to switch databases or {getModifierKey()}+/
                        for SQL editor
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* SQL Drawer - on the right */}
            {drawerOpen && <SQLDrawer onResultsChange={setShowingSQLResults} />}

            <CommandPalette
              isOpen={commandPaletteOpen}
              onClose={closeCommandPalette}
              onShowToast={handleShowToast}
            />
            <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />

            {/* Global Toast */}
            {toastMessage && (
              <Toast
                message={toastMessage}
                type={toastType}
                onClose={() => setToastMessage(null)}
              />
            )}
          </main>
        </Layout>
      )}

      {/* Onboarding Modal - shown at top level */}
      <OnboardingModal isOpen={showOnboarding} onComplete={handleOnboardingComplete} />
    </ThemeProvider>
  )
}

export default App
