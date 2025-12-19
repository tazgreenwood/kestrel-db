import React, { Component, ReactNode } from 'react'
import { AlertTriangle, RefreshCw, Copy, ChevronDown, ChevronUp } from 'lucide-react'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
  errorInfo: React.ErrorInfo | null
  showDetails: boolean
}

/**
 * Error Boundary Component
 *
 * Catches React errors in the component tree and displays a fallback UI
 * instead of crashing the entire application.
 */
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      showDetails: false
    }
  }

  static getDerivedStateFromError(): Partial<State> {
    // Update state so the next render will show the fallback UI
    return { hasError: true }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    // Log error details for debugging
    console.error('ErrorBoundary caught an error:', error, errorInfo)

    // Update state with error details
    this.setState({
      error,
      errorInfo
    })
  }

  handleReload = (): void => {
    // Reload the Electron window
    window.location.reload()
  }

  handleCopyError = (): void => {
    const { error, errorInfo } = this.state
    if (!error) return

    const errorText = `
Error: ${error.message}

Stack Trace:
${error.stack || 'No stack trace available'}

Component Stack:
${errorInfo?.componentStack || 'No component stack available'}
    `.trim()

    navigator.clipboard.writeText(errorText)
  }

  toggleDetails = (): void => {
    this.setState((prevState) => ({
      showDetails: !prevState.showDetails
    }))
  }

  render(): ReactNode {
    if (this.state.hasError) {
      const { error, errorInfo, showDetails } = this.state

      return (
        <div className="h-screen w-screen flex items-center justify-center bg-primary">
          <div className="max-w-2xl w-full mx-4">
            {/* Error Card */}
            <div className="bg-secondary border border-default rounded-lg shadow-2xl overflow-hidden">
              {/* Header */}
              <div className="bg-error/10 border-b border-error/20 px-6 py-4">
                <div className="flex items-center gap-3">
                  <div className="flex-shrink-0">
                    <AlertTriangle className="w-8 h-8 text-error" />
                  </div>
                  <div>
                    <h1 className="text-xl font-semibold text-primary">Something went wrong</h1>
                    <p className="text-sm text-secondary mt-1">
                      Kestrel encountered an unexpected error
                    </p>
                  </div>
                </div>
              </div>

              {/* Error Message */}
              <div className="px-6 py-4 border-b border-default">
                <div className="bg-error/5 border border-error/20 rounded px-4 py-3">
                  <p className="text-sm font-mono text-error">
                    {error?.message || 'An unknown error occurred'}
                  </p>
                </div>
              </div>

              {/* Actions */}
              <div className="px-6 py-4 space-y-3">
                <div className="flex gap-3">
                  <button
                    onClick={this.handleReload}
                    className="flex-1 flex items-center justify-center gap-2 bg-accent hover:bg-accent/80 text-white px-4 py-2.5 rounded font-medium transition-colors"
                  >
                    <RefreshCw className="w-4 h-4" />
                    <span>Reload Application</span>
                  </button>

                  <button
                    onClick={this.handleCopyError}
                    className="flex items-center justify-center gap-2 bg-tertiary hover:bg-tertiary/80 text-primary px-4 py-2.5 rounded transition-colors"
                    title="Copy error details"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                </div>

                {/* Toggle Details Button */}
                <button
                  onClick={this.toggleDetails}
                  className="w-full flex items-center justify-center gap-2 text-sm text-tertiary hover:text-secondary transition-colors py-2"
                >
                  {showDetails ? (
                    <>
                      <ChevronUp className="w-4 h-4" />
                      <span>Hide Technical Details</span>
                    </>
                  ) : (
                    <>
                      <ChevronDown className="w-4 h-4" />
                      <span>Show Technical Details</span>
                    </>
                  )}
                </button>
              </div>

              {/* Technical Details (Collapsible) */}
              {showDetails && (
                <div className="px-6 py-4 border-t border-default bg-primary">
                  <div className="space-y-4">
                    {/* Stack Trace */}
                    {error?.stack && (
                      <div>
                        <h3 className="text-xs font-semibold text-secondary uppercase tracking-wide mb-2">
                          Stack Trace
                        </h3>
                        <div className="bg-secondary border border-default rounded p-3 max-h-64 overflow-auto custom-scrollbar">
                          <pre className="text-xs font-mono text-tertiary whitespace-pre-wrap">
                            {error.stack}
                          </pre>
                        </div>
                      </div>
                    )}

                    {/* Component Stack */}
                    {errorInfo?.componentStack && (
                      <div>
                        <h3 className="text-xs font-semibold text-secondary uppercase tracking-wide mb-2">
                          Component Stack
                        </h3>
                        <div className="bg-secondary border border-default rounded p-3 max-h-64 overflow-auto custom-scrollbar">
                          <pre className="text-xs font-mono text-tertiary whitespace-pre-wrap">
                            {errorInfo.componentStack}
                          </pre>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Footer */}
              <div className="px-6 py-3 bg-tertiary/30 border-t border-default">
                <p className="text-xs text-tertiary text-center">
                  If this problem persists, please report it at{' '}
                  <a
                    href="https://github.com/tazgreenwood/kestrel-db/issues"
                    className="text-accent hover:underline"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    github.com/tazgreenwood/kestrel-db
                  </a>
                </p>
              </div>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
