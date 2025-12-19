import React, { useState, useEffect } from 'react'
import { X, Copy, Check } from 'lucide-react'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { atomDark } from 'react-syntax-highlighter/dist/esm/styles/prism'

interface CellDetailModalProps {
  value: unknown
  onClose: () => void
}

export function CellDetailModal({ value, onClose }: CellDetailModalProps): React.JSX.Element {
  const [copied, setCopied] = useState(false)

  // ESC key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') {
        onClose()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  // Determine if it is JSON
  let isJson = false
  let displayValue = String(value)

  if (typeof value === 'object' && value !== null) {
    isJson = true
    displayValue = JSON.stringify(value, null, 2)
  } else {
    // Try to parse string as JSON just in case it's a JSON string in the DB
    try {
      const parsed = JSON.parse(String(value))
      if (typeof parsed === 'object' && parsed !== null) {
        displayValue = JSON.stringify(parsed, null, 2)
        isJson = true
      }
    } catch {
      // Not JSON, that's fine
    }
  }

  const handleCopy = (): void => {
    navigator.clipboard.writeText(displayValue)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  // Calculate dynamic sizing based on content length
  const contentLength = displayValue.length
  const isShort = contentLength < 100
  const isMedium = contentLength < 500

  const heightClass = isShort ? 'max-h-[40vh]' : isMedium ? 'max-h-[60vh]' : 'max-h-[80vh]'

  const widthClass = isShort ? 'max-w-lg' : isMedium ? 'max-w-2xl' : 'max-w-4xl'

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-overlay backdrop-blur-sm p-8"
      onClick={onClose}
    >
      <div
        className={`w-full ${widthClass} bg-secondary border border-default rounded-xl shadow-2xl overflow-hidden flex flex-col ${heightClass}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-default bg-secondary shrink-0">
          <span className="text-xs font-bold text-secondary uppercase tracking-wider">
            {isJson ? 'JSON View' : 'Text Content'}
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="p-1.5 hover:bg-tertiary rounded text-secondary hover:text-white transition-colors"
            >
              {copied ? <Check className="w-4 h-4 text-success" /> : <Copy className="w-4 h-4" />}
            </button>
            <button
              onClick={onClose}
              className="p-1.5 hover:bg-tertiary rounded text-secondary hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-auto bg-primary custom-scrollbar">
          {isJson ? (
            <SyntaxHighlighter
              language="json"
              style={atomDark}
              customStyle={{
                margin: 0,
                padding: '1.5rem',
                background: 'var(--bg-primary)',
                fontSize: 'var(--font-size-data)',
                fontFamily: 'var(--font-family-data)'
              }}
            >
              {displayValue}
            </SyntaxHighlighter>
          ) : (
            <div className="p-6 font-mono text-sm text-primary whitespace-pre-wrap break-all">
              {displayValue}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
