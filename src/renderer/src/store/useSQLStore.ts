import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { QueryExecutionResult } from '../../../preload/index'

export interface QueryHistoryItem {
  id: string
  query: string
  executedAt: number
  executionTime: number
  rowCount: number
  error?: string
}

export interface SavedQuery {
  id: string
  name: string
  query: string
  createdAt: number
  tags?: string[]
}

interface SQLState {
  // Drawer state
  drawerOpen: boolean
  drawerWidth: number

  // Current query
  currentQuery: string

  // Query results
  lastResult: QueryExecutionResult | null
  lastError: string | null
  isExecuting: boolean

  // History (last 10 queries)
  queryHistory: QueryHistoryItem[]

  // Saved queries
  savedQueries: SavedQuery[]

  // Actions
  toggleDrawer: () => void
  openDrawer: () => void
  closeDrawer: () => void
  setDrawerWidth: (width: number) => void

  setCurrentQuery: (query: string) => void

  setExecuting: (executing: boolean) => void
  setLastResult: (result: QueryExecutionResult | null) => void
  setLastError: (error: string | null) => void

  addToHistory: (item: Omit<QueryHistoryItem, 'id'>) => void
  loadFromHistory: (id: string) => void
  clearHistory: () => void

  saveQuery: (name: string, query: string, tags?: string[]) => void
  loadSavedQuery: (id: string) => void
  deleteSavedQuery: (id: string) => void
  updateSavedQuery: (id: string, updates: Partial<Omit<SavedQuery, 'id'>>) => void
}

export const useSQLStore = create<SQLState>()(
  persist(
    (set, get) => ({
      // Initial state
      drawerOpen: false,
      drawerWidth: 400,
      currentQuery: '',
      lastResult: null,
      lastError: null,
      isExecuting: false,
      queryHistory: [],
      savedQueries: [],

      // Drawer actions
      toggleDrawer: () => set((state) => ({ drawerOpen: !state.drawerOpen })),
      openDrawer: () => set({ drawerOpen: true }),
      closeDrawer: () => set({ drawerOpen: false }),
      setDrawerWidth: (width) => set({ drawerWidth: Math.max(300, Math.min(600, width)) }),

      // Query actions
      setCurrentQuery: (query) => set({ currentQuery: query }),

      // Execution actions
      setExecuting: (executing) => set({ isExecuting: executing }),
      setLastResult: (result) => set({ lastResult: result, lastError: null }),
      setLastError: (error) => set({ lastError: error, lastResult: null }),

      // History actions
      addToHistory: (item) => {
        const id = Date.now().toString()
        set((state) => ({
          queryHistory: [
            { ...item, id },
            ...state.queryHistory.slice(0, 9) // Keep only last 10
          ]
        }))
      },

      loadFromHistory: (id) => {
        const item = get().queryHistory.find((h) => h.id === id)
        if (item) {
          set({ currentQuery: item.query })
        }
      },

      clearHistory: () => set({ queryHistory: [] }),

      // Saved queries actions
      saveQuery: (name, query, tags) => {
        const id = Date.now().toString()
        set((state) => ({
          savedQueries: [
            ...state.savedQueries,
            {
              id,
              name,
              query,
              createdAt: Date.now(),
              tags
            }
          ]
        }))
      },

      loadSavedQuery: (id) => {
        const query = get().savedQueries.find((q) => q.id === id)
        if (query) {
          set({ currentQuery: query.query })
        }
      },

      deleteSavedQuery: (id) => {
        set((state) => ({
          savedQueries: state.savedQueries.filter((q) => q.id !== id)
        }))
      },

      updateSavedQuery: (id, updates) => {
        set((state) => ({
          savedQueries: state.savedQueries.map((q) => (q.id === id ? { ...q, ...updates } : q))
        }))
      }
    }),
    {
      name: 'kestrel-sql-storage',
      // Don't persist execution state
      partialize: (state) => ({
        drawerWidth: state.drawerWidth,
        queryHistory: state.queryHistory,
        savedQueries: state.savedQueries
      })
    }
  )
)
