import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type ConnectionColor =
  | 'red'
  | 'orange'
  | 'yellow'
  | 'green'
  | 'cyan'
  | 'blue'
  | 'purple'
  | 'pink'
  | 'gray'

export interface SavedConnection {
  id: string // Unique identifier (used as keychain account)
  name: string // User-friendly name
  host: string
  user: string
  port: number
  color?: ConnectionColor // Visual identifier (red=prod, yellow=staging, etc.)
  tags?: string[] // Tags for organizing connections (e.g., "production", "staging", "analytics")
  createdAt?: number
  lastUsed: number
}

interface ConnectionsState {
  connections: SavedConnection[]

  // Actions
  saveConnection: (
    conn: Omit<SavedConnection, 'id' | 'createdAt' | 'lastUsed'>,
    password: string
  ) => Promise<void>
  getConnection: (id: string) => Promise<SavedConnection & { password: string | null }>
  updateConnection: (
    id: string,
    updates: Partial<Omit<SavedConnection, 'id'>>,
    newPassword?: string
  ) => Promise<void>
  deleteConnection: (id: string) => Promise<void>
  listConnections: () => SavedConnection[]
  touchConnection: (id: string) => void // Update lastUsed timestamp
}

export const useConnectionsStore = create<ConnectionsState>()(
  persist(
    (set, get) => ({
      connections: [],

      saveConnection: async (conn, password) => {
        // Generate unique ID from connection details
        const id = `${conn.host}:${conn.port}:${conn.user}`

        // Save password to keychain
        if (password) {
          await window.api.keychain.setPassword(id, password)
        }

        // Check if connection already exists
        const existing = get().connections.find((c) => c.id === id)

        // Save connection metadata
        set((state) => {
          // Remove existing connection with same ID
          const filtered = state.connections.filter((c) => c.id !== id)

          // Add new connection (preserve createdAt if updating)
          const newConnection: SavedConnection = {
            ...conn,
            id,
            createdAt: existing?.createdAt || Date.now(),
            lastUsed: Date.now()
          }

          return {
            connections: [newConnection, ...filtered]
          }
        })
      },

      getConnection: async (id) => {
        const conn = get().connections.find((c) => c.id === id)
        if (!conn) {
          throw new Error('Connection not found')
        }

        // Get password from keychain
        const result = await window.api.keychain.getPassword(id)
        const password = result.success ? result.data || null : null

        return {
          ...conn,
          password
        }
      },

      updateConnection: async (id, updates, newPassword) => {
        // Update password in keychain if provided
        if (newPassword !== undefined) {
          if (newPassword) {
            await window.api.keychain.setPassword(id, newPassword)
          } else {
            await window.api.keychain.deletePassword(id)
          }
        }

        // Update connection metadata
        set((state) => ({
          connections: state.connections.map((c) => (c.id === id ? { ...c, ...updates } : c))
        }))
      },

      deleteConnection: async (id) => {
        // Delete password from keychain
        await window.api.keychain.deletePassword(id)

        // Delete connection metadata
        set((state) => ({
          connections: state.connections.filter((c) => c.id !== id)
        }))
      },

      listConnections: () => {
        return get().connections
      },

      touchConnection: (id) => {
        set((state) => ({
          connections: state.connections.map((c) =>
            c.id === id ? { ...c, lastUsed: Date.now() } : c
          )
        }))
      }
    }),
    {
      name: 'kestrel-connections', // localStorage key
      // Only persist connection metadata, not passwords
      partialize: (state) => ({ connections: state.connections })
    }
  )
)
