import React, { useState, useEffect } from 'react'
import { DataGrid } from './DataGrid'
import { TableStructure } from './TableStructure'
import { useAppStore } from '../../store/useAppStore'
import type { TableStructure as TableStructureType } from '../../../../preload/index'
import { ListTree, Key } from 'lucide-react'

interface TableViewerProps {
  data: Record<string, unknown>[]
  tableName: string
  isLoading?: boolean
  totalRows?: number // Override totalRows from store (for custom queries)
  hasMore?: boolean // Override hasMore from store (for custom queries)
}

export function TableViewer({
  data,
  tableName,
  isLoading,
  totalRows,
  hasMore
}: TableViewerProps): React.JSX.Element {
  const viewMode = useAppStore((state) => state.viewMode)
  const [structure, setStructure] = useState<TableStructureType | null>(null)
  const [isLoadingStructure, setIsLoadingStructure] = useState(false)

  // Fetch structure when switching to structure view
  useEffect(() => {
    if (viewMode === 'structure' && !structure) {
      setIsLoadingStructure(true)
      window.api.db
        .getTableStructure(tableName)
        .then((result) => {
          if (result.success && result.data) {
            setStructure(result.data)
          } else {
            console.error('Failed to fetch table structure:', result.error)
          }
        })
        .finally(() => setIsLoadingStructure(false))
    }
  }, [viewMode, tableName, structure])

  // Reset structure when table changes
  useEffect(() => {
    setStructure(null)
  }, [tableName])

  return (
    <div className="h-full w-full flex flex-col">
      {viewMode === 'data' ? (
        <DataGrid
          data={data}
          tableName={tableName}
          isLoading={isLoading}
          totalRows={totalRows}
          hasMore={hasMore}
        />
      ) : isLoadingStructure ? (
        <div className="h-full w-full flex flex-col bg-primary animate-pulse">
          {/* Skeleton Toolbar */}
          <div className="h-14 border-b border-default bg-secondary/50 flex items-center px-6 justify-between shrink-0">
            <div className="flex items-center gap-4">
              {/* View Mode Buttons Skeleton */}
              <div className="flex items-center gap-1">
                <div className="h-8 w-16 bg-tertiary rounded"></div>
                <div className="h-8 w-20 bg-accent-subtle rounded border border-accent"></div>
              </div>

              <div className="h-6 w-px bg-border-default"></div>

              {/* Table Info Skeleton */}
              <div className="flex items-center gap-3">
                <div className="h-4 w-32 bg-tertiary rounded"></div>
                <div className="h-3 w-40 bg-tertiary/50 rounded"></div>
              </div>
            </div>
          </div>

          {/* Content Skeleton */}
          <div className="flex-1 overflow-auto p-6 space-y-6">
            {/* Columns Section Skeleton */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <ListTree className="w-4 h-4 text-accent/50" />
                <div className="h-4 w-20 bg-tertiary rounded"></div>
              </div>

              <div className="border border-default rounded-lg overflow-hidden">
                <div className="bg-secondary p-4">
                  <div className="flex gap-4">
                    <div className="h-3 w-16 bg-tertiary rounded"></div>
                    <div className="h-3 w-16 bg-tertiary rounded"></div>
                    <div className="h-3 w-20 bg-tertiary rounded"></div>
                    <div className="h-3 w-12 bg-tertiary rounded"></div>
                    <div className="h-3 w-16 bg-tertiary rounded"></div>
                    <div className="h-3 w-12 bg-tertiary rounded"></div>
                  </div>
                </div>
                <div className="space-y-0">
                  {[...Array(8)].map((_, i) => (
                    <div key={i} className="p-4 border-b border-default last:border-b-0">
                      <div className="flex gap-4">
                        <div className="h-4 w-32 bg-tertiary rounded"></div>
                        <div className="h-4 w-24 bg-accent-subtle rounded"></div>
                        <div className="h-4 w-4 bg-tertiary rounded"></div>
                        <div className="h-4 w-20 bg-tertiary rounded"></div>
                        <div className="h-4 w-16 bg-tertiary/50 rounded"></div>
                        <div className="h-4 w-24 bg-tertiary/50 rounded"></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Indexes Section Skeleton */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Key className="w-4 h-4 text-database/50" />
                <div className="h-4 w-20 bg-tertiary rounded"></div>
              </div>

              <div className="border border-default rounded-lg overflow-hidden">
                <div className="bg-secondary p-4">
                  <div className="flex gap-4">
                    <div className="h-3 w-16 bg-tertiary rounded"></div>
                    <div className="h-3 w-20 bg-tertiary rounded"></div>
                    <div className="h-3 w-12 bg-tertiary rounded"></div>
                    <div className="h-3 w-16 bg-tertiary rounded"></div>
                  </div>
                </div>
                <div className="space-y-0">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="p-4 border-b border-default last:border-b-0">
                      <div className="flex gap-4">
                        <div className="h-4 w-24 bg-tertiary rounded"></div>
                        <div className="h-4 w-32 bg-tertiary/50 rounded"></div>
                        <div className="h-4 w-16 bg-accent-subtle rounded"></div>
                        <div className="h-4 w-4 bg-tertiary rounded"></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : structure ? (
        <TableStructure structure={structure} tableName={tableName} />
      ) : (
        <div className="h-full w-full flex items-center justify-center">
          <div className="text-tertiary">Failed to load structure</div>
        </div>
      )}
    </div>
  )
}
