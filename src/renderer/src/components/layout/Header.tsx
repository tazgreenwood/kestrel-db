import React, { useState, useRef, useEffect } from 'react'
import { ChevronRight, Search, Command, X, Settings, ChevronDown, Code2 } from 'lucide-react'
import { useAppStore } from '../../store/useAppStore'
import { useConnectionsStore } from '../../store/useConnectionsStore'
import type { ConnectionColor } from '../../store/useConnectionsStore'

interface HeaderProps {
  serverName?: string | null
  dbName?: string | null
  onOpenPalette: () => void
  onOpenSettings: () => void
  onOpenSQLEditor: () => void
  onShowToast?: (message: string, type?: 'success' | 'error') => void
}

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

export function Header({
  serverName,
  dbName,
  onOpenPalette,
  onOpenSettings,
  onOpenSQLEditor,
  onShowToast
}: HeaderProps): React.JSX.Element {
  const disconnect = useAppStore((state) => state.disconnect)
  const connectionName = useAppStore((state) => state.connectionName)
  const connectionColor = useAppStore((state) => state.connectionColor)
  const setConnection = useAppStore((state) => state.setConnection)

  const connections = useConnectionsStore((state) => state.connections)
  const getConnection = useConnectionsStore((state) => state.getConnection)
  const touchConnection = useConnectionsStore((state) => state.touchConnection)

  const [showConnectionDropdown, setShowConnectionDropdown] = useState(false)
  const [switchingConnection, setSwitchingConnection] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    if (!showConnectionDropdown) return

    const handleClickOutside = (event: MouseEvent): void => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowConnectionDropdown(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [showConnectionDropdown])

  // Handle switching to a different connection
  const handleSwitchConnection = async (connectionId: string): Promise<void> => {
    if (switchingConnection) return

    setSwitchingConnection(true)
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
        setShowConnectionDropdown(false)
        // Open command palette to select a database
        onOpenPalette()
      } else {
        onShowToast?.(`Connection failed: ${result.error || 'Unknown error'}`, 'error')
      }
    } catch (err) {
      onShowToast?.(`Failed to switch connection: ${String(err)}`, 'error')
    } finally {
      setSwitchingConnection(false)
    }
  }

  const sortedConnections = [...connections].sort((a, b) => b.lastUsed - a.lastUsed)

  return (
    <header
      style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}
      className="h-12 bg-primary border-b border-default flex items-center justify-between pr-4 pl-20 select-none pt-2"
    >
      {/* Left: Breadcrumb Navigation */}
      <div
        style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
        className="flex items-center text-sm gap-2"
      >
        {/* Connection Breadcrumb */}
        {serverName && (
          <>
            <div className="flex items-center gap-2">
              <div className="relative" ref={dropdownRef}>
                {/* Clickable connection name */}
                <button
                  onClick={() => setShowConnectionDropdown(!showConnectionDropdown)}
                  className="flex items-center gap-2 px-2 py-1 rounded hover:bg-tertiary border border-transparent hover:border-default transition-all group cursor-pointer"
                >
                  {/* Show colored dot if connection has a color */}
                  {connectionColor && (
                    <div className={`w-2 h-2 rounded-full ${COLOR_MAP[connectionColor]}`} />
                  )}
                  {/* Show connection name if available, otherwise show server name */}
                  <span className="text-secondary group-hover:text-primary font-medium transition-colors">
                    {connectionName || serverName}
                  </span>
                  <ChevronDown className="w-3 h-3 text-tertiary group-hover:text-primary transition-colors" />
                </button>

                {/* Connection Switcher Dropdown */}
                {showConnectionDropdown && (
                  <div className="absolute top-full left-0 mt-1 w-64 bg-secondary border border-default rounded-lg shadow-2xl z-50 overflow-hidden">
                    {sortedConnections.length > 0 && (
                      <>
                        <div className="px-3 py-2 border-b border-default">
                          <span className="text-xs font-medium text-tertiary">
                            Switch Connection
                          </span>
                        </div>
                        <div className="max-h-64 overflow-y-auto custom-scrollbar">
                          {sortedConnections.map((conn) => {
                            const isActive =
                              connectionName === conn.name || serverName === conn.host
                            const dotColor = COLOR_MAP[conn.color || 'gray']

                            return (
                              <button
                                key={conn.id}
                                onClick={() => handleSwitchConnection(conn.id)}
                                disabled={switchingConnection || isActive}
                                className={`w-full flex items-center gap-2 px-3 py-2 text-left transition-colors ${
                                  isActive
                                    ? 'bg-accent/10 cursor-default'
                                    : 'hover:bg-tertiary cursor-pointer'
                                } ${switchingConnection ? 'opacity-50 cursor-wait' : ''}`}
                              >
                                <div className={`w-2 h-2 rounded-full ${dotColor}`} />
                                <div className="flex-1 min-w-0">
                                  <div className="text-sm font-medium text-primary truncate">
                                    {conn.name}
                                  </div>
                                  <div className="text-xs text-tertiary truncate">
                                    {conn.user}@{conn.host}:{conn.port}
                                  </div>
                                </div>
                                {isActive && <div className="text-xs text-accent">Active</div>}
                              </button>
                            )
                          })}
                        </div>
                      </>
                    )}

                    {/* Disconnect button */}
                    <div className={sortedConnections.length > 0 ? 'border-t border-default' : ''}>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          if (confirm('Disconnect from server?')) {
                            disconnect()
                            setShowConnectionDropdown(false)
                          }
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2 text-left text-error hover:bg-error/20 hover:text-red-300 transition-all cursor-pointer group"
                      >
                        <X className="w-4 h-4 group-hover:scale-110 transition-transform" />
                        <span className="text-sm font-medium">Disconnect</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {dbName && (
                <>
                  <ChevronRight className="w-4 h-4 text-tertiary" />
                  <span className="text-database font-medium">{dbName}</span>
                </>
              )}
            </div>
          </>
        )}
      </div>

      {/* Right: Actions */}
      <div
        style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
        className="flex items-center gap-3"
      >
        <button
          onClick={onOpenPalette}
          className="flex items-center gap-2 bg-secondary hover:bg-tertiary border border-default text-secondary hover:text-primary px-2 py-1 rounded text-xs transition-colors"
        >
          <Search className="w-3 h-3" />
          <span>Search</span>
          <div className="flex items-center gap-0.5 text-tertiary bg-primary border border-default px-1 rounded">
            <Command className="w-2 h-2" />
            <span>K</span>
          </div>
        </button>

        <button
          onClick={onOpenSQLEditor}
          className="flex items-center gap-2 bg-secondary hover:bg-tertiary border border-default text-secondary hover:text-primary p-1.5 rounded transition-colors"
          title="SQL Editor (⌘/)"
        >
          <Code2 className="w-4 h-4" />
        </button>

        <button
          onClick={onOpenSettings}
          className="flex items-center gap-2 bg-secondary hover:bg-tertiary border border-default text-secondary hover:text-primary p-1.5 rounded transition-colors"
          title="Settings (⌘,)"
        >
          <Settings className="w-4 h-4" />
        </button>
      </div>
    </header>
  )
}
