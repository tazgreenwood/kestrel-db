import React from 'react'
import { Key, ListTree, Hash, Calendar, Check, X, Sparkles, Table } from 'lucide-react'
import type { TableStructure as TableStructureType } from '../../../../preload/index'
import { useAppStore } from '../../store/useAppStore'

interface TableStructureProps {
  structure: TableStructureType
  tableName: string
}

export function TableStructure({ structure, tableName }: TableStructureProps): React.JSX.Element {
  const { columns, indexes } = structure
  const viewMode = useAppStore((state) => state.viewMode)
  const setViewMode = useAppStore((state) => state.setViewMode)

  return (
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
            <span className="text-xs text-tertiary">
              {columns.length} columns • {indexes.length} indexes
            </span>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto custom-scrollbar p-6 space-y-6">
        {/* Columns Section */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <ListTree className="w-4 h-4 text-accent" />
            <h3 className="text-sm font-bold text-primary uppercase tracking-wider">Columns</h3>
          </div>

          <div className="border border-default rounded-lg overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead className="bg-secondary">
                <tr>
                  <th className="px-4 py-3 text-[10px] uppercase text-secondary font-bold tracking-wider border-b border-default">
                    Name
                  </th>
                  <th className="px-4 py-3 text-[10px] uppercase text-secondary font-bold tracking-wider border-b border-default">
                    Type
                  </th>
                  <th className="px-4 py-3 text-[10px] uppercase text-secondary font-bold tracking-wider border-b border-default text-center">
                    Nullable
                  </th>
                  <th className="px-4 py-3 text-[10px] uppercase text-secondary font-bold tracking-wider border-b border-default">
                    Key
                  </th>
                  <th className="px-4 py-3 text-[10px] uppercase text-secondary font-bold tracking-wider border-b border-default">
                    Default
                  </th>
                  <th className="px-4 py-3 text-[10px] uppercase text-secondary font-bold tracking-wider border-b border-default">
                    Extra
                  </th>
                </tr>
              </thead>
              <tbody>
                {columns.map((column, index) => (
                  <tr
                    key={column.name}
                    className={`border-b border-default hover:bg-secondary/50 transition-colors ${
                      index === columns.length - 1 ? 'border-b-0' : ''
                    }`}
                  >
                    <td className="px-4 py-3 font-mono text-sm text-primary">
                      <div className="flex items-center gap-2">
                        {column.name.includes('id') && <Hash className="w-3 h-3 text-tertiary" />}
                        {column.name.includes('_at') && (
                          <Calendar className="w-3 h-3 text-tertiary" />
                        )}
                        {column.name}
                      </div>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-accent">{column.type}</td>
                    <td className="px-4 py-3 text-center">
                      {column.nullable ? (
                        <Check className="w-4 h-4 text-success inline-block" />
                      ) : (
                        <X className="w-4 h-4 text-tertiary inline-block" />
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs">
                      {column.key === 'PRI' && (
                        <span className="px-2 py-0.5 bg-warning-subtle text-database rounded text-[10px] font-bold border border-warning">
                          PRIMARY
                        </span>
                      )}
                      {column.key === 'UNI' && (
                        <span className="px-2 py-0.5 bg-accent-subtle text-accent rounded text-[10px] font-bold border border-accent">
                          UNIQUE
                        </span>
                      )}
                      {column.key === 'MUL' && (
                        <span className="px-2 py-0.5 bg-tertiary text-secondary rounded text-[10px] font-bold">
                          INDEX
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-secondary">
                      {column.default !== null ? (
                        <span className="text-secondary">{column.default}</span>
                      ) : (
                        <span className="italic text-tertiary">NULL</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs text-secondary">
                      {column.extra && (
                        <div className="flex items-center gap-1">
                          {column.extra.includes('auto_increment') && (
                            <Sparkles className="w-3 h-3 text-data-uuid" />
                          )}
                          <span className="text-data-uuid">{column.extra}</span>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Indexes Section */}
        {indexes.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Key className="w-4 h-4 text-database" />
              <h3 className="text-sm font-bold text-primary uppercase tracking-wider">Indexes</h3>
            </div>

            <div className="border border-default rounded-lg overflow-hidden">
              <table className="w-full text-left border-collapse">
                <thead className="bg-secondary">
                  <tr>
                    <th className="px-4 py-3 text-[10px] uppercase text-secondary font-bold tracking-wider border-b border-default">
                      Name
                    </th>
                    <th className="px-4 py-3 text-[10px] uppercase text-secondary font-bold tracking-wider border-b border-default">
                      Column
                    </th>
                    <th className="px-4 py-3 text-[10px] uppercase text-secondary font-bold tracking-wider border-b border-default">
                      Type
                    </th>
                    <th className="px-4 py-3 text-[10px] uppercase text-secondary font-bold tracking-wider border-b border-default text-center">
                      Unique
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {indexes.map((index, idx) => (
                    <tr
                      key={`${index.name}-${idx}`}
                      className={`border-b border-default hover:bg-secondary/50 transition-colors ${
                        idx === indexes.length - 1 ? 'border-b-0' : ''
                      }`}
                    >
                      <td className="px-4 py-3 font-mono text-sm text-primary">
                        {index.primary ? (
                          <span className="text-database font-bold">{index.name}</span>
                        ) : (
                          index.name
                        )}
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-secondary">
                        {index.columnName}
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-accent">{index.type}</td>
                      <td className="px-4 py-3 text-center">
                        {index.unique ? (
                          <Check className="w-4 h-4 text-success inline-block" />
                        ) : (
                          <X className="w-4 h-4 text-tertiary inline-block" />
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
