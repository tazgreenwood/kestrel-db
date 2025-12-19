import React, { useState, useEffect } from 'react'
import { Loader2, Plus, Edit2, Trash2, Settings, Tag, Search } from 'lucide-react'
import {
  useConnectionsStore,
  type SavedConnection,
  type ConnectionColor
} from '../../store/useConnectionsStore'
import { SaveConnectionModal } from '../modals/SaveConnectionModal'
import { SettingsModal } from '../modals/SettingsModal'
import { Toast } from '../ui/Toast'
import kestrelLogo from '@renderer/assets/kestrel-logo.svg'

interface ConnectionPageProps {
  onSuccess: (
    dbs: string[],
    serverName: string,
    connectionName?: string,
    connectionColor?: ConnectionColor
  ) => void
}

function KestrelBackground(): React.JSX.Element {
  return (
    <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none select-none bg-primary">
      {/* Subtle radial gradient for depth */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,rgba(0,0,0,0.4)_100%)]" />

      {/* Subtle grain texture */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.04] mix-blend-screen bg-repeat bg-[length:200px_200px] bg-[url('data:image/svg+xml,%3Csvg%20xmlns=%27http://www.w3.org/2000/svg%27%20width=%27500%27%20height=%27500%27%3E%3Cfilter%20id=%27noise%27%20x=%270%27%20y=%270%27%3E%3CfeTurbulence%20type=%27fractalNoise%27%20baseFrequency=%270.65%27%20numOctaves=%273%27%20stitchTiles=%27stitch%27/%3E%3CfeBlend%20mode=%27screen%27/%3E%3C/filter%3E%3Crect%20width=%27500%27%20height=%27500%27%20filter=%27url(%23noise)%27%20opacity=%270.5%27/%3E%3C/svg%3E')]" />
    </div>
  )
}

const COLOR_MAP: Record<ConnectionColor, { borderClass: string; dotClass: string; hex: string }> = {
  red: { borderClass: 'border-l-red-500', dotClass: 'bg-red-500', hex: '#ef4444' },
  orange: { borderClass: 'border-l-orange-500', dotClass: 'bg-orange-500', hex: '#f97316' },
  yellow: { borderClass: 'border-l-yellow-500', dotClass: 'bg-yellow-500', hex: '#eab308' },
  green: { borderClass: 'border-l-green-500', dotClass: 'bg-green-500', hex: '#22c55e' },
  cyan: { borderClass: 'border-l-cyan-500', dotClass: 'bg-cyan-500', hex: '#06b6d4' },
  blue: { borderClass: 'border-l-blue-500', dotClass: 'bg-blue-500', hex: '#3b82f6' },
  purple: { borderClass: 'border-l-purple-500', dotClass: 'bg-purple-500', hex: '#a855f7' },
  pink: { borderClass: 'border-l-pink-500', dotClass: 'bg-pink-500', hex: '#ec4899' },
  gray: { borderClass: 'border-l-gray-500', dotClass: 'bg-gray-500', hex: '#6b7280' }
}

export function ConnectionPage({ onSuccess }: ConnectionPageProps): React.JSX.Element {
  const [loading, setLoading] = useState(false)
  const [connectingTo, setConnectingTo] = useState<SavedConnection | null>(null)
  const [showSaveModal, setShowSaveModal] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [editingConnection, setEditingConnection] = useState<SavedConnection | null>(null)
  const [selectedTag, setSelectedTag] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [toastMessage, setToastMessage] = useState<string | null>(null)
  const [toastType, setToastType] = useState<'success' | 'error'>('error')

  // Get all saved connections
  const connections = useConnectionsStore((state) => state.connections)
  const getConnection = useConnectionsStore((state) => state.getConnection)
  const deleteConnection = useConnectionsStore((state) => state.deleteConnection)
  const touchConnection = useConnectionsStore((state) => state.touchConnection)

  const sortedConnections = [...connections].sort((a, b) => b.lastUsed - a.lastUsed)

  // Get all unique tags
  const allTags = Array.from(new Set(connections.flatMap((conn) => conn.tags || []))).sort()

  // Filter connections by selected tag and search query
  const filteredConnections = sortedConnections.filter((conn) => {
    // Filter by tag if selected
    if (selectedTag && !conn.tags?.includes(selectedTag)) {
      return false
    }

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      return (
        conn.name.toLowerCase().includes(query) ||
        conn.host.toLowerCase().includes(query) ||
        conn.user.toLowerCase().includes(query) ||
        conn.tags?.some((tag) => tag.toLowerCase().includes(query))
      )
    }

    return true
  })

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent): void => {
      // Cmd+, : Open settings
      if ((e.metaKey || e.ctrlKey) && e.key === ',') {
        e.preventDefault()
        setShowSettings(true)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  const handleConnect = async (conn: SavedConnection): Promise<void> => {
    setLoading(true)
    setConnectingTo(conn)

    try {
      const fullConn = await getConnection(conn.id)

      const result = await window.api.db.testConnection({
        host: fullConn.host,
        user: fullConn.user,
        password: fullConn.password || '',
        port: fullConn.port
      })

      if (result.success && result.data) {
        touchConnection(conn.id)
        onSuccess(result.data, conn.host, conn.name, conn.color)
      } else {
        setToastMessage(result.error || 'Connection failed')
        setToastType('error')
      }
    } catch (err) {
      setToastMessage(String(err))
      setToastType('error')
    } finally {
      setLoading(false)
      setConnectingTo(null)
    }
  }

  const handleEdit = (conn: SavedConnection, e: React.MouseEvent): void => {
    e.stopPropagation()
    setEditingConnection(conn)
    setShowSaveModal(true)
  }

  const handleDelete = async (id: string, e: React.MouseEvent): Promise<void> => {
    e.stopPropagation()
    if (confirm('Delete this connection?')) {
      await deleteConnection(id)
    }
  }

  const handleNewConnection = (): void => {
    setEditingConnection(null)
    setShowSaveModal(true)
  }

  return (
    <>
      <div className="min-h-screen flex items-center justify-center bg-primary relative">
        {/* Background Layer */}
        <KestrelBackground />

        {/* Drag Region - spans top of window for dragging, leaves space for traffic lights on macOS */}
        <div
          style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}
          className="absolute top-0 left-0 right-0 h-12 z-10 pl-20"
        />

        {/* Settings Button */}
        <button
          onClick={() => setShowSettings(true)}
          style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
          className="absolute top-6 right-6 z-20 p-2 rounded-lg bg-secondary/90 hover:bg-secondary border border-default hover:border-accent transition-all text-secondary hover:text-accent"
          title="Settings (Cmd+,)"
        >
          <Settings className="w-5 h-5" />
        </button>

        {/* Foreground Content */}
        <div className="relative z-10 w-full max-w-4xl px-8 py-12">
          {/* Header */}
          <div className="mb-8 text-center">
            <div className="flex items-end justify-center gap-4 mb-2">
              <img src={kestrelLogo} alt="Kestrel Logo" className="w-20 h-20" />
              <h1 className="text-5xl font-bold text-white tracking-tight mb-2">Kestrel</h1>
            </div>
            <p className="text-secondary text-sm">Precision Data Exploration</p>
          </div>

          {/* Search and Filters */}
          {connections.length > 0 && (
            <div className="mb-4 max-w-3xl mx-auto space-y-3">
              {/* Search Input */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-tertiary" />
                <input
                  type="text"
                  placeholder="Search connections by name, host, user, or tag..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-secondary border border-default rounded-lg text-primary placeholder-tertiary text-sm focus:border-accent focus:outline-none transition-colors"
                />
              </div>

              {/* Tag Filter */}
              {allTags.length > 0 && (
                <div className="flex items-center gap-2 flex-wrap">
                  <Tag className="w-4 h-4 text-tertiary flex-shrink-0" />
                  <button
                    onClick={() => setSelectedTag(null)}
                    className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                      selectedTag === null
                        ? 'bg-accent text-white'
                        : 'bg-secondary/90 text-secondary hover:bg-secondary hover:text-primary border border-default'
                    }`}
                  >
                    All
                  </button>
                  {allTags.map((tag) => (
                    <button
                      key={tag}
                      onClick={() => setSelectedTag(tag)}
                      className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                        selectedTag === tag
                          ? 'bg-accent text-white'
                          : 'bg-secondary/90 text-secondary hover:bg-secondary hover:text-primary border border-default'
                      }`}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Connections List */}
          {connections.length > 0 && (
            <div className="max-h-[60vh] overflow-y-auto custom-scrollbar mb-6 max-w-3xl mx-auto px-1 py-2">
              <div className="space-y-2">
                {filteredConnections.map((conn, index) => {
                  const colors = COLOR_MAP[conn.color || 'gray']
                  const isRecent = index === 0
                  const timeSince = Date.now() - conn.lastUsed
                  const daysAgo = Math.floor(timeSince / (1000 * 60 * 60 * 24))
                  const hoursAgo = Math.floor(timeSince / (1000 * 60 * 60))
                  const minutesAgo = Math.floor(timeSince / (1000 * 60))

                  let timeLabel = ''
                  if (daysAgo > 0) {
                    timeLabel = `${daysAgo}d ago`
                  } else if (hoursAgo > 0) {
                    timeLabel = `${hoursAgo}h ago`
                  } else if (minutesAgo > 0) {
                    timeLabel = `${minutesAgo}m ago`
                  } else {
                    timeLabel = 'Just now'
                  }

                  const isConnecting = loading && connectingTo?.id === conn.id

                  return (
                    <div
                      key={conn.id}
                      onClick={() => !loading && handleConnect(conn)}
                      className="group relative bg-secondary hover:bg-secondary/90 border border-default border-l-4 rounded-lg px-4 py-2.5 cursor-pointer transition-all hover:scale-[1.01]"
                      style={{
                        borderLeftColor: colors.hex,
                        boxShadow: 'none',
                        transition: 'all 0.2s ease-in-out'
                      }}
                      onMouseEnter={(e) => {
                        if (!isConnecting) {
                          e.currentTarget.style.boxShadow = `0 0 20px ${colors.hex}40, 0 4px 6px -1px rgba(0, 0, 0, 0.1)`
                        }
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.boxShadow = 'none'
                      }}
                    >
                      <div className="pr-16">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-2.5 h-2.5 rounded-full ${colors.dotClass} flex-shrink-0`}
                          />
                          <div className="flex-1 min-w-0 flex items-baseline gap-3">
                            <h3 className="text-white font-semibold text-sm truncate">
                              {conn.name}
                            </h3>
                            <span className="text-tertiary text-xs truncate">
                              {conn.user}@{conn.host}:{conn.port}
                            </span>
                            <span className="text-tertiary text-xs flex-shrink-0 ml-auto">
                              {timeLabel}
                            </span>
                          </div>
                          {isRecent && (
                            <div className="px-2 py-0.5 bg-accent/20 border border-accent/30 rounded text-[10px] font-medium text-accent flex-shrink-0">
                              Recent
                            </div>
                          )}
                        </div>
                        {conn.tags && conn.tags.length > 0 && (
                          <div className="flex items-center gap-1.5 mt-2 ml-[18px]">
                            {conn.tags.map((tag) => (
                              <span
                                key={tag}
                                className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-accent/10 border border-accent/20 rounded text-[10px] text-accent"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Action Buttons */}
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 flex gap-1">
                        <button
                          onClick={(e) => handleEdit(conn, e)}
                          className="p-1 bg-primary/90 hover:bg-accent/20 rounded transition-colors"
                          title="Edit"
                        >
                          <Edit2 className="w-3 h-3 text-accent" />
                        </button>
                        <button
                          onClick={(e) => handleDelete(conn.id, e)}
                          className="p-1 bg-primary/90 hover:bg-error/20 rounded transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-3 h-3 text-error" />
                        </button>
                      </div>

                      {/* Loading Overlay */}
                      {isConnecting && (
                        <div className="absolute inset-0 bg-primary/80 backdrop-blur-sm rounded-lg flex items-center justify-center">
                          <div className="flex items-center gap-2 text-accent">
                            <Loader2 className="w-5 h-5 animate-spin" />
                            <span className="text-sm font-medium">Connecting...</span>
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}

                {/* New Connection Button - Only show when there are existing connections */}
                {connections.length > 0 && (
                  <button
                    onClick={handleNewConnection}
                    disabled={loading}
                    className="w-full bg-secondary/90 hover:bg-secondary border-2 border-dashed border-default hover:border-solid hover:border-accent rounded-lg px-4 py-3 transition-all flex items-center justify-center gap-2 group hover:shadow-[0_0_20px_rgba(245,158,11,0.3)] hover:scale-[1.01]"
                  >
                    <div className="w-8 h-8 rounded-full bg-accent/10 group-hover:bg-accent/20 flex items-center justify-center transition-colors">
                      <Plus className="w-4 h-4 text-accent" />
                    </div>
                    <span className="text-sm font-medium text-secondary group-hover:text-accent transition-colors">
                      New Connection
                    </span>
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Empty State */}
          {connections.length === 0 && !loading && (
            <div className="text-center pt-4 pb-12">
              <div className="text-6xl mb-4">🗄️</div>
              <h3 className="text-white text-lg font-semibold mb-2">No Connections Yet</h3>
              <p className="text-secondary text-sm mb-6">
                Create your first connection to get started
              </p>
              <button
                onClick={handleNewConnection}
                className="px-6 py-3 bg-accent hover:bg-accent/90 text-white rounded-lg transition-colors font-medium inline-flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Create Connection
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Save Connection Modal */}
      <SaveConnectionModal
        isOpen={showSaveModal}
        onClose={() => {
          setShowSaveModal(false)
          setEditingConnection(null)
        }}
        editConnection={editingConnection}
      />

      {/* Settings Modal */}
      <SettingsModal isOpen={showSettings} onClose={() => setShowSettings(false)} />

      {/* Toast */}
      {toastMessage && (
        <Toast message={toastMessage} type={toastType} onClose={() => setToastMessage(null)} />
      )}
    </>
  )
}
