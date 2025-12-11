import { useEffect } from 'react'
import { Check, AlertCircle } from 'lucide-react'

interface ToastProps {
  message: string
  onClose: () => void
  duration?: number
  type?: 'success' | 'error'
}

export function Toast({ message, onClose, duration = 2000, type = 'success' }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose()
    }, duration)

    return () => clearTimeout(timer)
  }, [duration, onClose])

  const isError = type === 'error'

  return (
    <div className="fixed bottom-6 right-6 z-50 animate-in fade-in slide-in-from-bottom-2 duration-200">
      <div className="flex items-center gap-2 px-4 py-3 bg-secondary border border-default rounded-lg shadow-xl">
        <div
          className={`flex items-center justify-center w-5 h-5 rounded-full ${
            isError ? 'bg-error-subtle' : 'bg-success-subtle'
          }`}
        >
          {isError ? (
            <AlertCircle className="w-3 h-3 text-error" />
          ) : (
            <Check className="w-3 h-3 text-success" />
          )}
        </div>
        <span className="text-sm text-primary">{message}</span>
      </div>
    </div>
  )
}
