/**
 * Import Preview Modal Component
 *
 * Shows a preview of settings that will be imported with validation warnings/errors
 */

import React from 'react'
import { X, CheckCircle2, AlertTriangle, XCircle } from 'lucide-react'
import type { ImportValidationResult } from '../../store/useSettingsStore'

interface ImportPreviewModalProps {
  isOpen: boolean
  validationResult: ImportValidationResult
  onClose: () => void
  onConfirm: () => void
}

export function ImportPreviewModal({
  isOpen,
  validationResult,
  onClose,
  onConfirm
}: ImportPreviewModalProps): React.JSX.Element | null {
  if (!isOpen) return null

  const { isValid, settings, warnings, errors } = validationResult

  // Format setting value for display
  const formatValue = (key: string, value: unknown): string => {
    if (typeof value === 'boolean') return value ? 'Enabled' : 'Disabled'
    if (typeof value === 'number') {
      if (key === 'fontSize') return `${value}px`
      if (key === 'uiScale') return `${value}%`
      if (key === 'defaultChunkSize') return value.toLocaleString()
      if (key === 'queryTimeout') return value === 0 ? 'No limit' : `${value}s`
      return String(value)
    }
    if (typeof value === 'string') return value
    if (typeof value === 'object' && value !== null) return JSON.stringify(value, null, 2)
    return String(value)
  }

  // Format setting key for display
  const formatKey = (key: string): string => {
    return key
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, (str) => str.toUpperCase())
      .trim()
  }

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm p-8"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl bg-secondary border border-default rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-default bg-secondary shrink-0">
          <h2 className="text-lg font-semibold text-primary">Import Settings Preview</h2>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-tertiary rounded text-secondary hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto custom-scrollbar p-6">
          {/* Errors */}
          {errors.length > 0 && (
            <div className="mb-4 p-4 bg-error-subtle border border-error rounded-lg">
              <div className="flex items-start gap-2">
                <XCircle className="w-5 h-5 text-error shrink-0 mt-0.5" />
                <div className="flex-1">
                  <h3 className="text-sm font-semibold text-error mb-2">Errors</h3>
                  <ul className="text-sm text-error space-y-1">
                    {errors.map((error, i) => (
                      <li key={i}>• {error}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Warnings */}
          {warnings.length > 0 && (
            <div className="mb-4 p-4 bg-warning-subtle border border-warning rounded-lg">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-5 h-5 text-warning shrink-0 mt-0.5" />
                <div className="flex-1">
                  <h3 className="text-sm font-semibold text-warning mb-2">Warnings</h3>
                  <ul className="text-sm text-warning space-y-1">
                    {warnings.map((warning, i) => (
                      <li key={i}>• {warning}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Valid Settings */}
          {isValid && settings && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 mb-4">
                <CheckCircle2 className="w-5 h-5 text-success" />
                <h3 className="text-sm font-semibold text-primary">
                  Settings to Import ({Object.keys(settings).length})
                </h3>
              </div>

              <div className="space-y-2">
                {Object.entries(settings).map(([key, value]) => (
                  <div
                    key={key}
                    className="flex items-start justify-between p-3 bg-primary rounded border border-subtle"
                  >
                    <span className="text-sm text-secondary font-medium">{formatKey(key)}</span>
                    <span className="text-sm text-primary font-mono ml-4">
                      {formatValue(key, value)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* No valid settings */}
          {!isValid && (
            <div className="text-center py-8">
              <XCircle className="w-12 h-12 text-error mx-auto mb-3" />
              <p className="text-secondary">
                No valid settings found. Please check the file and try again.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-default bg-secondary shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-secondary hover:text-primary transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={!isValid}
            className={`px-4 py-2 rounded text-sm font-medium transition-colors ${
              isValid
                ? 'bg-accent text-white hover:bg-accent-hover'
                : 'bg-tertiary text-tertiary cursor-not-allowed'
            }`}
          >
            Import Settings
          </button>
        </div>
      </div>
    </div>
  )
}
