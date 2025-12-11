/**
 * Theme Import Modal Component
 *
 * Simple modal with textarea for pasting theme JSON
 */

import { X, Upload, AlertCircle } from 'lucide-react'
import { useState } from 'react'

interface ThemeImportModalProps {
  isOpen: boolean
  onClose: () => void
  onImport: (jsonString: string) => void
}

export function ThemeImportModal({ isOpen, onClose, onImport }: ThemeImportModalProps) {
  const [jsonInput, setJsonInput] = useState('')
  const [error, setError] = useState<string | null>(null)

  const handleImport = () => {
    if (!jsonInput.trim()) {
      setError('Please paste theme JSON')
      return
    }

    try {
      // Basic validation - try to parse
      JSON.parse(jsonInput)
      onImport(jsonInput)
      setJsonInput('')
      setError(null)
    } catch (e) {
      setError('Invalid JSON format')
    }
  }

  const handleClose = () => {
    setJsonInput('')
    setError(null)
    onClose()
  }

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm p-8"
      onClick={handleClose}
    >
      <div
        className="w-full max-w-2xl bg-secondary border border-default rounded-xl shadow-2xl overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-default bg-secondary shrink-0">
          <div className="flex items-center gap-3">
            <Upload className="w-5 h-5 text-accent" />
            <h2 className="text-lg font-semibold text-primary">Import Theme from JSON</h2>
          </div>
          <button
            onClick={handleClose}
            className="p-1.5 hover:bg-tertiary rounded text-secondary hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 p-6">
          <p className="text-sm text-secondary mb-4">
            Paste the theme JSON below. You can get this by copying from a custom theme's "Copy
            JSON" button.
          </p>

          <textarea
            value={jsonInput}
            onChange={(e) => {
              setJsonInput(e.target.value)
              setError(null)
            }}
            placeholder='{"type": "velocity-theme", "version": "1.0.0", "theme": {...}}'
            className="w-full h-64 bg-primary border border-default rounded px-3 py-2 text-sm text-primary font-mono focus:outline-none focus:ring-2 focus:ring-accent resize-none"
          />

          {error && (
            <div className="flex items-center gap-2 mt-3 p-3 bg-error-subtle border border-error rounded">
              <AlertCircle className="w-4 h-4 text-error shrink-0" />
              <span className="text-sm text-error">{error}</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-default bg-secondary shrink-0">
          <button
            onClick={handleClose}
            className="px-4 py-2 text-sm text-secondary hover:text-primary transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleImport}
            className="flex items-center gap-2 px-4 py-2 bg-accent text-white hover:bg-accent-hover rounded text-sm transition-colors"
          >
            <Upload className="w-4 h-4" />
            Import Theme
          </button>
        </div>
      </div>
    </div>
  )
}
