import React from 'react'
import { X, FileDown, Loader2 } from 'lucide-react'

interface ExportProgressModalProps {
  isOpen: boolean
  progress: number // 0-100
  currentRow: number
  totalRows: number
  format: 'csv' | 'json'
  onCancel: () => void
}

export function ExportProgressModal({
  isOpen,
  progress,
  currentRow,
  totalRows,
  format,
  onCancel
}: ExportProgressModalProps): React.JSX.Element | null {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-overlay backdrop-blur-sm">
      <div className="bg-secondary border border-default rounded-lg shadow-2xl w-[480px] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-default">
          <div className="flex items-center gap-3">
            <FileDown className="w-5 h-5 text-accent" />
            <h2 className="text-lg font-semibold text-primary">
              Exporting as {format.toUpperCase()}
            </h2>
          </div>
          <button
            onClick={onCancel}
            className="text-secondary hover:text-primary transition-colors"
            title="Cancel export"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="px-6 py-6 space-y-4">
          {/* Progress Text */}
          <div className="flex items-center justify-between text-sm">
            <span className="text-secondary">
              Processing row {currentRow.toLocaleString()} of {totalRows.toLocaleString()}
            </span>
            <span className="text-accent font-semibold">{Math.round(progress)}%</span>
          </div>

          {/* Progress Bar */}
          <div className="relative h-2 bg-tertiary rounded-full overflow-hidden">
            <div
              className="absolute inset-y-0 left-0 bg-accent transition-all duration-200 ease-out"
              style={{ width: `${progress}%` }}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
            </div>
          </div>

          {/* Status */}
          <div className="flex items-center gap-2 text-xs text-secondary">
            <Loader2 className="w-3 h-3 animate-spin" />
            <span>Building {format.toUpperCase()} file...</span>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-primary border-t border-default flex justify-end">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-primary hover:text-white bg-tertiary hover:bg-secondary rounded transition-colors"
          >
            Cancel Export
          </button>
        </div>
      </div>

      <style>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        .animate-shimmer {
          animation: shimmer 2s infinite;
        }
      `}</style>
    </div>
  )
}
